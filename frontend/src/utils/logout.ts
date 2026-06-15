import { logout as authLogout } from '@/features/identity/api/authApi';

/**
 * Função centralizada para fazer logout automático
 * Usada quando o backend retorna 401 (não autorizado)
 */
export async function performLogout() {
  console.log('[Logout Utils] Iniciando logout automático');
  
  // Verificar se já estamos na página de login para evitar loop
  if (window.location.pathname === '/') {
    console.log('[Logout Utils] Já estamos na página de login, evitando redirecionamento');
    return;
  }
  
  try {
    // Limpar cookies HTTP-only
    await authLogout()
  } catch (error) {
    console.error('Erro ao limpar cookies no logout:', error)
  }
  
  // Limpar todos os itens do localStorage que começam com @ti-assistant:
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('@ti-assistant:')) {
        localStorage.removeItem(key)
      }
    })
    
    // Limpar outros itens específicos
    localStorage.removeItem('filters')
    localStorage.removeItem('searchQuery')
    localStorage.removeItem('selectedUnit')
    localStorage.removeItem('selectedSector')
    localStorage.removeItem('selectedEnvironment')
    localStorage.removeItem('selectedBranch')
    localStorage.removeItem('selectedCategory')
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error)
  }
  
  // Expirar cookies não-HttpOnly relacionados ao app
  try {
    const parts = document.cookie.split(';')
    for (const part of parts) {
      const name = part.split('=')[0]?.trim()
      if (!name) continue
      if (name.startsWith('@ti-assistant:')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      }
    }
  } catch (error) {
    console.error('Erro ao limpar cookies:', error)
  }
  
  // Redirecionar para login apenas se não estivermos já na página de login
  if (window.location.pathname !== '/') {
    window.location.href = '/'
  }
}
