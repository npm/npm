npm-scripts(1) -- How npm handles the "scripts" field
=====================================================

## DESCRIPTION

npm supports the "scripts" member of the package.json script, for the
following scripts:

* preinstall:
  Run BEFORE the package is installed
* install, postinstall:
  Run AFTER the package is installed.
* preactivate:
  Run BEFORE the package is activated.
* activate, postactivate:
  Run AFTER the package has been activated.
* predeactivate, deactivate:
  Run BEFORE the package is deactivated.
* postdeactivate:
  Run AFTER the package is deactivated.
* preuninstall, uninstall:
  Run BEFORE the package is uninstalled.
* postuninstall:
  Run AFTER the package is uninstalled.

## Package Lifecycle Env Vars

Package scripts are run in an environment where the package.json fields have
been tacked onto the `npm_package_` prefix. So, for instance, if you had
`{"name":"foo", "version":"1.2.5"}` in your package.json file, then in your
various lifecycle scripts, this would be true:

    process.env.npm_package_name === "foo"
    process.env.npm_package_version === "1.2.5"

Objects are flattened following this format, so if you had
`{"scripts":{"install":"foo.js"}}` in your package.json, then you'd see this
in the script:

    process.env.npm_package_scripts_install = "foo.js"

Last but not least, the `npm_lifecycle_event` environment variable is set to
whichever stage of the cycle is being executed. So, you could have a single
script used for different parts of the process which switches based on what's
currently happening.

If the script exits with a code other than 0, then this will abort the
process.

Note that these script files don't have to be nodejs or even javascript
programs. They just have to be some kind of executable file.

For example, if your package.json contains this:

    { "scripts" :
      { "install" : "scripts/install.js"
      , "postinstall" : "scripts/install.js"
      , "activate" : "scripts/install.js"
      , "uninstall" : "scripts/uninstall.js"
      }
    }

then the `scripts/install.js` will be called for the install, post-install,
and activate stages of the lifecycle, and the `scripts/uninstall.js` would be
called when the package is uninstalled.  Since `scripts/install.js` is running
for three different phases, it would be wise in this case to look at the
`npm_lifecycle_event` environment variable.

If you want to run a make command, you can do so.  This works just fine:

    { "scripts" :
      { "preinstall" : "./configure"
      , "install" : "make"
      , "test" : "make test"
      }
    }

Scripts are run by passing the line as a script argument to `sh`.
