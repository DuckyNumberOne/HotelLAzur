'use client'

import { useState } from 'react'
import NiceModal from '@ebay/nice-modal-react'
import type { Booking } from '@/types/booking'
import { STATUS_LABELS } from '@/types/booking'
import { BookingModal } from './BookingModal'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface BookingListProps {
  bookings: Booking[]
  onRefresh?: () => void
}

function fmt(d: string) {
  return format(new Date(d + 'T00:00:00'), 'dd/MM/yy', { locale: vi })
}

function fmtFull(d: string) {
  return format(new Date(d + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'tr'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return n.toLocaleString('vi-VN')
}

function ConfirmDeleteDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Xác nhận xóa</h3>
            <p className="text-sm text-gray-500">Xóa đặt phòng của <span className="font-medium">{name}</span>?</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">Thao tác này không thể hoàn tác.</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

export function BookingList({ bookings, onRefresh }: BookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null)

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  )

  const handleEdit = (b: Booking) => {
    NiceModal.show(BookingModal, { booking: b, onSuccess: onRefresh })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBooking) return
    setDeletingId(deletingBooking.id)
    try {
      await fetch(`/api/bookings/${deletingBooking.id}`, { method: 'DELETE' })
      onRefresh?.()
    } finally {
      setDeletingId(null)
      setDeletingBooking(null)
    }
  }

  return (
    <>
      {deletingBooking && (
        <ConfirmDeleteDialog
          name={deletingBooking.guestName}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingBooking(null)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Danh Sách Đặt Phòng</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tất cả lịch đặt</p>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {bookings.length}
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="font-medium text-sm">Chưa có đặt phòng nào</p>
            <p className="text-xs mt-1">Nhấn &ldquo;Đặt phòng&rdquo; để thêm mới</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] sm:max-h-[560px] overflow-y-auto pr-0.5">
            {sorted.map((b) => {
              const nights = Math.ceil(
                (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000
              )
              const status = STATUS_LABELS[b.status]
              const isExpanded = expandedId === b.id
              const isDeleting = deletingId === b.id

              return (
                <div
                  key={b.id}
                  className={`border rounded-xl transition-all ${
                    isExpanded ? 'border-blue-200 shadow-sm' : 'border-gray-100 hover:border-blue-100'
                  }`}
                >
                  {/* Card header — always visible */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="min-w-0 text-left flex-1"
                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 text-sm sm:text-base">
                            {b.guestName}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                          <span>{b.phone}</span>
                          <span className="text-gray-300">·</span>
                          <span>{fmtFull(b.checkIn)} → {fmtFull(b.checkOut)}</span>
                          <span className="text-gray-300">·</span>
                          <span>{nights}đ/{b.guests} người</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-gray-400 tabular-nums mr-1">{fmt(b.bookingDate)}</span>
                        <button
                          onClick={() => handleEdit(b)}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingBooking(b)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : b.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Quick money summary */}
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="font-bold text-blue-700">{fmtMoney(b.totalPrice)}đ</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">Cọc: {fmtMoney(b.deposit)}đ</span>
                      {b.remaining > 0 && b.status !== 'cancelled' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-orange-600 font-medium">Còn: {fmtMoney(b.remaining)}đ</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-3 sm:px-4 pb-4 pt-3 space-y-3">
                      {/* Dates bar */}
                      <div className="flex items-center gap-1.5 text-xs bg-slate-50 rounded-lg px-2.5 py-2 text-gray-600 flex-wrap">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Check-in: {fmtFull(b.checkIn)}</span>
                        <span className="text-gray-300">→</span>
                        <span className="font-medium">Check-out: {fmtFull(b.checkOut)}</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{nights} đêm</span>
                        <span className="text-gray-400">{b.guests} người</span>
                      </div>

                      {/* Payment grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                        <div className="bg-gray-50 rounded-lg px-2 py-2 text-center">
                          <p className="text-gray-400">Giá/đêm</p>
                          <p className="font-semibold text-gray-700 mt-0.5">{fmtMoney(b.pricePerNight)}đ</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg px-2 py-2 text-center">
                          <p className="text-blue-400">Tổng tiền</p>
                          <p className="font-bold text-blue-700 mt-0.5">{fmtMoney(b.totalPrice)}đ</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-2 py-2 text-center">
                          <p className="text-gray-400">Đã cọc</p>
                          <p className="font-semibold text-gray-700 mt-0.5">{fmtMoney(b.deposit)}đ</p>
                        </div>
                        <div className={`rounded-lg px-2 py-2 text-center ${b.remaining > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                          <p className={b.remaining > 0 ? 'text-orange-400' : 'text-green-400'}>Còn lại</p>
                          <p className={`font-bold mt-0.5 ${b.remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {fmtMoney(Math.abs(b.remaining))}đ
                          </p>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Ngày đặt: <strong>{fmtFull(b.bookingDate)}</strong></span>
                        <span>ID: <code className="bg-gray-100 px-1 rounded text-gray-600">{b.id.slice(0, 8)}…</code></span>
                      </div>

                      {b.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800">
                          <span className="font-medium">Ghi chú:</span> {b.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
