npm-sync(1) -- Add installed modules to package.json
========================================================

## SYNOPSIS

    npm sync
    npm sync <package-name> [ <package-name1> ... <package-nameN> ]
    npm sync [--save|--save-dev|--save-optional|--save-bundle] [<package-name> ... ]


## DESCRIPTION

If you've installed a new package and forgotten to do `npm i --save <package-name>` 
then this command will allow you to sync packages into your packages.json file:

```
  npm sync <package-name>
```

You can also sync several packages at once by doing:

```
  npm sync <package-name1> <package-name2> .... <package-nameN>
```

Additionally by not providing any arguments you can sync all currently installed 
packages:

```
  npm sync
```
Note: This will remove any packages which are not installed from your `package.json`.

`npm sync` takes 4 exclusive, optional flags which save or update the package version in 
your main package.json (respected in the same order):

    * `--save`: Package will appear in your `dependencies`
    * `--save-dev`: Package will appear in your `devDependencies`
    * `--save-optional`: Package will appear in your `optionalDependencies`
    * `--save-bundle`: Package will appear in your `bundleDependencies`

  Note: If package exists in `dependencies` but you are syncing a package to 
  another type of dependency it will not be added