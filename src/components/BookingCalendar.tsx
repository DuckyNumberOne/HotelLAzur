'use client'

import { useMemo, useState } from 'react'
import NiceModal from '@ebay/nice-modal-react'
import type { Booking } from '@/types/booking'
import { STATUS_LABELS, CHECK_IN_TIME, CHECK_OUT_TIME } from '@/types/booking'
import { BookingModal } from './BookingModal'

interface BookingCalendarProps {
  bookings: Booking[]
  onRefresh?: () => void
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Kích thước (px) — để lịch to, dễ đọc
const HEADER_H = 28 // chỗ cho số ngày
const LANE_H = 26 // chiều cao 1 thanh booking
const LANE_GAP = 4
const PAD_BOTTOM = 8

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
function parseYmd(s: string): Date {
  return new Date(s + 'T12:00:00')
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
/** Thứ 2 = 0 … CN = 6 */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}
function nights(ci: string, co: string): number {
  return Math.max(1, Math.round((parseYmd(co).getTime() - parseYmd(ci).getTime()) / 86_400_000))
}
function fmtDM(s: string): string {
  return `${s.slice(8, 10)}/${s.slice(5, 7)}`
}

/** Hai booking ở trùng ÍT NHẤT 1 đêm (1 phòng → đây là lỗi đặt trùng). Giao ca (A.out == B.in) KHÔNG tính. */
function overlapsNight(a: Booking, b: Booking): boolean {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut
}

interface Bar {
  booking: Booking
  startLine: number
  endLine: number
  lane: number
  isStart: boolean // ngày nhận phòng nằm trong tuần này
  isEnd: boolean // ngày trả phòng nằm trong tuần này
  conflict: boolean
}

/**
 * Xếp các booking trong 1 tuần vào các "lane" (hàng).
 * Dùng khoảng nửa-mở [checkIn, checkOut): giao ca cùng ngày KHÔNG đụng nhau → chung 1 hàng.
 * Chỉ khi trùng đêm thật mới phải tách hàng (và được đánh dấu conflict).
 */
function layoutWeek(week: Date[], bookings: Booking[], conflictIds: Set<string>): { bars: Bar[]; lanes: number } {
  const wsStr = ymd(week[0])
  const weStr = ymd(week[6])
  const items = bookings
    .filter((b) => b.status !== 'cancelled' && b.checkIn <= weStr && b.checkOut >= wsStr)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.checkOut.localeCompare(b.checkOut))

  const laneEnds: string[] = [] // checkOut của booking cuối trong mỗi lane
  const bars: Bar[] = []
  for (const b of items) {
    let lane = laneEnds.findIndex((end) => end <= b.checkIn) // <= : cho phép giao ca dùng lại hàng
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(b.checkOut)
    } else {
      laneEnds[lane] = b.checkOut
    }

    const isStart = b.checkIn >= wsStr
    const isEnd = b.checkOut <= weStr
    // 14 cột: ngày i = cột (2i+1, 2i+2). Sáng = 2i+1, chiều = 2i+2.
    // Nhận phòng 14h → bắt đầu ở nửa chiều; trả phòng 12h → kết thúc sau nửa sáng.
    const startLine = isStart ? 2 * mondayIndex(parseYmd(b.checkIn)) + 2 : 1
    const endLine = isEnd ? 2 * mondayIndex(parseYmd(b.checkOut)) + 2 : 15
    bars.push({ booking: b, startLine, endLine, lane, isStart, isEnd, conflict: conflictIds.has(b.id) })
  }
  return { bars, lanes: Math.max(1, laneEnds.length) }
}

