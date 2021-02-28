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


//  const select = (conf) => _p()
//     //.from(util.createTemplate())
//     .run(function(){
//       // this._options = []
      
//       let options = conf.options
//       if (!options) return util.throwSoft('need to define options when creating a select template')

//       let onOptionCreate = conf.onOptionCreate || defaults.onOptionCreate
//       let optionTemplate = conf.optionTemplate || defaults.optionTemplate 

//       if (options.constructor === Array){
//         for (let el of options){
//           onOptionCreate(this, optionTemplate(el))
//         }
//       }else{
//         for (let [ key, val ] of Object.entries(options)){
//           const pair = {[key]: val}
//           onOptionCreate(this, optionTemplate(key, val), pair)
//         }
//       }

//       this.onExport(function(pragma) {
//         pragma.contain(...this.children)
//         pragma.getOptions = function(){
//           console.log(pragma.children)
//           return pragma.children.filter(child => child._isOption)
//         }
//       })
//       this.export('elementDOM', 'actionChain', 'exportChain', 'exports', '_options')
//     })

export function select(conf){
  // this._options = []
  
  let options = conf.options
  if (!options) return util.throwSoft('need to define options when creating a select template')

  let onOptionCreate = conf.onOptionCreate || defaults.onOptionCreate
  let optionTemplate = conf.optionTemplate || defaults.optionTemplate 

  if (options.constructor === Array){
    for (let el of options){
      let option = optionTemplate(el)
      option._isOption = true

      onOptionCreate(this, option)
    }
  }else{
    for (let [ key, val ] of Object.entries(options)){
      const pair = {[key]: val}
      onOptionCreate(this, optionTemplate(key, val), pair)
    }
  }

  // this.onExport(function(pragma) {
    // pragma.contain(...this.children)
    this.getOptions = function(){
      console.log(this.children)
      return this.children.filter(child => child._isOption)
    }
}
