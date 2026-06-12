'use client'

import { useState, useEffect, useCallback } from 'react'
import NiceModal from '@ebay/nice-modal-react'
import { BookingCalendar } from '@/components/BookingCalendar'
import { BookingList } from '@/components/BookingList'
import { BookingModal } from '@/components/BookingModal'
import { AnalyticsSection } from '@/components/AnalyticsSection'
import type { Booking } from '@/types/booking'
import { STATUS_LABELS } from '@/types/booking'

type Tab = 'overview' | 'analytics'

export default function HomePage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings')
      setBookings(await res.json())
    } catch {
      /* silent */
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const openModal = () => NiceModal.show(BookingModal, { onSuccess: fetchBookings })

  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')
  const totalRevenue = activeBookings.reduce((s, b) => s + b.totalPrice, 0)
  const totalDeposit = activeBookings.reduce((s, b) => s + b.deposit, 0)
  const totalRemaining = activeBookings.reduce((s, b) => s + b.remaining, 0)

  const stats = [
    { label: 'Đặt phòng', value: String(activeBookings.length), icon: '📋', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Doanh thu', value: fmtMoney(totalRevenue), icon: '💰', color: 'bg-green-50 text-green-700 border-green-100' },
    { label: 'Đã cọc', value: fmtMoney(totalDeposit), icon: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { label: 'Còn thu', value: fmtMoney(totalRemaining), icon: '⏳', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  ]

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Tổng Quan', icon: '📅' },
    { key: 'analytics', label: 'Phân Tích', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-geist)]">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight truncate">
              🏨 L&apos;Azur Cửa Lò
            </h1>
            <p className="text-blue-300 text-xs sm:text-sm hidden xs:block">
              Resort &amp; Hotel — Quản lý đặt phòng
            </p>
          </div>
          <button
            onClick={openModal}
            className="shrink-0 flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white text-blue-800 rounded-xl font-semibold text-xs sm:text-sm hover:bg-blue-50 transition-colors shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Đặt phòng mới</span>
            <span className="sm:hidden">Đặt phòng</span>
          </button>
        </div>
      </header>

      {/* ── Hero banner ── */}
      <div
        className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden"
        style={{ minHeight: '120px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/thumbnail.png"
          alt="L'Azur Cửa Lò Resort & Hotel"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 text-center">
          <p className="text-blue-200 text-xs sm:text-sm font-medium uppercase tracking-widest mb-1">
            Khách sạn biển đẳng cấp 5 sao
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold drop-shadow mb-1">L&apos;Azur Cửa Lò</h2>
          <p className="text-blue-200 text-sm sm:text-base mb-4">
            Đường Trinh Công Sơn, Cửa Lò, Nghệ An
          </p>
          <div className="flex justify-center gap-3 sm:gap-8 text-xs sm:text-sm flex-wrap">
            {[
              { num: '⭐⭐⭐⭐⭐', label: '5 Sao' },
              { num: '24/7', label: 'Luôn mở cửa' },
              { num: '0915383632', label: 'Hotline' },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-base sm:text-xl font-bold">{num}</div>
                <div className="text-blue-300 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
              {stats.map(({ label, value, icon, color }) => (
                <div key={label} className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${color}`}>
                  <p className="text-xs font-medium opacity-70 truncate">{label}</p>
                  <p className="text-sm sm:text-base font-bold mt-1 truncate">
                    {icon} {value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Status pills ── */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(STATUS_LABELS).map(([key, s]) => {
                const count = bookings.filter((b) => b.status === key).length
                return (
                  <span key={key} className={`text-xs font-medium px-3 py-1.5 rounded-full ${s.cls}`}>
                    {s.label}: {count}
                  </span>
                )
              })}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
              {tabs.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === key
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <BookingCalendar bookings={bookings} />
                <BookingList bookings={bookings} onRefresh={fetchBookings} />
              </div>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsSection bookings={bookings} />
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-6 mt-4 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm space-y-1">
          <p className="font-semibold text-gray-200">L&apos;Azur Cửa Lò Resort &amp; Hotel</p>
          <p>Đường Trinh Công Sơn, Cửa Lò, Nghệ An, Vietnam</p>
          <p>
            <a href="tel:0915383632" className="hover:text-white transition-colors">0915383632</a>
            {' / '}
            <a href="tel:0812059868" className="hover:text-white transition-colors">0812059868</a>
          </p>
          <div className="flex justify-center gap-4 pt-1">
            <a
              href="https://www.facebook.com/profile.php?id=61590774117279"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/lazur_apartmentcl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition-colors"
            >
              Instagram @lazur_apartmentcl
            </a>
          </div>
          <p className="text-gray-600 pt-2">© 2025 L&apos;Azur Cửa Lò. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'tr'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return n.toLocaleString('vi-VN') + 'đ'
}
