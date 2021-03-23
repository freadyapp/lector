import { _p, Pragma, _e, util } from "pragmajs"
import { EdibleDisplay } from "./elements/edibleDisplay"
import { SettingInline } from "./settingInline"

const list = [ 1, 2, 3, 4, 5]

let settingTemplate = (pragma) => {
    
}

//let defaultContent = (pragma) => _e(`
    //<div data-setting-target='display'>240</div>
//`.trim())
//
let defaultContent = (pragma, wire) => _p()
                                       .append(`<div>${pragma.displayName || wire}</div>`)
                                       .append(new EdibleDisplay(pragma, wire))
    

   

export class SettingInt extends SettingInline {
    init(settings, setting, {
        displayName,
        settingTemplate,
        monitorTemplate,
        valueSanitizer= v => parseInt(v)
    } = {}) {

        if (settingTemplate) this._content = settingTemplate

        this._monitorTemplate = monitorTemplate
        this._valueSanitizer = valueSanitizer

//  valueSanitizer, monitorTemplate,
        // this.createWire('setting')
        super.init(settings, setting, { displayName,
            settingTemplate: (pragma, wire) => this._content(wire),
        } )
        // this.editor._setContent(defaultContent(this)) // this.editor._setContent(conf.contentTemplate)

        this.on('input', (value) => {
            this.setData({'value': value})
            this.parent.update(this.getData('setting'), value, this)
        })
        
        // console.log(this.element.findAll(`[data-setting-target='display']`))

    }    

    _content(wire){
        this._edible = new EdibleDisplay(this, wire, {
            valueSanitizer: this._valueSanitizer,
            monitorTemplate: this._monitorTemplate
        })
        return _p()
                   .append(`<div>${this.displayName || wire}</div>`)
                   .append(this._edible)

    }

    updateDisplay(val){
        pragmaSpace.onDocLoad(() => {
            this._edible.updateFront(val)
        })
    }
}
