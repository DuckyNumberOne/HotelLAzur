import { z } from 'zod'

export const bookingSchema = z
  .object({
    guestName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
    phone: z
      .string()
      .regex(/^(0|\+84)[0-9]{9,10}$/, 'SĐT không hợp lệ (VD: 0901234567)'),
    bookingDate: z.string().optional().default(''),
    checkIn: z.string().min(1, 'Vui lòng chọn ngày check-in'),
    checkOut: z.string().min(1, 'Vui lòng chọn ngày check-out'),
    guests: z.coerce.number().int().min(1, 'Ít nhất 1 người').max(50, 'Tối đa 50 người'),
    pricePerNight: z.coerce.number(),
    deposit: z.coerce.number().min(0, 'Tiền cọc không hợp lệ'),
    hoaHongBenThu3: z.coerce.number().min(0, 'Tối thiểu 0%').max(100, 'Tối đa 100%').default(5),
    status: z.enum(['pending', 'paid', 'cancelled'] as const),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (d) => !d.checkIn || !d.checkOut || new Date(d.checkOut) > new Date(d.checkIn),
    { message: 'Ngày check-out phải sau ngày check-in', path: ['checkOut'] }
  )

export type BookingFormInput = z.input<typeof bookingSchema>
export type BookingFormData = z.output<typeof bookingSchema>
