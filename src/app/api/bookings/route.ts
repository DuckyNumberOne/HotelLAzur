import { NextRequest, NextResponse } from 'next/server'
import { getBookings, addBooking } from '@/lib/store'
import { bookingSchema } from '@/lib/schemas'

export async function GET() {
  return NextResponse.json(getBookings())
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
    const booking = addBooking(result.data)
    return NextResponse.json(booking, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
