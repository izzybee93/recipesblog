'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { startCookingModeSession } from '@/lib/cooking-mode'
import { createCookingModeActivationGuard } from '@/lib/cooking-mode-activation'
import styles from './RecipeLayout.module.css'

export default function RecipeMode() {
  const [enabled, setEnabled] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()
  const [activationGuard] = useState(createCookingModeActivationGuard)

  useEffect(() => () => activationGuard.reset(), [activationGuard])

  useEffect(() => {
    if (!enabled) return
    return startCookingModeSession({
      document,
      window,
      requestWakeLock: navigator.wakeLock ? () => navigator.wakeLock.request('screen') : undefined,
      onReset: () => {
        setEnabled(false)
        setShowInfo(false)
      },
    })
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
      <div className={`${styles.cookingMode} text-gray-700 dark:text-gray-300`}>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Cooking mode"
          title="Keep the screen awake while cooking"
          className={styles.cookingToggle}
          onPointerDown={event => activationGuard.start(event, { x: window.scrollX, y: window.scrollY })}
          onPointerMove={event => activationGuard.move(event)}
          onPointerCancel={event => activationGuard.cancel(event)}
          onClick={event => {
            if (activationGuard.acceptClick(event.detail, { x: window.scrollX, y: window.scrollY })) {
              setEnabled(value => !value)
            }
          }}
        >
          <span
            className={`${styles.toggleTrack} bg-gray-300 dark:bg-gray-600`}
            style={enabled ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            <span className="bg-white dark:bg-gray-200" />
          </span>
        </button>
        <span>Cooking mode</span>
      </div>
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
