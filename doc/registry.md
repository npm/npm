# An npm Package Registry

An npm registry is a web site that maintains an internal database of package info (basically just pointers to tarballs/jsons).

Since the goal here affects the steps to get here, which go through the whole "version" hoodah, it's worth sketching out now what this will eventually look like.

## Why tokens instead of passwords

I'm intending to wire up these sorta-restful APIs to a command line tool.  Then, the token can be stored in some safe place (like `~/.npmrc` or something), whereas storing a password would not be good.  It's always possible to add passwords on later, but it might not even be necessary.

## GET Requests

`/`  
Some kind of home page, list of packages, form to create a new package, register, etc.

`/foo`  
list of known versions of foo (html) if it exists

`https://.../foo?ut=1234567890`  (user token == project owner)  
`https://.../foo?pt=0987654321`  (valid project token)  
list of versions of foo, plus tools to manage the project.  (Mostly just forms to facilitate POSTing to the APIs below.)

`/foo/stable`  
`/foo/test`  
302 redirect to a tarball containing either the stable or test version of the package

`/foo/v0.1.24` (semver-compatible tag)  
301 redirect to a tarball containing the 0.1.24 version of the package.  Should be a SemVer-compatible tag.

`/foo/nightly`  
301 redirect to the tarball of the latest code, if there is such a place.  Typically something like `http://github.com/owner/project/tarball/master`.

`https://.../-reset?rt=123456abcdefg&user=bob@foo.com`  (valid reset token & matching user)
Mint a new user token for bob@foo.com, reset all the user tokens on bob@foo.com's packages, and display the new user token, along with a message that bob should save it, because it can't be retrieved, only reset.


## POST Requests

Post requests must be authenticated by the package owner by presenting a user token or a project token, and must be done over HTTPS.

`/`  
body: user=bob@foo.com  
Create a new user account tied to that email address.  If the user account exists already, then error and provide a link to reset your user token.

`/`  
body: user=bob@foo.com&reset=1  
Mint a new "reset token", which is valid for 1 hour, and email it to the address supplied.  If the user account doesn't exist, then error and provide a link to create a new user account.

`/foo`  
body: `create`  
Create the project.  If a project by that name already exists, then it will error.  If it doesn't, then it will be created in the registry with the user as the owner.  The response will redirect to "GET /foo?pt=blah" over HTTPS.

`/foo/stable`  
`/foo/test`  
Post a version tag like "v1.0.3".  If the version isn't in the registry, then it will error.

`/foo/v1.2.3` (semver-compatible tag)  
Post a link to a tarball.  If the version is already in the registry, then it will error.

`/foo/nightly`  
Post a link to a tarball.  If there is already a nightly version of the package, then it will be updated to point at the new location.  However, this should not be done often, as the GET is a 301 redirection.



