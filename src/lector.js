import { _e, _p, tpl, Pragma } from "pragmajs"
import { range, wfy, isOnScreen, scrollTo, onScroll, LectorSettings } from "./helpers/index"
import { PragmaWord, PragmaLector, PragmaMark } from "./pragmas/index"
import * as _ext from "./extensions/index"

// globalThis.$ = globalThis.jQuery = $;

// pragmaSpace.dev = true

// TODO add more default options
const default_options = {
  wfy: true,
  pragmatizeOnCreate: true,
  experimental: false
}

const Mark = (lec) => {
  let mark = new PragmaMark(lec)

  function logger(w){
  }

  // auto scroll feature
  // TODO put somewhere else
  let scrollingIntoView = false
  let usersLastScroll = 0

  function userIsScrolling(){
    return usersLastScroll - Date.now() > -10
  }

  function autoScroll(w){
    //return
    if (userIsScrolling() || isOnScreen(mark.element) || scrollingIntoView) return false
    // else we're out of view

    scrollingIntoView = true
    let cbs = [] // these will be the callbacks that are gonna run when the scroll is done
    // TODO  make a class Chain that does this.
    // Chain.add(cb), Chain.do() to execute and shit
    if (lec.isReading){
      lec.pause()
      cbs.push(() => {
        lec.read()
      })
    }

    cbs.push(()=>{
      //console.warn("suck my diiiiiiiiiick")
    })

    //console.warn("mark is out of screen")
    //console.log('lec reading:', lec.isReading)

    scrollTo(mark).then(() => {
      cbs.forEach(cb => cb())
      scrollingIntoView = false
    })
  }

  const threshold = 40 // how fast should you scroll to pause the pointer
  let lastScroll = 0
  onScroll((s) => {
    usersLastScroll = !scrollingIntoView ? Date.now() : usersLastScroll
    console.log('user is scrolling', userIsScrolling())

    if (userIsScrolling() && lec.isReading){
      let dscroll = Math.abs(lastScroll-s)
      lastScroll = s
      if (dscroll>threshold){
        console.log('ds=', dscroll)
        // TODO prevent from calling pause to many times
        // on too fast scroll, pause mark
        lec.pause()
      }
    }
  })

  mark.on('mouseover', function(){
    console.log(this, 'hover')
  })

  mark.do(logger, autoScroll)
  return mark
}

const Word = (element, i) => {
  let w = new PragmaWord(i)
          .as(element)
          .setValue(0)

  let thisw = w.element.findAll('w')

  if (thisw.length==0) {
    w.addListeners({
      "click": function(e, comp){
        this.summon().then(() => {
          this.parent.value = this.key
        })
      },
      "mouseover": function(w, comp){
        this.css("background #5e38c74a")
      },
      "mouseout": function(){
        this.css('background transparent')
      }
    })
  }

  // w.element.css({"border": ".5px dashed lightgray"})
  // w.css("border .5px dashed lightgray")
  thisw.forEach( (el, i) => {
    let ww = Word(el, i)
    // console.log(ww)
    w.add(ww)
  })

  return w
}

export const Reader = (l, options=default_options) => {
  l = _e(l)
  if (options.wfy) wfy(l)
  let w = Word(l)
            // .do(function(){
            //   console.log(this.isReading, this.value, this.currentWord)
            //   if (this.isReading){
            //     if (typeof this.onRead !== 'undefined') this.onRead()
            //   }else{
            //     this.currentWord.summon(true)
            //   }
            // })

  let lec = new PragmaLector("lector")
              .setValue(0)
              .connectTo(w)
              .do(function(){

              })

  lec.settings = LectorSettings(lec)
                  .css(`position fixed
                        bottom 10px
                        left 10px
                        background #303030
                        padding 10px`)

  lec.mark = Mark(lec)
  lec.contain(lec.settings)

  function bindKeys(){
    lec.bind("right", function(){ this.w.value += 1; this.currentWord.summon()})
    lec.bind("left", function(){ this.w.value -= 1; this.currentWord.summon()})

    lec.bind("space", function(){
      return false
    }, 'keydown')

    lec.bind("space", function(){
      this.toggle()
      return false
    }, 'keyup')

  }

  function experiment(){
    if (globalThis.pragmaSpace.mousetrapIntegration){
        bindKeys()
    }
  }

  // bindKeys() // TODO: add mousetrap integration

  if (options.pragmatizeOnCreate) lec.pragmatize()
  if (options.experimental) experiment()

  return lec
}

function _needWrapper(op){
    return op.stream || op.paginate
}

