import { _p, util, _e, Pragma } from "pragmajs"
import { SettingEditor } from "./settingEditor"
import { fadeTo } from "../../helpers/index"


let displayElement = (title) => {
    return _e(`div#${title}-display.display`, 0).setData({'settingTarget': 'display'})
}

let sectionElement = (title, htmlTemp = v => `<div class='title' id='${title}-title'>${v}</div>`) =>
    _e(`div.collapsed-section#${title}-section`)
        .html(htmlTemp(title))
        .append(displayElement(title))

let settingTemplate = (pragma, id, title = id) =>
    _e(`div.setting#${pragma.key}`)
        .setData({ 'setting': id })
        .append(sectionElement(title))
        // .append(editorElement(title))

// const htmlTemplate = `
// <div class='settings'>
//     <div class='setting'>
//     </div>
// </div>

// `.trim()

export class Setting extends Pragma {
    constructor(...args) {
        super()
        this.init(...args)
    }


    init(parent, key) {
        parent.adopt(this)
        parent.create(this, key)

        this.as(settingTemplate(this, key))
            .createEvents('input')
            .on('input', function (input) {
            })
            .on(`${key}Change`, (v, lv) => {
                if (v !== lv) {
                    this.triggerEvent('input', v, lv)
                    // console.log('color changed to', v)
                    // this.element.find('.display').html(`${v}`)
                }

            })
            .appendTo(this.parent)

        this.element.find('.collapsed-section').listenTo("mousedown", () => {
            console.log('openedd')
            this.open()
        })

        this.editor = new SettingEditor(this)
        
    }


    open() {
        const animTime = 100
        const jumpAhead = 10

        this.parent.element.findAll(".collapsed-section").forEach(section => {
            fadeTo(section, 0, animTime)
        })

        console.log(this.editor)

        setTimeout(() => {
            fadeTo(this.editor.element, 1, animTime)
        }, animTime-jumpAhead)

    }

    close() {
        this.parent.element.findAll(".collapsed-section").forEach(section => {
            section.show()
            fadeTo(section, 1, 100)
        })
    }

    updateDisplay(html){
        let el = this.element.find("[data-setting-target='display']")
        if (el) el.html(html)
    }
}

