// import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
// import { terser } from "rollup-plugin-terser"
// import pkg from './package.json';

// export default [
//   // browser-friendly UMD build
//   {
//     input: 'src/index.js',
//     external: [ 'tippy', 'mousetrap', 'animejs' ],
//     output: {
//       name: 'lector',
//       file: pkg.browser,
//       format: 'umd'
//     },
//     plugins: [
//       resolve(), // so Rollup can find `ms`
//       commonjs(), // so Rollup can convert `ms` to an ES module
//       //terser() // mini
//     ]
//   },

//   // CommonJS (for Node) and ES module (for bundlers) build.
//   // (We could have three entries in the configuration array
//   // instead of two, but it's quicker to generate multiple
//   // builds from a single configuration where possible, using
//   // an array for the `output` option, where we can specify
//   // `file` and `format` for each target)
//   {
//     input: 'src/index.js',
//     external: ['ms'],
//     output: [
//       { file: pkg.main, format: 'cjs' },
//       { file: pkg.module, format: 'es' }
//     ]
//   }
// ]

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import { terser } from "rollup-plugin-terser"

import sizes from 'rollup-plugin-sizes';
import visualizer from 'rollup-plugin-visualizer'
import pkg from './package.json';

const plugs = [
  // terser(), // mini
  sizes(),
  visualizer({
    filename: "docs/stats.html",
    title: "LectorJS Visualised",
    sourcemap: false
  })
]

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    external: ['tippy', 'mousetrap', 'animejs' ],
    output: {
      name: 'lector',
      file: pkg.browser,
      format: 'umd'
    },
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module

    ].concat(plugs)
  },
  {
    input: 'src/index.js',
    external: [ 'ms', 'tippy', 'mousetrap', 'animejs' ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      // terser()
    ].concat(plugs)
  }
]
