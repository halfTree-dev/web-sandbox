const { CHUNK_WIDTH, CHUNK_HEIGHT, Chunk } = require('./chunk');
const { TILE_WIDTH, TILE_HEIGHT, Tile } = require('./tiles');
const MapCreator = require('./mapCreator');

const PRE_CREATE_MAP_WIDTH = 5
const PRE_CREATE_MAP_HEIGHT = 5

class Map {
    constructor() {
        this.chunkMap = {}
    }

    spawnNewMap() {
        const seed = "nwpu";
        this.chunkMap = new MapCreator(seed).spawnChunkMap(PRE_CREATE_MAP_WIDTH, PRE_CREATE_MAP_HEIGHT);
    }

    getMouseAimingTile(mouseX, mouseY) {
        const { chunkX, chunkY, tileX, tileY } = this.getChunkAndTileIndexByPos(mouseX, mouseY);
        const chunk = this.chunkMap[`${chunkX},${chunkY}`];
        if (!chunk) return null;
        return chunk.tiles[tileY] && chunk.tiles[tileY][tileX] ? chunk.tiles[tileY][tileX] : null;
    }

    getMouseAimingChunk(mouseX, mouseY) {
        const { chunkX, chunkY } = this.getChunkAndTileIndexByPos(mouseX, mouseY);
        return this.chunkMap[`${chunkX},${chunkY}`] || null;
    }

    getChunkAndTileIndexByPos(x, y) {
        const chunkX = Math.floor((x + TILE_WIDTH / 2) / (CHUNK_WIDTH * TILE_WIDTH));
        const chunkY = Math.floor((y + TILE_HEIGHT / 2) / (CHUNK_HEIGHT * TILE_HEIGHT));
        let tileX = Math.floor((x + TILE_WIDTH / 2) / TILE_WIDTH) % CHUNK_WIDTH;
        if (tileX < 0) { tileX += CHUNK_WIDTH; }
        let tileY = Math.floor((y + TILE_HEIGHT / 2) / TILE_HEIGHT) % CHUNK_HEIGHT;
        if (tileY < 0) { tileY += CHUNK_HEIGHT; }
        return {
            chunkX : chunkX,
            chunkY : chunkY,
            tileX : tileX,
            tileY : tileY
        }
    }

}

module.exports = Map;
