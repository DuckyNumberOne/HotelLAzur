import type { Booking } from '@/types/booking'

const bookings: Booking[] = []

export function getBookings(): Booking[] {
  return [...bookings]
}

export function addBooking(data: Omit<Booking, 'id' | 'totalPrice' | 'remaining' | 'createdAt'>): Booking {
  const nights = Math.max(
    1,
    Math.ceil((new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86400000)
  )
  const totalPrice = data.pricePerNight * nights
  const commission = Math.round(totalPrice * ((data.hoaHongBenThu3 ?? 0) / 100))
  const booking: Booking = {
    ...data,
    id: crypto.randomUUID(),
    totalPrice,
    remaining: totalPrice - commission - data.deposit,
    createdAt: new Date().toISOString(),
  }
  bookings.push(booking)
  return booking
}

export function updateBooking(
  id: string,
  data: Omit<Booking, 'id' | 'totalPrice' | 'remaining' | 'createdAt'>
): Booking | null {
  const idx = bookings.findIndex((b) => b.id === id)
  if (idx === -1) return null
  const nights = Math.max(
    1,
    Math.ceil((new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86400000)
  )
  const totalPrice = data.pricePerNight * nights
  const commission = Math.round(totalPrice * ((data.hoaHongBenThu3 ?? 0) / 100))
  const updated: Booking = {
    ...bookings[idx],
    ...data,
    totalPrice,
    remaining: totalPrice - commission - data.deposit,
  }
  bookings[idx] = updated
  return updated
}

export function deleteBooking(id: string): boolean {
  const idx = bookings.findIndex((b) => b.id === id)
  if (idx === -1) return false
  bookings.splice(idx, 1)
  return true
}
