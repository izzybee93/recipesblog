import assert from 'node:assert/strict'
import test from 'node:test'
import { recipeSectionTarget, animateRecipeScroll } from './recipe-section-navigation.ts'

const base = { sectionTop: 1000, sectionBottom: 1400, scrollY: 0, viewportHeight: 800, viewportOffset: 0, navHeight: 62, documentHeight: 2400 }
test('short directions reveal the last step while retaining earlier ingredients', () => {
  assert.equal(recipeSectionTarget('directions', base), 616)
})
test('long directions start below sticky tabs', () => {
  assert.equal(recipeSectionTarget('directions', { ...base, sectionBottom: 2000 }), 926)
})
test('already visible directions stay still', () => {
  assert.equal(recipeSectionTarget('directions', { ...base, scrollY: 700 }), 700)
})
test('ingredients always align below the tabs', () => {
  assert.equal(recipeSectionTarget('ingredients', base), 926)
})
test('short landscape and visual viewport offsets are accounted for', () => {
  assert.equal(recipeSectionTarget('directions', { ...base, viewportHeight: 300 }), 926)
  assert.equal(recipeSectionTarget('directions', { ...base, viewportOffset: 40 }), 576)
})
test('document limits and an empty directions block give safe destinations', () => {
  assert.equal(recipeSectionTarget('ingredients', { ...base, documentHeight: 1200 }), 400)
  assert.equal(recipeSectionTarget('directions', { ...base, sectionBottom: 1000 }), 926)
  assert.equal(recipeSectionTarget('ingredients', { ...base, sectionTop: 20 }), 0)
})
function animationHarness(reducedMotion = false) {
  let tick: ((time: number) => void) | undefined
  let y = 100
  const positions: number[] = []
  const stop = animateRecipeScroll({ start: y, target: 600, reducedMotion,
    now: () => 0, request: callback => { tick = callback; return 1 },
    cancel: () => { tick = undefined }, scroll: value => { y = value; positions.push(value) },
  })
  return { stop, positions, frame(time: number) { const callback = tick; tick = undefined; callback?.(time) }, y: () => y }
}
test('animation eases quickly to an exact destination', () => {
  const h = animationHarness()
  h.frame(120)
  assert.ok(h.y() > 350 && h.y() < 600)
  h.frame(240)
  assert.equal(h.y(), 600)
})
test('reduced motion is immediate and cancellation prevents stale animation', () => {
  const reduced = animationHarness(true)
  assert.deepEqual(reduced.positions, [600])
  const h = animationHarness()
  h.frame(60)
  h.stop()
  const before = h.y()
  h.frame(240)
  assert.equal(h.y(), before)
})
