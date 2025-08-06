const Block = require('./block');

const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

class Tile {
    /**
     * 创建一个 Tile 对象，使用指定方块
     * @param {float} x
     * @param {float} y
     * @param {Block} upperBlock
     * @param {Block} lowerBlock
     * @returns {null}
     */
    constructor(x, y, upperBlock, lowerBlock) {
        this.x = x;
        this.y = y;
        this.upperBlock = upperBlock;
        this.lowerBlock = lowerBlock;
    }
}

module.exports = { TILE_WIDTH, TILE_HEIGHT, Tile };