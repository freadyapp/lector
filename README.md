# The Lector Experience
![npm-size](https://img.shields.io/npm/v/@robomonk/lector?style=for-the-badge)
![npm-size](https://img.shields.io/bundlephobia/minzip/@robomonk/lector?style=for-the-badge)

### [ 🚀 Demo ](https://robo-monk.github.io/lector)


Lector produces a reading enviroment, and summons a pointer that will help you read more efficient. It's sole purpose is to transfer a piece of text
in the most efficient way possible to your melting brain.

To achieve this, Lector attempts to move the pointer precisely as your eyes would move on the text. This creates a dynamic between the pointer, your eyes and
your mind. This dynamic can be expressed as "wiring in". Also known as super fucking focused on the text.


# To Dev:

```bash
git clone git@github.com:robo-monk/lector.git
cd lector
yarn install
```
To watch JavaScript files, and trigger the rollup bundle:
```bash
yarn dev
```

To watch SASS changes (inside the styles/ folder) as well, open a new terminal tab and:

```bash
yarn dev-style
```

## To develop styles & stuff that use the custom python intepreter:
* Python 3 required

### Run: 
```bash
	virtualenv .lector_env
	source setup
	yarn dev-style
```

# Get Started

## Install

### Use npm or yarn:
```bash
$ npm install @robomonk/lector
```
### CDN:
```html
<script> coming soon </script>
```

## Set up

### Plug & play
The simplest way you can hookup Lector to your document is like this:
```javascript
lec = new Lector("#article")
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

