const fs = require('fs');
const path = require('path');

class Block {
    /**
     * 创建一个 Block 对象
     * @param {string} name 方块名称
     * @returns {null}
     */
    constructor(name, mutate=0) {
        this.name = name;
        this.integrity = 50;
        this.mutate = mutate;
        this.hasCollisionBox = false;
        this.loadProperties();
    }

    loadProperties() {
        if (blockProperties[this.name]) {
            this.hasCollisionBox = blockProperties[this.name].hasCollisionBox;;
        }
    }
}

const blockPropertiesPath = path.join(__dirname, '../data/block_properties.json');
const blockProperties = JSON.parse(fs.readFileSync(blockPropertiesPath, 'utf-8'));

module.exports = { Block, blockProperties };
