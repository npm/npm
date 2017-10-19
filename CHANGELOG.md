## v5.5.1 (2017-10-04):

A very quick, record time, patch release, of a bug fix to a (sigh) last minute bug fix.

* [`e628e058b`](https://github.com/npm/npm/commit/e628e058b)
  Fix login to properly recognize OTP request and store bearer tokens.
  ([@Rebecca Turner](https://github.com/Rebecca Turner))

## v5.5.0 (2017-10-04):

Hey y'all, this is a big new feature release!  We've got some security
related goodies plus a some quality-of-life improvements for anyone who uses
the public registry (so, virtually everyone).

The changes largely came together in one piece, so I'm just gonna leave the commit line here: 

* [`f6ebf5e8b`](https://github.com/npm/npm/commit/f6ebf5e8bd6a212c7661e248c62c423f2b54d978)
  [`f97ad6a38`](https://github.com/npm/npm/commit/f97ad6a38412581d059108ea29be470acb4fa510)
  [`f644018e6`](https://github.com/npm/npm/commit/f644018e6ef1ff7523c6ec60ae55a24e87a9d9ae)
  [`8af91528c`](https://github.com/npm/npm/commit/8af91528ce6277cd3a8c7ca8c8102671baf10d2f)
  [`346a34260`](https://github.com/npm/npm/commit/346a34260b5fba7de62717135f3e083cc4820853)
  Two factor authentication, profile editing and token management.
  ([@iarna](https://github.com/iarna))

### TWO FACTOR AUTHENTICATION

You can now enable two-factor authentication for your npm account.  You can
even do it from the CLI.  In fact, you have to, for the time being:

```
npm profile enable-tfa
```

With the default two-factor authentication mode you'll be prompted to enter
a one-time password when logging in, when publishing and when modifying access rights to
your modules.

### TOKEN MANAGEMENT

You can now create, list and delete authentication tokens from the comfort
of the command line.  Authentication tokens created this way can have NEW
restrictions placed on them.  For instance, you can create a `read-only`
token to give to your CI.  It will be able to download your private modules
but it won't be able to publish or modify modules.  You can also create
tokens that can only be used from certain network addresses.  This way you
can lock down access to your corporate VPN or other trusted machines.

Deleting tokens isn't new, you could [do it via the
website](https://www.npmjs.com/settings/tokens) but now you can do it via
the CLI as well.

### CHANGE YOUR PASSWORD, SET YOUR EMAIL

You can finally change your password from the CLI with `npm profile set
password`!  You can also update your email address with `npm profile set
email <address>`. If you change your email address we'll send you a new
verification email so you verify that its yours.

### AND EVERYTHING ELSE ON YOUR PROFILE

You can also update all of the other attributes of your profile that
previously you could only update via the website: `fullname`, `homepage`,
`freenode`, `twitter` and `github`.

### AVAILABLE STAND ALONE

All of these features were implemented in a stand alone library, so if you
have use for them in your own project you can find them in
[npm-profile](https://www.npmjs.com/package/npm-profile) on the registry. 
There's also a little mini-cli written just for it at
[npm-profile-cli](https://www.npmjs.com/package/npm-profile-cli).  You might
also be interested in the [API
documentation](https://github.com/npm/registry/tree/master/docs) for these
new features: [user profile editing](https://github.com/npm/registry/blob/master/docs/user/profile.md) and
[authentication](https://github.com/npm/registry/blob/master/docs/user/authentication.md).

### BUG FIXES

* [`5ee55dc71`](https://github.com/npm/npm/commit/5ee55dc71b8b74b8418c3d5ec17483a07b3b6777)
  install.sh: Drop support for upgrading from npm@1 as npm@5 can't run on
  any Node.js version that ships npm@1. This fixes an issue some folks were seeing when trying
  to upgrade using `curl | http://npmjs.com/install.sh`.
  ([@iarna](https://github.com/iarna))
* [`5cad1699a`](https://github.com/npm/npm/commit/5cad1699a7a0fc85ac7f77a95087a9647f75e344)
  `npm-lifecycle@1.0.3` Fix a bug where when more than one lifecycle script
  got queued to run, npm would crash.
  ([@zkat](https://github.com/zkat))
* [`cd256cbb2`](https://github.com/npm/npm/commit/cd256cbb2f97fcbcb82237e94b66eac80e493626)
  `npm-packlist@1.1.9` Fix a bug where test directories would always be
  excluded from published modules.
  ([@isaacs](https://github.com/isaacs))
* [`2a11f0215`](https://github.com/npm/npm/commit/2a11f021561acb1eb1ad4ad45ad955793b1eb4af)
  Fix formatting of unsupported version warning
  ([@iarna](https://github.com/iarna))

### DEPENDENCY UPDATES

* [`6d2a285a5`](https://github.com/npm/npm/commit/6d2a285a58655f10834f64d38449eb1f3c8b6c47)
  `npm-registry-client@8.5.0`
* [`69e64e27b`](https://github.com/npm/npm/commit/69e64e27bf58efd0b76b3cf6e8182c77f8cc452f)
  `request@2.83.0`
* [`34e0f4209`](https://github.com/npm/npm/commit/34e0f42090f6153eb5462f742e402813e4da56c8)
  `abbrev@1.1.1`
* [`10d31739d`](https://github.com/npm/npm/commit/10d31739d39765f1f0249f688bd934ffad92f872)
  `aproba@1.2.0`
* [`2b02e86c0`](https://github.com/npm/npm/commit/2b02e86c06cf2a5fe7146404f5bfd27f190ee4f4)
  `meant@1.0.1`
* [`b81fff808`](https://github.com/npm/npm/commit/b81fff808ee269361d3dcf38c1b6019f1708ae02)
  `rimraf@2.6.2`:
  Fixes a long standing bug in rimraf's attempts to work around Windows limitations
  where it owns a file and can change its perms but can't remove it without
  first changing its perms. This _may_ be an improvement for Windows users of npm under
  some circumstances.
  ([@isaacs](https://github.com/isaacs))

## v5.4.2 (2017-09-14):

This is a small bug fix release wrapping up most of the issues introduced with 5.4.0.

### Bugs

* [`0b28ac72d`](https://github.com/npm/npm/commit/0b28ac72d29132e9b761717aba20506854465865)
  [#18458](https://github.com/npm/npm/pull/18458)
  Fix a bug on Windows where rolling back of failed optional dependencies would fail.
  ([@marcins](https://github.com/marcins))
* [`3a1b29991`](https://github.com/npm/npm/commit/3a1b299913ce94fdf25ed3ae5c88fe6699b04e24)
  `write-file-atomic@2.1.0` Revert update of `write-file-atomic`. There were changes made to it
  that were resulting in EACCES errors for many users.
  ([@iarna](https://github.com/iarna))
* [`cd8687e12`](https://github.com/npm/npm/commit/cd8687e1257f59a253436d69e8d79a29c85d00c8)
  Fix a bug where if npm decided it needed to move a module during an upgrade it would strip
  out much of the `package.json`. This would result in broken trees after package updates.
* [`5bd0244ee`](https://github.com/npm/npm/commit/5bd0244eec347ce435e88ff12148c35da7c69efe)
  [#18385](https://github.com/npm/npm/pull/18385)
  Fix `npm outdated` when run on non-registry dependencies. 
  ([@joshclow](https://github.com/joshclow))
  ([@iarna](https://github.com/iarna))

### Ux

* [`339f17b1e`](https://github.com/npm/npm/commit/339f17b1e6816eccff7df97875db33917eccdd13)
  Report unsupported node versions with greater granularity.
  ([@iarna](https://github.com/iarna))

### Docs

* [`b2ab6f43b`](https://github.com/npm/npm/commit/b2ab6f43b8ae645134238acd8dd3083e5ba8846e)
  [#18397](https://github.com/npm/npm/pull/18397)
  Document that the default loglevel with `npm@5` is `notice`.
  ([@KenanY](https://github.com/KenanY))
* [`e5aedcd82`](https://github.com/npm/npm/commit/e5aedcd82af81fa9e222f9210f6f890c72a18dd3)
  [#18372](https://github.com/npm/npm/pull/18372)
  In npm-config documentation, note that env vars use \_ in place of -.
  ([@jakubholynet](https://github.com/jakubholynet))

## v5.4.1 (2017-09-06):

This is a very small bug fix release to fix a problem where permissions on
installed binaries were being set incorrectly.

* [`767ff6eee`](https://github.com/npm/npm/commit/767ff6eee7fa3a0f42ad677dedc0ec1f0dc15e7c)
  [zkat/pacote#117](https://github.com/zkat/pacote/pull/117)
  [#18324](https://github.com/npm/npm/issues/18324)
  `pacote@6.0.2`
  ([@zkat](https://github.com/zkat))

## v5.4.0 (2017-08-22):

Here's another ~~small~~ big release, with a ~~handful~~ bunch of fixes and
a couple of ~~small~~ new features! This release has been incubating rather
longer than usual and it's grown quite a bit in that time. I'm also excited
to say that it has contributions from **27** different folks, which is a new
record for us. Our previous record was 5.1.0 at 21. Before that the record
had been held by 1.3.16 since _December of 2013_.

![chart of contributor counts by version, showing an increasing rate over time and spikes mid in the 1.x series and later at 5.x](https://pbs.twimg.com/media/DH38rbZUwAAf9hS.jpg)

If you can't get enough of the bleeding edge, I encourage you to check out
our canary release of npm. Get it with `npm install -g npmc`. It's going to
be seeing some exciting stuff in the next couple of weeks, starting with a
rewriten `npm dedupe`, but moving on to… well, you'll just have to wait and
find out.

### PERFORMANCE

* [`d080379f6`](https://github.com/npm/npm/commit/d080379f620c716afa2c1d2e2ffc0a1ac3459194)
  `pacote@6.0.1` Updates extract to use tar@4, which is much faster than the
  older tar@2. It reduces install times by as much as 10%.
  ([@zkat](https://github.com/zkat))
* [`4cd6a1774`](https://github.com/npm/npm/commit/4cd6a1774f774506323cae5685c9ca9a10deab63)
  [`0195c0a8c`](https://github.com/npm/npm/commit/0195c0a8cdf816834c2f737372194ddc576c451d)
  [#16804](https://github.com/npm/npm/pull/16804)
  `tar@4.0.1` Update publish to use tar@4. tar@4 brings many advantages
  over tar@2: It's faster, better tested and easier to work with.  It also
  produces exactly the same byte-for-byte output when producing tarballs
  from the same set of files.  This will have some nice carry on effects for
  things like caching builds from git.  And finally, last but certainly not
  least, upgrading to it also let's us finally eliminate `fstream`—if
  you know what that is you'll know why we're so relieved.
  ([@isaacs](https://github.com/isaacs))

### FEATURES

* [`1ac470dd2`](https://github.com/npm/npm/commit/1ac470dd283cc7758dc37721dd6331d5b316dc99)
  [#10382](https://github.com/npm/npm/pull/10382)
  If you make a typo when writing a command now, npm will print a brief "did you
  mean..." message with some possible alternatives to what you meant.
  ([@watilde](https://github.com/watilde))
* [`20c46228d`](https://github.com/npm/npm/commit/20c46228d8f9243910f8c343f4830d52455d754e)
  [#12356](https://github.com/npm/npm/pull/12356)
  When running lifecycle scripts, `INIT_CWD` will now contain the original
  working directory that npm was executed from. Remember that you can use `npm
  run-script` even if you're not inside your package root directory!
  ([@MichaelQQ](https://github.com/MichaelQQ))
* [`be91e1726`](https://github.com/npm/npm/commit/be91e1726e9c21c4532723e4f413b73a93dd53d1)
  [`4e7c41f4a`](https://github.com/npm/npm/commit/4e7c41f4a29744a9976cc22c77eee9d44172f21e)
  `libnpx@9.6.0`: Fixes a number of issues on Windows and adds support for
  several more languages: Korean, Norwegian (bokmål and nynorsk), Ukrainian,
  Serbian, Bahasa Indonesia, Polish, Dutch and Arabic.
  ([@zkat](https://github.com/zkat))
* [`2dec601c6`](https://github.com/npm/npm/commit/2dec601c6d5a576751d50efbcf76eaef4deff31e)
  [#17142](https://github.com/npm/npm/pull/17142)
  Add the new `commit-hooks` option to `npm version` so that you can disable commit
  hooks when committing the version bump.
  ([@faazshift](https://github.com/faazshift))
* [`bde151902`](https://github.com/npm/npm/commit/bde15190230b5c62dbd98095311eab71f6b52321)
  [#14461](https://github.com/npm/npm/pull/14461)
  Make output from `npm ping` clear as to its success or failure.
  ([@legodude17](https://github.com/legodude17))

### BUGFIXES

* [`b6d5549d2`](https://github.com/npm/npm/commit/b6d5549d2c2d38dd0e4319c56b69ad137f0d50cd)
  [#17844](https://github.com/npm/npm/pull/17844)
  Make package-lock.json sorting locale-agnostic. Previously, sorting would vary
  by locale, due to using `localeCompare` for key sorting.  This'll give you
  a little package-lock.json churn as it reshuffles things, sorry!
  ([@LotharSee](https://github.com/LotharSee))
* [`44b98b9dd`](https://github.com/npm/npm/commit/44b98b9ddcfcccf68967fdf106fca52bf0c3da4b)
  [#17919](https://github.com/npm/npm/pull/17919)
  Fix a crash where `npm prune --production` would fail while removing `.bin`.
  ([@fasterthanlime](https://github.com/fasterthanlime))
* [`c3d1d3ba8`](https://github.com/npm/npm/commit/c3d1d3ba82aa41dfb2bd135e6cdc59f8d33cd9fb)
  [#17816](https://github.com/npm/npm/pull/17816)
  Fail more smoothly when attempting to install an invalid package name.
  ([@SamuelMarks](https://github.com/SamuelMarks))
* [`55ac2fca8`](https://github.com/npm/npm/commit/55ac2fca81bf08338302dc7dc2070494e71add5c)
  [#12784](https://github.com/npm/npm/pull/12784)
  Guard against stack overflows when marking packages as failed.
  ([@vtravieso](https://github.com/vtravieso))
* [`597cc0e4b`](https://github.com/npm/npm/commit/597cc0e4b5e6ee719014e3171d4e966df42a275c)
  [#15087](https://github.com/npm/npm/pull/15087)
  Stop outputting progressbars or using color on dumb terminals.
  ([@iarna](https://github.com/iarna))
* [`7a7710ba7`](https://github.com/npm/npm/commit/7a7710ba72e6f82414653c2e7e91fea9a1aba7e2)
  [#15088](https://github.com/npm/npm/pull/15088)
  Don't exclude modules that are both dev & prod when using `npm ls --production`.
  ([@iarna](https://github.com/iarna))
* [`867df2b02`](https://github.com/npm/npm/commit/867df2b0214689822b87b51578e347f353be97e8)
  [#18164](https://github.com/npm/npm/pull/18164)
  Only do multiple procs on OSX for now. We've seen a handful of issues
  relating to this in Docker and in on Windows with antivirus.
  ([@zkat](https://github.com/zkat))
* [`23540af7b`](https://github.com/npm/npm/commit/23540af7b0ec5f12bbdc1558745c8c4f0861042b)
  [#18117](https://github.com/npm/npm/pull/18117)
  Some package managers would write spaces to the \_from field in package.json's in the
  form of `name @spec`. This was causing npm to fail to interpret them. We now handle that
  correctly and doubly make sure we don't do that ourselves.
  ([@IgorNadj](https://github.com/IgorNadj))
* [`0ef320cb4`](https://github.com/npm/npm/commit/0ef320cb40222693b7367b97c60ddffabc2d58c5)
  [#16634](https://github.com/npm/npm/pull/16634)
  Convert any bin script with a shbang a the start to Unix line-endings. (These sorts of scripts
  are not compatible with Windows line-endings even on Windows.)
  ([@ScottFreeCode](https://github.com/ScottFreeCode))
* [`71191ca22`](https://github.com/npm/npm/commit/71191ca2227694355c49dfb187104f68df5126bd)
  [#16476](https://github.com/npm/npm/pull/16476)
  `npm-lifecycle@1.0.2` Running an install with `--ignore-scripts` was resulting in the
  the package object being mutated to have the lifecycle scripts removed from it and that
  in turn was being written out to disk, causing further problems. This fixes that:
  No more mutation, no more unexpected changes.
  ([@addaleax](https://github.com/addaleax))
* [`459fa9d51`](https://github.com/npm/npm/commit/459fa9d51600904ee75ed6267b159367a1209793)
  [npm/read-package-json#74](https://github.com/npm/read-package-json/pull/74)
  [#17802](https://github.com/npm/npm/pull/17802)
  `read-package-json@2.0.1` Use unix-style slashes for generated bin
  entries, which lets them be cross platform even when produced on Windows.
  ([@iarna](https://github.com/iarna))
* [`5ec72ab5b`](https://github.com/npm/npm/commit/5ec72ab5b27c5c83cee9ff568cf75a9479d4b83a)
  [#18229](https://github.com/npm/npm/pull/18229)
  Make install.sh find nodejs on debian.
  ([@cebe](https://github.com/cebe))

### DOCUMENTATION

* [`b019680db`](https://github.com/npm/npm/commit/b019680db78ae0a6dff2289dbfe9f61fccbbe824)
  [#10846](https://github.com/npm/npm/pull/10846)
  Remind users that they have to install missing `peerDependencies` manually.
  ([@ryanflorence](https://github.com/ryanflorence))
* [`3aee5986a`](https://github.com/npm/npm/commit/3aee5986a65add2f815b24541b9f4b69d7fb445f)
  [#17898](https://github.com/npm/npm/pull/17898)
  Minor punctuation fixes to the README.
  ([@AndersDJohnson](https://github.com/AndersDJohnson))
* [`e0d0a7e1d`](https://github.com/npm/npm/commit/e0d0a7e1dda2c43822b17eb71f4d51900575cc61)
  [#17832](https://github.com/npm/npm/pull/17832)
  Fix grammar, format, and spelling in documentation for `run-script`.
  ([@simonua](https://github.com/simonua))
* [`3fd6a5f2f`](https://github.com/npm/npm/commit/3fd6a5f2f8802a9768dba2ec32c593b5db5a878d)
  [#17897](https://github.com/npm/npm/pull/17897)
  Add more info about using `files` with `npm pack`/`npm publish`.
  ([@davidjgoss](https://github.com/davidjgoss))
* [`f00cdc6eb`](https://github.com/npm/npm/commit/f00cdc6eb90a0735bc3c516720de0b1428c79c31)
  [#17785](https://github.com/npm/npm/pull/17785)
  Add a note about filenames for certificates on Windows, which use a different
  extension and file type.
  ([@lgp1985](https://github.com/lgp1985))
* [`0cea6f974`](https://github.com/npm/npm/commit/0cea6f9741243b1937abfa300c2a111d9ed79143)
  [#18022](https://github.com/npm/npm/pull/18022)
  Clarify usage for the `files` field in `package.json`.
  ([@xcambar](https://github.com/xcambar))
* [`a0fdd1571`](https://github.com/npm/npm/commit/a0fdd15710971234cbc57086cd1a4dc037a39471)
  [#15234](https://github.com/npm/npm/pull/15234)
  Clarify the behavior of the `files` array in the package-json docs.
  ([@jbcpollak](https://github.com/jbcpollak))
* [`cecd6aa5d`](https://github.com/npm/npm/commit/cecd6aa5d4dd04af765b26b749c1cd032f7eb913)
  [#18137](https://github.com/npm/npm/pull/18137)
  Clarify interaction between npmignore and files in package.json.
  ([@supertong](https://github.com/supertong))
* [`6b8972039`](https://github.com/npm/npm/commit/6b89720396767961001e727fc985671ce88b901b)
  [#18044](https://github.com/npm/npm/pull/18044)
  Corrected the typo in package-locks docs.
  ([@vikramnr](https://github.com/vikramnr))
* [`6e012924f`](https://github.com/npm/npm/commit/6e012924f99c475bc3637c86ab6a113875405fc7)
  [#17667](https://github.com/npm/npm/pull/17667)
  Fix description of package.json in npm-scripts docs.
  ([@tripu](https://github.com/tripu))

### POSSIBLY INTERESTING DEPENDENCY UPDATES

* [`48d84171a`](https://github.com/npm/npm/commit/48d84171a302fde2510b3f31e4a004c5a4d39c73)
  [`f60b05d63`](https://github.com/npm/npm/commit/f60b05d6307a7c46160ce98d6f3ccba89411c4ba)
  `semver@5.4.1` Perf improvements.
  ([@zkat](https://github.com/zkat))
* [`f4650b5d4`](https://github.com/npm/npm/commit/f4650b5d4b2be2c04c229cc53aa930e260af9b4e)
  `write-file-atomic@2.3.0`:
  Serialize writes to the same file so that results are deterministic.
  Cleanup tempfiles when process is interrupted or killed.
  ([@ferm10n](https://github.com/ferm10n))
  ([@iarna](https://github.com/iarna))

### CHORES

* [`96d78df98`](https://github.com/npm/npm/commit/96d78df9843187bc53be2c93913e8567003ccb73)
  [`80e2f4960`](https://github.com/npm/npm/commit/80e2f4960691bc5dbd8320002e4d9143784b9ce9)
  [`4f49f687b`](https://github.com/npm/npm/commit/4f49f687bbd54b6a0e406936ae35593d8e971e1e)
  [`07d2296b1`](https://github.com/npm/npm/commit/07d2296b10e3d8d6f079eba3a61f0258501d7161)
  [`a267ab430`](https://github.com/npm/npm/commit/a267ab4309883012a9d55934533c5915e9842277)
  [#18176](https://github.com/npm/npm/pull/18176)
  [#18025](https://github.com/npm/npm/pull/18025)
  Move the lifecycle code out of npm into a separate library,
  [`npm-lifecycle`](https://github.com/npm/lifecycle). Shh, I didn't tell you this, but this
  portends to some pretty cool stuff to come very soon now.
  ([@mikesherov](https://github.com/mikesherov))
* [`0933c7eaf`](https://github.com/npm/npm/commit/0933c7eaf9cfcdf56471fe4e71c403e2016973da)
  [#18025](https://github.com/npm/npm/pull/18025)
  Force Travis to use Precise instead of Trusty.  We have issues with our
  couchdb setup and Trusty.  =/
  ([@mikesherov](https://github.com/mikesherov))
* [`afb086230`](https://github.com/npm/npm/commit/afb086230223f3c4fcddee4e958d18fce5db0ff9)
  [#18138](https://github.com/npm/npm/pull/18138)
  Fix typos in files-and-ignores test.
  ([@supertong](https://github.com/supertong))
* [`3e6d11cde`](https://github.com/npm/npm/commit/3e6d11cde096b4ee7b07e7569b37186aa2115b1a)
  [#18175](https://github.com/npm/npm/pull/18175)
  Update dependencies to eliminate transitive dependencies with the WTFPL license, which
  some more serious corporate lawyery types aren't super comfortable with.
  ([@zkat](https://github.com/zkat))
* [`ee4c9bd8a`](https://github.com/npm/npm/commit/ee4c9bd8ae574a0d6b24725ba6c7b718d8aaad8d)
  [#16474](https://github.com/npm/npm/pull/16474)
  The tests in `test/tap/lifecycle-signal.js`, as well as the features
  they are testing, are partially broken. This moves them from
  being skipped in CI to being disabled only for certain platforms.
  In particular, because `npm` spawns its lifecycle scripts in a
  shell, signals are not necessarily forwarded by the shell and
  won’t cause scripts to exit; also, shells may report the signal
  they receive using their exit status, rather than terminating
  themselves with a signal.
  ([@addaleax](https://github.com/addaleax))
* [`9462e5d9c`](https://github.com/npm/npm/commit/9462e5d9cfbaa50218de6d0a630d6552e72ad0a8)
  [#16547](https://github.com/npm/npm/pull/16547)
  Remove unused file: bin/read-package-json.js
  ([@metux](https://github.com/metux))
* [`0756d687d`](https://github.com/npm/npm/commit/0756d687d4ccfcd4a7fd83db0065eceb9261befb)
  [#16550](https://github.com/npm/npm/pull/16550)
  The build tools for the documentation need to be built/installed
  before the documents, even with parallel builds.
  Make has a simple mechanism which was made exactly for that:
  target dependencies.
  ([@metux](https://github.com/metux))

## v5.3.0 (2017-07-12):

As mentioned before, we're continuing to do relatively rapid, smaller releases
as we keep working on stomping out `npm@5` issues! We've made a lot of progress
since 5.0 already, and this release is no exception.

### FEATURES

* [`1e3a46944`](https://github.com/npm/npm/commit/1e3a469448b5db8376e6f64022c4c0c78cdb1686)
  [#17616](https://github.com/npm/npm/pull/17616)
  Add `--link` filter option to `npm ls`.
  ([@richardsimko](https://github.com/richardsimko))
* [`33df0aaa`](https://github.com/npm/npm/commit/33df0aaaa7271dac982b86f2701d10152c4177c8)
  `libnpx@9.2.0`:
  * 4 new languages - Czech, Italian, Turkish, and Chinese (Traditional)! This means npx is available in 14 different languages!
  * New --node-arg option lets you pass CLI arguments directly to node when the target binary is found to be a Node.js script.
  ([@zkat](https://github.com/zkat))

### BUGFIXES

* [`33df0aaa`](https://github.com/npm/npm/commit/33df0aaaa7271dac982b86f2701d10152c4177c8)
  `libnpx@9.2.0`:
  * npx should now work on (most) Windows installs. A couple of issues remain.
  * Prevent auto-fallback from going into an infinite loop when npx disappears.
  * `npx npx npx npx npx npx npx npx` works again.
  * `update-notifier` will no longer run for the npx bundled with npm.
  * `npx <cmd>` in a subdirectory of your project should be able to find your `node_modules/.bin` now. Oops
  ([@zkat](https://github.com/zkat))
* [`8e979bf80`](https://github.com/npm/npm/commit/8e979bf80fb93233f19db003f08443e26cfc5e64)
  Revert change where npm stopped flattening modules that required peerDeps.
  This caused problems because folks were using peer deps to indicate that the
  target of the peer dep needed to be able to require the dependency and had
  been relying on the fact that peer deps didn't change the shape of the tree
  (as of npm@3).
  The fix that will actually work for people is for a peer dep to insist on
  never being installed deeper than the the thing it relies on.  At the moment
  this is tricky because the thing the peer dep relies on may not yet have
  been added to the tree, so we don't know where it is.
  ([@iarna](https://github.com/iarna))
* [`7f28a77f3`](https://github.com/npm/npm/commit/7f28a77f33ef501065f22e8d5e8cffee3195dccd)
  [#17733](https://github.com/npm/npm/pull/17733)
  Split remove and unbuild actions into two to get uninstall lifecycles and the
  removal of transitive symlinks during uninstallation to run in the right
  order.
  ([@iarna](https://github.com/iarna))
* [`637f2548f`](https://github.com/npm/npm/commit/637f2548facae011eebf5e5c38bfe56a6c2db9fa)
  [#17748](https://github.com/npm/npm/pull/17748)
  When rolling back use symlink project-relative path, fixing some issues with
  `fs-vacuum` getting confused while removing symlinked things.
  ([@iarna](https://github.com/iarna))
* [`f153b5b22`](https://github.com/npm/npm/commit/f153b5b22f647d4d403f5b8cecd2ce63ac75b07c)
  [#17706](https://github.com/npm/npm/pull/17706)
  Use semver to compare node versions in npm doctor instead of plain `>`
  comparison.
  ([@leo-shopify](https://github.com/leo-shopify))
* [`542f7561`](https://github.com/npm/npm/commit/542f7561d173eca40eb8d838a16a0ed582fef989)
  [#17742](https://github.com/npm/npm/pull/17742)
  Fix issue where `npm version` would sometimes not commit package-locks.
  ([@markpeterfejes](https://github.com/markpeterfejes))
* [`51a9e63d`](https://github.com/npm/npm/commit/51a9e63d31cb5ac52259dcf1c364004286072426)
  [#17777](https://github.com/npm/npm/pull/17777)
  Fix bug exposed by other bugfixes where the wrong package would be removed.
  ([@iarna](https://github.com/iarna))

### DOCUMENTATION

Have we mentioned we really like documentation patches? Keep sending them in!
Small patches are just fine, and they're a great way to get started contributing
to npm!

* [`fb42d55a9`](https://github.com/npm/npm/commit/fb42d55a9a97afa5ab7db38b3b99088cf68684ea)
  [#17728](https://github.com/npm/npm/pull/17728)
  Document semver git urls in package.json docs.
  ([@sankethkatta](https://github.com/sankethkatta))
* [`f398c700f`](https://github.com/npm/npm/commit/f398c700fb0f2f3665ebf45995a910ad16cd8d05)
  [#17684](https://github.com/npm/npm/pull/17684)
  Tweak heading hierarchy in package.json docs.
  ([@sonicdoe](https://github.com/sonicdoe))
* [`d5ad65e50`](https://github.com/npm/npm/commit/d5ad65e50a573cdf9df4155225e869cd6c88ca5e)
  [#17691](https://github.com/npm/npm/pull/17691)
  Explicitly document `--no-save` flag for uninstall.
  ([@timneedham](https://github.com/timneedham))

## v5.2.0 (2017-07-05):

It's only been a couple of days but we've got some bug fixes we wanted to
get out to you all.  We also believe that
[`npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is ready to be bundled
with npm, which we're really excited about!

### npx!!!

npx is a tool intended to help round out the experience of using packages
from the npm registry — the same way npm makes it super easy to install and
manage dependencies hosted on the registry, npx is meant to make it easy to
use CLI tools and other executables hosted on the registry.  It greatly
simplifies a number of things that, until now, required a bit of ceremony to
do with plain npm.

![](https://cdn-images-1.medium.com/max/1600/1*OlIRsvVO5aK7ja9HmwXz_Q.gif)

[@zkat](https://github.com/zkat) has a [great introduction post to npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b)
that I highly recommend you give a read

* [`fb040bee0`](https://github.com/npm/npm/commit/fb040bee0710759c60e45bf8fa2a3b8ddcf4212a)
  [#17685](https://github.com/npm/npm/pull/17685)
  Bundle npx with npm itself.
  ([@zkat](https://github.com/zkat))

### BUG FIXES

* [`9fe905c39`](https://github.com/npm/npm/commit/9fe905c399d07a3c00c7b22035ddb6b7762731e6)
  [#17652](https://github.com/npm/npm/pull/17652)
  Fix max callstack exceeded loops with trees with circular links.
  ([@iarna](https://github.com/iarna))
* [`c0a289b1b`](https://github.com/npm/npm/commit/c0a289b1ba6b99652c43a955b23acbf1de0b56ae)
  [#17606](https://github.com/npm/npm/pull/17606)
  Make sure that when write package.json and package-lock.json we always use unix path separators.
  ([@Standard8](https://github.com/Standard8))
* [`1658b79ca`](https://github.com/npm/npm/commit/1658b79cad89ccece5ae5ce3c2f691d44b933116)
  [#17654](https://github.com/npm/npm/pull/17654)
  Make `npm outdated` show results for globals again. Previously it never thought they were out of date.
  ([@iarna](https://github.com/iarna))
* [`06c154fd6`](https://github.com/npm/npm/commit/06c154fd653d18725d2e760ba825d43cdd807420)
  [#17678](https://github.com/npm/npm/pull/17678)
  Stop flattening modules that have peer dependencies.  We're making this
  change to support scenarios where the module requiring a peer dependency
  is flattened but the peer dependency itself is not, due to conflicts.  In
  those cases the module requiring the peer dep can't be flattened past the
  location its peer dep was placed in.  This initial fix is naive, never
  flattening peer deps, and we can look into doing something more
  sophisticated later on.
  ([@iarna](https://github.com/iarna))
* [`88aafee8b`](https://github.com/npm/npm/commit/88aafee8b5b232b7eeb5690279a098d056575791)
  [#17677](https://github.com/npm/npm/pull/17677)
  There was an issue where updating a flattened dependency would sometimes
  unflatten it.  This only happened when the dependency had dependencies
  that in turn required the original dependency.
  ([@iarna](https://github.com/iarna))
* [`b58ec8eab`](https://github.com/npm/npm/commit/b58ec8eab3b4141e7f1b8b42d8cc24f716a804d8)
  [#17626](https://github.com/npm/npm/pull/17626)
  Integrators who were building their own copies of npm ran into issues because
  `make install` and https://npmjs.com/install.sh weren't aware that
  `npm install` creates links now when given a directory to work on. This does not impact folks
  installing npm with `npm install -g npm`.
  ([@iarna](https://github.com/iarna))

### DOC FIXES

* [`10bef735e`](https://github.com/npm/npm/commit/10bef735e825acc8278827d34df415dfcd8c67d4)
  [#17645](https://github.com/npm/npm/pull/17645)
  Fix some github issue links in the 5.1.0 changelog
  ([@schmod](https://github.com/schmod))
* [`85fa9dcb2`](https://github.com/npm/npm/commit/85fa9dcb2f0b4f51b515358e0184ec82a5845227)
  [#17634](https://github.com/npm/npm/pull/17634)
  Fix typo in package-lock docs.
  ([@sonicdoe](https://github.com/sonicdoe))
* [`688699bef`](https://github.com/npm/npm/commit/688699befc2d147288c69a9405fb8354ecaebe36)
  [#17628](https://github.com/npm/npm/pull/17628)
  Recommend that folks looking for support join us on https://package.community/ or message
  [@npm_support](https://twitter.com/npm_support) on Twitter.
  ([@strugee](https://github.com/strugee))


## v5.1.0 (2017-07-05):

Hey y'all~

We've got some goodies for you here, including `npm@5`'s first semver-minor
release! This version includes a huge number of fixes, particularly for some of
the critical bugs users were running into after upgrading npm. You should
overall see a much more stable experience, and we're going to continue hacking
on fixes for the time being. Semver-major releases, specially for tools like
npm, are bound to cause some instability, and getting `npm@5` stable is the CLI
team's top priority for now!

Not that bugfixes are the only things that landed, either: between improvements
that fell out of the bugfixes, and some really cool work by community members
like [@mikesherov](https://github.com/mikesherov), `npm@5.1.0` is **_twice as
fast_** as `npm@5.0.0` in some benchmarks. We're not stopping there, either: you
can expect a steady stream of speed improvements over the course of the year.
It's not _top_ priority, but we'll keep doing what we can to make sure npm saves
its users as much time as possible.

Hang on to your seats. At **100 commits**, this release is a bit of a doozy. 😎

### FEATURES

Semver-minor releases, of course, mean that there's a new feature somewhere,
right? Here's what's bumping that number for us this time:

* [`a09c1a69d`](https://github.com/npm/npm/commit/a09c1a69df05b753464cc1272cdccc6af0f4da5a)
  [#16687](https://github.com/npm/npm/pull/16687)
  Allow customizing the shell used to execute `run-script`s.
  ([@mmkal](https://github.com/mmkal))
* [`4f45ba222`](https://github.com/npm/npm/commit/4f45ba222e2ac6dbe6d696cb7a8e678bbda7c839) [`a48958598`](https://github.com/npm/npm/commit/a489585985540deed4edc03418636c9e97aa9e40) [`901bef0e1`](https://github.com/npm/npm/commit/901bef0e1ea806fc08d8d58744a9f813b6c020ab)
  [#17508](https://github.com/npm/npm/pull/17508)
  Add a new `requires` field to `package-lock.json` with information about the
  _logical_ dependency tree. This includes references to the specific version
  each package is intended to see, and can be used for many things, such as
  [converting `package-lock.json` to other lockfile
  formats](https://twitter.com/maybekatz/status/880578566907248640), various
  optimizations, and verifying correctness of a package tree.
  ([@iarna](https://github.com/iarna))
* [`47e8fc8eb`](https://github.com/npm/npm/commit/47e8fc8eb9b5faccef9e03ab991cf37458c16249)
  [#17508](https://github.com/npm/npm/pull/17508)
  Make `npm ls` take package locks (and shrinkwraps) into account. This means
  `npm ls` can now be used to see [which dependencies are
  missing](https://twitter.com/maybekatz/status/880446509547794437), so long as
  a package lock has been previously generated with it in.
  ([@iarna](https://github.com/iarna))
* [`f0075e7ca`](https://github.com/npm/npm/commit/f0075e7caa3e151424a254d7809ae4489ed8df90)
  [#17508](https://github.com/npm/npm/pull/17508)
  Take `package.json` changes into account when running installs -- if you
  remove or add a dependency to `package.json` manually, npm will now pick that
  up and update your tree and package lock accordingly.
  ([@iarna](https://github.com/iarna))
* [`83a5455aa`](https://github.com/npm/npm/commit/83a5455aac3c5cc2511ab504923b652b13bd66a0)
  [#17205](https://github.com/npm/npm/pull/17205)
  Add `npm udpate` as an alias for `npm update`, for symmetry with
  `install`/`isntall`.
  ([@gdassori](https://github.com/gdassori))
* [`57225d394`](https://github.com/npm/npm/commit/57225d394b6174eb0be48393d8e18da0991f67b6)
  [#17120](https://github.com/npm/npm/pull/17120)
  npm will no longer warn about `preferGlobal`, and the option is now
  deprecated.
  ([@zkat](https://github.com/zkat))
* [`82df7bb16`](https://github.com/npm/npm/commit/82df7bb16fc29c47a024db4a8c393e55f883744b)
  [#17351](https://github.com/npm/npm/pull/17351)
  As some of you may already know `npm build` doesn't do what a lot of people
  expect: It's mainly an npm plumbing command, and is part of the more familiar
  `npm rebuild` command. That said, a lot of users assume that this is the way
  to run an npm `run-script` named `build`, which is an incredibly common script
  name to use. To clarify things for users, and encourage them to use `npm run
  build` instead, npm will now warn if `npm build` is run without any arguments.
  ([@lennym](https://github.com/lennym))

### PERFORMANCE

* [`59f86ef90`](https://github.com/npm/npm/commit/59f86ef90a58d8dc925c9613f1c96e68bee5ec7b) [`43be9d222`](https://github.com/npm/npm/commit/43be9d2222b23ebb0a427ed91824ae217e6d077a) [`e906cdd98`](https://github.com/npm/npm/commit/e906cdd980b4722e66618ce295c682b9a8ffaf8f)
  [#16633](https://github.com/npm/npm/pull/16633)
  npm now parallelizes tarball extraction across multiple child process workers.
  This can significantly speed up installations, specially when installing from
  cache, and will improve with number of processors.
  ([@zkat](https://github.com/zkat))
* [`e0849878d`](https://github.com/npm/npm/commit/e0849878dd248de8988c2ef3fc941054625712ca)
  [#17441](https://github.com/npm/npm/pull/17441)
  Avoid building environment for empty lifecycle scripts. This change alone
  accounted for as much as a 15% speed boost for npm installations by outright
  skipping entire steps of the installer when not needed.
  ([@mikesherov](https://github.com/mikesherov))
* [`265c2544c`](https://github.com/npm/npm/commit/265c2544c8ded10854909243482e6437ed03c261)
  [npm/hosted-git-info#24](https://github.com/npm/hosted-git-info/pull/24)
  `hosted-git-info@2.5.0`: Add caching to `fromURL`, which gets called many,
  many times by the installer. This improved installation performance by around
  10% on realistic application repositories.
  ([@mikesherov](https://github.com/mikesherov))
* [`901d26cb`](https://github.com/npm/npm/commit/901d26cb656e7e773d9a38ef4eac9263b95e07c8)
  [npm/read-package-json#20](https://github.com/npm/read-package-json/pull/70)
  `read-package-json@2.0.9`: Speed up installs by as much as 20% by
  reintroducing a previously-removed cache and making it actually be correct
  this time around.
  ([@mikesherov](https://github.com/mikesherov))
* [`44e37045d`](https://github.com/npm/npm/commit/44e37045d77bc40adf339b423d42bf5e9b4d4d91)
  Eliminate `Bluebird.promisifyAll` from our codebase.
  ([@iarna](https://github.com/iarna))
* [`3b4681b53`](https://github.com/npm/npm/commit/3b4681b53db7757985223932072875d099694677)
  [#17508](https://github.com/npm/npm/pull/17508)
  Stop calling `addBundle` on locked deps, speeding up the
  `package-lock.json`-based fast path.
  ([@iarna](https://github.com/iarna))

### BUGFIXES

* [#17508](https://github.com/npm/npm/pull/17508)
  This is a big PR that fixes a variety of issues when installing from package
  locks. If you were previously having issues with missing dependencies or
  unwanted removals, this might have fixed it:
  * It introduces a new `package-lock.json` field, called `requires`, which tracks which modules a given module requires.
  * It fixes [#16839](https://github.com/npm/npm/issues/16839) which was caused by not having this information available, particularly when git dependencies were involved.
  * It fixes [#16866](https://github.com/npm/npm/issues/16866), allowing the `package.json` to trump the `package-lock.json`.
  * `npm ls` now loads the shrinkwrap, which opens the door to showing a full tree of dependencies even when nothing is yet installed. (It doesn't do that yet though.)
  ([@iarna](https://github.com/iarna))
* [`656544c31`](https://github.com/npm/npm/commit/656544c31cdef3cef64fc10c24f03a8ae2685e35) [`d21ab57c3`](https://github.com/npm/npm/commit/d21ab57c3ef4f01d41fb6c2103debe884a17dc22)
  [#16637](https://github.com/npm/npm/pull/16637)
  Fix some cases where `npm prune` was leaving some dependencies unpruned if
  to-be-pruned dependencies depended on them.
  ([@exogen](https://github.com/exogen))
* [`394436b09`](https://github.com/npm/npm/commit/394436b098dcca2d252061f95c4eeb92c4a7027c)
  [#17552](https://github.com/npm/npm/pull/17552)
  Make `refresh-package-json` re-verify the package platform. This fixes an
  issue most notably experienced by Windows users using `create-react-app` where
  `fsevents` would not short-circuit and cause a crash during its
  otherwise-skipped native build phase.
  ([@zkat](https://github.com/zkat))
* [`9e5a94354`](https://github.com/npm/npm/commit/9e5a943547b29c8d022192afd9398b3a136a7e5a)
  [#17590](https://github.com/npm/npm/pull/17590)
  Fix an issue where `npm@5` would crash when trying to remove packages
  installed with `npm@<5`.
  ([@iarna](https://github.com/iarna))
* [`c3b586aaf`](https://github.com/npm/npm/commit/c3b586aafa9eabac572eb6e2b8a7266536dbc65b)
  [#17141](https://github.com/npm/npm/issues/17141)
  Don't update the package.json when modifying packages that don't go there.
  This was previously causing `package.json` to get a `"false": {}` field added.
  ([@iarna](https://github.com/iarna))
* [`d04a23de2`](https://github.com/npm/npm/commit/d04a23de21dd9991b32029d839b71e10e07b400d) [`4a5b360d5`](https://github.com/npm/npm/commit/4a5b360d561f565703024085da0927ccafe8793e) [`d9e53db48`](https://github.com/npm/npm/commit/d9e53db48ca227b21bb67df48c9b3580cb390e9e)
  `pacote@2.7.38`:
  * [zkat/pacote#102](https://github.com/zkat/pacote/pull/102) Fix issue with tar extraction and special characters.
  * Enable loose semver parsing in some missing corner cases.
  ([@colinrotherham](https://github.com/colinrotherham), [@zkat](https://github.com/zkat), [@mcibique](https://github.com/mcibique))
* [`e2f815f87`](https://github.com/npm/npm/commit/e2f815f87676b7c50b896e939cee15a01aa976e4)
  [#17104](https://github.com/npm/npm/pull/17104)
  Write an empty str and wait for flush to exit to reduce issues with npm
  exiting before all output is complete when it's a child process.
  ([@zkat](https://github.com/zkat))
* [`835fcec60`](https://github.com/npm/npm/commit/835fcec601204971083aa3a281c3a9da6061a7c2)
  [#17060](https://github.com/npm/npm/pull/17060)
  Make git repos with prepare scripts always install with both dev and prod
  flags.
  ([@intellix](https://github.com/intellix))
* [`f1dc8a175`](https://github.com/npm/npm/commit/f1dc8a175eed56f1ed23bd5773e5e10beaf6cb31)
  [#16879](https://github.com/npm/npm/pull/16879)
  Fix support for `always-auth` and `_auth`. They are now both available in both
  unscoped and registry-scoped configurations.
  ([@jozemlakar](https://github.com/jozemlakar))
* [`ddd8a1ca2`](https://github.com/npm/npm/commit/ddd8a1ca2fa3377199af74ede9d0c1a406d19793)
  Serialize package specs to prevent `[object Object]` showing up in logs during
  extraction.
  ([@zkat](https://github.com/zkat))
* [`99ef3b52c`](https://github.com/npm/npm/commit/99ef3b52caa7507e87a4257e622f8964b1c1f5f3)
  [#17505](https://github.com/npm/npm/pull/17505)
  Stop trying to commit updated `npm-shrinkwrap.json` and `package-lock.json` if
  they're `.gitignore`d.
  ([@zkat](https://github.com/zkat))
* [`58be2ec59`](https://github.com/npm/npm/commit/58be2ec596dfb0353ad2570e6750e408339f1478)
  Make sure uid and gid are getting correctly set even when they're `0`. This
  should fix some Docker-related issues with bad permissions/broken ownership.
  ([@rgrove](https://github.com/rgrove))
  ([@zkat](https://github.com/zkat))
* [`9d1e3b6fa`](https://github.com/npm/npm/commit/9d1e3b6fa01bb563d76018ee153259d9507658cf)
  [#17506](https://github.com/npm/npm/pull/17506)
  Skip writing package.json and locks if on-disk version is identical to the new
  one.
  ([@zkat](https://github.com/zkat))
* [`3fc6477a8`](https://github.com/npm/npm/commit/3fc6477a89773786e6c43ef43a23e5cdc662ff8e)
  [#17592](https://github.com/npm/npm/pull/17592)
  Fix an issue where `npm install -g .` on a package with no `name` field would
  cause the entire global `node_modules` directory to be replaced with a symlink
  to `$CWD`. lol.
  ([@iarna](https://github.com/iarna))
* [`06ba0a14a`](https://github.com/npm/npm/commit/06ba0a14a6c1c8cdcc8c062b68c8c63041b0cec0)
  [#17591](https://github.com/npm/npm/pull/17591)
  Fix spurious removal reporting: if you tried to remove something that didn't
  actually exist, npm would tell you it removed 1 package even though there was
  nothing to do.
  ([@iarna](https://github.com/iarna))
* [`20ff05f8`](https://github.com/npm/npm/commit/20ff05f8fe0ad8c36e1323d30b63b4d2ff7e11ef)
  [#17629](https://github.com/npm/npm/pull/17629)
  When removing a link, keep dependencies installed inside of it instead of
  removing them, if the link is outside the scope of the current project. This
  fixes an issue where removing globally-linked packages would remove all their
  dependencies in the source directory, as well as some ergonomic issues when
  using links in other situations.
  ([@iarna](https://github.com/iarna))

### DOCS

* [`fd5fab595`](https://github.com/npm/npm/commit/fd5fab5955a20a9bb8c0e77092ada1435f73a8d2)
  [#16441](https://github.com/npm/npm/pull/16441)
  Add spec for `npm-shrinkwrap.json` and `package-lock.json` from RFC.
  ([@iarna](https://github.com/iarna))
* [`9589c1ccb`](https://github.com/npm/npm/commit/9589c1ccb3f794abaaa48c2a647ada311dd881ef)
  [#17451](https://github.com/npm/npm/pull/17451)
  Fix typo in changelog.
  ([@watilde](https://github.com/watilde))
* [`f8e76d856`](https://github.com/npm/npm/commit/f8e76d8566ae1965e57d348df74edad0643b66a6)
  [#17370](https://github.com/npm/npm/pull/17370)
  Correct the default prefix config path for Windows operating systems in the
  documentation for npm folders.
  ([@kierendixon](https://github.com/kierendixon))
* [`d0f3b5a12`](https://github.com/npm/npm/commit/d0f3b5a127718b0347c6622a2b9c28341c530d36)
  [#17369](https://github.com/npm/npm/pull/17369)
  Fix `npm-config` reference to `userconfig` & `globalconfig` environment
  variables.
  ([@racztiborzoltan](https://github.com/racztiborzoltan))
* [`87629880a`](https://github.com/npm/npm/commit/87629880a71baec352c1b5345bc29268d6212467)
  [#17336](https://github.com/npm/npm/pull/17336)
  Remove note in docs about `prepublish` being entirely removed.
  ([@Hirse](https://github.com/Hirse))
* [`a1058afd9`](https://github.com/npm/npm/commit/a1058afd9a7a569bd0ac65b86eadd4fe077a7221)
  [#17169](https://github.com/npm/npm/pull/17169)
  Document `--no-package-lock` flag.
  ([@leggsimon](https://github.com/leggsimon))
* [`32fc6e41a`](https://github.com/npm/npm/commit/32fc6e41a2ce4dbcd5ce1e5f291e2e2efc779d48)
  [#17250](https://github.com/npm/npm/pull/17250)
  Fix a typo in the shrinkwrap docs.
  ([@Zarel](https://github.com/Zarel))
* [`f19bd3c8c`](https://github.com/npm/npm/commit/f19bd3c8cbd37c8a99487d6b5035282580ac3e9d)
  [#17249](https://github.com/npm/npm/pull/17249)
  Fix a package-lock.json cross-reference link.
  ([@not-an-aardvark](https://github.com/not-an-aardvark))
* [`153245edc`](https://github.com/npm/npm/commit/153245edc4845db670ada5e95ef384561706a751)
  [#17075](https://github.com/npm/npm/pull/17075/files)
  Fix a typo in `npm-config` docs.
  ([@KennethKinLum](https://github.com/KennethKinLum))
* [`c9b534a14`](https://github.com/npm/npm/commit/c9b534a148818d1a97787c0dfdba5f64ce3618a6)
  [#17074](https://github.com/npm/npm/pull/17074)
  Clarify config documention with multiple boolean flags.
  ([@KennethKinLum](https://github.com/KennethKinLum))
* [`e111b0a40`](https://github.com/npm/npm/commit/e111b0a40c4bc6691d7b8d67ddce5419e67bfd27)
  [#16768](https://github.com/npm/npm/pull/16768)
  Document the `-l` option to `npm config list`.
  ([@happylynx](https://github.com/happylynx))
* [`5a803ebad`](https://github.com/npm/npm/commit/5a803ebadd61229bca3d64fb3ef1981729b2548e)
  [#16548](https://github.com/npm/npm/pull/16548)
  Fix permissions for documentation files. Some of them had `+x` set. (???)
  ([@metux](https://github.com/metux))
* [`d57d4f48c`](https://github.com/npm/npm/commit/d57d4f48c6cd00fdf1e694eb49e9358071d8e105)
  [#17319](https://github.com/npm/npm/pull/17319)
  Document that the `--silent` option for `npm run-script` can be used to
  suppress `npm ERR!` output on errors.
  ([@styfle](https://github.com/styfle))

### MISC

Not all contributions need to be visible features, docs, or bugfixes! It's super
helpful when community members go over our code and help clean it up, too!

* [`9e5b76140`](https://github.com/npm/npm/commit/9e5b76140ffdb7dcd12aa402793644213fb8c5d7)
  [#17411](https://github.com/npm/npm/pull/17411)
  Convert all callback-style `move` usage to use Promises.
  ([@vramana](https://github.com/vramana))
* [`0711c08f7`](https://github.com/npm/npm/commit/0711c08f779ac641ec42ecc96f604c8861008b28)
  [#17394](https://github.com/npm/npm/pull/17394)
  Remove unused argument in `deepSortObject`.
  ([@vramana](https://github.com/vramana))
* [`7d650048c`](https://github.com/npm/npm/commit/7d650048c8ed5faa0486492f1eeb698e7383e32f)
  [#17563](https://github.com/npm/npm/pull/17563)
  Refactor some code to use `Object.assign`.
  ([@vramana](https://github.com/vramana))
* [`993f673f0`](https://github.com/npm/npm/commit/993f673f056aea5f602ea04b1e697b027c267a2d)
  [#17600](https://github.com/npm/npm/pull/17600)
  Remove an old comment.
  ([@vramana](https://github.com/vramana))

## v5.0.4 (2017-06-13):

Hey y'all. This is another minor patch release with a variety of little fixes
we've been accumulating~

* [`f0a37ace9`](https://github.com/npm/npm/commit/f0a37ace9ab7879cab20f2b0fcd7840bfc305feb)
  Fix `npm doctor` when hitting registries without `ping`.
  ([@zkat](https://github.com/zkat))
* [`64f0105e8`](https://github.com/npm/npm/commit/64f0105e81352b42b72900d83b437b90afc6d9ce)
  Fix invalid format error when setting cache-related headers.
  ([@zkat](https://github.com/zkat))
* [`d2969c80e`](https://github.com/npm/npm/commit/d2969c80e4178faebf0f7c4cab6eb610dd953cc6)
  Fix spurious `EINTEGRITY` issue.
  ([@zkat](https://github.com/zkat))
* [`800cb2b4e`](https://github.com/npm/npm/commit/800cb2b4e2d0bd00b5c9082a896f2110e907eb0b)
  [#17076](https://github.com/npm/npm/pull/17076)
  Use legacy `from` field to improve upgrade experience from legacy shrinkwraps
  and installs.
  ([@zkat](https://github.com/zkat))
* [`4100d47ea`](https://github.com/npm/npm/commit/4100d47ea58b4966c02604f71350b5316108df6a)
  [#17007](https://github.com/npm/npm/pull/17007)
  Restore loose semver parsing to match older npm behavior when running into
  invalid semver ranges in dependencies.
  ([@zkat](https://github.com/zkat))
* [`35316cce2`](https://github.com/npm/npm/commit/35316cce2ca2d8eb94161ec7fe7e8f7bec7b3aa7)
  [#17005](https://github.com/npm/npm/pull/17005)
  Emulate npm@4's behavior of simply marking the peerDep as invalid, instead of
  crashing.
  ([@zkat](https://github.com/zkat))
* [`e7e8ee5c5`](https://github.com/npm/npm/commit/e7e8ee5c57c7238655677e118a8809b652019f53)
  [#16937](https://github.com/npm/npm/pull/16937)
  Workaround for separate bug where `requested` was somehow null.
  ([@forivall](https://github.com/forivall))
* [`2d9629bb2`](https://github.com/npm/npm/commit/2d9629bb2043cff47eaad2654a64d2cef5725356)
  Better logging output for git errors.
  ([@zkat](https://github.com/zkat))
* [`2235aea73`](https://github.com/npm/npm/commit/2235aea73569fb9711a06fa6344ef31247177dcd)
  More scp-url fixes: parsing only worked correctly when a committish was
  present.
  ([@zkat](https://github.com/zkat))
* [`80c33cf5e`](https://github.com/npm/npm/commit/80c33cf5e6ef207450949764de41ea96538c636e)
  Standardize package permissions on tarball extraction, instead of using perms
  from the tarball. This matches previous npm behavior and fixes a number of
  incompatibilities in the wild.
  ([@zkat](https://github.com/zkat))
* [`2b1e40efb`](https://github.com/npm/npm/commit/2b1e40efba0b3d1004259efa4275cf42144e3ce3)
  Limit shallow cloning to hosts which are known to support it.
  ([@zkat](https://github.com/zkat))

## v5.0.3 (2017-06-05)

Happy Monday, y'all! We've got another npm release for you with the fruits of
our ongoing bugsquashing efforts. You can expect at least one more this week,
but probably more -- and as we announced last week, we'll be merging fixes more
rapidly into the `npmc` canary so you can get everything as soon as possible!

Hope y'all are enjoying npm5 in the meantime, and don't hesitate to file issues
for anything you find! The goal is to get this release rock-solid as soon as we
can. 💚

* [`6e12a5cc0`](https://github.com/npm/npm/commit/6e12a5cc022cb5a157a37df7283b6d7b3d49bdab)
  Bump several dependencies to get improvements and bugfixes:
  * `cacache`: content files (the tarballs) are now read-only.
  * `pacote`: fix failing clones with bad heads, send extra TLS-related opts to proxy, enable global auth configurations and `_auth`-based auth.
  * `ssri`: stop crashing with `can't call method find of undefined` when running into a weird `opts.integrity`/`opts.algorithms` conflict during verification.
  ([@zkat](https://github.com/zkat))
* [`89cc8e3e1`](https://github.com/npm/npm/commit/89cc8e3e12dad67fd9844accf4d41deb4c180c5c)
  [#16917](https://github.com/npm/npm/pull/16917)
  Send `ca`, `cert` and `key` config through to network layer.
  ([@colinrotherham](https://github.com/colinrotherham))
* [`6a9b51c67`](https://github.com/npm/npm/commit/6a9b51c67ba3df0372991631992748329b84f2e7)
  [#16929](https://github.com/npm/npm/pull/16929)
  Send `npm-session` header value with registry requests again.
  ([@zarenner](https://github.com/zarenner))
* [`662a15ab7`](https://github.com/npm/npm/commit/662a15ab7e790e87f5e5a35252f05d5a4a0724a1)
  Fix `npm doctor` so it stop complaining about read-only content files in the
  cache.
  ([@zkat](https://github.com/zkat))
* [`191d10a66`](https://github.com/npm/npm/commit/191d10a6616d72e26d89fd00f5a4f6158bfbc526)
  [#16918](https://github.com/npm/npm/pull/16918)
  Clarify prepublish deprecation message.
  ([@Hirse](https://github.com/Hirse))

## v5.0.2 (2017-06-02)

Here's another patch release, soon after the other!

This particular release includes a slew of fixes to npm's git support, which was
causing some issues for a chunk of people, specially those who were using
self-hosted/Enterprise repos. All of those should be back in working condition
now.

There's another shiny thing you might wanna know about: npm has a Canary release
now! The `npm5` experiment we did during our beta proved to be incredibly
successful: users were able to have a tight feedback loop between reports and
getting the bugfixes they needed, and the CLI team was able to roll out
experimental patches and have the community try them out right away. So we want
to keep doing that.

From now on, you'll be able to install the 'npm canary' with `npm i -g npmc`.
This release will be a separate binary (`npmc`. Because canary. Get it?), which
will update independently of the main CLI. Most of the time, this will track
`release-next` or something close to it. We might occasionally toss experimental
branches in there to see if our more adventurous users run into anything
interesting with it. For example, the current canary (`npmc@5.0.1-canary.6`)
includes an [experimental multiproc
branch](https://github.com/npm/npm/pull/16633) that parallelizes tarball
extraction across multiple processes.

If you find any issues while running the canary version, please report them and
let us know it came from `npmc`! It would be tremendously helpful, and finding
things early is a huge reason to have it there. Happy hacking!

### A NOTE ABOUT THE ISSUE TRACKER

Just a heads up: We're preparing to do a massive cleanup of the issue tracker.
It's been a long time since it was something we could really keep up with, and
we didn't have a process for dealing with it that could actually be sustainable.

We're still sussing the details out, and we'll talk about it more when we're
about to do it, but the plan is essentially to close old, abandoned issues and
start over. We will also [add some automation](https://github.com/probot) around
issue management so that things that we can't keep up with don't just stay
around forever.

Stay tuned!

### GIT YOLO

* [`1f26e9567`](https://github.com/npm/npm/commit/1f26e9567a6d14088704e121ebe787c38b6849a4)
  `pacote@2.7.27`: Fixes installing committishes that look like semver, even
  though they're not using the required `#semver:` syntax.
  ([@zkat](https://github.com/zkat))
* [`85ea1e0b9`](https://github.com/npm/npm/commit/85ea1e0b9478551265d03d545e7dc750b9edf547)
  `npm-package-arg@5.1.1`: This includes the npa git-parsing patch to make it so
  non-hosted SCP-style identifiers are correctly handled. Previously, npa would
  mangle them (even though hosted-git-info is doing the right thing for them).
  ([@zkat](https://github.com/zkat))

### COOL NEW OUTPUT

The new summary output has been really well received! One downside that reared
its head as more people used it, though, is that it doesn't really tell you
anything about the toplevel versions it installed. So, if you did `npm i -g
foo`, it would just say "added 1 package". This patch by
[@rmg](https://github.com/rmg) keeps things concise while still telling you
what you got! So now, you'll see something like this:

```
$ npm i -g foo bar
+ foo@1.2.3
+ bar@3.2.1
added 234 packages in .005ms
```

* [`362f9fd5b`](https://github.com/npm/npm/commit/362f9fd5bec65301082416b4292b8fe3eb7f824a)
  [#16899](https://github.com/npm/npm/pull/16899)
  For every package that is given as an argument to install, print the name and
  version that was actually installed.
  ([@rmg](https://github.com/rmg))

### OTHER BUGFIXES

* [`a47593a98`](https://github.com/npm/npm/commit/a47593a98a402143081d7077d2ac677d13083010)
  [#16835](https://github.com/npm/npm/pull/16835)
  Fix a crash while installing with `--no-shrinkwrap`.
  ([@jacknagel](https://github.com/jacknagel))

### DOC UPATES

* [`89e0cb816`](https://github.com/npm/npm/commit/89e0cb8165dd9c3c7ac74d531617f367099608f4)
  [#16818](https://github.com/npm/npm/pull/16818)
  Fixes a spelling error in the docs. Because the CLI team has trouble spelling
  "package", I guess.
  ([@ankon](https://github.com/ankon))
* [`c01fbc46e`](https://github.com/npm/npm/commit/c01fbc46e151bcfb359fd68dd7faa392789b4f55)
  [#16895](https://github.com/npm/npm/pull/16895)
  Remove `--save` from `npm init` instructions, since it's now the default.
  ([@jhwohlgemuth](https://github.com/jhwohlgemuth))
* [`80c42d218`](https://github.com/npm/npm/commit/80c42d2181dd4d1b79fcee4e9233df268dfb30b7)
  Guard against cycles when inflating bundles, as symlinks are bundles now.
  ([@iarna](https://github.com/iarna))
* [`7fe7f8665`](https://github.com/npm/npm/commit/7fe7f86658798db6667df89afc75588c0e43bc94)
  [#16674](https://github.com/npm/npm/issues/16674)
  Write the builtin config for `npmc`, not just `npm`. This is hardcoded for npm
  self-installations and is needed for Canary to work right.
  ([@zkat](https://github.com/zkat))

### DEP UPDATES

* [`63df4fcdd`](https://github.com/npm/npm/commit/63df4fcddc7445efb50cc7d8e09cdd45146d3e39)
  [#16894](https://github.com/npm/npm/pull/16894)
  [`node-gyp@3.6.2`](https://github.com/nodejs/node-gyp/blob/master/CHANGELOG.md#v362-2017-06-01):
  Fixes an issue parsing SDK versions on Windows, among other things.
  ([@refack](https://github.com/refack))
* [`5bb15c3c4`](https://github.com/npm/npm/commit/5bb15c3c4f0d7d77c73fd6dafa38ac36549b6e00)
  `read-package-tree@5.1.6`: Fixes some racyness while reading the tree.
  ([@iarna](https://github.com/iarna))
* [`a6f7a52e7`](https://github.com/npm/npm/commit/a6f7a52e7)
  `aproba@1.1.2`: Remove nested function declaration for speed up
  ([@mikesherov](https://github.com/mikesherov))

## v5.0.1 (2017-05-31):

Hey y'all! Hope you're enjoying the new npm!

As you all know, fresh software that's gone through major overhauls tends to
miss a lot of spots the old one used to handle well enough, and `npm@5` is no
exception. The CLI team will be doing faster release cycles that go directly to
the `latest` tag for a couple of weeks while 5 stabilizes a bit and we're
confident the common low-hanging fruit people are running into are all taken
care of.

With that said: this is our first patch release! The biggest focus is fixing up
a number of git-related issues that folks ran into right out the door. It also
fixes other things, like some proxy/auth-related issues, and even has a neat
speed boost! (You can expect more speed bumps in the coming releases as pending
work starts landing, too!)

Thanks everyone who's been reporting issues and submitting patches!

### BUGFIXES

* [`e61e68dac`](https://github.com/npm/npm/commit/e61e68dac4fa51c0540a064204a75b19f8052e58)
  [#16762](https://github.com/npm/npm/pull/16762)
  Make `npm publish` obey the `--tag` flag again.
  ([@zkat](https://github.com/zkat))
* [`923fd58d3`](https://github.com/npm/npm/commit/923fd58d312f40f8c17b232ad1dfc8e2ff622dbd)
  [#16749](https://github.com/npm/npm/pull/16749)
  Speed up installations by nearly 20% by... removing one line of code. (hah)
  ([@mikesherov](https://github.com/mikesherov))
* [`9aac984cb`](https://github.com/npm/npm/commit/9aac984cbbfef22182ee42b51a193c0b47146ad6)
  Guard against a particular failure mode for a bug still being hunted down.
  ([@iarna](https://github.com/iarna))
* [`80ab521f1`](https://github.com/npm/npm/commit/80ab521f18d34df109de0c5dc9eb1cde5ff6d7e8)
  Pull in dependency updates for various core deps:
  * New `pacote` fixes several git-related bugs.
  * `ssri` update fixes crash on early node@4 versions.
  * `make-fetch-happen` update fixes proxy authentication issue.
  * `npm-user-validate` adds regex for blocking usernames with illegal chars.
  ([@zkat](https://github.com/zkat))
* [`7e5ce87b8`](https://github.com/npm/npm/commit/7e5ce87b84880c7433ee4c07d2dd6ce8806df436)
  `pacote@2.7.26`:
  Fixes various other git issues related to commit hashes.
  ([@zkat](https://github.com/zkat))
* [`acbe85bfc`](https://github.com/npm/npm/commit/acbe85bfc1a68d19ca339a3fb71da0cffbf58926)
  [#16791](https://github.com/npm/npm/pull/16791)
  `npm view` was calling `cb` prematurely and giving partial output when called
  in a child process.
  ([@zkat](https://github.com/zkat))
* [`ebafe48af`](https://github.com/npm/npm/commit/ebafe48af91f702ccefc8c619d52fed3b8dfd3c7)
  [#16750](https://github.com/npm/npm/pull/16750)
  Hamilpatch the Musical: Talk less, complete more.
  ([@aredridel](https://github.com/aredridel))

### DOCUMENTATION

* [`dc2823a6c`](https://github.com/npm/npm/commit/dc2823a6c5fc098041e61515c643570819d059d2)
  [#16799](https://github.com/npm/npm/pull/16799)
  Document that `package-lock.json` is never allowed in tarballs.
  ([@sonicdoe](https://github.com/sonicdoe))
* [`f3cb84b44`](https://github.com/npm/npm/commit/f3cb84b446c51d628ee0033cdf13752c15b31a29)
  [#16771](https://github.com/npm/npm/pull/16771)
  Fix `npm -l` usage information for the `test` command.
  ([@grawlinson](https://github.com/grawlinson))

### OTHER CHANGES

* [`661262309`](https://github.com/npm/npm/commit/66126230912ab5ab35287b40a9908e036fa73994)
  [#16756](https://github.com/npm/npm/pull/16756)
  remove unused argument
  ([@Aladdin-ADD](https://github.com/Aladdin-ADD))
* [`c3e0b4287`](https://github.com/npm/npm/commit/c3e0b4287ea69735cc367aa7bb7e7aa9a6d9804b)
  [#16296](https://github.com/npm/npm/pull/16296)
  preserve same name convention for command
  ([@desfero](https://github.com/desfero))
* [`9f814831d`](https://github.com/npm/npm/commit/9f814831d330dde7702973186aea06caaa77ff31)
  [#16757](https://github.com/npm/npm/pull/16757)
  remove unused argument
  ([@Aladdin-ADD](https://github.com/Aladdin-ADD))
* [`3cb843239`](https://github.com/npm/npm/commit/3cb8432397b3666d88c31131dbb4599016a983ff)
  minor linter fix
  ([@zkat](https://github.com/zkat))

## v5.0.0 (2017-05-25)

Wowowowowow npm@5!

This release marks months of hard work for the young, scrappy, and hungry CLI
team, and includes some changes we've been hoping to do for literally years.
npm@5 takes npm a pretty big step forward, significantly improving its
performance in almost all common situations, fixing a bunch of old errors due to
the architecture, and just generally making it more robust and fault-tolerant.
It comes with changes to make life easier for people doing monorepos, for users
who want consistency/security guarantees, and brings semver support to git
dependencies. See below for all the deets!

### Breaking Changes

* Existing npm caches will no longer be used: you will have to redownload any cached packages. There is no tool or intention to reuse old caches. ([#15666](https://github.com/npm/npm/pull/15666))

* `npm install ./packages/subdir` will now create a symlink instead of a regular installation. `file://path/to/tarball.tgz` will not change -- only directories are symlinked. ([#15900](https://github.com/npm/npm/pull/15900))

* npm will now scold you if you capitalize its name. seriously it will fight you.

* [npm will `--save` by default now](https://twitter.com/maybekatz/status/859229741676625920). Additionally, `package-lock.json` will be automatically created unless an `npm-shrinkwrap.json` exists. ([#15666](https://github.com/npm/npm/pull/15666))

* Git dependencies support semver through `user/repo#semver:^1.2.3` ([#15308](https://github.com/npm/npm/pull/15308)) ([#15666](https://github.com/npm/npm/pull/15666)) ([@sankethkatta](https://github.com/sankethkatta))

* Git dependencies with `prepare` scripts will have their `devDependencies` installed, and `npm install` run in their directory before being packed.

* `npm cache` commands have been rewritten and don't really work anything like they did before. ([#15666](https://github.com/npm/npm/pull/15666))

* `--cache-min` and `--cache-max` have been deprecated. ([#15666](https://github.com/npm/npm/pull/15666))

* Running npm while offline will no longer insist on retrying network requests. npm will now immediately fall back to cache if possible, or fail. ([#15666](https://github.com/npm/npm/pull/15666))

* package locks no longer exclude `optionalDependencies` that failed to build. This means package-lock.json and npm-shrinkwrap.json should now be cross-platform. ([#15900](https://github.com/npm/npm/pull/15900))

* If you generated your package lock against registry A, and you switch to registry B, npm will now try to [install the packages from registry B, instead of A](https://twitter.com/maybekatz/status/862834964932435969). If you want to use different registries for different packages, use scope-specific registries (`npm config set @myscope:registry=https://myownregist.ry/packages/`). Different registries for different unscoped packages are not supported anymore.

* Shrinkwrap and package-lock no longer warn and exit without saving the lockfile.

* Local tarballs can now only be installed if they have a file extensions `.tar`, `.tar.gz`, or `.tgz`.

* A new loglevel, `notice`, has been added and set as default.

* One binary to rule them all: `./cli.js` has been removed in favor of `./bin/npm-cli.js`. In case you were doing something with `./cli.js` itself. ([#12096](https://github.com/npm/npm/pull/12096)) ([@watilde](https://github.com/watilde))

* Stub file removed ([#16204](https://github.com/npm/npm/pull/16204)) ([@watilde](https://github.com/watilde))

* The "extremely legacy" `_token` couchToken has been removed. ([#12986](https://github.com/npm/npm/pull/12986))

### Feature Summary

#### Installer changes

* A new, standardised lockfile feature meant for cross-package-manager compatibility (`package-lock.json`), and a new format and semantics for shrinkwrap. ([#16441](https://github.com/npm/npm/pull/16441))

* `--save` is no longer necessary. All installs will be saved by default. You can prevent saving with `--no-save`. Installing optional and dev deps is unchanged: use `-D/--save-dev` and `-O/--save-optional` if you want them saved into those fields instead. Note that since npm@3, npm will automatically update npm-shrinkwrap.json when you save: this will also be true for `package-lock.json`. ([#15666](https://github.com/npm/npm/pull/15666))

* Installing a package directory now ends up creating a symlink and does the Right Thing™ as far as saving to and installing from the package lock goes. If you have a monorepo, this might make things much easier to work with, and probably a lot faster too. 😁 ([#15900](https://github.com/npm/npm/pull/15900))

* Project-level (toplevel) `preinstall` scripts now run before anything else, and can modify `node_modules` before the CLI reads it.

* Two new scripts have been added, `prepack` and `postpack`, which will run on both `npm pack` and `npm publish`, but NOT on `npm install` (without arguments). Combined with the fact that `prepublishOnly` is run before the tarball is generated, this should round out the general story as far as putzing around with your code before publication.

* Git dependencies with `prepare` scripts will now [have their devDependencies installed, and their prepare script executed](https://twitter.com/maybekatz/status/860363896443371520) as if under `npm pack`.

* Git dependencies now support semver-based matching: `npm install git://github.com/npm/npm#semver:^5` (#15308, #15666)

* `node-gyp` now supports `node-gyp.cmd` on Windows ([#14568](https://github.com/npm/npm/pull/14568))

* npm no longer blasts your screen with the whole installed tree. Instead, you'll see a summary report of the install that is much kinder on your shell real-estate. Specially for large projects. ([#15914](https://github.com/npm/npm/pull/15914)):
```
$ npm install
npm added 125, removed 32, updated 148 and moved 5 packages in 5.032s.
$
```

* `--parseable` and `--json` now work more consistently across various commands, particularly `install` and `ls`.

* Indentation is now [detected and preserved](https://twitter.com/maybekatz/status/860690502932340737) for `package.json`, `package-lock.json`, and `npm-shrinkwrap.json`. If the package lock is missing, it will default to `package.json`'s current indentation.

#### Publishing

* New [publishes will now include *both* `sha512`](https://twitter.com/maybekatz/status/863201943082065920) and `sha1` checksums. Versions of npm from 5 onwards will use the strongest algorithm available to verify downloads. [npm/npm-registry-client#157](https://github.com/npm/npm-registry-client/pull/157)

#### Cache Rewrite!

We've been talking about rewriting the cache for a loooong time. So here it is.
Lots of exciting stuff ahead. The rewrite will also enable some exciting future
features, but we'll talk about those when they're actually in the works. #15666
is the main PR for all these changes. Additional PRs/commits are linked inline.

* Package metadata, package download, and caching infrastructure replaced.

* It's a bit faster. [Hopefully it will be noticeable](https://twitter.com/maybekatz/status/865393382260056064). 🤔

* With the shrinkwrap and package-lock changes, tarballs will be looked up in the cache by content address (and verified with it).

* Corrupted cache entries will [automatically be removed and re-fetched](https://twitter.com/maybekatz/status/854933138182557696) on integrity check failure.

* npm CLI now supports tarball hashes with any hash function supported by Node.js. That is, it will [use `sha512` for tarballs from registries that send a `sha512` checksum as the tarball hash](https://twitter.com/maybekatz/status/858137093624573953). Publishing with `sha512` is added by [npm/npm-registry-client#157](https://github.com/npm/npm-registry-client/pull/157) and may be backfilled by the registry for older entries.

* Remote tarball requests are now cached. This means that even if you're missing the `integrity` field in your shrinkwrap or package-lock, npm will be able to install from the cache.

* Downloads for large packages are streamed in and out of disk. npm is now able to install packages of """any""" size without running out of memory. Support for publishing them is pending (due to registry limitations).

* [Automatic fallback-to-offline mode](https://twitter.com/maybekatz/status/854176565587984384). npm will seamlessly use your cache if you are offline, or if you lose access to a particular registry (for example, if you can no longer access a private npm repo, or if your git host is unavailable).

* A new `--prefer-offline` option will make npm skip any conditional requests (304 checks) for stale cache data, and *only* hit the network if something is missing from the cache.

* A new `--prefer-online` option that will force npm to revalidate cached data (with 304 checks), ignoring any staleness checks, and refreshing the cache with revalidated, fresh data.

* A new `--offline` option will force npm to use the cache or exit. It will error with an `ENOTCACHED` code if anything it tries to install isn't already in the cache.

* A new `npm cache verify` command that will garbage collect your cache, reducing disk usage for things you don't need (-handwave-), and will do full integrity verification on both the index and the content. This is also hooked into `npm doctor` as part of its larger suite of checking tools.

* The new cache is *very* fault tolerant and supports concurrent access.
  * Multiple npm processes will not corrupt a shared cache.
  * Corrupted data will not be installed. Data is checked on both insertion and extraction, and treated as if it were missing if found to be corrupted. I will literally bake you a cookie if you manage to corrupt the cache in such a way that you end up with the wrong data in your installation (installer bugs notwithstanding).
  * `npm cache clear` is no longer useful for anything except clearing up disk space.

* Package metadata is cached separately per registry and package type: you can't have package name conflicts between locally-installed packages, private repo packages, and public repo packages. Identical tarball data will still be shared/deduplicated as long as their hashes match.

* HTTP cache-related headers and features are "fully" (lol) supported for both metadata and tarball requests -- if you have your own registry, you can define your own cache settings the CLI will obey!

* `prepublishOnly` now runs *before* the tarball to publish is created, after `prepare` has run.
