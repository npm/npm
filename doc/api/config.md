npm-config(3) -- Manage the npm configuration file
==================================================

## SYNOPSIS

    npm.commands.config(args, callback)

## DESCRIPTION

This function acts much the same way as the command-line version.  The first
element in the array tells config what to do. Possible values are:

* 'set':
  Sets a config parameter.  The second element in 'args' is interpreted as the
  key, and the third element is interpreted as the value.
* 'get':
  Gets the value of a config parameter. The second element in 'args' is the
  key to get the value of.
* 'delete' ('rm' or 'del'):
  Deletes a parameter from the config. The second element in 'args' is the
  key to delete.
* 'list' ('ls'):
  Show all configs that aren't secret. No parameters necessary.
* 'edit':
  Opens the config file in the default editor. This command isn't very useful
  programmatically, but it is made available.
