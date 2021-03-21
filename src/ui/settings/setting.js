import { _p, util, _e, Pragma } from "pragmajs"
import { SettingEditor } from "./settingEditor"
import { fadeTo, expand, collapse } from "../../helpers/index"


let displayElement = (key) => {
    return _e(`div#${key}-display.display`, 0).setData({'settingTarget': 'display'})
}

//let sectionElement = (title, htmlTemp = v => `<div class='title' id='${key}-title'>${}</div>`) =>
    //_e(`div.collapsed-section.collapsable#${title}-section`)
        //.html(htmlTemp(title))
        //.append(displayElement(title))

let sectionElement = ({
    key,
    title,
    htmlTemp = (key, title) => `<div class='title' id='${key}-title'>${title}</div>`
}) =>
    _e(`div.collapsed-section.collapsable#${key}-section`)
        .html(htmlTemp(key, title))
        .append(displayElement(key))

let settingTemplate = (pragma, key) =>
    _e(`div.setting#${key}`)
        .setData({ 'setting': key })
        .append(sectionElement({
            key: key,
            title: pragma.displayName
        }))
        // .append(editorElement(title))

// const htmlTemplate = `
// <div class='settings'>
//     <div class='setting'>
//     </div>
// </div>

// `.trim()
// 

export class Setting extends Pragma {
    constructor(...args) {
        super()
        this.init(...args)
    }


    init(parent, key, conf={
        displayName: key
    }) {
        parent.adopt(this)
        parent.create(this, key)

        this.displayName = conf.displayName || key
        console.log('this display name', this.displayName)

        this.as(settingTemplate(this, key))
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
            .appendTo(this.parent)

        this.element.find('.collapsed-section').listenTo("mousedown", () => {
            console.log('openedd')
            this.open()
        })

        
        this.editor = new SettingEditor(this)
    }


    open() {
        const jumpAhead = 10

        this.parent.element.findAll(".setting").forEach(section => {
            if (section !== this.element) collapse(section) 
        })
        
        this.element.findAll('.collapsed-section').forEach(section => {
            console.log(section)
            collapse(section)
        })


        setTimeout(() => {
            this.addClass('expanded')
            this._ogHeight = this.height
            this.css(`height ${this.editor.element.scrollHeight}px`)

            expand(this.editor)
        }, jumpAhead)

    }

    close() {
        this.parent.element.findAll(".setting").forEach(section => {
            if (section !== this.element) expand(section)
        })

        this.element.findAll('.collapsed-section').forEach(section => {
            console.log(section)
            expand(section)
        })

        this.removeClass('expanded')
        this.element.style.height = null
    }

    updateDisplay(html){
        pragmaSpace.onDocLoad(() => {
            let el = this.element.findAll("[data-setting-target='display']")
            console.log('updating', html, el)
            el.forEach(el => el.html(html))
        })
    }
}

