// I wanted to use promptly, but it uses {...options} syntax, so it wouldn't work in node6
// This implements the API subset I use 
const read = require('read')

function validate(choices, resp) {
    if (choices.indexOf(resp) > -1) {
        return resp
    }
}

function choose(text, choices, options) {
    return new Promise((resolve, reject) => {
        read({
            prompt: text
        }, (err, resp) => {
            if (err) {
                return reject(err)
            }
            const cleanResult = validate(choices, (options.trim ? resp.trim() : resp))
            if (!cleanResult && options.retry) {
                return choose(text, choices, options).then(resolve, reject)
            }
            resolve(cleanResult)
        })
    })
}

module.exports = {
    choose
}