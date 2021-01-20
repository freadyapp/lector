import { Pragma, tpl, _e, util } from "pragmajs"

export function paginator(pageTemplate, conf={}){
  return new Pragma() 
        .from(tpl.create.template.config({
          name: 'paginator',
          defaultSet: pageTemplate,
          onPageAdd: typeof conf.onPageAdd === 'function' ? conf.onPageAdd : function(page, i) { util.log('added', page) },
          onPageRender: typeof conf.onPageRender === 'function' ? conf.onPageRender : function(page, i){ util.log('rendered', page) },
          onPageActive: typeof conf.onPageActive === 'function' ? conf.onPageActive: function(page, i){ util.log('active', page) },
          onPageInactive: typeof conf.onPageInactive === 'function' ? conf.onPageInactive : function(page, i) { util.log('inactive', page) }
        }))

        .run(function(){

          this.pageTemplate = _e(this._paginatorTemplate)
          this._clonePage = function() { return _e(this.pageTemplate.cloneNode(false)) }

          this.create = function(val=this.value, action='append'){
            let cloned = this._clonePage()

            new Promise( resolve => {
              setTimeout( _ => {
                cloned.html(`${val} @ ${Date.now()}`)
                resolve()
              }, Math.random()*1500)
            }).then( _ => this.onPageRender(cloned, val))
          
            cloned[`${action}To`](this.parent.element)
            this.addPage(cloned, val)
          }

          this.destroy = function(val){
            this.pages.get(val).destroy() 
            this.delPage(val)
          }

          this.pages = new Map()

          this.addPage = function(page, key){
            this.onPageAdd(page)

            key = key || this.pages.size
            return this.pages.set(key, page)
          }

          this.delPage = function(key){
            return this.pages.delete(key) 
          }

          this.activate = function(pageIndex){
            this.onPageActive(this.pages.get(pageIndex))
          }

          this.inactivate = function(pageIndex){
            this.onPageInactive(this.pages.get(pageIndex)) 
          }

          this.export("pageTemplate", "_clonePage", "create", 'destroy', "pages", "addPage", "delPage", 'activate', 'inactivate')
        })
}
