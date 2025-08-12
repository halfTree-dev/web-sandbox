class Entity {
    constructor(id, name, x, y) {
        this.id = id;
        this.name = name;

        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;

        this.mouseAngle = 0;
    }
}

module.exports = { Entity };