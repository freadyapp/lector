import { Pragma, util } from "pragmajs"
export function input(conf = {}) {
    return new Pragma()
        .from(util.createTemplate(conf))
        .run(function () {
            this.as(`<input type='text'></input>`)

            this.setValue = function(v){
                console.log(this.valueSanitizer)
                this.value = this.valueSanitizer ? this.valueSanitizer(v) : v
                return this
            }

            //this.element.listenTo('input', function () {
                
                //// pragma.value = this.value
                //// this.parent.value = parseInt(this.value)
            //})
            
            this.element.listenTo('focus', function(){
                console.log(this, 'has been focused')
                this.parent._listenToEsc = document.addEventListener('keydown', k => {
                    if (k.key === 'Enter'){
                        this.blur()
                    }
                })
            })
            
            this.element.listenTo('focusout', function(){
                console.log(this, 'has lost focused')
                console.log(this.value)
                
                this.parent.setValue(this.value)
                document.removeEventListener('keydown', this.parent._listenToEsc)
            })


            this.export('actionChain', 'elementDOM', 'setValue')
            this.onExport(pragma => {
                pragma.adopt(this.element)
            })
        })
        .do(function(){
            this.element.value = this.value
            this.element.placeholder = this.value
        })
        .run(function(){
            this.setTemplate = function(tpl){
              this.template = tpl
              return this
            }

            this.setValueSanitizer = function(cb){
                this.valueSanitizer = cb
                return this
            }
            this.export('setTemplate', 'setValueSanitizer')
          })
}
