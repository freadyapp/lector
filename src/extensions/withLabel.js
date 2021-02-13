import { _e } from 'pragmajs'
export function withLabel(conf = {}) {
    this.setLabel = function(html){
        this._label.html(html)
        return this
    }
    
    this._label = _e('div.pragma-label', conf.label)
    this.append(this._label)    
}
