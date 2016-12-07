npm-doctor(1) -- Check your environments
========================================================

## SYNOPSIS

    npm doctor

## DESCRIPTION

npm command is just a single command, but depends on several things outside
the code base. Broadly speaking, it is the following three types:

+ Technology stack: Node.js, git
+ Registry: `registry.npmjs.com`
+ Files: `node_modules` in local/global, cached files in `npm config get cache`

Without all of these working properly, the npm command will not work properly.
Many issue reports that arrive under us are often attributable to things that
are outside the code base as described above, and it is necessary to confirm
that this is correctly set with one command would help you solve your issue.
Also, in addition to this, there are also very many issue reports due to using
old versions of npm. Since npm is constantly improving, in every aspect the
`latest` npm is better than the old version(it should be, and we are trying).

From the above reasons, `npm doctor` will investigate the following items in
your environment and if there are any other recommended settings, it will
display the recommended example.

|What to check|What we recommend|
|---|---|
|`npm ping`|It must be able to communicate with the registry|
|`npm -v`|It is preferable that the latest version of LTS is used|
|`node -v`|It is preferable that the latest version of LTS is used|
|`npm config get registry`|In order not to consider exceptions, it is better to set default values `registry.npmjs.org`|
|`which git`|Git has to be installed|
|`Perms check on cached files`|All cached module files must be readable.|
|`Perms check on global node_modules`|All global module files must be executable.|
|`Perms check on local node_modules`|All local module files must be executable.|
|`Checksum cached files`|All cached files must not be broken|

## SEE ALSO

* npm-bugs(1)
* npm-help(1)
