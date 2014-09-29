# read-package-tree

Read the contents of node_modules.

## USAGE

```javascript
var rpt = require ('read-package-tree')
rpt('/path/to/pkg/root', function (er, data) {
  // er means that something didn't work.
  // data is a structure like:
  // {
  //   package: <package.json data, or null>
  //   children: [ <more things like this> ]
  //   parent: <thing that has this in its children property, or null>
  //   path: <path loaded>
  //   realpath: <the real path on disk>
  //   target: <if a Link, then this is the actual Node>
  // }
})
```

That's it.  It doesn't figure out if dependencies are met, it doesn't
mutate package.json data objects (beyond what
[read-package-json](http://npm.im/read-package-json) already does), it
doesn't limit its search to include/exclude `devDependencies`, or
anything else.

Just follows the links in the `node_modules` heirarchy and reads the
package.json files it finds therein.

## Symbolic Links

When there are symlinks to packages in the `node_modules` hierarchy, a
`Link` object will be created, with a `target` that is a `Node`
object.

For the most part, you can treat `Link` objects just the same as
`Node` objects.  But if your tree-walking program needs to treat
symlinks differently from normal folders, then make sure to check the
object.

In a given `read-package-tree` run, a specific `path` will always
correspond to a single object, and a specific `realpath` will always
correspond to a single `Node` object.  This means that you may not be
able to pass the resulting data object to `JSON.stringify`, because it
may contain cycles.

## Errors

Errors parsing or finding a package.json in node_modules will call back with
an error object and no tree.

A missing or invalid top level package.json will call back with an error
object AND a tree, so that you may, at your discretion, choose to ignore
the error.
