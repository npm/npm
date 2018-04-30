import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import shebang from 'rollup-plugin-preserve-shebang'

export default {
  input: 'lib/npm.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  acorn: {allowHashBang: true},
  plugins: [
    shebang(),

    nodeResolve({
      module: false,
      main: true
    }),

    commonjs({
      include: ['node_modules/**', 'lib/**', 'bin/**'],
      sourceMap: false
    })
  ]
}
