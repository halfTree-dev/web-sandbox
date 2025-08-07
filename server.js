const express = require('express');
const path = require('path');
const expressWs = require('express-ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const bcrypt = require('bcrypt');

const { Level, TPS } = require('./scripts/level');
const { PLAYER_WIDTH, PLAYER_HEIGHT, Player } = require('./scripts/player');
const { Item, itemProperties } = require('./scripts/item');

const interval = 1000 / TPS;

const webSocketsDic = {};
const playersIDDic = {};
const playersDic = {};

// Web 应用主体
const app = express();
expressWs(app);

app.use(express.static(path.join(__dirname, 'static')));

app.get('/info', (req, res) => {
    const timestamp = Date.now();
    res.json({ timestamp, levels, webSocketsDic, playersDic });
});

const playersDir = path.join(__dirname, 'archive', 'players');

async function handleLogin(parsedMessage, clientID) {
    const ws = webSocketsDic[clientID];
    const { username, password } = parsedMessage;
    const playerFile = path.join(playersDir, `${username}.json`);

    if (fs.existsSync(playerFile)) {
        const playerData = JSON.parse(fs.readFileSync(playerFile, 'utf-8'));
        const isMatch = await bcrypt.compare(password, playerData.password);

        if (isMatch) {
            playersIDDic[clientID] = username;
            ws.send(JSON.stringify({ type: 'login_callback', success: true }));
        } else {
            ws.send(JSON.stringify({ type: 'login_callback', success: false, reason: '密码错误' }));
        }
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPlayerData = { username, password: hashedPassword };
        fs.writeFileSync(playerFile, JSON.stringify(newPlayerData));
        playersIDDic[clientID] = username;
        ws.send(JSON.stringify({ type: 'login_callback', success: true }));
    }
}

async function handleServerInfo(parsedMessage, clientID) {
    const ws = webSocketsDic[clientID];
    ws.send(JSON.stringify({
        type: 'server_info',
        player_count: Object.keys(webSocketsDic).length,
        level_list: Object.values(levels).map(level => ({
            id: level.id,
            name: level.name,
            player_count: Object.keys(level.playerController.players).length
        }))
    }));
}

async function handleJoinLevel(parsedMessage, clientID) {
    const ws = webSocketsDic[clientID];
    const levelID = parsedMessage.id;
    const level = levels[levelID];
    if (level) {
        if (playersDic[clientID]) {
            ws.send(JSON.stringify({ type: 'error', message: '你已经在一个关卡中，无法加入另一个关卡。' }));
        } else {
            const userID = playersIDDic[clientID] || `Player-${clientID}`;
            // 玩家加入处理
            let playerFound = false;
            for (const [playerID, player] of Object.entries(level.playerController.players)) {
                if (player.name === userID) {
                    level.playerController.changePlayerID(playerID, clientID);
                    playersDic[clientID] = player;
                    player.online = true;
                    ws.send(JSON.stringify({ type: 'join_level_callback', success: true, info: '欢迎再次进入' }));
                    player.enqueueAction({ type: 'global_sync' });
                    playerFound = true;
                    break;
                }
            }
            if (!playerFound) {
                const player = new Player(clientID, userID, 0, 0);
                playersDic[clientID] = player;
                level.playerController.addPlayer(player);
                player.addItem(new Item("brick", 256));
                player.addItem(new Item("deleter", 1));
                player.online = true;
                ws.send(JSON.stringify({ type: 'join_level_callback', success: true, info: '欢迎首次进入' }));
                player.enqueueAction({ type: 'global_sync' });
            }
        }
    } else {
        ws.send(JSON.stringify({ type: 'join_level_callback', success: false, info: '关卡不存在' }));
    }
}

async function handleLeaveLevel(parsedMessage, clientID) {
    const ws = webSocketsDic[clientID];
    const player = playersDic[clientID];
    if (player) {
        player.setPlayerOffline();
    }
    delete playersDic[clientID];
}

async function sendMessageToPlayer(parsedMessage, clientID) {
    const ws = webSocketsDic[clientID];
    const player = playersDic[clientID];
    if (player) {
        player.enqueueAction(parsedMessage);
    }
}

app.ws('/', (ws, req) => {
    const clientID = uuidv4();
    webSocketsDic[clientID] = ws;
    console.log('与客户端建立了 WebSocket 连接: ', clientID);

    ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'login') {
                await handleLogin(parsedMessage, clientID);
            }
            else if (parsedMessage.type === 'server_info') {
                await handleServerInfo(parsedMessage, clientID);
            }
            else if (parsedMessage.type === 'join_level') {
                await handleJoinLevel(parsedMessage, clientID);
            }
            else if (parsedMessage.type === 'leave_level') {
                await handleLeaveLevel(parsedMessage, clientID);
            }
            else {
                await sendMessageToPlayer(parsedMessage, clientID);
            }
        } catch (error) {
            console.error('处理登录请求时出错:', error);
        }
    });

    ws.on('close', () => {
        delete webSocketsDic[clientID];
        delete playersDic[clientID];
        delete playersIDDic[clientID];
        console.log('WebSocket 连接已关闭: ', clientID);
    });
});

const PORT = 3000;
const server = app.listen(PORT, () => {
console.log(`Server is running on http://localhost:${PORT}`);
});


// 游戏关卡服务
const levels = {};

const configPath = path.join(__dirname, 'server-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

config.worlds.forEach(worldName => {
    const level = new Level(worldName);
    level.start();
    levels[level.id] = level;
});

let updateInterval = setInterval(() => {
    for (const key in levels) {
        if (levels.hasOwnProperty(key)) {
            levels[key].update(webSocketsDic);
        }
    }
}, interval);

// 监听服务器关闭事件
process.on('SIGINT', () => {
    clearInterval(updateInterval);
    for (const key in levels) {
        if (levels.hasOwnProperty(key)) {
            levels[key].stop();
        }
    }
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});