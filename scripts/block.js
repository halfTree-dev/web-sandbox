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
    }
}

module.exports = Block;
