import * as F from "framework"
import * as R from "ramda"
import K from "kefir"
import React from "react"
import * as D from "selfdb"

// Decorate app with `F.withLifecycle` to handle lifecycle events declaratively (`sources.Component`)
export default F.withLifecycle((sources, key) => {
  let intents = {
    // unsubscribed on state unsubscribe which happens on willUnmount
    inc$: sources.DOM.fromKey("inc").listen("click").map(R.always(true)),
    dec$: sources.DOM.fromKey("dec").listen("click").map(R.always(true)),
  }

  // No need to unsubscribe here
  sources.Component.willMount$.observe(() => {
    console.log("Page2.app: Component.willMount$")
  })
  sources.Component.willUnmount$.observe(() => {
    console.log("Page2.app: Component.willUnmount$")
  })

  let state$ = D.run(
    () => D.makeStore({}),
    D.withLog({key}),
    D.withLocalStoragePersistence({key: "3.2.router." + key}),
  )(
    D.init(0),
    intents.inc$.map(_ => R.inc),
    intents.dec$.map(_ => R.dec),
  ).$

  let Component = F.connect(
    {counter: state$},
    ({counter}) =>
      <div>
        Page 2: {counter} <button data-key="inc">+1</button> <button data-key="dec">-1</button>
        <p><i>Local Storage persistence</i></p>
      </div>
  )

  return {Component}
})
