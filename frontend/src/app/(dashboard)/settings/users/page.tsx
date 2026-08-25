'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Heading } from '@chakra-ui/react'
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess'
import UserManagement from '../components/UserManagement'

export default function UsersPage() {
  const router = useRouter()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}')
    const access = assertPageAccess(resolveUserRoles(user), ['ADMIN'])
    if (!access.allowed) {
      router.replace(access.redirectTo)
    }
  }, [router])

  return (
    <Box>
      <Heading size="lg" mb={6}>Configurações de Usuários</Heading>
      <UserManagement />
    </Box>
  )
}
