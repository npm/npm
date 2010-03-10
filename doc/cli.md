# npm cli todos

Update each function so that it takes an object bag of arguments.  Update the cli.js to parse the user's .npmrc first, and then the arguments, merge the two objects together, and pass the data over to the function.

If something relevant is missing, then each command should provide a "help" menu that lists out what's important for that command.  Doing `npm help foo` should also output the "foo" command documentation.

There needs to be a consistent pattern by which flags and other data is defined and named.
