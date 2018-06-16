const fs = require("fs");

var data = {};

const biuldKey = ({ id, path }) => `${id}|${path}`;

function load() {
    try {
        const rawdata = fs.readFileSync("audit-resolv.json");
        data = JSON.parse(rawdata);
    } catch (e) {}
}

load();

module.exports = {
    load,
    flush() {
        fs.writeFileSync("audit-resolv.json", JSON.stringify(data, null, 2));
    },
    set({ id, path }, value) {
        path = pathCorruptionWorkaround(path)
        return (data[biuldKey({ id, path })] = value);
    },
    get({ id, path }) {
        path = pathCorruptionWorkaround(path)
        return data[biuldKey({ id, path })];
    }
};

const longRandomRegex = /^[a-z0-9]{64}$/
function pathCorruptionWorkaround(path){
    const chunks = path.split('>')
    return chunks.map(c=>{
        if(c.match(longRandomRegex)){
            return '00unidentified'
        } else {
            return c
        }
    }).join('>')
}
