'use client'

import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { GlobalProvider } from '@/contexts/GlobalContext'
import { AuthSessionProvider } from '@/features/identity'
import { CartProvider } from '@/features/supply-requests/context/CartContext'
import { InventoryCacheProvider } from '@/features/inventory/context/InventoryCacheContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { handle401WithRefresh, shouldSkip401Handling } from '@/utils/auth401Handler'
import { ChakraColorModeSync } from '@/components/ChakraColorModeSync'

const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        backgroundImage: props.colorMode === 'dark'
          ? 'url("/gb_ilustration/coolbackgrounds-fractalize-spectrum_dark.png")'
          : 'url("/gb_ilustration/coolbackgrounds-topography-hyphy_ligth.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      },
    }),
  },
  components: {
    Spinner: {
      baseStyle: {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: 'full',
        borderColor: 'transparent',
        borderTopColor: 'blue.500',
        animation: 'spin 0.45s linear infinite',
      },
    },
    Box: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      }),
    },
    Text: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      }),
    },
    Heading: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      }),
    },
    Badge: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
      }),
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).__fetchPatched) return
    ;(window as any).__fetchPatched = true

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      const response = await originalFetch(input, init)

      if (response.status !== 401 || shouldSkip401Handling(url)) {
        return response
      }

      const retried = await handle401WithRefresh(url, () => {
        const headers = new Headers(init?.headers)
        const newToken = localStorage.getItem('@ti-assistant:token')
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`)
        }
        return originalFetch(input, { ...init, headers })
      })

      return retried ?? response
    }
  }, [router])

  return (
    <AuthSessionProvider>
      <CartProvider>
        <InventoryCacheProvider>
          <GlobalProvider>
            <ChakraProvider theme={theme}>
              <ChakraColorModeSync />
              {children}
            </ChakraProvider>
          </GlobalProvider>
        </InventoryCacheProvider>
      </CartProvider>
    </AuthSessionProvider>
  )
}
