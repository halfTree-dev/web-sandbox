const Map = require('./map');
const PlayerController = require('./playerController');
const { Item, itemProperties } = require('./item');
const { CHUNK_WIDTH, CHUNK_HEIGHT, Chunk } = require('./chunk');
const { PLAYER_WIDTH, PLAYER_HEIGHT, Player } = require('./player');
const { Block, blockProperties } = require('./block');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const TPS = 30;
const SAVE_INTERVAL = 120;

class Level {
    constructor(name) {
        this.id = uuidv4();
        this.name = name;
        this.map = new Map();
        this.playerController = new PlayerController();

        this.currSaveCountdown = SAVE_INTERVAL;
    }

    // 开始关卡
    start() {
        this.map = new Map();
        this.playerController = new PlayerController();
        console.log(`${this.name} 开始了！`);
        this.loadLevel(this.name);
    }

    handleChatAction(player, playerIDList, webSocketsDic, action) {
        const playerName = player.name || `Player-${player.id}`;
        const message = {
            type: "chat",
            player_name: playerName,
            content: action.content || "",
        };
        for (const id of playerIDList) {
            if (webSocketsDic[id] && this.playerController.players[id].online) {
                webSocketsDic[id].send(JSON.stringify(message));
            }
        }
    }

    handleGlobalSyncAction(playerIDList, webSocketsDic) {
        for (const id of playerIDList) {
            const globalSyncMessage = {
                type: "global_sync",
                player_id: id,
                id: this.id,
                name: this.name,
                map: this.map,
                players: this.playerController.players
            };
            if (webSocketsDic[id] && this.playerController.players[id].online) {
                console.log(`发送全局同步消息给玩家 ${id}`);
                webSocketsDic[id].send(JSON.stringify(globalSyncMessage));
            }
        }
    }

