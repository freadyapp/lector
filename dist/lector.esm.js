import { Pragma, _e, util, _p, runAsync, _thread } from 'pragmajs';
import anime from 'animejs';
import nlp from 'compromise';
import 'mousetrap';

function elementify(el){
  // pipeline to vanillafy pragma objects to html elements
  if (el instanceof Pragma) el = el.element;
  if (!el.isPragmaElement) el = _e(el);
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
  if (!el) throw util.throwSoft(`couldnt not evaluate if [${el}] is on screen`)
  el = elementify(el);
  return isOnScreen(el, percent*el.rect().height) // is 70% on screen
}

function isOnScreen(el, threshold=100){
  if (!el) throw util.throwSoft(`couldnt not evaluate if [${el}] is on screen`)
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
    anime({
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
    util.createChains(globalThis.lectorSpace, 'scroll');
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
    util.createChains(globalThis.lectorSpace, 'scrollEnd');

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
  let w = nlp(word.text);
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
  desc = _e(desc);
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
  element = _e(element);
  let nodes = element.findAll("*");
  if (nodes.length == 0) return wfyInner(wfyInner(element))
  nodes.forEach(desc => wfyElement(desc));
}

function wfy(element){
  // console.log(`wfying ${JSON.stringify(element)}`)
  element = _e(element);
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
    el = _e(el);
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
    element.css(`
        opacity 1 
    `);


    element.removeClass(`collapsed`);
    element.setData({ 'collapsed': true });
}


function fadeTo(el, value, ms = 500) {
    el = _e(el);
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

class PragmaLector extends Pragma {

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
    util.log("::LECTOR reading", this);
    if (!this.w.hasKids) return console.error('nothing to read')
    this.w.read(true);
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
    this.w.css(`font-family ${font}`);
  }

}

class PragmaWord extends Pragma {

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
    util.throwSoft('could not find lector for');
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
    if (!subW) return util.throwSoft(`Could not find current Word of ${this.key}`)
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

class PragmaMark extends Pragma {
  constructor() {
    super('marker');

    this.element = _e("marker");
    this.appendTo('body');
    this.hide();
    this.css(defaultStyles);

    this.currentlyMarking = null;
    window.addEventListener('resize', () => {
      this.mark(this.last_marked, 0);
    });

    this.runningFor = 0;
    this.pausing = false;
    
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
      this.current_anime = anime({
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
    if (!(word instanceof Pragma)) return new Promise((r) => { console.warn("cannot mark"); r("error"); })
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
    if (!(word instanceof Pragma)) return new Promise((resolve, reject) => { console.warn("cannot guide thru"); reject("error"); })
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

    if (!(word instanceof Pragma)) return this.throw(`Could not calculate marking duration for [${word}] since it does not appear to be a Pragma Object`)
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
  return new Pragma()
        .from(util.createTemplate({
          // make this nicer
          // defaultSet: pageTemplate,
          pageTemplate: pageTemplate,
          firstPage: conf.first,
          lastPage: conf.last,
          fetch: typeof conf.fetch === 'function' ? conf.fetch : _=>{ util.throwSoft('no fetch source specified'); },
          onCreate: typeof conf.onCreate === 'function' ? conf.onCreate : p => util.log('created', p),
          onFetch: conf.onFetch,

          onPageAdd: null,
          onPageRender: null,
          //typeof conf.onPageRender === 'function' ? conf.onPageRender : function(page, i){ util.log('rendered', page, 'active?', page.active) },
          onPageActive: typeof conf.onPageActive === 'function' ? conf.onPageActive: function(page, i){util.log('active', page); },
          onPageInactive: typeof conf.onPageInactive === 'function' ? conf.onPageInactive : function(page, i) { util.log('inactive', page); },
        }))

        .run(function(){

          let _ptemp = _e(this.pageTemplate).hide();
          this.pageTemplate = _ptemp.cloneNode(false);

          this._clonePage = function() {
            let page = _e(this.pageTemplate.cloneNode(false)).show();
            //if (this._lastAddedPage){
              ////page.style.height = this._lastAddedPage.height
              //page.css(`height ${this._lastAddedPage.height}px`)
              //console.log('>>>>>>>>>>>>>>>>>>>>', this._lastAddedPage.height)
            //}
            this.adopt(page);
            page.lec = this.parent;
            util.createEventChains(page, 'fetch');
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
  let inf = _p("infinity paginator")
        .from(
          paginator(pageTemplate, util.objDiff(
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

              let pagesToRender = util.aryDiff(pageRange, pagesRendered);
              let pagesToDelete = util.aryDiff(pagesRendered, pageRange);


              let pagesToRenderAfter = pagesToRender.filter(i => i>this.value);
              let pagesToRenderBefore = util.aryDiff(pagesToRender, pagesToRenderAfter);

              // console.log(">> ALREADY RENDERED", pagesRendered)
               console.log(">> DEL", pagesToDelete);
               //console.log(">> ADD", pagesToRender) 
               console.log(">> ADD AFTER", pagesToRenderAfter);
               console.log(">> ADD BEFORE", pagesToRenderBefore);

              // pararellize?
              runAsync(
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
      return _p(option)
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
  if (!options) return util.throwSoft('need to define options when creating a select template')

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

var full = "@charset \"utf-8\";body{background-color:#161616}";
var slider$1 = "@charset \"utf-8\";.pragma-slider{user-select:none;cursor:grab}.pragma-slider:active{cursor:grabbing}.pragma-slider-bg{width:100%;height:5px;background:#6F6F6F;border-radius:15px}.pragma-slider-bar{height:100%;width:100%;background:#2B6CCE;position:relative;transition:all .05s ease;border-radius:15px}.pragma-slider-thumb{width:5px;height:18px;background:#2b6cce;transition:all .05s ease;position:absolute;right:0;top:50%;bottom:50%;margin:auto}";
var main = "@charset \"utf-8\";@import url(https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300&display=swap);@import url(https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&display=swap);.glass-block,.lector-mini-settings,.glass-block-border{background:rgba(35,35,35,0.55);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:5px;padding:20px 40px;color:whitesmoke}.glass-block-border{border:1px solid rgba(255,255,255,0.18)}.fixed-bottom-box,.lector-mini-settings,.lector-settings{position:fixed;bottom:20px}.lector-settings .pop-up-settings{background-color:#262626;border-radius:5px;left:-10px;transition:all .2s;padding:20px 5px 11px 5px;margin-left:10px;font-family:'Poppins','Inter','Arial Narrow',Arial,sans-serif;width:200px;margin-bottom:10px}.lector-settings .pragma-input-element{display:flex;flex-direction:column;width:fit-content;justify-content:center}.lector-settings .section{margin:20px 0}.lector-settings .section:hover>.pragma-label{opacity:1}.lector-settings .section .pragma-label{opacity:0;transition:all .2s ease;position:absolute;left:25%;margin-top:-55px;font-size:12px;color:whitesmoke}.lector-settings .section .pragma-label .option-title{color:rgba(199,199,199,0.92)}.lector-settings .selector,.lector-settings .selector-fovea,.lector-settings .selector-mode{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center;align-items:center;align-content:stretch;width:fit-content;border-radius:4px;overflow:hidden}.lector-settings .selector-mode{padding:0;color:#262626;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center;align-items:center;align-content:center;left:-7%;top:-70px}.lector-settings .selector-fovea{width:130px;height:45px;left:-9%;top:-70px;z-index:45678;margin-right:9px}.lector-settings .setting,.lector-settings .setting-wpm{width:100%;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-around;align-items:center;align-content:stretch}.lector-settings .setting .setting-icon,.lector-settings .setting-wpm .setting-icon{width:35px;height:35px}.lector-settings .setting-wpm{border-radius:5px;left:-10px;transition:all .2s;margin-left:20px;font-family:'Poppins','Inter','Arial Narrow',Arial,sans-serif;width:125px;position:relative}.lector-settings .setting-wpm .speed-adjust{width:10px}.lector-settings .setting-wpm .speed-adjust .adjusticon{width:10px;height:20px}.lector-settings .setting-wpm::before{content:\"\";position:absolute;height:30px;width:1px;background-color:#6F6F6F;left:-10px}.lector-settings .settings-bar{background-color:#262626;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-around;align-items:center;align-content:stretch;margin-left:10px;padding:5px 0 5px 10px;border-radius:5px;width:200px}.lector-settings .settings-bar-icon{width:25px;height:25px;position:relative;cursor:pointer}.lector-settings .wpm-icon{color:#fff;opacity:65%;font-size:28px;line-height:45px;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.lector-settings .wpm-icon:hover{opacity:100%;transition:all ease .1s}.lector-settings .color-indicator{width:25px;height:25px;background-color:#a8f19a;border-radius:50%}.lector-settings .mode-indicator{mix-blend-mode:normal !important;width:35px;height:25px}.lector-settings .modeOption{width:45px;height:25px;padding:10px 1px;display:flex;align-items:center;justify-content:center;background-color:transparent !important}.lector-settings .modeOption.inactive{background-color:transparent !important;opacity:.5 !important}.lector-settings .modeOption.active{opacity:1 !important}.lector-settings .modeOption.active::before{content:none}.lector-settings .modeOption .mini-pointer{height:70%;width:70%}.lector-settings .color-option{width:22px;height:22px;border-radius:25px;margin:5px 6px}.lector-settings .displayN{display:none}.lector-settings #underneath{margin:0 !important;position:relative}.lector-settings #mode{margin:35px 0;position:relative}.lector-settings #mode::before{width:70%;height:1px;background-color:#6F6F6F;content:\"\";position:absolute;top:-14px}.lector-settings #mode::after{width:70%;height:1px;background-color:#6F6F6F;content:\"\";position:absolute;bottom:-22px}.lector-settings #fovea{height:fit-content}.lector-settings #fovea .pragma-label{margin-top:-25px}.lector-settings #wpm .pragma-label{position:relative;left:0;margin:0;opacity:1;font-size:18px}.lector-mini-settings{right:-10px;padding-right:40px}.lector-mini-settings .section{margin-top:25px;margin-bottom:25px}.settings-input{display:flex;flex-direction:column;align-items:center}.pragma-input-text{font-family:'IBM Plex Mono',monospace;font-size:22px;border-style:none;outline:none;color:whitesmoke;border-radius:2px;background-color:transparent;text-align:center}.pragma-input-text:hover{background:#393939}.active-select-template{display:flex;flex-direction:row;flex-wrap:no wrap;justify-content:space-around;align-items:center;width:100%}.active-select-template .option{user-select:none;cursor:pointer}.active-select-template .active{opacity:1 !important;background-color:gray;position:relative;transform-style:preserve-3d}.active-select-template .active::after{height:32px;top:-6px;left:-10px}.active-select-template .active::before{width:30px;height:30px;top:-4px;border-radius:2px;left:-4px;background-color:#6F6F6F;position:absolute;border-radius:50%;content:\"\";z-index:-1;transform:translateZ(-1px);transition:ease all .2s;-webkit-transition:all 1s;-moz-transition:all 1s;animation:sheen 1s forwards}.active-select-template .inactive{background-color:#1a1a1a}.word-element{cursor:pointer;transition:all .05s ease;border-radius:1px}.word-element.hover-0{background-color:#2b6cce37;outline:2px solid #2b6cce37;border-radius:0}.word-element.hover-1{background-color:rgba(184,184,184,0.249)}.word-element.hover-2{background-color:rgba(184,184,184,0.119)}.word-element.hover-3{background-color:rgba(184,184,184,0.043)}";
var settings = "@charset \"utf-8\";@import url(https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;700&family=IBM+Plex+Sans:wght@300;400;700&display=swap);.settings{font-family:'IBM Plex Sans',sans-serif;border-radius:4px;background-color:#404040;opacity:.98;bottom:10px;left:10px;height:auto;padding:10px;width:200px;color:whitesmoke;position:fixed;display:flex;flex-direction:column;flex-wrap:nowrap;justify-content:flex-start;align-items:stretch;align-content:stretch;transition:all .2s ease;transition:opacity .1s ease;overflow:hidden}.settings [data-setting-target=back]{cursor:pointer;height:24px;display:flex;align-items:center;margin-bottom:27px}.settings [data-setting-target=back]::after{content:'';height:2px;width:120%;background-color:#6f6f66;position:absolute;top:40px;left:0}.settings [data-setting-target=back] .back-icon{margin-right:10px}.settings [data-setting-target=back] .back-copy{margin-bottom:5px}.collapsable,.setting{overflow:hidden;transition:all .3s ease;height:auto;flex:1}.collapsable.collapsed,.collapsed.setting{flex:0}.setting{display:flex;flex-direction:column;justify-content:flex-start;height:30px}.setting.expanded{height:200px}.setting.collapsed{height:0;flex:0}.setting .collapsed-section{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-between;align-items:center;align-content:stretch;cursor:pointer}.setting .editor-content .option{display:flex;margin:15px 0;cursor:pointer;opacity:70%}.setting .editor-content .option.selected{opacity:100%}.setting .color-blob{width:22px;height:22px;border-radius:30px;margin-right:10px}.setting .color-blob.selected{border:10px solid red}";
var css = {
	full: full,
	slider: slider$1,
	main: main,
	settings: settings
};

util.addStyles(css.slider);
  
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
                util.createChains(this, 'userInput');
            // },
            // makeInput () {
                this.input = _e(`<input type='text'></input>`)
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
    
    this._label = _e('div.pragma-label', conf.label);
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
    util.createChains(this, 'idle', 'active');

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

class Scaler extends Pragma {
    constructor(target){
        super();
        this.target = target;
        this.target.css(`transition transform .07s ease; transform-origin top`);

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

var icons = {
	"speed-increase": "<svg width=\"17\" height=\"9\" viewBox=\"0 0 17 9\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.5 0L17 7.89474L15.81 9L8.5 2.21053L1.19 9L0 7.89474L8.5 0Z\" fill=\"white\"/>\n</svg>\n",
	"speed-decrease": "<svg width=\"17\" height=\"9\" viewBox=\"0 0 17 9\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M8.5 9L2.13343e-07 1.10526L1.19 -1.40286e-06L8.5 6.78947L15.81 -1.24738e-07L17 1.10526L8.5 9Z\" fill=\"white\"/>\n</svg>\n",
	"mode-icon": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M22.75 3.5H5.25C4.78603 3.50053 4.34122 3.68508 4.01315 4.01315C3.68508 4.34122 3.50053 4.78603 3.5 5.25V22.75C3.50053 23.214 3.68508 23.6588 4.01315 23.9868C4.34122 24.3149 4.78603 24.4995 5.25 24.5H22.75C23.214 24.4995 23.6588 24.3149 23.9868 23.9868C24.3149 23.6588 24.4995 23.214 24.5 22.75V5.25C24.4995 4.78603 24.3149 4.34122 23.9868 4.01315C23.6588 3.68508 23.214 3.50053 22.75 3.5ZM19.25 22.75V19.25H15.75V22.75H12.25V19.25H8.75V15.75H12.25V12.25H8.75V8.75H12.25V5.25H15.75V8.75H19.25V5.25H22.75V22.75H19.25Z\" fill=\"#909090\"/>\n<path d=\"M15.75 8.75H12.25V12.25H15.75V8.75Z\" fill=\"#909090\"/>\n<path d=\"M15.75 15.75H12.25V19.25H15.75V15.75Z\" fill=\"#909090\"/>\n<path d=\"M19.25 12.25H15.75V15.75H19.25V12.25Z\" fill=\"#909090\"/>\n</svg>\n",
	"speed-icon": "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M22.4979 15.7501C22.4969 13.7461 21.9163 11.7851 20.8261 10.1035L19.7422 11.1875C20.564 12.5675 20.9978 14.1439 20.9979 15.7501L22.4979 15.7501Z\" fill=\"#909090\"/>\n<path d=\"M21 7.8105L19.9394 6.75L13.5143 13.1752C13.057 12.8997 12.5338 12.7528 12 12.75C11.4067 12.75 10.8266 12.9259 10.3333 13.2556C9.83994 13.5852 9.45543 14.0538 9.22836 14.602C9.0013 15.1501 8.94189 15.7533 9.05765 16.3353C9.1734 16.9172 9.45912 17.4518 9.87868 17.8713C10.2982 18.2909 10.8328 18.5766 11.4147 18.6924C11.9967 18.8081 12.5999 18.7487 13.1481 18.5216C13.6962 18.2946 14.1648 17.9101 14.4944 17.4167C14.8241 16.9234 15 16.3433 15 15.75C14.9972 15.2162 14.8503 14.693 14.5748 14.2357L21 7.8105ZM12 17.25C11.7033 17.25 11.4133 17.162 11.1666 16.9972C10.92 16.8324 10.7277 16.5981 10.6142 16.324C10.5007 16.0499 10.4709 15.7483 10.5288 15.4574C10.5867 15.1664 10.7296 14.8991 10.9393 14.6893C11.1491 14.4796 11.4164 14.3367 11.7074 14.2788C11.9983 14.2209 12.2999 14.2506 12.574 14.3642C12.8481 14.4777 13.0824 14.67 13.2472 14.9166C13.412 15.1633 13.5 15.4533 13.5 15.75C13.4995 16.1477 13.3414 16.529 13.0602 16.8102C12.779 17.0914 12.3977 17.2495 12 17.25Z\" fill=\"#909090\"/>\n<path d=\"M12 6.75002C13.6061 6.75077 15.1822 7.18457 16.5625 8.00574L17.6527 6.91554C16.0679 5.89651 14.2378 5.32343 12.3548 5.2566C10.4719 5.18976 8.60573 5.63164 6.95268 6.53575C5.29964 7.43986 3.92082 8.77277 2.96128 10.3943C2.00174 12.0158 1.49695 13.8659 1.50001 15.75L3.00001 15.75C3.00273 13.3639 3.95182 11.0763 5.63906 9.38906C7.32629 7.70182 9.6139 6.75274 12 6.75002Z\" fill=\"#909090\"/>\n</svg>\n",
	"color-icon": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 22 22\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M19.75 0.5L2.25 0.5C1.78605 0.500579 1.34127 0.685139 1.0132 1.0132C0.685139 1.34127 0.500579 1.78605 0.5 2.25L0.5 19.75C0.500579 20.214 0.685139 20.6587 1.0132 20.9868C1.34127 21.3149 1.78605 21.4994 2.25 21.5L19.75 21.5C20.214 21.4994 20.6587 21.3149 20.9868 20.9868C21.3149 20.6587 21.4994 20.214 21.5 19.75L21.5 2.25C21.4994 1.78605 21.3149 1.34127 20.9868 1.0132C20.6587 0.685139 20.214 0.500579 19.75 0.5ZM2.25 19.75L19.75 2.25L19.75 19.75L2.25 19.75Z\" fill=\"#919191\"/>\n</svg>\n",
	"fovea-icon": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M26.249 14L19.249 21L18.0117 19.7628L23.7745 14L18.0117 8.23725L19.249 7L26.249 14Z\" fill=\"#909090\"/>\n<path d=\"M14 19.25C13.8851 19.2502 13.7713 19.2276 13.6651 19.1836C13.559 19.1396 13.4625 19.075 13.3814 18.9937L9.00641 14.6187C8.92512 14.5374 8.86064 14.441 8.81664 14.3349C8.77265 14.2287 8.75 14.1149 8.75 14C8.75 13.8851 8.77265 13.7714 8.81664 13.6652C8.86064 13.5591 8.92512 13.4626 9.00641 13.3814L13.3814 9.00641C13.4626 8.92512 13.5591 8.86064 13.6652 8.81664C13.7713 8.77265 13.8851 8.75 14 8.75C14.1149 8.75 14.2287 8.77265 14.3349 8.81664C14.441 8.86064 14.5374 8.92512 14.6187 9.00641L18.9937 13.3814C19.0749 13.4626 19.1394 13.5591 19.1834 13.6652C19.2274 13.7714 19.2501 13.8851 19.2501 14C19.2501 14.1149 19.2274 14.2287 19.1834 14.3349C19.1394 14.441 19.0749 14.5374 18.9937 14.6187L14.6187 18.9937C14.5375 19.075 14.4411 19.1396 14.3349 19.1836C14.2288 19.2276 14.115 19.2502 14 19.25ZM10.8624 14L14 17.1377L17.1377 14L14 10.8624L10.8624 14Z\" fill=\"#909090\"/>\n<path d=\"M1.75 14L8.75 7L9.98725 8.23725L4.2245 14L9.98725 19.7628L8.75 21L1.75 14Z\" fill=\"#909090\"/>\n</svg>\n",
	"settings-icon-white": "<svg width=\"28\" height=\"24\" viewBox=\"0 0 28 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M27.0474 3.86392H23.0869C22.6039 1.64217 20.672 0 18.3536 0C16.0353 0 14.1033 1.64217 13.6203 3.86392H0V5.79588H13.6203C14.1033 8.01763 16.0353 9.65979 18.3536 9.65979C20.672 9.65979 22.6039 8.01763 23.0869 5.79588H27.0474V3.86392ZM18.3536 7.72784C16.7114 7.72784 15.4557 6.47206 15.4557 4.8299C15.4557 3.18773 16.7114 1.93196 18.3536 1.93196C19.9958 1.93196 21.2516 3.18773 21.2516 4.8299C21.2516 6.47206 19.9958 7.72784 18.3536 7.72784Z\" fill=\"white\"/>\n<path d=\"M0 19.3193H3.96052C4.44351 21.5411 6.37547 23.1832 8.69382 23.1832C11.0122 23.1832 12.9441 21.5411 13.4271 19.3193H27.0474V17.3874H13.4271C12.9441 15.1656 11.0122 13.5234 8.69382 13.5234C6.37547 13.5234 4.44351 15.1656 3.96052 17.3874H0V19.3193ZM8.69382 15.4554C10.336 15.4554 11.5918 16.7112 11.5918 18.3533C11.5918 19.9955 10.336 21.2513 8.69382 21.2513C7.05165 21.2513 5.79588 19.9955 5.79588 18.3533C5.79588 16.7112 7.05165 15.4554 8.69382 15.4554Z\" fill=\"white\"/>\n</svg>\n",
	"back-icon": "<svg width=\"7\" height=\"13\" viewBox=\"0 0 7 13\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M7.75117e-08 6.5L6.14035 7.3223e-08L7 0.91L1.7193 6.5L7 12.09L6.14035 13L7.75117e-08 6.5Z\" fill=\"white\"/>\n</svg>\n"
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
  select.bind(this)(util.objDiff({
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
      _e('body').findAll('[data-lector-marker-color]').forEach(e => {
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
      _e('body').findAll('[data-lector-marker-mode]').forEach(e => {
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

  let settings = _p("settingsWrapper")
                  .addClass("items-center", 'lector-settings')

                  .run(function(){
                    this.value = {};

                    this._setVal = function(edit){
                      this.value = util.objDiff(this.value, edit);
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


  let modeIcon = _p().as(_e(icons['mode-icon']))
                  .addClass(`setting-icon`);

  _p('monitor')
                    .as(_e('div.'))
                    .addClass('mode-indicator')
                    .setData({ 'lectorMarkerMode': 'true' });


  let setMode = _p('!mode')
                  .run(function(){
                    activeSelectTpl.bind(this)({
                    options: modes,
                    optionTemplate: option => _p(option)
                        .addClass(`modeOption`)
                        .listenTo('click', function(){
                          this.parent.value = this.key;
                        })
                        .run(function(){
                          this._miniPointer = _e('div.mini-pointer#');
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

  let modeComp = _p().contain(modeIcon, setMode)
                    .addClass(`setting`)
                    .css(`position relative`)
                    .run(function() {
                      this.update = setMode.update;
                    });

  let foveaIcon = _p().as(_e(icons['fovea-icon']))
                  .addClass(`setting-icon`);
  _p('monitor')
                    .as(_e('div.'))
                    .addClass(`color-indicator`)
                    .setData({ 'lectorMarkerColor': 'background' });                

  let setFovea = _p("!fovea")
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
          
  let foveaComp = _p().contain(foveaIcon, setFovea)
                .addClass(`setting`)
                .css(`position relative`)
                .run(function () {
                  this.update = setFovea.update;
                });


    
  let setColor = _p('!color')
                  .run(
                    function(){
                      activeSelectTpl.bind(this)({
                      options: colors,
                      optionTemplate: option => {
                        return _p(option)
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




  let colorIcon = _p()
                  .as(_e(icons['color-icon']))
                  .css('width 25px; height 25px;')
                  .addClass(`setting-icon`);

  _p('monitor')
                    .as(_e('div.'))
                    .addClass(`color-indicator`)
                    .setData({ 'lectorMarkerColor': 'background' });

  let colorsComp = _p().contain(colorIcon, setColor)
                  .addClass(`setting`)
                  .css(`position relative`);

                  // .run(popUpEditor)
                  //   .setPopupEditor(setColor)

  
  
  let popUpSettings = _p("popupsettings")
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
  
  let wpmIcon = _p().as(_e(icons['speed-icon']))
                .css('width 25px; height 25px;')
                .addClass(`setting-icon`);

  let wpmIncreaseIcon = _p().as(_e(icons['speed-increase']))
                      .addClass(`setting-wpm-adjusticon`)
                      .listenTo('click', _ => {
                        setWpm.value += 10;
                      });

  let wpmDecreaseIcon = _p().as(_e(icons[`speed-decrease`]))
                        .addClass(`setting-wpm-adjusticon`)
                        .listenTo('click', _ => {
                          setWpm.value -= 10;
                        });

  let wpmAdjust = _p('wpmAdjustPragma').contain(wpmIncreaseIcon,wpmDecreaseIcon)
                  .addClass(`speed-adjust`);

  let setWpm = _p("!wpm")
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
    
  let wpmComp = _p().contain(wpmIcon, setWpm, wpmAdjust)
                .addClass(`setting-wpm`)
                .run(function () {
                  this.update = setWpm.update;
                });


  let settingsIcon = _p().as(_e(icons['settings-icon-white']))
                    .addClass(`settings-bar-icon`)
                    .run(popUpEditor)
                    .setPopupEditor(popUpSettings);

                    


  let settingsBarComp = _p().contain(settingsIcon, wpmComp)
                        .addClass(`settings-bar`);
                        
  
  let pageComp = _p("!page")
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
                    util.createChains(this, 'userEdit');

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

  let scaleComp = _p("!scale")
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

                    
  let miniSettings = _p('mini-settings')
    .addClass('lector-mini-settings')
    .contain(scaleComp, pageComp)
    .pragmatize();
  
  
// 
// pageComp
  settings.contain(popUpSettings, settingsBarComp);
  settings.adopt(miniSettings);
  
  const listenTo_ = p => p.key && p.key.indexOf('!') === 0;

   let fader = _p('fader')
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

class Settings extends Pragma {
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
    _e(`
    <div id='${setting.key}-editor' class='editor collapsable' data-setting-target='editor'>
        <div data-setting-target='back'> 
            <div class="back-icon">${icons['back-icon']}</div> 
            <div class="back-copy">${setting.getData('setting')} </div>
        </div>

        <div class='editor-content' data-editor-target='content'>
        </div>
    </div>
    `.trim());

class SettingEditor extends Pragma {
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
            collapse(this.element);
        });
        
        collapse(this.element);
        // this.triggerEvent('hide')
        return this
    }

    _setContent(html, ...elements){
        if (typeof html === 'string'){
            this.editorContent.html(html);
        } else if (html instanceof Pragma){
            this.editorContent.append(html, ...elements);
            // elements.forEach(element => editorContent.append(element))

            this.triggerEvent('contentChange');
        }
    }
}

let displayElement = (title) => {
    return _e(`div#${title}-display.display`, 0).setData({'settingTarget': 'display'})
};

let sectionElement = (title, htmlTemp = v => `<div class='title' id='${title}-title'>${v}</div>`) =>
    _e(`div.collapsed-section.collapsable#${title}-section`)
        .html(htmlTemp(title))
        .append(displayElement(title));

let settingTemplate = (pragma, id, title = id) =>
    _e(`div.setting#${pragma.key}`)
        .setData({ 'setting': id })
        .append(sectionElement(title));
        // .append(editorElement(title))

// const htmlTemplate = `
// <div class='settings'>
//     <div class='setting'>
//     </div>
// </div>

// `.trim()

class Setting extends Pragma {
    constructor(...args) {
        super();
        this.init(...args);
    }


    init(parent, key) {
        parent.adopt(this);
        parent.create(this, key);

        this.as(settingTemplate(this, key))
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

            })
            .appendTo(this.parent);

        this.element.find('.collapsed-section').listenTo("mousedown", () => {
            console.log('openedd');
            this.open();
        });

        
        this.editor = new SettingEditor(this);
    }


    open() {
        const jumpAhead = 10;

        this.parent.element.findAll(".setting").forEach(section => {
            if (section !== this.element) collapse(section); 
        });
        
        this.element.findAll('.collapsed-section').forEach(section => {
            console.log(section);
            collapse(section);
        });


        setTimeout(() => {
            this.addClass('expanded');
            this._ogHeight = this.height;
            this.css(`height ${this.editor.element.scrollHeight}px`);

            expand(this.editor);
        }, jumpAhead);

    }

    close() {
        this.parent.element.findAll(".setting").forEach(section => {
            if (section !== this.element) expand(section);
        });

        this.element.findAll('.collapsed-section').forEach(section => {
            console.log(section);
            expand(section);
        });

        this.removeClass('expanded');
        this.element.style.height = null;
    }

    updateDisplay(html){
        pragmaSpace.onDocLoad(() => {
            let el = this.element.findAll("[data-setting-target='display']");
            console.log('updating', html, el);
            el.forEach(el => el.html(html));
        });
    }
}

let optionDefaultWrapper = (content, pragma) => _p(`
        <div class="option" data-editor-option=${pragma.getData('option')}>
        </div>
    `.trim()).run(function(){
        if (typeof content === 'string') return this.element.html(content)
        this.append(content);
    }).element;

let optionDefaultContent = (pragma) => pragma.key.toString();

let makeOptionElement = function(content, wrapper){
    this.as(_e(wrapper(content, this))).setId(util.rk5()).addClass('option');
    this.setData({'option': this.option});
    return this
};

class Option extends Pragma {
    constructor(){
        super();
        this.createWire('optionTemplate');
        this.init(...arguments);
        
    }
    
    static fromTemplate (template, option){
        let content = typeof template === 'function' ? template : optionDefaultContent;
        let wrapper = optionDefaultWrapper;
        if (typeof template === `object`){
            if (template.contentTemplate) content = template.contentTemplate;
            if (template.wrapperTemplate) wrapper = template.wrapperTemplate;
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
    init(settings, setting, conf={
        contentTemplate: optionDefaultContent,    
        wrapperTemplate: optionDefaultWrapper,    
    }) {
        super.init(settings, setting);
        let options = conf.options ? conf.options : conf;

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
            if (!pragma) return util.throwSoft(`couldnt find option for ${value}`)
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

let defaultContent$1 = (pragma) => `
    <div data-setting-target='display'>240</div>
`.trim();
    



class SettingInt extends Setting {
    init(settings, setting, conf={
        contentTemplate: defaultContent$1,    
    }) {

        // this.createWire('setting')

        super.init(...arguments);
        this.editor._setContent(defaultContent$1()); // this.editor._setContent(conf.contentTemplate)

        this.on('input', (value) => {
            console.log('set input', value);
            this.setData({'value': value});
            this.parent.update(this.getData('setting'), value, this);
        });
        
        console.log(this.element.findAll(`[data-setting-target='display']`));

    }    
}

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

        this.slider = _p()
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

let settingsComp = _e(`div.settings`);


function addSettingsToLector(lector){
  // actions that talk to the lector instance
  const actions = {
    changeColor(hex = this.value) {
      // modeComp.update(hex)
      // foveaComp.update(hex)
      _e('body').findAll('[data-lector-marker-color]').forEach(e => {
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
      _e('body').findAll('[data-lector-marker-mode]').forEach(e => {
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


  function createColorBlob(color){
    let colorThingy  = _e('div.color-blob')
                  .css(`background-color ${color}`)
                  .setId(`${color}`)
                  .html("   ");

    let blob = _e('div#color')
                .append(colorThingy)
                .html();

    
                  console.log("BLOOOOOOOOOb",blob);
    
    return blob
    
  }

  // color comp
  let colorOptionTemplate = pragma => `
      ${createColorBlob(pragma.getData('option'))} ${pragma.getData('description')}
  `.trim();

  let colorSetting = new SettingList(lector.settings, 'color', { 
    options: colorsHumanFriendly,
    contentTemplate: colorOptionTemplate
  }).on('select', onNewSelection)
    .on('select', (pragma) => {
    console.log('color is ', pragma.option);
    actions.changeColor(pragma.option);

    console.log(colorSetting.find(`${pragma.option}`));

    //pragma.find(`${pragma.option}`).addClass('selected')

  });

  
  // mode comp
  let modeOptionTemplate = pragma => `
      ${pragma.getData('option')}
  `.trim();

  new SettingList(lector.settings, 'mode', {
    options: modesHumanFriendly,
    contentTemplate: modeOptionTemplate
  }).on('select', onNewSelection)
    .on('select', function(optionPragma){
        // this.updateDisplay(optionPragma.getData('option'))
        actions.changeMode(optionPragma.getData('option'));
      });

  
  // wpm comp
  new SettingInt(lector.settings, 'wpm')
                      .on('input', (value) => {
                        actions.changeWpm(value);
                      }).bind("+", function(){
                        this.wpm += 5;
                      }).bind("-", function() { 
                        this.wpm -= 5;
                      });
  


  // fovea comp
  new SettingSlider(lector.settings, 'fovea', {
                        min: 2, max: 10 
                      })
                      .on('input', (value) => {
                        actions.changeFovea(value);
                      }).bind("]", function(){
                        this.fovea += 5;
                      }).bind('[', function() {
                        this.fovea -= 5;
                      });

  
  // when the document is loaded, 
  // update to the default settings, and
  // trigger the settings load event
  //
  pragmaSpace.onDocLoad(function() {
    lector.settings.update({
      color: "#eddd6e",
      mode: "HotBox",
      wpm: 235,
      fovea: 8
    });

    lector.settings.triggerEvent('load');
  });
}

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  LectorSettings: lectorSettings,
  Settings: Settings,
  addSettingsToLector: addSettingsToLector
});

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
      
      w
        .listenTo("click", function(){
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
  l = _e(l);
  if (options.wfy) wfy(l);
  let w = Word(l);

  let lec = new PragmaLector("lector")
              .as(l)
              .setValue(0)
              .connectTo(w);
  
  lec.mark = Mark(lec);
  if (options.settings) lector.ui.addSettingsToLector(lec); 
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
  return _p('streamer')
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

  util.log("configuration appears to be a bit more complicated");

  if (options.defaultStyles){
    util.addStyles(css.main);
    util.addStyles(css.settings);
  }

  if (options.fullStyles){
    util.addStyles(css.full);
  }

  if (!options.experimental) return console.log('EXPERIMENTAL FEATURES TURNED OFF')
  let lector;

  if (options.stream &&
      options.paginate &&
      options.paginate.from === 'stream' &&
      options.paginate.as === 'infiniteScroll'){

    util.log('setting up streamer service');

    let streamer = _streamer(options.stream);
    let paginator = infinityPaginator(streamer, l, options.paginate.config || {});

    // let reader = _p()
    //               .as(_e(l).parentElement)

    // console.log('creating new lector')
    // console.log(l)
    // console.log(_e(l).parentElement)
    // let options = util.objDiff({ skip: true })
    lector = Reader(_e(l).parentElement, options)
                  .adopt(paginator, streamer);

    lector.paginator = paginator;
    if (lector.settings){
      console.log("lector has settings! connecting paginator's value to pagecomp");
      let pageComp = lector.settings.find('!page');
      pageComp?.wireTo(lector.paginator);
    }
    console.log('paginator', paginator);

    paginator.fill();
    // return lector
  }

  
  if (options.scaler){
    // let _scaler = _p().run(_ext.scaler)
    let _scaler = new Scaler(lector.element);
    
    // _scaler.setTarget(lector.element)
    
    _scaler.scaleUp();
    // _scaler.bind("mod+=", function() { _scaler.scaleUp();  return false;})
    // _scaler.bind("mod+-", function() { _scaler.scaleDown();  return false;})
    
    lector.adopt(_scaler);
    lector.scaler = _scaler;

    if (lector.settings){
      console.log("lector has settings! connecting scaler's value to scalercomp");
      let scaleComp = lector.settings.find('!scale');
      lector.scaler.on('scaleChange', (v) => { scaleComp.value = v; });
      //if (scaleComp) scaleComp.wireTo(lector.scaler)
    }  

  }


  
  return lector
};

function globalify(){
  const attrs = {
    Lector: Lector,
    Word: Word,
    _e: _e,
    _p: _p,
    util: util,
    lecUtil: helpers,
    _thread: _thread
  };

  for (let [key, val] of Object.entries(attrs)){
    globalThis[key] = val;
  }
}

export { Lector, Word, globalify, helpers, index as ui };
