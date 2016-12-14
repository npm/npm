### v4.0.0 (2016-10-20)

Welcome to `npm@4`, friends!

This is our first semver major release since the release of `npm@3` just over a
year ago. Back then, `@3` turned out to be a bit of a ground-shaking release,
with a brand-new installer with significant structural changes to how npm set up
your tree. This is the end of an era, in a way. `npm@4` also marks the release
when we move *both* `npm@2` and `npm@3` into maintenance: We will no longer be
updating those release branches with anything except critical bugfixes and
security patches.

While its predecessor had some pretty serious impaact, `npm@4` is expected to
have a much smaller effect on your day-to-day use of npm. Over the past year,
we've collected a handful of breaking changes that we wanted to get in which are
only breaking under a strict semver interpretation (which we follow). Some of
these are simple usability improvements, while others fix crashes and serious
issues that required a major release to include.

We hope this release sees you well, and you can look forward to an accelerated
release pace now that the CLI team is done focusing on sustaining work -- our
Windows fixing and big bugs pushes -- and we can start focusing again on
usability, features, and performance. Keep an eye out for `npm@5` in Q1 2017,
too: We're planning a major overhaul of `shrinkwrap` as well as various speed
and usability fixes for that release. It's gonna be a fun ride. I promise. 😘

#### BRIEF OVERVIEW OF **BREAKING** CHANGES

The following breaking changes are included in this release:

* `npm search` rewritten to stream results, and no longer supports sorting.
* `npm scripts` no longer prepend the path of the node executable used to run
  npm before running scripts. A `--scripts-prepend-node-path` option has been
  added to configure this behavior.
* `npat` has been removed.
* `prepublish` has been deprecated, replaced by `prepare`. A `prepublishOnly`
  script has been temporarily added, which will *only* run on `npm publish`.
* `npm outdated` exits with exit code `1` if it finds any outdated packages.
* `npm tag` has been removed after a deprecation cycle. Use `npm dist-tag`.
* Partial shrinkwraps are no longer supported. `npm-shrinkwrap.json` is
  considered a complete installation manifest except for `devDependencies`.
* npm's default git branch is no longer `master`. We'll be using `latest` from
  now on.

#### SEARCH REWRITE (**BREAKING**)

Let's face it -- `npm search` simply doesn't work anymore. Apart from the fact
that it grew slower over the years, it's reached a point where we can no longer
fit the entire registry metadata in memory, and anyone who tries to use the
command now sees a really awful memory overflow crash from node.

It's still going to be some time before the CLI, registry, and web team are able
to overhaul `npm search` altogether, but until then, we've rewritten the
previous `npm search` implementation to *stream* results on the fly, from both
the search endpoint and a local cache. In absolute terms, you won't see a
performance increase and this patch *does* come at the cost of sorting
capabilities, but what it does do is start outputting results as it finds them.
This should make the experience much better, overall, and we believe this is an
acceptable band-aid until we have that search endpoint in place.

