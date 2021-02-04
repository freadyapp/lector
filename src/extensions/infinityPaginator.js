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
              headspace: 10,
              timeout: 5 
            }

            this.fill = function(){

              this.fetching = true
              // console.log(">>> FILLING WITH", this.value)
              let start = this.value >= conf.headspace ? this.value-conf.headspace : 0
              let pageRange = range(start, this.value+conf.headspace)
              let pagesRendered = Array.from(this.pages.keys())

              let pagesToRender = util.aryDiff(pageRange, pagesRendered)
              let pagesToDelete = util.aryDiff(pagesRendered, pageRange)


              let pagesToRenderAfter = pagesToRender.filter(i => i>this.value)
              let pagesToRenderBefore = util.aryDiff(pagesToRender, pagesToRenderAfter)

              // console.log(">> ALREADY RENDERED", pagesRendered)
              // console.log(">> DEL", pagesToDelete)
              // console.log(">> ADD", pagesToRender) 
              // console.log(">> ADD AFTER", pagesToRenderAfter)
              // console.log(">> ADD BEFORE", pagesToRenderBefore)

              // pararellize?
              for (let pageIndex of pagesToRenderAfter){
                this.create(pageIndex, 'append')
              }

              // pararellize?
              for (let pageIndex of pagesToRenderBefore.reverse()){
                this.create(pageIndex, 'prepend')
              }

              // pararellize?
              for (let pageIndex of pagesToDelete){
                //this.inactivate(pageIndex)
                //this.pages.get(pageIndex).css("background:red")
                this.destroy(pageIndex)
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
            // console.log(pages)
            for (let [pageIndex, page] of pages){
              let pageMiddle = page.top + page.height/2
              let closeness = Math.abs(pageMiddle - middle)
              // console.log(page, pageIndex, closeness)
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
            if (this.fetching) return 
            if (searching) return owe = { pos: pos, dp: dp }

            searching = true
            this.findActivePage(pos, dp).then(active => {
              // console.log("ACTIVE>>", active, this.pages.get(active))
              this.value = active
              searching = false
              if (owe){
                // console.log('owe', owe)
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
