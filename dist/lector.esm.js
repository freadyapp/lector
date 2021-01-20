import { Pragma, _e, _p, tpl, util } from 'pragmajs';
import anime from 'animejs';
import 'jquery';
import nlp from 'compromise';

function elementify(el){
  // pipeline to vanillafy pragma objects to html elements
  if (el instanceof Pragma) el = el.element;
  if (!el.isPragmaElement) el = _e(el);
  return el
}

function getViewportHeight(){
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
}

function getRelativeScreen(el){
  el = elementify(el); 
  let viewportHeight = getViewportHeight();
  let rect = el.getBoundingClientRect();
  return  {
            top: rect.top, 
            bottom: viewportHeight-rect.bottom
          }
}

function isOnScreen(el, threshold=100){
  el = elementify(el); 
  let viewportHeight = getViewportHeight();
  let rect = el.offset();
  let sm = getRelativeScreen(el);
  return !(sm.top < threshold || sm.bottom < threshold)
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

function onScroll(cb=(s)=>{}){
  
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

const colors = ["#a8f19a", "#eddd6e", "#edd1b0", "#96adfc"];
const fonts = ["Helvetica", "Open Sans", "Space Mono"];

// import $ from "jquery"
// export { settingsCSS } from "../styles/settings.css"

const LectorSettings = (parent) => {
  //
  // let foveaComp = Slider.value("markerfovea", 1, 10)
  //     .bind(">", (comp) => { comp.value+=1 }, 'keyup')
  //     .bind("<", (comp) => { comp.value-=1 }, 'keyup')
  //     .html.class("slider")

  let foveaComp = _p("markerfovea")
                  .from(tpl.slider())
                  .setRange(1, 10)
                  .addClass('slider');


  // let colorsComp = Select.color("markercolor", colors)
  //                         .bind("c")
  //                         .setTippy("Color:", tippyOption)
  //

  let colorsComp = _p('markercolor')
                  .from(tpl.select({
                    options: colors
                  }));

  let fontComp = _p('readerfont')
                  .from(tpl.select({
                    options: fonts
                  }));

  // let fontComp = Select.font("readerfont", fonts).bind("f")
  //                     .html.class("font-selector")
  //                     .setTippy('Font:', tippyOption)
  //

  // let modeComp = Select.attr("markermode", modes,
  //   (v, comp, key) => {
  //     // on value change
  //     //mode_ify(parent.mark, v, colors[0])
  //     // console.log(v)
  //   },
  //   (key, index) => {
  //     //console.log(mode_ify(null, modes[index], "transparent"))
  //     console.log(util.parse.css(mode_ify(null, modes[index], "transparent")))
  //     // icon contruction
  //     return {
  //       type: "pointerModeOption",
  //       html: `<div class='pointer-color' style='display: block; width:35px; height:15px; ${util.parse.css(mode_ify(null, modes[index], "transparent") + "; mix-blend-mode normal")}'></div>`
  //     }
  //   }).bind("m", null, "keyup")
  //   .setTippy("Mode:", tippyOption)
  //

  // // key, initial val, step
  // let wpmSet = (value, comp ) => {
  //   /* on set */
  //   //console.log(value,comp)
  // }

  let wpmComp = _p("wpm").html("<>");

  // let wpmComp = Button.controls("wpm", 250, 10, wpmSet, {
  //   "+": "+",
  //   "-": "-"
  // }
  // ).setRange(10, 42069)
  //   .html.class("inline-grid grid-cols-3 gap-x-1 items-center")
  //   .setTippy("Reading Speed", tippyOption)
  //
  // let popUpSettings = Compose("popupsettings")
    // .host(colorsComp, fontComp, modeComp, foveaComp)

  let popUpSettings = _p("popupsettings")
        .contain(colorsComp, fontComp, foveaComp);

  // $(popUpSettings.tippy.popper).addClass("settings-tippy")

  // popUpSettings.illustrate(icons.grab("settings")) // icons
  // popUpSettings.icon.attr("id", "settings-icon")

  let settings = _p("settingsWrapper").contain(popUpSettings, wpmComp)
                  .addClass("items-center");

  // extend settings
  settings.get = (key) => {
    return settings.bridge ? settings.bridge.value[key] : null
  };

  return settings.pragmatize()

};
//
//   let syncedKeys = ["markercolor", "readerfont", "markermode", "wpm", "markerfovea"]
//   let freadyBridge = Bridge(settings, syncedKeys,
//     (object, trigger) => {
//       // on set of any watched attribute
//       let color = colors[object.markercolor]
//       let mode = modes[object.markermode]
//       let font = fonts[object.readerfont]
//       // modify pointer
//       let modeCss = mode_ify(parent.mark, mode, color)
//       //console.log(modeComp)
//
//       modeComp.children.forEach((child) => {
//         if (color) child.css(`background ${color}`)
//         //console.log(parse.css(modeCss))
//       })
//
//       // set font
//       $("w").css({ "font-family": font })
//
//       // sync data
//       console.log(object)
//
//       settings.bridge = freadyBridge
//       //console.log(settings.value)
//     })
//
//   freadyBridge.set({
//     wpm: 280,
//     readerfont: 1,
//     markercolor:1,
//     markermode: 0,
//     markerfovea: 5
//   })
//
//   return settings
// }

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
  desc = _e(desc);
  let txt = desc.textContent;
  let inner = "";
  for (let txt of desc.textContent.split(" ")){
    let noWhiteSpace = txt.replace(/\s/g, "");
    inner += noWhiteSpace.length!=0 ? "<w>"+txt.replaceAll(" ", "</w> <w>")+"</w> " : txt;
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
  console.log(`wfying ${JSON.stringify(element)}`);
  element = _e(element);
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

class PragmaLector extends Pragma {

  get mark(){
    return this.markPragma
  }
  set mark(m){
    this.markPragma = m;
  }
  get isReading(){
    return this.w.isReading
  }
  get currentWord(){
    return this.w.currentWord
  }

  connectTo(w){
    this.w = w;
    this.add(w);
    return this
  }

  toggle(){
    if (this.isReading) return this.pause()
    return this.read()
  }
  read(){
    this.w.read();
  }

  pause(){
    this.w.pause();
  }
}

class PragmaWord extends Pragma {

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
    return this.find(this.value).currentWord
  }

  sibling(n){
    return this.parent ? this.parent.find(this.index + n) : null
  }
  // get next() {
  //   if (!this.hasKids)  return this.parent.next
  //   if (this.kidsum-this.value-1>0) return this.sibling(1).currentWord
  //   return null
  // }
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
    // console.log('reading ' + this.text())
    // if (this.hasKids) console.log(this.currentWord)

    //console.log('fuck if this works it will be sad')
    if (this.currentPromise) return new Promise((resolve, reject) => {
      resolve('already reading');
    })

    if (this.hasKids) return this.currentWord.read()
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
    return this.parent.pause().catch(() => console.log('no need to pause')).then(() => {
      this.mark.mark(this, 50, true);
      if (!silent) this.parent.value = this.index;
    })
  }
}

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
  constructor(parent) {
    super('marker');

    this.parent = parent;
    this.element = _e("marker");
    document.body.appendChild(this.element);
    this.css(defaultStyles);
    //this.parent.element.append(this.element)
    this.currentlyMarking = null;
    //this.element.width("180px")
    this.colors = ["tomato", "#FFDFD6", "teal"]; // TODO change this

    window.addEventListener('resize', () => {
      this.mark(this.last_marked, 0);
    });

    this.runningFor = 0;
    this.pausing = false;

    this.idle = new Idle(8000)
      .onAfk(()=> {
        console.log('user is afk');
        this.shout();
      })
      .onActive(() => {
        console.log('user is back');
        this.shutUp();
      });
  }

  shout(){
    return console.log("AAAAAAAAAA")
  }

  shutUp(){
    return console.log("SHUTTING UP")
  }

  set last_marked(n){
    this.value = n;
  }

  get last_marked(){
    return this.value
  }

  setWidth(n) {
    this.element.width(n);
    return this
  }

  get settings() {
    return {
      get: function(){
        return null
      }
    }
  }

  set color(hex) {
    return
  }
  get cw() {
    return this.fovea * 30
  }
  get fovea() {
    return this.settings.get("markerfovea") || 4
  }
  set fovea(n) {
    console.table(['writing fovea', this.settings.find("fovea")]);
    this.settings.set({ "fovea": n });
    this.element.css({ "width": this.settings.find("fovea") * 30 });
  }

  get wpm() { return this.settings.get("wpm") || 260 }
  set wpm(n) { this.settings.set({ "wpm": n }); }

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
        word.parent.value = word.index;
      })
  }

  guide(word) {
    if (!(word instanceof Pragma)) return new Promise((resolve, reject) => { console.warn("cannot guide thru"); reject("error"); })
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

    if (!word instanceof Pragma) return this.throw(`Could not calculate marking duration for [${word}] since it does not appear to be a Pragma Object`)
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
        .from(tpl.create.template.config({
          name: 'paginator',
          defaultSet: pageTemplate,
          onPageAdd: typeof conf.onPageAdd === 'function' ? conf.onPageAdd : function(page, i) { util.log('added', page); },
          onPageRender: typeof conf.onPageRender === 'function' ? conf.onPageRender : function(page, i){ util.log('rendered', page); },
          onPageActive: typeof conf.onPageActive === 'function' ? conf.onPageActive: function(page, i){ util.log('active', page); },
          onPageInactive: typeof conf.onPageInactive === 'function' ? conf.onPageInactive : function(page, i) { util.log('inactive', page); }
        }))

        .run(function(){

          this.pageTemplate = _e(this._paginatorTemplate);
          this._clonePage = function() { return _e(this.pageTemplate.cloneNode(false)) };

          this.create = function(val=this.value, action='append'){
            let cloned = this._clonePage();

            new Promise( resolve => {
              setTimeout( _ => {
                cloned.html(`${val} @ ${Date.now()}`);
                resolve();
              }, Math.random()*1500);
            }).then( _ => this.onPageRender(cloned, val));
          
            cloned[`${action}To`](this.parent.element);
            this.addPage(cloned, val);
          };

          this.destroy = function(val){
            this.pages.get(val).destroy(); 
            this.delPage(val);
          };

          this.pages = new Map();

          this.addPage = function(page, key){
            this.onPageAdd(page);

            key = key || this.pages.size;
            return this.pages.set(key, page)
          };

          this.delPage = function(key){
            return this.pages.delete(key) 
          };

          this.activate = function(pageIndex){
            this.onPageActive(this.pages.get(pageIndex));
          };

          this.inactivate = function(pageIndex){
            this.onPageInactive(this.pages.get(pageIndex)); 
          };

          this.export("pageTemplate", "_clonePage", "create", 'destroy', "pages", "addPage", "delPage", 'activate', 'inactivate');
        })
}

