const Map = require('./map');
const PlayerController = require('./playerController');
const { EntityController } = require('./entityController');
const { Item, itemProperties } = require('./item');
const { CHUNK_WIDTH, CHUNK_HEIGHT, Chunk } = require('./chunk');
const { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_MODEL_WIDTH, PLAYER_MODEL_HEIGHT, Player } = require('./player');
const { Entity, entityProperties } = require('./entity');
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
        this.entityController = new EntityController();

        this.currSaveCountdown = SAVE_INTERVAL;
    }

    // 开始关卡
    start() {
        this.map = new Map();
        this.playerController = new PlayerController();
        this.entityController = new EntityController();
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
                players: this.playerController.players,
                entities: this.entityController.entities
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

    handleMouseUpdate(player, playerIDList, webSocketsDic, action) {
        player.mousePosX = action.x;
        player.mousePosY = action.y;
        const shiftX = player.mousePosX - player.x;
        const shiftY = player.mousePosY - (player.y - PLAYER_MODEL_HEIGHT / 2);
        let mouseAngle = Math.atan2(shiftY, shiftX);
        if (mouseAngle < 0) { mouseAngle += 2 * Math.PI; }
        player.mouseAngle = mouseAngle;
        for (const id of playerIDList) {
            if (webSocketsDic[id] && this.playerController.players[id].online) {
                webSocketsDic[id].send(JSON.stringify({
                    type: "update_player",
                    player: {
                        id: player.id,
                        mouseAngle: player.mouseAngle
                    }
                }))
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

    checkEntityCollision(targetEntityPos, entityName) {
        const entityProps = entityProperties[entityName];
        if (!entityProps) {
            console.error(`Entity properties not found for: ${entityName}`);
            return false;
        }

        const halfW = entityProps.width / 2;
        const halfH = entityProps.height / 2;
        let blocked = false;
        const samplePoints = [
            { x: targetEntityPos.x - halfW, y: targetEntityPos.y - halfH },
            { x: targetEntityPos.x + halfW, y: targetEntityPos.y - halfH },
            { x: targetEntityPos.x - halfW, y: targetEntityPos.y + halfH },
            { x: targetEntityPos.x + halfW, y: targetEntityPos.y + halfH },
            { x: targetEntityPos.x, y: targetEntityPos.y }
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

    handlePlayerLaunch(player, playerIDList, webSocketsDic) {
        const item = player.inventory[player.selectIndex];
        if (item && player.rightInteract && item.coldDown <= 0) {
            const itemProperty = itemProperties[item.name];
            if (itemProperty && itemProperty.launch) {
                const launchInfo = itemProperty.launch;
                const launchEntity = new Entity(uuidv4(), "arrow", player.x, player.y - PLAYER_MODEL_HEIGHT / 2);
                launchEntity.speed = launchInfo.speed || 0;
                launchEntity.angle = player.mouseAngle || 0;
                launchEntity.damage = launchInfo.damage || 1;
                launchEntity.lifeTime = launchInfo.life_time || -1;
                launchEntity.master = player.id;
                item.coldDown = launchInfo.cold_down || 1;
                this.entityController.addEntity(launchEntity);
                for (const id of playerIDList) {
                    if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
                    webSocketsDic[id].send(JSON.stringify({
                        type: "update_entity",
                        entity: launchEntity
                    }));
                }
            }
        }
    }

    handlePlayerInventoryUpdate(player, playerIDList, webSocketsDic) {
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (item && typeof item.coldDown === "number" && item.coldDown > 0) {
                item.coldDown = Math.max(0, item.coldDown - 1 / TPS);
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

    handleEntityUpdate(entity, playerIDList, webSocketsDic) {
        const AItype = entityProperties[entity.name].actionAI;
        const entityUpdateContent = { id: entity.id };
        let entityNeedUpdate = false;
        switch (AItype) {
            case "projectile":
                entity.x += Math.cos(entity.angle) * entity.speed / TPS;
                entity.y += Math.sin(entity.angle) * entity.speed / TPS;
                entityUpdateContent.x = entity.x;
                entityUpdateContent.y = entity.y;
                entityNeedUpdate = true;
                break;
            default:
                break;
        }
        entity.lifeTime -= 1 / TPS;
        if (entityNeedUpdate) {
            for (const id of playerIDList) {
                if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
                webSocketsDic[id].send(JSON.stringify({
                    type: "update_entity",
                    entity: entityUpdateContent
                }));
            }
        }
    }

    handleEntityCollision(entity, playerIDList, webSocketsDic) {
        const AItype = entityProperties[entity.name].actionAI;
        const blocked = this.checkEntityCollision({ "x": entity.x, "y": entity.y }, entity.name);
        if (blocked) {
            switch (AItype) {
                case "projectile":
                    entity.lifeTime = 0;
                    break;
                default:
                    break;
            }
        }
    }

    handleEntityDelete(entity, playerIDList, webSocketsDic) {
        if (entity.lifeTime <= 0) {
            this.entityController.removeEntity(entity.id);
            const entityDeleteMessage = { type: "delete_entity", entity_id: entity.id };
            for (const id of playerIDList) {
                if (!webSocketsDic[id] || !this.playerController.players[id].online) { continue; }
                webSocketsDic[id].send(JSON.stringify(entityDeleteMessage));
            }
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
                        this.handleMouseUpdate(player, playerIDList, webSocketsDic, action);
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
            this.handlePlayerLaunch(player, playerIDList, webSocketsDic);
            this.handleBlockDigging(player, playerIDList, webSocketsDic);
            this.handleBlockPlacement(player, playerIDList, webSocketsDic);
            this.handlePlayerInventoryUpdate(player, playerIDList, webSocketsDic);
        }
        this.handlePlayerOffline(playerIDList, webSocketsDic);

        for (const entity of Object.values(this.entityController.entities)) {
            this.handleEntityUpdate(entity, playerIDList, webSocketsDic);
            this.handleEntityCollision(entity, playerIDList, webSocketsDic);
            this.handleEntityDelete(entity, playerIDList, webSocketsDic);
        }

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

            // 重新实例化 entityController 和 entities
            this.entityController = new EntityController();
            for (const entityId in levelData.entityController.entities) {
                const entityData = levelData.entityController.entities[entityId];
                const entity = new Entity(entityData.id, entityData.type, entityData.x, entityData.y);
                Object.assign(entity, entityData);
                this.entityController.entities[entityId] = entity;
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
            playerController: this.playerController,
            entityController: this.entityController
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