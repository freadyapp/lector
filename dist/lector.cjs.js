'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pragmajs = require('pragmajs');
var anime = require('animejs');
var nlp = require('compromise');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var anime__default = /*#__PURE__*/_interopDefaultLegacy(anime);
var nlp__default = /*#__PURE__*/_interopDefaultLegacy(nlp);

function elementify(el){
  // pipeline to vanillafy pragma objects to html elements
  if (el instanceof pragmajs.Pragma) el = el.element;
  if (!el.isPragmaElement) el = pragmajs._e(el);
  return el
}

// function getViewportHeight(){
//   return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
// }
//
// export function getRelativeScreen(el){
//   el = elementify(el)
//   let eee = _e(el)
//   let rect = el.getBoundingClientRect()
//   return  {
//             top: rect.top, // has to be bigger than 0
//             bottom: rect.bottom-getViewportHeight()// has to be smaller than
//           }
// }

globalThis.lectorSpace = globalThis.lectorSpace || {};

function isElementWithin(el, r={}){
  let off = el.offset();
  let elTop = off.top;
  let elBot = off.top + el.rect().height;
  return (elTop <= r.bot && elBot >= r.top) || (elTop <= r.top && elBot >= r.bot)
}

function isMostlyInScreen(el, percent=.5){
  if (!el) throw pragmajs.util.throwSoft(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el);
  return isOnScreen(el, percent*el.rect().height) // is 70% on screen
}

function isOnScreen(el, threshold=100){
  if (!el) throw pragmajs.util.throwSoft(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el);
  let winTop = window.scrollY;
  let winBot = winTop + window.innerHeight;
  let eee = isElementWithin(el, {top: winTop+threshold , bot: winBot-threshold});
  return eee
}

function scrollTo(el, duration=200, threshold=200){
  // behavior
  // closer, will scroll little bit downwards or upwards
  // until the element is in view for more than the threshold

  //return new Promise(r => r())
  //el = jqueryfy(el)
  //

  el = elementify(el);
  return new Promise((resolve, reject) => {
    const body = window.document.scrollingElement || window.document.body || window.document.documentElement;
    const top = el.offset().top - threshold;
    anime__default['default']({
      targets: body,
      scrollTop: top,
      duration: duration,
      easing: 'easeInOutSine',
    }).finished.then(() => {
      setTimeout(resolve, 20);
    });
  })
}



function _onScroll(cb){
  let last = 0;
  let ticking = false;
  document.addEventListener('scroll', function(e) {
    let temp = last;
    last = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        cb(last, last-temp);
        ticking = false;
      });
      ticking = true;
    }
  });
}

function onScroll(cb){
  if (!globalThis.lectorSpace.scrollChain){
    pragmajs.util.createChains(globalThis.lectorSpace, 'scroll');
    _onScroll((scroll, ds) => {
      globalThis.lectorSpace.scrollChain.exec(scroll, ds);
    });
  }
  globalThis.lectorSpace.onScroll(cb);
}

function _onScrollEnd(cb){

  let scrollData = { s: null, ds: null };
  let t;

  onScroll((s, ds) => {
    scrollData = {
      s: s,
      ds: ds
    };

    if (t) clearTimeout(t);

    t = setTimeout(_ => {
      cb(scrollData.s, scrollData.ds);
    }, 50);
  });
}

function onScrollEnd(cb){
  if (!globalThis.lectorSpace.scrollEndChain){
    pragmajs.util.createChains(globalThis.lectorSpace, 'scrollEnd');

      _onScrollEnd((scroll, ds) => {
        globalThis.lectorSpace.scrollEndChain.exec(scroll, ds);
      });  
  }
  globalThis.lectorSpace.onScrollEnd(cb);
}

//export function onSlowScroll(cb, sensit=10){
  //onScroll((_, dp) => {
    //if (dp<=sensit) cb()
  //})
//}

const greek_prefixes = ['an', 'an', 'ap', 'di', 'dy', 'ec', 'eg', 'en', 'em', 'eo', 'ep', 'eu', 'id', 'is', 'my', 'ne', 'od', 'oo', 'ot', 'sy', 'ur', 'ur', 'zo', 'pto', 'pyl', 'acr', 'aer', 'agr', 'ana', 'ant', 'apo', 'aut', 'bar', 'bio', 'cac', 'cat', 'cen', 'cen', 'con', 'cub', 'cyn', 'dec', 'dek', 'dem', 'dia', 'dox', 'eco', 'ego', 'eme', 'eos', 'epi', 'erg', 'eso', 'eth', 'eur', 'exo', 'geo', 'gen', 'hem', 'hal', 'hen', 'hex', 'hod', 'hol', 'hor', 'hor', 'hyo', 'hyp', 'ide', 'idi', 'iso', 'kil', 'lei', 'lep', 'lip', 'log', 'meg', 'mei', 'men', 'mer', 'mes', 'mim', 'mis', 'mit', 'mne', 'mon', 'myx', 'nes', 'nom', 'oct', 'oed', 'oen', 'omm', 'ont', 'opt', 'pan', 'pam', 'par', 'ped', 'pin', 'pis', 'pol', 'por', 'pro', 'rhe', 'sei', 'sit', 'syn', 'syl', 'sym', 'tax', 'the', 'the', 'tom', 'ton', 'top', 'tox', 'tri', 'ulo', 'uro', 'uro', 'xen', 'xer', 'zon', 'zyg', 'psil', 'prot', 'pros', 'amph', 'anem', 'anti', 'anth', 'arct', 'astr', 'athl', 'auto', 'basi', 'bibl', 'briz', 'brom', 'brom', 'call', 'carp', 'carp', 'cata', 'chir', 'cine', 'cirr', 'clad', 'clav', 'coel', 'copr', 'cosm', 'crep', 'cris', 'crit', 'cten', 'cyan', 'cycl', 'cyst', 'deca', 'deka', 'delt', 'derm', 'dexi', 'dino', 'dipl', 'ecto', 'endo', 'engy', 'eoso', 'etho', 'ethi', 'ethm', 'ethn', 'etym', 'fant', 'glia', 'gram', 'gymn', 'haem', 'hapl', 'heli', 'hemi', 'hept', 'herp', 'heur', 'hipp', 'home', 'horm', 'hyal', 'hydr', 'hygr', 'hypn', 'icos', 'kine', 'lamp', 'leps', 'leuc', 'leuk', 'lith', 'metr', 'meta', 'micr', 'myri', 'myth', 'narc', 'naut', 'necr', 'nect', 'nema', 'neur', 'noth', 'noto', 'oeco', 'ogdo', 'olig', 'onom', 'ophi', 'orch', 'orth', 'pach', 'paed', 'pale', 'path', 'patr', 'pect', 'pent', 'pept', 'peri', 'petr', 'phae', 'phag', 'pher', 'phil', 'phob', 'phon', 'phor', 'phos', 'phot', 'phyl', 'phys', 'plac', 'plas', 'plec', 'plut', 'pneu', 'poie', 'pole', 'poli', 'poli', 'poly', 'raph', 'rhag', 'rhig', 'rhin', 'rhiz', 'rhod', 'sarc', 'scel', 'scop', 'sema', 'siph', 'soma', 'soph', 'stea', 'steg', 'sten', 'stig', 'stom', 'styl', 'tach', 'tars', 'taur', 'tele', 'tele', 'temn', 'tetr', 'than', 'thus', 'ther', 'thym', 'thyr', 'trag', 'trit', 'trop', 'xiph', 'proct', 'ptych', 'amphi', 'arche', 'archi', 'arche', 'arist', 'arthr', 'bathy', 'batho', 'blenn', 'blast', 'botan', 'brady', 'bront', 'calli', 'calyp', 'cardi', 'centr', 'ceram', 'cerat', 'chlor', 'chore', 'chrom', 'chron', 'chrys', 'clast', 'clist', 'cochl', 'corac', 'cotyl', 'crani', 'cross', 'crypt', 'dendr', 'dodec', 'dynam', 'ennea', 'gastr', 'graph', 'heter', 'homal', 'hyper', 'klept', 'lekan', 'macro', 'melan', 'meter', 'morph', 'nephr', 'nomad', 'odont', 'organ', 'osteo', 'palae', 'palin', 'peran', 'phleg', 'phloe', 'phren', 'phryn', 'phyll', 'plagi', 'platy', 'plesi', 'pleth', 'pleur', 'pogon', 'polem', 'potam', 'rhabd', 'rhomb', 'scaph', 'schem', 'schis', 'scler', 'scoli', 'scept', 'scyph', 'selen', 'solen', 'sperm', 'sphen', 'spher', 'stern', 'stich', 'stoch', 'taeni', 'techn', 'therm', 'thyre', 'traum', 'trema', 'trich', 'troch', 'troph', 'xanth', 'psych', 'archae', 'brachi', 'brachy', 'bronch', 'cathar', 'cephal', 'chelon', 'cleist', 'cosmet', 'cylind', 'dactyl', 'deuter', 'dogmat', 'erythr', 'galact', 'hendec', 'ichthy', 'mening', 'myrmec', 'omphal', 'opisth', 'opoter', 'ornith', 'ostrac', 'persic', 'phalar', 'phaner', 'phragm', 'plinth', 'prasin', 'presby', 'rhynch', 'scalen', 'strept', 'stroph', 'thalam', 'theori', 'trachy', 'trapez', 'tympan', 'aesthet', 'anthrop', 'branchi', 'cleithr', 'epistem', 'parthen', 'phalang', 'pharmac', 'porphyr', 'sacchar', 'sphinct', 'stalact', 'stalagm', 'thalass', 'oesophag', 'ophthalm', 'physalid', 'pentecost', 'treiskaidek'];

