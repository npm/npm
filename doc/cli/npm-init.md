npm-init(1) -- Interactively create a package.json file
=======================================================

## SYNOPSIS

    npm init [--force|-f|--yes|-y]
    npm init <@scope> (same as `npx <@scope>/create`)
    npm init [<@scope>/]<pkg> (same as `npx [<@scope>/]create-<pkg>`)

## DESCRIPTION

* `npm init [--force|-f|--yes|-y]`:

    This will ask you a bunch of questions, and then write a package.json for
    you.

    It attempts to make reasonable guesses about what you want things to be set
    to, and then writes a package.json file with the options you've selected.

    If you already have a package.json file, it'll read that first, and default
    to the options in there.

    It is strictly additive, so it does not delete options from your
    package.json without a really good reason to do so.

    If you invoke it with `--force`, `-f`, `--yes`, or `-y`, it will use only
    defaults and not prompt you for any options.

* `npm init <@scope>` (same as `npx <@scope>/create`):

    Run `<@scope>/create` as the package initializer instead of
    [`npm-init`](https://www.npmjs.com/package/init-package-json).

* `npm init [<@scope>/]<pkg>` (same as `npx [<@scope>/]create-<pkg>`):

    Run `[<@scope>/]create-<pkg>` as the package initializer instead of
    [`npm-init`](https://www.npmjs.com/package/init-package-json).

## CONFIGURATION

### scope

* Default: none
* Type: String

The scope under which the new module should be created.

## SEE ALSO

* <https://github.com/isaacs/init-package-json>
* package.json(5)
* npm-version(1)
* npm-scope(7)
