import { _p, Pragma, _e, util } from "pragmajs"
import { SettingInline } from "./settingInline"

const list = [ 1, 2, 3, 4, 5]

let settingTemplate = (pragma) => {
    
}

let defaultContent = (pragma) => `
    <div data-setting-target='display'>240</div>
`.trim()
    

export class SettingInt extends SettingInline {
    init(settings, setting, conf={
        contentTemplate: defaultContent,    
    }) {

        // this.createWire('setting')

        super.init(...arguments)
        // this.editor._setContent(defaultContent(this)) // this.editor._setContent(conf.contentTemplate)

        this.on('input', (value) => {
            this.setData({'value': value})
            this.parent.update(this.getData('setting'), value, this)
        })
        
        // console.log(this.element.findAll(`[data-setting-target='display']`))

    }    
}
