import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

import { terser } from 'rollup-plugin-terser'
import strip from "@rollup/plugin-strip"

import sizes from 'rollup-plugin-sizes'
import json from '@rollup/plugin-json'
import visualizer from 'rollup-plugin-visualizer'
import pkg from './package.json'
import { babel } from '@rollup/plugin-babel'

console.log('[ BUNDLING ] @ ', process.env['LECTOR_ENV'])

const env = process.env['LECTOR_ENV']
const prod = env == 'production' || env == 'prod'

function ifProd(plug, params) {
  return prod ? plug(params) : null
}

const plugs = [
  json(),
  babel({ babelHelpers: 'bundled' }),
  ifProd(visualizer, {
    filename: 'docs/stats.html',
    title: 'LectorJS Visualised',
    sourcemap: false,
  }),
  ifProd(strip),
  ifProd(terser), // mini
  ifProd(sizes),
]

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    //external: ['tippy', 'mousetrap', 'animejs' ],
    output: [
      {
        name: 'lector',
        file: pkg.browser,
        format: 'umd',
      },
      {
        name: 'lector',
        file: 'docs/scripts/lectorjs.umd.js',
        format: 'umd',
      },
    ],
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
    ].concat(plugs),
  },
  {
    input: 'src/index.js',
    external: ['ms', 'tippy', 'mousetrap', 'animejs'],
    // external: ['ms'],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es', sourcemap: true },
    ],
    plugins: [resolve()].concat(plugs),
  },
]
