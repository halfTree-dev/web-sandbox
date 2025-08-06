const fs = require('fs');
const path = require('path');

class Item {
    constructor(name, amount) {
        this.name = name;
        this.amount = amount || 1;
    }
}

const itemPropertiesPath = path.join(__dirname, '../data/item_properties.json');
const itemProperties = JSON.parse(fs.readFileSync(itemPropertiesPath, 'utf-8'));

module.exports = { Item, itemProperties };
