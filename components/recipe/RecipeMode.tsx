'use client'

import { useEffect, useId, useRef, useState } from 'react'
import styles from './RecipeLayout.module.css'

export default function RecipeMode() {
  const [enabled, setEnabled] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  useEffect(() => {
    if (!enabled) return
    let disposed = false
    let acquiring = false
    let lock: WakeLockSentinel | null = null

    const acquire = async () => {
      if (disposed || acquiring || document.visibilityState !== 'visible' || (lock && !lock.released)) return
      if (!navigator.wakeLock) return
      acquiring = true
      try {
        const next = await navigator.wakeLock.request('screen')
        if (disposed || document.visibilityState !== 'visible') {
          await next.release()
          return
        }
        lock = next
      } catch {
        // The browser may decline a wake lock; keep the control free of status text.
      } finally {
        acquiring = false
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    void acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void lock?.release().catch(() => {})
    }
  }, [enabled])

  useEffect(() => {
    if (!showInfo) return
    const onPointerDown = (event: PointerEvent) => {
      if (!infoRef.current?.contains(event.target as Node)) setShowInfo(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowInfo(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showInfo])

  return (
    <div className={styles.cookingControls}>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Cooking mode"
        title="Keep the screen awake while cooking"
        className={`${styles.cookingToggle} text-gray-700 dark:text-gray-300`}
        onClick={() => setEnabled(value => !value)}
      >
        <span
          className={`${styles.toggleTrack} bg-gray-300 dark:bg-gray-600`}
          style={enabled ? { backgroundColor: 'var(--accent)' } : undefined}
        >
          <span className="bg-white dark:bg-gray-200" />
        </span>
        Cooking mode
      </button>
      <div
        className={styles.cookingInfo}
        ref={infoRef}
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => {
          if (!infoRef.current?.contains(document.activeElement)) setShowInfo(false)
        }}
        onFocus={() => setShowInfo(true)}
        onBlur={() => setShowInfo(false)}
      >
        <button
          type="button"
          aria-label="Information about cooking mode"
          aria-describedby={tooltipId}
          className={`${styles.infoButton} text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] dark:text-gray-500 dark:hover:text-gray-300`}
          onClick={() => setShowInfo(true)}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <div
          id={tooltipId}
          role="tooltip"
          className={`${styles.tooltip} ${showInfo ? styles.tooltipOpen : ''} rounded bg-gray-800 p-2 text-xs text-white`}
        >
          Prevents device sleep
        </div>
      </div>
    </div>
  )
}
