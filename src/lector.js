import { _e, _p, Pragma, util, _thread, runAsync } from "pragmajs";
import {
  range,
  wfy,
  isOnScreen,
  scrollTo,
  visibleY,
  onScroll,
  firstVisibleParent,
} from "./helpers/index";
import { PragmaWord, PragmaLector, PragmaMark } from "./pragmas/index";
import { addSettingsToLector } from "./ui/lectorSettings";
import anime from "animejs";
import { popUpOb } from "./onboarding/popUpOb";

import * as _ext from "./extensions/index";

import css from "./styles/styles.json";
import {
  onScrollEnd,
  onGlobalScrollEnd,
  _scroller,
} from "./helpers/autoScroll";
import * as config from "./config/lector.config";
import icons from "../src/ui/icons.json";

const defaultOptions = {
  onboarding: false,
  wfy: true, // false if every word is already wrapped in <w> tags on initializaiton
  settings: false, // display a settings bar controlling the pointer's color, width, speed and more...
  defaultsStyles: true, // inject basic styles
  fullStyles: false, // will decoreate the background of the page, buttons & fonts
  debug: false, // true if you want to see the lector logs #! When false, it hides all the console.log of the page - this will be refactored in new versions
  hintPointer: true, // when the pointer is out of screen, display arrows on top/bottom of the window that hint its position
  autoscroll: true, // sroll the view intelligently
  disableWhenNotInView: false, // offload when not in view
  global: false, // true if you want multiple lectors in the same page
  experimental: false, // if true experimental features are enabled. Unstable.
  useDifficultyIndex: true,

  // EXPERIMENTAL (set experimental: true to enable these options)
  scaler: false, // if true, scales the view, if set to 'font-size' will scale the font size using em
  stream: false, // this options only makes sense if you have paginated pages
  paginate: false,
  /* 
    paginate: {
      from: 'stream',
      as: 'infiniteScroll',
      config: { ... }
    }
  */
};

export function prod() {
  console.log =
    console.time =
    console.timeEnd =
    console.warn =
    console.error =
      () => {};
}

export function dev() {
  console.log("dev mode");
}

function addOnboardingToLector(lector) {
  lector._popUp = new popUpOb();
}

function connectToLectorSettings(lector, wire) {
  return new Promise((resolve, reject) => {
    lector.element.onRender(() => {
      if (!lector.settings) return reject("no settings present");
      let setting = lector.settings.pragmaMap.get(wire);
      if (setting) {
        // console.log(`@@@@ connected to ${wire} setting @@@@`)
        return resolve(setting);
      }

      reject("could not find setting");
    });
  });
}

