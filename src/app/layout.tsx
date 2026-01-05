import type { Metadata } from 'next'
import './globals.css'

import { ThemeProvider } from './providers'

export const metadata: Metadata = {
  title: 'PONTOBASE',
  description: 'Sistema Corporativo de Controle de Ponto',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
