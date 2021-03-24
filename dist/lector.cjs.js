'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pragmajs = require('pragmajs');
var anime = require('animejs');
var nlp = require('compromise');
require('mousetrap');

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
    
    const events = [ 'load', 'mousemove'];

    events.forEach( event => {
      window.addEventListener(event, _ => this.reset());
    });
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
  if (txt.length === 0) return false

  let inner = "";
  for (let txt of desc.textContent.split(" ")){
    // console.log(txt)
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
  let txtNodes = element.findAll("*");
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

function isClickWithin(click, el){
    el = pragmajs._e(el);
    let left = el.rect().x;
    let top = el.rect().y;
    let width = el.rect().width;
    let height = el.rect().height;

    console.log(click, el.offset());
   
    let _x =  left < click.x && left + width > click.x;
    let _y =  top < click.y && top + height > click.y;
  
    return _x && _y
  }

function collapse(element){
    
    element.css(`
        opacity 0
    `);


    element.addClass(`collapsed`);
    element.setData({ 'collapsed': true });
    return element
}

function expand(element){
    
    element = pragmajs._e(element);
    
    element.show();
    anime__default['default']({
        targets: element,
        opacity: 1,
        duration: 110,
        easing: 'easeInOutSine'
    });

    element.removeClass(`collapsed`);
    element.setData({ 'collapsed': true });
}


function fadeTo(el, value, ms = 500) {
    el = pragmajs._e(el);
    el.css(`
    transition opacity ${ms}ms 
    opacity ${value}
  `);

    return new Promise(resolve => {
        setTimeout(() => {
            if (value == 0) {
                el.hide();
            } else {
                el.show();
            }
            resolve();
        }, ms);
    })
}

var helpers = /*#__PURE__*/Object.freeze({
  __proto__: null,
  PinkyPromise: PinkyPromise,
  Idle: Idle,
  range: range,
  isClickWithin: isClickWithin,
  collapse: collapse,
  expand: expand,
  fadeTo: fadeTo,
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

    this.createEvent('load');
    this.on('load', () => this._loaded = true);
    
  }

  whenLoad(){
    return new Promise((resolve, reject) => {
      if (this._loaded){
        resolve(this);
      } else {
        this.on('load', () => resolve(this));
      }
    })

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
    this.w.remove(key);
  }

  addWord(w, setIndex=false){
    w.value = w.value ?? 0;
    this.w.add(w);
    //w.currentWord.summon()
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
    this.w.read(true);
  }

  summonTo(n){
    this.currentParent.value += n;
    this.currentWord.summon();
  }
  
  resetMark(){
    this.whenLoad().then(() => {
      if (this.currentWord && !this.currentWord.hasKids) this.currentWord.summon();
    });
  }

  goToNext(){ this.summonTo(+1); }
  goToPre(){ this.summonTo(-1); }

  pause(){
    return this.w.pause()
  }

  setFont(font){
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
      if (typeof this.parent.sibling !== 'function') return null

      if (n < 0) return this.parent.sibling(-1).getFromBottom(n)
      return this.parent.sibling(1)?.get(n)
      // this.parent.sibling(-1).get(this.parent.sibling(-1).)
      // this.parent.sibling(n > 0 ? 1 : -1).get(n)
    }

    return sib

    // return this.parent ? this.parent.get(this.index + n) : null
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

  promiseRead(startingToRead){
    this.currentPromise = new PinkyPromise((resolve, reject) => {
          // this.mark = "MARK V5 " + this.text() + this.key
          // console.log(this.mark)
          // console.log(this.text())
          console.time(this.text);
         
          function launchMark(){
            let time = startingToRead ? 500 : null;
            this.mark.guide(this, time).then(() => {
              console.timeEnd(this.text);
              this.parent.value = this.index + 1;
              resolve(` read [ ${this.text} ] `);
            }).catch((e) => {
              console.warn('rejected promise read', e);
              reject(e);
            });
          }
      

          let self = this;
          if (startingToRead){
            new Promise(resolve => {
              resolve();
            }).then(data => {
              launchMark.bind(self)();
            });
          } else {
            launchMark.bind(self)();
          }
      });
    // console.log(this.mark)
    return this.currentPromise
  }

  read(source=false){
    if (this.currentPromise) return new Promise((resolve, reject) => {
      resolve('already reading');
    })

    if (this.hasKids){
      // recursive reading 
      if (this.currentWord) return this.currentWord.read(source)
      this.next.value = 0;
      return this.next.read()
    } 

    this.promiseRead(source);
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
      this.mark.mark(this, 50, false);
      if (!silent) this.parent.value = this.index;
    })
  }
}

const reset = `border 0
               border-radius 3px
               z-index 10
               opacity 1
               mix-blend-mode darken;`;


const modes$1 = {
  'hotbox': bg => `background ${bg}`,

  'underneath': bg => ` background transparent
                        border-bottom 3px solid ${bg}
                        border-radius 4px`,

  'faded': bg => `
      background: rgb(255,255,255);
      background: -moz-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      background: -webkit-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ bg } 25%, ${ bg } 75%, rgba(255,255,255,0) 100%);
    `
};

function grabMode(mode, bg) {
  return reset + modes$1[mode](bg)
}

const mode_ify = (mark, mode=mark._mode, bg=mark._color) => {
  if (!bg) return util.throwSoft("could not mode_ify")
  
  mode = (mode || 'hotbox').toString().toLowerCase();
  let css = grabMode(mode, bg);
  if (mark) mark.css(css);
  return css
};

const colorsHumanFriendly = {
    "#a8f19a": 'Grass', 
    "#eddd6e": 'Pasta', 
    "#edd1b0": 'Floor', 
    "#96adfc": 'Water'
};

const colors = Object.keys(colorsHumanFriendly);
const fonts = ["Helvetica", "Open Sans", "Space Mono"];
const modes = ["HotBox", "Underneath", "Faded"];
const modesHumanFriendly = {
    "HotBox": "marker is a block",
    "Underneath": "marker is slim and underneat the words",
    "Faded": "marker's boundaries loose their essence"
};

