import { Pragma, Script, _e, html, _p, util } from "pragmajs"
// console.log(lottie)

// function loadLottieScript() {
    // if (Lottie._loadedCDN) return new Promise(r=>r())
    // Lottie._loadedCDN = true
// Script.load("https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js", "lottie")
// Script.load("https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js", "lottie")
// }
// Script.load("https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.7.8/lottie.min.js", "load")

export class Lottie extends Pragma {
    
    static loadedScript = false

    async init(src, name) {
        if (!Lottie.loadedScript) Script.load("https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js", "lottie")
        
        Lottie.loadedScript = true
        // await loadLottieScript()
        this.createEvent('load')
        this.createElement(src, name)
    }

    createElement(src, name=util.rk8()) {
        let pragmaSelf = this
        this.as(
            html`
                <lottie-player id="${name}" class='lottie' src="${src}" 
                    background="transparent"
                    speed="1" 
                    loop autoplay>
                </lottie-player>
            `
                .setData({ loading: true })
                .css(`
                transition all ease 0.3s
                opacity 0
            `)
                .listenTo('load', function () {
                    // console.timeEnd(`load loattie ${name}`)
                    this.setData({ loading: false })
                    this.css('opacity 1')
                    pragmaSelf.triggerEvent('load')
                })
        )
    }

    // static url(url, name=util.rk8()) {
    //     console.time(`load loattie ${name}`)
    //     return html`
    //         <lottie-player id="${name}" class='lottie' src="${url}" 
    //             background="transparent"
    //             speed="1" 
    //             loop autoplay>
    //         </lottie-player>
    //     `
    //     .setData({ loading: true })
    //     .css(`
    //         transition all ease 0.3s
    //         opacity 0
    //     `)
    //     .listenTo('load', function() {
    //         console.timeEnd(`load loattie ${name}`)
    //         this.setData({ loading: false })
    //         this.css('opacity 1')
    //     })
    // }

    // static name(name) {
    //     return Lottie.url(LOTTIES[name], name)
    // }
}

export function _lottie() {
    return new Lottie(...arguments)
}