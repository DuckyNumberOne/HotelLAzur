import { NextRequest, NextResponse } from 'next/server'
import { getBookingById, updateBooking, deleteBooking } from '@/lib/sheetsApi'
import { bookingSchema } from '@/lib/schemas'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = await getBookingById(id)
    if (!booking) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    return NextResponse.json(booking)
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
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
    const updated = await updateBooking(id, result.data)
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
  try {
    const { id } = await params
    const deleted = await deleteBooking(id)
    if (!deleted) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
