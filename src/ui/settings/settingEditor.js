import { _p, util, _e, Pragma } from "pragmajs"
import { fadeTo } from "../../helpers/index"


let editor = setting => 
    _e(`
    <div id='${setting.key}-editor' class='editor' data-setting-target='editor'>
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
        
       
        this.element.hide()
        
        this.element.findAll(`[data-setting-target='back']`)
                    .forEach(e => e.listenTo("mousedown", () => {
                                    this.triggerEvent("hide")
                                })
                            )
        

        this.on('hide', () => {
            setting.close()
            this.element.hide()
        })
        

        
        // this.triggerEvent('hide')
        return this
    }

    _setContent(html, ...elements){
        let editorContent = this.element.find('[data-editor-target="content"]')
        if (typeof html === 'string'){
            editorContent.html(html)
        } else if (html instanceof Pragma){
            editorContent.append(html, ...elements)
            // elements.forEach(element => editorContent.append(element))

            this.triggerEvent('contentChange')
        }
    }
}