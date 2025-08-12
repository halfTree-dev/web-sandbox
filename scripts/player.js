const { Item, itemProperties } = require('./item');

const TPS = 30;

const PLAYER_WIDTH = 52;
const PLAYER_HEIGHT = 10;

const PLAYER_MODEL_WIDTH = 64;
const PLAYER_MODEL_HEIGHT = 68;

class Player {
    constructor(id, name, x, y) {
        this.id = id;
        this.name = name;

        // 玩家的位置
        this.x = x;
        this.y = y;

        // 玩家的物品栏
        this.inventory = [];
        this.maxSpace = 32;
        this.selectIndex = 0;
        this.selectBarRange = 10;

        // 玩家的操作状态
        this.mousePosX = 0;
        this.mousePosY = 0;
        this.leftInteract = false;
        this.rightInteract = false;
        this.keyStates = {};
        this.mouseAngle = 0;

        // 玩家操作队列
        this.actionQueue = [];

        // PlayerController 默认储存所有玩家的状态，无论其是否在线
        // 故该状态用于指示玩家是否在线，若该玩家不在线，则不予处理其操作
        // 客户端仅仅显示在线的玩家
        this.online = false;

        this.speed = 320;
    }

    /**
     * 添加消息到队列
     * @param {Object} message - 玩家发来的 JSON 消息
     */
    enqueueAction(message) {
        this.actionQueue.push(message);
    }

    /**
     * 从队列中取出消息
     * @returns {Object|null} - 队列中的消息或 null
     */
    dequeueAction() {
        return this.actionQueue.shift() || null;
    }

    // 返回值为 0 则全部添加完毕，不为 0 则数值为未能添加的物品个数
    addItem(item) {
        const itemProperty = itemProperties[item.name];
        if (!itemProperty) return false; // 如果物品属性不存在，返回失败

        let remainingAmount = item.amount;

        // 尝试叠加到已有的同类物品
        for (const inventoryItem of this.inventory) {
            if (inventoryItem.name === item.name) {
                const maxStack = itemProperty.stack_amount;
                const availableSpace = maxStack - inventoryItem.amount;

                if (availableSpace > 0) {
                    const toAdd = Math.min(remainingAmount, availableSpace);
                    inventoryItem.amount += toAdd;
                    remainingAmount -= toAdd;
                }

                if (remainingAmount === 0) return 0;
            }
        }

        // 如果还有剩余物品，尝试新建堆叠
        while (remainingAmount > 0) {
            if (this.inventory.length >= this.maxSpace) return remainingAmount; // 背包已满

            const toAdd = Math.min(remainingAmount, itemProperty.stack_amount);
            this.inventory.push(new Item(item.name, toAdd));
            remainingAmount -= toAdd;
        }

        return 0;
    }

    checkItem(item) {
        let totalAmount = 0;
        for (const inventoryItem of this.inventory) {
            if (inventoryItem.name === item.name) {
                totalAmount += inventoryItem.amount;
                if (totalAmount >= item.amount) return true;
            }
        }
        return false;
    }

    removeItem(item) {
        let remainingAmount = item.amount;

        for (let i = 0; i < this.inventory.length; i++) {
            const inventoryItem = this.inventory[i];

            if (inventoryItem.name === item.name) {
                if (inventoryItem.amount > remainingAmount) {
                    inventoryItem.amount -= remainingAmount;
                    return true;
                } else {
                    remainingAmount -= inventoryItem.amount;
                    this.inventory.splice(i, 1);
                    i--;
                }

                if (remainingAmount === 0) return true;
            }
        }

        return false; // 如果未能移除足够的物品
    }

    /**
     * 更新玩家的移动
     * @returns {Object} - 返回一个包含玩家位置和 ID 的消息对象，仅当玩家有移动时返回
     */
    getMoveDestination() {
        let currX = this.x;
        let currY = this.y;
        const vector = [0, 0];
        if (this.keyStates['w'] || this.keyStates['ArrowUp']) {
            vector[1] -= 1;
        }
        if (this.keyStates['s'] || this.keyStates['ArrowDown']) {
            vector[1] += 1;
        }
        if (this.keyStates['a'] || this.keyStates['ArrowLeft']) {
            vector[0] -= 1;
        }
        if (this.keyStates['d'] || this.keyStates['ArrowRight']) {
            vector[0] += 1;
        }
        const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);

        if (magnitude > 0) {
            const unitVector = [vector[0] / magnitude, vector[1] / magnitude];
            currX += unitVector[0] * this.speed / TPS;
            currY += unitVector[1] * this.speed / TPS;;
        }
        return {"x": currX, "y": currY};
    }

    setPlayerOffline() {
        this.online = false;
        this.enqueueAction({ type: 'offline' });
        console.log(`玩家 ${this.name} (${this.id}) 离线了`);
    }
}

module.exports = { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_MODEL_WIDTH, PLAYER_MODEL_HEIGHT, Player };