const defaultVals = {
    color: "#eddd6e",
    font: "Helvetica",
    mode: "Faded",
    fovea: 4,
    wpm: 250
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
    
    this.setColor(defaultVals.color);
    this.setMode(defaultVals.mode);
    this.setWpm(defaultVals.wpm);
    this.setFovea(defaultVals.fovea);

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
        this.mark(temp, 80, false).then(() => {
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
    console.log('moving to', blueprint);
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

  guide(word, time) {
    if (!(word instanceof pragmajs.Pragma)) return new Promise((resolve, reject) => { console.warn("cannot guide thru"); reject("error"); })
    return new PinkyPromise((resolve, reject) => {
      let first_ease = word.isFirstInLine ? "easeInOutExpo" : "linear";
      return this.moveTo({
        top: word.top,
        left: word.x(this.width) - word.width / 2,
        height: word.height,
        width: this.cw,
        ease: first_ease
      }, time || this.calcDuration(word, 1))
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

    if (!(word instanceof pragmajs.Pragma)) return this.throw(`Could not calculate marking duration for [${word}] since it does not appear to be a Pragma Object`)
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
          firstPage: conf.first,
          lastPage: conf.last,
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

          this.isPageAvailable = v => {
            return (!this.firstPage || v >= this.firstPage)
                                      && (!this.lastPage || v <= this.lastPage)
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
            'inactivate');
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

            this._watching = true;
            const conf = {
              headspace: 10,
              timeout: 5 
            };

            this.fill = function(){

              this.fetching = true;
              // console.log(">>> FILLING WITH", this.value)
              let start = this.value >= conf.headspace ? this.value-conf.headspace : 0;
              let pageRange = range(start, this.value+conf.headspace);
              console.log(pageRange);
              pageRange = pageRange.filter(v => this.isPageAvailable(v));
              console.log(pageRange);
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
        }, scrollSetup(){
          // this.goTo()
          this.goTo = function (val, speed) {
            `add-${this.value}`;
            let paginator = this;

            if (this.value != val) this.value = val;
            let page = this.pages.get(val);

            page.onRender(function () {
              paginator._watching = false;
              scrollTo(page, speed || 20).then(() => {
                paginator._watching = true;
              });
            });
          };

          this.export('goTo');
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
            if (this.fetching || !this._watching) return 
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
      return pragmajs._p(option)
              .html(option)
              .addClass('pragma-click')
              .listenTo('click', function(){
                this.parent.value = this.key;
              })
  }
};  


//  const select = (conf) => _p()
//     //.from(util.createTemplate())
//     .run(function(){
//       // this._options = []
      
//       let options = conf.options
//       if (!options) return util.throwSoft('need to define options when creating a select template')

//       let onOptionCreate = conf.onOptionCreate || defaults.onOptionCreate
//       let optionTemplate = conf.optionTemplate || defaults.optionTemplate 

//       if (options.constructor === Array){
//         for (let el of options){
//           onOptionCreate(this, optionTemplate(el))
//         }
//       }else{
//         for (let [ key, val ] of Object.entries(options)){
//           const pair = {[key]: val}
//           onOptionCreate(this, optionTemplate(key, val), pair)
//         }
//       }

//       this.onExport(function(pragma) {
//         pragma.contain(...this.children)
//         pragma.getOptions = function(){
//           console.log(pragma.children)
//           return pragma.children.filter(child => child._isOption)
//         }
//       })
//       this.export('elementDOM', 'actionChain', 'exportChain', 'exports', '_options')
//     })

function select(conf){
  // this._options = []
  
  let options = conf.options;
  if (!options) return pragmajs.util.throwSoft('need to define options when creating a select template')

  let onOptionCreate = conf.onOptionCreate || defaults.onOptionCreate;
  let optionTemplate = conf.optionTemplate || defaults.optionTemplate; 

  if (options.constructor === Array){
    for (let el of options){
      let option = optionTemplate(el);
      option._isOption = true;

      onOptionCreate(this, option);
    }
  }else {
    for (let [ key, val ] of Object.entries(options)){
      const pair = {[key]: val};
      onOptionCreate(this, optionTemplate(key, val), pair);
    }
  }

  // this.onExport(function(pragma) {
    // pragma.contain(...this.children)
    this.getOptions = function(){
      console.log(this.children);
      return this.children.filter(child => child._isOption)
    };
}

var full = "@charset \"utf-8\";@import url(https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;700&family=IBM+Plex+Sans:wght@300;400;700&display=swap);body{background-color:#161616}.flex,.inline-icon,.inline-icon-2{display:flex;justify-content:center;align-items:center}.inline-icon,.inline-icon-2{width:22px}.inline-icon svg,.inline-icon-2 svg{width:22px}.inline-icon-2{width:25px}.inline-icon-2 svg{width:25px}.clickable{cursor:pointer}.meta{opacity:.5}.blurred-bg{width:100vw;height:100vh;position:fixed;top:0;left:0;z-index:9999999999999999999;background:rgba(255,255,255,0.15);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}.popUp{width:400px;height:350px;background:#161616;border-radius:4px;position:absolute;top:30%;left:50%;margin-left:-200px;padding:20px;box-sizing:border-box}.popUp .next-btn,.popUp .back-btn{position:absolute;right:-50px;width:40px;height:40px;background:#161616;border-radius:50px;top:50%;margin-top:-25px;cursor:pointer}.popUp .next-btn .next-icon,.popUp .back-btn .next-icon,.popUp .back-btn .back-icon,.popUp .next-btn .exit-icon,.popUp .back-btn .exit-icon{text-align:center;position:absolute;top:46%;left:52%;transform:translate(-50%,-50%) rotate(180deg)}.popUp .next-btn .next-icon>svg,.popUp .back-btn .next-btn .back-icon>svg,.popUp .back-btn .next-icon>svg,.popUp .back-btn .back-icon>svg,.popUp .next-btn .exit-icon>svg,.popUp .back-btn .exit-icon>svg{width:10px;height:auto}.popUp .next-btn .exit-icon,.popUp .back-btn .exit-icon{transform:translate(-50%,-50%);top:55%;left:50%}.popUp .next-btn .exit-icon>svg,.popUp .back-btn .exit-icon>svg{width:15px;height:auto}.popUp .back-btn{left:-50px}.popUp .back-btn .back-icon{transform:translate(-50%,-50%);top:56%;left:47%}.popUp .popUpContent{width:100%;height:100%;box-sizing:border-box;transition:all ease .5s}.popUp .popUpContent .boat{width:100%;height:100%;display:flex;flex-direction:column;flex-wrap:nowrap;justify-content:space-around;align-items:center;align-content:stretch;text-align:center}.popUp .popUpContent .boat-title{font-family:'IBM Plex Sans',sans-serif;color:whitesmoke;margin:0;font-weight:400;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.popUp .popUpContent .boat .spacebar-icon>svg{width:230px}.popUp .popUpContent .boat .speed-icon>svg{width:315px}.popUp .popUpContent .boat .click-icon>svg{width:315px}.displayN{display:none !important}";
var slider$1 = "@charset \"utf-8\";.pragma-slider{user-select:none;cursor:grab}.pragma-slider:active{cursor:grabbing}.pragma-slider-bg{width:100%;height:5px;background:#6F6F6F;border-radius:15px}.pragma-slider-bar{height:100%;width:100%;background:#2B6CCE;position:relative;transition:all .05s ease;border-radius:15px}.pragma-slider-thumb{width:5px;height:18px;background:#2b6cce;transition:all .05s ease;position:absolute;right:0;top:50%;bottom:50%;margin:auto}";
var main = "@charset \"utf-8\";@import url(https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300&display=swap);@import url(https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&display=swap);.glass-block,.lector-mini-settings,.glass-block-border{background:rgba(35,35,35,0.55);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:5px;padding:20px 40px;color:whitesmoke}.glass-block-border{border:1px solid rgba(255,255,255,0.18)}.fixed-bottom-box,.lector-mini-settings,.lector-settings{position:fixed;bottom:20px}.lector-settings .pop-up-settings{background-color:#262626;border-radius:5px;left:-10px;transition:all .2s;padding:20px 5px 11px 5px;margin-left:10px;font-family:'Poppins','Inter','Arial Narrow',Arial,sans-serif;width:200px;margin-bottom:10px}.lector-settings .pragma-input-element{display:flex;flex-direction:column;width:fit-content;justify-content:center}.lector-settings .section{margin:20px 0}.lector-settings .section:hover>.pragma-label{opacity:1}.lector-settings .section .pragma-label{opacity:0;transition:all .2s ease;position:absolute;left:25%;margin-top:-55px;font-size:12px;color:whitesmoke}.lector-settings .section .pragma-label .option-title{color:rgba(199,199,199,0.92)}.lector-settings .selector,.lector-settings .selector-fovea,.lector-settings .selector-mode{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center;align-items:center;align-content:stretch;width:fit-content;border-radius:4px;overflow:hidden}.lector-settings .selector-mode{padding:0;color:#262626;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center;align-items:center;align-content:center;left:-7%;top:-70px}.lector-settings .selector-fovea{width:130px;height:45px;left:-9%;top:-70px;z-index:45678;margin-right:9px}.lector-settings .setting,.lector-settings .setting-wpm{width:100%;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-around;align-items:center;align-content:stretch}.lector-settings .setting .setting-icon,.lector-settings .setting-wpm .setting-icon{width:35px;height:35px}.lector-settings .setting-wpm{border-radius:5px;left:-10px;transition:all .2s;margin-left:20px;font-family:'Poppins','Inter','Arial Narrow',Arial,sans-serif;width:125px;position:relative}.lector-settings .setting-wpm .speed-adjust{width:10px}.lector-settings .setting-wpm .speed-adjust .adjusticon{width:10px;height:20px}.lector-settings .setting-wpm::before{content:\"\";position:absolute;height:30px;width:1px;background-color:#6F6F6F;left:-10px}.lector-settings .settings-bar{background-color:#262626;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-around;align-items:center;align-content:stretch;margin-left:10px;padding:5px 0 5px 10px;border-radius:5px;width:200px}.lector-settings .settings-bar-icon{width:25px;height:25px;position:relative;cursor:pointer}.lector-settings .wpm-icon{color:#fff;opacity:65%;font-size:28px;line-height:45px;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.lector-settings .wpm-icon:hover{opacity:100%;transition:all ease .1s}.lector-settings .color-indicator{width:25px;height:25px;background-color:#a8f19a;border-radius:50%}.lector-settings .mode-indicator{mix-blend-mode:normal !important;width:35px;height:25px}.lector-settings .modeOption{width:45px;height:25px;padding:10px 1px;display:flex;align-items:center;justify-content:center;background-color:transparent !important}.lector-settings .modeOption.inactive{background-color:transparent !important;opacity:.5 !important}.lector-settings .modeOption.active{opacity:1 !important}.lector-settings .modeOption.active::before{content:none}.lector-settings .modeOption .mini-pointer{height:70%;width:70%}.lector-settings .color-option{width:22px;height:22px;border-radius:25px;margin:5px 6px}.lector-settings .displayN{display:none}.lector-settings #underneath{margin:0 !important;position:relative}.lector-settings #mode{margin:35px 0;position:relative}.lector-settings #mode::before{width:70%;height:1px;background-color:#6F6F6F;content:\"\";position:absolute;top:-14px}.lector-settings #mode::after{width:70%;height:1px;background-color:#6F6F6F;content:\"\";position:absolute;bottom:-22px}.lector-settings #fovea{height:fit-content}.lector-settings #fovea .pragma-label{margin-top:-25px}.lector-settings #wpm .pragma-label{position:relative;left:0;margin:0;opacity:1;font-size:18px}.lector-mini-settings{right:-10px;padding-right:40px}.lector-mini-settings .section{margin-top:25px;margin-bottom:25px}.settings-input{display:flex;flex-direction:column;align-items:center}.pragma-input-text{font-family:'IBM Plex Mono',monospace;font-size:22px;border-style:none;outline:none;color:whitesmoke;border-radius:2px;background-color:transparent;text-align:center}.pragma-input-text:hover{background:#393939}.active-select-template{display:flex;flex-direction:row;flex-wrap:no wrap;justify-content:space-around;align-items:center;width:100%}.active-select-template .option{user-select:none;cursor:pointer}.active-select-template .active{opacity:1 !important;background-color:gray;position:relative;transform-style:preserve-3d}.active-select-template .active::after{height:32px;top:-6px;left:-10px}.active-select-template .active::before{width:30px;height:30px;top:-4px;border-radius:2px;left:-4px;background-color:#6F6F6F;position:absolute;border-radius:50%;content:\"\";z-index:-1;transform:translateZ(-1px);transition:ease all .2s;-webkit-transition:all 1s;-moz-transition:all 1s;animation:sheen 1s forwards}.active-select-template .inactive{background-color:#1a1a1a}.word-element{cursor:pointer;transition:all .05s ease;border-radius:1px}.word-element.hover-0{background-color:#2b6cce37;outline:2px solid #2b6cce37;border-radius:0}.word-element.hover-1{background-color:rgba(184,184,184,0.249)}.word-element.hover-2{background-color:rgba(184,184,184,0.119)}.word-element.hover-3{background-color:rgba(184,184,184,0.043)}";
var settings = "@charset \"utf-8\";@import url(https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;700&family=IBM+Plex+Sans:wght@300;400;700&display=swap);.collapsable,.settings #popup{overflow:hidden;transition:all .15s ease;height:auto;flex:1}.collapsable.collapsed,.settings #popup.collapsed{flex:0}.box-container,.settings #popup,.bar{background-color:#262626;border-radius:4px;display:flex;flex-direction:column;flex-wrap:nowrap;justify-content:flex-start;align-items:stretch;align-content:stretch;height:auto;padding:10px 15px;width:180px}.bar{width:fit-content;flex-direction:row;justify-content:space-between;align-items:center}.settings{z-index:999999999999999;font-family:'IBM Plex Sans',sans-serif;font-size:18px;bottom:10px;left:10px;color:whitesmoke;position:fixed}.settings #popup{position:absolute;bottom:55px}.settings #wpm{width:100px;padding-left:20px;margin-left:15px;border-left:1px solid gray}.settings [data-setting-target=back]{cursor:pointer;height:24px;display:flex;align-items:center;margin-bottom:27px}.settings [data-setting-target=back]::after{content:'';height:2px;width:120%;background-color:#6f6f66;position:absolute;top:40px;left:0}.settings [data-setting-target=back] .back-icon{margin-right:10px;margin-right:18px;margin-left:7px}.settings [data-setting-target=back] .back-copy{margin-bottom:3px}.settings #page-bar{position:fixed;right:10px;bottom:10px}.settings #zoom-bar{position:fixed;right:10px;top:20px;padding:8px 5px}.settings #zoom-bar .setting{height:fit-content}.settings #zoom-bar .setting .arrows{height:80px;justify-content:space-between}.edible-display{background:#39393950;padding:1px 5px !important;font-family:'IBM Plex Mono',monospace;font-size:18px;border-style:none;outline:none;color:whitesmoke;border-radius:2px;text-align:center}.edible-display:hover{background:#7b7b7b35}.setting{display:flex;flex-wrap:nowrap;justify-content:flex-start;height:30px;user-select:none;-webkit-user-select:none}.setting.collapsable,.settings #popup.setting{height:40px}.setting.inline{height:30px;width:100%}.setting.expanded{height:200px}.setting.collapsed{height:0;flex:0}.setting .section,.setting .collapsed-section{width:100%;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-between;align-items:center;align-content:stretch;cursor:pointer}.setting .editor-content .option{display:flex;margin:15px 0;cursor:pointer;opacity:70%}.setting .editor-content .option.selected{opacity:100%}.setting .color-blob{width:22px;height:22px;border-radius:30px;margin-right:10px}.setting .color-blob.selected{border:10px solid red}.setting .mode-icon{margin-right:20px}.setting .arrows{display:flex;flex-direction:column;padding:5px;justify-content:center;align-items:center}.setting .arrows svg,.setting .arrows div{opacity:.7;cursor:pointer;padding:2px 0}.setting .arrows svg:hover,.setting .arrows div:hover{opacity:1}[data-setting='mode'] [data-option='Underneath']{margin:0 0 20px 0 !important;display:flex;align-items:center}.-selector *,.-settings-section-list .option.selected *,.settings>#popup #color .option.selected *,.settings>#popup #mode .option.selected *,.-color-selector *{z-index:99}.-selector::before,.-settings-section-list .option.selected::before,.settings>#popup #color .option.selected::before,.settings>#popup #mode .option.selected::before,.-color-selector::before{content:'';height:50px;width:120%;background-color:#515151;position:absolute;z-index:0 !important;left:0;margin-top:-11px}.-selector::after,.-settings-section-list .option.selected::after,.settings>#popup #color .option.selected::after,.settings>#popup #mode .option.selected::after,.-color-selector::after{content:'';width:5px;height:50px;background-color:#2b6cce;position:absolute;left:0;margin-top:-11px}.-color-selector::before,.settings>#popup #color .option.selected::before{height:40px}.-color-selector::after,.settings>#popup #color .option.selected::after{height:40px}.-settings-section-list .option,.settings>#popup #color .option,.settings>#popup #mode .option{transition:all ease .2s;align-items:stretch !important}";
var css = {
	full: full,
	slider: slider$1,
	main: main,
	settings: settings
};

pragmajs.util.addStyles(css.slider);
function slider(conf={}){
  
  
  this._n = function(){ 
    let range = this.range || { min: 1, max: 100};
    return 100/(range.max||100-range.min||1)
  };


  this.do(function(){
    this.updateTo(this.value);
  });
  
  this.updateTo = function(value){
    this.element.setData({ value: value});
    this._setBarTo(value*this._n());
  };

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
  
  this._input = pragmajs._e('div.').addClass('pragma-slider-bg');
  this._bar = pragmajs._e('div.')
    .addClass('pragma-slider-bar');
  
  this._thumb = pragmajs._e('div.pragma-slider-thumb');
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
        ticking = false;
        let w = yx.pageX-this._input.offset().left;
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
    // return new Pragma()
        // .from(util.createTemplate(conf))
        // .run({
            // makeChains(){
                pragmajs.util.createChains(this, 'userInput');
            // },
            // makeInput () {
                this.input = pragmajs._e(`<input type='text'></input>`)
                    .addClass('pragma-input-text');

                this.setValue = function(v){
                    let newVal = this.valueSanitizer ? this.valueSanitizer(v) : v;
                    if (newVal === this._lv) return 

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


                // this.onExport(pragma => {
                    // pragma.adopt(this.input)
                    this.adopt(this.input);
                    this.append(this.input);
                // })
            // },
        
            this.setMonitorTemplate = function(n){
                this._monitorTemplate = n;
                return this
            };
            // extend(){
                this.updateFront = function(val=this.value){
                    this.input.value = this._monitorTemplate ? this._monitorTemplate(val) : val;
                    this.input.placeholder = val;
                };
            // }
        // })
        this.do(function(){
            this.updateFront(this.value);
        });

        // .run(function(){
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
        //   })
}

function withLabel(conf = {}) {
    this.setLabel = function(html){
        this._label.html(html);
        return this
    };
    
    this._label = pragmajs._e('div.pragma-label', conf.label);
    this.append(this._label);    
}

function _createIdler(timeout, afk, active) {
    let _idler = new Idle(timeout)
      .onAfk(()=> {
        console.log('user is afk');
        if (afk) afk();
        // this.shout()
      })
      .onActive(() => {
        console.log('user is back');
        if (active) active();
        // this.shutUp()
    });
    return _idler
}

function idler(){
    pragmajs.util.createChains(this, 'idle', 'active');

    this.setIdleTime = function(time=5000){
        this._idler = _createIdler(time, () => {
            this.idleChain.exec();
        }, () => {
            this.activeChain.exec();
        });
        return this
    };
    
    this.extend('onIdle', function(){
        this._onIdle(...arguments);
        return this
    });

    this.extend('onActive', function(){
        this._onActive(...arguments);
        return this
    });
}

class Scaler extends pragmajs.Pragma {
    constructor(target, duration=70){
        super();
        this.target = target;
        this._duration = duration;
        this.target.css(`transition transform ${this._duration}ms ease; transform-origin top`);

        this.createWire("scale");
        this.scale = 100;

        this.on('scaleChange', function(v, lv){
            if (v == lv) return false
            this.value = this.scale;
            this._scaleTo(this.scale);
        });
    }
    
    setTarget(n) { this.target = n; return this }
    
    set scaleStep(n){
        this._scaleStep = n;
    }

    get scaleStep(){
        return this._scaleStep || 5
    }

    scaleUp(){
        this.scale+= this.scaleStep;
    }
    
    scaleDown(){
        this.scale-= this.scaleStep;
    }
    scaleTo(to){
        this.scale = to;
    }
    
    _scaleTo(to){
        this.target.css(`transform scale(${to/100})`);
        this.currentPromise = new Promise(resolve => {
            setTimeout(() => {
                resolve();
                this.currentPromise = null;
            }, this._duration+25);
        });

        return this.currentPromise
    }
}

//scaler(element){
    //this.target = element

    //this
//}

var shc = {
  wpmPlus: ['+', '='],
  wpmMinus: ['-'],

  pageNext: ']',
  pagePre: '[',

  scaleUp: 'mod+=',
  scaleDown: 'mod+-'
};

var clickBoat = "<svg width=\"365\" height=\"143\" viewBox=\"0 0 365 143\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<line x1=\"4.32031\" y1=\"13.5\" x2=\"131.017\" y2=\"13.5\" stroke=\"#6F6F6F\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<line x1=\"147.859\" y1=\"13.5\" x2=\"274.556\" y2=\"13.5\" stroke=\"#6F6F6F\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<line x1=\"291.398\" y1=\"13.5\" x2=\"361.5\" y2=\"13.5\" stroke=\"#6F6F6F\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<line x1=\"3.5\" y1=\"97.5\" x2=\"185.972\" y2=\"97.5\" stroke=\"#6F6F6F\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<line x1=\"207.734\" y1=\"97.5\" x2=\"361.498\" y2=\"97.5\" stroke=\"#2B6CCE\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<line x1=\"3.5\" y1=\"139.5\" x2=\"236.826\" y2=\"139.5\" stroke=\"#6F6F6F\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<line x1=\"4.32031\" y1=\"55.5\" x2=\"140.86\" y2=\"55.5\" stroke=\"#6F6F6F\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<line x1=\"158.523\" y1=\"55.5\" x2=\"361.501\" y2=\"55.5\" stroke=\"#6F6F6F\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n<rect x=\"31.168\" width=\"99.2472\" height=\"26\" rx=\"5\" fill=\"#A6F29A\"/>\n<path d=\"M319.32 130.43C318.449 129.183 317.578 127.001 315.836 124.194C314.965 122.635 312.352 119.517 311.481 118.27C310.9 117.022 310.9 116.399 311.191 115.152C311.481 113.281 313.223 111.722 315.256 111.722C316.707 111.722 318.159 112.969 319.32 113.904C319.901 114.528 320.772 115.775 321.353 116.399C321.933 117.022 321.933 117.334 322.514 117.958C323.095 118.893 323.385 119.517 323.095 118.27C322.804 116.711 322.514 114.216 321.933 111.722C321.643 109.851 321.353 109.539 321.062 108.292C320.772 106.733 320.482 105.797 320.191 104.238C319.901 103.303 319.611 100.808 319.32 99.5608C319.03 98.0017 319.03 95.1953 320.191 93.9481C321.062 93.0126 322.804 92.7008 323.966 93.3244C325.417 94.2599 326.289 96.4426 326.579 97.3781C327.16 98.9371 327.74 101.12 328.031 103.614C328.611 106.733 329.482 111.41 329.482 112.345C329.482 111.098 329.192 108.915 329.482 107.668C329.773 106.733 330.353 105.485 331.515 105.173C332.386 104.862 333.257 104.862 334.128 104.862C334.999 105.173 335.87 105.797 336.45 106.421C337.612 108.292 337.612 112.345 337.612 112.033C337.902 110.786 337.902 108.292 338.483 107.044C338.773 106.421 339.935 105.797 340.515 105.485C341.386 105.173 342.548 105.173 343.419 105.485C343.999 105.485 345.161 106.421 345.451 107.044C346.032 107.98 346.322 111.098 346.612 112.345C346.612 112.657 346.903 111.098 347.483 110.162C348.645 108.292 352.71 107.668 353 112.033C353 114.216 353 113.904 353 115.463C353 117.022 353 117.958 353 119.205C353 120.452 352.71 123.259 352.419 124.506C352.129 125.441 351.258 127.624 350.387 128.871C350.387 128.871 347.193 132.613 346.903 134.484C346.612 136.355 346.612 136.355 346.612 137.602C346.612 138.85 346.903 140.409 346.903 140.409C346.903 140.409 344.58 140.72 343.419 140.409C342.257 140.097 340.806 137.914 340.515 136.979C339.935 136.043 339.064 136.043 338.483 136.979C337.902 138.226 336.45 140.409 335.289 140.409C333.257 140.72 329.192 140.409 326.289 140.409C326.289 140.409 326.869 137.29 325.708 136.043C324.837 135.108 323.385 133.549 322.514 132.613L319.32 130.43Z\" fill=\"white\"/>\n<path d=\"M319.32 130.43C318.449 129.183 317.578 127.001 315.836 124.194C314.965 122.635 312.352 119.517 311.481 118.27C310.9 117.022 310.9 116.399 311.191 115.152C311.481 113.281 313.223 111.722 315.256 111.722C316.707 111.722 318.159 112.969 319.32 113.904C319.901 114.528 320.772 115.775 321.353 116.399C321.933 117.022 321.933 117.334 322.514 117.958C323.095 118.893 323.385 119.517 323.095 118.27C322.804 116.711 322.514 114.216 321.933 111.722C321.643 109.851 321.353 109.539 321.062 108.292C320.772 106.733 320.482 105.797 320.191 104.238C319.901 103.303 319.611 100.808 319.32 99.5608C319.03 98.0017 319.03 95.1953 320.191 93.9481C321.062 93.0126 322.804 92.7008 323.966 93.3244C325.417 94.2599 326.289 96.4426 326.579 97.3781C327.16 98.9371 327.74 101.12 328.031 103.614C328.611 106.733 329.482 111.41 329.482 112.345C329.482 111.098 329.192 108.915 329.482 107.668C329.773 106.733 330.353 105.485 331.515 105.173C332.386 104.862 333.257 104.862 334.128 104.862C334.999 105.173 335.87 105.797 336.45 106.421C337.612 108.292 337.612 112.345 337.612 112.033C337.902 110.786 337.902 108.292 338.483 107.044C338.773 106.421 339.935 105.797 340.515 105.485C341.386 105.173 342.548 105.173 343.419 105.485C343.999 105.485 345.161 106.421 345.451 107.044C346.032 107.98 346.322 111.098 346.612 112.345C346.612 112.657 346.903 111.098 347.483 110.162C348.645 108.292 352.71 107.668 353 112.033C353 114.216 353 113.904 353 115.463C353 117.022 353 117.958 353 119.205C353 120.452 352.71 123.259 352.419 124.506C352.129 125.441 351.258 127.624 350.387 128.871C350.387 128.871 347.193 132.613 346.903 134.484C346.612 136.355 346.612 136.355 346.612 137.602C346.612 138.85 346.903 140.409 346.903 140.409C346.903 140.409 344.58 140.72 343.419 140.409C342.257 140.097 340.806 137.914 340.515 136.979C339.935 136.043 339.064 136.043 338.483 136.979C337.902 138.226 336.45 140.409 335.289 140.409C333.257 140.72 329.192 140.409 326.289 140.409C326.289 140.409 326.869 137.29 325.708 136.043C324.837 135.108 323.385 133.549 322.514 132.613L319.32 130.43Z\" stroke=\"black\" stroke-width=\"4.50615\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M343.418 131.367V120.766\" stroke=\"black\" stroke-width=\"4.50615\" stroke-linecap=\"round\"/>\n<path d=\"M337.615 131.367L337.324 120.766\" stroke=\"black\" stroke-width=\"4.50615\" stroke-linecap=\"round\"/>\n<path d=\"M331.805 120.766V131.367\" stroke=\"black\" stroke-width=\"4.50615\" stroke-linecap=\"round\"/>\n</svg>\n";
var increase = "<svg width=\"17\" height=\"9\" viewBox=\"0 0 17 9\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.5 0L17 7.89474L15.81 9L8.5 2.21053L1.19 9L0 7.89474L8.5 0Z\" fill=\"white\"/>\n</svg>";
var decrease = "<svg width=\"17\" height=\"9\" viewBox=\"0 0 17 9\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.5 9L2.13343e-07 1.10526L1.19 -1.40286e-06L8.5 6.78947L15.81 -1.24738e-07L17 1.10526L8.5 9Z\" fill=\"white\"/>\n</svg>\n";
var plus = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"/><path d=\"M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z\"/></svg>";
var speedBoat = "<svg width=\"442\" height=\"77\" viewBox=\"0 0 442 77\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect y=\"71\" width=\"64\" height=\"268.075\" rx=\"7.58491\" transform=\"rotate(-90 0 71)\" fill=\"#262626\"/>\n<path d=\"M159.213 51L159.213 46.2113L147.188 46.2113L147.188 43.6248L157.744 26.6023L162.009 26.6023L162.009 43.7995L165.644 43.7995L165.644 46.2113L162.009 46.2113L162.009 51L159.213 51ZM149.81 43.7995L159.213 43.7995L159.213 28.8743L159.073 28.8743L149.81 43.7995ZM185.729 51L169.44 51L169.44 47.994L177.585 40.6537C178.773 39.5818 179.752 38.4865 180.521 37.368C181.29 36.2262 181.674 35.0261 181.674 33.7678L181.674 33.3483C181.674 31.8803 181.29 30.7501 180.521 29.9578C179.752 29.1422 178.61 28.7344 177.095 28.7344C175.604 28.7344 174.45 29.1189 173.635 29.8879C172.842 30.6336 172.248 31.6356 171.852 32.8939L169.231 31.9152C169.464 31.1929 169.778 30.4938 170.174 29.818C170.594 29.1189 171.118 28.5014 171.747 27.9655C172.376 27.4295 173.134 26.9984 174.019 26.6722C174.928 26.3459 175.977 26.1828 177.165 26.1828C178.377 26.1828 179.449 26.3576 180.381 26.7071C181.336 27.0567 182.129 27.546 182.758 28.1752C183.41 28.8043 183.9 29.55 184.226 30.4122C184.575 31.2744 184.75 32.2182 184.75 33.2435C184.75 34.1756 184.61 35.0494 184.331 35.865C184.074 36.6806 183.701 37.4612 183.212 38.2069C182.746 38.9526 182.175 39.6866 181.499 40.409C180.847 41.1081 180.113 41.8072 179.297 42.5062L172.481 48.4484L185.729 48.4484L185.729 51ZM198.403 51.4194C196.912 51.4194 195.63 51.1398 194.558 50.5806C193.487 49.998 192.601 49.1708 191.902 48.0988C191.203 47.0269 190.69 45.7103 190.364 44.1491C190.038 42.5878 189.875 40.8051 189.875 38.8011C189.875 36.8204 190.038 35.0494 190.364 33.4882C190.69 31.9036 191.203 30.5753 191.902 29.5034C192.601 28.4315 193.487 27.6159 194.558 27.0567C195.63 26.4741 196.912 26.1828 198.403 26.1828C199.895 26.1828 201.176 26.4741 202.248 27.0567C203.32 27.6159 204.206 28.4315 204.905 29.5034C205.604 30.5753 206.116 31.9036 206.443 33.4882C206.769 35.0494 206.932 36.8204 206.932 38.8011C206.932 40.8051 206.769 42.5878 206.443 44.1491C206.116 45.7103 205.604 47.0269 204.905 48.0988C204.206 49.1708 203.32 49.998 202.248 50.5806C201.176 51.1398 199.895 51.4194 198.403 51.4194ZM198.403 48.8678C199.382 48.8678 200.221 48.6814 200.92 48.3086C201.619 47.9124 202.178 47.3648 202.598 46.6657C203.041 45.9667 203.367 45.1278 203.577 44.1491C203.786 43.1471 203.891 42.0285 203.891 40.7935L203.891 36.8088C203.891 35.597 203.786 34.4902 203.577 33.4882C203.367 32.4861 203.041 31.6356 202.598 30.9365C202.178 30.2375 201.619 29.7015 200.92 29.3287C200.221 28.9325 199.382 28.7344 198.403 28.7344C197.425 28.7344 196.586 28.9325 195.887 29.3287C195.188 29.7015 194.617 30.2375 194.174 30.9365C193.755 31.6356 193.44 32.4861 193.23 33.4882C193.02 34.4902 192.916 35.597 192.916 36.8088L192.916 40.7935C192.916 42.0285 193.02 43.1471 193.23 44.1491C193.44 45.1278 193.755 45.9667 194.174 46.6657C194.617 47.3648 195.188 47.9124 195.887 48.3086C196.586 48.6814 197.425 48.8678 198.403 48.8678ZM198.403 40.8634C197.588 40.8634 197.017 40.7003 196.691 40.3741C196.388 40.0478 196.236 39.6517 196.236 39.1856L196.236 38.4166C196.236 37.9506 196.388 37.5544 196.691 37.2282C197.017 36.902 197.588 36.7389 198.403 36.7389C199.219 36.7389 199.778 36.902 200.081 37.2282C200.407 37.5544 200.57 37.9506 200.57 38.4166L200.57 39.1856C200.57 39.6517 200.407 40.0478 200.081 40.3741C199.778 40.7003 199.219 40.8634 198.403 40.8634Z\" fill=\"white\"/>\n<path d=\"M51.9814 28.5721H47.1988C46.6156 25.8892 44.2827 23.9062 41.4832 23.9062C38.6836 23.9062 36.3507 25.8892 35.7675 28.5721H19.3203V30.905H35.7675C36.3507 33.5879 38.6836 35.5709 41.4832 35.5709C44.2827 35.5709 46.6156 33.5879 47.1988 30.905H51.9814V28.5721ZM41.4832 33.238C39.5002 33.238 37.9838 31.7216 37.9838 29.7386C37.9838 27.7556 39.5002 26.2392 41.4832 26.2392C43.4662 26.2392 44.9826 27.7556 44.9826 29.7386C44.9826 31.7216 43.4662 33.238 41.4832 33.238Z\" fill=\"white\"/>\n<path d=\"M19.3203 47.2371H24.1028C24.6861 49.9199 27.019 51.9029 29.8185 51.9029C32.618 51.9029 34.951 49.9199 35.5342 47.2371H51.9814V44.9041H35.5342C34.951 42.2213 32.618 40.2383 29.8185 40.2383C27.019 40.2383 24.6861 42.2213 24.1028 44.9041H19.3203V47.2371ZM29.8185 42.5712C31.8015 42.5712 33.3179 44.0876 33.3179 46.0706C33.3179 48.0536 31.8015 49.57 29.8185 49.57C27.8355 49.57 26.3191 48.0536 26.3191 46.0706C26.3191 44.0876 27.8355 42.5712 29.8185 42.5712Z\" fill=\"white\"/>\n<line x1=\"69.6643\" y1=\"22.6992\" x2=\"69.6643\" y2=\"57.6778\" stroke=\"#545454\" stroke-width=\"1.66447\"/>\n<path d=\"M237.284 23.9062L247.548 33.4395L246.111 34.7742L237.284 26.5756L228.457 34.7742L227.02 33.4395L237.284 23.9062Z\" fill=\"white\"/>\n<path d=\"M237.283 57.7187L227.019 48.1855L228.456 46.8508L237.283 55.0494L246.11 46.8508L247.547 48.1855L237.283 57.7187Z\" fill=\"white\"/>\n<path d=\"M125.589 44.4384C125.587 41.6723 124.786 38.9656 123.281 36.6445L121.785 38.1407C122.919 40.0456 123.518 42.2214 123.518 44.4384H125.589Z\" fill=\"#6F6F6F\"/>\n<path d=\"M123.52 33.4833L122.056 32.0195L113.188 40.8881C112.557 40.5078 111.835 40.305 111.098 40.3012C110.279 40.3012 109.478 40.5441 108.797 40.9991C108.116 41.4541 107.586 42.1008 107.272 42.8574C106.959 43.6141 106.877 44.4466 107.037 45.2499C107.196 46.0531 107.591 46.7909 108.17 47.3701C108.749 47.9492 109.487 48.3435 110.29 48.5033C111.093 48.6631 111.926 48.5811 112.682 48.2677C113.439 47.9543 114.086 47.4235 114.541 46.7426C114.996 46.0616 115.239 45.261 115.239 44.442C115.235 43.7052 115.032 42.983 114.652 42.3519L123.52 33.4833ZM111.098 46.5125C110.688 46.5125 110.288 46.391 109.948 46.1635C109.607 45.936 109.342 45.6127 109.185 45.2344C109.028 44.856 108.987 44.4397 109.067 44.0381C109.147 43.6365 109.344 43.2676 109.634 42.978C109.923 42.6885 110.292 42.4913 110.694 42.4114C111.096 42.3315 111.512 42.3725 111.89 42.5292C112.269 42.6859 112.592 42.9513 112.819 43.2918C113.047 43.6323 113.168 44.0326 113.168 44.442C113.168 44.991 112.949 45.5172 112.561 45.9054C112.173 46.2935 111.647 46.5118 111.098 46.5125Z\" fill=\"#6F6F6F\"/>\n<path d=\"M111.098 32.0158C113.315 32.0168 115.491 32.6156 117.396 33.749L118.901 32.2442C116.713 30.8377 114.187 30.0467 111.588 29.9544C108.989 29.8622 106.413 30.4721 104.132 31.72C101.85 32.9679 99.9469 34.8077 98.6224 37.0458C97.298 39.2839 96.6013 41.8376 96.6055 44.4383H98.6759C98.6797 41.1448 99.9897 37.9872 102.319 35.6584C104.647 33.3295 107.805 32.0195 111.098 32.0158Z\" fill=\"#6F6F6F\"/>\n<rect x=\"301.5\" y=\"8.5\" width=\"59\" height=\"59\" rx=\"4.5\" stroke=\"#6F6F6F\"/>\n<rect x=\"307.5\" y=\"12.5\" width=\"59\" height=\"59\" rx=\"4.5\" fill=\"#161616\" stroke=\"#6F6F6F\"/>\n<path d=\"M335.739 53.2221V43.8578H327.002V40.811H335.739V31.4468H339.144V40.811H347.881V43.8578H339.144V53.2221H335.739Z\" fill=\"white\"/>\n<rect x=\"376.5\" y=\"8.5\" width=\"59\" height=\"59\" rx=\"4.5\" stroke=\"#6F6F6F\"/>\n<rect x=\"382.5\" y=\"12.5\" width=\"59\" height=\"59\" rx=\"4.5\" fill=\"#161616\" stroke=\"#6F6F6F\"/>\n<path d=\"M404.103 45.48V40.3661H419.623V45.48H404.103Z\" fill=\"white\"/>\n</svg>\n";
var icons = {
	"Underneath-icon": "<svg width=\"40\" height=\"25\" viewBox=\"0 0 40 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M40 23.375H0\" stroke=\"white\" stroke-width=\"2.5\"/>\n<path d=\"M13.945 9.34375H16.1712L17 13.455L17.2762 15.795H17.5037L17.845 13.455L18.82 9.34375H21.03L22.0537 13.455L22.395 15.795H22.59L22.8662 13.455L23.76 9.34375H25.84L23.76 17.875H21.2737L20.315 13.715L20.0062 11.4238H19.7787L19.47 13.715L18.5112 17.875H16.025L13.945 9.34375Z\" fill=\"white\"/>\n</svg>",
	clickBoat: clickBoat,
	"mode-icon": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M22.75 3.5H5.25C4.78603 3.50053 4.34122 3.68508 4.01315 4.01315C3.68508 4.34122 3.50053 4.78603 3.5 5.25V22.75C3.50053 23.214 3.68508 23.6588 4.01315 23.9868C4.34122 24.3149 4.78603 24.4995 5.25 24.5H22.75C23.214 24.4995 23.6588 24.3149 23.9868 23.9868C24.3149 23.6588 24.4995 23.214 24.5 22.75V5.25C24.4995 4.78603 24.3149 4.34122 23.9868 4.01315C23.6588 3.68508 23.214 3.50053 22.75 3.5ZM19.25 22.75V19.25H15.75V22.75H12.25V19.25H8.75V15.75H12.25V12.25H8.75V8.75H12.25V5.25H15.75V8.75H19.25V5.25H22.75V22.75H19.25Z\" fill=\"#909090\"/>\n<path d=\"M15.75 8.75H12.25V12.25H15.75V8.75Z\" fill=\"#909090\"/>\n<path d=\"M15.75 15.75H12.25V19.25H15.75V15.75Z\" fill=\"#909090\"/>\n<path d=\"M19.25 12.25H15.75V15.75H19.25V12.25Z\" fill=\"#909090\"/>\n</svg>",
	"back-icon": "<svg width=\"7\" height=\"13\" viewBox=\"0 0 7 13\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.75117e-08 6.5L6.14035 7.3223e-08L7 0.91L1.7193 6.5L7 12.09L6.14035 13L7.75117e-08 6.5Z\" fill=\"white\"/>\n</svg>",
	increase: increase,
	"spacebar-3d": "<svg width=\"267\" height=\"64\" viewBox=\"0 0 267 64\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"0.5\" y=\"0.5\" width=\"259.977\" height=\"59\" rx=\"4.5\" stroke=\"#6F6F6F\"/>\n<rect x=\"6.52344\" y=\"4.5\" width=\"259.977\" height=\"59\" rx=\"4.5\" fill=\"#161616\" stroke=\"#6F6F6F\"/>\n<path d=\"M71.3017 47.4182C69.3269 47.4182 67.6426 47.0465 66.2487 46.303C64.8547 45.5364 63.6699 44.4909 62.6941 43.1667L64.8547 41.3545C65.7143 42.4929 66.6668 43.3641 67.7123 43.9682C68.7577 44.549 69.9891 44.8394 71.4062 44.8394C73.1487 44.8394 74.4729 44.4212 75.379 43.5848C76.3082 42.7485 76.7729 41.6333 76.7729 40.2394C76.7729 39.0778 76.4244 38.1833 75.7274 37.5561C75.0305 36.9288 73.8805 36.4293 72.2774 36.0576L70.2911 35.6045C68.0608 35.0934 66.3532 34.3268 65.1683 33.3045C64.0067 32.2591 63.4259 30.7955 63.4259 28.9136C63.4259 27.8449 63.6234 26.8924 64.0183 26.0561C64.4133 25.2197 64.9593 24.5227 65.6562 23.9652C66.3764 23.4076 67.2244 22.9894 68.2002 22.7106C69.1992 22.4086 70.2911 22.2576 71.4759 22.2576C73.3113 22.2576 74.8795 22.5944 76.1805 23.2682C77.5047 23.9419 78.6199 24.9293 79.5259 26.2303L77.3305 27.8333C76.6567 26.904 75.8436 26.1722 74.8911 25.6379C73.9385 25.1035 72.7537 24.8364 71.3365 24.8364C69.78 24.8364 68.5487 25.1732 67.6426 25.847C66.7598 26.4975 66.3183 27.4848 66.3183 28.8091C66.3183 29.9707 66.6901 30.8535 67.4335 31.4576C68.2002 32.0384 69.3502 32.503 70.8835 32.8515L72.8699 33.3045C75.2628 33.8389 76.9936 34.652 78.0623 35.7439C79.131 36.8359 79.6653 38.2879 79.6653 40.1C79.6653 41.2152 79.4678 42.2258 79.0729 43.1318C78.7012 44.0379 78.1552 44.8045 77.435 45.4318C76.7148 46.0591 75.832 46.547 74.7865 46.8955C73.7643 47.2439 72.6027 47.4182 71.3017 47.4182ZM84.4415 29.0182H87.2293V31.9455H87.3687C87.8334 30.8071 88.5071 29.9707 89.3899 29.4364C90.296 28.8788 91.3763 28.6 92.6309 28.6C93.746 28.6 94.7566 28.8207 95.6627 29.2621C96.5687 29.7035 97.3354 30.3308 97.9627 31.1439C98.6132 31.9571 99.1011 32.9444 99.4263 34.1061C99.7748 35.2677 99.949 36.5687 99.949 38.0091C99.949 39.4495 99.7748 40.7505 99.4263 41.9121C99.1011 43.0737 98.6132 44.0611 97.9627 44.8742C97.3354 45.6874 96.5687 46.3146 95.6627 46.7561C94.7566 47.1975 93.746 47.4182 92.6309 47.4182C90.1915 47.4182 88.4374 46.303 87.3687 44.0727H87.2293V53.9697H84.4415V29.0182ZM91.8642 44.9091C93.444 44.9091 94.6869 44.4212 95.593 43.4455C96.499 42.4465 96.9521 41.1455 96.9521 39.5424V36.4758C96.9521 34.8727 96.499 33.5833 95.593 32.6076C94.6869 31.6086 93.444 31.1091 91.8642 31.1091C91.2369 31.1091 90.6329 31.202 90.0521 31.3879C89.4945 31.5505 89.0066 31.7828 88.5884 32.0848C88.1703 32.3869 87.8334 32.7586 87.5778 33.2C87.3455 33.6182 87.2293 34.0712 87.2293 34.5591V41.25C87.2293 41.8308 87.3455 42.3535 87.5778 42.8182C87.8334 43.2596 88.1703 43.6429 88.5884 43.9682C89.0066 44.2702 89.4945 44.5025 90.0521 44.6652C90.6329 44.8278 91.2369 44.9091 91.8642 44.9091ZM117.724 47C116.679 47 115.924 46.7212 115.459 46.1636C115.018 45.6061 114.739 44.9091 114.623 44.0727H114.449C114.054 45.1879 113.403 46.0242 112.497 46.5818C111.591 47.1394 110.511 47.4182 109.256 47.4182C107.351 47.4182 105.864 46.9303 104.796 45.9545C103.75 44.9788 103.228 43.6545 103.228 41.9818C103.228 40.2859 103.843 38.9848 105.074 38.0788C106.329 37.1727 108.269 36.7197 110.894 36.7197H114.449V34.9424C114.449 33.6646 114.1 32.6889 113.403 32.0152C112.706 31.3414 111.638 31.0045 110.197 31.0045C109.105 31.0045 108.188 31.2485 107.444 31.7364C106.724 32.2242 106.12 32.8747 105.632 33.6879L103.959 32.1197C104.447 31.1439 105.226 30.3192 106.294 29.6455C107.363 28.9485 108.71 28.6 110.337 28.6C112.52 28.6 114.216 29.1343 115.424 30.203C116.633 31.2717 117.237 32.7586 117.237 34.6636V44.5606H119.293V47H117.724ZM109.709 45.0485C110.406 45.0485 111.045 44.9672 111.626 44.8045C112.207 44.6419 112.706 44.4096 113.124 44.1076C113.543 43.8056 113.868 43.4571 114.1 43.0621C114.333 42.6672 114.449 42.2374 114.449 41.7727V38.8106H110.755C109.152 38.8106 107.979 39.0429 107.235 39.5076C106.515 39.9722 106.155 40.646 106.155 41.5288V42.2606C106.155 43.1434 106.468 43.8288 107.096 44.3167C107.746 44.8045 108.617 45.0485 109.709 45.0485ZM129.963 47.4182C128.708 47.4182 127.581 47.1975 126.582 46.7561C125.583 46.3146 124.735 45.6874 124.038 44.8742C123.365 44.0611 122.842 43.0737 122.47 41.9121C122.122 40.7505 121.947 39.4495 121.947 38.0091C121.947 36.5687 122.122 35.2677 122.47 34.1061C122.842 32.9444 123.365 31.9571 124.038 31.1439C124.735 30.3308 125.583 29.7035 126.582 29.2621C127.581 28.8207 128.708 28.6 129.963 28.6C131.751 28.6 133.18 28.9949 134.249 29.7848C135.341 30.5515 136.154 31.5621 136.688 32.8167L134.353 34.0015C134.028 33.0722 133.494 32.352 132.75 31.8409C132.007 31.3298 131.078 31.0742 129.963 31.0742C129.126 31.0742 128.394 31.2136 127.767 31.4924C127.14 31.748 126.617 32.1197 126.199 32.6076C125.781 33.0722 125.467 33.6414 125.258 34.3152C125.049 34.9657 124.944 35.6859 124.944 36.4758V39.5424C124.944 41.1222 125.363 42.4232 126.199 43.4455C127.059 44.4444 128.313 44.9439 129.963 44.9439C132.216 44.9439 133.842 43.8985 134.841 41.8076L136.863 43.1667C136.282 44.4677 135.411 45.5015 134.249 46.2682C133.111 47.0348 131.682 47.4182 129.963 47.4182ZM147.354 47.4182C146.123 47.4182 145.008 47.1975 144.009 46.7561C143.033 46.3146 142.185 45.6874 141.465 44.8742C140.768 44.0379 140.222 43.0505 139.827 41.9121C139.455 40.7505 139.27 39.4495 139.27 38.0091C139.27 36.5919 139.455 35.3025 139.827 34.1409C140.222 32.9793 140.768 31.9919 141.465 31.1788C142.185 30.3424 143.033 29.7035 144.009 29.2621C145.008 28.8207 146.123 28.6 147.354 28.6C148.562 28.6 149.643 28.8207 150.595 29.2621C151.548 29.7035 152.361 30.3192 153.035 31.1091C153.708 31.8758 154.22 32.7934 154.568 33.8621C154.94 34.9308 155.126 36.104 155.126 37.3818V38.7061H142.197V39.5424C142.197 40.3091 142.313 41.0293 142.545 41.703C142.801 42.3535 143.149 42.9227 143.591 43.4106C144.055 43.8985 144.613 44.2818 145.264 44.5606C145.937 44.8394 146.692 44.9788 147.529 44.9788C148.667 44.9788 149.654 44.7116 150.491 44.1773C151.35 43.6429 152.012 42.8763 152.477 41.8773L154.464 43.3061C153.883 44.5374 152.977 45.5364 151.745 46.303C150.514 47.0465 149.05 47.4182 147.354 47.4182ZM147.354 30.9348C146.588 30.9348 145.891 31.0742 145.264 31.353C144.636 31.6086 144.09 31.9803 143.626 32.4682C143.184 32.9561 142.836 33.5369 142.58 34.2106C142.325 34.8611 142.197 35.5813 142.197 36.3712V36.6152H152.129V36.2318C152.129 34.6288 151.687 33.351 150.804 32.3985C149.945 31.4227 148.795 30.9348 147.354 30.9348ZM159.72 21.2121H162.508V31.9455H162.647C163.112 30.8071 163.785 29.9707 164.668 29.4364C165.574 28.8788 166.654 28.6 167.909 28.6C169.024 28.6 170.035 28.8207 170.941 29.2621C171.847 29.7035 172.614 30.3308 173.241 31.1439C173.891 31.9571 174.379 32.9444 174.704 34.1061C175.053 35.2677 175.227 36.5687 175.227 38.0091C175.227 39.4495 175.053 40.7505 174.704 41.9121C174.379 43.0737 173.891 44.0611 173.241 44.8742C172.614 45.6874 171.847 46.3146 170.941 46.7561C170.035 47.1975 169.024 47.4182 167.909 47.4182C165.47 47.4182 163.716 46.303 162.647 44.0727H162.508V47H159.72V21.2121ZM167.142 44.9091C168.722 44.9091 169.965 44.4212 170.871 43.4455C171.777 42.4465 172.23 41.1455 172.23 39.5424V36.4758C172.23 34.8727 171.777 33.5833 170.871 32.6076C169.965 31.6086 168.722 31.1091 167.142 31.1091C166.515 31.1091 165.911 31.202 165.33 31.3879C164.773 31.5505 164.285 31.7828 163.867 32.0848C163.448 32.3869 163.112 32.7586 162.856 33.2C162.624 33.6182 162.508 34.0712 162.508 34.5591V41.25C162.508 41.8308 162.624 42.3535 162.856 42.8182C163.112 43.2596 163.448 43.6429 163.867 43.9682C164.285 44.2702 164.773 44.5025 165.33 44.6652C165.911 44.8278 166.515 44.9091 167.142 44.9091ZM193.003 47C191.957 47 191.202 46.7212 190.738 46.1636C190.296 45.6061 190.017 44.9091 189.901 44.0727H189.727C189.332 45.1879 188.681 46.0242 187.775 46.5818C186.869 47.1394 185.789 47.4182 184.534 47.4182C182.629 47.4182 181.143 46.9303 180.074 45.9545C179.028 44.9788 178.506 43.6545 178.506 41.9818C178.506 40.2859 179.121 38.9848 180.353 38.0788C181.607 37.1727 183.547 36.7197 186.172 36.7197H189.727V34.9424C189.727 33.6646 189.378 32.6889 188.681 32.0152C187.984 31.3414 186.916 31.0045 185.475 31.0045C184.383 31.0045 183.466 31.2485 182.722 31.7364C182.002 32.2242 181.398 32.8747 180.91 33.6879L179.238 32.1197C179.725 31.1439 180.504 30.3192 181.572 29.6455C182.641 28.9485 183.989 28.6 185.615 28.6C187.799 28.6 189.495 29.1343 190.703 30.203C191.911 31.2717 192.515 32.7586 192.515 34.6636V44.5606H194.571V47H193.003ZM184.988 45.0485C185.684 45.0485 186.323 44.9672 186.904 44.8045C187.485 44.6419 187.984 44.4096 188.403 44.1076C188.821 43.8056 189.146 43.4571 189.378 43.0621C189.611 42.6672 189.727 42.2374 189.727 41.7727V38.8106H186.033C184.43 38.8106 183.257 39.0429 182.513 39.5076C181.793 39.9722 181.433 40.646 181.433 41.5288V42.2606C181.433 43.1434 181.747 43.8288 182.374 44.3167C183.024 44.8045 183.896 45.0485 184.988 45.0485ZM198.55 47V29.0182H201.338V32.3288H201.512C201.837 31.4692 202.418 30.7025 203.254 30.0288C204.091 29.355 205.241 29.0182 206.704 29.0182H207.785V31.8061H206.147C204.637 31.8061 203.452 32.0965 202.592 32.6773C201.756 33.2348 201.338 33.9434 201.338 34.803V47H198.55Z\" fill=\"white\"/>\n</svg>\n",
	"speed-icon": "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M22.4979 15.7501C22.4969 13.7461 21.9163 11.7851 20.8261 10.1035L19.7422 11.1875C20.564 12.5675 20.9978 14.1439 20.9979 15.7501L22.4979 15.7501Z\" fill=\"#909090\"/>\n<path d=\"M21 7.8105L19.9394 6.75L13.5143 13.1752C13.057 12.8997 12.5338 12.7528 12 12.75C11.4067 12.75 10.8266 12.9259 10.3333 13.2556C9.83994 13.5852 9.45543 14.0538 9.22836 14.602C9.0013 15.1501 8.94189 15.7533 9.05765 16.3353C9.1734 16.9172 9.45912 17.4518 9.87868 17.8713C10.2982 18.2909 10.8328 18.5766 11.4147 18.6924C11.9967 18.8081 12.5999 18.7487 13.1481 18.5216C13.6962 18.2946 14.1648 17.9101 14.4944 17.4167C14.8241 16.9234 15 16.3433 15 15.75C14.9972 15.2162 14.8503 14.693 14.5748 14.2357L21 7.8105ZM12 17.25C11.7033 17.25 11.4133 17.162 11.1666 16.9972C10.92 16.8324 10.7277 16.5981 10.6142 16.324C10.5007 16.0499 10.4709 15.7483 10.5288 15.4574C10.5867 15.1664 10.7296 14.8991 10.9393 14.6893C11.1491 14.4796 11.4164 14.3367 11.7074 14.2788C11.9983 14.2209 12.2999 14.2506 12.574 14.3642C12.8481 14.4777 13.0824 14.67 13.2472 14.9166C13.412 15.1633 13.5 15.4533 13.5 15.75C13.4995 16.1477 13.3414 16.529 13.0602 16.8102C12.779 17.0914 12.3977 17.2495 12 17.25Z\" fill=\"#909090\"/>\n<path d=\"M12 6.75002C13.6061 6.75077 15.1822 7.18457 16.5625 8.00574L17.6527 6.91554C16.0679 5.89651 14.2378 5.32343 12.3548 5.2566C10.4719 5.18976 8.60573 5.63164 6.95268 6.53575C5.29964 7.43986 3.92082 8.77277 2.96128 10.3943C2.00174 12.0158 1.49695 13.8659 1.50001 15.75L3.00001 15.75C3.00273 13.3639 3.95182 11.0763 5.63906 9.38906C7.32629 7.70182 9.6139 6.75274 12 6.75002Z\" fill=\"#909090\"/>\n</svg>\n",
	decrease: decrease,
	plus: plus,
	"Faded-icon": "<svg width=\"41\" height=\"28\" viewBox=\"0 0 41 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M40.1053 26H0\" stroke=\"white\" stroke-width=\"2.50658\"/>\n<path d=\"M40.1053 2.1875H0\" stroke=\"white\" stroke-width=\"2.50658\"/>\n<path d=\"M13.9656 11.5457H16.026L16.7931 15.3507L17.0487 17.5164H17.2593L17.5751 15.3507L18.4775 11.5457H20.5228L21.4703 15.3507L21.7862 17.5164H21.9666L22.2223 15.3507L23.0495 11.5457H24.9745L23.0495 19.4414H20.7484L19.8611 15.5913L19.5754 13.4707H19.3648L19.0791 15.5913L18.1917 19.4414H15.8907L13.9656 11.5457Z\" fill=\"white\"/>\n</svg>",
	"zoom-in": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M16.593 10.3708H12.4449V6.22266H10.3708V10.3708H6.22266V12.4449H10.3708V16.593H12.4449V12.4449H16.593V10.3708Z\" fill=\"white\" fill-opacity=\"0.6\"/>\n<path d=\"M20.1682 18.6667C21.8791 16.6349 22.8166 14.0636 22.8148 11.4074C22.8148 9.15124 22.1458 6.94573 20.8923 5.0698C19.6389 3.19386 17.8573 1.73174 15.7728 0.868342C13.6884 0.00494269 11.3948 -0.220962 9.18194 0.219195C6.96912 0.659352 4.93651 1.7458 3.34116 3.34116C1.7458 4.93651 0.659352 6.96912 0.219195 9.18194C-0.220962 11.3948 0.00494269 13.6884 0.868342 15.7728C1.73174 17.8573 3.19386 19.6389 5.0698 20.8923C6.94573 22.1458 9.15124 22.8148 11.4074 22.8148C14.0636 22.8166 16.6349 21.8791 18.6667 20.1682L26.5335 28L28 26.5335L20.1682 18.6667ZM11.4074 20.7407C9.56145 20.7407 7.75695 20.1934 6.22209 19.1678C4.68723 18.1422 3.49095 16.6846 2.78454 14.9791C2.07812 13.2737 1.89329 11.3971 2.25342 9.58657C2.61354 7.77608 3.50246 6.11304 4.80775 4.80775C6.11304 3.50246 7.77608 2.61354 9.58657 2.25342C11.3971 1.89329 13.2737 2.07812 14.9791 2.78454C16.6846 3.49095 18.1422 4.68723 19.1678 6.22209C20.1934 7.75695 20.7407 9.56145 20.7407 11.4074C20.738 13.8819 19.7538 16.2543 18.004 18.004C16.2543 19.7538 13.8819 20.738 11.4074 20.7407Z\" fill=\"white\" fill-opacity=\"0.6\"/>\n</svg>\n",
	speedBoat: speedBoat,
	"zoom-out": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M16.593 10.3711H6.22266V12.4452H16.593V10.3711Z\" fill=\"white\" fill-opacity=\"0.6\"/>\n<path d=\"M20.1682 18.6667C21.8791 16.6349 22.8166 14.0636 22.8148 11.4074C22.8148 9.15124 22.1458 6.94573 20.8923 5.0698C19.6389 3.19386 17.8573 1.73174 15.7728 0.868342C13.6884 0.00494269 11.3948 -0.220962 9.18194 0.219195C6.96912 0.659352 4.93651 1.7458 3.34116 3.34116C1.7458 4.93651 0.659352 6.96912 0.219195 9.18194C-0.220962 11.3948 0.00494269 13.6884 0.868342 15.7728C1.73174 17.8573 3.19386 19.6389 5.0698 20.8923C6.94573 22.1458 9.15124 22.8148 11.4074 22.8148C14.0636 22.8166 16.6349 21.8791 18.6667 20.1682L26.5335 28L28 26.5335L20.1682 18.6667ZM11.4074 20.7407C9.56145 20.7407 7.75695 20.1934 6.22209 19.1678C4.68723 18.1422 3.49095 16.6846 2.78454 14.9791C2.07812 13.2737 1.89329 11.3971 2.25342 9.58657C2.61354 7.77608 3.50246 6.11304 4.80775 4.80775C6.11304 3.50246 7.77608 2.61354 9.58657 2.25342C11.3971 1.89329 13.2737 2.07812 14.9791 2.78454C16.6846 3.49095 18.1422 4.68723 19.1678 6.22209C20.1934 7.75695 20.7407 9.56145 20.7407 11.4074C20.738 13.8819 19.7538 16.2543 18.004 18.004C16.2543 19.7538 13.8819 20.738 11.4074 20.7407Z\" fill=\"white\" fill-opacity=\"0.6\"/>\n</svg>\n",
	"HotBox-icon": "<svg width=\"41\" height=\"27\" viewBox=\"0 0 41 27\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<mask id=\"path-1-inside-1\" fill=\"white\">\n<rect y=\"0.6875\" width=\"40.0952\" height=\"26.3125\" rx=\"1.25298\"/>\n</mask>\n<rect y=\"0.6875\" width=\"40.0952\" height=\"26.3125\" rx=\"1.25298\" stroke=\"white\" stroke-width=\"5.0119\" mask=\"url(#path-1-inside-1)\"/>\n<path d=\"M13.9617 11.2273H16.0216L16.7884 15.0314L17.044 17.1965H17.2545L17.5703 15.0314L18.4724 11.2273H20.5173L21.4645 15.0314L21.7803 17.1965H21.9607L22.2163 15.0314L23.0433 11.2273H24.9678L23.0433 19.1211H20.7428L19.8557 15.272L19.57 13.1519H19.3595L19.0738 15.272L18.1867 19.1211H15.8863L13.9617 11.2273Z\" fill=\"white\"/>\n</svg>\n",
	"color-icon": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 22 22\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M19.75 0.5L2.25 0.5C1.78605 0.500579 1.34127 0.685139 1.0132 1.0132C0.685139 1.34127 0.500579 1.78605 0.5 2.25L0.5 19.75C0.500579 20.214 0.685139 20.6587 1.0132 20.9868C1.34127 21.3149 1.78605 21.4994 2.25 21.5L19.75 21.5C20.214 21.4994 20.6587 21.3149 20.9868 20.9868C21.3149 20.6587 21.4994 20.214 21.5 19.75L21.5 2.25C21.4994 1.78605 21.3149 1.34127 20.9868 1.0132C20.6587 0.685139 20.214 0.500579 19.75 0.5ZM2.25 19.75L19.75 2.25L19.75 19.75L2.25 19.75Z\" fill=\"#919191\"/>\n</svg>",
	"exit-icon": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M16 1.4L14.6 0L8 6.6L1.4 0L0 1.4L6.6 8L0 14.6L1.4 16L8 9.4L14.6 16L16 14.6L9.4 8L16 1.4Z\" fill=\"white\"/>\n</svg>\n",
	"fovea-icon": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M26.249 14L19.249 21L18.0117 19.7628L23.7745 14L18.0117 8.23725L19.249 7L26.249 14Z\" fill=\"#909090\"/>\n<path d=\"M14 19.25C13.8851 19.2502 13.7713 19.2276 13.6651 19.1836C13.559 19.1396 13.4625 19.075 13.3814 18.9937L9.00641 14.6187C8.92512 14.5374 8.86064 14.441 8.81664 14.3349C8.77265 14.2287 8.75 14.1149 8.75 14C8.75 13.8851 8.77265 13.7714 8.81664 13.6652C8.86064 13.5591 8.92512 13.4626 9.00641 13.3814L13.3814 9.00641C13.4626 8.92512 13.5591 8.86064 13.6652 8.81664C13.7713 8.77265 13.8851 8.75 14 8.75C14.1149 8.75 14.2287 8.77265 14.3349 8.81664C14.441 8.86064 14.5374 8.92512 14.6187 9.00641L18.9937 13.3814C19.0749 13.4626 19.1394 13.5591 19.1834 13.6652C19.2274 13.7714 19.2501 13.8851 19.2501 14C19.2501 14.1149 19.2274 14.2287 19.1834 14.3349C19.1394 14.441 19.0749 14.5374 18.9937 14.6187L14.6187 18.9937C14.5375 19.075 14.4411 19.1396 14.3349 19.1836C14.2288 19.2276 14.115 19.2502 14 19.25ZM10.8624 14L14 17.1377L17.1377 14L14 10.8624L10.8624 14Z\" fill=\"#909090\"/>\n<path d=\"M1.75 14L8.75 7L9.98725 8.23725L4.2245 14L9.98725 19.7628L8.75 21L1.75 14Z\" fill=\"#909090\"/>\n</svg>",
	"settings-icon-white": "<svg width=\"28\" height=\"24\" viewBox=\"0 0 28 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M27.0474 3.86392H23.0869C22.6039 1.64217 20.672 0 18.3536 0C16.0353 0 14.1033 1.64217 13.6203 3.86392H0V5.79588H13.6203C14.1033 8.01763 16.0353 9.65979 18.3536 9.65979C20.672 9.65979 22.6039 8.01763 23.0869 5.79588H27.0474V3.86392ZM18.3536 7.72784C16.7114 7.72784 15.4557 6.47206 15.4557 4.8299C15.4557 3.18773 16.7114 1.93196 18.3536 1.93196C19.9958 1.93196 21.2516 3.18773 21.2516 4.8299C21.2516 6.47206 19.9958 7.72784 18.3536 7.72784Z\" fill=\"white\"/>\n<path d=\"M0 19.3193H3.96052C4.44351 21.5411 6.37547 23.1832 8.69382 23.1832C11.0122 23.1832 12.9441 21.5411 13.4271 19.3193H27.0474V17.3874H13.4271C12.9441 15.1656 11.0122 13.5234 8.69382 13.5234C6.37547 13.5234 4.44351 15.1656 3.96052 17.3874H0V19.3193ZM8.69382 15.4554C10.336 15.4554 11.5918 16.7112 11.5918 18.3533C11.5918 19.9955 10.336 21.2513 8.69382 21.2513C7.05165 21.2513 5.79588 19.9955 5.79588 18.3533C5.79588 16.7112 7.05165 15.4554 8.69382 15.4554Z\" fill=\"white\"/>\n</svg>\n"
};

function activate(self, key){
  self.find(key).addClass('active')
                .removeClass('inactive');
}

function deactivate(self, key){
  self.find(key).removeClass('active')
                .addClass('inactive');
}

function activeSelectTpl(conf){
  select.bind(this)(pragmajs.util.objDiff({
    onOptionCreate: (self, el) => {
      self.contain(el);
      el.addClass('option');
      deactivate(self, el.key);
    }
  }, conf));

  this.addClass('active-select-template')
  .do(function(){
    if (this.value === this._lv) return
    activate(this, this.value);
    if (this._lv) deactivate(this, this._lv);
  });
}

// const activeSelectTpl = (conf={}) => _p()
//   .from(select(util.objDiff({
//     onOptionCreate: (self, el) => {
//       self.contain(el)
//       el.addClass('option')
//       deactivate(self, el.key)
//     }
//   }, conf)))
//   .addClass('active-select-template')
//   .do(function(){
//     if (this.value === this._lv) return
//     activate(this, this.value)
//     if (this._lv) deactivate(this, this._lv)
//   })

function lectorSettings(lector){


  // let icons = new IconBuilder()
  // icons.default.fill = "white"

  //const tippyOption = {
                        //theme: 'lector-settings',
                        //arrow: false,
                        //hideOnClick: false
                      //}
  //
  // let foveaComp = Slider.value("markerfovea", 1, 10)
  //     .bind(">", (comp) => { comp.value+=1 }, 'keyup')
  //     .bind("<", (comp) => { comp.value-=1 }, 'keyup')
  //     .html.class("slider")

  const actions = {
    changeColor(hex=this.value){
      modeComp.update(hex);
      foveaComp.update(hex);
      pragmajs._e('body').findAll('[data-lector-marker-color]').forEach(e => {
        e.css(`${e.getData("lectorMarkerColor")} ${hex}`);
      });
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
      pragmajs._e('body').findAll('[data-lector-marker-mode]').forEach(e => {
        mode_ify(e, mode, lector.mark._color);
        // e.css(`${e.getData("lectorMarkerColor")} ${hex}`)
      });
    },

    changePage(page=this.value){
      if (lector.paginator) lector.paginator.goTo(page); 
    },

    changeScale(scale=this.value){
      if (lector.scaler) lector.scaler.scaleTo(scale);
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

           
  function popUpEditor(){
    this.setPopupEditor = function(popup){
      this._popupEditor = popup;
      this._popupEditor.addClass(`displayN`);
      return this
    };

    this.element.listenTo('click', click =>{
      this._popped = click;
      this._popupEditor.removeClass(`displayN`);
    });

    this.element.onRender(() => {
      let self = this;
      document.addEventListener('click', function _onClick(click){
        //console.log(click, self._popped)
        if (self._popped === click){
          // if click event was used to pop the menu, skip
          return null
        }
        if (!isClickWithin(click, self._popupEditor)){
          self._popupEditor.addClass(`displayN`);      
        }
      });
    });
  }


  let modeIcon = pragmajs._p().as(pragmajs._e(icons['mode-icon']))
                  .addClass(`setting-icon`);

  pragmajs._p('monitor')
                    .as(pragmajs._e('div.'))
                    .addClass('mode-indicator')
                    .setData({ 'lectorMarkerMode': 'true' });


  let setMode = pragmajs._p('!mode')
                  .run(function(){
                    activeSelectTpl.bind(this)({
                    options: modes,
                    optionTemplate: option => pragmajs._p(option)
                        .addClass(`modeOption`)
                        .listenTo('click', function(){
                          this.parent.value = this.key;
                        })
                        .run(function(){
                          this._miniPointer = pragmajs._e('div.mini-pointer#');
                          this.append(this._miniPointer);
                          this.update = function(bg){
                            mode_ify(this._miniPointer, option, bg);
                            this._miniPointer.css('mix-blend-mode normal');  
                          };
                        })
                  });
                })
                  .run(function(){
                    this.update = bg => {
                      //console.log('my options', this.getOptions())
                      this.getOptions().forEach(option => option.update(bg));
                      //console.log(this.children)
                    };
                  })
                  // .run(lecLabel)
                  // .setLabelName('Pointer mode')
                  .addClass('selector-mode')
                  .do(actions.changeMode);

  let modeComp = pragmajs._p().contain(modeIcon, setMode)
                    .addClass(`setting`)
                    .css(`position relative`)
                    .run(function() {
                      this.update = setMode.update;
                    });

  let foveaIcon = pragmajs._p().as(pragmajs._e(icons['fovea-icon']))
                  .addClass(`setting-icon`);
  pragmajs._p('monitor')
                    .as(pragmajs._e('div.'))
                    .addClass(`color-indicator`)
                    .setData({ 'lectorMarkerColor': 'background' });                

  let setFovea = pragmajs._p("!fovea")
                .addClass( 'selector-fovea' )
                .run(slider) // label
                .setRange(2, 10)
                .setValue(5)
                .css(``)
                .do(actions.changeFovea)
                .run(function(){
                  this.update = (bg) => {
                    this._bar.css(``);
                  };
                });
          
  let foveaComp = pragmajs._p().contain(foveaIcon, setFovea)
                .addClass(`setting`)
                .css(`position relative`)
                .run(function () {
                  this.update = setFovea.update;
                });


    
  let setColor = pragmajs._p('!color')
                  .run(
                    function(){
                      activeSelectTpl.bind(this)({
                      options: colors,
                      optionTemplate: option => {
                        return pragmajs._p(option)
                                .css(`background-color ${option} `)
                                .addClass(`color-option`)
                                .listenTo('click', function(){
                                  this.parent.value = this.key;
                                })
                      }
                    });
                  })
                  .addClass(`selector`)
                  
                  //.run(lecLabel)
                  //.setLabelName('Pointer Color')
                  //.setLabelTemplate(v => colorsHumanFriendly[v])
                  .do(actions.changeColor);




  let colorIcon = pragmajs._p()
                  .as(pragmajs._e(icons['color-icon']))
                  .css('width 25px; height 25px;')
                  .addClass(`setting-icon`);

  pragmajs._p('monitor')
                    .as(pragmajs._e('div.'))
                    .addClass(`color-indicator`)
                    .setData({ 'lectorMarkerColor': 'background' });

  let colorsComp = pragmajs._p().contain(colorIcon, setColor)
                  .addClass(`setting`)
                  .css(`position relative`);

                  // .run(popUpEditor)
                  //   .setPopupEditor(setColor)

  
  
  let popUpSettings = pragmajs._p("popupsettings")
                    .contain(
                      //fontComp.setId('font'), 
                      colorsComp.setId('color'), 
                      modeComp.setId('mode'),
                      foveaComp.setId('fovea'),)
                    .addClass('pop-up-settings')
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



  // let fontIcon = _p().as(_e(icons['fovea-icon']))

  // let fontMonitor = _p('monitor')
  //                   .addClass('font-indicator')

  // let setFont = _p('!font')
  //                 .run(function(){
  //                   console.log(this.key)
  //                 })
  //                 .from(activeSelectTpl({
  //                   options: fonts,
  //                   optionTemplate: option => _p(option)
  //                             .html("Aa")
  //                             .css(`font-family ${option}`)
  //                             .on('click').do(function(){
  //                               this.parent.value = this.key
  //                             })
  //                 }))
  //                 .css(`flex-direction row`)
  //                 .addClass('section', `selector`)
  //                 .do(actions.changeFont)
                
  // let fontComp = _p()
  //                 .contain(fontIcon, fontMonitor, setFont)
  //                 .run(popUpEditor)
  //                   .setPopupEditor(setFont)
  
  let wpmIcon = pragmajs._p().as(pragmajs._e(icons['speed-icon']))
                .css('width 25px; height 25px;')
                .addClass(`setting-icon`);

  let wpmIncreaseIcon = pragmajs._p().as(pragmajs._e(icons['increase']))
                      .addClass(`setting-wpm-adjusticon`)
                      .listenTo('click', _ => {
                        setWpm.value += 10;
                      });

  let wpmDecreaseIcon = pragmajs._p().as(pragmajs._e(icons[`decrease`]))
                        .addClass(`setting-wpm-adjusticon`)
                        .listenTo('click', _ => {
                          setWpm.value -= 10;
                        });

  let wpmAdjust = pragmajs._p('wpmAdjustPragma').contain(wpmIncreaseIcon,wpmDecreaseIcon)
                  .addClass(`speed-adjust`);

  let setWpm = pragmajs._p("!wpm")
                  .run(input, withLabel)
                  .addClass('settings-input')
                  .setInputAttrs({
                    maxlength: 4,
                    size: 4
                  })
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setId('wpm')
                  .setRange(40, 4200)
                  .setValue(250)
                  .bind(shc.wpmPlus, function(){ this.value+=10; })
                  .bind(shc.wpmMinus, function(){ this.value-=10; })
                  .do(actions.changeWpm);
    
  let wpmComp = pragmajs._p().contain(wpmIcon, setWpm, wpmAdjust)
                .addClass(`setting-wpm`)
                .run(function () {
                  this.update = setWpm.update;
                });


  let settingsIcon = pragmajs._p().as(pragmajs._e(icons['settings-icon-white']))
                    .addClass(`settings-bar-icon`)
                    .run(popUpEditor)
                    .setPopupEditor(popUpSettings);

                    


  let settingsBarComp = pragmajs._p().contain(settingsIcon, wpmComp)
                        .addClass(`settings-bar`);
                        
  
  let pageComp = pragmajs._p("!page")
                  .run(input, withLabel)
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
                  // .do(actions.changePage
                  .run(function(){
                    this.onUserInput(val => {
                      // console.log(val)
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

  let scaleComp = pragmajs._p("!scale")
                  .run(input, withLabel)
                  .setInputAttrs({
                    maxlength: 3,
                    size: 4
                  })
                  .addClass('settings-input', 'section')
                  .setValueSanitizer(
                    v => parseInt(v)
                  )
                  .setLabel('scale')
                  .run(function(){
                    this.createEvent('userEdit');

                    this.createWire('scale')
                        .setScaleRange(40, 200)
                        .setScale(100);
                    

                    this.editScale = function(val){
                      this.setScale(val);
                    };
                    
                    this.on('scaleChange', (v) => {
                      this.value = this.scale;
                      this.triggerEvent('userEdit');
                    });
                    
                    //this.editValue = function(val){
                      //console.log('editing value')
                      //this.value = val
                      //if (this.value != this._lv) 
                    //}

                    this.on('userEdit', actions.changeScale);
                  })
                  // .do(actions.changePage
                  .run(function(){
                     this.onUserInput(val => {
                       //console.log(val)
                       this.editScale(val);
                     });
                  })
                  .setValue(100)
                  .bind(shc.scaleUp, function(){
                    this.editScale(this.value+5);
                    return false
                  })
                  .bind(shc.scaleDown, function(){
                    this.editScale(this.value-5);
                    return false
                  });                  

                    
  let miniSettings = pragmajs._p('mini-settings')
    .addClass('lector-mini-settings')
    .contain(scaleComp, pageComp)
    .pragmatize();
  
  
// 
// pageComp
  settings.contain(popUpSettings, settingsBarComp);
  settings.adopt(miniSettings);
  
  const listenTo_ = p => p.key && p.key.indexOf('!') === 0;

   let fader = pragmajs._p('fader')
     .run(idler, function(){
       this.elements = [];
       this.include =function(){
         this.elements = this.elements.concat(Array.from(arguments));
         return this
       };
     })
     .setIdleTime(3000) // TODO CHANGE BACK TO 3000
     .include(settings, miniSettings)
     .onIdle(function(){
       this.elements.forEach(element => {
         element.css('opacity 0');
       });
       // this.css('opacity 0')
     })
     .onActive(function(){
       this.elements.forEach(element => element.css('opacity 1'));
     });
  
   settings.fader = fader;

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

  //setTimeout(() => {
    //// simulate websocket event
    settings.set({
      // 'color': colors[1],
      'font': fonts[1],
      // 'mode': modes[2],
      'fovea': 4,
      // 'wpm': 420
    });
   
  //}, 1200)
  
  return settings.pragmatize()
}

//let testPragma = _p()
                  //.createWire("yoing")
                  //.on('yoingChange', function(v){
                    //settings.update(this.key, v)
                  //})

class Settings extends pragmajs.Pragma {
  constructor(){
    super();
    this.init();
  }

  init() {
    this.settingsMap = new Map();
    this.pragmaMap = new Map();

    this.createEvents("update", 'load');
  }


  _set(key, value){
    if (value !== this.settingsMap.get(key)) return this.settingsMap.set(key, value)
    return false 
  }

  create(pragma, wireName){
    const settingName=wireName;
    const event = pragma._events.get(`${wireName}Change`); 
    this.pragmaMap.set(wireName, pragma);

    if (!event){
      let ogValue = pragma[wireName];
      // Object.defineProperty(pragma, wireName, { writable: true })
      pragma.createWire(wireName);
      pragma[wireName] = ogValue;
    }

    this.adopt(pragma);
    pragma.on(`${wireName}Change`, value => {
      this.update(settingName, value, pragma);
    });
  }

  update(hash, value, pragma){

    if (value) {
      hash = { [hash]: value };
    }

    for (let [setting, value] of Object.entries(hash)){
      if (!pragma){
        console.log(setting);
        this.pragmaMap.get(setting)[`set${setting.capitalize()}`](value);
      }
      if (this._set(setting, value)){
        this.triggerEvent("update", setting, value, pragma);
      } 
    }   
  }
  
  get(...keys){
    if (keys.length==0) keys = Array.from(this.pragmaMap.keys());
    return keys.reduce((prev, key) => {

      if (typeof prev === "string"){
        prev = { [prev]: this.settingsMap.get(prev) };
      } else {
        prev[key] = this.settingsMap.get(key);
      }

      return prev
    })
  }

  toObj(){
    let obj = new Map();
    for (let [key, value] of this.pragmaMap) {
      obj.set(key, value[key]);
    }
    return obj
  }

  toJSON(){
    return JSON.stringify(this.toObj())
  }
}

let editor = setting => 
    pragmajs._e(`
    <div id='${setting.key}-editor' class='editor collapsable' data-setting-target='editor'>
        <div data-setting-target='back'> 
            <div class="back-icon">${icons['back-icon']}</div> 
            <div class="back-copy">${setting.displayName || setting.getData('setting')} </div>
        </div>

        <div class='editor-content' data-editor-target='content'>
        </div>
    </div>
    `.trim());

class SettingEditor extends pragmajs.Pragma {
    constructor(){
        super();
        this.init(...arguments);
    }

    init(setting){
        this.setting = setting;
        this.as(editor(setting))
            .appendTo(setting.element);
        
        this.createEvents('hide');
        this.createWire('content');
        
        this.on('contentChange', content => {
            // editorContent.html(content)
            this._setContent(content);
        });
        
       
        // this.element.hide()
        
        this.editorContent = this.element.find('[data-editor-target="content"]');
        this.element.findAll(`[data-setting-target='back']`)
                    .forEach(e => e.listenTo("mousedown", () => {
                                    this.triggerEvent("hide");
                                })
                            );

        this.on('hide', () => {
            setting.close();
            this._collapse();
        });
        
        this._collapse();
        // this.triggerEvent('hide')
        return this
    }
    _collapse(){
        collapse(this.element);
        setTimeout(() => {
            this.element.hide();
        }, 100);
    }

    _setContent(html, ...elements){
        if (typeof html === 'string'){
            this.editorContent.html(html);
        } else if (html instanceof pragmajs.Pragma){
            this.editorContent.append(html, ...elements);
            // elements.forEach(element => editorContent.append(element))

            this.triggerEvent('contentChange');
        }
    }
}

let displayElement$1 = (key) => {
    return pragmajs._e(`div#${key}-display.display`, 0).setData({'settingTarget': 'display', 'pragmaTarget': `${key} monitor`})
};

let sectionElement$1 = ({
    key,
    title,
    htmlTemp = (key, title) => `<div class='title' id='${key}-title'>${title}</div>`
}) =>
    pragmajs._e(`div.section#${key}-section`)
        .html(htmlTemp(key, title))
        .append(displayElement$1(key));

let inlineSettingTemplate = (pragma, key) =>
    pragmajs._e(`div.setting.inline#${key}`)
        .setData({ 'setting': key })
        .append(sectionElement$1({
            key: key,
            title: pragma.displayName
        }));



class SettingInline extends pragmajs.Pragma {
    constructor() {
        super();
        this.init(...arguments);
    }

   
    init(parent, key, {
        displayName,
        displayTemplate= (el, val) => el.html(val),
        settingTemplate,
    }={}) {
        console.log('creating new inline setting', key, settingTemplate);
        parent.adopt(this);
        parent.create(this, key);

        this._displayTemplate = displayTemplate;
        this.displayName = displayName || key;

        this
            .createEvents('input')
            .on('input', function (input) {
                this.updateDisplay(input);
            })
            .on(`${key}Change`, (v, lv) => {
                if (v !== lv) {
                    this.triggerEvent('input', v, lv);
                    // console.log('color changed to', v)
                    // this.element.find('.display').html(`${v}`)
                }

            });

        this.as((settingTemplate || inlineSettingTemplate)(this, key));
    }

    updateDisplay(val){
        pragmaSpace.onDocLoad(() => {
            let el = this.element.findAll("[data-setting-target='display']");
            el.forEach(el => this._displayTemplate(el, val));
        });
    }
}

// .append(editorElement(title))

// const htmlTemplate = `
// <div class='settings'>
//     <div class='setting'>
//     </div>
// </div>

// `.trim()
// 
    // 

let displayElement = (key) => {
    return pragmajs._e(`div#${key}-display.display`, 0).setData({ 'settingTarget': 'display' })
};

//let sectionElement = (title, htmlTemp = v => `<div class='title' id='${key}-title'>${}</div>`) =>
//_e(`div.collapsed-section.collapsable#${title}-section`)
//.html(htmlTemp(title))
//.append(displayElement(title))

let sectionElement = ({
    key,
    title,
    htmlTemp = (key, title) => `<div class='title' id='${key}-title'>${title}</div>`
}) =>
    pragmajs._e(`div.collapsed-section.collapsable#${key}-section`)
        .html(htmlTemp(key, title))
        .append(displayElement(key));

let _settingTemplate = (pragma, key) =>
    pragmajs._e(`div.setting.collapsable#${key}`)
        .setData({ 'setting': key })
        .append(sectionElement({
            key: key,
            title: pragma.displayName
        }));


class Setting extends SettingInline {

    init(parent, key, {
        displayName= key,
        settingTemplate= _settingTemplate,
        displayTemplate
    }) {
        super.init(parent, key, {
            displayName, settingTemplate, displayTemplate
        });

        console.log('im the child setting and i was run');
        // super.init(...arguments)

         this.element.find('.collapsed-section').listenTo("mousedown", () => {
             console.log('opening');
             this.open();
         });
        
        // this.element.removeClass('inline')
        
        this.editor = new SettingEditor(this);
    }


    open() {
        const jumpAhead = 10;

        this.parent.element.findAll(".setting.collapsable").forEach(section => {
            if (section !== this.element) collapse(section); 
        });
        
        this.element.findAll('.collapsed-section').forEach(section => {
            console.log(section);
            // section.css('opacity 0')
            collapse(section);
        });


        setTimeout(() => {
            this.addClass('expanded');
            this._ogHeight = this.height;

            this.editor.element.show();
            this.css(`height ${this.editor.element.scrollHeight}px`);
            expand(this.editor);
        }, jumpAhead);

    }

    close() {
        this.parent.element.findAll(".setting.collapsable").forEach(section => {
            if (section !== this.element){
                // expand(section)
                expand(section);
            }
        });

        this.element.findAll('.collapsed-section').forEach(section => {
            expand(section);
        });

        this.removeClass('expanded');
        this.element.style.height = null;
    }

    
}

let optionDefaultWrapper = (content, pragma) => pragmajs._p(`
        <div class="option" data-editor-option=${pragma.getData('option')}>
        </div>
    `.trim()).run(function(){
        if (typeof content === 'string') return this.element.html(content)
        this.append(content);
    }).element;

let optionDefaultContent = (pragma) => pragma.key.toString();

let makeOptionElement = function(content, wrapper){
    this.as(pragmajs._e(wrapper(content, this))).setId(pragmajs.util.rk5()).addClass('option');
    this.setData({'option': this.option});
    return this
};

class Option extends pragmajs.Pragma {
    constructor(){
        super();
        this.createWire('optionTemplate');
        this.init(...arguments);
        
    }
    
    static fromTemplate (template, option){
        let content = typeof template === 'function' ? template : optionDefaultContent;
        let wrapper = optionDefaultWrapper;
        if (typeof template === `object`){
            content = template.contentTemplate || optionDefaultTemplate;
            wrapper = template.wrapperTemplate || optionDefaultWrapper;
        }
        

        return new Option(option, content, wrapper).setKey(option)
    }

    init(option, contentTemplate, wrapperTemplate){
        this.option = option;
        this._contentTemplate = contentTemplate;
        this._wrapperTemplate = wrapperTemplate;

        this.render(); 
    }

    render(){
        return this.run(function(){
            makeOptionElement.bind(this)(this._contentTemplate(this), this._wrapperTemplate);
        }) 
    }
}

class SettingList extends Setting {
    init(settings, setting, conf={}) {
        super.init(settings, setting, conf);

        //conf = util.objDiff(conf, {
            // contentTemplate: optionDefaultContent,    
            // wrapperTemplate: optionDefaultWrapper,    
        // })

        let options = conf.options ? conf.options : conf;

        console.log("configureee", conf);
        if (typeof options === 'object'){
            let newOptions = [];
            for (let [option, description] of Object.entries(options)){
                newOptions.push(Option.fromTemplate(conf, option)
                                            .setData({ "description": description })
                                            .render());
            }
            options = newOptions;
        } else {
            options = options.map(x => Option.fromTemplate(conf, x));
        }
        this.adopt(...options);
        
        this.createEvent('select');
        this.createWire('currentOption');
        
        this.on('input', value => {
            let pragma = this.find(value);
            if (!pragma) return pragmajs.util.throwSoft(`couldnt find option for ${value}`)
            this.currentOption = pragma;
        });

        this.on('currentOptionChange', (option, lastOption) => {
            if (!lastOption || option.key != lastOption.key){
                this.triggerEvent("select", option, lastOption);
            }
        });
        
        this.on('select', option => {
            this.parent.update(this.getData('setting'), option.getData('option'));
        });
        

        options.forEach(option => option.listenTo('mousedown', () => this.setCurrentOption(option)));

        this.editor._setContent(...options);

    }    
}

const edibleDisplayTemplate = (pragma) => pragmajs._e('input')
                                    .attr('type', 'text')
                                    
                                    .setData({settingTarget: 'display'})
                                    .addClass('edible-display');


class EdibleDisplay extends pragmajs.Pragma {
    constructor(pragma, wire, {
        valueSanitizer= v=>v,
        monitorTemplate= v=>v,
        size=4
    }={}){
        super();
        this._size = size;
        this._monitorTemplate = monitorTemplate;
        console.log('new edible display', pragma, wire);

        this.createWire('val');
        
        this.on('valChange', (v, lv) => {
            if (v != lv){
                console.log('value changed to', v);
                pragma[wire] = v;
            }
            
            this.updateFront(pragma[wire]);
        });

        this.as(edibleDisplayTemplate());
        this.adopt(this.element);

        console.log('input event', pragma._events);

        this.element.listenTo('focus', function () {
            this.value = "";
            this.parent._listenToEsc = document.addEventListener('keydown', k => {
                if (k.key === 'Enter') {
                    this.blur();
                }
            });
        });

        this.element.listenTo('focusout', function () {
            this.parent.setVal(valueSanitizer(this.value));
            document.removeEventListener('keydown', this.parent._listenToEsc);
        });
        
        this._setSize(size);
    }

    updateFront(val) {
        this.element.value = this._monitorTemplate(val);
        this.element.placeholder = val;
    }


    _setSize(size){
        this.element
            .attr('maxlength', size)
            .attr('size', size);

        return this
    }
}

// new EdibleDisplay(this, )

class SettingInt extends SettingInline {
    init(settings, setting, {
        displayName,
        settingTemplate,
        monitorTemplate,
        valueSanitizer= v => parseInt(v),
        size=4,
        plusElement,
        minusElement,
        step=1
    } = {}) {

        if (settingTemplate) this._content = settingTemplate;

        this._monitorTemplate = monitorTemplate;
        this._valueSanitizer = valueSanitizer;
        this._size = size;


//  valueSanitizer, monitorTemplate,
        // this.createWire('setting')
        super.init(settings, setting, { displayName,
            settingTemplate: (pragma, wire) => this._content(wire),
        } );
        // this.editor._setContent(defaultContent(this)) // this.editor._setContent(conf.contentTemplate)

        this.on('input', (value) => {
            this.setData({'value': value});
            this.parent.update(this.getData('setting'), value, this);
        });
        
        // console.log(this.element.findAll(`[data-setting-target='display']`))
        this.element.setId(setting)
                    .addClass('setting', 'setting-int', 'section');

        if (plusElement){
            if (!this.arrows) this.arrows = pragmajs._e("div.arrows").appendTo(this.element);
            let _plus = pragmajs._e(typeof plusElement === 'function' ? plusElement(this) : plusElement)
                    .listenTo('mousedown', () => {
                        this[setting] += step || 1;
                    });
            this.arrows.append(_plus);
        }

        if (minusElement){
            if (!this.arrows) this.arrows = pragmajs._e("div.arrows").appendTo(this.element);
            let _minus = pragmajs._e(typeof minusElement === 'function' ? minusElement(this) : minusElement)
                    .listenTo('mousedown', () => {
                        this[setting] -= step || 1;
                    });
            this.arrows.append(_minus);
        }
    }    

    _content(wire){
        this._edible = new EdibleDisplay(this, wire, {
            valueSanitizer: this._valueSanitizer,
            monitorTemplate: this._monitorTemplate,
            size: this._size
        });
        return pragmajs._p().append(
                        pragmajs._e(`div.section#${wire}-section`)
                            .append(pragmajs._e(`div#title.`, this.displayName || wire))
                            .append(this._edible)
                        )

    }

    updateDisplay(val){
        pragmaSpace.onDocLoad(() => {
            this._edible.updateFront(val);
        });
    }
}

pragmajs.util.addStyles(css.slider); // add styles for the slider

let defaultContent = (pragma) => `
    <div data-setting-target='display'>
        8
    </div>
    <div data-setting-target='slider'> =====|-- </div>
`.trim();




class SettingSlider extends Setting {
    init(settings, setting, conf = {
        contentTemplate: defaultContent,
    }) {

        // this.createWire('setting')

        super.init(...arguments);

        this.slider = pragmajs._p()
                .run(slider) // label
                // .do(actions.changeFovea)
                .run(function(){
                  if (conf.min && conf.max) {
                      this.setRange(conf.min, conf.max);
                  }
                }).do(() => {
                    // when the slider changes value set the current setting
                    // value to the same as the slider
                    this[setting] = this.slider.value;
                });
          
        this.editor._setContent(defaultContent()); // this.editor._setContent(conf.contentTemplate)
        this.editor.element.findAll("[data-setting-target='slider']").forEach(slider => {
            slider.html(" ");
            this.slider.appendTo(slider);
        });

        this.on('input', (value) => {
            console.log('set input', value);
            this.setData({ 'value': value });
            this.parent.update(this.getData('setting'), value, this);
            this.slider.updateTo(value);
        });

        console.log(this.element.findAll(`[data-setting-target='display']`));

    }
}

let settingsComp = pragmajs._e(`div.settings`);


function addSettingsToLector(lector){
  // actions that talk to the lector instance
  const actions = {
    changeColor(hex = this.value) {
      // modeComp.update(hex)
      // foveaComp.update(hex)
      pragmajs._e('body').findAll('[data-lector-marker-color]').forEach(e => {
        e.css(`${e.getData("lectorMarkerColor")} ${hex}`);
      });
      lector.mark.setColor(hex);
    },

    changeFovea(fovea = this.value) {
      lector.mark.setFovea(fovea);
    },

    changeWpm(wpm = this.value) {
      lector.mark.setWpm(wpm);
    },

    changeFont(font = this.value) {
      lector.setFont(font);
    },

    changeMode(mode = this.value) {
      lector.mark.setMode(mode);
      pragmajs._e('body').findAll('[data-lector-marker-mode]').forEach(e => {
        mode_ify(e, mode, lector.mark._color);
        // e.css(`${e.getData("lectorMarkerColor")} ${hex}`)
      });
    },

    changePage(page = this.value) {
      if (lector.paginator) lector.paginator.goTo(page);
    },

    changeScale(scale = this.value) {
      if (lector.scaler) lector.scaler.scaleTo(scale);
    }
  };

  
  lector.settings = new Settings()
                        .as(settingsComp)
                        .appendTo('body')
                        .on('update', function(key, value, pragma) {
                          console.log('syncing', this.toObj());
                        });
  console.log(`[#] added settings to`, lector);
  

  function onNewSelection(optionPragma, lastOptionPragma) {
      optionPragma.addClass('selected');
      if (lastOptionPragma) lastOptionPragma.removeClass('selected');
  }


  

  // color comp

  function createColorBlob(color){
    let colorThingy  = pragmajs._e(`div.color-blob.`)
                  .css(`background-color ${color}`)
                  .setId(`${color}`)
                  .html("   ");

    let blob = pragmajs._e('div#color.')
                .append(colorThingy)
                .html();

    return blob
    
  }

  let colorOptionTemplate = pragma => `
      ${createColorBlob(pragma.getData('option'))} <span> ${pragma.getData('description')} </span>
  `.trim();

  let colorSetting = new SettingList(lector.settings, 'color', { 
    displayName: "Color",
    options: colorsHumanFriendly,
    contentTemplate: colorOptionTemplate,
    displayTemplate: (el, val) => el.html(createColorBlob(val))
  }).on('select', onNewSelection)
    .on('select', (pragma) => {
    console.log('color is ', pragma.option);
    actions.changeColor(pragma.option);
  });

  
  // mode comp

  function createModeIcon(mode, location=""){
    let icon = `${mode}-icon`;

    return `<div class="mode-icon${location ? "-" + location : ''}" id="${mode}">${icons[icon]}</div>`
    

    // let modeThingy = _e('div.mode-icon').setId(`${mode}`).html('W')


    // let pointer = _e(`div#qwer`).append(modeThingy).html()

    // return pointer


  } 

  let modeOptionTemplate = pragma => `
    ${createModeIcon(pragma.getData('option'))} <span> ${pragma.getData('option')} </span>
  `.trim();

  let modeSetting = new SettingList(lector.settings, 'mode', {
    displayName: "Mode",
    options: modesHumanFriendly,
    contentTemplate: modeOptionTemplate,
    displayTemplate: (element, value) => {
      element.html(createModeIcon(value, 'menu'));
    }
  }).on('select', onNewSelection)
    .on('select', function(optionPragma){
        // this.updateDisplay(optionPragma.getData('option'))
        actions.changeMode(optionPragma.getData('option'));
        console.log('MOOOOOOODE');
        console.log(optionPragma.getData('option'));
        //this.setData({mode: optionPragma.getData('option')})

        

      });

  
  // wpm comp
  let wpmSetting = new SettingInt(lector.settings, 'wpm', {
                        displayName: 'Speed',
                        plusElement: icons['increase'],
                        minusElement: icons['decrease'],
                        step: 5
                        // settingTemplate
                      })
                      .run(function(){
                        this.element
                          .find('#title')
                          .html(icons['speed-icon'])
                          .addClass('inline-icon-2');
                      })
                      .setWpmRange(20, 2000)
                      .on('input', (value) => {
                        actions.changeWpm(value);
                      }).bind("+", function(){
                        this.wpm += 5;
                      }).bind("-", function() { 
                        this.wpm -= 5;
                      });


  // fovea comp
  let foveaSetting = new SettingSlider(lector.settings, 'fovea', {
                        displayName: "Fovea",
                        displayTemplate: (el, v) => {
                          el.html(`${v}<span class='meta'>°</span>`);
                        },
                        min: 2, max: 10 
                      })
                      .on('input', (value) => {
                        actions.changeFovea(value);
                      }).bind("]", function(){
                        this.fovea += 5;
                      }).bind('[', function() {
                        this.fovea -= 5;
                      });

  
  let pageSetting = new SettingInt(lector.settings, 'page', {
                        displayName: 'Page'
                     })
                     .run(function(){
                       this.element.find('#title').destroy();
                       this.element.append(pragmajs._e("div#meta.flex.meta").html("/420"));
                     })
                     .on('input', (value) => {
                       console.log('change page to' + value);
                       actions.changePage(value);
                     }).bind("shift+down", function(){
                       this.setPage(this.page+1);
                     }, 'keyup').bind("shift+up", function(){
                       this.setPage(this.page-1);
                     }, 'keyup');

  let pageBar = pragmajs._e('div.bar#page-bar')
                    .append(pageSetting);

  
  
  let zoomSetting = new SettingInt(lector.settings, 'scale', {
                        // increment: (lastValue, step) => lastValue + step,
                        // decrement: (lastValue, step) => lastValue + step,
                        // step: 1,
                        plusElement: icons['zoom-in'],
                        minusElement: icons['zoom-out'],
                        step: 5
                     })
                     .setScaleRange(20, 200)
                     .run(function(){
                      //  this.element.find('#title').destroy()
                       this.element.find('#scale-section').destroy();
                     })
                     .on('input', (value) => {
                       console.log('change zoom to' + value);
                       actions.changeScale(value);
                     }).bind("ctrl+=", function(){
                       this.setScale(this.scale+5);
                     }).bind("ctrl+-", function(){
                       this.setScale(this.scale-5);
                     });

  let zoomBar = pragmajs._e('div.bar#zoom-bar')
                    .append(zoomSetting);
 
  let popupSettings = pragmajs._p("popup")
      .append(colorSetting, modeSetting, foveaSetting);


  let settingsButton = pragmajs._e('div.inline-icon.clickable#settings-icon').html(icons['settings-icon-white']);
  let settingsBar = pragmajs._p("settings-bar")
      .addClass('bar')
      .append(
        settingsButton,
        wpmSetting
      );

  lector.settings.append(popupSettings, settingsBar, pageBar, zoomBar);
  
  
  // popup settings
  popupSettings.createWire('hidden')
              .on('hiddenChange', function(v) {
                console.log('hidden change', v);
                if (v){
                  this.element.hide();
                } else {
                  this.element.show();
                }
              });
  
  popupSettings.setHidden(true);
  document.addEventListener('mousedown', (e) => {
    if (isClickWithin(e, settingsButton)){
      // toggle popupSettings
      return popupSettings.setHidden(!popupSettings.hidden)  
    }

    popupSettings.setHidden(!isClickWithin(e, popupSettings));
  });

  //lector.settings.listenTo('mouseout', () => {
    //popupSettings.element.hide()
  //})

  // when the document is loaded, 
  // update to the default settings, and
  // trigger the settings load event
  //

  lector.on('load', function() {

    let fader = pragmajs._p('fader')
      .run(idler, function () {
        this.elements = [];
        this.include = function () {
          this.elements = this.elements.concat(Array.from(arguments));
          return this
        };
      })
      .setIdleTime(3000)
      .include(lector.settings)
      .onIdle(function () {
        this.elements.forEach(element => {
          element.css('opacity 0');
        });
        // this.css('opacity 0')
      })
      .onActive(function () {
        this.elements.forEach(element => element.css('opacity 1'));
      });

    lector.settings.fader = fader;

    // set range of paginator
    if (lector.paginator){
      let p = lector.paginator;
      pageSetting.setPageRange(p.firstPage, p.lastPage);
      pageSetting._edible._setSize(p.lastPage.toString().length);
      pageSetting.element.find('#meta').html(`/${p.lastPage}`);
      // pageSetting._edible._monitorTemplate = (v) => 
                    // `${v}/${p.lastPage}`

    }

    lector.settings.update({
      color: "#eddd6e",
      mode: "HotBox",
      wpm: 235,
      fovea: 8,
      page: 1,
      scale: 100
    });
  });
}

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  LectorSettings: lectorSettings,
  Settings: Settings,
  addSettingsToLector: addSettingsToLector
});

class popUp extends pragmajs.Pragma{ 

    constructor(){
        super();
        this.background; 
        this.popUp;
        this.popUpContent;
        this.nextBtn;
        this.backBtn;
    }

    render(){
        this.background = pragmajs._e('div.blurred-bg').appendTo('body');

        this.popUp = pragmajs._p('popUpPragma')
                    .as(pragmajs._e('div.popUp'))
                    .appendTo(this.background);
                    

        this.nextBtn = pragmajs._e('div.next-btn')
                      .html(`<div class="next-icon">${icons['back-icon']}</div>`) 
                      .appendTo(this.popUp);

        this.backBtn = pragmajs._e('div.back-btn')
                      .html(`<div class="back-icon">${icons['back-icon']}</div>`) 
                      .appendTo(this.popUp);

        this.popUpContent = pragmajs._e('div.popUpContent').appendTo(this.popUp);

    }



}

class popUpOb extends popUp{
    constructor(){
        super();
        this.render();
        console.log('POPOPOPOPOPOOPOPOOPO');
        this.addContent();
    }


    addContent() {
        let slides = [];
        let spaceBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Press the spacebar to start/stop the pointer</h1>
                        <div class="spacebar-icon">${icons['spacebar-3d']}</div>
                        `)
                        .appendTo(this.popUpContent);
            slides.push(spaceBoat);

        let speedBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Adjust the speed, through the menu or your keyboard</h1>
                        <div class="speed-icon">${icons['speedBoat']}</div>
                        `)
                        .appendTo(this.popUpContent)
                        .addClass('displayN');
            slides.push(speedBoat);

        let clickBoat = _e('div.boat')
                        .html(`
                        <h1 class="boat-title">Place the pointer by clicking on words</h1>
                        <div class="click-icon">${icons['clickBoat']}</div>
                        `)
                        .appendTo(this.popUpContent)
                        .addClass('displayN');
            slides.push(clickBoat);

        this.popUp.adopt(...slides)
                  .value = 0;

        this.nextBtn.listenTo('click',()=>{
            if (this.popUp.value == 2) {
                this.popUp.value = 0;
                this.nextBtn.html(`<div class="exit-icon">${icons['exit-icon']}</div>`)
                            .listenTo('click', ()=>{this.background.toggleClass('displayN'),this.popUp.toggleClass('displayN');});
            } else {this.popUp.value++;}
            this.popUp.children[this.popUp.value].toggleClass('displayN');
            this.popUp.children[this.popUp._lv].toggleClass('displayN');                            
        });        
        
        this.backBtn.listenTo('click', ()=>{
            (this.popUp.value == 0)? this.popUp.value = 2 : this.popUp.value--;
            this.popUp.children[this.popUp.value].toggleClass('displayN');
            this.popUp.children[this.popUp._lv].toggleClass('displayN'); 
        });


    }
}

function addOnboardingToLector(lector){
  new popUpOb();
  lector._popUp;
}


function connectToLectorSettings(lector, wire){
  return new Promise((resolve, reject) => {

      lector.element.onRender(() => {
        if (!lector.settings) return reject('no settings present')
        let setting = lector.settings.pragmaMap.get(wire);
        if (setting) {
          console.log(`@@@@ connected to ${wire} setting @@@@`);
          return resolve(setting)
        } 
        
        reject('could not find setting');
    });
  })
}


// TODO add more default options
const default_options = {
  onboarding: false,
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

  //mark.listenTo('mouseover', function(){
    //console.log(this, 'hover')
  //})

  mark.do(logger, autoScroll);
  return mark
};

//console.log(_e("#div").deepQueryAll.toString())
const Word = (element, i, options={ shallow: false }) => {

  let w = new PragmaWord(i)
          .as(element)
          .setValue(0);


    function unhoverCluster(epicenter) { hoverCluster(epicenter, 'remove'); }
    function hoverCluster(epicenter, action='add'){

      function spreadRight(element, cap=1, iter=0){
        hover(element, iter);
        if (element.isInTheSameLine(1) && cap > iter){
          let next = element.next;
          spreadRight(next, cap, iter+1);
        }
      }

      function spreadLeft(element, cap=1, iter=0){
        if (iter>0) hover(element, iter);
        if (element.isInTheSameLine(-1) && cap > iter){
          let pre = element.pre;
          spreadLeft(pre, cap, iter+1);
        }
      }

      spreadRight(epicenter, 2);
      spreadLeft(epicenter, 2);

      function hover(element, depth){
        element[`${action}Class`](`hover-${depth}`);
      }
    }

    let thisw = w.element.findAll('w');
    if (i && thisw.length === 0) {
      w.addClass('word-element');
      
      w.listenTo("click", function(){
          this.summon();
        })
        .listenTo("mouseover", function() { hoverCluster(this); })
        .listenTo("mouseout", function() { unhoverCluster(this); });
    }

    if (!options.shallow){
      thisw.forEach((el, i) => {
        let ww = Word(el, i, { shallow: true });
        w.add(ww);
      });
    }
    
  return w
};

const Reader = (l, options=default_options) => {
  l = pragmajs._e(l);
  if (options.wfy) wfy(l);
  let w = Word(l);

  let lec = new PragmaLector("lector")
              // .createEvents('load')
              .as(l)
              .setValue(0)
              .connectTo(w);
  
  lec.mark = Mark(lec);
  if (options.settings) addSettingsToLector(lec); 
  if (options.legacySettings) lec.settings = lectorSettings(lec); 
  if (options.onboarding) addOnboardingToLector(lec);
  // if (options.settings) lec.settings = LectorSettings(lec) 


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
  if (options.defaultStyles){
    pragmajs.util.addStyles(css.main);
    pragmajs.util.addStyles(css.settings);
  }

  if (options.fullStyles){
    pragmajs.util.addStyles(css.full);
  }

  if (!_needWrapper(options)){
    let r = Reader(l, options); 
    pragmaSpace.onDocLoad(() => {
      r.triggerEvent('load');
    });
    return r
  }

  pragmajs.util.log("configuration appears to be a bit more complicated");
  
  if (!options.experimental) return console.log('EXPERIMENTAL FEATURES TURNED OFF')
  let lector;

  if (options.stream &&
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
    lector = Reader(pragmajs._e(l).parentElement, options)
                  .adopt(paginator, streamer);

    
    lector.paginator = paginator;

    connectToLectorSettings(lector, 'page').then(settingPragma => {
      lector.paginator.do(function() {
        settingPragma.updateDisplay(this.value);
      });
    }).catch();

    //if (lector.settings){
      //console.log("lector has settings! connecting paginator's value to pagecomp")
      //console.log('settings', lector.settings)
      //let pageSetting = lector.settings.pragmaMap.get('page')
      //if (pageSetting) {
        //lector.paginator.do(function(){
          //pageSetting.updateDisplay(this.value)
        //})
      //}
    //}

    paginator.fill();
    
    // return lector
  }

  
  if (options.scaler){
    // let _scaler = _p().run(_ext.scaler)
    let _scaler = new Scaler(lector.element);
    
    // _scaler.setTarget(lector.element)
    
    // _scaler.scaleUp()
    // _scaler.bind("mod+=", function() { _scaler.scaleUp();  return false;})
    // _scaler.bind("mod+-", function() { _scaler.scaleDown();  return false;})
    
    lector.adopt(_scaler);
    lector.scaler = _scaler;

    connectToLectorSettings(lector, 'scale').then(settingPragma => {
      lector.scaler.on('scaleChange', (v) => {
        console.log(lector.scaler, lector.scaler.currentPromise);
        

        if (lector.scaler.currentPromise){
          anime__default['default']({
            targets: lector.mark.element,
            opacity: 0,
            duration: 40
          });  
          
          lector.scaler.currentPromise.then(() => {
            anime__default['default']({
              targets: lector.mark.element,
              opacity: 1,
              duration: 150,
              easing: 'easeInOutSine'
            });

            lector.resetMark();
          });
        }
        settingPragma.setScale(v);
      });
    });
  }


  
  pragmaSpace.onDocLoad(() => {
    lector.triggerEvent('load');
  });

  return lector
};

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
exports.ui = index;
