# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.9.0"></a>
# 1.9.0 (2018-03-01)


### Bug Fixes

* **archiveTarball:** generate hashes for existing tarballs anyway ([59932a9](https://github.com/zkat/my-precious/commit/59932a9))
* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **integrity:** make it play nicer with npm itself ([ebd2f3d](https://github.com/zkat/my-precious/commit/ebd2f3d))
* **log:** no need to set level here ([d78cda8](https://github.com/zkat/my-precious/commit/d78cda8))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **output:** better output for cli ([2cb5a5a](https://github.com/zkat/my-precious/commit/2cb5a5a))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **tarballInfo:** guard against undefined dep.resolved ([1a4ec12](https://github.com/zkat/my-precious/commit/1a4ec12))
* **tarballInfo:** mostly idempotent integrity updates ([a3c84a7](https://github.com/zkat/my-precious/commit/a3c84a7))
* **tarballs:** fs-safe names for all the spec types ([2f70f11](https://github.com/zkat/my-precious/commit/2f70f11))
* **tarballs:** only append shortHash for appropriate files ([ab57677](https://github.com/zkat/my-precious/commit/ab57677))
* **unarchive:** skip manifest lookup for git and directory deps ([7a1e178](https://github.com/zkat/my-precious/commit/7a1e178))
* **unarchive:** verify integrity when unarchiving, for relevant types only ([2874ee3](https://github.com/zkat/my-precious/commit/2874ee3))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **idempotent:** skip rewriting existing tarballs + remove dangling ones ([a04fb80](https://github.com/zkat/my-precious/commit/a04fb80))
* **log:** nicer logging and timing info ([4f12053](https://github.com/zkat/my-precious/commit/4f12053))
* **reset:** add support for resetting to pre-archive state ([7a5953e](https://github.com/zkat/my-precious/commit/7a5953e))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))
* **save:** detect newlines and save them appropriately ([b61ea17](https://github.com/zkat/my-precious/commit/b61ea17))
* **unarchive:** remove node_modules when unarchiving ([324e8f4](https://github.com/zkat/my-precious/commit/324e8f4))
* **unarchive:** restore stuff to pre-archive state ([31bc71f](https://github.com/zkat/my-precious/commit/31bc71f))



<a name="1.8.0"></a>
# 1.8.0 (2018-03-01)


### Bug Fixes

* **archiveTarball:** generate hashes for existing tarballs anyway ([59932a9](https://github.com/zkat/my-precious/commit/59932a9))
* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **integrity:** make it play nicer with npm itself ([ebd2f3d](https://github.com/zkat/my-precious/commit/ebd2f3d))
* **log:** no need to set level here ([d78cda8](https://github.com/zkat/my-precious/commit/d78cda8))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **output:** better output for cli ([2cb5a5a](https://github.com/zkat/my-precious/commit/2cb5a5a))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **tarballInfo:** guard against undefined dep.resolved ([1a4ec12](https://github.com/zkat/my-precious/commit/1a4ec12))
* **tarballInfo:** mostly idempotent integrity updates ([a3c84a7](https://github.com/zkat/my-precious/commit/a3c84a7))
* **tarballs:** fs-safe names for all the spec types ([2f70f11](https://github.com/zkat/my-precious/commit/2f70f11))
* **tarballs:** only append shortHash for appropriate files ([ab57677](https://github.com/zkat/my-precious/commit/ab57677))
* **unarchive:** skip manifest lookup for git and directory deps ([7a1e178](https://github.com/zkat/my-precious/commit/7a1e178))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **idempotent:** skip rewriting existing tarballs + remove dangling ones ([a04fb80](https://github.com/zkat/my-precious/commit/a04fb80))
* **log:** nicer logging and timing info ([4f12053](https://github.com/zkat/my-precious/commit/4f12053))
* **reset:** add support for resetting to pre-archive state ([7a5953e](https://github.com/zkat/my-precious/commit/7a5953e))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))
* **save:** detect newlines and save them appropriately ([b61ea17](https://github.com/zkat/my-precious/commit/b61ea17))
* **unarchive:** restore stuff to pre-archive state ([31bc71f](https://github.com/zkat/my-precious/commit/31bc71f))



<a name="1.7.0"></a>
# 1.7.0 (2018-02-28)


### Bug Fixes

* **archiveTarball:** generate hashes for existing tarballs anyway ([59932a9](https://github.com/zkat/my-precious/commit/59932a9))
* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **integrity:** make it play nicer with npm itself ([ebd2f3d](https://github.com/zkat/my-precious/commit/ebd2f3d))
* **log:** no need to set level here ([d78cda8](https://github.com/zkat/my-precious/commit/d78cda8))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **output:** better output for cli ([2cb5a5a](https://github.com/zkat/my-precious/commit/2cb5a5a))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **tarballInfo:** guard against undefined dep.resolved ([1a4ec12](https://github.com/zkat/my-precious/commit/1a4ec12))
* **tarballInfo:** mostly idempotent integrity updates ([a3c84a7](https://github.com/zkat/my-precious/commit/a3c84a7))
* **tarballs:** fs-safe names for all the spec types ([2f70f11](https://github.com/zkat/my-precious/commit/2f70f11))
* **tarballs:** only append shortHash for appropriate files ([ab57677](https://github.com/zkat/my-precious/commit/ab57677))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **idempotent:** skip rewriting existing tarballs + remove dangling ones ([a04fb80](https://github.com/zkat/my-precious/commit/a04fb80))
* **log:** nicer logging and timing info ([4f12053](https://github.com/zkat/my-precious/commit/4f12053))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))
* **save:** detect newlines and save them appropriately ([b61ea17](https://github.com/zkat/my-precious/commit/b61ea17))
* **unarchive:** restore stuff to pre-archive state ([31bc71f](https://github.com/zkat/my-precious/commit/31bc71f))



<a name="1.6.0"></a>
# 1.6.0 (2018-02-24)


### Bug Fixes

* **archiveTarball:** generate hashes for existing tarballs anyway ([59932a9](https://github.com/zkat/my-precious/commit/59932a9))
* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **integrity:** make it play nicer with npm itself ([ebd2f3d](https://github.com/zkat/my-precious/commit/ebd2f3d))
* **log:** no need to set level here ([d78cda8](https://github.com/zkat/my-precious/commit/d78cda8))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **output:** better output for cli ([2cb5a5a](https://github.com/zkat/my-precious/commit/2cb5a5a))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **tarballInfo:** guard against undefined dep.resolved ([1a4ec12](https://github.com/zkat/my-precious/commit/1a4ec12))
* **tarballInfo:** mostly idempotent integrity updates ([a3c84a7](https://github.com/zkat/my-precious/commit/a3c84a7))
* **tarballs:** fs-safe names for all the spec types ([2f70f11](https://github.com/zkat/my-precious/commit/2f70f11))
* **tarballs:** only append shortHash for appropriate files ([ab57677](https://github.com/zkat/my-precious/commit/ab57677))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **idempotent:** skip rewriting existing tarballs + remove dangling ones ([a04fb80](https://github.com/zkat/my-precious/commit/a04fb80))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))
* **save:** detect newlines and save them appropriately ([b61ea17](https://github.com/zkat/my-precious/commit/b61ea17))



<a name="1.5.0"></a>
# 1.5.0 (2018-02-23)


### Bug Fixes

* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **integrity:** make it play nicer with npm itself ([ebd2f3d](https://github.com/zkat/my-precious/commit/ebd2f3d))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **tarballInfo:** guard against undefined dep.resolved ([1a4ec12](https://github.com/zkat/my-precious/commit/1a4ec12))
* **tarballInfo:** mostly idempotent integrity updates ([a3c84a7](https://github.com/zkat/my-precious/commit/a3c84a7))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **idempotent:** skip rewriting existing tarballs + remove dangling ones ([a04fb80](https://github.com/zkat/my-precious/commit/a04fb80))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))



<a name="1.4.0"></a>
# 1.4.0 (2018-02-23)


### Bug Fixes

* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **integrity:** make it play nicer with npm itself ([ebd2f3d](https://github.com/zkat/my-precious/commit/ebd2f3d))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **tarballInfo:** guard against undefined dep.resolved ([1a4ec12](https://github.com/zkat/my-precious/commit/1a4ec12))
* **tarballInfo:** mostly idempotent integrity updates ([a3c84a7](https://github.com/zkat/my-precious/commit/a3c84a7))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))



<a name="1.3.0"></a>
# 1.3.0 (2018-02-23)


### Bug Fixes

* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **tarballInfo:** guard against undefined dep.resolved ([1a4ec12](https://github.com/zkat/my-precious/commit/1a4ec12))
* **tarballInfo:** mostly idempotent integrity updates ([a3c84a7](https://github.com/zkat/my-precious/commit/a3c84a7))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))



<a name="1.2.0"></a>
# 1.2.0 (2018-02-23)


### Bug Fixes

* **config:** default referer -> libprecious ([633f92b](https://github.com/zkat/my-precious/commit/633f92b))
* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **log:** pass log object through ot pacote ([af8f032](https://github.com/zkat/my-precious/commit/af8f032))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
* **windows:** normalize resolved paths on Windows to use / ([c2da48f](https://github.com/zkat/my-precious/commit/c2da48f))


### Features

* **archive:** standalone `archiveTarball` + better archive names ([e89546e](https://github.com/zkat/my-precious/commit/e89546e))
* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))
* **save:** add support for --only and --also envs ([ac8cc79](https://github.com/zkat/my-precious/commit/ac8cc79))



<a name="1.1.0"></a>
# 1.1.0 (2018-02-20)


### Bug Fixes

* **deps:** npmlog was missing from cli ([aad8bd9](https://github.com/zkat/my-precious/commit/aad8bd9))
* **integrity:** generate integrity for all existing algorithms ([987c8b1](https://github.com/zkat/my-precious/commit/987c8b1))
* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))


### Features

* **archive:** write out archives as uncompressed .tar ([e5bfa70](https://github.com/zkat/my-precious/commit/e5bfa70))



<a name="1.0.1"></a>
## 1.0.1 (2018-02-20)


### Bug Fixes

* **saveTar:** got it working ([6f541d6](https://github.com/zkat/my-precious/commit/6f541d6))
