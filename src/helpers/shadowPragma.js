import { Pragma, html, _e, util } from "pragmajs"

export class ShadowPragma extends Pragma {
    constructor() {
        super(...arguments)
        this.isShadowPragma = true
    }

    as(e) {
        if (!e) return

        e = _e(e)
        let clone = e.cloneNode(true)

        e.html(' ')
            .attachShadow({ mode: 'open' })

        e.shadowRoot.appendChild(clone)
        return super.as(e)
    }

    get shadow() {
        return _e(this.element.shadowRoot.firstChild)
    }

    injectStyle(style, name) {
        this.element.shadowRoot.appendChild(html`<style id='${name || util.rk5()}-styles'>${style}</style>`)
        return this
    }

    injectStyles(...styles) {
        for (let style of styles) this.injectStyle(style)
        return this
    }
}


export function _shadow() {
    return new ShadowPragma(...arguments)
}
