import { Pragma, tpl, _e } from "pragmajs"

export function paginator(pageTemplate, onPageRender){
  return new Pragma() 
        .from(tpl.create.template.config({
          name: 'paginator',
          defaultSet: pageTemplate,
          onPageRender: typeof onPageRender === 'function' ? onPageRender : function(value, page){ console.log('rendered', page) }
        }))

        .run(function(){

          this.pageTemplate = _e(this._paginatorTemplate)
          this._clonePage = function() { return _e(this.pageTemplate.cloneNode(false)) }

          this.create = function(val=this.value, action='append'){
            let cloned = this._clonePage()
            //cloned.html(this.fetch(val))
            new Promise( resolve => {
              setTimeout( _ => {
                cloned.html(`${val} @ ${Date.now()}`)
                resolve()
              }, Math.random()*1500)
            }).then( _ => this.onPageRender(val, cloned))
          
            //cloned.appendTo(this.parent)
            cloned[`${action}To`](this.parent.element)
            this.addPage(cloned, val)
          }

          this.destroy = function(val){
            //if (this.pages.has(val)){
              this.pages.get(val).destroy() 
              this.delPage(val) 
            //}
          }

          this.pages = new Map()

          this.addPage = function(page, key){
            key = key || this.pages.size
            return this.pages.set(key, page)
          }

          this.delPage = function(key){
            return this.pages.delete(key) 
          }

          this.export("pageTemplate", "_clonePage", "create", 'destroy', "pages", "addPage", "delPage")

        })
}
