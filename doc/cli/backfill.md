npm-backfill(1) -- Add installed modules to package.json
========================================================

## SYNOPSIS

    npm backfill
    npm backfill <package-name> [ <package-name1> ... <package-nameN> ]
    npm backfill --clean
    npm backfill [--save|--save-dev|--save-optional|--save-bundle]


## DESCRIPTION

If you've installed a new package and forgotten to do `npm i --save <package-name>` 
then this command will allow you to backfill packages into your packages.json file:

```
  npm backfill <package-name>
```

You can also backfill several packages at once by doing:

```
  npm backfill <package-name1> <package-name2> .... <package-nameN>
```

Additionally by not providing any arguments you can backfill all currently installed 
packages:

```
  npm backfill
```

`npm backfill` takes 4 exclusive, optional flags which save or update the package version in 
your main package.json (respected in the same order):

    * `--save`: Package will appear in your `dependencies`
    * `--save-dev`: Package will appear in your `devDependencies`
    * `--save-optional`: Package will appear in your `optionalDependencies`
    * `--save-bundle`: Package will appear in your `bundleDependencies`


Finally, if you've been installing and removing packages and wish to clean your package.json 
dependency list you can backfill all currently installed packages clobbering those already 
in your package.json as follows:

```
  npm backfill --clean
```