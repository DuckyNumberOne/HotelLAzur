export type BookingStatus = 'pending' | 'paid' | 'cancelled'

export interface Booking {
  id: string
  guestName: string
  phone: string
  bookingDate: string
  checkIn: string
  checkOut: string
  guests: number
  pricePerNight: number
  totalPrice: number
  deposit: number
  remaining: number
  hoaHongBenThu3: number
  status: BookingStatus
  notes?: string
  createdAt: string
}

export const STATUS_LABELS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: 'Đang đặt', cls: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Hủy phòng', cls: 'bg-red-100 text-red-600' },
}