function crush(n) {
  const xa = 1; const ya = 4; const xb = 7; const yb = 6; const xc = 8; const yc = 7; const xd = 16; const yd = 10;
  if (n <= xa) return ya
  if (n <= xb) return ((yb - ya) / (xb - xa)) * (n - xa) + ya
  if (n <= xc) return ((yc - yb) / (xc - xb)) * (n - xb) + yb
  return ((yd - yc) / (xd - xc)) * (n - xc) + yc
}

function generateDifficultyIndex(word) {
  // returns 0-1 with 0 being not difficult at all
  let d = 0;
  let w = nlp__default['default'](word.text);
  if (w.has('#Verb')) {
    d += .5;
  }
  if (w.has('#Acronym')) {
    d += .8;
  }
  let greekF = howGreek(word.text);
  if (greekF > 1) {
    d += greekF / 10;
  }
  return Math.min(1, Math.min(d, 1));
}

function wordValue(word, d) {
  return crush(word.text.length) * (d + 1)
}

function charsMsAt(wpm) {
  const avgCharsInWord = 4.7;
  return 1000 / ((wpm / 60) * avgCharsInWord)
}

function howGreek(word) {
  let length = word.length;
  if (length < 5) return 0
  for (let prefix of greek_prefixes) {
    if (prefix.length >= length - 3) return 0
    if (prefix == word.substring(0, prefix.length)) return prefix.length
  }
  return 0
}

class PinkyPromise {
  constructor(executor) {
    let _reject = null;
    let _resolve = null;
    
    const cancelablePromise = new Promise((resolve, reject) => {
      _reject = reject;
      _resolve = resolve;
      return executor(resolve, reject);
    });
    cancelablePromise.cancel = _reject;
    cancelablePromise.resolve = _resolve;

    return cancelablePromise;
  }
}

class Idle {
  constructor(idleTime){
    this.afkChain = new Map;
    this.activeChain = new Map;
    this.idleTime = idleTime;
    this.isIdle = false;
    window.onload = 
    window.onmousedown =             // catches touchscreen presses as well      
    window.onmousemove =             // catches touchscreen presses as well      
    window.onscroll = 
      () => { this.reset(); };

  }

  generateActionKey(key){
    if (key == null) key = this.afkChain.size;
    return key
  }
  
  onAfk(cb, key){
    this.afkChain.set(this.generateActionKey(key), cb); 
    return this
  }
  
  onActive(cb, key){
    this.activeChain.set(this.generateActionKey(key), cb); 
    return this
  }

  reset(){
    clearTimeout(this.t);
    this.t = setTimeout(() => this.idle(), this.idleTime);  // time is in milliseconds
    this.active();
    return this
  }
  
  idle(){
    if (this.isIdle) return false
    this.isIdle = true;
    doMap(this.afkChain); 
    return this
  }

  active(){
    if (!this.isIdle) return false
    this.isIdle = false; 
    doMap(this.activeChain);
    return this
  }
}



function doMap(map){
  for (const [ key, cb ] of map.entries()){
      cb();
  }
}

function wfyInner(desc){
  if (!desc) return false
  desc = pragmajs._e(desc);
  let txt = desc.textContent;
  let inner = "";
  for (let txt of desc.textContent.split(" ")){
    // console.log(txt)
    console.log(typeof txt);
    let noWhiteSpace = txt.replace(/\s/g, "");
    inner += noWhiteSpace.length!=0 ? "<w>"+txt.split(" ").join("</w> <w>")+"</w> " : txt;
  }

  desc.html(inner);
}

function wfyElement(element){
  element = pragmajs._e(element);
  let nodes = element.findAll("*");
  if (nodes.length == 0) return wfyInner(wfyInner(element))
  nodes.forEach(desc => wfyElement(desc));
}

function wfy(element){
  // console.log(`wfying ${JSON.stringify(element)}`)
  element = pragmajs._e(element);
  // if (element.textContent.replaceAll(" ", "").length<1) return false
  let txtNodes = element.findAll("p, div, h1, h2, h3, h3, h4, h5, article, text");
  if (txtNodes.length==0) return wfyElement(element)
  // txtNodes.each((i, el) => {
  //   wfy(el)
  // })
  txtNodes.forEach(el => wfy(el));
  return true
}

// airway handles the start of the marker animation
// the target is to make it as smooooooooooooooooth
// as possible
//
//


const conf = {
  threshold: 8, // will run for the first 8 words
  divider: 8 // the lower the slower the acceleration
};

function airway(time=0, session=0){
  if (session > conf.threshold) return time
  return (time*(conf.threshold - session))/conf.divider + time
}

function range(start, stop, step) {
    var a = [start], b = start;
    while (b < stop) {
        a.push(b += step || 1);
    }
    return a;
}

