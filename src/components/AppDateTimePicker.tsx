'use client'

import { useState, useRef, useEffect } from 'react'
import Calendar from 'react-calendar'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export interface AppDateTimePickerProps {
  value: string
  onChange: (value: string) => void
  /** 'date' = ngày cụ thể (YYYY-MM-DD), 'month' = tháng/năm (YYYY-MM) */
  mode?: 'date' | 'month'
  min?: string
  max?: string
  placeholder?: string
  error?: boolean
  disabled?: boolean
  className?: string
}

function strToDate(str: string, mode: 'date' | 'month'): Date {
  return mode === 'month'
    ? new Date(str + '-01T00:00:00')
    : new Date(str + 'T00:00:00')
}

function dateToStr(date: Date, mode: 'date' | 'month'): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  if (mode === 'month') return `${y}-${m}`
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function AppDateTimePicker({
  value,
  onChange,
  mode = 'date',
  min,
  max,
  placeholder,
  error,
  disabled,
  className,
}: AppDateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const defaultPlaceholder = mode === 'month' ? 'Chọn tháng' : 'Chọn ngày'

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const displayValue = value
    ? mode === 'date'
      ? format(strToDate(value, 'date'), 'dd/MM/yyyy', { locale: vi })
      : format(strToDate(value, 'month'), 'MM/yyyy', { locale: vi })
    : ''

  const calendarValue = value ? strToDate(value, mode) : null

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-left transition-colors focus:outline-none ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : error
            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-400'
            : open
            ? 'border-blue-500 ring-2 ring-blue-500 bg-white'
            : 'border-gray-200 bg-white hover:border-gray-300 focus:ring-2 focus:ring-blue-500'
        }`}
      >
        <svg
          className="w-4 h-4 shrink-0 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <span className={`flex-1 truncate ${displayValue ? 'text-gray-800' : 'text-gray-400'}`}>
          {displayValue || placeholder || defaultPlaceholder}
        </span>

        {value && !disabled ? (
          <span
            role="button"
            aria-label="Xóa ngày"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="shrink-0 text-gray-300 hover:text-gray-500 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : (
          <svg
            className={`w-3.5 h-3.5 shrink-0 transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl p-2 min-w-[290px]">
          <div className="hotel-calendar picker-calendar">
            <Calendar
              locale="vi-VN"
              value={calendarValue}
              defaultView={mode === 'month' ? 'year' : 'month'}
              maxDetail={mode === 'month' ? 'year' : 'month'}
              minDate={min ? new Date(min + (mode === 'month' ? '-01T00:00:00' : 'T00:00:00')) : undefined}
              maxDate={max ? new Date(max + (mode === 'month' ? '-01T00:00:00' : 'T00:00:00')) : undefined}
              onChange={(val) => {
                if (!val || Array.isArray(val)) return
                onChange(dateToStr(val as Date, mode))
                setOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
