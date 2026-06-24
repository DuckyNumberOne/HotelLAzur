import type { Booking } from '@/types/booking'

const API_URL = process.env.GOOGLE_APPS_SCRIPT_URL ?? ''

type SheetRow = Record<string, unknown>

// Sheets stores "YYYY-MM-DD" as a Date cell (UTC+7), serialized as UTC ISO timestamp.
// "2026-06-13 00:00 UTC+7" → "2026-06-12T17:00:00.000Z" → splits to wrong date.
// We compensate with +7h before extracting the date.
// New rows store dates as compact "YYYYMMDD" (a plain number Sheets won't auto-convert).
function normalizeDate(val: unknown): string {
  if (!val) return ''
  const s = String(val).trim()
  if (!s) return ''
  // ISO UTC timestamp from Sheets Date auto-conversion
  if (s.includes('T')) {
    const ms = Date.parse(s)
    if (isNaN(ms)) return ''
    const vn = new Date(ms + 7 * 60 * 60 * 1000) // UTC+7 (Vietnam)
    const y = vn.getUTCFullYear()
    const m = String(vn.getUTCMonth() + 1).padStart(2, '0')
    const d = String(vn.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  // Compact 8-digit format "20260613" (new rows) → "2026-06-13"
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  return s
}

// Sheets drops the leading zero from phone numbers stored as numeric cells.
// "0858888856" (10 digits) → stored as 858888856 (9 digits) → restore leading 0.
function normalizePhone(val: unknown): string {
  if (!val) return ''
  const s = String(val).trim()
  if (/^\d{9}$/.test(s)) return '0' + s
  return s
}

// Vietnam local time (UTC+7) formatted as ISO-like string for display in Sheets.
function nowVietnam(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString()
}

function fromSheet(row: SheetRow): Booking {
  return {
    id: String(row.id ?? ''),
    guestName: String(row.tenKhach ?? ''),
    phone: normalizePhone(row.sdt),
    bookingDate: normalizeDate(row.ngayDat),
    checkIn: normalizeDate(row.ngayDen),
    checkOut: normalizeDate(row.ngayDi),
    guests: Number(row.soNguoi ?? 0),
    pricePerNight: Number(row.giaDem ?? 0),
    totalPrice: Number(row.tongTien ?? 0),
    deposit: Number(row.tienCoc ?? 0),
    remaining: Number(row.conLai ?? 0),
    hoaHongBenThu3: Number(row.hoaHongBenThu3 ?? 5),
    status: (String(row.trangThai ?? 'pending')) as Booking['status'],
    notes: row.ghiChu ? String(row.ghiChu) : undefined,
    createdAt: String(row.ngayTao ?? new Date().toISOString()),
  }
}

// Some Sheet header cells may have a trailing tab (\t) due to copy-paste.
// We send both the clean key and the tab-suffixed variant so the Apps Script
// header-mapping works regardless of which form the header is in.
function toSheet(booking: Booking): SheetRow {
  const fields: [string, unknown][] = [
    ['id', booking.id],
    ['tenKhach', booking.guestName],
    ['sdt', booking.phone],
    ['ngayDat', booking.bookingDate],
    ['ngayDen', booking.checkIn],
    ['ngayDi', booking.checkOut],
    ['soNguoi', booking.guests],
    ['giaDem', booking.pricePerNight],
    ['tongTien', booking.totalPrice],
    ['tienCoc', booking.deposit],
    ['conLai', booking.remaining],
    ['hoaHongBenThu3', booking.hoaHongBenThu3],
    ['trangThai', booking.status],
    ['ghiChu', booking.notes ?? ''],
    ['ngayTao', booking.createdAt],
  ]
  const row: SheetRow = {}
  for (const [key, val] of fields) {
    row[key] = val
    row[key + '\t'] = val  // trailing-tab variant for unclean sheet headers
  }
  return row
}

function calcDerived(data: Omit<Booking, 'id' | 'totalPrice' | 'remaining' | 'createdAt'>) {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86_400_000
    )
  )
  const totalPrice = data.pricePerNight * nights
  const commission = Math.round(totalPrice * (data.hoaHongBenThu3 ?? 0) / 100)
  const netRevenue = totalPrice - commission
  return { totalPrice, remaining: netRevenue - data.deposit }
}

export async function getBookings(): Promise<Booking[]> {
  const res = await fetch(API_URL, { cache: 'no-store' })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message ?? 'Lỗi khi lấy dữ liệu')
  return (json.data as SheetRow[]).map(fromSheet)
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const res = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
  const json = await res.json()
  if (json.status !== 'success') return null
  return fromSheet(json.data as SheetRow)
}

export async function createBooking(
  data: Omit<Booking, 'id' | 'totalPrice' | 'remaining' | 'createdAt'>
): Promise<Booking> {
  const { totalPrice, remaining } = calcDerived(data)
  const booking: Booking = {
    ...data,
    id: crypto.randomUUID(),
    totalPrice,
    remaining,
    createdAt: nowVietnam(),
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data: toSheet(booking) }),
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message ?? 'Lỗi khi tạo booking')
  return booking
}

export async function updateBooking(
  id: string,
  data: Omit<Booking, 'id' | 'totalPrice' | 'remaining' | 'createdAt'>
): Promise<Booking | null> {
  const existing = await getBookingById(id)
  if (!existing) return null
  const { totalPrice, remaining } = calcDerived(data)
  const updated: Booking = { ...existing, ...data, totalPrice, remaining }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', id, data: toSheet(updated) }),
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message ?? 'Lỗi khi cập nhật booking')
  return updated
}

export async function deleteBooking(id: string): Promise<boolean> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', id }),
  })
  const json = await res.json()
  return json.status === 'success'
}
