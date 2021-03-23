import { Pragma, util, _e } from "pragmajs"

const edibleDisplayTemplate = (pragma) => _e('input')
                                    .attr('type', 'text')
                                    .setData({settingTarget: 'display'})
                                    .addClass('edible-display')


export class EdibleDisplay extends Pragma {
    constructor(pragma, wire, {
        valueSanitizer= v=>v,
        monitorTemplate= v=>v
    }={}){
        super()
        this._monitorTemplate = monitorTemplate
        console.log('new edible display', pragma, wire)

        this.createWire('val')
        
        this.on('valChange', (v, lv) => {
            if (v != lv){
                console.log('value changed to', v)
                pragma[wire] = v
            }
            
            this.updateFront(pragma[wire])
        })

        this.as(edibleDisplayTemplate(pragma))
        this.adopt(this.element)

        console.log('input event', pragma._events)

        this.element.listenTo('focus', function () {
            this.value = ""
            this.parent._listenToEsc = document.addEventListener('keydown', k => {
                if (k.key === 'Enter') {
                    this.blur()
                }
            })
        })

        this.element.listenTo('focusout', function () {
            this.parent.setVal(valueSanitizer(this.value))
            document.removeEventListener('keydown', this.parent._listenToEsc)
        })
    }

    updateFront(val) {
        this.element.value = this._monitorTemplate(val)
        this.element.placeholder = val
    }


}

// new EdibleDisplay(this, )