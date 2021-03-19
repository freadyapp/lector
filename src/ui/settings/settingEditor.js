import { _p, util, _e, Pragma } from "pragmajs"
import { fadeTo, collapse } from "../../helpers/index"


let editor = setting => 
    _e(`
    <div id='${setting.key}-editor' class='editor collapsable' data-setting-target='editor'>
        <div data-setting-target='back'> < ${setting.getData('setting')} </div>

        <div class='editor-content' data-editor-target='content'>
        </div>
    </div>
    `.trim())

export class SettingEditor extends Pragma {
    constructor(){
        super()
        this.init(...arguments)
    }

    init(setting){
        this.setting = setting
        this.as(editor(setting))
            .appendTo(setting.element)
        
        this.createEvents('hide')
        this.createWire('content')
        
        this.on('contentChange', content => {
            // editorContent.html(content)
            this._setContent(content)
        })
        
       
        // this.element.hide()
        
        this.editorContent = this.element.find('[data-editor-target="content"]')
        this.element.findAll(`[data-setting-target='back']`)
                    .forEach(e => e.listenTo("mousedown", () => {
                                    this.triggerEvent("hide")
                                })
                            )

        this.on('hide', () => {
            setting.close()
            collapse(this.element)
        })
        
        collapse(this.element)
        // this.triggerEvent('hide')
        return this
    }

    _setContent(html, ...elements){
        if (typeof html === 'string'){
            this.editorContent.html(html)
        } else if (html instanceof Pragma){
            this.editorContent.append(html, ...elements)
            // elements.forEach(element => editorContent.append(element))

            this.triggerEvent('contentChange')
        }
    }
}