function _infinityPaginator(streamer, pageTemplate){
  let inf = _p("infinity paginator")
        .from(_ext.paginator(pageTemplate))
        .setValue(0)
        .run(function(){
          this.streamer = streamer
          this.fetch = this.streamer.fetch

          this.fillBefore = function(){
            //prepend until its out of view  
          }

          this.fillAfter = function(){
            //append until its out of view  
            
            return new Promise((resolve, reject) => {
              console.log(this.value)
              console.log(this.pages)


              if (!this.pages.has(this.value)){
                this.createCurrent()
                console.log('created current page')
              }

              const conf = {
                max: 15, // to avoid funky bugs
                threshold: 1000 // 1000 px
              }

              // assumes current page is appended
              let i = this.value + 1

              while (this.pages.size < conf.max && !this.pages.has(i)){
                console.log(this.pages)
                console.log(i-conf.max)
                this.create(i)
                if (this.pages.has(i-conf.max+1)) this.pages.delete(i-conf.max)
                i++
              }

              //this.create(i)
              //this.create(i+1)

              //setTimeout(() => {
              //this.destroy(i)
              //this.destroy(i+1)
                //console.log("YYEYEYET")
              //}, 5000)


              //while (!this.pages.has(i+1) && this.pages.has(i) && isOnScreen(this.pages.get(i), -800)){
              //while (i<2){
                ////this.createAnAfter()
                //console.log(".>>>>")
                //this.create(i+1)
                //this.destroy(i-1)
                //console.log(this.pages)
                //i++ 
              //}
            })

          }

          const conf = {
            headspace: 4,
            timeout: 10
          }

          function arrayDiff(a, b){
            return a.filter(i => b.indexOf(i)<0)
          }

          this.fill = function(){
            this.fetching = true
            //console.log(">> filling")
            //console.log(this.value)
            //this.createCurrent()

            //this.value-conf.headspace
            let start = this.value >= conf.headspace ? this.value-conf.headspace : 0
            let pageRange = range(start, this.value+conf.headspace)
            let pagesRendered = Array.from(this.pages.keys())
            //console.log(pagesToRender, pagesRendered)

            let pagesToRender = arrayDiff(pageRange, pagesRendered)
            let pagesToDelete = arrayDiff(pagesRendered, pageRange)
            //console.log(pageRange)
            console.log(">> DEL", pagesToDelete)
            console.log(">> ADD", pagesToRender)

            for (let pageIndex of pagesToRender){
              this.create(pageIndex)
            }

            for (let pageIndex of pagesToDelete){
              //this.pages.get(pageIndex).css("background:red")
              //this.destroy(pageIndex)
            };

            //console.log(this.pages)

            //for (let pageIndex of pagesToRender){
              //if (this.pages.has(pageIndex)) continue

              //this.create(pageIndex)
              ////console.log(this.pages.get(pageIndex))
            //};

            //this.fillAfter()
            //this.fillBefore()
            //
            setTimeout(a => {
              this.fetching = false
            }, conf.timeout)
          }

        })
      .run(function(){
        onScroll((s, l) => {
          if (this.fetching) return 
          //console.log(s, l)
          let v = this.value
          let p = this.pages.get(v)
          //console.log(p)
          //console.log(isOnScreen(p))
          if (!isOnScreen(p)){
            console.log(p, "page is not on the screen")
            //if (isOnScreen(this.pages.get(v+1))) this.value = v+1

            let notFound = true
            let i = 1
            let di = l > 0 ? 1 : -1
            while (notFound){
              if (isOnScreen(this.pages.get(v+i))){
                this.value = v+i
                notFound = false
              }
              i += di 
            };
            // shit we lost the active page
            //for (let [i, page] of this.pages){
              //if (isOnScreen(page, page.height)) console.log(page)
              //this.value = i
            //}
            //this.value += l<0 ? -1 : 1
            //console.log(v, ">>>", this.value)
          }
          //paginator.fill()
        })
      })
      .do(function(){
        //if (!this.pages.has(this.value)) return
        //console.log(this.value, this.value - this.dv)
        //console.log(this.pages)
        this.pages.get(this.value).css('background: lime')
        this.pages.get(this.value - this.dv).css('background: whitesmoke')
        this.fill()
      })

  return inf

   //if (this.dv > 0){
                    //cloned.appendTo(l.parentElement)

                  //} else {

                    //cloned.prependTo(l.parentElement)

                  //}

}

function _streamer(sf){
  return _p('streamer')
          .setValue(0)
          .run(function(){
            this.fetch = sf
            this.getContent = function(){
              return this.fetch(this.value)  
            }
          })

}

export const Lector = (l, options=default_options) => {
  if (!_needWrapper(options)) return Reader(l, options)

  console.log("configuration appears to be a bit more complicated")

  if (options.stream &&
      options.paginate &&
      options.paginate.from === 'stream' &&
      options.paginate.as === 'infiniteScroll'){

    console.log('setting up streamer service')

    let streamer = _streamer(options.stream)
    let paginator = _infinityPaginator(streamer, l)


    let reader = _p()
                  .as(_e(l).parentElement)
                  .adopt(paginator, streamer)

    console.log(reader)

    streamer.wireTo(paginator) // when paginator changes value, change value of streamer as well

    streamer.do(function(){
      console.log(`fetching page [${this.value}]`)
    })

    paginator.fill()

    //paginator.do(function(){
      //if (this.dv > 0){
        //this.fill() 
      //}
    //})

    ////paginator.fill()
    //
    

    //paginator.value += 1

    //
    //
    //
    //paginator.value += 1
    //paginator.value += 1
    //paginator.value += 1

  }
}

