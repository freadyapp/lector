import { util } from "pragmajs"
import { Idle } from "../helpers/index"

function _createIdler(timeout, afk, active) {
    let _idler = new Idle(timeout)
      .onAfk(()=> {
        console.log('user is afk')
        if (afk) afk()
        // this.shout()
      })
      .onActive(() => {
        console.log('user is back')
        if (active) active()
        // this.shutUp()
    })
    return _idler
}

export function idler(){
    util.createChains(this, 'idle', 'active')

    this.setIdleTime = function(time=5000){
        this._idler = _createIdler(time, () => {
            this.idleChain.exec()
        }, () => {
            this.activeChain.exec()
        })
        return this
    }
    
    this.extend('onIdle', function(){
        this._onIdle(...arguments)
        return this
    })

    this.extend('onActive', function(){
        this._onActive(...arguments)
        return this
    })
}
