const { Entity, entityProperties } = require('./entity');

class EntityController {
    constructor() {
        this.entities = {};
    }

    addEntity(entity) {
        this.entities[entity.id] = entity;
        return entity.id;
    }

    changeEntityID(oldID, newID) {
        if (oldID === newID) { return; }
        if (this.entities[oldID]) {
            this.entities[newID] = this.entities[oldID];
            this.entities[newID].id = newID;
            delete this.entities[oldID];
        }
    }

    getEntity(uuid) {
        return this.entities[uuid] || null;
    }

    removeEntity(uuid) {
        if (this.entities[uuid]) {
            delete this.entities[uuid];
        }
    }

}

module.exports = { EntityController };