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
        const seed = "what the hell";
        this.chunkMap = new MapCreator(seed).spawnChunkMap(PRE_CREATE_MAP_WIDTH, PRE_CREATE_MAP_HEIGHT);
    }

    getMouseAimingTile(mouseX, mouseY) {
        const chunk = this.getMouseAimingChunk(mouseX, mouseY);
        if (chunk === null) {
            return null;
        }
        let tileX = Math.floor((mouseX + TILE_WIDTH / 2) / TILE_WIDTH) % CHUNK_WIDTH;
        if (tileX < 0) { tileX += CHUNK_WIDTH; }
        let tileY = Math.floor((mouseY + TILE_HEIGHT / 2) / TILE_HEIGHT) % CHUNK_HEIGHT;
        if (tileY < 0) { tileY += CHUNK_HEIGHT; }
        return chunk.tiles[tileY] && chunk.tiles[tileY][tileX] ? chunk.tiles[tileY][tileX] : null;
    }

    getMouseAimingChunk(mouseX, mouseY) {
        const chunkX = Math.floor((mouseX + TILE_WIDTH / 2) / (CHUNK_WIDTH * TILE_WIDTH));
        const chunkY = Math.floor((mouseY + TILE_HEIGHT / 2) / (CHUNK_HEIGHT * TILE_HEIGHT));
        return this.chunkMap[`${chunkX},${chunkY}`] || null;
    }

}

module.exports = Map;
