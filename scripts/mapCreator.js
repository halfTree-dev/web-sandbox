const { createNoise2D } = require('simplex-noise');
const alea = require('alea');
const { CHUNK_WIDTH, CHUNK_HEIGHT, Chunk } = require('./chunk');
const { TILE_WIDTH, TILE_HEIGHT } = require('./tiles');
const Block = require('./block');

class MapCreator {
    constructor(seed) {
        this.altitudeNoise2D = createNoise2D(alea((seed + "altitude")));
        this.humidityNoise2D = createNoise2D(alea((seed + "humidity")));
    }

    // 根据噪声算法生成一个区块场景
    spawnChunk(chunkX, chunkY) {
        const chunk = new Chunk(chunkX, chunkY);
        for (let y = 0; y < chunk.tiles.length; y++) {
            for (let x = 0; x < chunk.tiles[y].length; x++) {
                const altitude = this.altitudeNoise2D((chunkX * CHUNK_WIDTH + x) / 128, (chunkY * CHUNK_HEIGHT + y) / 128);
                const humidity = this.humidityNoise2D((chunkX * CHUNK_WIDTH + x) / 512, (chunkY * CHUNK_HEIGHT + y) / 512);
                chunk.tiles[y][x].lowerBlock = this.spawnLowerBlock(altitude, humidity);
                chunk.tiles[y][x].upperBlock = null;
            }
        }
        return chunk;
    }

    spawnLowerBlock(altitude, humidity) {
        if (altitude > 0.35) {
            if (humidity > 0.45) {
                return new Block("snow", 0);
            }
            else if (humidity > 0.15) {
                return new Block("rock", 3);
            }
            else if (humidity > -0.4) {
                return new Block("dirt", 3);
            }
            else {
                return new Block("rock", 2);
            }
        }
        else if (altitude > -0.35) {
            if (humidity > 0.5) {
                return new Block("grass", 2);
            }
            else if (humidity > 0.2) {
                return new Block("grass", 0);
            }
            else if (humidity > -0.4) {
                return new Block("grass", 1);
            }
            else if (humidity > -0.8) {
                return new Block("sand", 0);
            }
            else {
                return new Block("sand", 1);
            }
        }
        else {
            if (humidity > 0.1) {
                return new Block("water", 0);
            }
            else if (humidity > -0.1) {
                return new Block("grass", 3);
            }
            else if (humidity > -0.3) {
                return new Block("dirt", 1);
            }
            else if (humidity > -0.6) {
                return new Block("dirt", 0);
            }
            else {
                return new Block("dirt", 2);
            }
        }
    }

    // 根据生成规模生成区块字典
    spawnChunkMap(width, height) {
        const chunkMap = {};
        for (let y = -height; y <= height; y++) {
            for (let x = -width; x <= width; x++) {
                const key = `${x},${y}`;
                chunkMap[key] = this.spawnChunk(x, y);
            }
        }
        return chunkMap;
    }
}

module.exports = MapCreator;
