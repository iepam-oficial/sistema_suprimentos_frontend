'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  useToast,
  Image,
  useBreakpointValue,
  Grid,
  GridItem,
  useColorModeValue,
} from '@chakra-ui/react'
import { EmailIcon, LockIcon } from '@chakra-ui/icons'
import { login, fetchSession } from '@/features/identity/api/authApi'
import { useAuthSession } from '@/features/identity'
import {
  getFromSearchParam,
  getPostLoginPath,
  redirectAfterLogin,
  resolvePostLoginPath,
} from '@/utils/postLoginRedirect'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()
  const { setSession, token, user } = useAuthSession()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // redireciona se já autenticado
  useEffect(() => {
    const from = getFromSearchParam()
    if (user && token) {
      const path = resolvePostLoginPath(user.roles ?? [], { from })
      if (path) {
        router.replace(path)
        return
      }
    }

    if (!token) {
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const sessionUser = await fetchSession(token)
        if (cancelled) return
        const path = resolvePostLoginPath(sessionUser.roles ?? [], { from })
        if (path) {
          router.replace(path)
        }
      } catch {
        /* ignore */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, token, user])

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400')
  const inputBg = useColorModeValue('white', 'gray.800')
  const inputBorder = useColorModeValue('gray.300', 'gray.600')
  const inputHoverBorder = useColorModeValue('gray.400', 'gray.500')
  const illustrationBg = useColorModeValue('blue.50', 'blue.900')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      const data = await login({ email, password })

      if (!data.user?.roles?.length) {
        throw new Error('Dados do usuário incompletos')
      }

      setSession(data)

      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      const defaultPath = getPostLoginPath(data.user.roles)
      if (!defaultPath) {
        throw new Error('Papel de usuário não reconhecido para redirecionamento')
      }

      redirectAfterLogin(data.user.roles, { from: getFromSearchParam() })
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: error instanceof Error ? error.message : 'Erro ao fazer login',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid
      templateColumns={isMobile ? "1fr" : "1fr 1fr"}
      minH="100vh"
      bg={bgColor}
    >
      <GridItem
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={isMobile ? 4 : 8}
      >
        <VStack
          as="form"
          onSubmit={handleSubmit}
          spacing={isMobile ? 4 : 6}
          w="full"
          maxW="400px"
        >

          <Text fontSize={isMobile ? "xl" : "2xl"} fontWeight="bold" color={textColor} textAlign="center">
            IEPAM suprimentos
          </Text>

          <Text color={secondaryTextColor} fontSize={isMobile ? "sm" : "md"} textAlign="center">
            Faça login para acessar o sistema
          </Text>

          <FormControl isRequired>
            <FormLabel fontSize={isMobile ? "sm" : "md"} color={textColor}>E-mail</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" height="full">
                <EmailIcon color={secondaryTextColor} boxSize={isMobile ? 4 : 5} />
              </InputLeftElement>
              <Input
                type="email"
                id="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size={isMobile ? "md" : "lg"}
                height={isMobile ? "40px" : "48px"}
                color={textColor}
                bg={inputBg}
                borderColor={inputBorder}
                _placeholder={{ color: secondaryTextColor }}
                _hover={{ borderColor: inputHoverBorder }}
                _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
              />
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize={isMobile ? "sm" : "md"} color={textColor}>Senha</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" height="full">
                <LockIcon color={secondaryTextColor} boxSize={isMobile ? 4 : 5} />
              </InputLeftElement>
              <Input
                type="password"
                id="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size={isMobile ? "md" : "lg"}
                height={isMobile ? "40px" : "48px"}
                color={textColor}
                bg={inputBg}
                borderColor={inputBorder}
                _placeholder={{ color: secondaryTextColor }}
                _hover={{ borderColor: inputHoverBorder }}
                _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
              />
            </InputGroup>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            size={isMobile ? "md" : "lg"}
            width="full"
            height={isMobile ? "40px" : "48px"}
            isLoading={loading}
            fontSize={isMobile ? "sm" : "md"}
          >
            Entrar
          </Button>
        </VStack>
      </GridItem>

      {!isMobile && (
        <GridItem
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={illustrationBg}
          p={8}
        >
          <Image
            src="/Secure-login.svg"
            alt="Login seguro"
            maxW="80%"
            height="auto"
          />
        </GridItem>
      )}
    </Grid>
  )
}
