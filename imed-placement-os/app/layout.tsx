import './globals.css'

export const metadata = {
  title: 'IMED Placement OS',
  description: 'AI-Powered Student Gap Analyzer & Placement Intelligence Hub — IMED Bharati Vidyapeeth',
  keywords: ['placement', 'ATS', 'resume analyzer', 'IMED', 'gap analysis', 'AI matching'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning stops browser extensions from crashing the dev server
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#070a13] text-slate-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}