export function BookingCalendar({ bookings, onRefresh }: BookingCalendarProps) {
  const todayStr = ymd(new Date())
  const [view, setView] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const active = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings])

  // Phát hiện đặt trùng phòng (1 phòng): cặp booking ở trùng đêm
  const { conflictIds, conflictPairs } = useMemo(() => {
    const ids = new Set<string>()
    const pairs: [Booking, Booking][] = []
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (overlapsNight(active[i], active[j])) {
          ids.add(active[i].id)
          ids.add(active[j].id)
          pairs.push([active[i], active[j]])
        }
      }
    }
    return { conflictIds: ids, conflictPairs: pairs }
  }, [active])

  const weeks = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const start = addDays(first, -mondayIndex(first))
    const lastDay = new Date(view.y, view.m + 1, 0)
    const end = addDays(lastDay, 6 - mondayIndex(lastDay))
    const ws: Date[][] = []
    let cur = start
    while (cur <= end) {
      ws.push(Array.from({ length: 7 }, (_, i) => addDays(cur, i)))
      cur = addDays(cur, 7)
    }
    return ws
  }, [view])

  const openEdit = (b: Booking) => {
    NiceModal.show(BookingModal, { booking: b, onSuccess: onRefresh })
  }
  const goMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  const goToday = () => {
    const d = new Date()
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  // Sắp check-in (4 ngày gần nhất từ hôm nay)
  const upcoming = useMemo(() => {
    const grouped: Record<string, Booking[]> = {}
    active
      .filter((b) => b.checkIn >= todayStr)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
      .forEach((b) => {
        ;(grouped[b.checkIn] ??= []).push(b)
      })
    return grouped
  }, [active, todayStr])
  const upcomingDates = Object.keys(upcoming).sort().slice(0, 4)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Lịch Đặt Phòng</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            1 phòng · Nhận {CHECK_IN_TIME} · Trả {CHECK_OUT_TIME}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToday}
            className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Hôm nay
          </button>
          <button
            onClick={() => goMonth(-1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Tháng trước"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700 tabular-nums min-w-[110px] text-center">
            Tháng {view.m + 1} năm {view.y}
          </span>
          <button
            onClick={() => goMonth(1)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Tháng sau"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cảnh báo đặt trùng phòng */}
      {conflictPairs.length > 0 && (
        <div className="mb-3 flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="min-w-0">
            <p className="font-semibold">Đặt trùng phòng ({conflictPairs.length})</p>
            <ul className="mt-0.5 space-y-0.5">
              {conflictPairs.slice(0, 3).map(([a, b], i) => (
                <li key={i} className="truncate">
                  {a.guestName} ({fmtDM(a.checkIn)}–{fmtDM(a.checkOut)}) ✕ {b.guestName} ({fmtDM(b.checkIn)}–{fmtDM(b.checkOut)})
                </li>
              ))}
              {conflictPairs.length > 3 && <li>… và {conflictPairs.length - 3} trùng khác</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Lịch timeline */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[600px] border border-gray-100 rounded-xl overflow-hidden">
          {/* Hàng thứ */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`py-2 text-center text-[11px] font-bold uppercase tracking-wide ${
                  i >= 5 ? 'text-rose-400' : 'text-gray-400'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Các tuần */}
          {weeks.map((week, wi) => {
            const { bars, lanes } = layoutWeek(week, bookings, conflictIds)
            const height = HEADER_H + lanes * (LANE_H + LANE_GAP) + PAD_BOTTOM
            return (
              <div
                key={wi}
                className="relative border-b border-gray-100 last:border-b-0"
                style={{ minHeight: height }}
              >
                {/* Nền các ô ngày */}
                <div className="absolute inset-0 grid grid-cols-7">
                  {week.map((d, di) => {
                    const inMonth = d.getMonth() === view.m
                    const isToday = ymd(d) === todayStr
                    const weekend = di >= 5
                    return (
                      <div
                        key={di}
                        className={`border-l border-gray-100 first:border-l-0 ${
                          isToday ? 'bg-blue-50/60' : inMonth ? '' : 'bg-gray-50/60'
                        }`}
                      >
                        <div className="px-2 pt-1.5">
                          <span
                            className={`inline-flex items-center justify-center text-xs leading-none ${
                              isToday
                                ? 'w-5 h-5 rounded-full bg-blue-600 text-white font-bold'
                                : inMonth
                                ? weekend
                                  ? 'text-rose-500 font-medium'
                                  : 'text-gray-700 font-medium'
                                : 'text-gray-300'
                            }`}
                          >
                            {d.getDate()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Thanh booking */}
                <div className="absolute left-0 right-0" style={{ top: HEADER_H }}>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: 'repeat(14, 1fr)',
                      gridAutoRows: `${LANE_H}px`,
                      rowGap: `${LANE_GAP}px`,
                    }}
                  >
                    {bars.map((bar) => {
                      const b = bar.booking
                      const paid = b.status === 'paid'
                      const colorCls = bar.conflict
                        ? 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-700 ring-inset'
                        : paid
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-amber-400 text-amber-950 hover:bg-amber-500'
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => openEdit(b)}
                          title={`${b.guestName}\n${fmtDM(b.checkIn)} → ${fmtDM(b.checkOut)} · ${nights(
                            b.checkIn,
                            b.checkOut
                          )} đêm\n${STATUS_LABELS[b.status].label} · ${b.guests} người${
                            bar.conflict ? '\n⚠ Trùng phòng!' : ''
                          }`}
                          style={{ gridColumn: `${bar.startLine} / ${bar.endLine}`, gridRow: bar.lane + 1 }}
                          className={`flex items-center min-w-0 px-2 text-[11px] font-semibold shadow-sm transition-colors ${colorCls} ${
                            bar.isStart ? 'rounded-l-md ml-0.5' : ''
                          } ${bar.isEnd ? 'rounded-r-md mr-0.5' : ''}`}
                        >
                          {bar.conflict && <span className="mr-1 shrink-0">⚠</span>}
                          <span className="truncate">{b.guestName}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chú thích */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm shrink-0 bg-amber-400" />
          <span>Đang đặt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm shrink-0 bg-emerald-500" />
          <span>Đã thanh toán</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm shrink-0 bg-rose-500 ring-2 ring-rose-700 ring-inset" />
          <span>Trùng phòng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-5 h-3 rounded-sm shrink-0"
            style={{ background: 'linear-gradient(90deg, #10b981 0 44%, #fff 44% 56%, #fbbf24 56%)' }}
          />
          <span>Giao ca: trả {CHECK_OUT_TIME} / nhận {CHECK_IN_TIME}</span>
        </div>
      </div>

      {/* Sắp check-in */}
      {upcomingDates.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sắp check-in</p>
          <div className="space-y-2.5">
            {upcomingDates.map((date) => {
              const dayBookings = upcoming[date]
              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-600 tabular-nums">{fmtDM(date)}</span>
                    {dayBookings.length > 1 && (
                      <span className="text-[10px] font-semibold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">
                        {dayBookings.length} lịch
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.map((b) => {
                      const s = STATUS_LABELS[b.status]
                      return (
                        <button
                          key={b.id}
                          onClick={() => openEdit(b)}
                          className="w-full flex items-center gap-2 text-xs pl-3 text-left hover:bg-gray-50 rounded py-0.5"
                        >
                          <span className="font-medium text-gray-700 truncate flex-1 min-w-0">{b.guestName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${s.cls}`}>{s.label}</span>
                        </button>
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
