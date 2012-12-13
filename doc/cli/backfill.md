npm-backfill(1) -- Add installed modules to package.json
========================================================

## SYNOPSIS

    npm backfill

## DESCRIPTION

If you've forgotten to do `npm i <package> --save` when installing packages, or you 
are too lazy to look through your installed packages list, then this command will 
run through each of your installed packages, extract the version and write them to 
your packages.json file.

If you include 'insert' (e.g. npm backfill insert) then the existing packages list is 
not clobbered. Any packages in the list that exist in your package.json file do have 
their version updated however.