const Mark = (lec, options) => {
  let autoScroller = _p().define({
    scrollIfNeeded() {
      return new Promise(async (resolve, reject) => {
        console.log("[|] checking if should auto scroll...");

        let currentWord = lec.currentWord;
        //console.log(
        //'is this auto scrolling',
        //this.isAutoScrolling,
        //'current word',
        //currentWord,
        //'current word is on Screen?',
        //isOnScreen(currentWord, config.scrollingThresholdToScroll)
        //)

        if (this.isAutoScrolling) return reject();

        if (
          !currentWord ||
          isOnScreen(currentWord.element, config.scrollingThresholdToScroll)
        ) {
          return resolve(false);
        }

        console.log("[|] performing auto scroll");

        // perform auto scroll
        this.isAutoScrolling = true;
        await this.autoScroll();
        //setTimeout(() => {
        console.log("[$] done auto scrolling");
        //.catch(() => console.warn('[X] failed to auto scroll'))
        //.finally(() => {
        this.isAutoScrolling = false;
        resolve(true);
        //}, 150)
        //})
      });
    },
    async autoScroll() {
      return await scrollTo(lec.currentWord);
    },
  });

  let mark = new PragmaMark(lec)
    .run(function () {
      this.autoScroller = autoScroller;
    })
    .define({
      correctBlueprint(current, last) {
        if (!last) return current;

        let currentCenter = current.top + current.height / 2;

        if (
          last.height / 2 < current.height &&
          currentCenter >= last.top &&
          currentCenter <= last.height + last.top
        ) {
          current.height = last.height;
          current.top = last.top;
        }

        return current;
      },
    })
    .run(function () {
      lec.appendToRoot(this.element);
      if (options.autoscroll) {
        lec.async.define({
          beforeSummon() {
            return new Promise(async (resolve) => {
              console.log("before read.... scrolling if needed");
              autoScroller
                .scrollIfNeeded()
                .then(() => {
                  console.log("before read.... wait 100 ms");
                  setTimeout(() => {
                    console.log("continuing");
                    resolve();
                  }, 100);
                })
                .catch(() => {
                  console.warn("tried to scroll, but already scrolling");
                });
            });
          },
          // beforeRead() {
          // return this.beforeSummon()
          // }
        });

        this.on("changeLine", () => {
          console.log("change line, scrolling if needed");
          autoScroller.scrollIfNeeded();
        });
      }
      // lec.on('beforeRead', () => {
      // autoScroller.scrollIfNeeded()
      // })
    });

  if (!options.hintPointer) return mark;
  let markedWords = new Set();

  let indicator = _e(`div#mark-indicator`)
    .listenTo("click", () => {
      console.log("current word", lec.currentWord);
      lec.summonToCurrentWord();
      // lec.read().then(() => {
      // lec.pause()
      // })
      // lec.currentWord.summon()
      // lec.summonToCurrentWord()
    })
    .html(`${icons["arrow-down"]}`);

  let indicatorAppended = false;

  let markDetective = _p()
    .define({
      unminimizeMark() {
        // reset marked words
        for (let w of markedWords) {
          if (!w) continue;
          console.log(w);
          // w.css(`background transparent`)
          w.removeClass("mark-is-here");
          markedWords.delete(w);
        }

        //lec.resetMark().then(() => {
        lec.mark.show();
        this.minimized = false;
        //})
      },

      minimizeMark() {
        lec.mark.hide();
        lec.currentWord?.addClass("mark-is-here");
        markedWords.add(lec.currentWord);
        this.minimized = true;
      },
    })
    .run(function () {
      this.minimized = true;
      lec.on("load", () => {
        lec.mark.on("mark", () => {
          if (!this.minimized) return;
          this.unminimizeMark();
        });
      });
    });

  let t;
  onGlobalScrollEnd(() => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      indicateMarkIfHidden();
    }, 750);
  }, 150);

  function indicateMarkIfHidden() {
    console.time("indicating mark");
    let _top = 1;
    let _bottom = -1;
    function findObscurer(p) {
      // if (visibleY(_e(p))) return false
      if (isOnScreen(p)) return false;
      let surface = firstVisibleParent(p);
      if (surface === p) return null;

      var topOf = (word) => word.element.top;

      return {
        surface,
        from:
          topOf(p) <= (surface.isPragmaWord ? topOf(surface) : window.scrollY)
            ? _top
            : _bottom,
      };
    }

    if (!lec.isReading) {
      let currentWord = lec.currentWord;
      let obscured = currentWord ? findObscurer(currentWord) : false;
      console.log("obscured by", obscured);
      if (obscured) {
        let fromTop = obscured.from === _top;
        if (obscured.surface.isPragmaLector) {
          if (!indicatorAppended) {
            // indicator.appendTo('html')
            indicator.appendTo(lec);
            indicatorAppended = true;
          }

          indicator[fromTop ? `addClass` : `removeClass`]("upwards");
        } else {
          obscured.surface
            .addClass("mark-obscurer")
            [fromTop ? `addClass` : `removeClass`]("from-top")
            [!fromTop ? `addClass` : `removeClass`]("from-bottom");
        }

        return console.timeEnd("indicating mark");
      }
    }

    console.log("DESTROYING INDICATOR", indicator);
    indicator.destroy();
    indicatorAppended = false;
    lec.element
      .findAll(".mark-obscurer")
      .forEach((e) =>
        e.removeClass(
          "mark-obscurer",
          "obscures-mark-from-top",
          "obscures-mark-from-bottom"
        )
      );

    console.timeEnd("indicating mark");
  }

  // markKeeper will pause and minimize mark if for some reason it goes out of screen
  // it also minimizes mark and highlights the current word via the markDetective
  let markKeeper = _p()
    .define({
      saveMark() {
        // pauses lector, and will disables mark-saving until next user scroll
        if (this._savedMark) return;

        this._savedMark = true;
        _scroller.onNext("scrollEnd", () => {
          this._savedMark = false;
        });

        lec.pause();
      },
    })
    .run(function () {
      onScroll((s, ds, event) => {
        // console.log('user is scrolling', userIsScrolling())
        // console.log(Math.abs(ds), config)
        if (lec.isReading) {
          console.log("ds", ds);
          if (Math.abs(ds) > config.scrollingThresholdToPauseMark) {
            this.saveMark();
          }
        } else {
          markDetective.minimizeMark();
          autoScroller.isAutoScrolling = false;
        }
      });
    });
  return mark;
};

