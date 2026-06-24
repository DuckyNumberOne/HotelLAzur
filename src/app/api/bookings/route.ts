import { NextRequest, NextResponse } from 'next/server'
import { getBookings, createBooking } from '@/lib/sheetsApi'
import { bookingSchema } from '@/lib/schemas'

export async function GET() {
  try {
    const bookings = await getBookings()
    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = bookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: result.error.issues },
        { status: 400 }
      )
    }
    const booking = await createBooking(result.data)
    return NextResponse.json(booking, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
