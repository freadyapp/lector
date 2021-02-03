import { _e, _p } from "pragmajs"
import { Lector } from "../src"

const sample = ` This is just a sample text. Im writing some words. This is not reality.`

describe('lector', ()=>{
    test('1', ()=> {
        let reader = _e("div.", sample)
        let lector = Lector(reader)
        
        expect(lector).not.toBe(null)
    })
})