//console.log(_e("#div").deepQueryAll.toString())
export const Word = (element, i, options = { shallow: false }) => {
  let w = new PragmaWord(i).as(element).setValue(0);

  function unhoverCluster(epicenter) {
    hoverCluster(epicenter, "remove");
  }
  function hoverCluster(epicenter, action = "add") {
    function spreadRight(element, cap = 1, iter = 0) {
      hover(element, iter);
      if (element.isInTheSameLine(1) && cap > iter) {
        let next = element.next;
        spreadRight(next, cap, iter + 1);
      }
    }

    function spreadLeft(element, cap = 1, iter = 0) {
      if (iter > 0) hover(element, iter);
      if (element.isInTheSameLine(-1) && cap > iter) {
        let pre = element.pre;
        spreadLeft(pre, cap, iter + 1);
      }
    }

    spreadRight(epicenter, 2);
    spreadLeft(epicenter, 2);

    function hover(element, depth) {
      element[`${action}Class`](`hover-${depth}`);
    }
  }

  let thisw = w.element.findAll("w");
  // thisw.forEach(w => {
  // console.log(w.parentNode, w)
  // console.log(w.parentNode == w)
  // })
  if (i != undefined && thisw.length === 0) {
    w.setData({ wordAtom: true });
    w.addClass("word-element");

    w.listenTo("click", function () {
      this.summon();
    })
      .listenTo("mouseover", function () {
        hoverCluster(this);
      })
      .listenTo("mouseout", function () {
        unhoverCluster(this);
      });
  }

  if (!options.shallow) {
    thisw.forEach((el, i) => {
      let ww = Word(el, i, { shallow: true });
      w.add(ww);
    });
  }

  return w;
};

export const Reader = async (l, options = {}) => {
  l = _e(l);

  if (options.wfy) await wfy(l);
  let w = Word(l);

  let lec = new PragmaLector("lector")
    // .createEvents('load')
    .as(l)
    .setValue(0)
    .connectTo(w);

  console.log("lector root is", lec.root);
  // console.log(`created lector ${lec}`)
  // console.log(`created word ${w}`)
  // console.log(w)

  lec.mark = Mark(lec, options);
  if (options.settings) addSettingsToLector(lec);
  // if (options.legacySettings) lec.settings = LectorSettings(lec)
  if (options.onboarding) addOnboardingToLector(lec);
  if (options.useDifficultyIndex) lec._useDifficultyIndex = true;
  if (options.global) {
    if (!window.globalLectorController) {
      window.globalLectorController = _p().define({
        getActiveLector() {
          let lec = this._activeLector;
          if (lec && isOnScreen(lec)) return lec;
          if (!this.lectors) return null;

          for (let lec of this.lectors) {
            if (isOnScreen(lec)) {
              this._activeLector = lec;
            }
          }

          return lec;
        },
        addLector(lec) {
          if (!this.lectors) this.lectors = new Set();

          lec.listenTo("click", () => {
            if (this._activeLector && this._activeLector !== lec)
              this._activeLector.pause();

            this._activeLector = lec;
            lec.resetMark();
          });

          this.lectors.add(lec);
        },
      });
    }

    window.globalLectorController.addLector(lec);
  }
  // if (options.settings) lec.settings = LectorSettings(lec)

  function bindKeys(globalScope = options.global) {
    let target;

    if (globalScope) {
      if (!window.globalLectorController)
        return console.error("could not listen on global scope");

      if (!window.globalLectorController.binded) {
        window.globalLectorController
          .define({
            bind(event, cb, action) {
              let combEvent = `${event}:${action}`;
              if (!this.bindMap.get(combEvent)) {
                this.bindMap.set(combEvent, cb);

                this._binder.bind(
                  event,
                  () => {
                    console.log(
                      "triggerting",
                      event,
                      "as",
                      this.getActiveLector(),
                      cb
                    );
                    // if (this.getActiveLector()) return this.getActiveLector().run(cb)
                    return cb.bind(this.getActiveLector())();
                    // cb.bind(this.getActiveLector())()
                  },
                  action
                );
              }

              console.log("global bind......", event);
              console.log(this.bindMap);
            },
          })
          .run(function () {
            this.binded = true;
            this.bindMap = new Map();
            this._binder = _p();
          });
      }
      target = window.globalLectorController;
    } else {
      target = lec;
    }

    console.log("binding.........................", target.bind.toString());
    target.bind("right", function () {
      this.goToNext();
    });
    target.bind("left", function () {
      this.goToPre();
    });

    target.bind(
      "space",
      function () {
        return false;
      },
      "keydown"
    ); // dont trigger the dumb fucken scroll thing
    target.bind(
      "space",
      function () {
        console.log("[space]", this);
        this.toggle();
        return false;
      },
      "keyup"
    );
  }

  function experiment() {
    if (globalThis.pragmaSpace.mousetrapIntegration) {
      bindKeys();
    }
  }

  // if (options.pragmatizeOnCreate) lec.pragmatize()
  if (options.experimental) experiment();

  return lec;
};

