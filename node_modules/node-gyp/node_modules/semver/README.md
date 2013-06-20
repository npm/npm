# semver

The semantic versioner for npm.

## Usage

    $ npm install semver

    semver.valid('1.2.3') // true
    semver.valid('a.b.c') // false
    semver.satisfies('1.2.3', '1.x || >=2.5.0 || 5.0.0 - 7.2.3') // true
    semver.gt('1.2.3', '9.8.7') // false
    semver.lt('1.2.3', '9.8.7') // true

As a command-line utility:

    $ semver -h

    Usage: semver -v <version> [-r <range>]
    Test if version(s) satisfy the supplied range(s),
    and sort them.

    Multiple versions or ranges may be supplied.

    Program exits successfully if all versions satisfy all
    ranges and are valid, and prints all satisfying versions.
    If no versions are valid, or ranges are not satisfied,
    then exits failure.

    Versions are printed in ascending order, so supplying
    multiple versions to the utility will just sort them.
