"use strict";
const path = require('path');
const fs = require('fs');
const npm = require('./npm.js');
const output = require('./utils/output.js');
module.exports = why;

why.usage = 'npm why <pkg>';

function why(args, silent, cb) {
  if (args.length !== 1) {
    silent(why.usage);
  }
  if (npm.config.get('package-lock')) {
    const lockFile = JSON.parse(fs.readFileSync(path.join(npm.localPrefix, 'package-lock.json')).toString());
    let arr = traverseTree(lockFile.dependencies, args[0]);
    let indentLevel = 0;
    if(arr.length === 0) {
      console.info(args[0] + " is installed as dependency");
      silent();
    }
    arr.forEach((item) => {
      console.log("|" + "--".repeat(indentLevel) + item.pkg + "@" + item.version + " depends on ");
      indentLevel++;
    });
    console.log("|" + "--".repeat(indentLevel) + args[0]);
    silent();
  }
}

function traverseTree(lock, dependency) {
  let tree = [];
  Object.keys(lock).forEach(function (key) {
    if (lock[key].dependencies) {
      if (lock[key].dependencies[dependency]) {
        tree = tree.concat({pkg: key, version: lock[key].version})
      }
      tree = tree.concat(traverseTree(lock[key].dependencies, dependency));
    }
  });
  return tree;
}
