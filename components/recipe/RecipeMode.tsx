'use client'

import React, { useState, useEffect, useRef } from 'react'

export default function RecipeMode() {
  const [isRecipeMode, setIsRecipeMode] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Check if Screen Wake Lock API is supported
    if ('wakeLock' in navigator) {
      setIsSupported(true)
    }
  }, [])

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        
        // Handle visibility change
        const handleVisibilityChange = async () => {
          if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
            wakeLockRef.current = await navigator.wakeLock.request('screen')
          }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      }
    } catch (err) {
      console.error('Wake Lock error:', err)
      setError('Unable to prevent screen from sleeping')
      // Fall back to video hack for unsupported browsers
      useVideoFallback()
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      } catch (err) {
        console.error('Error releasing wake lock:', err)
      }
    }
    
    // Also stop video fallback if it's running
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
      if (videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current)
      }
      videoRef.current = null
    }
  }

  const useVideoFallback = () => {
    // Fallback for browsers that don't support Screen Wake Lock API
    // This creates an invisible video that plays to keep the screen awake
    if (!videoRef.current) {
      const video = document.createElement('video')
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      video.style.position = 'fixed'
      video.style.top = '-100px'
      video.style.left = '-100px'
      video.style.width = '1px'
      video.style.height = '1px'
      
      // Create a minimal video blob
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, 1, 1)
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          video.src = URL.createObjectURL(blob)
          video.loop = true
          document.body.appendChild(video)
          video.play().catch(e => console.error('Video play error:', e))
          videoRef.current = video
        }
      }, 'video/webm')
    }
  }

  const toggleRecipeMode = async () => {
    const newMode = !isRecipeMode
    setIsRecipeMode(newMode)
    setError(null)

    if (newMode) {
      if (isSupported) {
        await requestWakeLock()
      } else {
        // Use video fallback for unsupported browsers
        useVideoFallback()
      }
    } else {
      await releaseWakeLock()
    }
  }

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false)
      }
    }

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside as any)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [showTooltip])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock()
    }
  }, [])

  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={toggleRecipeMode}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isRecipeMode ? '' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        style={{
          backgroundColor: isRecipeMode ? 'rgb(140, 190, 175)' : undefined
        }}
        aria-label="Toggle Cooking Mode"
        aria-checked={isRecipeMode}
        role="switch"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-200 transition-transform ${
            isRecipeMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cooking mode
        </span>
      </div>
      
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
      
      <div className="group relative" ref={tooltipRef}>
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help focus:outline-none"
          aria-label="Information about cooking mode"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        <div
          className={`absolute bottom-full right-0 mb-2 whitespace-nowrap p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 transition-opacity ${
            showTooltip ? 'block' : 'hidden group-hover:block'
          }`}
        >
          Prevents device sleep
        </div>
      </div>
    </div>
  )
}