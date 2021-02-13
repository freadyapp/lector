import{Pragma as t,_e as e,util as i,_p as n,runAsync as s,_thread as r}from"pragmajs";import o from"animejs";import a from"compromise";function h(i){return i instanceof t&&(i=i.element),i.isPragmaElement||(i=e(i)),i}function l(t,e=100){if(!t)throw i.throwSoft(`couldnt not evaluate if [${t}] is on screen`);t=h(t);let n=window.scrollY;return function(t,e={}){let i=t.offset(),n=i.top,s=i.top+t.rect().height;return n<=e.bot&&s>=e.top||n<=e.top&&s>=e.bot}(t,{top:n+e,bot:n+window.innerHeight-e})}function c(t,e=200,i=200){return t=h(t),new Promise(((n,s)=>{const r=window.document.scrollingElement||window.document.body||window.document.documentElement,a=t.offset().top-i;o({targets:r,scrollTop:a,duration:e,easing:"easeInOutSine"}).finished.then((()=>{setTimeout(n,20)}))}))}function u(t){globalThis.lectorSpace.scrollChain||(i.createChains(globalThis.lectorSpace,"scroll"),function(t){let e=0,i=!1;document.addEventListener("scroll",(function(n){let s=e;e=window.scrollY,i||(window.requestAnimationFrame((function(){t(e,e-s),i=!1})),i=!0)}))}(((t,e)=>{globalThis.lectorSpace.scrollChain.exec(t,e)}))),globalThis.lectorSpace.onScroll(t)}function p(t){globalThis.lectorSpace.scrollEndChain||(i.createChains(globalThis.lectorSpace,"scrollEnd"),function(t){let e,i={s:null,ds:null};u(((n,s)=>{i={s:n,ds:s},e&&clearTimeout(e),e=setTimeout((e=>{t(i.s,i.ds)}),50)}))}(((t,e)=>{globalThis.lectorSpace.scrollEndChain.exec(t,e)}))),globalThis.lectorSpace.onScrollEnd(t)}globalThis.lectorSpace=globalThis.lectorSpace||{};const d=["an","an","ap","di","dy","ec","eg","en","em","eo","ep","eu","id","is","my","ne","od","oo","ot","sy","ur","ur","zo","pto","pyl","acr","aer","agr","ana","ant","apo","aut","bar","bio","cac","cat","cen","cen","con","cub","cyn","dec","dek","dem","dia","dox","eco","ego","eme","eos","epi","erg","eso","eth","eur","exo","geo","gen","hem","hal","hen","hex","hod","hol","hor","hor","hyo","hyp","ide","idi","iso","kil","lei","lep","lip","log","meg","mei","men","mer","mes","mim","mis","mit","mne","mon","myx","nes","nom","oct","oed","oen","omm","ont","opt","pan","pam","par","ped","pin","pis","pol","por","pro","rhe","sei","sit","syn","syl","sym","tax","the","the","tom","ton","top","tox","tri","ulo","uro","uro","xen","xer","zon","zyg","psil","prot","pros","amph","anem","anti","anth","arct","astr","athl","auto","basi","bibl","briz","brom","brom","call","carp","carp","cata","chir","cine","cirr","clad","clav","coel","copr","cosm","crep","cris","crit","cten","cyan","cycl","cyst","deca","deka","delt","derm","dexi","dino","dipl","ecto","endo","engy","eoso","etho","ethi","ethm","ethn","etym","fant","glia","gram","gymn","haem","hapl","heli","hemi","hept","herp","heur","hipp","home","horm","hyal","hydr","hygr","hypn","icos","kine","lamp","leps","leuc","leuk","lith","metr","meta","micr","myri","myth","narc","naut","necr","nect","nema","neur","noth","noto","oeco","ogdo","olig","onom","ophi","orch","orth","pach","paed","pale","path","patr","pect","pent","pept","peri","petr","phae","phag","pher","phil","phob","phon","phor","phos","phot","phyl","phys","plac","plas","plec","plut","pneu","poie","pole","poli","poli","poly","raph","rhag","rhig","rhin","rhiz","rhod","sarc","scel","scop","sema","siph","soma","soph","stea","steg","sten","stig","stom","styl","tach","tars","taur","tele","tele","temn","tetr","than","thus","ther","thym","thyr","trag","trit","trop","xiph","proct","ptych","amphi","arche","archi","arche","arist","arthr","bathy","batho","blenn","blast","botan","brady","bront","calli","calyp","cardi","centr","ceram","cerat","chlor","chore","chrom","chron","chrys","clast","clist","cochl","corac","cotyl","crani","cross","crypt","dendr","dodec","dynam","ennea","gastr","graph","heter","homal","hyper","klept","lekan","macro","melan","meter","morph","nephr","nomad","odont","organ","osteo","palae","palin","peran","phleg","phloe","phren","phryn","phyll","plagi","platy","plesi","pleth","pleur","pogon","polem","potam","rhabd","rhomb","scaph","schem","schis","scler","scoli","scept","scyph","selen","solen","sperm","sphen","spher","stern","stich","stoch","taeni","techn","therm","thyre","traum","trema","trich","troch","troph","xanth","psych","archae","brachi","brachy","bronch","cathar","cephal","chelon","cleist","cosmet","cylind","dactyl","deuter","dogmat","erythr","galact","hendec","ichthy","mening","myrmec","omphal","opisth","opoter","ornith","ostrac","persic","phalar","phaner","phragm","plinth","prasin","presby","rhynch","scalen","strept","stroph","thalam","theori","trachy","trapez","tympan","aesthet","anthrop","branchi","cleithr","epistem","parthen","phalang","pharmac","porphyr","sacchar","sphinct","stalact","stalagm","thalass","oesophag","ophthalm","physalid","pentecost","treiskaidek"];function g(t){return t<=1?4:t<=7?2/6*(t-1)+4:t<=8?1*(t-7)+6:3/8*(t-8)+7}function m(t){let e=0,i=a(t.text);i.has("#Verb")&&(e+=.5),i.has("#Acronym")&&(e+=.8);let n=function(t){let e=t.length;if(e<5)return 0;for(let i of d){if(i.length>=e-3)return 0;if(i==t.substring(0,i.length))return i.length}return 0}(t.text);return n>1&&(e+=n/10),Math.min(1,Math.min(e,1))}function f(t,e){return g(t.text.length)*(e+1)}function b(t){return 1e3/(t/60*4.7)}class v{constructor(t){let e=null,i=null;const n=new Promise(((n,s)=>(e=s,i=n,t(n,s))));return n.cancel=e,n.resolve=i,n}}class y{constructor(t){this.afkChain=new Map,this.activeChain=new Map,this.idleTime=t,this.isIdle=!1;["load","mousemove"].forEach((t=>{window.addEventListener(t,(t=>this.reset()))}))}generateActionKey(t){return null==t&&(t=this.afkChain.size),t}onAfk(t,e){return this.afkChain.set(this.generateActionKey(e),t),this}onActive(t,e){return this.activeChain.set(this.generateActionKey(e),t),this}reset(){return clearTimeout(this.t),this.t=setTimeout((()=>this.idle()),this.idleTime),this.active(),this}idle(){return!this.isIdle&&(this.isIdle=!0,w(this.afkChain),this)}active(){return!!this.isIdle&&(this.isIdle=!1,w(this.activeChain),this)}}function w(t){for(const[e,i]of t.entries())i()}function x(t){if(!t)return!1;(t=e(t)).textContent;let i="";for(let e of t.textContent.split(" ")){console.log(typeof e),i+=0!=e.replace(/\s/g,"").length?"<w>"+e.split(" ").join("</w> <w>")+"</w> ":e}t.html(i)}function k(t){let i=(t=e(t)).findAll("*");if(0==i.length)return x(x(t));i.forEach((t=>k(t)))}function _(t){let i=(t=e(t)).findAll("p, div, h1, h2, h3, h3, h4, h5, article, text");return 0==i.length?k(t):(i.forEach((t=>_(t))),!0)}const P=8,T=8;function C(t=0,e=0){return e>P?t:t*(P-e)/T+t}function I(t,e,i){for(var n=[t],s=t;s<e;)n.push(s+=i||1);return n}var E=Object.freeze({__proto__:null,PinkyPromise:v,Idle:y,range:I,isOnScreen:l,isMostlyInScreen:function(t,e=.5){if(!t)throw i.throwSoft(`couldnt not evaluate if [${t}] is on screen`);return l(t=h(t),e*t.rect().height)},scrollTo:c,onScroll:u,crush:g,generateDifficultyIndex:m,wordValue:f,charsMsAt:b,wfy:_,airway:C});class S extends t{constructor(){super(arguments)}get lector(){return this}get mark(){return this._mark}set mark(t){this.adopt(t),this._mark=t}get settings(){return this._settings}set settings(t){this.adopt(t),this._settings=t}get isReading(){return this.w.isReading}get currentWord(){return this.w.currentWord}get currentParent(){return this.currentWord.parent}connectTo(t){return this.w=t,this.add(t),this}removeWord(t){console.log("> remove",t),this.w.remove(t)}addWord(t,e=!0){return this.w.add(t),e&&(this.w.value=t.key),this}toggle(){return this.isReading?this.pause():this.read()}read(){if(i.log("::LECTOR reading",this),!this.w.hasKids)return console.error("nothing to read");console.log(this.w),this.w.read()}summonTo(t){this.currentParent.value+=t,this.currentWord.summon()}goToNext(){this.summonTo(1)}goToPre(){this.summonTo(-1)}pause(){this.w.pause()}setFont(t){console.log(this.w),this.w.css(`font-family ${t}`)}}class A extends t{constructor(t){super(t),this.do((function(){this.hasKids&&this.parent&&(this.parent.value=this.key)}))}destroy(){return this.childMap=null,null}get lector(){if(this.parent)return this.parent.lector;i.throwSoft("could not find lector for")}get txt(){return this.text}get index(){return parseInt(this.key)}get mark(){return this.parent?this.parent.mark:null}set mark(t){return this.parent&&(this.parent.mark=t),null}get isReading(){return null!=this.currentPromise}get currentWord(){if(!this.hasKids)return this;let t=this.get(this.value);return t?t.currentWord:i.throwSoft(`Could not find current Word of ${this.key}`)}getFromBottom(t){return this.get(this.kidsum-t)}sibling(t){if(!this.parent)return null;let e=this.parent.get(this.index+t);return e||(console.log(this.parent),t<0?this.parent.sibling(-1).getFromBottom(t):this.parent.sibling(1).get(t))}get next(){return this.sibling(1)}get pre(){return this.sibling(-1)}isInTheSameLine(t){return null!=this.sibling(t)&&(this.sibling(t).top-this.top)**2<10}get isFirstInLine(){return!this.isInTheSameLine(-1)}get isLastInLine(){return!this.isInTheSameLine(1)}time(t=250){return b(t)*f(this,m(this))}pause(){return new v((t=>{this.currentPromise?(this.currentPromise.catch((e=>{this.mark.pause().catch((t=>{console.warn("prevent pause event from bubbling. Chill on the keyboard bro",t)})).then((()=>{this.currentPromise=null,t("done pausing"),console.log("- - - - - PAUSED - - - - - - - -")}))})),this.currentPromise.cancel("pause")):t("already paused")}))}set currentPromise(t){if(this.parent)return this.parent.currentPromise=t;this.currentPromiseVal=new v(((e,i)=>{t.catch((t=>{console.warn(t)})).then((()=>{e(),this.currentPromiseVal=null}))}))}get currentPromise(){return this.parent?this.parent.currentPromise:this.currentPromiseVal}promiseRead(){return this.currentPromise=new v(((t,e)=>{console.time(this.text),this.mark.guide(this).then((()=>{console.timeEnd(this.text),this.parent.value=this.index+1,t(` read [ ${this.text} ] `)})).catch((t=>{console.warn("rejected promise read",t),e(t)}))})),this.currentPromise}read(){return this.currentPromise?new Promise(((t,e)=>{t("already reading")})):this.hasKids?this.currentWord?this.currentWord.read():(this.next.value=0,this.next.read()):(this.promiseRead(),new v((t=>{this.currentPromise.then((()=>(t(),this.currentPromise=null,this.parent.read()))).catch((e=>t("pause")))})))}summon(t=!1){return!this.hasKids&&(console.log("SUMMONING",this),this.parent.pause().catch((()=>console.log("no need to pause"))).then((()=>{this.mark.mark(this,50,!0),t||(this.parent.value=this.index)})))}}const z={hotbox:t=>`background ${t}`,underneath:t=>` background transparent\n                        border-bottom 3px solid ${t}\n                        border-radius 4px`,faded:t=>`\n      background: rgb(255,255,255);\n      background: -moz-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${t} 25%, ${t} 75%, rgba(255,255,255,0) 100%);\n      background: -webkit-linear-gradient(90deg, rgba(255,255,255,0) 0%, ${t} 25%, ${t} 75%, rgba(255,255,255,0) 100%);\n      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, ${t} 25%, ${t} 75%, rgba(255,255,255,0) 100%);\n    `};const F=(t,e=t._mode,i=t._color)=>{let n=function(t,e){return"border 0\n               border-radius 3px\n               z-index 10\n               opacity 1\n               mix-blend-mode darken;"+z[t](e)}(e=(e||"hotbox").toString().toLowerCase(),i);return t&&t.css(n),n};class L extends t{constructor(){super("marker"),this.element=e("marker"),this.appendTo("body"),this.hide(),this.css("\n  position absolute\n  outline solid 0px red\n  background-color #ffdf6c\n  width 10px\n  height 20px\n  z-index 10\n  opacity 1\n  mix-blend-mode darken\n  border-radius 3px\n"),this.currentlyMarking=null,window.addEventListener("resize",(()=>{this.mark(this.last_marked,0)})),this.runningFor=0,this.pausing=!1}hide(){this._hidden||(this._hidden=!0,this.element.hide())}show(){this._hidden&&(this._hidden=!1,this.element.show())}set last_marked(t){this.value=t}get last_marked(){return this.value}get settings(){return this.parent?this.parent.settings:console.error("mark has no settings attached")}get cw(){return 30*this._fovea}get wpm(){return this._wpm||260}setMode(t){this._mode=t,F(this)}setWpm(t){this._wpm=t}setColor(t){this._color=t,F(this)}setFovea(t){this._fovea=t,this.css(`width ${this.cw}px`)}pause(){return new Promise(((t,e)=>{if(this.pausing)return e("already pausing");if(this.pausing=!0,this.currentlyMarking&&this.current_anime&&this.last_marked){let i=this.last_marked;console.log("mark was running for",this.runningFor),this.runningFor=0,this.current_anime.complete(),this.current_anime.remove("marker"),this.mark(i,80,!0).then((()=>{t("paused")})).catch((t=>{e("could not mark")})).then((t=>{this.pausing=!1}))}}))}moveTo(t,e,i=(()=>{})){return this.show(),this.currentlyMarking?new Promise(((t,e)=>t())):new Promise(((n,s)=>{this.currentlyMarking=t,this.current_anime=o({targets:this.element,left:t.left,top:t.top,height:t.height,width:t.width,easing:t.ease||"easeInOutExpo",duration:e,complete:t=>{this.currentlyMarking=null,i(),n()}})}))}mark(e,i=200,n=!1,s="easeInOutExpo"){if(!(e instanceof t))return new Promise((t=>{console.warn("cannot mark"),t("error")}));let r=n?e.width+5:this.cw;return this.moveTo({top:e.top,left:e.x(r),height:e.height,width:r,ease:s},i,(()=>{this.last_marked=e}))}guide(e){return e instanceof t?new v(((t,i)=>{let n=e.isFirstInLine?"easeInOutExpo":"linear";return this.moveTo({top:e.top,left:e.x(this.width)-e.width/2,height:e.height,width:this.cw,ease:n},this.calcDuration(e,1)).then((()=>{this.last_marked=e,this.runningFor+=1,this.mark(e,this.calcDuration(e,2),!1,"linear").then((()=>{t()}))}))})):new Promise(((t,e)=>{console.warn("cannot guide thru"),e("error")}))}calcDuration(e,i=1){if(!(e instanceof t))return this.throw(`Could not calculate marking duration for [${e}] since it does not appear to be a Pragma Object`);if(1!=i&&2!=i)return this.throw(`Could not calculate duration for ${e.text} since dw was not 1 or 2`);if(e.isFirstInLine)return 500;if(!this.last_marked)return 0;const n=1==i?.4:.6;let s=(1==i?this.last_marked:e).time(this.wpm);return[t=>t*n,C].forEach((t=>{s=t(s,this.runningFor)})),s}}function M(r,o,a={}){return n("infinity paginator").from(function(n,s={}){return(new t).from(i.createTemplate({pageTemplate:n,fetch:"function"==typeof s.fetch?s.fetch:t=>{i.throwSoft("no fetch source specified")},onCreate:"function"==typeof s.onCreate?s.onCreate:t=>i.log("created",t),onFetch:s.onFetch,onPageAdd:null,onPageRender:null,onPageActive:"function"==typeof s.onPageActive?s.onPageActive:function(t,e){i.log("active",t)},onPageInactive:"function"==typeof s.onPageInactive?s.onPageInactive:function(t,e){i.log("inactive",t)}})).run((function(){let t=e(this.pageTemplate).hide();this.pageTemplate=t.cloneNode(!1),this._clonePage=function(){let t=e(this.pageTemplate.cloneNode(!1)).show();return this.adopt(t),t.lec=this.parent,i.createEventChains(t,"fetch"),t},this.create=function(t=this.value,e="append"){let i=this._clonePage();new Promise((e=>{this.onCreate(i,t);let n=this.fetch(t),r=s.onFetch||function(t,i){t.html(i),e(t)};const o=i=>{let n=this.pages.get(t);n&&(r(n,i),e(n))};n instanceof Promise?n.then((t=>{o(t)})):o(n)})).then((e=>{e.fetchChain.exec(),this.onPageRender&&this.onPageRender(e,t)})),i[`${e}To`](this.parent.element),this.addPage(i,t)},this.pages=new Map,this.destroy=function(t){let e=this.pages.get(t),i=i=>{e=this.pages.get(t),this.delPage(t),e.destroy()};if(this.onPageDestroy){let n=this.onPageDestroy(e,t);if(n instanceof Promise)return n.then(i)}i()},this.addPage=function(t,e){e=null===e?this.pages.size:e,this.onPageAdd&&this.onPageAdd(t,e),this.pages.set(e,t)},this.delPage=function(t){return this.pages.delete(t)},this.activate=function(...t){t.forEach((t=>{let e=this.pages.get(t);e&&(e.active=!0,this.onPageActive(e,t))}))},this.inactivate=function(...t){t.forEach((t=>{let e=this.pages.get(t);e&&(e.active=!1,this.onPageInactive(e,t))}))},this.goTo=function(t,e){this.value,this.value=t;let i=this.pages.get(t);i.onRender((function(){c(i,e||20)}))},this.export("pageTemplate","_clonePage","create","destroy","pages","addPage","delPage","activate","inactivate","goTo")}))}(o,i.objDiff({streamer:r,fetch:r.fetch},a))).setValue(0).run({initialConfig(){const t=10,e=5;this.fill=function(){this.fetching=!0;let n=I(this.value>=t?this.value-t:0,this.value+t),r=Array.from(this.pages.keys()),o=i.aryDiff(n,r),a=i.aryDiff(r,n),h=o.filter((t=>t>this.value)),l=i.aryDiff(o,h);console.log(">> DEL",a),console.log(">> ADD AFTER",h),console.log(">> ADD BEFORE",l),s((t=>{for(let t of h)this.create(t,"append")}),(t=>{for(let t of l.reverse())this.create(t,"prepend")}),(t=>{for(let t of a)this.destroy(t)})),setTimeout((t=>{this.fetching=!1,console.log(this.pages)}),e)}},findActivePages(){this.findActivePage=function(t,e){return new v((e=>{e(function(t,e){let i=null,n=999999999999;const s=e+window.innerHeight/2;for(let[e,r]of t){let t=r.top+r.height/2,o=Math.abs(t-s);o<=n&&(n=o,i=e)}return i}(this.pages,t))}))};let t=!1,e=!1;const i=(n,s)=>{if(!this.fetching){if(t)return e={pos:n,dp:s};t=!0,this.findActivePage(n,s).then((n=>{this.value=n,t=!1,e&&(i(e.pos,e.dp),e=null)}))}};p(((t,e)=>{i(t,e)})),u(((t,e)=>{Math.abs(e)>40&&t<350&&i(t,e)}))}}).do((function(){if(0===this.dv)return;this.activate(this.value);let t=this.value-(this.dv||1);this.inactivate(t),this.fill()}))}const V={onOptionCreate:function(t,e){t.contain(e)},optionTemplate:function(t){return n(t).html(t).addClass("pragma-click").on("click").do((function(){this.parent.value=this.key}))}},O=t=>n().run((function(){let e=t.options;if(!e)return i.throwSoft("need to define options when creating a select template");let n=t.onOptionCreate||V.onOptionCreate,s=t.optionTemplate||V.optionTemplate;if(e.constructor===Array)for(let t of e)n(this,s(t));else for(let[t,i]of Object.entries(e)){const e={[t]:i};n(this,s(t,i),e)}this.onExport((function(t){t.contain(...this.children)})),this.export("elementDOM","actionChain","exportChain","exports")}));var D='@charset "utf-8";.pragma-slider{user-select:none;cursor:grab}.pragma-slider:active{cursor:grabbing}.pragma-slider-bg{width:100%;height:8px;background:rgba(66,66,66,0.5);border-radius:15px}.pragma-slider-bar{height:100%;width:25%;background:#0074D9;position:relative;transition:all .05s ease;border-radius:15px}.pragma-slider-thumb{width:18px;height:18px;border-radius:25px;background:#f1f1f1;transition:all .05s ease;position:absolute;right:0;top:50%;bottom:50%;margin:auto}',$="@charset \"utf-8\";@import url(https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300&display=swap);.glass-block,.lector-mini-settings,.lector-settings,.glass-block-border{background:rgba(35,35,35,0.55);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:5px;padding:20px 40px;color:whitesmoke}.glass-block-border{border:1px solid rgba(255,255,255,0.18)}.fixed-bottom-box,.lector-mini-settings,.lector-settings{position:fixed;bottom:20px}.lector-settings{left:-10px;padding-left:40px;transition:all .2s;font-family:'Poppins','Inter','Arial Narrow',Arial,sans-serif}.lector-settings .pragma-input-element{display:flex;flex-direction:column;width:fit-content;justify-content:center}.lector-settings .section{margin:20px 0}.lector-settings .section:hover>.pragma-label{opacity:1}.lector-settings .section .pragma-label{opacity:0;transition:all .2s ease;position:absolute;left:25%;margin-top:-55px;font-size:12px;color:whitesmoke}.lector-settings .section .pragma-label .option-title{color:rgba(199,199,199,0.92)}.lector-settings #fovea{height:fit-content;padding:10px}.lector-settings #fovea .pragma-label{margin-top:-25px}.lector-settings #wpm .pragma-label{position:relative;left:0;margin:0;opacity:1;font-size:18px}.lector-mini-settings{right:-10px;padding-right:40px}.settings-input{display:flex;flex-direction:column;align-items:center}.pragma-input-text{font-family:'Poppins',sans-serif;font-size:18px;border-style:none;outline:none;color:whitesmoke;background:#1515157b;border-radius:2px;margin:5px 10px;padding:7px 9px;text-align:center}.active-select-template{display:flex;flex-direction:row;flex-wrap:no wrap;justify-content:space-around;align-items:center;width:100%;padding:10px}.active-select-template .option{user-select:none;cursor:pointer}.active-select-template .active{opacity:1 !important}.active-select-template .inactive{opacity:.5 !important}";function W(t={}){this._n=function(){let t=this.range||{min:1,max:100};return 100/(t.max||100-t.min||1)},this.do((function(){this.element.setData({value:this.value}),this._setBarTo(this.value*this._n())})),this._setBarTo=t=>{this._bar.css(`width ${t}%`),this._thumb.offset()},this._clipValue=t=>{let e=Math.round(t/this._n());this._lv!==e&&(this.value=e)},this._input=e("div.").addClass("pragma-slider-bg"),this._bar=e("div.").addClass("pragma-slider-bar"),this._thumb=e("div.pragma-slider-thumb"),this._bar.append(this._thumb),this._input.append(this._bar);let i=function(){this._clicked=!0};this._input.listenTo("mousedown",i),this._thumb.listenTo("mousedown",i),document.addEventListener("mouseup",(()=>{this._input._clicked=!1}));let n=!1;document.addEventListener("mousemove",(t=>{this._input._clicked&&!n&&(window.requestAnimationFrame((()=>{n=!1;let e=t.pageX-this._input.offset().left,i=Math.round(100*Math.min(e/this._input.rect().width,1));this._clipValue(i)})),n=!0)})),this.adopt(this._input),this.append(this._input),this.element.addClass("pragma-slider")}function R(n={}){return(new t).from(i.createTemplate(n)).run({makeChains(){i.createChains(this,"userInput")},makeInput(){this.input=e("<input type='text'></input>").addClass("pragma-input-text"),this.setValue=function(t){let e=this.valueSanitizer?this.valueSanitizer(t):t;if(e!==this._lv)return this.value=e,this.value!=e&&this.updateFront(),this},this.input.listenTo("focus",(function(){this.parent._listenToEsc=document.addEventListener("keydown",(t=>{"Enter"===t.key&&this.blur()}))})),this.input.listenTo("focusout",(function(){this.parent.setValue(this.value),this.parent.userInputChain.exec(this.parent.value),document.removeEventListener("keydown",this.parent._listenToEsc)})),this.export("actionChain","input","setValue","userInputChain","onUserInput"),this.onExport((t=>{t.adopt(this.input),t.append(this.input)}))},extend(){this.updateFront=function(t=this.value){this.input.value=t,this.input.placeholder=t},this.export("updateFront")}}).do((function(){this.updateFront(this.value)})).run((function(){this.setInputAttrs=function(t){for(let[e,i]of Object.entries(t))this.input.attr(e,i);return this},this.setValueSanitizer=function(t){return this.valueSanitizer=t,this},this.export("setInputAttrs","setValueSanitizer")}))}function j(t={}){this.setLabel=function(t){return this._label.html(t),this},this._label=e("div.pragma-label",t.label),this.append(this._label)}function N(){i.createChains(this,"idle","active"),this.setIdleTime=function(t=5e3){var e,i;return this._idler=(e=()=>{this.idleChain.exec()},i=()=>{this.activeChain.exec()},new y(t).onAfk((()=>{console.log("user is afk"),e&&e()})).onActive((()=>{console.log("user is back"),i&&i()}))),this},this.extend("onIdle",(function(){return this._onIdle(...arguments),this})),this.extend("onActive",(function(){return this._onActive(...arguments),this}))}i.addStyles(D);const K={"#a8f19a":"bez","#eddd6e":"roz","#edd1b0":"mua","#96adfc":"fua"},U=Object.keys(K),B=["Helvetica","Open Sans","Space Mono"],H=["HotBox","Underneath","Faded"];var q=["+","="],Y=["-"],G="]",Q="[";function X(t,e){t.find(e).removeClass("active").addClass("inactive")}function J(){this.run(j),this._labelTemplate=t=>t,this.setLabelTemplate=function(t){return this._labelTemplate=t,this},this.setLabelName=function(t){return this._labelName=t,this},this.do((function(){let t=this._labelTemplate(this.value);this.setLabel(`<span class='option-title'>${this._labelName}:</span> ${t}`)}))}const Z=(t={})=>n().from(O(i.objDiff({onOptionCreate:(t,e)=>{t.contain(e),e.addClass("option"),X(t,e.key)}},t))).addClass("active-select-template").do((function(){var t,e;this.value!==this._lv&&(t=this,e=this.value,t.find(e).addClass("active").removeClass("inactive"),this._lv&&X(this,this._lv))}));const tt={wfy:!0,pragmatizeOnCreate:!0,experimental:!1,settings:!1,defaultsStyles:!0},et=t=>{let e=new L;let i=!1,n=0;function s(){return n-Date.now()>-10}let r=0;return u((e=>{if(n=i?n:Date.now(),s()&&t.isReading){let i=Math.abs(r-e);r=e,i>40&&t.pause()}})),e.on("mouseover",(function(){console.log(this,"hover")})),e.do((function(t){}),(function(n){if(s()||l(e.element)||i)return!1;i=!0;let r=[];t.isReading&&(t.pause(),r.push((()=>{t.read()}))),r.push((()=>{})),c(e).then((()=>{r.forEach((t=>t())),i=!1}))})),e},it=(t,e)=>{let i=new A(e).as(t).setValue(0),n=i.element.deepQueryAll("w");return e&&0===n.length&&i.addListeners({click:function(t,e){this.summon()}}),n.forEach(((t,e)=>{let n=it(t,e);i.add(n)})),i},nt=(t,s=tt)=>{t=e(t),s.wfy&&_(t);let r=it(t),o=new S("lector").as(t).setValue(0).connectTo(r);return o.mark=et(o),s.settings&&(o.settings=function(t){const e={changeColor(e=this.value){o.update(e),r.update(e),t.mark.setColor(e)},changeFovea(e=this.value){t.mark.setFovea(e)},changeWpm(e=this.value){t.mark.setWpm(e)},changeFont(e=this.value){t.setFont(e)},changeMode(e=this.value){t.mark.setMode(e)},changePage(e=this.value){t.paginator.goTo(e)}};let s=n("settingsWrapper").addClass("items-center","lector-settings").run((function(){this.value={},this._setVal=function(t){this.value=i.objDiff(this.value,t)},this.set=function(t){this._setting=!0;for(let[e,i]of Object.entries(t)){let t=this.find("!"+e);t&&(t.value=i)}this._setting=!1},this.get=function(t){return this.value[t]}})),r=n("!fovea").addClass("section").run(J,W).setRange(2,10).setValue(5).setLabelName("Pointer Width").do(e.changeFovea).run((function(){this.update=function(t){this._bar.css(`background-color ${t}`)}})),o=n("!mode").from(Z({options:H,optionTemplate:t=>n(t).css("width 35px;\n                              height 20px;\n                         ").on("click").do((function(){this.parent.value=this.key})).run((function(){this.update=e=>{F(this,t,e),this.css("mix-blend-mode normal")}}))})).run((function(){this.update=function(t){this.children.forEach((e=>e.update(t)))}})).run(J).setLabelName("Pointer mode").addClass("section").do(e.changeMode),a=n("!color").from(Z({options:U,optionTemplate:t=>n(t).css(`\n                                width 25px\n                                height 25px\n                                border-radius 25px\n                                background-color ${t} \n                              `).on("click").do((function(){this.parent.value=this.key}))})).addClass("section").run(J).setLabelName("Pointer Color").setLabelTemplate((t=>K[t])).do(e.changeColor),h=n("!font").run((function(){console.log(this.key)})).from(Z({options:B,optionTemplate:t=>n(t).html("Aa").css(`font-family ${t}`).on("click").do((function(){this.parent.value=this.key}))})).css("flex-direction row").addClass("section").do(e.changeFont),l=n("!wpm").import(R).run(j).addClass("settings-input","section").setInputAttrs({maxlength:4,size:4}).setValueSanitizer((t=>parseInt(t))).setId("wpm").setLabel("wpm").setRange(40,4200).setValue(250).bind(q,(function(){this.value+=10})).bind(Y,(function(){this.value-=10})).do(e.changeWpm),c=n("!page").import(R).run(j).setInputAttrs({maxlength:4,size:4}).addClass("settings-input","section").setValueSanitizer((t=>parseInt(t))).setLabel("page").run((function(){i.createChains(this,"userEdit"),this.editValue=function(t){this.value=t,this.userEditChain.exec(this.value)},this.onUserEdit(e.changePage)})).run((function(){this.onUserInput((t=>{console.log(t),this.editValue(t)}))})).setValue(1).bind(G,(function(){this.editValue(this.value+1)}),"keyup").bind(Q,(function(){this.editValue(this.value-1)}),"keyup"),u=n("mini-settings").addClass("lector-mini-settings").contain(c).pragmatize(),p=n("popupsettings").contain(h.setId("font"),a.setId("color"),o.setId("mode"),r.setId("fovea")).run((function(){this.show=function(){this.hidden=!1,this.element.show()},this.hide=function(){this.hidden=!0,this.element.hide()},this.toggle=function(){this.hidden?this.show():this.hide()},this.show()})).bind("h",(function(){this.toggle()}));s.contain(p,l),s.adopt(u);let d=n("fader").run(N,(function(){this.elements=[],this.include=function(){return this.elements=this.elements.concat(Array.from(arguments)),this}})).setIdleTime(3e3).include(s,u).onIdle((function(){this.elements.forEach((t=>{t.css("opacity 0")}))})).onActive((function(){this.elements.forEach((t=>t.css("opacity 1")))}));return s.fader=d,s.allChildren.forEach((t=>{var e;(e=t).key&&0===e.key.indexOf("!")&&t.do((e=>s._setVal({[t.key.substring(1)]:t.value})))})),s.do((function(){this._setting||console.log("syncing",this.value)})),s.set({color:U[1],font:B[1],mode:H[2],fovea:4,wpm:420}),s.pragmatize()}(o)),s.pragmatizeOnCreate&&o.pragmatize(),s.experimental&&globalThis.pragmaSpace.mousetrapIntegration&&(o.bind("right",(t=>o.goToNext())),o.bind("left",(t=>o.goToPre())),o.bind("space",(t=>!1),"keydown"),o.bind("space",(function(){return this.toggle(),!1}),"keyup")),o};const st=(t,s=tt)=>{if(!(r=s).stream&&!r.paginate)return nt(t,s);var r,o;if(i.log("configuration appears to be a bit more complicated"),s.defaultStyles&&(console.log("adding styles",$),i.addStyles($)),s.experimental&&s.stream&&s.paginate&&"stream"===s.paginate.from&&"infiniteScroll"===s.paginate.as){i.log("setting up streamer service");let r=(o=s.stream,n("streamer").setValue(0).run((function(){this.fetch=o,this.getContent=function(){return this.fetch(this.value)}}))),a=M(r,t,s.paginate.config||{}),h=nt(e(t).parentElement,s).adopt(a,r);if(h.paginator=a,h.settings){console.log("lector has settings! connecting paginator's value to pagecomp"),h.settings.find("!page").wireTo(h.paginator)}return console.log("paginator",a),a.fill(),h}};function rt(){const t={Lector:st,Word:it,_e:e,_p:n,util:i,lecUtil:E,_thread:r};for(let[e,i]of Object.entries(t))globalThis[e]=i}export{st as Lector,it as Word,rt as globalify,E as helpers};
