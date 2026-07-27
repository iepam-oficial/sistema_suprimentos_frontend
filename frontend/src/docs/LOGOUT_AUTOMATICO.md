# Sistema de Logout Automático

## Visão Geral

O sistema implementa logout automático quando o backend retorna status 401 (Não Autorizado), garantindo que usuários sejam redirecionados para o login quando suas sessões expiram ou tokens se tornam inválidos.

## Componentes Implementados

### 1. Função Centralizada (`/utils/logout.ts`)
- **`performLogout()`**: Função centralizada que executa logout completo
- Limpa cookies HTTP-only via API
- Remove dados do localStorage
- Expira cookies do navegador
- Redireciona para página de login

### 2. Interceptor Axios (`/lib/axios.ts`)
- Intercepta respostas 401 de requisições Axios
- Chama automaticamente `performLogout()`
- Funciona para todas as requisições feitas via `api` (axios)

### 3. Interceptor Fetch Global (`/app/providers.tsx`)
- Intercepta respostas 401 de requisições fetch nativas
- Chama automaticamente `performLogout()`
- Funciona para todas as requisições fetch do navegador

### 4. Hook Personalizado (`/hooks/useLogout.ts`)
- Hook `useLogout()` para logout manual em componentes
- Usado no Sidebar e outros componentes
- Fornece função `logout()` limpa e reutilizável

## Fluxo de Funcionamento

```
Requisição → Backend → 401 Response
     ↓
Interceptor (Axios/Fetch) detecta 401
     ↓
Chama performLogout()
     ↓
Limpa cookies HTTP-only via /api/auth/logout
     ↓
Remove dados do localStorage
     ↓
Expira cookies do navegador
     ↓
Redireciona para / (login)
```

## Cobertura

### ✅ Interceptado Automaticamente:
- Requisições Axios (`api.get()`, `api.post()`, etc.)
- Requisições fetch nativas (`fetch()`)
- Todas as rotas da aplicação

### ✅ Limpeza Completa:
- Cookies HTTP-only (via API)
- Cookies do navegador
- localStorage (@ti-assistant:*)
- Dados específicos (filters, searchQuery, etc.)

### ✅ Redirecionamento:
- Automático para `/` (página de login)
- Usa `window.location.href` para garantir limpeza completa

## Uso em Componentes

```typescript
import { useLogout } from '@/hooks/useLogout'

function MeuComponente() {
  const { logout } = useLogout()
  
  const handleLogout = () => {
    logout() // Executa logout manual
  }
  
  return <button onClick={handleLogout}>Sair</button>
}
```

## Logs de Debug

O sistema inclui logs detalhados para facilitar debugging:
- `[Axios Interceptor] 401 detectado, fazendo logout automático`
- `[Fetch Interceptor] 401 detectado, fazendo logout automático`
- `[Logout Utils] Iniciando logout automático`
- `[useLogout] Iniciando logout manual`

## Vantagens

1. **Automático**: Não requer intervenção manual
2. **Completo**: Limpa todos os dados de sessão
3. **Centralizado**: Lógica em um só lugar
4. **Robusto**: Funciona com Axios e fetch
5. **Consistente**: Mesmo comportamento em toda aplicação
6. **Seguro**: Redireciona imediatamente após 401