function infinityPaginator(streamer, pageTemplate, config={}){
  let inf = _p("infinity paginator")
        .from(
          paginator(pageTemplate).config(util.objDiff(
            {
              streamer: streamer,
              fetch: streamer.fetch,
              // on page render
              // on page active
              // on page inactive
            }, config))
        )
        .setValue(0)
        .run(function(){

          const conf = {
            headspace: 4,
            timeout: 10
          };

          this.fill = function(){

            this.fetching = true;
            let start = this.value >= conf.headspace ? this.value-conf.headspace : 0;
            let pageRange = range(start, this.value+conf.headspace);
            let pagesRendered = Array.from(this.pages.keys());

            let pagesToRender = util.aryDiff(pageRange, pagesRendered);
            let pagesToDelete = util.aryDiff(pagesRendered, pageRange);

            console.log(">> DEL", pagesToDelete);
            console.log(">> ADD", pagesToRender);

            for (let pageIndex of pagesToRender){
              this.create(pageIndex);
            }

            for (let pageIndex of pagesToDelete){
              //this.inactivate(pageIndex)
              //this.pages.get(pageIndex).css("background:red")
              //this.destroy(pageIndex)
            }
            setTimeout(a => {
              this.fetching = false;
            }, conf.timeout);
          };

        })
      .run(function(){
        onScroll((s, l) => {
          if (this.fetching) return 

          let v = this.value;
          let currentPage = this.pages.get(v);

          if (!isOnScreen(currentPage)){
            let i = 1;
            let di = l > 0 ? 1 : -1;
            while (true){
              if (isOnScreen(this.pages.get(v+i))){
                this.value = v+i;
                break
              }
              i += di; 
            }
          }
        });
      })
      .do(function(){
        //if (!this.pages.has(this.value)) return
        //console.log(this.value, this.value - this.dv)
        //console.log(this.pages)
        //
        //this.pages.get(this.value).css('background: lime')
        //this.pages.get(this.value - this.dv).css('background: whitesmoke')

        this.activate(this.value);
        this.inactivate(this.value-this.dv);

        this.fill();
      });

  return inf
}

