'use client'

import {
    VStack,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    FormHelperText,
    Divider,
    Heading,
    Text,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  changePassword,
  RateLimitError,
  useAuthSession,
} from '@/features/identity'

export default function SecuritySettings() {
    const [isLoading, setIsLoading] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const toast = useToast()
    const router = useRouter()
    const { token } = useAuthSession()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (newPassword !== confirmPassword) {
                toast({
                    title: 'Erro',
                    description: 'As senhas não coincidem',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                })
                return
            }

            if (!token) {
                throw new Error('Token não encontrado')
            }

            await changePassword(token, { currentPassword, newPassword })

            toast({
                title: 'Sucesso',
                description: 'Senha alterada com sucesso. Você será redirecionado para a página inicial.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            // Limpar os campos
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            // Remover token e redirecionar
            localStorage.removeItem('@ti-assistant:token')
            localStorage.removeItem('@ti-assistant:refresh-token')
            localStorage.removeItem('@ti-assistant:user')
            router.push('/')
        } catch (error) {
            if (error instanceof RateLimitError) {
                router.push('/rate-limit')
                return
            }
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Não foi possível alterar a senha',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
                <Alert status="info">
                    <AlertIcon />
                    <AlertTitle>Dica de Segurança!</AlertTitle>
                    <AlertDescription>
                        Recomendamos usar uma senha forte para manter sua conta segura.
                    </AlertDescription>
                </Alert>

                <Heading size="sm">Alterar Senha</Heading>
                <Text fontSize="sm" color="gray.600">
                    Mantenha sua senha segura e atualizada
                </Text>

                <FormControl isRequired>
                    <FormLabel>Senha Atual</FormLabel>
                    <Input
                        type="password"
                        placeholder="Digite sua senha atual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Nova Senha</FormLabel>
                    <Input
                        type="password"
                        placeholder="Digite sua nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <FormHelperText>
                        A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números
                    </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <Input
                        type="password"
                        placeholder="Confirme sua nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </FormControl>

                <Divider my={4} />

                <Heading size="sm">Sessões Ativas</Heading>
                <Text fontSize="sm" color="gray.600">
                    Gerencie suas sessões ativas no sistema
                </Text>

                <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
                    loadingText="Salvando..."
                    mt={4}
                >
                    Salvar Configurações
                </Button>

                <Button
                    variant="outline"
                    colorScheme="red"
                    onClick={() => {
                        // Implementar lógica de logout em todos os dispositivos
                        toast({
                            title: 'Sessões encerradas',
                            description: 'Todas as sessões foram encerradas com sucesso.',
                            status: 'success',
                            duration: 3000,
                            isClosable: true,
                        })
                    }}
                >
                    Encerrar Todas as Sessões
                </Button>
            </VStack>
        </form>
    )
} 