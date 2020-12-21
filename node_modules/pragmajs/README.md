![npm-size](https://img.shields.io/npm/v/pragmajs?style=for-the-badge)
![npm-size](https://img.shields.io/bundlephobia/minzip/pragmajs?style=for-the-badge)

<img width=320px src="docs/logos/pragmajs.png">

<br>

## Dead simple, fast UI-composer in JavaScript 

### [Check out Demo](https://robo-monk.github.io/pragmajs)

<br>

# Installation
```bash
npm i pragmajs
```

# What is PragmaJS?

Pragmajs is built in a way where it can use pure javascript (currently it depends on jquery for the simplicity jquery provides, but in a future jquery will not be necessary) to create complicated interactions between DOM elements and virtual-behind the screens JS objects, called **Pragmas**. The key point of this, is that Pragmas can contain Pragmas themselves and have a parent-child relation with them, which creates a funnel of information.

This means that virtually any problem and design, can be solved and done with Pragma, since its infinitely possible to break the problem down, and handle the smaller problems, by breaking them down even more. Its kind of abstract, but I will get into details in a bit. I first have to introduce the **main** - and **only** "component" (if youre coming from React or other frameworks), **concept** that Pragma has.

A Pragma essentially is a JavaScript object which **represents** a DOM element (like a button) in the canvas. Each Pragma contains a **value**. This value can be any variable type, but it usually is just an integer (cause front end is simple *aham angular*). Every time the value is changed, the Pragma is responsible to run an **Chain of Actions** (ActionChain), which can reflect the change of that value to the Pragma itself (eg. change its DOM element's background color), or other Pragmas and objects (eg. fade them out).

The premise is, that a Pragma can contain other Pragmas - it can have **children**. I know it sounds funny, and I have some really funny named functions in the code (which i encourage you to read), but its such a powerful concept.

It relies on the fact that a Pragma runs its chain of actions every time a children's value is **changed** as well. This means that you can have one singular pragma doing the high-level processing, and some other "smaller" Pragmas holding values and talking to the end user.

I find this fascinating, but this is still abstract. It needs another layer of abstraction (pun very much intended) to be ground breaking, so that's why Pragmajs heavily relies on Templates. A **template is** basically **a Map for creating a Pragma**. 

A Menu Template, for example, would create a Pragma that has a value that changes every time a user clicks a different menu choice. You would pass it an array of options, and it would **create the pragma for you**. You don't even need to know how many pragmas it generated, you only user the "**master**" of all the possible sub pragmas, which holds 1 singular value, treating **1 problem**, and contributing towards solving your bigger problem. 

Which itself at the end has 1 singular variable if any, but treats 1 problem. The end user doesn't care how many sub problems you had as dev to solve. You don't care how many sub sub problems a template has to solve to solve your sub problem, which in our case was a menu to edit some settings for your quantum cloud computing graph. Because you still can't center a div and CSS still is a pain in the ass.

I really came to appreciate how powerful and beautiful this concept is, and made some templates, which are included in the distribution. But the actual beauty of it is that you can and probably should **create your own templates** **using** some basic and "essential" **templates** pragma has at the moment.

I hope **you** build **epic things** with it.

robomonk


