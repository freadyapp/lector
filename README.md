# The Lector Experience

![npm-size](https://img.shields.io/npm/v/lectorjs?style=flat-square)
![npm-size](https://img.shields.io/npm/l/lectorjs?style=flat-square)
![npm-size](https://img.shields.io/github/commit-activity/m/robo-monk/lector?style=flat-square)
![npm-size](https://img.shields.io/npm/dw/lectorjs?style=flat-square)

### [ 🚀 Demo ](https://freadyapp.github.io/lector)

Lector produces a reading enviroment, and summons a pointer that will help you read more efficient. It's sole purpose is to transfer a piece of text
in the most efficient way possible to your melting brain.

To achieve this, Lector attempts to move the pointer precisely as your eyes would move on the text. This creates a dynamic between the pointer, your eyes and
your mind. This dynamic can be expressed as "wiring in". Also known as super fucking focused on the text.

# Contribute

## First time:

```bash
git clone git@github.com:robo-monk/lector.git
cd lector
yarn install
```

- Python 3 required (prefferably installed with `brew`)
- virtualenv (`pip install virtualenv`)

## Run this to compile the code when you make changes:

Depends on your package manager (my recommendation would be `yarn`)

```bash
source setup yarn
```

```bash
source setup npm
```

# Install

### Use npm or yarn:

```bash
yarn add pragmajs animejs compromise mousetrap
```

### Using pragmajs:

```javascript
import { Script } from 'pragmajs'

await Script.load('https://unpkg.com/lectorjs@latest/dist/lector.umd.js')
lectorjs.globalify() //loaded
```

#### Development

```javascript
import { Script } from 'pragmajs'

console.time('📖 [lectorjs] load...')
await Script.load('https://unpkg.com/lectorjs@latest/dist/lector.umd.js', 'lector')
console.timeEnd('📖 [lectorjs] load...')

lectorjs.globalify() //loaded

// ...
```

## Set up

### Plug & play

The simplest way you can hookup Lector to your document is like this:

```javascript
lec = Lector('#article')

// or if you want to await the initialization
;(async () => {
  await Lector('#article', options)
})()
```

This will trigger a pointer to the element's text, and generate a toolbar to control the pointer's settings.

### Plug harder & play harder

You can declare Lector with many settings:

```javascript
settings = {
  debug: true,
  onboarding: false,
  wfy: false,
  loop: false,
  autostart: false,

  fullStyles: true,
  defaultStyles: true,

  scaler: true,
  pragmatizeOnCreate: true,
  experimental: true,

  settings: true,
  stream: fetchContent,
  // function with index as param that
  // returns the content for the page
  // can return a promise

  paginate: {
    from: 'stream',
    as: 'infiniteScroll',

    config: {
      first: 1,
      last: 69,
      headspace: 4,
      timeout: 1,
      onPageAdd,
      onCreate,
      onCreate,
      onPageActive,
      onPageInactive,
      onPageDestroy,
    },
  },
}

lec = Lector('#article', settings)
```
