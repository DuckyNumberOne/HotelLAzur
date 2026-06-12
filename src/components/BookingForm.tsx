'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, type BookingFormInput, type BookingFormData } from '@/lib/schemas'
import { AppDateTimePicker } from './AppDateTimePicker'

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
  defaultValues?: Partial<BookingFormInput>
  submitLabel?: string
  formId?: string
}

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (err?: boolean) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
  }`

const readonlyCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 font-semibold'

export function BookingForm({ onSubmit, isSubmitting, onCancel, defaultValues, submitLabel, formId }: BookingFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingDate: today,
      checkIn: today,
      guests: 1,
      pricePerNight: 0,
      deposit: 0,
      status: 'pending',
      ...defaultValues,
    },
  })

  const [checkIn, checkOut, pricePerNight, deposit] = watch([
    'checkIn',
    'checkOut',
    'pricePerNight',
    'deposit',
  ])

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0
  const totalPrice = (Number(pricePerNight) || 0) * nights
  const remaining = totalPrice - (Number(deposit) || 0)

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Section: Thông tin khách */}
      <div>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
          Thông tin khách
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tên khách đặt" required error={errors.guestName?.message} className="sm:col-span-2">
            <input
              {...register('guestName')}
              type="text"
              placeholder="Nguyễn Văn A"
              className={inputCls(!!errors.guestName)}
            />
          </Field>

          <Field label="Số điện thoại" required error={errors.phone?.message}>
            <input
              {...register('phone')}
              type="tel"
              placeholder="0901234567"
              className={inputCls(!!errors.phone)}
            />
          </Field>

          <Field label="Ngày đặt" required error={errors.bookingDate?.message}>
            <Controller
              name="bookingDate"
              control={control}
              render={({ field }) => (
                <AppDateTimePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  min={today}
                  placeholder="Chọn ngày đặt"
                  error={!!errors.bookingDate}
                />
              )}
            />
          </Field>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Section: Thời gian lưu trú */}
      <div>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
          Thời gian lưu trú
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Ngày check-in" required error={errors.checkIn?.message}>
            <Controller
              name="checkIn"
              control={control}
              render={({ field }) => (
                <AppDateTimePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  min={today}
                  placeholder="Chọn ngày check-in"
                  error={!!errors.checkIn}
                />
              )}
            />
          </Field>

          <Field label="Ngày check-out" required error={errors.checkOut?.message}>
            <Controller
              name="checkOut"
              control={control}
              render={({ field }) => (
                <AppDateTimePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  min={checkIn || today}
                  placeholder="Chọn ngày check-out"
                  error={!!errors.checkOut}
                />
              )}
            />
          </Field>

          <Field label="Số người ở" required error={errors.guests?.message}>
            <input
              {...register('guests')}
              type="number"
              min={1}
              max={50}
              className={inputCls(!!errors.guests)}
            />
          </Field>
        </div>

        {nights > 0 && (
          <p className="mt-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
            Số đêm: <span className="font-semibold text-blue-700">{nights} đêm</span>
          </p>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* Section: Thanh toán */}
      <div>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
          Thanh toán
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Giá / đêm (VNĐ)" required error={errors.pricePerNight?.message}>
            <input
              {...register('pricePerNight')}
              type="number"
              placeholder="800000"
              className={inputCls(!!errors.pricePerNight)}
            />
          </Field>

          <Field label="Tổng tiền (VNĐ)">
            <div className={readonlyCls}>
              {totalPrice > 0 ? totalPrice.toLocaleString('vi-VN') + 'đ' : '—'}
            </div>
          </Field>

          <Field label="Đã cọc (VNĐ)" required error={errors.deposit?.message}>
            <input
              {...register('deposit')}
              type="number"
              min={0}
              step={50000}
              placeholder="0"
              className={inputCls(!!errors.deposit)}
            />
          </Field>

          <Field label="Còn lại (VNĐ)">
            <div
              className={`${readonlyCls} ${remaining < 0 ? 'text-red-600' : remaining === 0 ? 'text-green-600' : 'text-orange-600'}`}
            >
              {totalPrice > 0 ? remaining.toLocaleString('vi-VN') + 'đ' : '—'}
            </div>
          </Field>

          <Field label="Tình trạng" required error={errors.status?.message} className="sm:col-span-2">
            <select {...register('status')} className={inputCls(!!errors.status)}>
              <option value="pending">Đang đặt</option>
              <option value="paid">Đã thanh toán</option>
              <option value="cancelled">Hủy phòng</option>
            </select>
          </Field>
        </div>
      </div>

      <hr className="border-gray-100" />

      <Field label="Ghi chú" error={errors.notes?.message}>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Yêu cầu đặc biệt..."
          className={`${inputCls(!!errors.notes)} resize-none`}
        />
      </Field>

      {!formId && (
        <div className="flex gap-3 pt-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
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
              submitLabel ?? 'Xác nhận đặt phòng'
            )}
          </button>
        </div>
      )}
    </form>
  )
}
