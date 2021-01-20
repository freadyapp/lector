import { Pragma, tpl, _e } from "pragmajs"

export function paginator(pageTemplate){
  return new Pragma() 
        .from(tpl.create.template.config({
          name: 'paginator',
          defaultSet: pageTemplate
        }))

        .run(function(){
          this.pageTemplate = _e(this._paginatorTemplate)
          this._clonePage = function() { return _e(this.pageTemplate.cloneNode(false)) }

          this.create = function(val=this.value, action='append'){
            return new Promise(resolve => {
              let cloned = this._clonePage()
              //cloned.html(this.fetch(val))
              cloned.html(`${val} @ ${Date.now()}`)
            
              //cloned.appendTo(this.parent)
              cloned[`${action}To`](this.parent.element)
              this.addPage(cloned, val)
              resolve()
            })
          }

          this.destroy = function(val){
            //if (this.pages.has(val)){
              this.pages.get(val).destroy() 
              this.delPage(val) 
            //}
          }

          this.createABefore = function(bef=1){
            console.log('creating a before')
            this.create(this.value-bef, 'prepend')
          }

          this.createCurrent = function(type='append') { this.create(this.value, type) }

          this.createAnAfter = function(aft=1){
            console.log('creating an after')
            this.create(this.value+aft, 'append')
          }


          this.pages = new Map()

          this.addPage = function(page, key){
            key = key || this.pages.size
            return this.pages.set(key, page)
          }

          this.delPage = function(key){
            return this.pages.delete(key) 
          }

          this.export("pageTemplate", "_clonePage", "create", 'destroy', "createABefore", 'createCurrent', "createAnAfter", "pages", "addPage", "delPage")

        })
}
