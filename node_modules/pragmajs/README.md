![npm-size](https://img.shields.io/npm/v/pragmajs?style=for-the-badge)
![npm-size](https://img.shields.io/bundlephobia/minzip/pragmajs?style=for-the-badge)

<img width=320px src="docs/logos/pragmajs.png">

<br>

## Dead simple, fast UI-composer in JavaScript 

### [Check out Demo](https://robo-monk.github.io/pragmajs)

*pragma js is still heavily under development, come back next month for the finished project 

<br>

# Installation
```bash
npm i pragmajs
```

# Hello Worlds
If you're new to `pragma.js`, I'd recommend after doing the hello world, to read this doc further and more in depth to understand how `pragma` trully works and make the best use out of it. 

<br>

`colors.js`

```js
import { variants, compose }, PragmaComposer from "pragmajs"

let colors = [ "tomato", "lime", "navy" ]
let colorsComp = compose(variants("colors", colors))

colorsComp.pragmatize() // append it to the DOM
```
will produce:
color chooser

<br>
You can add further functionality:

<br>
<br>

`colors+fonts.js`

```js
import { variants, pragmatize }, PragmaComposer from "pragmajs"

let colors = [ "tomato", "lime", "navy" ]
let colorsComp = pragmatize(variants("colors", colors))

let fonts = [ "Roboto", "Times", "Helvetica", "Open Sans" ]
let onFontSet = (font) => {
  // this will run each time the font value is changed by the user or something else
  this.document.style.fontFamily = font
}

let fontsComp = pragmatize(variants("colors", colors, onFontSet))
// you can create a composer, and immediently
// append it with pragmatize(pragmaMap)
```
will produce:

Pragma is heavily extensible, and it provides many templates that you can use. You can create your own and share it with other as well. Go to here, to see whats available and how to contribute (easy af)
<br>
<br>
The equivelant thing to `colors+fonts.js` with a template would be:

```js
import { pragmatize, colorPicker, fontPicker } from "pragma.js"

let colors = [ "tomato", "lime", "navy" ]
pragmatize(colorPicker(colors))

let fonts = [ "Roboto", "Times", "Helvetica", "Open Sans" ]
pragmatize(fontPicker(fonts))
```

One powerful thing with `pragma` is that you can contain, elements within elements, just like in `HTML` where you can have `div`s inside `div`s, 

You can interlink `Pragma Composer`s in all kind of ways, but most of the time you'd probably use `contain` and `host`.
```js

import { pragmatize, colorPicker, fontPicker } from "pragma.js"
let colors = [ "tomato", "lime", "navy" ]
let fonts = [ "Roboto", "Times", "Helvetica", "Open Sans" ]

let comp = contain("settings", [colorPicker(colors), fontPicker(fonts)])
comp.pragmatize()
```

```js
import {} from "pragmajs"

let marker = new Marker()

let colorsComp = colorPicker(marker.colors, (color) => marker.setColor(color))
let foveaComp = valuePicker({ 
  value: marker.fovea,
  min: 1,
  max: 15
  }, (value) => marker.setFovea(value))


let fontsComp = fontPicker(reader.fonts, (font) => reader.setFont(font))
let advancedComp = empty()

let settingsComp

let wpmComp = valuePicker({ 
  value: marker.wpm,
  min: 50,
  max: 42069 
  }, (value) => marker.setWpm(value))

wpmComp.pragmatizeWith({
  "position": "absolute",
  // css
})

wpmComp.pragmatizeAs("coolDiv", "wpmComp") // class + id of the div

wpmComp.pragmatize() // append it to the dom.
// the element will have the wpmComp.key as the id, and wpmComp.type as a class

```
<br>

# Boiling it down

```js
import PragmaComposer from "pragmajs"
let nice = 69
let pragmaMap = {
  key: "settings",
  icon: "icons/settings",
  type: "composer",
  elements: [{
      key: "Nice",
      value: nice,
      type: "value_choose"
    }]
  }
new PragmaComposer(pragmaMap)
```

A `pragmaMap` represents the structure of a `PragmaComposer`. Depending on your situation, you can have multiple `PragmaComposer`s in a page, controlling and monitoring different types of data.
<br>
<br>
The `key` concept of `pragmajs` is that a `PragmaComposer` can have `PragmaComposer`s as subelements - as children.

Since this is a recursive definition, you can beatifuly contain multiple `PragmaComposer`s
<br>
<br>
Its 
 dictionary that contains the structure of the dom page, and connects "phsycial" elements with objects behind the screen.

`pragmaMap idea`

Each `pragmaMap` is a map for creating 1 html element. When passing a `pragmaMap` to a `PragmaComposer`, the `PragmaComposer` generates, and appends the mapped element to the dom. A `pragmaMap` object contains the following attributes. You can specify these attributes, to generate different type of UI components.


<br>
<br>

# Go down the rabbit hole
Pragma.js treats JavaScript objects, as "physical" elements, elements that will be on the user's screen.

## Definitions
A `Pragma` is effectively an object that has a `.element` attribute, that returns the HTML element of that object.

A `Pragma` can also have `Pragma` children. The `.element` is dynamically generated each time you call it, and it computes the html element that each `Pragma` represents.


You can declare a `Pragma` directly, but usually you'll want to build `Pragma` structures, which you can do through a `PragmaComposer`.




### Pragma Map Templates

To create an element with an icon, that when you hover over it a popup appears with some elements in it.

```js
let someValue = 420
let someChoices = ["green", "blue", "orange"]
let pragma Map = {
  key: "settings", // name and id of the object
  icon: "icons/settings", 
  // from the default icons that pragma.js contains, grab the setttings one
  
  elements: [ // elements is an array of pragmaMaps. 
  // The html elements that these pragmaMaps generate will 
  // be appended to the upper object #recursion🎸

    {
      key: "someElement",
      type: "value_choice",
      min: 1,
      max: 10,
      step: 1,
      value: someValue
    },
    {
      key: "someChoices",
      value: colorIndex
      type: "choice",
      element_template: (key, index) => {
        return {
          key: key,
          value: index,
          icon: `<div style='width:25px;height:25px;
              border-radius:25px;background:${key}'></div>`,
          click: (value) => { colorIndex = value }
        }
      },
      choices: someChoices
    }
  ],
  
  type: "showonhover" // show the elements when hovered, in a nice popup
}
 ```
