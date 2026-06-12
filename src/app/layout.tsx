import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const geist = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
})

const BRAND = "L'Azur Cửa Lò Resort & Hotel"
const DESC =
  "Căn hộ cao cấp 5 sao L'Azur Cửa Lò view biển tầng 7 căn góc mới tinh. Vị trí đắc địa tại Đường Trinh Công Sơn, Cửa Lò, Nghệ An. Hotline: 0915383632 / 0812059868."

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: BRAND,
    template: `%s | ${BRAND}`,
  },
  description: DESC,
  keywords: [
    "L'Azur Cửa Lò",
    'khách sạn Cửa Lò',
    'resort Nghệ An',
    'căn hộ 5 sao Cửa Lò',
    'view biển Cửa Lò',
    'đặt phòng Cửa Lò',
    'khách sạn biển Nghệ An',
    'Trinh Công Sơn Cửa Lò',
  ],
  authors: [{ name: BRAND }],
  creator: BRAND,
  publisher: BRAND,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: BRAND,
    title: BRAND,
    description: DESC,
    images: [
      {
        url: '/thumbnail.png',
        width: 1360,
        height: 680,
        alt: "L'Azur Cửa Lò Resort & Hotel - Khách sạn biển đẳng cấp 5 sao",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND,
    description: DESC,
    images: ['/thumbnail.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: BRAND,
  description: DESC,
  image: '/thumbnail.png',
  starRating: { '@type': 'Rating', ratingValue: '5' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Đường Trinh Công Sơn',
    addressLocality: 'Cửa Lò',
    addressRegion: 'Nghệ An',
    addressCountry: 'VN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 18.8167,
    longitude: 105.7167,
  },
  telephone: ['+84915383632', '+84812059868'],
  openingHours: 'Mo-Su 00:00-23:59',
  sameAs: [
    'https://www.facebook.com/profile.php?id=61590774117279',
    'https://www.instagram.com/lazur_apartmentcl',
  ],
  url: 'https://www.facebook.com/profile.php?id=61590774117279',
  priceRange: '₫₫₫₫₫',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={geist.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
