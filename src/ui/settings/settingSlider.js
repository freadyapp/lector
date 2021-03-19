import { _p, Pragma, _e, util } from "pragmajs"
import { Setting } from "./setting"
import { slider, input, withLabel, idler } from "../../extensions/index"

const list = [1, 2, 3, 4, 5]

let defaultContent = (pragma) => `
    <div data-setting-target='display'>
        8
    </div>
    <div data-setting-target='slider'> =====|-- </div>
`.trim()




export class SettingSlider extends Setting {
    init(settings, setting, conf = {
        contentTemplate: defaultContent,
    }) {

        // this.createWire('setting')

        super.init(...arguments)

        this.slider = _p("!fovea")
                .addClass( 'selector-fovea' )
                .run(slider) // label
                .setRange(2, 10)
                .setValue(5)
                .css(``)
                // .do(actions.changeFovea)
                .run(function(){
                  this.update = (bg) => {
                    this._bar.css(``)
                  }
                }).do(() => {
                    // when the slider changes value set the current setting
                    // value to the same as the slider
                    this[setting] = this.slider.value
                })
          
        this.editor._setContent(defaultContent(this)) // this.editor._setContent(conf.contentTemplate)
        this.editor.element.findAll("[data-setting-target='slider']").forEach(slider => {
            slider.html(" ")
            this.slider.appendTo(slider)
        })

        this.on('input', (value) => {
            console.log('set input', value)
            this.setData({ 'value': value })
            this.parent.update(this.getData('setting'), value, this)
        })

        console.log(this.element.findAll(`[data-setting-target='display']`))

    }
}
