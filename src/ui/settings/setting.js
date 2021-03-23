import { _p, util, _e, Pragma } from "pragmajs"
import { SettingEditor } from "./settingEditor"
import { SettingInline } from "./settingInline"
import { fadeTo, expand, collapse } from "../../helpers/index"


        // .append(editorElement(title))

// const htmlTemplate = `
// <div class='settings'>
//     <div class='setting'>
//     </div>
// </div>

// `.trim()
// 
    // 

let displayElement = (key) => {
    return _e(`div#${key}-display.display`, 0).setData({ 'settingTarget': 'display' })
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

let _settingTemplate = (pragma, key) =>
    _e(`div.setting.collapsable#${key}`)
        .setData({ 'setting': key })
        .append(sectionElement({
            key: key,
            title: pragma.displayName
        }))


export class Setting extends SettingInline {

    init(parent, key, {
        displayName= key,
        settingTemplate= _settingTemplate,
        displayTemplate
    }) {
        super.init(parent, key, {
            displayName, settingTemplate, displayTemplate
        })

        console.log('im the child setting and i was run')
        // super.init(...arguments)

         this.element.find('.collapsed-section').listenTo("mousedown", () => {
             console.log('opening')
             this.open()
         })
        
        // this.element.removeClass('inline')
        
        this.editor = new SettingEditor(this)
    }


    open() {
        const jumpAhead = 10

        this.parent.element.findAll(".setting.collapsable").forEach(section => {
            if (section !== this.element) collapse(section) 
        })
        
        this.element.findAll('.collapsed-section').forEach(section => {
            console.log(section)
            // section.css('opacity 0')
            collapse(section)
        })


        setTimeout(() => {
            this.addClass('expanded')
            this._ogHeight = this.height

            this.editor.element.show()
            this.css(`height ${this.editor.element.scrollHeight}px`)
            expand(this.editor)
        }, jumpAhead)

    }

    close() {
        this.parent.element.findAll(".setting.collapsable").forEach(section => {
            if (section !== this.element){
                // expand(section)
                expand(section)
            }
        })

        this.element.findAll('.collapsed-section').forEach(section => {
            expand(section)
        })

        this.removeClass('expanded')
        this.element.style.height = null
    }

    
}

