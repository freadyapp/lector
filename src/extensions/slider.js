import { Pragma } from "pragmajs"

export function slider(conf={}){
  return new Pragma()
    .run(function() {
      this.as(`<input type='range'></input>`)

      const defs = ['min', 'max', 'value']

      defs.forEach(attr => {
        if (conf[attr]) this.element.attr(attr, conf[attr])
      })

      this.setRange(this.min || -100, this.max || 100)

      this.element.listenTo('input', function(){
        this.parent.value = parseInt(this.value)
      })

      this.export('actionChain', 'elementDOM')
      this.onExport(pragma => {
        pragma.adopt(this.element)
      })
    })
  }
