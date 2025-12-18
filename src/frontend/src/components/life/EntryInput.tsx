/**
 * EntryInput Component
 * Provides a distraction-free input experience with auto-expanding textarea
 * Validates: Requirements 6.2
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface EntryInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function EntryInput({
  onSubmit,
  placeholder = '记录此刻的想法...',
  className,
  disabled = false,
}: EntryInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height to scrollHeight, with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 200)
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [content, adjustTextareaHeight])

  const handleSubmit = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || isSubmitting || disabled) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(trimmedContent)
      setContent('')
      // Reset textarea height after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = '56px'
      }
    } catch (error) {
      console.error('Failed to submit entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting && !disabled

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-4',
        'shadow-elevation-2',
        'border border-neutral-100',
        'transition-shadow duration-200',
        'focus-within:shadow-elevation-3',
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        className={cn(
          'w-full resize-none border-0 bg-transparent',
          'text-neutral-900 text-sm leading-relaxed',
          'placeholder:text-neutral-400',
          'focus:outline-none focus:ring-0',
          'min-h-[56px] max-h-[200px]',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        rows={1}
      />
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
        <span className="text-xs text-neutral-400">
          {content.length > 0 ? `${content.length} 字` : '⌘ + Enter 发送'}
        </span>
        
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'transition-all duration-200',
            canSubmit ? 'opacity-100' : 'opacity-50'
          )}
        >
          <Send className="h-4 w-4 mr-1" />
          {isSubmitting ? '发送中...' : '发送'}
        </Button>
      </div>
    </div>
  )
}
