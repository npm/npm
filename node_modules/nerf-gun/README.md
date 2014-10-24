nerf-gun
========

A tiny utility that returns nerf darts from URLs for npm.

## Usage

Give it a URL and you'll get a "nerf dart":

``` js
var nerfGun = require('nerf-gun')

//
// All of these return the same thing
// '//registry.npmjs.org/'
//
nerfGun('http://registry.npmjs.org')
nerfGun('http://registry.npmjs.org')
nerfGun('http://registry.npmjs.org/some-package')
nerfGun('http://registry.npmjs.org/some-package?write=true')
nerfGun('http://user:pass@registry.npmjs.org/some-package?write=true')
nerfGun('http://registry.npmjs.org/#random-hash')
nerfGun('http://registry.npmjs.org/some-package#random-hash')
```

##### Contributors [Charlie Robbins], [Forrest Norvell]
##### LICENSE

Copyright (c) 2014, Charlie Robbins and Contributors. Adapted under the ISC License from [`npm`](https://github.com/npm/npm/blob/v2.1.5/lib/config/nerf-dart.js) and [`npm-registry-client`](https://github.com/npm/npm-registry-client/blob/v3.2.4/lib/util/nerf-dart.js)

 [Charlie Robbins]: https://github.com/indexzero
 [Forrest Norvell]: https://github.com/othiym23