var helpers = /*#__PURE__*/Object.freeze({
  __proto__: null,
  PinkyPromise: PinkyPromise,
  Idle: Idle,
  range: range,
  isOnScreen: isOnScreen,
  isMostlyInScreen: isMostlyInScreen,
  scrollTo: scrollTo,
  onScroll: onScroll,
  crush: crush,
  generateDifficultyIndex: generateDifficultyIndex,
  wordValue: wordValue,
  charsMsAt: charsMsAt,
  wfy: wfy,
  airway: airway
});

class PragmaLector extends pragmajs.Pragma {

  constructor(){
    super(arguments);
  }

  get lector(){
    return this
  }

  get mark(){
    return this._mark
  }

  set mark(m){
    this.adopt(m);
    this._mark = m;
  }

  get settings(){
    return this._settings
  }
  set settings(s){
    this.adopt(s);
    this._settings = s;
  }

  get isReading(){
    return this.w.isReading
  }

  get currentWord(){
    return this.w.currentWord
  }
  get currentParent(){
    return this.currentWord.parent
  }

  connectTo(w){
    this.w = w;
    this.add(w);

    return this
  }

  removeWord(key){
    console.log('> remove', key);
    this.w.remove(key);
  }

  addWord(w, setIndex=true){
    this.w.add(w);
    if (setIndex){
      this.w.value = w.key;
    }

    // w.do(_ => {
    //   if (!w.dv) return 
    //   console.log("W VALUE", w.value,w.dv)
    //   // this.connectTo(this.w.next())
    // })
    // this.connect()
    return this
  }

  toggle(){
    if (this.isReading) return this.pause()
    return this.read()
  }

  read(){
    pragmajs.util.log("::LECTOR reading", this);
    if (!this.w.hasKids) return console.error('nothing to read')
    console.log(this.w);
    this.w.read();
  }

  summonTo(n){
    this.currentParent.value += n;
    this.currentWord.summon();
  }

  goToNext(){ this.summonTo(+1); }
  goToPre(){ this.summonTo(-1); }

  pause(){
    this.w.pause();
  }

  setFont(font){
    console.log(this.w);
    this.w.css(`font-family ${font}`);
  }

}

class PragmaWord extends pragmajs.Pragma {

  constructor(k){
      super(k);
      this.do(function(){
        if (this.hasKids && this.parent){
          // if (this.childMap.has(this.value)){
          // let excess = this.childMap.has(this.value) ? 0 : (this.value>0 ? 1 : -1)
          
          this.parent.value = this.key; 
          // + excess
          // if (excess){
          //   console.log("EXCESSSS", excess)
          //   console.log(this.next)
          //   if (this.isReading){
          //     this.pause().then(_ => {
          //       this.parent.read()
          //     })
          //   }
          // }
         
        }
      });
  }
  destroy(){
    this.childMap = null;
    return null
  }

  get lector(){
    if (this.parent) return this.parent.lector
    pragmajs.util.throwSoft('could not find lector for');
  }

  get txt(){
    return this.text
  }

  get index(){
    return parseInt(this.key)
  }

  get mark(){
    if (this.parent) return this.parent.mark
    return null
  }

  set mark(m){
    if (this.parent) this.parent.mark = m;
    return null
  }

  get isReading(){
    return this.currentPromise != null
  }

  get currentWord(){
    if (!this.hasKids) return this
    // console.log(this.value)
    // console.log(this.childMap)
    // console.log(this.element, this.value, this.childMap, this.get(this.value))
    let subW = this.get(this.value);
    if (!subW) return pragmajs.util.throwSoft(`Could not find current Word of ${this.key}`)
    return subW.currentWord
  }

  getFromBottom(n){
    // get items from last
    return this.get(this.kidsum-n)
  }
  sibling(n){
    if (!this.parent) return null
    let sib = this.parent.get(this.index+n);

    // [1, 2, 3, 4, 5]
    // [1, 2, 3, 4, 5]

    if (!sib){

      console.log(this.parent);
      if (n < 0) return this.parent.sibling(-1).getFromBottom(n)
      return this.parent.sibling(1).get(n)
      // this.parent.sibling(-1).get(this.parent.sibling(-1).)
      // this.parent.sibling(n > 0 ? 1 : -1).get(n)
    }

    return sib
  }

  get next() {
    return this.sibling(1)
  }
  
  get pre() {
    return this.sibling(-1)
  }

  isInTheSameLine(n) {
    return this.sibling(n) != null && ((this.sibling(n).top - this.top) ** 2 < 10)
  }
  get isFirstInLine() {
    return !this.isInTheSameLine(-1)
  }
  get isLastInLine() {
    return !this.isInTheSameLine(1)
  }
  time(wpm = 250) {
    return charsMsAt(wpm) * wordValue(this, generateDifficultyIndex(this))
  }
  pause(){
    return new PinkyPromise( resolve => {
      if (this.currentPromise){
        this.currentPromise.catch((e)=>{
          //console.log("broke read chain")
          this.mark.pause().catch(e => {
            // this will trigger if mark is already pausing and not done yet
            console.warn("prevent pause event from bubbling. Chill on the keyboard bro", e);
          }).then(() => {
            this.currentPromise = null;
            resolve("done pausing");
            console.log("- - - - - PAUSED - - - - - - - -");
          });
        });
        this.currentPromise.cancel("pause");
      } else { resolve("already paused"); }
    })
  }

  set currentPromise(p){
    if (this.parent) return this.parent.currentPromise = p
    this.currentPromiseVal = new PinkyPromise((resolve, reject) => {
      p.catch((e) => {
        console.warn(e);
        // this.currentPromiseVal = null
        // reject(e)
      }).then(() => {
        // this.currentPromiseVal = null
        resolve();
        this.currentPromiseVal = null;
      });
    });
  }

  get currentPromise() {
    return this.parent ? this.parent.currentPromise : this.currentPromiseVal
  }

  promiseRead(){
    this.currentPromise = new PinkyPromise((resolve, reject) => {
          // this.mark = "MARK V5 " + this.text() + this.key
          // console.log(this.mark)
          // console.log(this.text())
          console.time(this.text);
          this.mark.guide(this).then(() => {
            console.timeEnd(this.text);
            this.parent.value = this.index + 1;
            resolve(` read [ ${this.text} ] `);
          }).catch((e) => {
            console.warn('rejected promise read', e);
            reject(e);
          });
      });
    // console.log(this.mark)
    return this.currentPromise
  }

  read(){
    if (this.currentPromise) return new Promise((resolve, reject) => {
      resolve('already reading');
    })

    if (this.hasKids){
      // recursive reading 
      if (this.currentWord) return this.currentWord.read()
      this.next.value = 0;
      return this.next.read()
    } 

    this.promiseRead();
    // console.log(this)
    return new PinkyPromise(resolve => {
      this.currentPromise.then(() => {
       resolve();
       this.currentPromise = null;
       return this.parent.read()
      }).catch(e => resolve('pause'));
    })
  }

  summon(silent=false) {
    if (this.hasKids) return false
    console.log("SUMMONING", this);
    return this.parent.pause().catch(() => console.log('no need to pause')).then(() => {
      this.mark.mark(this, 50, true);
      if (!silent) this.parent.value = this.index;
    })
  }
}

const reset = `border 0
               border-radius 3px
               z-index 10
               opacity 1
               mix-blend-mode darken;`;


