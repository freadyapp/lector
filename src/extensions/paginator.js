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
          onPageRender: null,
          //typeof conf.onPageRender === 'function' ? conf.onPageRender : function(page, i){ util.log('rendered', page, 'active?', page.active) },
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
            console.log('creating', val, action)
            let cloned = this._clonePage()

            new Promise( resolve => {

              this.onCreate(cloned, val)

              let f = this.fetch(val)

              let onFetch = conf.onFetch ||
                        function(page, fetched){
                          page.html(fetched)
                          resolve(page)
                        }

                        // on fetch in config or the default one

              if (f instanceof Promise){
                f.then(resolved => onFetch(cloned, resolved))
              } else {
                onFetch(cloned, f)
                resolve(page)
              }

            }).then( page => {
              page.fetchChain.exec()
              if (this.onPageRender) this.onPageRender(page, val)
              //this._lastAddedPage = page
            })

            cloned[`${action}To`](this.parent.element)
            this.addPage(cloned, val)
          }

          this.pages = new Map()

          this.destroy = function(val){
            let toDestroy = this.pages.get(val)

            let destroy = _ => {
              toDestroy.destroy()
              this.delPage(val)  
            }

            if (this.onPageDestroy){
              let r = this.onPageDestroy(toDestroy, val)
              if (r instanceof Promise) return r.then(destroy)
            }

            destroy()
          }

          this.addPage = function(page, key){
            key = key === null ? this.pages.size : key
            this.onPageAdd(page, key)
            console.log('adding page', key, page)
            this.pages.set(key, page)
            console.log(this.pages)
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
