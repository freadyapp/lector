import { _p, Pragma, _e, util } from "pragmajs"
import { EdibleDisplay } from "./elements/edibleDisplay"
import { SettingInline } from "./settingInline"

const list = [ 1, 2, 3, 4, 5]


export class SettingInt extends SettingInline {
    init(settings, setting, {
        displayName,
        settingTemplate,
        monitorTemplate,
        valueSanitizer= v => parseInt(v),
        size=4,
        plusElement,
        minusElement,
        step=1
    } = {}) {

        if (settingTemplate) this._content = settingTemplate

        this._monitorTemplate = monitorTemplate
        this._valueSanitizer = valueSanitizer
        this._size = size


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
        this.element.setId(setting)
                    .addClass('setting', 'setting-int', 'section')

        if (plusElement){
            if (!this.arrows) this.arrows = _e("div.arrows").appendTo(this.element)
            let _plus = _e(typeof plusElement === 'function' ? plusElement(this) : plusElement)
                    .listenTo('mousedown', () => {
                        this[setting] += step || 1
                    })
            this.arrows.append(_plus)
        }

        if (minusElement){
            if (!this.arrows) this.arrows = _e("div.arrows").appendTo(this.element)
            let _minus = _e(typeof minusElement === 'function' ? minusElement(this) : minusElement)
                    .listenTo('mousedown', () => {
                        this[setting] -= step || 1
                    })
            this.arrows.append(_minus)
        }
    }    

    _content(wire){
        this._edible = new EdibleDisplay(this, wire, {
            valueSanitizer: this._valueSanitizer,
            monitorTemplate: this._monitorTemplate,
            size: this._size
        })
        return _p().append(
                        _e(`div.section#${wire}-section`)
                            .append(_e(`div#title.`, this.displayName || wire))
                            .append(this._edible)
                        )

    }

    updateDisplay(val){
        pragmaSpace.onDocLoad(() => {
            this._edible.updateFront(val)
        })
    }
}
