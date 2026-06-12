'use client'

import { useState, useEffect } from 'react'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { BookingForm } from './BookingForm'
import type { BookingFormData, BookingFormInput } from '@/lib/schemas'
import type { Booking } from '@/types/booking'

interface BookingModalProps {
  onSuccess?: () => void
  booking?: Booking
}

export const BookingModal = NiceModal.create<BookingModalProps>(({ onSuccess, booking }) => {
  const modal = useModal()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (modal.visible) {
      setSuccess(false)
      setError(null)
    }
  }, [modal.visible])

  const isEdit = !!booking

  const defaultValues: Partial<BookingFormInput> | undefined = booking
    ? {
        guestName: booking.guestName,
        phone: booking.phone,
        bookingDate: booking.bookingDate,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        pricePerNight: booking.pricePerNight,
        deposit: booking.deposit,
        status: booking.status,
        notes: booking.notes ?? '',
      }
    : undefined

  const handleSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const url = isEdit ? `/api/bookings/${booking.id}` : '/api/bookings'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Thao tác thất bại')
      }
      setSuccess(true)
      onSuccess?.()
      setTimeout(() => modal.hide(), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!modal.visible) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isSubmitting && modal.hide()}
      />

      <div className="
        relative z-10 w-full bg-white
        rounded-t-2xl sm:rounded-2xl
        shadow-2xl
        sm:max-w-2xl
        max-h-[92dvh] sm:max-h-[90vh]
        flex flex-col
      ">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {isEdit ? 'Chỉnh Sửa Đặt Phòng' : 'Đặt Phòng Mới'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
              {isEdit ? `Cập nhật thông tin cho ${booking.guestName}` : "L'Azur Cửa Lò Resort & Hotel"}
            </p>
          </div>
          <button
            onClick={() => !isSubmitting && modal.hide()}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {isEdit ? 'Cập nhật thành công!' : 'Đặt phòng thành công!'}
              </h3>
              <p className="text-sm text-gray-500">Thông tin đã được lưu vào hệ thống.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  {error}
                </div>
              )}
              <BookingForm
                formId="booking-form"
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                defaultValues={defaultValues}
              />
            </>
          )}
        </div>

        {!success && (
          <div className="shrink-0 flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={() => !isSubmitting && modal.hide()}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="booking-form"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang lưu...
                </span>
              ) : (
                isEdit ? 'Lưu thay đổi' : 'Xác nhận đặt phòng'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
