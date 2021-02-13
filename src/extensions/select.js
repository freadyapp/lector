import { util, _p } from "pragmajs"

const defaults = {
  onOptionCreate: function(self, option){
    self.contain(option)
  },
  optionTemplate: function(option){
      return _p(option)
              .html(option)
              .addClass('pragma-click')
              .on('click').do(function(){
                this.parent.value = this.key
              })
  }
}  


export const select = (conf) => _p()
    //.from(util.createTemplate())
    .run(function(){
      let options = conf.options
      if (!options) return util.throwSoft('need to define options when creating a select template')

      let onOptionCreate = conf.onOptionCreate || defaults.onOptionCreate
      let optionTemplate = conf.optionTemplate || defaults.optionTemplate 

      if (options.constructor === Array){
        for (let el of options){
          onOptionCreate(this, optionTemplate(el))
        }
      }else{
        for (let [ key, val ] of Object.entries(options)){
          const pair = {[key]: val}
          onOptionCreate(this, optionTemplate(key, val), pair)
        }
      }

      this.onExport(function(pragma) {
        pragma.contain(...this.children)
      })
      this.export('elementDOM', 'actionChain', 'exportChain', 'exports')
    })
