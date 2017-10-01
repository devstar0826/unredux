import {Component} from "react"
import connect from "./connect"

let stateCycle = new ReplaySubject(1)

// User intents
let intents = {
  increment: new Subject(),
  decrement: new Subject(),
  incrementIfOdd: new Subject(),
}

// State actions
let actions = {
  increment: Observable.merge(
    intents.increment,
    stateCycle.sample(intents.incrementIfOdd).filter(state => state.counter % 2)
  )
    .map(() => (state) => R.assoc("counter", state.counter + 1, state)),
  decrement: intents.decrement
    .map(() => (state) => R.assoc("counter", state.counter - 1, state)),
}

// State stream
let initialState = {counter: 0}

let state = Observable.merge(
  actions.increment,
  actions.decrement,
)
 .startWith(initialState)
 .scan((state, fn) => fn(state))
 .do(state => {
   console.log("state spy:", state)
   stateCycle.next(state)
 })
 .distinctUntilChanged()
 .shareReplay(1)

// Rendering & Events
let App = connect(
  {counter: state.pluck("counter")},
  (props) =>
    <div className={props.className}>
      <p>
        Clicked: <span id="value">{props.counter}</span> times
        <button id="increment" onClick={() => intents.increment.next()}>+</button>
        <button id="decrement" onClick={() => intents.decrement.next()}>-</button>
        <button id="incrementIfOdd" onClick={() => intents.incrementIfOdd.next()}>Increment if odd</button>
        <button id="incrementAsync" onClick={() => {
          setTimeout(() => intents.increment.next(), 500)
        }}>Increment async</button>
      </p>
    </div>
)

ReactDOM.render(<App/>, document.getElementById("root"))
