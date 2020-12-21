import $ from "jquery"
import { greek_prefixes } from "./greek"
import nlp from 'compromise'

function crush(n) {
  const xa = 1; const ya = 4; const xb = 7; const yb = 6; const xc = 8; const yc = 7; const xd = 16; const yd = 10;
  if (n <= xa) return ya
  if (n <= xb) return ((yb - ya) / (xb - xa)) * (n - xa) + ya
  if (n <= xc) return ((yc - yb) / (xc - xb)) * (n - xb) + yb
  return ((yd - yc) / (xd - xc)) * (n - xc) + yc
}

function generateDifficultyIndex(word) {
  // returns 0-1 with 0 being not difficult at all
  let d = 0
  let w = nlp(word.text())
  if (w.has('#Verb')) {
    d += .5
  }
  if (w.has('#Acronym')) {
    d += .8
  }
  let greekF = howGreek(word.text())
  if (greekF > 1) {
    d += greekF / 10
  }
  return Math.min(1, Math.min(d, 1));
}

function wordValue(word, d) {
  return crush(word.text().length) * (d + 1)
}

function charsMsAt(wpm) {
  const avgCharsInWord = 4.7
  return 1000 / ((wpm / 60) * avgCharsInWord)
}

function howGreek(word) {
  let length = word.length
  if (length < 5) return 0
  for (let prefix of greek_prefixes) {
    if (prefix.length >= length - 3) return 0
    if (prefix == word.substring(0, prefix.length)) return prefix.length
  }
  return 0
}

export { crush, generateDifficultyIndex, wordValue, charsMsAt }
