const fs = require('fs');
const path = require('path');
const argv = require('./arguments')

var data = null;

const biuldKey = ({ id, path }) => `${id}|${path}`;
const filePath = () => path.resolve(argv.get().prefix || '.', 'audit-resolv.json')

function load() {
    if (data) {
        return
    }
    data = {} //in case loading fails, have something valid to extend and save
    try {
        const rawdata = fs.readFileSync(filePath());
        data = JSON.parse(rawdata);
    } catch (e) { }
}

const longRandomRegex = /^[a-z0-9]{64}$/
function pathCorruptionWorkaround(depPath) {
    const chunks = depPath.split('>')
    return chunks.map(c => {
        if (c.match(longRandomRegex)) {
            return '00unidentified'
        } else {
            return c
        }
    }).join('>')
}

module.exports = {
    load,
    flush() {
        fs.writeFileSync(filePath(), JSON.stringify(data, null, 2));
    },
    set({ id, path }, value) {
        load()
        path = pathCorruptionWorkaround(path)
        return (data[biuldKey({ id, path })] = value);
    },
    get({ id, path }) {
        load()
        path = pathCorruptionWorkaround(path)
        return data[biuldKey({ id, path })];
    }
};