const modes = {
  'hotbox': bg => `background ${bg}`,

  'underneath': bg => ` background transparent
                        border-bottom 3px solid ${bg}
                        border-radius 4px`,

  'faded': bg => `
      background: rgb(255,255,255);
      background: -moz-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      background: -webkit-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#ffffff",endColorstr="#ffffff",GradientType=1);
    `
};

function grabMode(mode, bg) {
  return reset + modes[mode](bg)
}

const mode_ify = (mark, mode=mark._mode, bg=mark._color) => {
  mode = (mode || 'hotbox').toString().toLowerCase();
  let css = grabMode(mode, bg);
  if (mark) mark.css(css);
  return css
};

// mark is responsible for marking words in the screen

const defaultStyles = `
  position absolute
  outline solid 0px red
  background-color #ffdf6c
  width 10px
  height 20px
  z-index 10
  opacity 1
  mix-blend-mode darken
  border-radius 3px
`;

class PragmaMark extends pragmajs.Pragma {
  constructor() {
    super('marker');

    this.element = pragmajs._e("marker");
    this.appendTo('body');
    this.hide();
    this.css(defaultStyles);

    this.currentlyMarking = null;
    window.addEventListener('resize', () => {
      this.mark(this.last_marked, 0);
    });

    this.runningFor = 0;
    this.pausing = false;

    //this.idle = new Idle(8000)
      //.onAfk(()=> {
        //util.log('user is afk')
        //this.shout()
      //})
      //.onActive(() => {
        //util.log('user is back')
        //this.shutUp()
      //})
  }
  hide(){
    if (this._hidden) return
    this._hidden = true;
    this.element.hide();
  }
  show(){
    if (!this._hidden) return
    this._hidden = false;
    this.element.show();
  }

  set last_marked(n){
    this.value = n;
  }

  get last_marked(){
    return this.value
  }

  get settings() {
    return this.parent ? this.parent.settings : console.error('mark has no settings attached')
  }

  get cw() {
    return this._fovea * 30
  }
  
  get wpm() { return this._wpm || 260 }
  
  setMode(mode){
    this._mode = mode;
    mode_ify(this);
  }

  setWpm(wpm){
    this._wpm = wpm;
  }

  setColor(hex){
    this._color = hex;
    //this.css(`background-color ${hex}`)
    mode_ify(this);
  }

  setFovea(val){
    this._fovea = val;
    this.css(`width ${this.cw}px`);
  }

  pause() {
    return new Promise((resolve, reject) => {
      if (this.pausing) return reject("already pausing")

      this.pausing = true;

      if (this.currentlyMarking && this.current_anime && this.last_marked) {
        //console.log(this.current_anime.seek(1))
        let temp = this.last_marked;
        console.log('mark was running for', this.runningFor);
        this.runningFor = 0;
        //console.table(temp)
        this.current_anime.complete();
        this.current_anime.remove('marker');
        //this.current_anime = null
        this.mark(temp, 80, true).then(() => {
          resolve("paused");
        }).catch(e => {
          reject("could not mark");
        }).then(c => {
          this.pausing = false;
        });
      }
    })
  }

  moveTo(blueprint, duration, complete = (() => {})) {
    this.show();
    //this.shutUp() // clear any ui elements that direct attention to mark
    if (this.currentlyMarking) return new Promise((resolve, reject) => resolve());
    return new Promise((resolve, reject) => {
      this.currentlyMarking = blueprint;
      this.current_anime = anime__default['default']({
        targets: this.element,
        left: blueprint.left,
        top: blueprint.top,
        height: blueprint.height,
        width: blueprint.width,
        easing: blueprint.ease || 'easeInOutExpo',
        duration: duration,
        complete: (anim) => {
          this.currentlyMarking = null;
          complete();
          resolve();
        }
      });
      // console.log(blueprint)
      // console.log(this.current_anime)
    })
  }


  mark(word, time = 200, fit = false, ease = "easeInOutExpo") {
    //console.log("marking", word)
    if (!(word instanceof pragmajs.Pragma)) return new Promise((r) => { console.warn("cannot mark"); r("error"); })
    let w = fit ? word.width + 5 : this.cw;
    //this.setWidth(w)
    return this.moveTo({
        top: word.top,
        left: word.x(w),
        height: word.height,
        width: w,
        ease: ease
      }, time, () => {
        //console.log(`FROM MARK -> marked ${word.text}`)
        this.last_marked = word;
        // word.parent.value = word.index
      })
  }

  guide(word) {
    if (!(word instanceof pragmajs.Pragma)) return new Promise((resolve, reject) => { console.warn("cannot guide thru"); reject("error"); })
    return new PinkyPromise((resolve, reject) => {
      let first_ease = word.isFirstInLine ? "easeInOutExpo" : "linear";
      return this.moveTo({
        top: word.top,
        left: word.x(this.width) - word.width / 2,
        height: word.height,
        width: this.cw,
        ease: first_ease
      }, this.calcDuration(word, 1))
        .then(() => {
          this.last_marked = word;
          this.runningFor += 1;
          this.mark(word, this.calcDuration(word, 2), false, "linear").then(() => {
            resolve();
          });
        })
    })
  }

  calcDuration(word, dw=1){

    /*  @dw - either 1 or 2
      * 1. yee|t th|e green fox
      * 2. yeet |the| green fox
      * 1. yeet th|e gr|een fox
      *
      * The marking of "the"(and every word) happens in 2 instances. First mark
      * will transition from "yeet" (1) and then in will mark "the", and immedietly afterwards
      * it will transition from "the" to "green" (1) etc...
      *
      * */

    if (!word instanceof pragmajs.Pragma) return this.throw(`Could not calculate marking duration for [${word}] since it does not appear to be a Pragma Object`)
    if (dw!=1 && dw!=2) return this.throw(`Could not calculate duration for ${word.text} since dw was not 1 or 2`)
    if (word.isFirstInLine) return 500 // mark has to change line
    if (!this.last_marked) return 0 // failsafe

    const before_weight = .4;
    const weight = dw==1 ? before_weight : 1 - before_weight;

    let w = dw==1 ? this.last_marked : word;
    //const filters = [(d) => { return d*weight }]

    let duration = w.time(this.wpm);
    const filters = [(d) => { return d*weight }, airway];


    filters.forEach(f => {
      //console.log(f, duration, this.runningFor)
      //console.log(duration, f(duration, this.runningFor))
       duration = f(duration, this.runningFor);
    });

    return duration
    //return airway(duration)*weight// TODO make this a chain of callbacks
  }
}

