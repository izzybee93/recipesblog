import assert from 'node:assert/strict'
import test from 'node:test'
import { getEventListeners } from 'node:events'
import { watchRecipeTabPosition } from './recipe-tab-cover.ts'

function harness(initial = { top: 500, bottom: 562, width: 390 }) {
  const window = new EventTarget()
  const viewport = new EventTarget()
  let bounds = initial
  let resize = () => {}
  let disconnected = false
  const changes: boolean[] = []
  const stop = watchRecipeTabPosition({ window, visualViewport: viewport,
    getBounds: () => bounds, onChange: value => changes.push(value),
    observeResize: update => { resize = update; return () => { disconnected = true } },
  })
  return { window, viewport, changes, stop, resize: () => resize(), disconnected: () => disconnected,
    setBounds(value: typeof bounds) { bounds = value },
  }
}
test('cover starts hidden before tabs reach the top', () => {
  const h = harness()
  assert.deepEqual(h.changes, [false])
  h.stop()
})
test('scrolling pins and unpins the cover at the actual tab edge', () => {
  const h = harness()
  h.setBounds({ top: 0, bottom: 62, width: 390 })
  h.window.dispatchEvent(new Event('scroll'))
  h.window.dispatchEvent(new Event('scroll'))
  h.setBounds({ top: 0.25, bottom: 62.25, width: 390 })
  h.window.dispatchEvent(new Event('scroll'))
  assert.deepEqual(h.changes, [false, true, false])
  h.stop()
})
test('restoring directly into a pinned position enables the cover immediately', () => {
  const h = harness({ top: 0, bottom: 62, width: 390 })
  assert.deepEqual(h.changes, [true])
  h.stop()
})
test('hidden desktop tabs and a bar pushed fully past the viewport disable the cover', () => {
  const h = harness({ top: 0, bottom: 62, width: 390 })
  h.setBounds({ top: 0, bottom: 0, width: 0 })
  h.window.dispatchEvent(new Event('resize'))
  h.setBounds({ top: -62, bottom: 0, width: 390 })
  h.window.dispatchEvent(new Event('scroll'))
  assert.deepEqual(h.changes, [true, false])
  h.stop()
})
for (const event of ['resize', 'scroll']) {
  test(`visual viewport ${event} updates the cover`, () => {
    const h = harness()
    h.setBounds({ top: 0, bottom: 62, width: 390 })
    h.viewport.dispatchEvent(new Event(event))
    assert.deepEqual(h.changes, [false, true])
    h.stop()
  })
}
test('layout changes and BFcache pageshow recalculate the position', () => {
  const h = harness()
  h.setBounds({ top: 0, bottom: 62, width: 390 })
  h.resize()
  h.setBounds({ top: 500, bottom: 562, width: 390 })
  h.window.dispatchEvent(new Event('pageshow'))
  assert.deepEqual(h.changes, [false, true, false])
  h.stop()
})
test('cleanup removes listeners and ignores queued layout callbacks', () => {
  const h = harness()
  h.stop()
  h.setBounds({ top: 0, bottom: 62, width: 390 })
  h.resize()
  h.window.dispatchEvent(new Event('scroll'))
  h.viewport.dispatchEvent(new Event('resize'))
  assert.deepEqual(h.changes, [false])
  assert.equal(h.disconnected(), true)
  for (const event of ['scroll', 'resize', 'pageshow']) assert.equal(getEventListeners(h.window, event).length, 0)
  for (const event of ['scroll', 'resize']) assert.equal(getEventListeners(h.viewport, event).length, 0)
})
