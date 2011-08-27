npm-search(1) -- Search for packages
====================================

## SYNOPSIS

    npm search [search terms ...]

## DESCRIPTION

Search the registry for packages matching the search terms. It is possible to
use the following special characters:

 - | means OR
 - & means AND (equivalent to whitespace between two words)
 - () may be used for priority (default: parse left to right)
