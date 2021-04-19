import { Pragma, _e, util } from "pragmajs"
import { scrollTo } from "../helpers/autoScroll"

export function paginator(pageTemplate, conf={}){
  return new Pragma()
        .from(util.createTemplate({
          // make this nicer
          // defaultSet: pageTemplate,
          pageTemplate: pageTemplate,
          firstPage: conf.first,
          lastPage: conf.last,
          fetch: typeof conf.fetch === 'function' ? conf.fetch : _=>{ util.throwSoft('no fetch source specified') },
          onCreate: typeof conf.onCreate === 'function' ? conf.onCreate : p => console.log('created', p),
          onFetch: conf.onFetch,

          onPageAdd: null,
          onPageRender: null,
          //typeof conf.onPageRender === 'function' ? conf.onPageRender : function(page, i){ console.log('rendered', page, 'active?', page.active) },
          onPageActive: typeof conf.onPageActive === 'function' ? conf.onPageActive: function(page, i){console.log('active', page) },
          onPageInactive: typeof conf.onPageInactive === 'function' ? conf.onPageInactive : function(page, i) { console.log('inactive', page) },
          onPageDestroy: conf.onPageDestroy
        }))

        .run(function(){

          let _ptemp = _e(this.pageTemplate).hide()
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

          this.isPageAvailable = v => {
            return (!this.firstPage || v >= this.firstPage)
                                      && (!this.lastPage || v <= this.lastPage)
                    }

          this.create = function(val=this.value, action='append'){
            // console.log('creating', val, action)
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
              //
              const onFetchAndResolve = (resolved) => {
                let page = this.pages.get(val)
                if (page){
                  onFetch(page, resolved)
                  resolve(page)
                }
              }

              if (f instanceof Promise){
                f.then(resolved => {
                  onFetchAndResolve(resolved)
                })
              } else {
                  onFetchAndResolve(f)
              }

              //if (f instanceof Promise){
                //f.then(resolved => {
                  //this.pages.get(val)
                  //onFetch(cloned, resolved)
                  //resolve(val)
                //})
              //} else {
                //onFetch(cloned, f)
                //resolve(val)
              //}

            }).then( page => {
              //let page = this.pages.get(index)
              //if (!page) return console.log('eeeeeeeeeee')
              page.fetchChain.exec()
              if (this.onPageRender) this.onPageRender(page, val)
              //this._lastAddedPage = page
            })

            cloned[`${action}To`](this.parent.element)
            this.addPage(cloned, val)
          }

          this.pages = new Map()

          this.destroy = function(val){
            //console.log('>> destroy', val)

            let toDestroy = this.pages.get(val)

            let destroy = _ => {
              toDestroy = this.pages.get(val)
              //toDestroy.destroy()
              this.delPage(val)
              toDestroy.destroy()
            }

            console.log('REMOV')
            if (this.onPageDestroy){
              let r = this.onPageDestroy(toDestroy, val)
              if (r instanceof Promise) return r.then(destroy)
            }

            destroy()
          }

          this.addPage = function(page, key){
            key = key === null ? this.pages.size : key
            if (this.onPageAdd) this.onPageAdd(page, key)
            this.pages.set(key, page)
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
          
      
          this.export(
            "pageTemplate",
            "_clonePage",
            "create",
            'destroy',
            "pages",
            "addPage",
            "delPage",
            'activate',
            'firstPage',
            'lastPage',
            'isPageAvailable',
            'inactivate')
        })
}
