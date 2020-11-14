import Word from '../../src/pragmas/word.js'
import Mark from "../../src/pragmas/mark.js"
const Pragma = require("pragmajs")
import { wfy } from "../../src/pragmas/helper.js"
import Lector from "../../src/pragmas/lector.js"
import { createMock, mockWordNest } from "./test.helper.js"
import $ from "jquery"


describe("word class is working", () => {
   let element
   let master
   beforeEach(() => {
     element = wfy($("<div>Now there's a look in your eyes, like 2 black holes in the sky</div>"))
     master = new Word(element, null, new Mark(new Pragma.Pragma(element)))
     mockWordNest(master)
   })

  test('word breaks down', () => {
    let element = $("<div> Im destined to live </div>")
    let masterWord = new Word(wfy(element), null, new Mark(new Pragma.Pragma(element)))
    expect(masterWord.virgin()).toBe(false)
  })

  test('word can exist as a singular entity', () => {
    let element = $("<w>Im</w>")
    let virg = new Word(element, null, new Mark(new Pragma.Pragma(element)))
    expect(virg.virgin()).toBe(true)
  })

  describe("word is correctly connected with siblings", () => {
    
    test('word descends succesfully', () => {
      expect(master.children[0].text()).toBe("Now")
      expect(master.children[3].text() == "look")
      expect(master.children[master.children.length-1].text()).toBe("sky")
    })
    test('word next() is working', () => {
      expect(master.children[5].next()).toBe(master.children[6])
      expect(master.children[7].next()).toBe(master.children[8])
      expect(master.children[master.children.length-1].next()).toBe(undefined)
    })

    test('word pre() is working', () => {
      expect(master.children[5].pre()).toBe(master.children[4])
      expect(master.children[7].pre()).toBe(master.children[6])
      expect(master.children[0].pre()).toBe(undefined)
    })

    test('word sigbling(n) is working', () => {
      expect(master.children[5].sibling(8)).toBe(master.children[13])
      expect(master.children[7].sibling(-3)).toBe(master.children[4])
      expect(master.children[0].sibling(-9)).toBe(undefined)
    })

    test('word nest generation mock is working', () => {
      expect(master.children[1].top()).toBe(10)
      expect(master.children[3].top()).toBe(10)
      expect(master.children[7].top()).not.toBe(10)
      expect(master.children[8].top()).not.toBe(10)
    })
    test('word same_line is working', () => {
      expect(master.children[0].same_line(8)).toBe(false)
      expect(master.children[0].same_line(1)).toBe(true)
    })

    test("word first in line is working", () => {
      expect(master.children[0].first_in_line()).toBe(true)
      expect(master.children[4].first_in_line()).toBe(true)
      expect(master.children[6].first_in_line()).toBe(false)
    })

    test("word last in line is working", () => {
      expect(master.children[0].last_in_line()).toBe(false)
      expect(master.children[3].last_in_line()).toBe(true)
      expect(master.children[7].last_in_line()).toBe(true)
    })
  })

  describe.skip("read works", () => {
    let element
    let master
    let mark
    beforeEach(() => {
      element = wfy($("<div>Now there's a look in your eyes, like 2 black holes in the sky</div>"))
      mark = new Mark(new Pragma.Pragma(element))
      mark.settings.add({wpm:100000})
      master = new Word(element, null, mark)
      mockWordNest(master)
    })

    test("word reads recursively", ()=> {
      master.read()
      return expect(new Promise((resolve, reject)=>{
        master.onread = () =>{
          if (master.children[master.cursor].text() == "eyes,") resolve('read')
        }
      })).resolves.toBe('read');
    })

    test("word can pause correctly", ()=> {
      master.read()
      return expect(new Promise((resolve, reject)=>{
        master.onread = () => {
          if (master.children[master.cursor].text() == "look") {
            return new Promise((resolve_pause, reject_pause) => {
              master.pause().then(() => {
                resolve_pause()
              }).then(() => { return resolve('read')})
          })
        }
      }})).resolves.toBe('read');
    })

  })
})

