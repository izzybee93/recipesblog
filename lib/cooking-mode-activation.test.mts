import assert from 'node:assert/strict'
import test from 'node:test'
import { createCookingModeActivationGuard } from './cooking-mode-activation.ts'

const position = { x: 0, y: 200 }
const touch = { pointerId: 1, pointerType: 'touch', clientX: 40, clientY: 100 }

test('a stationary touch activates the switch', () => {
  const guard = createCookingModeActivationGuard()
  guard.start(touch, position)
  guard.move({ ...touch, clientX: 42, clientY: 102 })
  assert.equal(guard.acceptClick(1, position), true)
})

for (const pointerType of ['touch', 'pen']) {
  test(`${pointerType} dragging prevents the following click even after returning to the start`, () => {
    const guard = createCookingModeActivationGuard()
    guard.start({ ...touch, pointerType }, position)
    guard.move({ ...touch, clientY: 120 })
    guard.move(touch)
    assert.equal(guard.acceptClick(1, position), false)
  })
}

test('a cancelled touch does not activate; a fresh tap still works', () => {
  const guard = createCookingModeActivationGuard()
  guard.start(touch, position)
  guard.cancel(touch)
  assert.equal(guard.acceptClick(1, position), false)
  guard.start(touch, position)
  assert.equal(guard.acceptClick(1, position), true)
})

test('scrolling between touch down and click prevents activation', () => {
  const guard = createCookingModeActivationGuard()
  guard.start(touch, position)
  assert.equal(guard.acceptClick(1, { ...position, y: 250 }), false)
})

test('an unrelated pointer does not cancel or move the active touch', () => {
  const guard = createCookingModeActivationGuard()
  guard.start(touch, position)
  guard.move({ ...touch, pointerId: 2, clientY: 250 })
  guard.cancel({ pointerId: 2 })
  assert.equal(guard.acceptClick(1, position), true)
})

test('mouse clicks retain native activation semantics', () => {
  const guard = createCookingModeActivationGuard()
  guard.start({ ...touch, pointerType: 'mouse' }, position)
  guard.move({ ...touch, clientX: 100 })
  assert.equal(guard.acceptClick(1, { x: 0, y: 300 }), true)
})

test('keyboard and assistive clicks work even after a cancelled touch', () => {
  const guard = createCookingModeActivationGuard()
  guard.start(touch, position)
  guard.cancel(touch)
  assert.equal(guard.acceptClick(0, position), true)
})

test('clicks without a pointer sequence preserve native compatibility', () => {
  assert.equal(createCookingModeActivationGuard().acceptClick(1, position), true)
})

test('teardown discards gesture state', () => {
  const guard = createCookingModeActivationGuard()
  guard.start(touch, position)
  guard.cancel(touch)
  guard.reset()
  assert.equal(guard.acceptClick(1, position), true)
})
