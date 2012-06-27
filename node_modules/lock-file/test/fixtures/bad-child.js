var lockFile = require('../../lock-file.js')

lockFile.lockSync('never-forget')

throw new Error('waaaaaaaaa')
