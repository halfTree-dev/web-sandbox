const fs = require('fs');
const path = require('path');

class Entity {
    constructor(id, name, x, y) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;

        this.angle = 0;
        this.speed = 0;
        this.damage = 0;
        this.lifeTime = 0;

        this.master = null;
    }
}

const entityPropertiesPath = path.join(__dirname, '../data/entity_properties.json');
const entityProperties = JSON.parse(fs.readFileSync(entityPropertiesPath, 'utf-8'));

module.exports = { Entity, entityProperties };