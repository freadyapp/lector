import { _e, _p } from "pragmajs"
import { ui } from "../src"

const sample = ` This is just a sample text. Im writing some words. This is not reality.`

describe('lector', ()=>{
    test('settings only sync when necessary', ()=> {
        let settings = new ui.Settings()

        let times = 0
        settings.on('update', (key, value) => {
            // console.log("(!) sync:", key, "->", value)
            times ++
        })
        
        
        let c = [ "#1", "#2", "#3" ]

        let colorSetting = _p('color')
                    .createWire("hex")

        let mode = _p('mode')

        settings.add(colorSetting, "hex")

        settings.create(mode, "mode")
        settings.create(colorSetting, "hex")

        expect(mode.mode).toBe(undefined)
        mode.setMode("faded")
        colorSetting.setHex(c[0])
        colorSetting.setHex(c[0])
        mode.setMode("faded")
        colorSetting.setHex(c[0])
        mode.setMode("faded")
        mode.setMode("yannis")
        colorSetting.setHex(c[0])
        mode.setMode("faded")
        expect(mode.mode).toBe("faded")
        colorSetting.setHex(c[0])
        colorSetting.setHex(c[0])
        mode.setMode("honestly")
        mode.setMode("honestly")
        mode.setMode("honestly")
        expect(mode.mode).toBe("honestly")
        
        expect(times).toBe(5)
    })
})

describe("initializes a lector", () => {
    test('simple case', () => {
        expect(true).toBe(true)
    })
})