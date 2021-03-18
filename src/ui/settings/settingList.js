import { _p, Pragma, _e, util } from "pragmajs"
import { Setting } from "./setting"

const list = [ 1, 2, 3, 4, 5]

let optionDefaultWrapper = (content, pragma) => _p(`
        <div class="option" data-editor-option=${pragma.getData('option')}>
        </div>
    `.trim()).run(function(){
        if (typeof content === 'string') return this.element.html(content)
        this.append(content)
    }).element

let optionDefaultContent = (pragma) => pragma.key.toString()

let makeOptionElement = function(content, wrapper){
    this.as(_e(wrapper(content, this))).setId(util.rk5()).addClass('option')
    this.setData({'option': this.option})
    return this
}

export class Option extends Pragma {
    constructor(){
        super()
        this.createWire('optionTemplate')
        this.init(...arguments)
        
    }
    
    static fromTemplate (template, option){
        let content = typeof template === 'function' ? template : optionDefaultContent
        let wrapper = optionDefaultWrapper
        if (typeof template === `object`){
            if (template.contentTemplate) content = template.contentTemplate
            if (template.wrapperTemplate) wrapper = template.wrapperTemplate
        }
        

        return new Option(option, content, wrapper).setKey(option)
    }

    init(option, contentTemplate, wrapperTemplate){
        this.option = option
        this._contentTemplate = contentTemplate
        this._wrapperTemplate = wrapperTemplate

        this.render() 
    }

    render(){
        return this.run(function(){
            makeOptionElement.bind(this)(this._contentTemplate(this), this._wrapperTemplate)
        }) 
    }
}

export class SettingList extends Setting {
    init(settings, setting, conf={
        contentTemplate: optionDefaultContent,    
        wrapperTemplate: optionDefaultWrapper,    
    }) {
        super.init(settings, setting)
        let options = conf.options ? conf.options : conf

        if (typeof options === 'object'){
            let newOptions = []
            for (let [option, description] of Object.entries(options)){
                newOptions.push(Option.fromTemplate(conf, option)
                                            .setData({ "description": description })
                                            .render())
            }
            options = newOptions
        } else {
            options = options.map(x => Option.fromTemplate(conf, x))
        }
        this.adopt(...options)
        
        this.createEvent('select')
        this.createWire('currentOption')
        
        this.on('input', value => {
            let pragma = this.find(value)
            if (!pragma) return util.throwSoft(`couldnt find option for ${value}`)
            this.currentOption = pragma
        })

        this.on('currentOptionChange', (option, lastOption) => {
            if (!lastOption || option.key != lastOption.key){
                this.triggerEvent("select", option, lastOption)
            }
        })
        
        this.on('select', option => {
            this.parent.update(this.getData('setting'), option.getData('option'))
        })
        

        options.forEach(option => option.listenTo('mousedown', () => this.setCurrentOption(option)))

        this.editor._setContent(...options)

    }    
}