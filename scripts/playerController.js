const { PLAYER_WIDTH, PLAYER_HEIGHT, Player } = require('./player');

class PlayerController {
    /**
     * 创建一个 PlayerController 对象
     * @returns {null}
     */
    constructor() {
        this.players = {};
    }

    /**
     * 添加玩家
     * @param {Player} player 玩家对象
     * @returns {string} 返回玩家的 UUID
     */
    addPlayer(player) {
        this.players[player.id] = player;
        return player.userID;
    }

    changePlayerID(oldID, newID) {
        if (oldID === newID) { return; }
        if (this.players[oldID]) {
            this.players[newID] = this.players[oldID];
            this.players[newID].id = newID;
            delete this.players[oldID];
        }
    }

    /**
     * 获取玩家
     * @param {string} uuid
     * @returns {Player|null}
     */
    getPlayer(uuid) {
        return this.players[uuid] || null;
    }
}

module.exports = PlayerController;