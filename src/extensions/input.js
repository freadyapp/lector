import { Pragma, util, _e } from "pragmajs"
export function input(conf = {}) {
    // return new Pragma()
        // .from(util.createTemplate(conf))
        // .run({
            // makeChains(){
                util.createChains(this, 'userInput')
            // },
            // makeInput () {
                this.input = _e(`<input type='text'></input>`)
                    .addClass('pragma-input-text')

                this.setValue = function(v){
                    let newVal = this.valueSanitizer ? this.valueSanitizer(v) : v
                    if (newVal === this._lv) return 

                    this.value = newVal

                    if (this.value != newVal){
                        this.updateFront()
                    }
                    return this
                }

                this.input.listenTo('focus', function(){
                    this.parent._listenToEsc = document.addEventListener('keydown', k => {
                        if (k.key === 'Enter'){
                            this.blur()
                        }
                    })
                })
                
                this.input.listenTo('focusout', function(){
                    this.parent.setValue(this.value)
                    this.parent.userInputChain.exec(this.parent.value)
                    document.removeEventListener('keydown', this.parent._listenToEsc)
                })


                // this.onExport(pragma => {
                    // pragma.adopt(this.input)
                    this.adopt(this.input)
                    this.append(this.input)
                // })
            // },
        
            this.setMonitorTemplate = function(n){
                this._monitorTemplate = n
                return this
            }
            // extend(){
                this.updateFront = function(val=this.value){
                    this.input.value = this._monitorTemplate ? this._monitorTemplate(val) : val
                    this.input.placeholder = val
                }
            // }
        // })
        this.do(function(){
            this.updateFront(this.value)
        })

        // .run(function(){
            this.setInputAttrs = function(attrs){
                for (let [key, val] of Object.entries(attrs)){
                    this.input.attr(key, val)
                }
                return this
            }

            this.setValueSanitizer = function(cb){
                this.valueSanitizer = cb
                return this
            }
        //   })
}
