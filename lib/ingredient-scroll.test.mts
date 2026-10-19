import assert from 'node:assert/strict'
import test from 'node:test'
import { getEventListeners } from 'node:events'
import { watchIngredientOverflow } from './ingredient-scroll.ts'

function harness(geometry = { scrollHeight: 1000, clientHeight: 400, scrollTop: 0 }) {
  const scroller = Object.assign(new EventTarget(), geometry)
  const changes: boolean[] = []
  let resize: () => void = () => {}
  let disconnects = 0
  const stop = watchIngredientOverflow(scroller, value => changes.push(value), update => {
    resize = update
    return () => { disconnects++ }
  })
  return { scroller, changes, stop, resize: () => resize(), disconnects: () => disconnects }
}

test('initial long lists show more below and short lists do not', () => {
  const long = harness()
  const short = harness({ scrollHeight: 300, clientHeight: 400, scrollTop: 0 })
  assert.deepEqual(long.changes, [true])
  assert.deepEqual(short.changes, [false])
  long.stop()
  short.stop()
})

test('scrolling to the bottom clears the cue and scrolling up restores it', () => {
  const session = harness()
  session.scroller.scrollTop = 600
  session.scroller.dispatchEvent(new Event('scroll'))
  session.scroller.scrollTop = 250
  session.scroller.dispatchEvent(new Event('scroll'))
  assert.deepEqual(session.changes, [true, false, true])
  session.stop()
})

test('viewport resize and content height changes recalculate overflow', () => {
  const session = harness()
  session.scroller.clientHeight = 1000
  session.resize()
  session.scroller.scrollHeight = 1400
  session.resize()
  assert.deepEqual(session.changes, [true, false, true])
  session.stop()
})

test('fractional offsets within one pixel count as the bottom', () => {
  const session = harness({ scrollHeight: 1000, clientHeight: 400, scrollTop: 598.9 })
  session.scroller.scrollTop = 599
  session.scroller.dispatchEvent(new Event('scroll'))
  session.scroller.scrollTop = 599.75
  session.scroller.dispatchEvent(new Event('scroll'))
  assert.deepEqual(session.changes, [true, false, false])
  session.stop()
})

test('cleanup disconnects resize observation and stops scroll and queued resize updates', () => {
  const session = harness()
  assert.equal(getEventListeners(session.scroller, 'scroll').length, 1)
  session.stop()
  assert.equal(session.disconnects(), 1)
  assert.equal(getEventListeners(session.scroller, 'scroll').length, 0)
  session.scroller.scrollTop = 600
  session.scroller.dispatchEvent(new Event('scroll'))
  session.resize()
  assert.deepEqual(session.changes, [true])
})
