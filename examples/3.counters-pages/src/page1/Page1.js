import * as R from "ramda"
import React from "react"
import {Observable as O} from "rxjs"
import * as D from "selfdb"
import * as F from "framework"

export default (sources, key) => {
  let intents = {
    // unsubscribed on state unsubscribe which happens on willUnmount
    inc$: sources.DOM.fromKey("inc").listen("click"),
    dec$: sources.DOM.fromKey("dec").listen("click"),
  }

  let state = R.run(
    () => D.makeStore({name: "page1.counter"}),
    D.withLog({}),
    D.withMemoryPersistence({key: "page1.counter"}),
  )(O.merge(
    F.init(0),
    intents.inc$.map(_ => R.inc),
    intents.dec$.map(_ => R.dec),
  ))

  let DOM = F.connect(
    {counter: state.$},
    (props) =>
      <div>Page 1: {props.counter} <button data-key="inc">+1</button> <button data-key="dec">-1</button></div>,
    {
      componentWillMount(...args) {
        console.log("Page1 will mount!")
      },
      componentWillUnmount(...args) {
        console.log("Page1 will unmount!")
      }
    }
  )

  return {DOM}
}
