# The Lector Experience
![npm-size](https://img.shields.io/npm/v/@robomonk/lector?style=for-the-badge)
![npm-size](https://img.shields.io/bundlephobia/min/lector-pdfjs)

### [ 🚀 Demo ](https://robo-monk.github.io/lector)


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
* Python 3 required (prefferably installed with `brew`)
* virtualenv (`pip install virtualenv`)

## Run this to compile the code when you make changes:

Please use yarn as your manager for this project, but if you can use npm if you want. It will work with both.
```bash
source setup yarn
```

```bash
source setup npm
```

# Install

### Use npm or yarn:
```bash
$ npm install @robomonk/lector
```

## Set up

### Plug & play
The simplest way you can hookup Lector to your document is like this:
```javascript
lec = Lector("#article")
```

This will trigger a pointer to the element's text, and generate a toolbar to control the pointer's settings.

### Plug harder & play harder

You can declare Lector with many settings:
```javascript
settings = {
  // these are the default values
  "toolbar": false,
  "topbar": false,
  "loop": false,
  "autostart": false,
  "interactive": true,
  "shortcuts": true, // if interactive is false, this option doesnt do anything
  "freadify": true // will convert plain text to .frd format (scroll to the .frd format section for more)
}

lec = new Lector("#article", settings)
```

