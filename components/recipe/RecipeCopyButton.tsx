'use client'

import { useEffect, useRef, useState } from 'react'
import type { Recipe } from '@/types/recipe'
import { recipeClipboardText } from '@/lib/recipe-copy'
import styles from './RecipeLayout.module.css'

interface RecipeCopyButtonProps {
  recipe: Pick<Recipe, 'title' | 'ingredients' | 'directions'>
}

export default function RecipeCopyButton({ recipe }: RecipeCopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  const copy = async () => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setStatus('copying')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(recipeClipboardText(recipe))
      setStatus('copied')
      resetTimer.current = setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <span className={styles.copyControl}>
      <button
        type="button"
        className={styles.copyButton}
        aria-label="Copy recipe"
        title={status === 'copied' ? 'Copied' : 'Copy recipe'}
        aria-busy={status === 'copying'}
        disabled={status === 'copying'}
        onClick={() => void copy()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          {status === 'copied' ? (
            <path d="m5 12 4 4L19 6" />
          ) : (
            <>
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
            </>
          )}
        </svg>
      </button>
      <span role="status" className={status === 'error' ? styles.copyError : 'sr-only'}>
        {status === 'copied' ? 'Recipe copied' : status === 'error' ? 'Couldn’t copy. Please try again.' : ''}
      </span>
    </span>
  )
}
