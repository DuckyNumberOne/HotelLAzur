'use client'

import { useMemo } from 'react'
import type { Booking, BookingStatus } from '@/types/booking'
import { STATUS_LABELS } from '@/types/booking'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Props {
  bookings: Booking[]
}

/* ── helpers ──────────────────────────────────────────── */
function fmtM(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'tr'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return n.toLocaleString('vi-VN')
}

function getDates(start: string, end: string): string[] {
  const out: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    out.push(cur.toLocaleDateString('en-CA'))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#fbbf24',
  paid: '#34d399',
  cancelled: '#f87171',
}

/* ── Donut via conic-gradient ─────────────────────────── */
function DonutChart({
  data,
  total,
}: {
  data: { key: BookingStatus; pct: number }[]
  total: number
}) {
  let cum = 0
  const stops = data
    .filter((d) => d.pct > 0)
    .map((d) => {
      const start = cum
      cum += d.pct
      return `${STATUS_COLORS[d.key]} ${start.toFixed(1)}% ${cum.toFixed(1)}%`
    })
    .join(', ')

  if (stops === '') {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-gray-400">
        Không có dữ liệu
      </div>
    )
  }

  return (
    <div className="relative flex justify-center items-center">
      <div
        className="w-28 h-28 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      />
      <div className="absolute w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
        <span className="text-xl font-bold text-gray-800 leading-none">{total}</span>
        <span className="text-[9px] text-gray-400 mt-0.5">phòng</span>
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────── */
export function AnalyticsSection({ bookings }: Props) {
  const active = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled'),
    [bookings]
  )

  /* Monthly revenue */
  const monthlyData = useMemo(() => {
    const map = new Map<string, { revenue: number; count: number; deposit: number }>()
    active.forEach((b) => {
      const key = b.checkIn.slice(0, 7)
      const c = map.get(key) ?? { revenue: 0, count: 0, deposit: 0 }
      map.set(key, {
        revenue: c.revenue + b.totalPrice,
        count: c.count + 1,
        deposit: c.deposit + b.deposit,
      })
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({ month, ...d }))
  }, [active])

  /* Busiest dates — count concurrent guests */
  const busiestDates = useMemo(() => {
    const map = new Map<string, { bookingCount: number; guestCount: number; names: string[] }>()
    active.forEach((b) => {
      getDates(b.checkIn, b.checkOut).forEach((d) => {
        const c = map.get(d) ?? { bookingCount: 0, guestCount: 0, names: [] }
        map.set(d, {
          bookingCount: c.bookingCount + 1,
          guestCount: c.guestCount + b.guests,
          names: [...c.names, b.guestName],
        })
      })
    })
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.guestCount - a.guestCount || b.bookingCount - a.bookingCount)
      .slice(0, 10)
      .map(([date, d]) => ({ date, ...d }))
  }, [active])

  /* Status breakdown */
  const statusData = useMemo(() => {
    const total = bookings.length
    return (Object.keys(STATUS_LABELS) as BookingStatus[]).map((key) => {
      const count = bookings.filter((b) => b.status === key).length
      return {
        key,
        label: STATUS_LABELS[key].label,
        cls: STATUS_LABELS[key].cls,
        count,
        pct: total > 0 ? (count / total) * 100 : 0,
      }
    })
  }, [bookings])

  /* Averages */
  const avgNights = useMemo(() => {
    if (active.length === 0) return 0
    const n = active.reduce(
      (s, b) =>
        s + Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000),
      0
    )
    return n / active.length
  }, [active])

  const avgRevenue =
    active.length > 0 ? active.reduce((s, b) => s + b.totalPrice, 0) / active.length : 0

  const paidRate =
    bookings.length > 0
      ? Math.round((bookings.filter((b) => b.status === 'paid').length / bookings.length) * 100)
      : 0

  const totalGuests = active.reduce((s, b) => s + b.guests, 0)

  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1)
  const maxGuests = Math.max(...busiestDates.map((d) => d.guestCount), 1)

  /* Empty state */
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="font-medium text-gray-500">Chưa có dữ liệu để phân tích</p>
        <p className="text-sm text-gray-400 mt-1">Thêm đặt phòng để xem thống kê</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-600 rounded-full" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Phân Tích &amp; Thống Kê</h2>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          {
            icon: '🌙',
            label: 'TB số đêm',
            value: avgNights.toFixed(1),
            unit: 'đêm/lần',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            icon: '💰',
            label: 'TB doanh thu',
            value: fmtM(avgRevenue) + 'đ',
            unit: 'mỗi đặt phòng',
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            icon: '✅',
            label: 'Tỷ lệ đã TT',
            value: paidRate + '%',
            unit: 'so với tổng',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            icon: '👥',
            label: 'Tổng lượt khách',
            value: String(totalGuests),
            unit: 'người',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ].map(({ icon, label, value, unit, color, bg }) => (
          <div key={label} className={`rounded-xl p-3 sm:p-4 ${bg}`}>
            <p className="text-lg">{icon}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
            <p className="text-xs text-gray-400">{unit}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart + Status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly revenue bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800">Doanh thu theo tháng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tính theo ngày check-in</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
              {monthlyData.length} tháng
            </span>
          </div>

          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              Không có dữ liệu
            </div>
          ) : (
            <div className="space-y-2.5">
              {monthlyData.map(({ month, revenue, count, deposit }) => {
                const pct = (revenue / maxRevenue) * 100
                const depositPct = (deposit / revenue) * pct
                const [yr, mo] = month.split('-')
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 w-14 shrink-0 tabular-nums">
                      T{parseInt(mo)}/{yr.slice(2)}
                    </span>
                    <div className="flex-1 relative">
                      {/* Track */}
                      <div className="bg-gray-100 rounded-full h-7 overflow-hidden">
                        {/* Total */}
                        <div
                          className="h-full bg-blue-100 rounded-full absolute top-0 left-0 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                        {/* Deposit */}
                        <div
                          className="h-full bg-blue-500 rounded-full absolute top-0 left-0 transition-all duration-500"
                          style={{ width: `${Math.max(depositPct, 0)}%` }}
                        />
                        {/* Label inside */}
                        {pct > 30 && (
                          <div
                            className="absolute top-0 left-0 h-full flex items-center pl-2.5 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          >
                            <span className="text-xs font-bold text-blue-800 truncate">
                              {fmtM(revenue)}đ
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      {pct <= 30 && (
                        <p className="text-xs font-bold text-gray-700 tabular-nums">{fmtM(revenue)}đ</p>
                      )}
                      <p className="text-xs text-gray-400 tabular-nums">
                        {count} đặt · cọc {fmtM(deposit)}đ
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-100" />
              Tổng tiền
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              Đã cọc
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-1">Trạng thái</h3>
          <p className="text-xs text-gray-400 mb-4">Phân loại đặt phòng</p>

          <DonutChart
            data={statusData.map((s) => ({ key: s.key, pct: s.pct }))}
            total={bookings.length}
          />

          <div className="mt-4 space-y-2.5">
            {statusData.map(({ key, label, cls, count, pct }) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
                  <span className="font-bold text-gray-700 tabular-nums">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STATUS_COLORS[key],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Busiest dates */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">🔥 Ngày Đông Khách Nhất</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Tính tất cả ngày khách lưu trú (check-in → check-out)
            </p>
          </div>
          <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium shrink-0">
            Top {busiestDates.length}
          </span>
        </div>

        {busiestDates.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-gray-400">
            Không có dữ liệu
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {busiestDates.map(({ date, bookingCount, guestCount, names }, idx) => {
              const pct = (guestCount / maxGuests) * 100
              const d = new Date(date + 'T00:00:00')
              const isTop3 = idx < 3
              const topColors = ['bg-orange-400', 'bg-amber-400', 'bg-yellow-400']
              const barColors = ['bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 'bg-blue-400']

              return (
                <div
                  key={date}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isTop3 ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50 border border-transparent'
                  }`}
                >
                  {/* Rank badge */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isTop3 ? `${topColors[idx]} text-white` : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-gray-800 tabular-nums">
                          {format(d, 'dd/MM/yyyy', { locale: vi })}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {format(d, 'EEEE', { locale: vi })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-800">
                          {guestCount} <span className="text-xs font-normal text-gray-400">khách</span>
                        </p>
                        <p className="text-[10px] text-gray-400">{bookingCount} phòng</p>
                      </div>
                    </div>

                    {/* Mini bar */}
                    <div className="mt-1.5 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          barColors[Math.min(idx, barColors.length - 1)]
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Guest names */}
                    <p className="text-[10px] text-gray-400 mt-1 truncate">
                      {names.slice(0, 3).join(' · ')}
                      {names.length > 3 && (
                        <span className="text-gray-300"> +{names.length - 3} khách</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Heat insight */}
        {busiestDates.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700 flex items-start gap-2">
            <span className="text-base shrink-0">💡</span>
            <span>
              Ngày đông nhất:{' '}
              <strong>
                {format(new Date(busiestDates[0].date + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })}
              </strong>{' '}
              với{' '}
              <strong>{busiestDates[0].guestCount} khách</strong>,{' '}
              {busiestDates[0].bookingCount} phòng được đặt.
            </span>
          </div>
        )}
      </div>

      {/* Revenue heatmap by day of week (if enough data) */}
      {active.length >= 3 && <WeekdayHeatmap bookings={active} />}
    </div>
  )
}

/* ── Weekday revenue heatmap ──────────────────────────── */
function WeekdayHeatmap({ bookings }: { bookings: Booking[] }) {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  const data = useMemo(() => {
    const map: Record<number, { revenue: number; count: number }> = {}
    for (let i = 0; i < 7; i++) map[i] = { revenue: 0, count: 0 }
    bookings.forEach((b) => {
      const dow = new Date(b.checkIn + 'T00:00:00').getDay()
      map[dow].revenue += b.totalPrice
      map[dow].count += 1
    })
    return map
  }, [bookings])

  const maxRev = Math.max(...Object.values(data).map((d) => d.revenue), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
      <h3 className="font-bold text-gray-800 mb-1">Doanh thu theo ngày trong tuần</h3>
      <p className="text-xs text-gray-400 mb-4">Tính theo ngày check-in</p>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((label, i) => {
          const { revenue, count } = data[i]
          const intensity = revenue / maxRev
          const bg =
            intensity === 0
              ? 'bg-gray-100'
              : intensity < 0.25
              ? 'bg-blue-100'
              : intensity < 0.5
              ? 'bg-blue-200'
              : intensity < 0.75
              ? 'bg-blue-400'
              : 'bg-blue-600'
          const textColor = intensity >= 0.5 ? 'text-white' : 'text-gray-700'

          return (
            <div
              key={label}
              className={`${bg} rounded-xl p-2 sm:p-3 flex flex-col items-center gap-1 transition-colors`}
              title={`${label}: ${fmtM(revenue)}đ, ${count} đặt`}
            >
              <span className={`text-xs font-bold ${textColor}`}>{label}</span>
              <span className={`text-[10px] sm:text-xs font-semibold ${textColor} tabular-nums`}>
                {revenue > 0 ? fmtM(revenue) : '—'}
              </span>
              {count > 0 && (
                <span className={`text-[9px] ${intensity >= 0.5 ? 'text-blue-100' : 'text-gray-400'}`}>
                  {count} đặt
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
        <span>Thấp</span>
        {['bg-gray-100', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600'].map((c) => (
          <span key={c} className={`w-4 h-2 rounded-sm ${c} border border-white/50`} />
        ))}
        <span>Cao</span>
      </div>
    </div>
  )
}
