const { TILE_WIDTH, TILE_HEIGHT, Tile } = require('./tiles');
const Block = require('./block');

const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 16;

class Chunk {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.tiles = this.createTiles();
    }

    // 创建二维数组的瓦片
    createTiles() {
        const tiles = [];
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                row.push(new Tile(x, y, null, new Block('dirt')));
            }
            tiles.push(row);
        }
        return tiles;
    }

    getTile(x, y) {
        if (x < 0 || x >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT) {
            return null;
        }
        return this.tiles[y][x];
    }
}

module.exports = { CHUNK_WIDTH, CHUNK_HEIGHT, Chunk };