import Word from '../../src/pragmas/word.js'
import Mark from "../../src/pragmas/mark.js"
const Pragma = require("pragmajs")
import $ from "jquery"

describe("knows the hard words", () => {
  let element
  let word
  let mark
  function setup(w){
    element = $(`<w>${w}</w>`)
    mark = new Mark(new Pragma.Pragma(element))
    word = new Word(element, null, mark)
  }

  describe("verbs are abstract", ()=>{
    test("verbs are abstract - small verb", () =>{
      setup("eat")
      let verb_time = word.time()
      setup("and")
      expect(word.time()).toBeLessThan(verb_time)
    })
    test("verbs are abstract - medium verb", () =>{
      setup("dissecting")
      let verb_time = word.time()
      // setup("extracting")
      setup("evacuation")
      expect(word.time()).toBeLessThan(verb_time)
    })
  })
  

  describe("acronyms are hard", ()=>{
    test("lucy in the sky with diamonds", () =>{
      setup("LSD")
      let acro_time = word.time()
      // setup("extracting")
      setup("eat")
      expect(word.time()).toBeLessThan(acro_time)
    })

    test("NASA", () =>{
      setup("NASA")
      let acro_time = word.time()
      // setup("extracting")
      setup("eat")
      expect(word.time()).toBeLessThan(acro_time)
    })
  })

  describe("recognize greek root words", ()=>{
    test("biology", () =>{
      setup("aaaaaaaaaaaaaa")
      let other = word.time()
      // setup("extracting")
      setup("ophthalmiatic")
      expect(word.time()).toBeGreaterThan(other)
    })

    test("psychedelic", () =>{
      setup("psychedelic")
      let greek_time = word.time()
      // setup("extracting")
      setup("aaaaaaaaaaaaa")
      expect(word.time()).toBeLessThan(greek_time)
    })

    test("greek word easier than a more greek word", () =>{
      setup("technology")
      let more_greek = word.time()
      setup("bioextraction")
      expect(word.time()).toBeLessThan(more_greek)
    })
  })

  test.skip("medium complicated word", () =>{
    setup("lysergic")
    expect(word.time()).toBe(1)
  })
})