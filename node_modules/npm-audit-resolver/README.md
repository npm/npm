# npm audit resolver

`npm audit` is great. `npm audit fix` is also there if you didn't know. But sometimes you need to manage your security and make decisions about the dependencies you use.

This tool creates a `audit-resolv.json` file in your app and interactively helps you manage security of your dependencies.

** This is experimental, built in a few hours. When using this software you are still responsible for the security of your app **

## Install

Requires npm v6.1.0 installed alongside

```
npm install -g npm-audit-resolver
```

## Usage

Go into the project folder and run

```
resolve-audit
```

It goes through the results of `npm audit` and lets you decide what to do with the issues.
The decisions you make are stored in `audit-resolv.json` to keep track of it in version control and have a log of who decided to do what and when.

### Arguments 

```
--ignoreLow automatically resolve issue to ignored if severity of all vulnerabilities in that dependency is low
```

### Running in CI

One if the problems this solves is running audit as part of your build pipeline.
You don't want to break your CI for a few days waiting to get a fix on a dependency, but at the same time ignoring the whole class of issues or the audit result entirely means you'll rarely notice it at all.

Run
```
check-audit
```

This command will only exit with an error if a human needs to make new decisions about vulnerabilities and commit the `audit-resolv.json` file. If all issues are addressed, your build can pass.

## Features

Want to give it a go? Download this repo and run `npm test`

When a vulnerability is found, you get to choose between the following options:

- fix - Runs the fix proposed by npm audit and makes a note. If the same issue comes back because someone else on the team changed package-lock.json, you'll get a warning about that.
- investigate - If npm audit doesn't suggest a fix, resolver will help you find where the fix could be introduced.
- show details - Prints more information about the issues form the audit and asks what to do again
- remind in 24h - Lets you ignore an issue temporarily to make the build pass until a fix is known
- ignore - Adds the particular dependency paths and advisories to be ignored in the future. If the same issue in the same package comes up, but it's a dependency of another package, it won't get ignored. If a new issue is found in the package, it doesn't get ignored.
- delete - Removes your dependency that brought the vulnerability in its dependencies.
- skip and quit, obviously

audit-resolv.json is formatted, so git history has a trace of who addressed which vulnerability, when and how.

### Why would I ignore security vulnerabilities?

- dev dependencies! a DOS vulnerability in your test runner's dependency is not a showstopper
- build tooling vulnerability
- dependencies of a tool you use very narrowly and can prove it's safe
- new vulnerability without a fix and you want to wait for a fix while running your builds (there's a remind me in 24h option available)
