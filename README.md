# npm – The Node Package Manager

npm is a little package manager for the Node javascript library.

For now, this README is more of a task list/roadmap than a proper "how to use this" type doc.

## Goal for current iteration

Given a name, and a url of a tarball containing a npm-package.json, install it.

where "install it" means:

1. fetch the tarball
2. unpack
3. copy it to `ROOT/<name>/npm/`.
  If it already exists, then insist that it be uninstalled first.
4. read and parse the npm-package.json
5. link `ROOT/<name>/index.js` to `ROOT/<name>/package/<lib>`, if there is one.
6. Run the `build` command in the package dir (sh)

## Next Iteration

* Keep a registry of what's been installed, and what tarball it came from.  Maybe something like `ROOT/<name>/from` or something.
* Add an "uninstall" command that deletes the folder for a package.
* Add a "reinstall" command that re-fetches a tarball and installs it with the same name as before

## Future

* Support an "uninstall" command on the package.json, and run it when uninstalling.
* Support "requires" which is a list of tarball urls that must be installed first.
* Figure out how to manage requirements without it being a total cluster.
* Replace the reliance on tarballs with a list of names that REFER to tarballs
* Versions.  Be able to install and activate different versions, have a url for the version info to update when necessary.
* Interpret tusk-style package.json files.
* Make a pizza and serve it up.
* The kitchen sink.


