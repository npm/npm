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
* preupdate:
  Run BEFORE the package is updated with the update command.
* update, postupdate:
  Run AFTER the package is updated with the update command.
* preupdatedependencies:
  Run BEFORE the package dependencies are pointed to the new version.
* updatedependencies, postupdatedependencies:
  Run AFTER the package dependencies are pointed to the new version.

## ENVIRONMENT

Package scripts run in an environment where many pieces of information are made available regarding the setup of npm and the current state of the process.

* package.json vars:
  The package.json fields are tacked onto the `npm_package_` prefix. So, for
  instance, if you had `{"name":"foo", "version":"1.2.5"}` in your package.json
  file, then your package scripts would have the `npm_package_name` environment
  variable set to "foo", and the `npm_package_version` set to "1.2.5"
  
* configuration vars:
  Configuration parameters are put in the environment with the `npm_config_`
  prefix. For instance, you can view the effective `root` config by checking the
  `npm_config_root` environment variable.
  
* current lifecycle event:
  Lastly, the `npm_lifecycle_event` environment variable is set to whichever
  stage of the cycle is being executed. So, you could have a single script used
  for different parts of the process which switches based on what's currently
  happening.


Objects are flattened following this format, so if you had
`{"scripts":{"install":"foo.js"}}` in your package.json, then you'd see this
in the script:

    process.env.npm_package_scripts_install === "foo.js"

## EXAMPLES

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
      , "install" : "make && make install"
      , "test" : "make test"
      }
    }

## EXITING

Scripts are run by passing the line as a script argument to `sh`.

If the script exits with a code other than 0, then this will abort the
process.

Note that these script files don't have to be nodejs or even javascript
programs. They just have to be some kind of executable file.

## HOOK SCRIPTS

If you want to run a specific script at a specific lifecycle event for ALL
packages, then you can use a hook script.

Place an executable file at `{root}/.npm/.hooks/{eventname}`, and it'll get
run for all packages when they are going through that point in the package
lifecycle.

Hook scripts are run exactly the same way as package.json scripts.  That is,
they are in a separate child process, with the env described above.

## BEST PRACTICES

* Don't exit with a non-zero error code unless you *really* mean it.
  Except for uninstall/deactivate scripts, this will cause the npm action
  to fail, and potentially be rolled back.  If the failure is minor or
  only will prevent some optional features, then it's better to just
  print a warning and exit successfully.
* Try not to use scripts to do what npm can do for you.  Read through
  `npm help json` to see all the things that you can specify and enable
  by simply describing your package appropriately.  In general, this will
  lead to a more robust and consistent state.
* Inspect the env to determine where to put things.  For instance, if
  the `npm_config_binroot` environ is set to `/home/user/bin`, then don't
  try to install executables into `/usr/local/bin`.  The user probably
  set it up that way for a reason.
* Don't prefix your script commands with "sudo".  If root permissions are
  required for some reason, then it'll fail with that error, and the user
  will sudo the npm command in question.
