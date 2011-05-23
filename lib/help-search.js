
module.exports = helpSearch

var fs = require("./utils/graceful-fs")
  , output = require("./utils/output")
  , docsPath = __dirname + "/../../npm/doc/"

helpSearch.usage = "npm help-search <text>"
         + "\nwhere <text> is the text to find in the documentation"

function helpSearch (args, cb) {
  if (! args.length) {
    return cb(usage)
  }
  
  fs.readdir(docsPath, function(err, files) {
    if (err) {
      return cb(new Error("Could not load documentation from " + docsPath))
    }
    
    var search = args.join(" ")
    var out = ""
    for (var file in files) {
      var data = fs.readFileSync(docsPath + files[file]).toString()
      var result = data.indexOf(search)
      if (result !== -1) {
        var start = result > 20 ? result - 20 : 0;
        var context = data.substr(start, result - start)
                    + "\033[31;40m" 
                    + data.substr(result, search.length) 
                    + "\033[0m"
                    + data.substr(result + search.length, 20)
        out += "`npm help " + files[file].replace(".md", "") + "` "
                + context.replace(/\n/gi, "").substr(0,60) + "\n"
      }
    }
    
    if (out) {
      return output.write(out, cb)
    } else {
      return output.write("No results were found", cb)
    }
  })
}