function paginator(pageTemplate, conf={}){
  return new pragmajs.Pragma()
        .from(pragmajs.util.createTemplate({
          // make this nicer
          // defaultSet: pageTemplate,
          pageTemplate: pageTemplate,
          fetch: typeof conf.fetch === 'function' ? conf.fetch : _=>{ pragmajs.util.throwSoft('no fetch source specified'); },
          onCreate: typeof conf.onCreate === 'function' ? conf.onCreate : p => pragmajs.util.log('created', p),
          onFetch: conf.onFetch,

          onPageAdd: null,
          onPageRender: null,
          //typeof conf.onPageRender === 'function' ? conf.onPageRender : function(page, i){ util.log('rendered', page, 'active?', page.active) },
          onPageActive: typeof conf.onPageActive === 'function' ? conf.onPageActive: function(page, i){pragmajs.util.log('active', page); },
          onPageInactive: typeof conf.onPageInactive === 'function' ? conf.onPageInactive : function(page, i) { pragmajs.util.log('inactive', page); },
        }))

        .run(function(){

          let _ptemp = pragmajs._e(this.pageTemplate).hide();
          this.pageTemplate = _ptemp.cloneNode(false);

          this._clonePage = function() {
            let page = pragmajs._e(this.pageTemplate.cloneNode(false)).show();
            //if (this._lastAddedPage){
              ////page.style.height = this._lastAddedPage.height
              //page.css(`height ${this._lastAddedPage.height}px`)
              //console.log('>>>>>>>>>>>>>>>>>>>>', this._lastAddedPage.height)
            //}
            this.adopt(page);
            page.lec = this.parent;
            pragmajs.util.createEventChains(page, 'fetch');
            return page
          };

          this.create = function(val=this.value, action='append'){
            // console.log('creating', val, action)
            let cloned = this._clonePage();

            new Promise( resolve => {

              this.onCreate(cloned, val);

              let f = this.fetch(val);

              let onFetch = conf.onFetch ||
                        function(page, fetched){
                          page.html(fetched);
                          resolve(page);
                        };

                        // on fetch in config or the default one
              //
              const onFetchAndResolve = (resolved) => {
                let page = this.pages.get(val);
                if (page){
                  onFetch(page, resolved);
                  resolve(page);
                }
              };

              if (f instanceof Promise){
                f.then(resolved => {
                  onFetchAndResolve(resolved);
                });
              } else {
                  onFetchAndResolve(f);
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
              page.fetchChain.exec();
              if (this.onPageRender) this.onPageRender(page, val);
              //this._lastAddedPage = page
            });

            cloned[`${action}To`](this.parent.element);
            this.addPage(cloned, val);
          };

          this.pages = new Map();

          this.destroy = function(val){
            //console.log('>> destroy', val)

            let toDestroy = this.pages.get(val);

            let destroy = _ => {
              toDestroy = this.pages.get(val);
              //toDestroy.destroy()
              this.delPage(val);
              toDestroy.destroy();
            };

            if (this.onPageDestroy){
              let r = this.onPageDestroy(toDestroy, val);
              if (r instanceof Promise) return r.then(destroy)
            }

            destroy();
          };

          this.addPage = function(page, key){
            key = key === null ? this.pages.size : key;
            if (this.onPageAdd) this.onPageAdd(page, key);
            this.pages.set(key, page);
          };

          this.delPage = function(key){
            return this.pages.delete(key)
          };

          this.activate = function(...pages){
            pages.forEach(pageIndex => {
              let page = this.pages.get(pageIndex);
              if (!page) return
              page.active = true;
              this.onPageActive(page, pageIndex);  
            });
          };

          this.inactivate = function(...pages){
            pages.forEach(pageIndex => {
              let page = this.pages.get(pageIndex);
              if (!page) return
              page.active = false;
              this.onPageInactive(page, pageIndex);
            });
          };
          
          // this.goTo()
          this.goTo = function(val, speed){
            let _actionKey = `add-${this.value}`;

            this.value = val;
            let page = this.pages.get(val);
            page.onRender(function(){
              scrollTo(page, speed||20);
            });
          };

          this.export(
            "pageTemplate",
            "_clonePage",
            "create",
            'destroy',
            "pages",
            "addPage",
            "delPage",
            'activate',
            'inactivate',
            'goTo');
        })
}

function infinityPaginator(streamer, pageTemplate, config={}){
  let inf = pragmajs._p("infinity paginator")
        .from(
          paginator(pageTemplate, pragmajs.util.objDiff(
            {
              streamer: streamer,
              fetch: streamer.fetch,
              // on page render
              // on page active

              // on page inactive,
              // on page add,
              // on create,
              // on fetch
            }, config)
          )
        )
        .setValue(0)
        .run({
          initialConfig(){
            const conf = {
              headspace: 10,
              timeout: 5 
            };

            this.fill = function(){

              this.fetching = true;
              // console.log(">>> FILLING WITH", this.value)
              let start = this.value >= conf.headspace ? this.value-conf.headspace : 0;
              let pageRange = range(start, this.value+conf.headspace);
              let pagesRendered = Array.from(this.pages.keys());

              let pagesToRender = pragmajs.util.aryDiff(pageRange, pagesRendered);
              let pagesToDelete = pragmajs.util.aryDiff(pagesRendered, pageRange);


              let pagesToRenderAfter = pagesToRender.filter(i => i>this.value);
              let pagesToRenderBefore = pragmajs.util.aryDiff(pagesToRender, pagesToRenderAfter);

              // console.log(">> ALREADY RENDERED", pagesRendered)
               console.log(">> DEL", pagesToDelete);
               //console.log(">> ADD", pagesToRender) 
               console.log(">> ADD AFTER", pagesToRenderAfter);
               console.log(">> ADD BEFORE", pagesToRenderBefore);

              // pararellize?
              pragmajs.runAsync(
                _ => {
                  for (let pageIndex of pagesToRenderAfter){
                    this.create(pageIndex, 'append');
                  }  
                },
                _ => {
                  // pararellize?
                  for (let pageIndex of pagesToRenderBefore.reverse()){
                    this.create(pageIndex, 'prepend');
                  }
                },
                _ => {
                  // pararellize?
                  for (let pageIndex of pagesToDelete){
                    //this.inactivate(pageIndex)
                    //this.pages.get(pageIndex).css("background:red")
                    this.destroy(pageIndex);
                  }
                }
              );
              setTimeout(a => {
                this.fetching = false;
                console.log(this.pages);
              }, conf.timeout);
          };
        },
        findActivePages(){
          

          function findCandidates(pages, scroll){

            let bestIndex = null;
            let best = 999999999999;
            const middle = scroll + window.innerHeight/2;
            // console.log(pages)
            for (let [pageIndex, page] of pages){
              let pageMiddle = page.top + page.height/2;
              let closeness = Math.abs(pageMiddle - middle);
              // console.log(page, pageIndex, closeness)
              if (closeness <= best){
                best = closeness;
                bestIndex = pageIndex;
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
              resolve(findCandidates(this.pages, s));
              //let canditates
              //util.bench(_ => canditates = findCandidates(this.pages, s))
              ////resolve(canditates)
              //setTimeout(_ => resolve(canditates), 5)
            })
          };

          let searching = false;
          let owe = false;
          const doOnScroll= (pos, dp) => {
            if (this.fetching) return 
            if (searching) return owe = { pos: pos, dp: dp }

            searching = true;
            this.findActivePage(pos, dp).then(active => {
              // console.log("ACTIVE>>", active, this.pages.get(active))
              this.value = active;
              searching = false;
              if (owe){
                // console.log('owe', owe)
                doOnScroll(owe.pos, owe.dp);
                owe = null;
              }
            });
          };

          onScrollEnd((pos, dp) => {
            doOnScroll(pos, dp);
          });
          
          // optimization for fast scroll
          onScroll((pos, dp) => {
            if (Math.abs(dp) > 40){
              if (pos < 350) doOnScroll(pos, dp);
            }
          });
          
          //onScroll((pos, dp) => {
            //if (pos < 300){
              //doOnScroll(pos, dp)
            //}
          //})

        }
      })
      .do(function(){
        if (this.dv === 0) return
        this.activate(this.value);
        let preVal = this.value-(this.dv||1);
        this.inactivate(preVal);

        this.fill();
      });

  return inf
}

const defaults = {
  onOptionCreate: function(self, option){
    self.contain(option);
  },
  optionTemplate: function(option){
      return _p(option)
              .html(option)
              .addClass('pragma-click')
              .on('click').do(function(){
                this.parent.value = this.key;
              })
  }
};  


const select = (conf) => _p()
    //.from(util.createTemplate())
    .run(function(){
      let options = conf.options;
      if (!options) return pragmajs.util.throwSoft('need to define options when creating a select template')

      let onOptionCreate = conf.onOptionCreate || defaults.onOptionCreate;
      let optionTemplate = conf.optionTemplate || defaults.optionTemplate; 

      if (options.constructor === Array){
        for (let el of options){
          onOptionCreate(this, optionTemplate(el));
        }
      }else {
        for (let [ key, val ] of Object.entries(options)){
          const pair = {[key]: val};
          onOptionCreate(this, optionTemplate(key, val), pair);
        }
      }

      this.onExport(function(pragma) {
        pragma.contain(...this.children);
      });
      this.export('elementDOM', 'actionChain', 'exportChain', 'exports');
    });

var slider = "@charset \"utf-8\";.pragma-slider{user-select:none;cursor:grab}.pragma-slider:active{cursor:grabbing}.pragma-slider-bg{width:100%;height:8px;background:rgba(66,66,66,0.5);border-radius:15px}.pragma-slider-bar{height:100%;width:25%;background:#0074D9;position:relative;transition:all .05s ease;border-radius:15px}.pragma-slider-thumb{width:18px;height:18px;border-radius:25px;background:#f1f1f1;transition:all .05s ease;position:absolute;right:0;top:50%;bottom:50%;margin:auto}";
var main = "@charset \"utf-8\";@import url(https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300&display=swap);.glass-block,.lector-mini-settings,.lector-settings,.glass-block-border{background:rgba(35,35,35,0.55);backdrop-filter:blur(30.5px);-webkit-backdrop-filter:blur(30.5px);border-radius:5px;padding:20px 40px;color:whitesmoke}.glass-block-border{border:1px solid rgba(255,255,255,0.18)}.fixed-bottom-box,.lector-mini-settings,.lector-settings{position:fixed;bottom:20px}.lector-settings{left:0;padding-left:40px;transition:all .2s;font-family:'Poppins','Inter','Arial Narrow',Arial,sans-serif}.lector-settings .pragma-input-element{display:flex;flex-direction:column;width:fit-content;justify-content:center}.lector-settings .section{margin:10px 0}.lector-settings #fovea{height:fit-content;padding:10px}.lector-mini-settings{right:0;padding-right:40px}.settings-input{display:flex;flex-direction:column;align-items:center}.pragma-label{font-size:12px;color:whitesmoke}.pragma-input-text{font-family:'Poppins',sans-serif;font-size:18px;border-style:none;outline:none;color:whitesmoke;background:#1515157b;border-radius:2px;margin:5px 10px;padding:7px 9px;text-align:center}.active-select-template{display:flex;flex-direction:row;flex-wrap:no wrap;justify-content:space-around;align-items:center;width:100%;padding:10px}.active-select-template .option{user-select:none;cursor:pointer}.active-select-template .active{opacity:1 !important}.active-select-template .inactive{opacity:.5 !important}";
var css = {
	slider: slider,
	main: main
};

pragmajs.util.addStyles(css.slider);
  
function slider$1(conf={}){
  
  
  this._n = function(){ 
    let range = this.range || { min: 1, max: 100};
    return 100/(range.max||100-range.min||1)
  };


  this.do(function(){
    this.element.setData({ value: this.value});
    this._setBarTo(this.value*this._n());
  });

  this._setBarTo = wp => {
    this._bar.css(`width ${wp}%`);
    this._thumb.offset();
  };

  this._clipValue = perc => {
    let v = Math.round(perc/this._n());
    if (this._lv !== v) {
      this.value = v;
    }
    //console.log(this.value)
  };
  
  this._input = _e('div.').addClass('pragma-slider-bg');
  this._bar = _e('div.')
    .addClass('pragma-slider-bar');
  
  this._thumb = _e('div.pragma-slider-thumb');
  this._bar.append(this._thumb);

  this._input.append(this._bar);
  

  let onDown = function(){
    this._clicked = true;
  };

  this._input.listenTo('mousedown', onDown);
  this._thumb.listenTo('mousedown', onDown);
  
  document.addEventListener('mouseup', ()=> {
    this._input._clicked = false;
  });      
  
  let ticking = false;

  document.addEventListener("mousemove", yx => {
    if (this._input._clicked && !ticking) {
      window.requestAnimationFrame(() => {
        //doSomething(last_known_scroll_position);
        ticking = false;
        let w = yx.screenX-this._input.offset().left;
        let wp = Math.round(Math.min(w/this._input.rect().width, 1)*100);
        this._clipValue(wp);
      });
      ticking = true;
    }
  });

  this.adopt(this._input);
  this.append(this._input);
  this.element.addClass('pragma-slider');
}

function input(conf = {}) {
    return new pragmajs.Pragma()
        .from(pragmajs.util.createTemplate(conf))
        .run({
            makeChains(){
                pragmajs.util.createChains(this, 'userInput');
            },
            makeInput () {
                this.input = _e(`<input type='text'></input>`)
                    .addClass('pragma-input-text');

                this.setValue = function(v){
                    let newVal = this.valueSanitizer ? this.valueSanitizer(v) : v;

                    this.value = newVal;

                    if (this.value != newVal){
                        this.updateFront();
                    }
                    return this
                };

                this.input.listenTo('focus', function(){
                    this.parent._listenToEsc = document.addEventListener('keydown', k => {
                        if (k.key === 'Enter'){
                            this.blur();
                        }
                    });
                });
                
                this.input.listenTo('focusout', function(){
                    this.parent.setValue(this.value);
                    this.parent.userInputChain.exec(this.parent.value);
                    document.removeEventListener('keydown', this.parent._listenToEsc);
                });

                this.export(
                    'actionChain',
                    'input',
                    'setValue',
                    'userInputChain',
                    'onUserInput');

                this.onExport(pragma => {
                    // pragma.adopt(this.input)
                    pragma.adopt(this.input);
                    pragma.append(this.input);
                });
            },
        
            extend(){
                this.updateFront = function(val=this.value){
                    this.input.value = val;
                    this.input.placeholder = val;
                };
                this.export('updateFront');
            }
        })
        .do(function(){
            this.updateFront(this.value);
        })

        .run(function(){
            this.setInputAttrs = function(attrs){
                for (let [key, val] of Object.entries(attrs)){
                    this.input.attr(key, val);
                }
                return this
            };

            this.setValueSanitizer = function(cb){
                this.valueSanitizer = cb;
                return this
            };
            this.export('setInputAttrs', 'setValueSanitizer');
          })
}

function withLabel(conf = {}) {
    return new pragmajs.Pragma()
        // this.from(input(conf))
        .run(function(){
            this.setLabel = function(html){
                this._label.html(html);
                return this
            };
            
            this.onExport(function(pragma){
                pragma._label = _e('div.pragma-label', conf.label);
                pragma.append(pragma._label);    
            });
            
            this.export('setLabel');
        })
}

const colors = ["#a8f19a", "#eddd6e", "#edd1b0", "#96adfc"];
const fonts = ["Helvetica", "Open Sans", "Space Mono"];
const modes$1 = ["HotBox", "Underneath", "Faded"];

var shc = {
  wpmPlus: ['+', '='],
  wpmMinus: ['-'],

  pageNext: ']',
  pagePre: '['
};

function activate(self, key){
  self.find(key).addClass('active')
                .removeClass('inactive');
}

function deactivate(self, key){
  self.find(key).removeClass('active')
                .addClass('inactive');
}

const activeSelectTpl = (conf={}) => pragmajs._p()
  .from(select(pragmajs.util.objDiff({
    onOptionCreate: (self, el) => {
      self.contain(el);
      el.addClass('option');
      deactivate(self, el.key);
    }
  }, conf)))
  .addClass('active-select-template')
  .do(function(){
    if (this.value === this._lv) return
    activate(this, this.value);
    if (this._lv) deactivate(this, this._lv);
  });

function lectorSettings(lector){
  //
  // let foveaComp = Slider.value("markerfovea", 1, 10)
  //     .bind(">", (comp) => { comp.value+=1 }, 'keyup')
  //     .bind("<", (comp) => { comp.value-=1 }, 'keyup')
  //     .html.class("slider")

  const actions = {
    changeColor(hex=this.value){
      modeComp.update(hex);
      foveaComp.update(hex);
      lector.mark.setColor(hex);
    },

    changeFovea(fovea=this.value){
      lector.mark.setFovea(fovea);
    },

    changeWpm(wpm=this.value){
      lector.mark.setWpm(wpm); 
    },

    changeFont(font=this.value){
      lector.setFont(font);
    },

    changeMode(mode=this.value){
      lector.mark.setMode(mode); 
    },

    changePage(page=this.value){
      lector.paginator.goTo(page); 
    }
  };

  let settings = pragmajs._p("settingsWrapper")
                  .addClass("items-center", 'lector-settings')
                  .run(function(){
                    this.value = {};

                    this._setVal = function(edit){
                      this.value = pragmajs.util.objDiff(this.value, edit);
                    };

                    this.set = function(edit){
                     this._setting = true; 
                      for (let [key, val] of Object.entries(edit)){
                        let child = this.find('!'+key);
                        if (child) child.value = val;
                      }
                     this._setting = false;
                    };
                    
                    this.get = function(key){
                      return this.value[key] 
                    };
                  });
                  //.do(function(){
                    //console.log('set value', this.value)
                  //})

  let foveaComp = pragmajs._p("!fovea")
                  .addClass('section')
                  .run(slider$1)
                  .import(withLabel)
                  .setRange(2, 10)
                  .setValue(5)
                  // .setLabel('fovea')
                  .do(actions.changeFovea)
                  .run(function(){
                    this.update = function(bg){
                      this._bar.css(`background-color ${bg}`);
                    };
                  });


  let modeComp = pragmajs._p('!mode')
                  .from(activeSelectTpl({
                    options: modes$1,
                    optionTemplate: option => pragmajs._p(option)
                        .css(`width 35px;
                              height 20px;
                         `)
                        .on('click').do(function(){
                          this.parent.value = this.key;
                        })
                        .run(function(){
                          this.update = bg => {
                            mode_ify(this, option, bg);
                            this.css('mix-blend-mode normal');  
                          };
                        })
                  }))
                  .run(function(){
                    this.update = function(bg){
                      this.children.forEach(child => child.update(bg));
                    };
                  })
                  .addClass('section')
                  .do(actions.changeMode);

  let colorsComp = pragmajs._p('!color')
                  .from(activeSelectTpl({
                    options: colors,
                    optionTemplate: option => {
                      return pragmajs._p(option)
                              .css(`
                                width 25px
                                height 25px
                                border-radius 25px
                                background-color ${option} 
                              `)
                              .on('click').do(function(){
                                this.parent.value = this.key;
                              })
                    }
                  }))
                  .addClass('section')
                  .do(actions.changeColor);


  let fontComp = pragmajs._p('!font')
                  .run(function(){
                    console.log(this.key);
                  })
                  .from(activeSelectTpl({
                    options: fonts,
                    optionTemplate: option => pragmajs._p(option)
                              .html("Aa")
                              .css(`font-family ${option}`)
                              .on('click').do(function(){
                                this.parent.value = this.key;
                              })
                  }))
                  .css(`flex-direction row`)
                  .addClass('section')
                  .do(actions.changeFont);

  let wpmComp = pragmajs._p("!wpm")
                  .import(input, withLabel)
                  .addClass('settings-input', 'section')
                  .setInputAttrs({
                    maxlength: 4,
                    size: 4
                  })
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setLabel('wpm')
                  .setRange(40, 4200)
                  .setValue(250)
                  .bind(shc.wpmPlus, function(){ this.value+=10; })
                  .bind(shc.wpmMinus, function(){ this.value-=10; })
                  .do(actions.changeWpm);
  
  let pageComp = pragmajs._p("!page")
                  .import(input, withLabel)
                  .setInputAttrs({
                    maxlength: 4,
                    size: 4
                  })
                  .addClass('settings-input', 'section')
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setLabel('page')
                  .run(function(){
                    pragmajs.util.createChains(this, 'userEdit');

                    this.editValue = function(val){
                      this.value = val;  
                      this.userEditChain.exec(this.value);
                    };

                    this.onUserEdit(actions.changePage);
                  })
                  .run(function(){
                    this.onUserInput(val => {
                      console.log(val);
                      this.editValue(val);
                    });
                  })
                  .setValue(1)
                  .bind(shc.pageNext, function(){
                    this.editValue(this.value+1);
                  }, 'keyup')
                  .bind(shc.pagePre, function(){
                    this.editValue(this.value-1);
                  }, 'keyup');
                  
                  //.do(actions.changePage)

  //const comps = [colorsComp, fontComp, foveaComp, modeComp]

  //comps.forEach(comp => {
    //comp.do(function(){
      //console.log(this.key, this.value)
    //})
  //})
  let miniSettings = pragmajs._p('mini-settings')
                      .addClass('lector-mini-settings')
                      .contain(pageComp)
                      .pragmatize();
  
  let popUpSettings = pragmajs._p("popupsettings")
        .contain(
          fontComp.setId('font'), 
          colorsComp.setId('color'), 
          modeComp.setId('mode'),
          foveaComp.setId('fovea'),) 
        .run(function(){
          this.show = function(){
            this.hidden = false;
            this.element.show();
          };
          this.hide = function(){
            this.hidden = true;
            this.element.hide();
          };
          this.toggle = function(){
            this.hidden ? this.show() : this.hide();
          };

          this.show();
        })
        .bind("h", function() { this.toggle(); });

// pageComp
  settings.contain(popUpSettings, wpmComp);
  settings.adopt(miniSettings);
  
  const listenTo_ = p => p.key && p.key.indexOf('!') === 0;


  settings.allChildren.forEach(child => {
    if (listenTo_(child)){
      child.do(_ => settings._setVal({[child.key.substring(1)]: child.value}));
    }
  });
  
  settings.do(function(){
    if (!this._setting){
      console.log('syncing',this.value);
    }
  });

  settings.set({
    'color': colors[1],
    'font': fonts[1],
    'mode': modes$1[2],
    'fovea': 4,
    'wpm': 420
  });
 
  return settings.pragmatize()
}

// TODO add more default options
const default_options = {
  wfy: true,
  pragmatizeOnCreate: true,
  experimental: false,
  settings: false,
  defaultsStyles: true
};

const Mark = (lec) => {
  let mark = new PragmaMark();

  function logger(w){
  }

  // auto scroll feature
  // TODO put somewhere else
  let scrollingIntoView = false;
  let usersLastScroll = 0;

  function userIsScrolling(){
    return usersLastScroll - Date.now() > -10
  }

  function autoScroll(w){
    //return
    if (userIsScrolling() || isOnScreen(mark.element) || scrollingIntoView) return false
    // else we're out of view

    scrollingIntoView = true;

    let cbs = []; // these will be the callbacks that are gonna run when the scroll is done
    // TODO  make a class Chain that does this.
    // Chain.add(cb), Chain.do() to execute and shit
    if (lec.isReading){
      lec.pause();
      cbs.push(() => {
        lec.read();
      });
    }

    cbs.push(()=>{
      //console.warn("suck my diiiiiiiiiick")
    });

    //console.warn("mark is out of screen")
    //console.log('lec reading:', lec.isReading)

    scrollTo(mark).then(() => {
      cbs.forEach(cb => cb());
      scrollingIntoView = false;
    });
  }

  const threshold = 40; // how fast should you scroll to pause the pointer
  let lastScroll = 0;
  onScroll(s => {
    usersLastScroll = !scrollingIntoView ? Date.now() : usersLastScroll;
    // console.log('user is scrolling', userIsScrolling())

    if (userIsScrolling() && lec.isReading){
      let dscroll = Math.abs(lastScroll-s);
      lastScroll = s;
      if (dscroll>threshold){
        // console.log('ds=', dscroll)
        // TODO prevent from calling pause to many times
        // on too fast scroll, pause mark
        lec.pause();
      }
    }
  });

  mark.on('mouseover', function(){
    console.log(this, 'hover');
  });

  mark.do(logger, autoScroll);
  return mark
};

//console.log(_e("#div").deepQueryAll.toString())
const Word = (element, i) => {
  let w = new PragmaWord(i)
          .as(element)
          .setValue(0);

  // new Promise(_ => {
    let thisw = w.element.deepQueryAll('w');
    // console.timeLog('deepQuery')
    if (i && thisw.length === 0) {
      w.addListeners({
        "click": function(e, comp){
          this.summon();
        }
      });
    }

    thisw.forEach((el, i) => {
      let ww = Word(el, i);
      w.add(ww);
    });
    // console.log('async done')
  // })

  // console.log('w done')
  return w
};

const Reader = (l, options=default_options) => {
  l = pragmajs._e(l);
  if (options.wfy) wfy(l);
  let w = Word(l);

  let lec = new PragmaLector("lector")
              .as(l)
              .setValue(0)
              .connectTo(w);
  
  lec.mark = Mark(lec);
  if (options.settings) lec.settings = lectorSettings(lec);


  function bindKeys(){
    lec.bind("right", _ => lec.goToNext());
    lec.bind("left", _ => lec.goToPre());

    lec.bind("space", _ => false, 'keydown'); // dont trigger the dumb fucken scroll thing
    lec.bind("space", function(){
      this.toggle();
      return false
    }, 'keyup');

  }

  function experiment(){
    if (globalThis.pragmaSpace.mousetrapIntegration){
        bindKeys();
    }
  }

  if (options.pragmatizeOnCreate) lec.pragmatize();
  if (options.experimental) experiment();

  return lec
};

function _needWrapper(op){
    return op.stream || op.paginate
}


function _streamer(sf){
  return pragmajs._p('streamer')
          .setValue(0)
          .run(function(){
            this.fetch = sf;
            this.getContent = function(){
              return this.fetch(this.value)
            };
          })

}

const Lector = (l, options=default_options) => {
  if (!_needWrapper(options)) return Reader(l, options)

  pragmajs.util.log("configuration appears to be a bit more complicated");

  if (options.defaultStyles){
    console.log('adding styles', css.main);
    pragmajs.util.addStyles(css.main);
  }

  if (options.experimental &&
      options.stream &&
      options.paginate &&
      options.paginate.from === 'stream' &&
      options.paginate.as === 'infiniteScroll'){

    pragmajs.util.log('setting up streamer service');

    let streamer = _streamer(options.stream);
    let paginator = infinityPaginator(streamer, l, options.paginate.config || {});

    // let reader = _p()
    //               .as(_e(l).parentElement)

    // console.log('creating new lector')
    // console.log(l)
    // console.log(_e(l).parentElement)
    // let options = util.objDiff({ skip: true })
    let lector = Reader(pragmajs._e(l).parentElement, options)
                  .adopt(paginator, streamer);

    lector.paginator = paginator;
    if (lector.settings){
      console.log("lector has settings! connecting paginator's value to pagecomp");
      let pageComp = lector.settings.find('!page');
      pageComp.wireTo(lector.paginator);
    }
    console.log('paginator', paginator);

    paginator.fill();
    return lector

    //streamer.wireTo(paginator) // when paginator changes value, change value of streamer as well

    //streamer.do(function(){
      //console.log(`fetching page [${this.value}]`)
    //})

  }
};

//util.addstyles(`

  //.lector-settings {
    //position fixed
    //bottom 20px
    //left 20px
    //color whitesmoke
    //border-radius 5px
    //padding 20px 40px
    //transition: all .2s

    //background: rgba( 35, 35, 35, 0.55 );
    //backdrop-filter: blur( 30.5px );
    //-webkit-backdrop-filter: blur( 30.5px );
    //border-radius: 10px;
    //border: 1px solid rgba( 255, 255, 255, 0.18 );

  //}

  //#settingswrapper .pragma-input-element{

    //display: flex;
    //flex-direction: column;
    //width: fit-content;
    //justify-content: center;
    //align-items: center;

  //}

  //.settings-input{
    //display: flex;
    //flex-direction: column;
    //align-items: center;
  //}
  //.pragma-label{
    //font-size: 12px;
    //color: whitesmoke;
  //}
  //.pragma-input-text {
    //font-family: 'poppins', sans-serif;

     //border-style: none;
     //outline: none;
     //color: whitesmoke;
     //background: #252525;
     //border-radius: 2px;

     //margin: 5px 10px;
     //padding: 4px 5px;
     //text-align: center;
  //}
//}
//`)

function globalify(){
  const attrs = {
    Lector: Lector,
    Word: Word,
    _e: pragmajs._e,
    _p: pragmajs._p,
    util: pragmajs.util,
    lecUtil: helpers,
    _thread: pragmajs._thread
  };

  for (let [key, val] of Object.entries(attrs)){
    globalThis[key] = val;
  }
}

exports.Lector = Lector;
exports.Word = Word;
exports.globalify = globalify;
exports.helpers = helpers;
