import { Pragma } from "pragmajs"

function stacktrace() {
    return (new Error()).stack.split('\n').reverse().slice(0, -2);
}

export class PragmaConsole extends Pragma {
    static unskip() {
        PragmaConsole._skip = false
    }
    static skip() {
        PragmaConsole._skip = true
    }

    static intercept() {
        PragmaConsole.oldGlobalConsole = window.console;

        window.console = new Proxy(window.console, {
            get(target, property) {
                return function () {
                    if (PragmaConsole._skip) return null
                    if (typeof PragmaConsole[property] === 'function')
                        PragmaConsole[property].bind(target)(...arguments)
                    else
                        target[property](...arguments)
                }
            }
        })
    }

    static release() {
        window.console = PragmaConsole.oldGlobalConsole;
    }

    static log(title, ...parameters) {

        const at = `%c⇝ ${stacktrace()[0].trim()}\n`
        const cssStack = "color: #3D9970; font-size: 10px; font-style: italic; "
        if (typeof title === 'string' && title[0] == "@") {
            this.group(title)
            title = ["%c" + title, "font-size: 12px; font-style: bold;"]
        } else {
            parameters = [title].concat(parameters)
            title = null
        }


        this.log(at, cssStack, ...parameters.map(p => p))
        if (title) this.groupEnd()
    }

    static timeEnd() {
    }

    static debug() {
        
    }
    
    static error() {
        
    }
    
    // log, warn, assert, clear, context, count, countReset
    // debug, dir, dirxml, group, groupCollapsed, groupEnd,
    // memory, profile, profileEnd, table, timeLog, timeStamp,
    // trace, warn
}
