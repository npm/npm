var fs = require("fs")
if (fs.existsSync(process.argv[2])) {
  console.log("success")
} else {
  console.log("error")
  process.exit(1)
}