Incidentally, if you want a really nice search experience, we recommend checking
out [npms.io](http://npms.io), which includes a handy-dandy
[`npms-cli`](https://npm.im/npms-cli) for command-line usage -- it's an npm
search site that returns high-quality results quickly and is operated by members
of the npm community.

* [`cfd43b4`](https://github.com/npm/npm/commit/cfd43b49aed36d0e8ea6c35b07ed8b303b69be61) [`2b8057b`](https://github.com/npm/npm/commit/2b8057be2e1b51e97b1f8f38d7f58edf3ce2c145)
  [#13746](https://github.com/npm/npm/pull/13746)
  Stream search process end-to-end.
  ([@zkat](https://github.com/zkat) and [@aredridel](https://github.com/aredridel))
* [`50f4ec8`](https://github.com/npm/npm/commit/50f4ec8e8ce642aa6a58cb046b2b770ccf0029db) [`70b4bc2`](https://github.com/npm/npm/commit/70b4bc22ec8e81cd33b9448f5b45afd1a50d50ba) [`8fb470f`](https://github.com/npm/npm/commit/8fb470fe755c4ad3295cb75d7b4266f8e67f8d38) [`ac3a6e0`](https://github.com/npm/npm/commit/ac3a6e0eba61fb40099b1370c74ad1598777def4) [`bad54dd`](https://github.com/npm/npm/commit/bad54dd9f1119fe900a8d065f8537c6f1968b589) [`87d504e`](https://github.com/npm/npm/commit/87d504e0a61bccf09f5e975007d018de3a1c5f50)
  [#13746](https://github.com/npm/npm/pull/13746)
  Updated search-related tests.
  ([@zkat](https://github.com/zkat))
* [`3596de8`](https://github.com/npm/npm/commit/3596de88598c69eb5bae108703c8e74ca198b20c)
  [#13746](https://github.com/npm/npm/pull/13746)
  `JSONStream@1.2.1`
  ([@zkat](https://github.com/zkat))
* [`4b09209`](https://github.com/npm/npm/commit/4b09209bb605f547243065032a8b37772669745f)
  [#13746](https://github.com/npm/npm/pull/13746)
  `mississippi@1.2.0`
  ([@zkat](https://github.com/zkat))
* [`b650b39`](https://github.com/npm/npm/commit/b650b39d42654abb9eed1c7cd463b1c595ca2ef9)
  [#13746](https://github.com/npm/npm/pull/13746)
  `sorted-union-stream@2.1.3`
  ([@zkat](https://github.com/zkat))

#### SCRIPT NODE PATH (**BREAKING**)

Thanks to some great with by [@addaleax](https://github.com/addaleax), we've
addressed a fairly tricky issue involving the node process used by `npm
scripts`.

Previously, npm would prefix the path of the node executable to the script's
`PATH`. This had the benefit of making sure that the node process would be the
same for both npm and `scripts` unless you had something like
[`node-bin`](https://npm.im/node-bin) in your `node_modules`. And it turns out
lots of people relied on this behavior being this way!

It turns out that this had some unintended consequences: it broke systems like
[`nyc`](https://npm.im/nyc), but also completely broke/defeated things like
[`rvm`](https://rvm.io/) and
[`virtualenv`](https://virtualenv.pypa.io/en/stable/) by often causing things
that relied on them to fall back to the global system versions of ruby and
python.

In the face of two perfectly valid, and used alternatives, we decided that the
second case was much more surprising for users, and that we should err on the
side of doing what those users expect. Anna put some hard work in and managed to
put together a patch that changes npm's behavior such that we no longer prepend
the node executable's path *by default*, and adds a new option,
`--scripts-prepend-node-path`, to allow users who rely on this behavior to have
it add the node path for them.

This patch also makes it so this feature is discoverable by people who might run
into the first case above, by warning if the node executable is either missing
or shadowed by another one in `PATH`. This warning can also be disabled with the
`--scripts-prepend-node-path` option as needed.

* [`3fb1eb3`](https://github.com/npm/npm/commit/3fb1eb3e00b5daf37f14e437d2818e9b65a43392) [`6a7d375`](https://github.com/npm/npm/commit/6a7d375d779ba5416fd5df154c6da673dd745d9d) [`378ae08`](https://github.com/npm/npm/commit/378ae08851882d6d2bc9b631b16b8c875d0b9704)
  [#13409](https://github.com/npm/npm/pull/13409)
  Add a `--scripts-prepend-node-path` option to configure whether npm prepends
  the current node executable's path to `PATH`.
  ([@addaleax](https://github.com/addaleax))
* [`70b352c`](https://github.com/npm/npm/commit/70b352c6db41533b9a4bfaa9d91f7a2a1178f74e)
  [#13409](https://github.com/npm/npm/pull/13409)
  Change the default behaviour of npm to never prepending the current node
  executable’s directory to `PATH` but printing a warning in the cases in which
  it previously did.
  ([@addaleax](https://github.com/addaleax))

#### REMOVE `npat` (**BREAKING**)

Let's be real here -- almost no one knows this feature ever existed, and it's a
vestigial feature of the days when the ideal for npm was to distribute full
packages that could be directly developed on, even from the registry.

It turns out the npm community decided to go a different way: primarily
publishing packages in a production-ready format, with no tests, build tools,
etc. And so, we say goodbye to `npat`.

* [`e16c14a`](https://github.com/npm/npm/commit/e16c14afb6f52cb8b7adf60b2b26427f76773f2e)
  [#14329](https://github.com/npm/npm/pull/14329)
  Remove the npat feature.
  ([@iarna](https://github.com/iarna))

#### NEW `prepare` SCRIPT. `prepublish` DEPRECATED (**BREAKING**)

If there's anything that really seemed to confuse users, it's that the
`prepublish` script ran when invoking `npm install` without any arguments.

Turns out many, many people really expected that it would only run on `npm
publish`, even if it actually did what most people expected: prepare the package
for publishing on the registry.

And so, we've added a `prepare` command that runs in the exact same cases where
`prepublish` ran, and we've begun a deprecation cycle for `prepublish` itself
**only when run by `npm install`**, which will now include a warning any time
you use it that way.

We've also added a `prepublishOnly` script which will execute **only** when `npm
publish` is invoked. Eventually, `prepublish` will stop executing on `npm
install`, and `prepublishOnly` will be removed, leaving `prepare` and
`prepublish` as two distinct lifecycles.

* [`9b4a227`](https://github.com/npm/npm/commit/9b4a2278cee0a410a107c8ea4d11614731e0a943) [`bc32078`](https://github.com/npm/npm/commit/bc32078fa798acef0e036414cb448645f135b570)
  [#14290](https://github.com/npm/npm/pull/14290)
  Add `prepare` and `prepublishOnly` lifecyle events.
  ([@othiym23](https://github.com/othiym23))
* [`52fdefd`](https://github.com/npm/npm/commit/52fdefddb48f0c39c6e8eb4c118eb306c9436117)
  [#14290](https://github.com/npm/npm/pull/14290)
  Warn when running `prepublish` on `npm pack`.
  ([@othiym23](https://github.com/othiym23))
* [`4c2a948`](https://github.com/npm/npm/commit/4c2a9481b564cae3df3f4643766db4b987018a7b) [`a55bd65`](https://github.com/npm/npm/commit/a55bd651284552b93f7d972a2e944f65c1aa6c35)
  [#14290](https://github.com/npm/npm/pull/14290)
  Added `prepublish` warnings to `npm install`.
  ([@zkat](https://github.com/zkat))
* [`c27412b`](https://github.com/npm/npm/commit/c27412bb9fc7b09f7707c7d9ad23128959ae1abc)
  [#14290](https://github.com/npm/npm/pull/14290)
  Replace `prepublish` with `prepare` in `npm help package.json` documentation.
  ([@zkat](https://github.com/zkat))

#### NO MORE PARTIAL SHRINKWRAPS (**BREAKING**)

That's right. No more partial shrinkwraps. That means that if you have an
`npm-shrinkwrap.json` in your project, npm will no longer install anything that
isn't explicitly listed there, unless it's a `devDependency`. This will open
doors to some nice optimizations and make use of `npm shrinkwrap` just generally
smoother by removing some awful corner cases. We will also skip `devDependency`
installation from `package.json` if you added `devDependencies` to your
shrinkwrap by using `npm shrinkwrap --dev`.

* [`b7dfae8`](https://github.com/npm/npm/commit/b7dfae8fd4dc0456605f7a921d20a829afd50864)
  [#14327](https://github.com/npm/npm/pull/14327)
  Use `readShrinkwrap` to read top level shrinkwrap. There's no reason for npm
  to be doing its own bespoke heirloom-grade artisanal thing here.
  ([@iarna](https://github.com/iarna))
* [`0ae1f4b`](https://github.com/npm/npm/commit/0ae1f4b9d83af2d093974beb33f26d77fcc95bb9) [`4a54997`](https://github.com/npm/npm/commit/4a549970dc818d78b6de97728af08a1edb5ae7f0) [`f22a1ae`](https://github.com/npm/npm/commit/f22a1ae54b5d47f1a056a6e70868013ebaf66b79) [`3f61189`](https://github.com/npm/npm/commit/3f61189cb3843fee9f54288fefa95ade9cace066)
  [#14327](https://github.com/npm/npm/pull/14327)
  Treat shrinkwrap as canonical. That is, don't try to fill in for partial
  shrinkwraps. Partial shrinkwraps should produce partial installs. If your
  shrinkwrap contains NO `devDependencies` then we'll still try to install them
  from your `package.json` instead of assuming you NEVER want `devDependencies`.
  ([@iarna](https://github.com/iarna))

#### `npm tag` REMOVED (**BREAKING**)

* [`94255da`](https://github.com/npm/npm/commit/94255da8ffc2d9ed6a0434001a643c1ad82fa483)
  [#14328](https://github.com/npm/npm/pull/14328)
  Remove deprecated tag command. Folks must use the `dist-tag` command from now
  on.
  ([@iarna](https://github.com/iarna))

#### NON-ZERO EXIT CODE ON OUTDATED DEPENDENCIES (**BREAKING**)

* [`40a04d8`](https://github.com/npm/npm/commit/40a04d888d10a5952d5ca4080f2f5d2339d2038a) [`e2fa18d`](https://github.com/npm/npm/commit/e2fa18d9f7904eb048db7280b40787cb2cdf87b3) [`3ee3948`](https://github.com/npm/npm/commit/3ee39488b74c7d35fbb5c14295e33b5a77578104) [`3fa25d0`](https://github.com/npm/npm/commit/3fa25d02a8ff07c42c595f84ae4821bc9ee908df)
  [#14013](https://github.com/npm/npm/pull/14013)
  Do `exit 1` if any outdated dependencies are found by `npm outdated`.
  ([@watilde](https://github.com/watilde))
* [`c81838a`](https://github.com/npm/npm/commit/c81838ae96b253f4b1ac66af619317a3a9da418e)
  [#14013](https://github.com/npm/npm/pull/14013)
  Log non-zero exit codes at `verbose` level -- this isn't something command
  line tools tend to do. It's generally the shell's job to display, if at all.
  ([@zkat](https://github.com/zkat))

#### SEND EXTRA HEADERS TO REGISTRY

For the purposes of supporting shiny new registry features, we've started
sending `Npm-Scope` and `Npm-In-CI` headers in outgoing requests.

* [`846f61c`](https://github.com/npm/npm/commit/846f61c1dd4a033f77aa736ab01c27ae6724fe1c)
  [npm/npm-registry-client#145](https://github.com/npm/npm-registry-client/pull/145)
  `npm-registry-client@7.3.0`:
  * Allow npm to add headers to outgoing requests.
  * Add `Npm-In-CI` header that reports whether we're running in CI.
  ([@iarna](https://github.com/iarna))
* [`6b6bb08`](https://github.com/npm/npm/commit/6b6bb08af661221224a81df8adb0b72019ca3e11)
  [#14129](https://github.com/npm/npm/pull/14129)
  Send `Npm-Scope` header along with requests to registry. `Npm-Scope` is set to
  the `@scope` of the current top level project. This will allow registries to
  implement user/scope-aware features and services.
  ([@iarna](https://github.com/iarna))
* [`506de80`](https://github.com/npm/npm/commit/506de80dc0a0576ec2aab0ed8dc3eef3c1dabc23)
  [#14129](https://github.com/npm/npm/pull/14129)
  Add test to ensure `Npm-In-CI` header is being sent when CI is set in env.
  ([@iarna](https://github.com/iarna))

#### BUGFIXES

* [`bc84012`](https://github.com/npm/npm/commit/bc84012c2c615024b08868acbd8df53a7ca8d146)
  [#14117](https://github.com/npm/npm/pull/14117)
  Fixes a bug where installing a shrinkwrapped package would fail if the
  platform failed to install an optional dependency included in the shrinkwrap.
  ([@watilde](https://github.com/watilde))
* [`a40b32d`](https://github.com/npm/npm/commit/a40b32dc7fe18f007a672219a12d6fecef800f9d)
  [#13519](https://github.com/npm/npm/pull/13519)
  If a package has malformed metadata, `node.requiredBy` is sometimes missing.
  Stop crashing when that happens.
  ([@creationix](https://github.com/creationix))

#### OTHER PATCHES

* [`643dae2`](https://github.com/npm/npm/commit/643dae2197c56f1c725ecc6539786bf82962d0fe)
  [#14244](https://github.com/npm/npm/pull/14244)
  Remove some ancient aliases that we'd rather not have around.
  ([@zkat](https://github.com/zkat))
* [`bdeac3e`](https://github.com/npm/npm/commit/bdeac3e0fb226e4777d4be5cd3c3bec8231c8044)
  [#14230](https://github.com/npm/npm/pull/14230)
  Detect unsupported Node.js versions and warn about it. Also error on really
  old versions where we know we can't work.
  ([@iarna](https://github.com/iarna))

#### DOC UPDATES

* [`9ca18ad`](https://github.com/npm/npm/commit/9ca18ada7cc1c10b2d32bbb59d5a99dd1c743109)
  [#13746](https://github.com/npm/npm/pull/13746)
  Updated docs for `npm search` options.
  ([@zkat](https://github.com/zkat))
* [`e02a47f`](https://github.com/npm/npm/commit/e02a47f9698ff082488dc2b1738afabb0912793e)
  Move the `npm@3` changelog into the archived changelogs directory.
  ([@zkat](https://github.com/zkat))
* [`c12bbf8`](https://github.com/npm/npm/commit/c12bbf8c5a5dff24a191b66ac638f552bfb76601)
  [#14290](https://github.com/npm/npm/pull/14290)
  Document prepublish-on-install deprecation.
  ([@othiym23](https://github.com/othiym23))
* [`c246a75`](https://github.com/npm/npm/commit/c246a75ac8697f4ca11d316b7e7db5f24af7972b)
  [#14129](https://github.com/npm/npm/pull/14129)
  Document headers added by npm to outgoing registry requests.
  ([@iarna](https://github.com/iarna))

#### DEPENDENCIES

* [`cb20c73`](https://github.com/npm/npm/commit/cb20c7373a32daaccba2c1ad32d0b7e1fc01a681)
  [#13953](https://github.com/npm/npm/pull/13953)
  `signal-exit@3.0.1`
  ([@benjamincoe](https://github.com/benjamincoe))
