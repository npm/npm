npm-audit(1) -- Run a security audit
====================================

## SYNOPSIS

    npm audit 

## DESCRIPTION 

The audit command submits a description of the dependencies configured in
your project to your default registry and asks for a report of known
vulnerabilities.  The report returned includes instructions on how to act on
this information.

## CONTENT SUBMITTED

* npm_version
* node_version
* platform
* node_env
* A scrubbed version of your package-lock.json or npm-shrinkwrap.json

### SCRUBBING

In order to ensure that potentially sensitive information is not included in
the audit data bundle, some dependencies may have their names (and sometimes
versions) replaced with opaque non-reversible identifiers.  It is done for
the following dependency types:

* Any module referencing a scope that is configured for a non-default
  registry has its name scrubbed.  (That is, a scope you did a `npm login --scope=@ourscope` for.)
* All git dependencies have their names and specifiers scrubbed. 
* All remote tarball dependencies have their names and specifiers scrubbed.
* All local directory and tarball dependencies have their names and specifiers scrubbed.

The non-reversible identifiers are a sha256 of a session-specific UUID and the
value being replaced, ensuring a consistent value within the payload that is
different between runs.

## SEE ALSO

* npm-install(1)
* config(7)
