import { _p, util, _e, Pragma } from "pragmajs"

let displayElement = (key) => {
    return _e(`div#${key}-display.display`, 0).setData({'settingTarget': 'display', 'pragmaTarget': `${key} monitor`})
}

let sectionElement = ({
    key,
    title,
    htmlTemp = (key, title) => `<div class='title' id='${key}-title'>${title}</div>`
}) =>
    _e(`div.section#${key}-section`)
        .html(htmlTemp(key, title))
        .append(displayElement(key))

let inlineSettingTemplate = (pragma, key) =>
    _e(`div.setting.inline#${key}`)
        .setData({ 'setting': key })
        .append(sectionElement({
            key: key,
            title: pragma.displayName
        }))



export class SettingInline extends Pragma {
    constructor() {
        super()
        this.init(...arguments)
    }

   
    init(parent, key, {
        displayName,
        settingTemplate,
    }={}) {
        console.log('im the parent setting and i was run')
        parent.adopt(this)
        parent.create(this, key)

        this.displayName = displayName || key

        this.as((settingTemplate || inlineSettingTemplate)(this, key))
            .createEvents('input')
            .on('input', function (input) {
                this.updateDisplay(input)
            })
            .on(`${key}Change`, (v, lv) => {
                if (v !== lv) {
                    this.triggerEvent('input', v, lv)
                    // console.log('color changed to', v)
                    // this.element.find('.display').html(`${v}`)
                }

            })

    }

    updateDisplay(html){
        pragmaSpace.onDocLoad(() => {
            let el = this.element.findAll("[data-setting-target='display']")
            console.log('updating', html, el)
            el.forEach(el => el.html(html))
        })
    }
}