// globalThis.$ = globalThis.jQuery = $;

// pragmaSpace.dev = true

// TODO add more default options
const default_options = {
  wfy: true,
  pragmatizeOnCreate: true,
  experimental: false
};

const Mark = (lec) => {
  let mark = new PragmaMark(lec);

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
    console.log('user is scrolling', userIsScrolling());

    if (userIsScrolling() && lec.isReading){
      let dscroll = Math.abs(lastScroll-s);
      lastScroll = s;
      if (dscroll>threshold){
        console.log('ds=', dscroll);
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

const Word = (element, i) => {
  let w = new PragmaWord(i)
          .as(element)
          .setValue(0);

  let thisw = w.element.findAll('w');

  if (thisw.length==0) {
    w.addListeners({
      "click": function(e, comp){
        this.summon().then(() => {
          this.parent.value = this.key;
        });
      },
      "mouseover": function(w, comp){
        this.css("background #5e38c74a");
      },
      "mouseout": function(){
        this.css('background transparent');
      }
    });
  }

  // w.element.css({"border": ".5px dashed lightgray"})
  // w.css("border .5px dashed lightgray")
  thisw.forEach( (el, i) => {
    let ww = Word(el, i);
    // console.log(ww)
    w.add(ww);
  });

  return w
};

const Reader = (l, options=default_options) => {
  l = _e(l);
  if (options.wfy) wfy(l);
  let w = Word(l);
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

              });

  lec.settings = LectorSettings()
                  .css(`position fixed
                        bottom 10px
                        left 10px
                        background #303030
                        padding 10px`);

  lec.mark = Mark(lec);
  lec.contain(lec.settings);

  function bindKeys(){
    lec.bind("right", function(){ this.w.value += 1; this.currentWord.summon();});
    lec.bind("left", function(){ this.w.value -= 1; this.currentWord.summon();});

    lec.bind("space", function(){
      return false
    }, 'keydown');

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

  // bindKeys() // TODO: add mousetrap integration

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

  console.log("configuration appears to be a bit more complicated");

  if (options.stream &&
      options.paginate &&
      options.paginate.from === 'stream' &&
      options.paginate.as === 'infiniteScroll'){

    console.log('setting up streamer service');

    let streamer = _streamer(options.stream);
    let paginator = infinityPaginator(streamer, l).config({
      onPageActive: p => p.css('background lime'),
      onPageInactive: p => p.css('background gray'),

      onPageAdd: p => p.css("background gray")
    });

    let reader = _p()
                  .as(_e(l).parentElement)
                  .adopt(paginator, streamer);

    paginator.fill();

    //streamer.wireTo(paginator) // when paginator changes value, change value of streamer as well

    //streamer.do(function(){
      //console.log(`fetching page [${this.value}]`)
    //})

  }
};

globalThis.Lector = Lector;
// import { css } from "./styles/main.css"

export default Lector;
