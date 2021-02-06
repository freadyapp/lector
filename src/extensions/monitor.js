import { Pragma, util } from "pragmajs"

export function monitor(conf={}){
  return new Pragma()
          .from(util.createTemplate(util.objDiff({
              template: v => v,
            }, conf)))
          .do(function() {
            this.html(this.template(this.value))
          })
          .run(function(){
            this.setTemplate = function(tpl){
              this.template = tpl
              return this
            }
            this.export('actionChain', 'setTemplate')
          })
}


/*
 *use: 
 *let monitor = _p('tv')
 *  .setValue(0)
 *  .from(tpl.monitor())
 *  .setMonitorTemplate(
 *    v => `${v} second${v == 1 ? ' has' : 's have'} passed`)
 *  .pragmatizeAt("#paper")
 *  .setLoop(0, 10)
 *
 */