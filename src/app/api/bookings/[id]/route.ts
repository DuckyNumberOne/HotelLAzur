import { NextRequest, NextResponse } from 'next/server'
import { getBookings, updateBooking, deleteBooking } from '@/lib/store'
import { bookingSchema } from '@/lib/schemas'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const booking = getBookings().find((b) => b.id === id)
  if (!booking) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
  return NextResponse.json(booking)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = bookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: result.error.issues },
        { status: 400 }
      )
    }
    const updated = updateBooking(id, result.data)
    if (!updated) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const deleted = deleteBooking(id)
  if (!deleted) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
  return NextResponse.json({ success: true })
}
