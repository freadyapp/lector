import { _e, util } from 'pragmajs'

// First a simple implementation of recursive descent,
// visit all nodes in the DOM and process it with a callback:
function walkDOM(node, callback) {
  if (node.nodeName != 'SCRIPT'
    && node.nodeName != 'STYLE') { // ignore javascript
    callback(node);
    for (var i = 0; i < node.childNodes.length; i++) {
      walkDOM(node.childNodes[i], callback);
    }
  }
}

export function wfy(element) {
  element.addClass('wfying')
  return new Promise(resolve => {
    // setTimeout(() => {
    console.time('wfying...')
    // wfyElement(element)
    var textNodes = [];
    walkDOM(element, function (n) {
      if (n.nodeType == 3) {
        textNodes.push(n);
      }
    })
    // simple utility functions to avoid a lot of typing:
    function insertBefore(new_element, element) {
      if (new_element === null) return
      element.parentNode.insertBefore(new_element, element);
    }
    function removeElement(element) {
      element.parentNode.removeChild(element);
    }
    function makeW(txt) {
      if (txt.length === 0) return null
      var s = document.createElement('w');
      s.appendChild(makeText(txt));
      return s;
    }
    function makeText(txt) { return document.createTextNode(txt) }

    for (var i = 0; i < textNodes.length; i++) {
      var n = textNodes[i];
      var txt = n.nodeValue;
      var words = txt.split(' ');

      // Insert span surrounded words:
      insertBefore(makeW(words[0]), n);
      for (var j = 1; j < words.length; j++) {
        insertBefore(makeText(' '), n); // join the words with spaces
        insertBefore(makeW(words[j]), n);
      }

      // Now remove the original text node:
      removeElement(n);
    }

    element.removeClass('wfying')
    resolve()
    console.timeEnd('wfying...')
  })
}
