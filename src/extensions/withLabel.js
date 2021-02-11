import { input } from "./input"
import { Pragma } from 'pragmajs'
export function withLabel(conf = {}) {
    return new Pragma()
        // this.from(input(conf))
        .run(function(){
            this.setLabel = function(html){
                this._label.html(html)
                return this
            }
            
            this.onExport(function(pragma){
                pragma._label = _e('div.pragma-label', conf.label)
                pragma.append(pragma._label)    
            })
            
            this.export('setLabel')
        })
}
