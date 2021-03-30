import { Pragma, util, _e } from "pragmajs"

const edibleDisplayTemplate = (pragma) => _e('input')
                                    .attr('type', 'text')
                                    
                                    .setData({settingTarget: 'display'})
                                    .addClass('edible-display')


export class EdibleDisplay extends Pragma {
    constructor(pragma, wire, {
        valueSanitizer= v=>v,
        monitorTemplate= v=>v,
        size=4
    }={}){
        super()
        this._size = size
        this._monitorTemplate = monitorTemplate

        this.createWire('val')
        
        this.on('valChange', (v, lv) => {
            if (v != lv){
                // console.log('value changed to', v)
                pragma[wire] = v
            }
            
            this.updateFront(pragma[wire])
        })

        this.as(edibleDisplayTemplate(pragma))
        this.adopt(this.element)

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
        
        this._setSize(size)
    }

    updateFront(val) {
        this.element.value = this._monitorTemplate(val)
        this.element.placeholder = val
    }


    _setSize(size){
        this.element
            .attr('maxlength', size)
            .attr('size', size)

        return this
    }
}

// new EdibleDisplay(this, )