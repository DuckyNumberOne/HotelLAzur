'use client'

import { useMemo } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import type { Booking } from '@/types/booking'
import { STATUS_LABELS, CHECK_IN_TIME, CHECK_OUT_TIME } from '@/types/booking'

interface BookingCalendarProps {
  bookings: Booking[]
}

/**
 * Occupancy của một ô lịch (1 ngày = 24h), tách theo giờ nhận/trả phòng:
 * - am: khách có mặt buổi sáng (trước 12h) → khách trả phòng ngày đó hoặc đang ở giữa kỳ.
 * - pm: khách có mặt buổi chiều/tối (sau 14h) → khách nhận phòng ngày đó hoặc đang ở giữa kỳ.
 * - all: mọi khách chạm tới ngày đó (để hiển thị tên).
 * Khoảng 12h–14h trống = thời gian dọn phòng.
 */
interface DayOccupancy {
  am: Booking[]
  pm: Booking[]
  all: Booking[]
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

/** Màu đại diện cho một nửa ô: ưu tiên 'pending' (cần chú ý) nếu có. */
function halfStatus(list: Booking[]): 'paid' | 'pending' | null {
  if (list.length === 0) return null
  return list.some((b) => b.status === 'pending') ? 'pending' : 'paid'
}

/** Tính class nền cho ô lịch từ occupancy buổi sáng / chiều. */
function tileClassFor(occ: DayOccupancy | undefined): string | null {
  if (!occ || occ.all.length === 0) return null
  // Khách ở trọn ngày (giữa kỳ) → tô đầy ô, không có khoảng dọn phòng.
  const hasFullDay = occ.am.some((b) => occ.pm.includes(b))
  if (hasFullDay) return `tile-solid-${halfStatus(occ.all)}`

  const am = halfStatus(occ.am)
  const pm = halfStatus(occ.pm)
  if (am && pm) return `tile-turn-${am}-${pm}` // trả phòng sáng + nhận phòng chiều
  if (pm) return `tile-pm-${pm}` // chỉ nhận phòng (chiều)
  if (am) return `tile-am-${am}` // chỉ trả phòng (sáng)
  return null
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const today = new Date().toISOString().split('T')[0]

  const dateMap = useMemo(() => {
    const map = new Map<string, DayOccupancy>()
    const ensure = (d: string): DayOccupancy => {
      let entry = map.get(d)
      if (!entry) {
        entry = { am: [], pm: [], all: [] }
        map.set(d, entry)
      }
      return entry
    }
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return
      getDatesInRange(b.checkIn, b.checkOut).forEach((d) => {
        const entry = ensure(d)
        entry.all.push(b)
        const isArrival = d === b.checkIn
        const isDeparture = d === b.checkOut
        if (isDeparture && !isArrival) {
          entry.am.push(b) // trả phòng lúc 12h → chỉ buổi sáng
        } else if (isArrival && !isDeparture) {
          entry.pm.push(b) // nhận phòng lúc 14h → chỉ buổi chiều/tối
        } else {
          entry.am.push(b) // ở trọn ngày
          entry.pm.push(b)
        }
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
          <p className="text-xs text-gray-400 mt-0.5">
            Nhận phòng {CHECK_IN_TIME} · Trả phòng {CHECK_OUT_TIME}
          </p>
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
              return tileClassFor(dateMap.get(toLocalStr(date)))
            }}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null
              const occ = dateMap.get(toLocalStr(date))
              if (!occ) return null
              const list = occ.all

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
            style={{ background: 'linear-gradient(135deg, #fef3c7 0 44%, #fff 44% 56%, #d1fae5 56%)' }}
          />
          <span>Trả/Nhận trong ngày (dọn {CHECK_OUT_TIME}–{CHECK_IN_TIME})</span>
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
