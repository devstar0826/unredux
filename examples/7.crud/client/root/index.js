import * as F from "framework"
import * as D from "selfdb"
import * as R from "ramda"
import React from "react"
import {Observable as O} from "rxjs"
import router from "../router"

export let seed = {
  url: "",
  posts: {},
  users: {},
}

export default (sources, key) => {
  let contentSinks$ = D.deriveOne(sources.state$.pluck("url"),
    (url) => {
      let {mask, params, payload: app} = router.doroute(url)
      app = F.isolate(app, key + mask.replace(/^\//, "."), ["DOM", "Component"])
      let sinks = app({...sources, props: {mask, params, router}})
      return R.merge({action$: O.of()}, sinks)
    }
  )

  let intents = {
    navigateTo$: sources.DOM.from("a").listen("click")
      .do(({event}) => event.preventDefault())
      .map(ee => ee.element.href)
      .do(url => {
        window.history.pushState({}, "", url)
      })
      .share(),

    navigateHistory$: D.isBrowser()
      ? O.fromEvent(window, "popstate")
          .map(data => document.location.pathname)
      : O.of()
  }

  let state$ = D.run(
    () => D.makeStore({}),
    // D.withLog({key, input: true, output: false}),
  )(
    // Init
    // D.init(seed),
    sources.state$.take(1).map(x => R.always(x)),

    // Navigation
    intents.navigateTo$.map(url => R.fn("navigateTo", R.set("url", url))),
    intents.navigateHistory$.map(url => R.fn("navigateHistory", R.set("url", url))),

    // Content
    contentSinks$.pluck("action$").switch(),
  ).$

  let Component = F.connect(
    {
      url: state$.pluck("url"),
      Content: contentSinks$.pluck("Component"),
    },
    ({url, Content}) => {
      return <div>
        <div className="page-header">
          <p>
            Current URL: {url}
          </p>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/users">Users</a>
            <a href="/users/1">User #1</a>
            <a href="/users/2">User #2</a>
            <a href="/contacts">Contacts</a>
          </nav>
        </div>
        <div className="page-content">
          <Content/>
        </div>
      </div>
    }
  )

  return {state$, Component}
}
