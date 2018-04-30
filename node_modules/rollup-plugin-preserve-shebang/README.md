# rollup-plugin-preserve-shebang

Automatically preserve a shebang in your entry file.

If you're building CLI's with Rollup, this will fix your npm `bin` being broken :)

## Installation

`npm i -D rollup-plugin-preserve-shebang`

## Usage

```js
import shebang from 'rollup-plugin-preserve-shebang';

export default {
    plugins: [
        shebang()
    ]
}
```

```js
shebang({
    // Override the entry. By default, uses `input` from config:
    entry: path.resolve(process.cwd(), 'src/foo.js'),

    // You can also set it manually if you want, which will always prepend it:
    shebang: '#!/usr/bin/env node'
})
```

## License

MIT
