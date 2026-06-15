import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSession } from '@/features/identity'

/**
 * Hook personalizado para logout
 * Fornece uma função de logout que pode ser usada em componentes
 */
export function useLogout() {
  const router = useRouter()
  const { logout: sessionLogout } = useAuthSession()

  const logout = useCallback(async () => {
    console.log('[useLogout] Iniciando logout manual')

    await sessionLogout()

    localStorage.removeItem('filters')
    localStorage.removeItem('searchQuery')
    localStorage.removeItem('selectedUnit')
    localStorage.removeItem('selectedSector')
    localStorage.removeItem('selectedEnvironment')
    localStorage.removeItem('selectedBranch')
    localStorage.removeItem('selectedCategory')

    try {
      const parts = document.cookie.split(';')
      for (const part of parts) {
        const name = part.split('=')[0]?.trim()
        if (!name) continue
        if (name.startsWith('@ti-assistant:')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        }
      }
    } catch {}

    router.push('/')
  }, [router, sessionLogout])

  return { logout }
}
