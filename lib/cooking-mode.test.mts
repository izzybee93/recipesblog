import assert from 'node:assert/strict'
import test from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { startCookingModeSession } from './cooking-mode.ts'

class FakeLock extends EventTarget {
  released = false
  releaseCalls = 0

  async release() {
    this.releaseCalls++
    this.released = true
    this.dispatchEvent(new Event('release'))
  }
}

function harness(options: { unsupported?: boolean; request?: () => Promise<FakeLock> } = {}) {
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const window = new EventTarget()
  const lock = new FakeLock()
  let resets = 0
  let requests = 0
  const stop = startCookingModeSession({
    document,
    window,
    requestWakeLock: options.unsupported ? undefined : () => {
      requests++
      return options.request ? options.request() : Promise.resolve(lock)
    },
    onReset: () => { resets++ },
  })
  return { document, window, lock, stop, resets: () => resets, requests: () => requests }
}

test('leaving and returning to the tab resets cooking mode without reacquiring', async () => {
  const session = harness()
  await setImmediate()
  assert.equal(session.requests(), 1)
  session.document.visibilityState = 'hidden'
  session.document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(session.resets(), 1)
  assert.equal(session.lock.releaseCalls, 1)
  session.document.visibilityState = 'visible'
  session.document.dispatchEvent(new Event('visibilitychange'))
  await setImmediate()
  assert.equal(session.requests(), 1)
  assert.equal(session.resets(), 1)
})

for (const event of ['blur', 'focus', 'pagehide', 'pageshow']) {
  test(`${event} resets cooking mode and releases the lock`, async () => {
    const session = harness()
    await setImmediate()
    session.window.dispatchEvent(new Event(event))
    assert.equal(session.resets(), 1)
    assert.equal(session.lock.releaseCalls, 1)
    session.window.dispatchEvent(new Event(event))
    assert.equal(session.resets(), 1)
  })
}

test('a lock acquired after leaving the page is immediately released', async () => {
  const pending = Promise.withResolvers<FakeLock>()
  const session = harness({ request: () => pending.promise })
  session.window.dispatchEvent(new Event('pagehide'))
  const lateLock = new FakeLock()
  pending.resolve(lateLock)
  await setImmediate()
  assert.equal(session.resets(), 1)
  assert.equal(lateLock.releaseCalls, 1)
  assert.equal(session.requests(), 1)
})

test('unmount releases the lock and removes reset listeners without updating UI', async () => {
  const session = harness()
  await setImmediate()
  session.stop()
  session.window.dispatchEvent(new Event('focus'))
  session.document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(session.lock.releaseCalls, 1)
  assert.equal(session.resets(), 0)
})

test('unmount before acquisition completes releases the late lock without updating UI', async () => {
  const pending = Promise.withResolvers<FakeLock>()
  const session = harness({ request: () => pending.promise })
  session.stop()
  const lateLock = new FakeLock()
  pending.resolve(lateLock)
  await setImmediate()
  assert.equal(lateLock.releaseCalls, 1)
  assert.equal(session.resets(), 0)
})

test('unsupported and rejected wake-lock requests reset cooking mode', async () => {
  const unsupported = harness({ unsupported: true })
  const rejected = harness({ request: () => Promise.reject(new Error('Declined')) })
  await setImmediate()
  assert.equal(unsupported.resets(), 1)
  assert.equal(unsupported.requests(), 0)
  assert.equal(rejected.resets(), 1)
})

test('a browser-released lock resets cooking mode without reacquiring', async () => {
  const session = harness()
  await setImmediate()
  await session.lock.release()
  assert.equal(session.resets(), 1)
  assert.equal(session.lock.releaseCalls, 1)
  assert.equal(session.requests(), 1)
})
