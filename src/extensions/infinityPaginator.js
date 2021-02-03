import { _e, _p, Pragma, util } from "pragmajs"
import { paginator } from "./paginator"
import { range, isOnScreen, isMostlyInScreen, onScroll, PinkyPromise } from "../helpers/index"
import { onScrollEnd } from "../helpers/autoScroll"

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
        .run({
          initialConfig(){
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
        },
        findActivePages(){
          

          function findCandidates(pages, scroll){

            let bestIndex = null
            let best = 999999999999
            const middle = scroll + window.innerHeight/2
            for (let [pageIndex, page] of pages){
              // console.log(page, pageIndex)
              let pageMiddle = page.top + page.height/2
              let closeness = Math.abs(pageMiddle - middle)
              if (closeness <= best){
                best = closeness
                bestIndex = pageIndex
              }
            }

            return bestIndex
          }
          
          this.findActivePage = function(s, dp){
            // dp is the rate of change of scroll
            
            // console.log(canditates)
            //if (this.fetching) return
            //
            return new PinkyPromise(resolve => {
              let canditates
              util.bench(_ => canditates = findCandidates(this.pages, s))
              //resolve(canditates)
              setTimeout(_ => resolve(canditates), 5)
            })
          }

          let searching = false
          let owe = false
          const doOnScroll= (pos, dp) => {
            if (searching) return owe = { pos: pos, dp: dp }

            searching = true
            this.findActivePage(pos, dp).then(active => {
              console.log("ACTIVE>>", active, this.pages.get(active))
              this.value = active
              searching = false
              if (owe){
                console.log('owe', owe)
                doOnScroll(owe.pos, owe.dp)
                owe = null
              }
            })
          }

          onScrollEnd((pos, dp) => {
            doOnScroll(pos, dp)
          })
        }
      })
      .do(function(){
        if (this.dv === 0) return
        
        this.activate(this.value)
        let preVal = this.value-(this.dv||1)
        this.inactivate(preVal)

        this.fill()
      })

  return inf
}
