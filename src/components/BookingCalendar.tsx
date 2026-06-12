'use client'

import { useMemo } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import type { Booking } from '@/types/booking'
import { STATUS_LABELS } from '@/types/booking'

interface BookingCalendarProps {
  bookings: Booking[]
}

function toLocalStr(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  while (cur <= endDate) {
    dates.push(toLocalStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const today = new Date().toISOString().split('T')[0]

  const dateMap = useMemo(() => {
    const map = new Map<string, Booking[]>()
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return
      getDatesInRange(b.checkIn, b.checkOut).forEach((d) => {
        if (!map.has(d)) map.set(d, [])
        map.get(d)!.push(b)
      })
    })
    return map
  }, [bookings])

  const activeCount = bookings.filter((b) => b.status !== 'cancelled').length

  const upcoming = useMemo(() =>
    bookings
      .filter((b) => b.status !== 'cancelled' && b.checkIn >= today)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
    [bookings, today]
  )

  const groupedUpcoming = useMemo(() => {
    const grouped: Record<string, Booking[]> = {}
    upcoming.forEach((b) => {
      ;(grouped[b.checkIn] ??= []).push(b)
    })
    return grouped
  }, [upcoming])

  const upcomingDates = Object.keys(groupedUpcoming).sort().slice(0, 4)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Lịch Đặt Phòng</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tên khách hiển thị theo ngày</p>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {activeCount} phòng
        </span>
      </div>

      {/* Calendar */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[280px] hotel-calendar">
          <Calendar
            locale="vi-VN"
            tileClassName={({ date, view }) => {
              if (view !== 'month') return null
              const list = dateMap.get(toLocalStr(date))
              if (!list) return null
              const hasPaid = list.some((b) => b.status === 'paid')
              const hasPending = list.some((b) => b.status === 'pending')
              if (hasPaid && hasPending) return 'tile-multi'
              return hasPaid ? 'tile-paid' : 'tile-booked'
            }}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null
              const list = dateMap.get(toLocalStr(date))
              if (!list) return null

              const tooltip = list
                .map((b) => `${b.guestName} — ${STATUS_LABELS[b.status].label}`)
                .join('\n')

              if (list.length === 1) {
                const firstName = list[0].guestName.split(' ').pop() ?? list[0].guestName
                return (
                  <span className="guest-label" title={tooltip}>
                    {firstName}
                  </span>
                )
              }

              return (
                <div className="guest-rows" title={tooltip}>
                  {list.slice(0, 2).map((b, i) => {
                    const firstName = b.guestName.split(' ').pop() ?? b.guestName
                    return (
                      <span
                        key={i}
                        className={`guest-row ${b.status === 'paid' ? 'row-paid' : 'row-pending'}`}
                      >
                        <span className="row-dot" />
                        <span className="guest-name-text">{firstName}</span>
                      </span>
                    )
                  })}
                  {list.length > 2 && (
                    <span className="guest-more">+{list.length - 2} khách</span>
                  )}
                </div>
              )
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-300 shrink-0" />
          <span>Đang đặt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400 shrink-0" />
          <span>Đã thanh toán</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #fef3c7 50%, #d1fae5 50%)' }}
          />
          <span>Nhiều khách</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-200 border border-blue-400 shrink-0" />
          <span>Hôm nay</span>
        </div>
      </div>

      {/* Upcoming grouped by date */}
      {upcomingDates.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Sắp check-in
          </p>
          <div className="space-y-2.5">
            {upcomingDates.map((date) => {
              const dayBookings = groupedUpcoming[date]
              const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })
              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-600 tabular-nums">{dateLabel}</span>
                    {dayBookings.length > 1 && (
                      <span className="text-[10px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                        {dayBookings.length} phòng
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.map((b) => {
                      const s = STATUS_LABELS[b.status]
                      return (
                        <div key={b.id} className="flex items-center gap-2 text-xs pl-3">
                          <span className="font-medium text-gray-700 truncate flex-1 min-w-0">
                            {b.guestName}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${s.cls}`}>
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
