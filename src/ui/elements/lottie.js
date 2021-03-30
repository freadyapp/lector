import { Pragma, Script, _e, html, _p, util } from "pragmajs"
Script.load("https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js", "load")

const LOTTIES = {
    space: "https://assets9.lottiefiles.com/private_files/lf30_thomociq.json"
}


export class Lottie extends Pragma {
    static url(url, name=util.rk8()) {
        console.time(`load loattie ${name}`)
        return html`
            <lottie-player id="${name}" class='lottie' src="${url}" 
                background="transparent"
                speed="1" 
                loop autoplay>
            </lottie-player>
        `
        .setData({ loading: true })
        .listenTo('load', function() {
            console.timeEnd(`load loattie ${name}`)
            this.setData({ loading: false })
        })
    }

    static name(name) {
        return Lottie.url(LOTTIES[name], name)
    }
}
