'use client'

import {
    Box,
    Heading,
    VStack,
    useColorModeValue,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    useColorMode,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import GeneralSettings from './GeneralSettings';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import IntegrationSettings from './IntegrationSettings';
import UnitOfMeasureSettings from './UnitOfMeasureSettings';
import CategorySettings from './CategorySettings';
import EnviromentSettings from './EnviromentSettings';
import UserManagement from './UserManagement';
import ThemeSettings from './ThemeSettings';
import { isAdmin } from '@ti-assistant/contracts/dist/roles';
import { resolveUserRoles } from '@/utils/pageAccess';

export function MobileSettings() {
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const { colorMode } = useColorMode();
    const bgColor = useColorModeValue('rgba(255, 255, 255, 0.5)', 'rgba(45, 55, 72, 0.5)');
    const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');
    const textColor = useColorModeValue('gray.800', 'white');
    const accordionBg = useColorModeValue('rgba(255, 255, 255, 0.5)', 'rgba(45, 55, 72, 0.5)');
    const accordionHoverBg = useColorModeValue('rgba(255, 255, 255, 0.6)', 'rgba(45, 55, 72, 0.6)');
    const accordionBorderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
        setUserRoles(resolveUserRoles(user));
    }, []);

    const isEmployeeOnly = userRoles.length > 0 && userRoles.every((r) => r === 'EMPLOYEE');
    const userIsAdmin = isAdmin(userRoles);

    return (
        <Box w="full" h="full" py="6vh">
            <VStack
                spacing={4}
                align="stretch"
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                backdropFilter="blur(12px)"
                p={3}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                h="full"
            >
                <Heading size="lg" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Configurações</Heading>
                <Accordion allowMultiple>
                    <AccordionItem
                        borderColor={accordionBorderColor}
                        bg={accordionBg}
                        backdropFilter="blur(12px)"
                        _hover={{
                            bg: accordionHoverBg,
                            transform: 'translateY(-2px)',
                            shadow: 'lg'
                        }}
                        mb={2}
                        rounded="lg"
                        transition="all 0.3s ease"
                    >
                        <h2>
                            <AccordionButton>
                                <Box as="span" flex="1" textAlign="left" color={textColor}>
                                    Tema
                                </Box>
                                <AccordionIcon color={textColor} />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <ThemeSettings />
                        </AccordionPanel>
                    </AccordionItem>

                    {/* Segurança - Sempre visível */}
                    <AccordionItem
                        borderColor={accordionBorderColor}
                        bg={accordionBg}
                        backdropFilter="blur(12px)"
                        _hover={{
                            bg: accordionHoverBg,
                            transform: 'translateY(-2px)',
                            shadow: 'lg'
                        }}
                        mb={2}
                        rounded="lg"
                        transition="all 0.3s ease"
                    >
                        <h2>
                            <AccordionButton>
                                <Box as="span" flex="1" textAlign="left" color={textColor}>
                                    Segurança
                                </Box>
                                <AccordionIcon color={textColor} />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <SecuritySettings />
                        </AccordionPanel>
                    </AccordionItem>

                    {/* Outras configurações - Visíveis apenas para não funcionários */}
                    {!isEmployeeOnly && (
                        <>
                            <AccordionItem
                                borderColor={accordionBorderColor}
                                bg={accordionBg}
                                backdropFilter="blur(12px)"
                                _hover={{
                                    bg: accordionHoverBg,
                                    transform: 'translateY(-2px)',
                                    shadow: 'lg'
                                }}
                                mb={2}
                                rounded="lg"
                                transition="all 0.3s ease"
                            >
                                <h2>
                                    <AccordionButton>
                                        <Box as="span" flex="1" textAlign="left" color={textColor}>
                                            Geral
                                        </Box>
                                        <AccordionIcon color={textColor} />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <GeneralSettings />
                                </AccordionPanel>
                            </AccordionItem>

                            <AccordionItem
                                borderColor={accordionBorderColor}
                                bg={accordionBg}
                                backdropFilter="blur(12px)"
                                _hover={{
                                    bg: accordionHoverBg,
                                    transform: 'translateY(-2px)',
                                    shadow: 'lg'
                                }}
                                mb={2}
                                rounded="lg"
                                transition="all 0.3s ease"
                            >
                                <h2>
                                    <AccordionButton>
                                        <Box as="span" flex="1" textAlign="left" color={textColor}>
                                            Notificações
                                        </Box>
                                        <AccordionIcon color={textColor} />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <NotificationSettings />
                                </AccordionPanel>
                            </AccordionItem>

                            <AccordionItem
                                borderColor={accordionBorderColor}
                                bg={accordionBg}
                                backdropFilter="blur(12px)"
                                _hover={{
                                    bg: accordionHoverBg,
                                    transform: 'translateY(-2px)',
                                    shadow: 'lg'
                                }}
                                mb={2}
                                rounded="lg"
                                transition="all 0.3s ease"
                            >
                                <h2>
                                    <AccordionButton>
                                        <Box as="span" flex="1" textAlign="left" color={textColor}>
                                            Integrações
                                        </Box>
                                        <AccordionIcon color={textColor} />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <IntegrationSettings />
                                </AccordionPanel>
                            </AccordionItem>

                            <AccordionItem
                                borderColor={accordionBorderColor}
                                bg={accordionBg}
                                backdropFilter="blur(12px)"
                                _hover={{
                                    bg: accordionHoverBg,
                                    transform: 'translateY(-2px)',
                                    shadow: 'lg'
                                }}
                                mb={2}
                                rounded="lg"
                                transition="all 0.3s ease"
                            >
                                <h2>
                                    <AccordionButton>
                                        <Box as="span" flex="1" textAlign="left" color={textColor}>
                                            Unidades de Medida
                                        </Box>
                                        <AccordionIcon color={textColor} />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <UnitOfMeasureSettings />
                                </AccordionPanel>
                            </AccordionItem>

                            <AccordionItem
                                borderColor={accordionBorderColor}
                                bg={accordionBg}
                                backdropFilter="blur(12px)"
                                _hover={{
                                    bg: accordionHoverBg,
                                    transform: 'translateY(-2px)',
                                    shadow: 'lg'
                                }}
                                mb={2}
                                rounded="lg"
                                transition="all 0.3s ease"
                            >
                                <h2>
                                    <AccordionButton>
                                        <Box as="span" flex="1" textAlign="left" color={textColor}>
                                            Categorias
                                        </Box>
                                        <AccordionIcon color={textColor} />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <CategorySettings />
                                </AccordionPanel>
                            </AccordionItem>

                            <AccordionItem
                                borderColor={accordionBorderColor}
                                bg={accordionBg}
                                backdropFilter="blur(12px)"
                                _hover={{
                                    bg: accordionHoverBg,
                                    transform: 'translateY(-2px)',
                                    shadow: 'lg'
                                }}
                                mb={2}
                                rounded="lg"
                                transition="all 0.3s ease"
                            >
                                <h2>
                                    <AccordionButton>
                                        <Box as="span" flex="1" textAlign="left" color={textColor}>
                                            Locais
                                        </Box>
                                        <AccordionIcon color={textColor} />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <EnviromentSettings />
                                </AccordionPanel>
                            </AccordionItem>
                        </>
                    )}

                    {/* Gerenciamento de Usuários - Visível apenas para administradores */}
                    {userIsAdmin && (
                        <AccordionItem
                            borderColor={accordionBorderColor}
                            bg={accordionBg}
                            backdropFilter="blur(12px)"
                            _hover={{
                                bg: accordionHoverBg,
                                transform: 'translateY(-2px)',
                                shadow: 'lg'
                            }}
                            mb={2}
                            rounded="lg"
                            transition="all 0.3s ease"
                        >
                            <h2>
                                <AccordionButton>
                                    <Box as="span" flex="1" textAlign="left" color={textColor}>
                                        Usuários
                                    </Box>
                                    <AccordionIcon color={textColor} />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel pb={4}>
                                <UserManagement />
                            </AccordionPanel>
                        </AccordionItem>
                    )}
                </Accordion>
            </VStack>
        </Box>
    );
} 