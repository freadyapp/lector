import { Pragma, Script, _e, html, _p, util } from "pragmajs"
Script.load("https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js", "load")

const LOTTIES = {
    click: "https://assets9.lottiefiles.com/private_files/lf30_thomociq.json", 
    space: 'https://assets4.lottiefiles.com/private_files/lf30_mohfpxha.json',
    speed: 'https://assets8.lottiefiles.com/private_files/lf30_7sexuvbq.json'
    

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
        .css(`
            transition all ease 0.3s
            opacity 0
        `)
        .listenTo('load', function() {
            console.timeEnd(`load loattie ${name}`)
            this.setData({ loading: false })
            this.css('opacity 1')
        })
    }

    static name(name) {
        return Lottie.url(LOTTIES[name], name)
    }
}
