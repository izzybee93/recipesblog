import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { isRecipeDetailPath, recipeReloadScript } from './recipe-reload.ts'

function providerHarness(path: string, savedPosition: number | null = null) {
  const source = readFileSync(new URL('../components/ThemeProvider.tsx', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const effects: (() => void | (() => void))[] = []
  const timers = new Map<number, () => void>()
  const windowEvents = new EventTarget()
  const saved = new Map(savedPosition === null ? [] : [[path, savedPosition]])
  const scrolls: number[] = []
  let nextTimer = 0
  const window = Object.assign(windowEvents, {
    scrollY: 775,
    innerHeight: 800,
    scrollTo: ({ top }: { top: number }) => scrolls.push(top),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
  const module = { exports: {} as { default: (props: { children: null }) => unknown } }
  vm.runInNewContext(compiled, {
    module, exports: module.exports, window, console: { log() {} },
    document: { documentElement: { scrollHeight: 3000, classList: { add() {}, remove() {} } } },
    setTimeout: (callback: () => void) => { timers.set(++nextTimer, callback); return nextTimer },
    clearTimeout: (id: number) => timers.delete(id),
    require: (name: string) => ({
      react: { useEffect: (effect: () => void) => effects.push(effect) },
      'react/jsx-runtime': { jsx() {} },
      'next/navigation': { usePathname: () => path },
      '@/lib/navigation-state': { markBackNavigation() {} },
      '@/lib/recipe-reload': { isRecipeDetailPath },
      '@/lib/scroll-state': {
        getSavedScrollPosition: (key: string) => saved.get(key) ?? null,
        clearSavedScrollPosition: (key: string) => saved.delete(key),
        saveScrollPosition: (key: string, y: number) => saved.set(key, y),
      },
    }[name]),
  })
  module.exports.default({ children: null })
  const cleanups = effects.map(effect => effect())
  return {
    window, saved, scrolls, timers,
    flushTimers() {
      const pending = [...timers.values()]
      timers.clear()
      pending.forEach(callback => callback())
    },
    cleanup() { cleanups.forEach(cleanup => cleanup?.()) },
  }
}

test('recipe refresh leaves restoration to the browser rather than replaying a stale saved position', () => {
  const before = providerHarness('/recipes/crepes')
  before.window.dispatchEvent(new Event('beforeunload'))
  const reloaded = providerHarness('/recipes/crepes', before.saved.get('/recipes/crepes') ?? null)
  reloaded.flushTimers()
  assert.deepEqual(reloaded.scrolls, [])
  assert.equal(before.saved.has('/recipes/crepes'), false)
})

test('recipe mount clears stale saved positions without competing with initial deep links', () => {
  const session = providerHarness('/recipes/crepes', 775)
  session.flushTimers()
  assert.deepEqual(session.scrolls, [])
  assert.equal(session.saved.has('/recipes/crepes'), false)
})

for (const path of ['/', '/category/breakfast', '/recipes', '/recipes/nested/path']) {
  test(`${path} retains existing saved-position restoration and refresh saving`, () => {
    const session = providerHarness(path, 775)
    session.flushTimers()
    assert.deepEqual(session.scrolls, [775])
    assert.equal(session.saved.has(path), false)
    session.window.dispatchEvent(new Event('beforeunload'))
    assert.equal(session.saved.get(path), 775)
  })
}

test('provider cleanup cancels delayed restoration and unload listeners', () => {
  const session = providerHarness('/category/breakfast', 775)
  session.cleanup()
  session.flushTimers()
  session.window.dispatchEvent(new Event('beforeunload'))
  assert.deepEqual(session.scrolls, [])
})

function reloadHarness(options: { path?: string; type?: string; hash?: string; previous?: ScrollRestoration } = {}) {
  const frames = new Map<number, FrameRequestCallback>()
  const windowEvents = new EventTarget()
  const location = { pathname: options.path ?? '/recipes/crepes', search: '?source=test', hash: options.hash ?? '' }
  const originalState = { __NA: true, tree: ['recipe'] }
  const scrolls: number[] = []
  const history = {
    scrollRestoration: options.previous ?? 'auto',
    state: originalState,
    replaceState(state: unknown, _title: string, url: string) {
      assert.equal(state, originalState, 'Next history state must retain its identity')
      assert.equal(url, `${location.pathname}${location.search}`)
      location.hash = ''
    },
  }
  let nextFrame = 0
  const window = Object.assign(windowEvents, {
    location, history, scrollY: 775,
    performance: { getEntriesByType: () => [{ type: options.type ?? 'reload' }] },
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++nextFrame, callback); return nextFrame },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    scrollTo({ top }: { top: number }) { scrolls.push(top); window.scrollY = top },
  })
  vm.runInNewContext(recipeReloadScript, { window })
  return {
    window, history, location, scrolls, frames,
    show(persisted = false) { window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted })) },
    frame() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0)) },
  }
}

for (const hash of ['', '#ingredients', '#directions', '#other-fragment']) {
  test(`recipe reload ${hash || 'without a hash'} preserves the real position without re-anchoring`, () => {
    const session = reloadHarness({ hash })
    assert.equal(session.window.scrollY, 775)
    assert.deepEqual(session.scrolls, [])
    assert.equal(session.history.scrollRestoration, 'auto')
    assert.equal(session.location.hash, '')
    assert.equal(session.location.search, '?source=test')
    session.show()
    session.frame()
    assert.equal(session.window.scrollY, 775)
    assert.equal(session.frames.size, 0)
  })
}

for (const type of ['navigate', 'back_forward']) {
  test(`${type} keeps ordinary deep links and native scroll restoration`, () => {
    const session = reloadHarness({ type, hash: '#directions' })
    session.show()
    session.frame()
    assert.equal(session.window.scrollY, 775)
    assert.equal(session.location.hash, '#directions')
    assert.equal(session.history.scrollRestoration, 'auto')
  })
}

for (const path of ['/', '/category/breakfast', '/recipes', '/recipes/nested/path']) {
  test(`reload at ${path} does not change non-recipe navigation`, () => {
    const session = reloadHarness({ path, hash: '#ingredients' })
    session.show()
    session.frame()
    assert.equal(session.window.scrollY, 775)
    assert.equal(session.location.hash, '#ingredients')
    assert.equal(session.history.scrollRestoration, 'auto')
  })
}

test('reload does not change an existing restoration policy', () => {
  const session = reloadHarness({ previous: 'manual' })
  assert.equal(session.history.scrollRestoration, 'manual')
})

test('pageshow, BFcache returns and later SPA navigation cannot replay a refresh jump', () => {
  const session = reloadHarness({ hash: '#ingredients' })
  session.show()
  session.location.pathname = '/recipes/another-recipe'
  session.window.scrollY = 450
  session.window.dispatchEvent(new Event('pagehide'))
  session.show(true)
  session.frame()
  assert.equal(session.window.scrollY, 450)
  assert.deepEqual(session.scrolls, [])
})