function _needWrapper(op) {
  return op.stream || op.paginate || op.scaler;
}

function _streamer(sf) {
  return _p("streamer")
    .setValue(0)
    .run(function () {
      this.fetch = sf;
      this.getContent = function () {
        return this.fetch(this.value);
      };
    });
}

export const Lector = async (target, options = {}) => {
  options = util.objDiff(defaultOptions, options);
  (options.debug ? dev : prod)();

  const injectStyles = options.styleInjector
    ? (...styles) => {
        for (let style of styles) options.styleInjector(style, css[style]);
      }
    : (...styles) => {
        for (let style of styles) util.addStyles(css[style], style);
      };

  if (options.defaultStyles) injectStyles("main", "slider", "settings");
  if (options.fullStyles) injectStyles("full");

  if (!_needWrapper(options)) {
    let r = await Reader(target, options);
    pragmaSpace.onDocLoad(() => {
      r.triggerEvent("load");
    });
    return r;
  }

  if (!options.experimental)
    return console.warn("EXPERIMENTAL FEATURES TURNED OFF");

  let lector;

  if (
    options.stream &&
    options.paginate &&
    options.paginate.from === "stream" &&
    options.paginate.as === "infiniteScroll"
  ) {
    console.log("setting up streamer service");

    let streamer = _streamer(options.stream);
    let paginator = _ext.infinityPaginator(
      streamer,
      target,
      options.paginate.config || {}
    );

    // let reader = _p()
    //               .as(_e(l).parentElement)

    // console.log('creating new lector')
    // console.log(l)
    // console.log(_e(l).parentElement)
    // let options = util.objDiff({ skip: true })
    console.log("crating reader...");

    lector = (await Reader(_e(target).parentElement, options)).adopt(
      paginator,
      streamer
    );

    console.log("lector is", lector);
    lector.paginator = paginator;

    connectToLectorSettings(lector, "page")
      .then((settingPragma) => {
        lector.paginator.do(function () {
          // console.log('changed page for paginator')
          settingPragma.triggerEvent("update", this.value);
          // settingPragma.updateDisplay(this.value)
        });
      })
      .catch();

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

  if (options.scaler) {
    lector ||= await Reader(target, options);

    let _scaler = new _ext.Scaler(lector.element);

    if (options.scaler === "font-size") {
      _scaler.define({
        _buildScaleCSS(value) {
          let em = value / 100;
          return `font-size ${em}em`;
        },
      });
    }

    lector.adopt(_scaler);
    lector.scaler = _scaler;

    connectToLectorSettings(lector, "scale").then((settingPragma) => {
      lector.scaler.on("scaleChange", (v) => {
        if (lector.scaler.currentPromise) {
          anime({
            targets: lector.mark.element,
            opacity: 0,
            duration: 40,
          });

          lector.scaler.currentPromise.then(() => {
            anime({
              targets: lector.mark.element,
              opacity: 1,
              duration: 150,
              easing: "easeInOutSine",
            });
            lector.resetMark();
          });
        }
        settingPragma.setScale(v);
      });
    });
  }

  pragmaSpace.onDocLoad(() => {
    lector.triggerEvent("load");
  });

  return lector;
};
