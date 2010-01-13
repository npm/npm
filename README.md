# npm – The Node Package Manager

npm is a little package manager for the Node javascript library.

For now, this README is more of a task list/roadmap than a proper "how to use this" type doc.

## Contributing

If you're interested in helping, that's awesome!  Please fork this project, implement some of the things on the list, and then let me know.  You can usually find me in #node.js on freenode.net, or you can reach me via <i@izs.me>.

## What works now:

`require("./npm").install(tarball, name)`

Given a name, and a url or filename of a tarball containing a `package.json`, install it.

where "install it" means:

1. fetch the tarball
2. unpack
3. copy it to `ROOT/<name>/npm/`.
  If it already exists, then insist that it be uninstalled first.
4. read and parse the package.json
5. link `ROOT/<name>/index.js` to `ROOT/<name>/package/<lib>`, if there is one.
6. Run the `make` command in the package dir (sh)

## Goals for Next Iteration

* Keep a registry of what's been installed, and what tarball it came from.  Maybe something like `ROOT/<name>/from` or something.
* Add an "uninstall" command that deletes the folder for a package.
* Add a "reinstall" command that re-fetches a tarball and installs it with the same name as before

## Future

* wrap it in a nice CLI
* Support an "uninstall" command on the package.json, and run it when uninstalling.
* Support "requires" which is a list of tarball urls that must be installed first.
* Figure out how to manage requirements without it being a total cluster.
* Replace the reliance on tarballs with a list of names that REFER to tarballs
* Versions.  Be able to install and activate different versions, have a url for the version info to update when necessary.
* Interpret tusk-style package.json files.
* Make a pizza and serve it up.
* The kitchen sink.