    handleKeyboardAction(player, playerIDList, webSocketsDic, action) {
        if (["w", "a", "s", "d"].includes(action.key)) {
            player.keyStates[action.key] = action.down;
        } else if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(action.key)) {
            const index = action.key === "0" ? 9 : action.key - "1";
            if (action.down) {
                player.selectIndex = index;
                for (const id of playerIDList) {
                    if (webSocketsDic[id] && this.playerController.players[id].online) {
                        webSocketsDic[id].send(JSON.stringify({
                            type: "update_player",
                            player: {
                                id: player.id,
                                selectIndex: player.selectIndex
                            }
                        }));
                    }
                }
            }
        }
    }

    handleMouseAction(player, playerIDList, webSocketsDic, action) {
        if (action.button === 0) {
            player.leftInteract = action.down;
        } else if (action.button === 2) {
            player.rightInteract = action.down;
        } else if (action.button === 3) {
            if (action.direction === "up") {
                player.selectIndex = (player.selectIndex - 1 + player.selectBarRange) % player.selectBarRange;
            } else if (action.direction === "down") {
                player.selectIndex = (player.selectIndex + 1) % player.selectBarRange;
            }
            for (const id of playerIDList) {
                if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
                webSocketsDic[id].send(JSON.stringify({
                    type: "update_player",
                    player: {
                        id: player.id,
                        selectIndex: player.selectIndex
                    }
                }));
            }
        }
    }

    handlePlayerMovement(player, playerIDList, webSocketsDic) {
        const currPlayerPos = {"x": player.x, "y": player.y};
        const targetPlayerPos = player.getMoveDestination();
        if (currPlayerPos.x === targetPlayerPos.x && currPlayerPos.y === targetPlayerPos.y) { return; }
        let finalPlayerX = player.x; let finalPlayerY = player.y;
        if (!this.checkPlayerCollision(targetPlayerPos)) {
            finalPlayerX = targetPlayerPos.x; finalPlayerY = targetPlayerPos.y;
        }
        else if (!this.checkPlayerCollision({"x": targetPlayerPos.x, "y": currPlayerPos.y})) {
            finalPlayerX = targetPlayerPos.x; finalPlayerY = currPlayerPos.y;
        }
        else if (!this.checkPlayerCollision({"x": currPlayerPos.x, "y": targetPlayerPos.y})) {
            finalPlayerX = currPlayerPos.x; finalPlayerY = targetPlayerPos.y;
        }
        else {
            finalPlayerX = currPlayerPos.x; finalPlayerY = currPlayerPos.y;
            return;
        }
        player.x = finalPlayerX;
        player.y = finalPlayerY;
        for (const id of playerIDList) {
            if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
            webSocketsDic[id].send(JSON.stringify({
                type: "update_player",
                player: {
                    id: player.id,
                    x: Number(player.x.toFixed(1)),
                    y: Number(player.y.toFixed(1))
                }
            }));
        }
    }

    checkPlayerCollision(targetPlayerPos) {
        const halfW = PLAYER_WIDTH / 2;
        const halfH = PLAYER_HEIGHT / 2;
        let blocked = false;
        const samplePoints = [
            { x: targetPlayerPos.x - halfW, y: targetPlayerPos.y - halfH },
            { x: targetPlayerPos.x + halfW, y: targetPlayerPos.y - halfH },
            { x: targetPlayerPos.x - halfW, y: targetPlayerPos.y + halfH },
            { x: targetPlayerPos.x + halfW, y: targetPlayerPos.y + halfH },
            { x: targetPlayerPos.x, y: targetPlayerPos.y }
        ];
        for (const pt of samplePoints) {
            const tile = this.map.getMouseAimingTile(pt.x, pt.y);
            if (tile && tile.upperBlock && tile.upperBlock.hasCollisionBox) {
                blocked = true;
                break;
            }
        }
        return blocked;
    }

    handleBlockDigging(player, playerIDList, webSocketsDic) {
        const item = player.inventory[player.selectIndex];
        if (item && player.leftInteract) {
            const itemProperty = itemProperties[item.name];
            if (itemProperty && itemProperty.dig) {
                const digInfo = itemProperty.dig;
                const power = digInfo.power || 0;

                const mouseTile = this.map.getMouseAimingTile(player.mousePosX, player.mousePosY);
                if (mouseTile && mouseTile.upperBlock) {
                    mouseTile.upperBlock.integrity = (mouseTile.upperBlock.integrity - power / TPS).toFixed(1);
                    if (mouseTile.upperBlock.integrity <= 0) {
                        mouseTile.upperBlock = null;
                    }

                    const aimingChunk = this.map.getMouseAimingChunk(player.mousePosX, player.mousePosY);
                    for (const id of playerIDList) {
                        if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
                        webSocketsDic[id].send(JSON.stringify({
                            type: "update_tile",
                            chunkX: aimingChunk.x,
                            chunkY: aimingChunk.y,
                            tile: mouseTile
                        }));
                    }
                }
            }
        }
    }

    handleBlockPlacement(player, playerIDList, webSocketsDic) {
        const item = player.inventory[player.selectIndex];
        if (item && player.rightInteract) {
            const itemProperty = itemProperties[item.name];
            if (itemProperty && itemProperty.place) {
                const placeInfo = itemProperty.place;
                const blockToPlace = new Block(placeInfo.block, placeInfo.mutate || 0);
                const cost = placeInfo.cost || 1;

                const mouseTile = this.map.getMouseAimingTile(player.mousePosX, player.mousePosY);
                if (item.amount >= cost && mouseTile && mouseTile.upperBlock == null) {
                    mouseTile.upperBlock = blockToPlace;

                    item.amount -= cost;
                    const aimingChunk = this.map.getMouseAimingChunk(player.mousePosX, player.mousePosY);
                    for (const id of playerIDList) {
                        if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
                        webSocketsDic[id].send(JSON.stringify({
                            type: "update_player",
                            player: {
                                id: player.id,
                                inventory: player.inventory
                            }
                        }));
                        webSocketsDic[id].send(JSON.stringify({
                            type: "update_tile",
                            chunkX: aimingChunk.x,
                            chunkY: aimingChunk.y,
                            tile: mouseTile
                        }));
                    }
                }
            }
        }
    }

    handlePlayerOffline(playerIDList, webSocketsDic) {
        for (const id of playerIDList) {
            const player = this.playerController.players[id];
            if (player && player.online && !webSocketsDic[id]) {
                player.setPlayerOffline();
            }
        }
    }

    boardcastOnlineStatus(targetPlayer, playerIDList, webSocketsDic) {
        for (const id of playerIDList) {
            if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
            webSocketsDic[id].send(JSON.stringify({
                type: "update_player",
                player: {
                    id: targetPlayer.id,
                    online: targetPlayer.online
                }
            }));
        }
    }

    /**
     * 更新关卡状态
     * @param {Object} webSocketsDic 字典类型，包含所有 WebSocket 连接
     * @returns {null}
     */
    update(webSocketsDic) {
        const playerIDList = this.getAllPlayerID();
        for (const playerId in this.playerController.players) {
            const player = this.playerController.players[playerId];

            // 读取消息队列的操作
            while (true) {
                const action = player.dequeueAction();
                if (!action) {
                    break;
                }
                // 处理玩家的操作，具体操作类型请见 action_comments.md
                switch (action.type) {
                    case "chat":
                        this.handleChatAction(player, playerIDList, webSocketsDic, action);
                        break;

                    case "global_sync":
                        this.handleGlobalSyncAction(playerIDList, webSocketsDic);
                        break;

                    case "keyboard":
                        this.handleKeyboardAction(player, playerIDList, webSocketsDic, action);
                        break;

                    case "mouse_pos":
                        player.mousePosX = action.x;
                        player.mousePosY = action.y;
                        break;

                    case "mouse":
                        this.handleMouseAction(player, playerIDList, webSocketsDic, action);
                        break;

                    case "offline":
                        this.boardcastOnlineStatus(player, playerIDList, webSocketsDic);
                        break;

                    default:
                        console.warn(`未知的操作类型: ${action.type} 来自玩家 ${playerId}`);
                        break;
                }
            }

            // 游戏自身逻辑更新
            this.handlePlayerMovement(player, playerIDList, webSocketsDic);
            this.handleBlockDigging(player, playerIDList, webSocketsDic);
            this.handleBlockPlacement(player, playerIDList, webSocketsDic);
        }
        this.handlePlayerOffline(playerIDList, webSocketsDic);
        this.handleLevelSave();
    }

    getAllPlayerID() {
        return Object.keys(this.playerController.players);
    }

    loadLevel(name) {
        const levelDir = path.join(__dirname, '../archive/worlds', name);
        const filePath = path.join(levelDir, 'level.json');

        if (fs.existsSync(filePath)) {
            const levelData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.id = levelData.id;
            this.name = levelData.name;

            // 重新实例化 map
            this.map = new Map();
            for (const key in levelData.map.chunkMap) {
                const chunkData = levelData.map.chunkMap[key];
                const chunk = new Chunk(chunkData.x, chunkData.y);
                Object.assign(chunk, chunkData); // 将数据合并到 Chunk 实例中
                this.map.chunkMap[key] = chunk;
            }

            // 重新实例化 playerController 和 players
            this.playerController = new PlayerController();
            for (const playerId in levelData.playerController.players) {
                const playerData = levelData.playerController.players[playerId];
                const player = new Player(playerData.id, playerData.name, playerData.x, playerData.y);
                Object.assign(player, playerData);
                this.playerController.players[playerId] = player;
            }

            console.log(`关卡 ${name} 已从 ${filePath} 加载`);
        } else {
            console.error(`关卡 ${name} 的数据文件不存在：${filePath}，即将新建关卡。`);
            this.map.spawnNewMap();
            this.saveLevel();
        }
    }

    saveLevel() {
        const levelDir = path.join(__dirname, '../archive/worlds', this.name);
        if (!fs.existsSync(levelDir)) {
            fs.mkdirSync(levelDir, { recursive: true });
        }

        const levelData = {
            id: this.id,
            name: this.name,
            map: this.map,
            playerController: this.playerController
        };

        const filePath = path.join(levelDir, 'level.json');
        fs.writeFileSync(filePath, JSON.stringify(levelData));
        console.log(`关卡 ${this.name} 已保存到 ${filePath}`);
    }

    handleLevelSave() {
        this.currSaveCountdown -= 1 / TPS;
        if (this.currSaveCountdown <= 0) {
            this.saveLevel();
            this.currSaveCountdown = SAVE_INTERVAL;
        }
    }

    // 停止关卡
    stop() {
        this.saveLevel();
    }
}

module.exports = { Level, TPS };