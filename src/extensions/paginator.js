import { Pragma, tpl, _e, util } from "pragmajs"

export function paginator(pageTemplate, conf={}){
  return new Pragma()
        .from(tpl.create.template.config({
          // make this nicer

          name: 'paginator',
          defaultSet: pageTemplate,
          fetch: typeof conf.fetch === 'function' ? conf.fetch : _=>{ util.throwSoft('no fetch source specified') },

          onCreate: typeof conf.onCreate === 'function' ? conf.onCreate : p => util.log('created', p),
          onFetch: conf.onFetch,

          onPageAdd: typeof conf.onPageAdd === 'function' ? conf.onPageAdd : function(page, i) { util.log('added', page) },
          onPageRender: typeof conf.onPageRender === 'function' ? conf.onPageRender : function(page, i){ util.log('rendered', page, 'active?', page.active) },
          onPageActive: typeof conf.onPageActive === 'function' ? conf.onPageActive: function(page, i){util.log('active', page) },
          onPageInactive: typeof conf.onPageInactive === 'function' ? conf.onPageInactive : function(page, i) { util.log('inactive', page) },
        }))

        .run(function(){
          let _ptemp = _e(this._paginatorTemplate).hide()
          this.pageTemplate = _ptemp.cloneNode(false)

          this._clonePage = function() {
            let page = _e(this.pageTemplate.cloneNode(false)).show()
            //if (this._lastAddedPage){
              ////page.style.height = this._lastAddedPage.height
              //page.css(`height ${this._lastAddedPage.height}px`)
              //console.log('>>>>>>>>>>>>>>>>>>>>', this._lastAddedPage.height)
            //}
            this.adopt(page)
            page.lec = this.parent
            util.createEventChains(page, 'fetch')
            return page
          }

          this.create = function(val=this.value, action='append'){
            let cloned = this._clonePage()

            new Promise( resolve => {

              this.onCreate(cloned)

              let f = this.fetch(val)

              let onFetch = conf.onFetch ||
                        function(page, fetched){
                          page.html(fetched)
                          resolve(page)
                        }

                        // on fetch in config or the default one

              if (f instanceof Promise){
                f.then(rf => onFetch(cloned, rf))
              } else {
                onFetch(cloned, f)
                resolve(page)
              }

            }).then( page => {
              page.fetchChain.exec()
              this.onPageRender(page, val)
              this._lastAddedPage = page
            })

            cloned[`${action}To`](this.parent.element)
            this.addPage(cloned, val)
          }

          this.pages = new Map()

          this.destroy = function(val){
            this.pages.get(val).destroy()
            this.delPage(val)
          }

          this.addPage = function(page, key){
            this.onPageAdd(page)
            key = key || this.pages.size
            return this.pages.set(key, page)
          }

          this.delPage = function(key){
            return this.pages.delete(key)
          }

          this.activate = function(...pages){
            pages.forEach(pageIndex => {
              let page = this.pages.get(pageIndex)
              if (!page) return
              page.active = true
              this.onPageActive(page, pageIndex)  
            })
          }

          this.inactivate = function(...pages){
            pages.forEach(pageIndex => {
              let page = this.pages.get(pageIndex)
              if (!page) return
              page.active = false
              this.onPageInactive(page, pageIndex)
            })
          }

          this.export("pageTemplate", "_clonePage", "create", 'destroy', "pages", "addPage", "delPage", 'activate', 'inactivate')
        })
}
