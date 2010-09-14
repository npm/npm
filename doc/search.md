npm-search(1) -- List installed packages
======================================

## SYNOPSIS

    npm search

## DESCRIPTION

This command will print to stdout all the versions of packages that are
either installed or available in the registry, with whether
or not they're installed, active, and/or stable by default.

To filter a single package or state, you can provide words to filter on
and highlight (if appropriate).  For instance, to see all the stable
packages, you could do this:

    npm search stable

Another common usage is to find the set of all packages that are
installed. This can be accomplished by doing this:

    npm search installed

Matches may go beyond just using boolean tests and use filters. These filters take a single argument of the following types.

 * Semantic Variable : \d+.\d+.\d+
 * Number : \d+
 * Date : whatever returns a Date from Date.parse()
 * Pattern : /regex/ a regular expression that will be given the flag 'i', you cannot supply the flags
 * String : "..." or '...' or word
 * Boolean : if you do not include test type npm will test if the filter could pass at all

These filters can compare the packages using:

 * Equality : =
   Tests if the package matches the filter exactly (except for patterns, which test for any matches)
 * Inequality : !=
   Inverts the equality test
 * Superiority : >=
   Tests if the package is greater than or equal to the filter
 * Inferiority : <=
   Tests if the package is less than or equal to the filter

### Examples

 * list all packages with an author who's email or name has an 'm'

   npm search author=/m/

 * list all the packages that have a stable version greater than or equal to 1.0.0

   npm search stable>=1.0.0

 * list all packages with authors 'ben' and 'sally'

   npm search author="ben" author="sally"


### Filters

#### name=...

Tests if the name matches the filter

#### author=...

Tests if ANY of the authors match the filter by name or email

#### tag=...

Tests if ANY of the tags match the filter

#### description=...

Tests if the description matches the filter

#### stable=...

Tests if the stable version number of the package matches the filter

#### latest=...

Tests if the latest version number of the package matches the filter

#### created=...

Tests if the time the package was created matches the filter

#### modified=...

Tests if the time the package was modified matches the filter

### Formatting

#### --orderby [sort[-reverse],]

Allows you to sort the list of results in specific orders stabily. Adding '-reverse' to a sort will reverse the sort order. Non-present sorts are ignored. Default sort order is by 'name'.

 * name - sorts alphabetically by name
 * installed - sort with installed packages first
 * active - sort with active packages first
 * stable - sort with stable packages first
 * created - sort chronologically by package creation time
 * modified - sort chronologically by package's last modification time

##### Example

Listing the installed packages first and then sorting by name

    > npm search --orderby installed,name
    fiz installed@0.0.0
    foo installed@0.0.0
    bar
    bat


#### --format

Allows you to template the output format of npm in a mustache.js style templating engine. Unlike mustache.js whitespace is preserved.

##### Additions to mustache.js syntax

 * looping can now do slices w/ [x..y] (akin to Array.slice). 0 indexed.
   , [x..] is from x to the end
   , [..x] is from the start to x
   , [x] is just the element at x
   , negatives are allowed
 * {{|}} is the length of a loop
 * {{@}} is the index of a loop)
 * exterior variables are available to enumerable loops as long as they are not masked

##### Example

    > npm search --format "{{name}} by{{#maintainers}} {{name}},{{/maintainers}}"
    bar by me, you,
    bat by me,
    fiz by you,
    foo by you,