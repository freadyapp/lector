import { Lector, wfy } from "../../src/"
import $ from "jquery"

global.$ = global.jQuery = $
// wfy test
test('wfy does not alter text', () => {
  let new_div = "<div>Hello ladies and gentlemen</div>"
  expect(wfy(new_div).text).toBe("Hello ladies and gentlemen")
})
test('wfy produces correct <w> components', () => {
  let new_div = "<div>Hello ladies and gentlemen</div>"
  expect(wfy(new_div).html()).toBe("<w>Hello</w> <w>ladies</w> <w>and</w> <w>gentlemen</w>")
})
