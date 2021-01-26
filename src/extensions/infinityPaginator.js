import { _e, _p, Pragma, util } from "pragmajs"
import { paginator } from "./paginator"
import { range, isOnScreen, isMostlyInScreen, onScroll } from "../helpers/index"

export function infinityPaginator(streamer, pageTemplate, config={}){
  let inf = _p("infinity paginator")
        .from(
          paginator(pageTemplate).config(util.objDiff(
            {
              streamer: streamer,
              fetch: streamer.fetch,
              // on page render
              // on page active

              // on page inactive,
              // on page add,
              // on create,
              // on fetch
            }, config))
        )
        .setValue(0)
        .run(function(){

          const conf = {
            headspace: 4,
            timeout: 10
          }

          this.fill = function(){

            this.fetching = true
            let start = this.value >= conf.headspace ? this.value-conf.headspace : 0
            let pageRange = range(start, this.value+conf.headspace)
            let pagesRendered = Array.from(this.pages.keys())

            let pagesToRender = util.aryDiff(pageRange, pagesRendered)
            let pagesToDelete = util.aryDiff(pagesRendered, pageRange)

            console.log(">> DEL", pagesToDelete)
            console.log(">> ADD", pagesToRender)

            for (let pageIndex of pagesToRender){
              this.create(pageIndex)
            }

            for (let pageIndex of pagesToDelete){
              //this.inactivate(pageIndex)
              //this.pages.get(pageIndex).css("background:red")
              //this.destroy(pageIndex)
            };

            setTimeout(a => {
              this.fetching = false
            }, conf.timeout)
          }

        })
      .run(function(){
        onScroll((s, l) => {
          if (this.fetching) return

          let v = this.value
          let currentPage = this.pages.get(v)

          if (!isMostlyInScreen(currentPage)){
            let i = 1
            let di = l > 0 ? 1 : -1
            while (true){
              if (!(this.pages.has(v+1))){
                console.log('no active page!')
                this.value = 0
                break
              }

              let p = this.pages.get(v+i)
              if (isMostlyInScreen(p)){
                this.value = v+i
                break
              }
              i += di
            }
          }
        })
      })
      .do(function(){
        //if (!this.pages.has(this.value)) return
        //console.log(this.value, this.value - this.dv)
        //console.log(this.pages)
        //
        //this.pages.get(this.value).css('background: lime')
        //this.pages.get(this.value - this.dv).css('background: whitesmoke')

        this.activate(this.value)
        this.inactivate(this.value-this.dv)

        this.fill()
      })

  return inf
}
