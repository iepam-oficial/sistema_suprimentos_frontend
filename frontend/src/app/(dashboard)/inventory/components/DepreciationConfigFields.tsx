'use client'

import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormLabel,
    HStack,
    Input,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
} from '@chakra-ui/react'
import type { DepreciationRateDTO } from '@ti-assistant/contracts'

export interface AppliedSnapshots {
    rule_annual_rate: number | null
    rule_service_life: number | null
    rule_chart_of_account_id: string | null
}

export interface DepreciationFieldValues {
    ncm: string
    cest: string
    residual_value: string
    service_life: string
    annual_rate: string
    chart_of_account_id: string
    override_reason: string
}

interface DepreciationConfigFieldsProps {
    isDepreciable: boolean
    onDepreciableChange: (checked: boolean) => void
    values: DepreciationFieldValues
    onChange: (field: keyof DepreciationFieldValues, value: string) => void
    suggestedRates: DepreciationRateDTO[]
    selectedSuggestionId: string | null
    onSelectSuggestion: (id: string) => void
    suggestNotFound: boolean
    isSuggesting: boolean
    appliedSnapshots: AppliedSnapshots | null
    onSuggest: () => void
    onApplyRate: () => void
}

function deriveServiceLife(annualRate: number): number {
    return Math.max(1, Math.round(100 / annualRate))
}

export function computeDepreciationOverride(
    values: Pick<DepreciationFieldValues, 'annual_rate' | 'service_life' | 'chart_of_account_id'>,
    snapshots: AppliedSnapshots | null,
): boolean {
    if (!snapshots) return false

    const { rule_annual_rate, rule_service_life, rule_chart_of_account_id } = snapshots
    if (
        rule_annual_rate == null &&
        rule_service_life == null &&
        rule_chart_of_account_id == null
    ) {
        return false
    }

    const annualRate = values.annual_rate ? parseFloat(values.annual_rate) : null
    const serviceLife = values.service_life ? parseInt(values.service_life, 10) : null

    return (
        annualRate !== rule_annual_rate ||
        serviceLife !== rule_service_life ||
        (values.chart_of_account_id || null) !== (rule_chart_of_account_id || null)
    )
}

function formatPlano(rate: DepreciationRateDTO): string {
    const account = rate.chart_of_account
    if (!account) return rate.chart_of_account_id
    return `${account.codigo} — ${account.nome}`
}

function formatNcmCest(rate: DepreciationRateDTO): string {
    const parts: string[] = []
    if (rate.ncm) parts.push(`NCM ${rate.ncm}`)
    if (rate.cest) parts.push(`CEST ${rate.cest}`)
    return parts.length > 0 ? parts.join(' · ') : 'Sem NCM/CEST'
}

export function DepreciationConfigFields({
    isDepreciable,
    onDepreciableChange,
    values,
    onChange,
    suggestedRates,
    selectedSuggestionId,
    onSelectSuggestion,
    suggestNotFound,
    isSuggesting,
    appliedSnapshots,
    onSuggest,
    onApplyRate,
}: DepreciationConfigFieldsProps) {
    const hasOverride = computeDepreciationOverride(values, appliedSnapshots)

    const handleAnnualRateChange = (rawValue: string) => {
        onChange('annual_rate', rawValue)

        const annualRate = parseFloat(rawValue)
        if (isNaN(annualRate) || annualRate <= 0) return

        const currentLife = values.service_life ? parseInt(values.service_life, 10) : null
        const ruleLife = appliedSnapshots?.rule_service_life ?? null
        const shouldDerive =
            ruleLife == null ||
            currentLife == null ||
            currentLife === ruleLife

        if (shouldDerive) {
            onChange('service_life', String(deriveServiceLife(annualRate)))
        }
    }

    return (
        <>
            <Box mt={4} mb={2}>
                <Checkbox
                    isChecked={isDepreciable}
                    onChange={(e) => onDepreciableChange(e.target.checked)}
                >
                    É depreciável?
                </Checkbox>
            </Box>

            {isDepreciable && (
                <Stack spacing={4} mb={4}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                            <FormLabel>NCM</FormLabel>
                            <Input
                                value={values.ncm}
                                onChange={(e) => onChange('ncm', e.target.value)}
                                placeholder="00000000"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>CEST (opcional)</FormLabel>
                            <Input
                                value={values.cest}
                                onChange={(e) => onChange('cest', e.target.value)}
                                placeholder="0000000"
                            />
                        </FormControl>
                    </SimpleGrid>

                    <HStack>
                        <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={onSuggest}
                            isLoading={isSuggesting}
                            loadingText="Sugerindo..."
                        >
                            Sugerir
                        </Button>
                    </HStack>

                    {suggestNotFound && (
                        <Text fontSize="sm" color="orange.600">
                            Nenhuma regra encontrada para este NCM/CEST. Preencha vida útil, taxa e plano manualmente.
                        </Text>
                    )}

                    {suggestedRates.length > 0 && (
                        <Stack spacing={2}>
                            <Text fontSize="sm" fontWeight="semibold">
                                Regras sugeridas — selecione uma e clique em Aplicar
                            </Text>
                            {suggestedRates.map((rate) => {
                                const isSelected = selectedSuggestionId === rate.id
                                return (
                                    <Box
                                        key={rate.id}
                                        p={3}
                                        borderWidth="2px"
                                        borderRadius="md"
                                        borderColor={isSelected ? 'blue.500' : 'gray.200'}
                                        bg={isSelected ? 'blue.50' : 'gray.50'}
                                        _dark={{
                                            bg: isSelected ? 'blue.900' : 'whiteAlpha.100',
                                            borderColor: isSelected ? 'blue.400' : 'whiteAlpha.300',
                                        }}
                                        cursor="pointer"
                                        onClick={() => onSelectSuggestion(rate.id)}
                                        role="radio"
                                        aria-checked={isSelected}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                onSelectSuggestion(rate.id)
                                            }
                                        }}
                                    >
                                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                                            {rate.description}
                                        </Text>
                                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                                            {formatNcmCest(rate)}
                                        </Text>
                                        <Text fontSize="sm">
                                            Vida útil: {rate.service_life_years} anos · Taxa anual:{' '}
                                            {rate.annual_rate.toFixed(2)}%
                                        </Text>
                                        <Text fontSize="sm">Plano: {formatPlano(rate)}</Text>
                                    </Box>
                                )
                            })}
                            <Box>
                                <Button
                                    size="sm"
                                    colorScheme="green"
                                    onClick={onApplyRate}
                                    isDisabled={!selectedSuggestionId}
                                >
                                    Aplicar
                                </Button>
                            </Box>
                        </Stack>
                    )}

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                            <FormLabel>Valor Residual</FormLabel>
                            <Input
                                type="number"
                                min={0}
                                value={values.residual_value}
                                onChange={(e) => onChange('residual_value', e.target.value)}
                                placeholder="0"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Vida Útil (anos)</FormLabel>
                            <Input
                                type="number"
                                min={1}
                                value={values.service_life}
                                onChange={(e) => onChange('service_life', e.target.value)}
                                placeholder="1"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Taxa Anual (%)</FormLabel>
                            <Input
                                type="number"
                                min={0.01}
                                max={100}
                                step={0.01}
                                value={values.annual_rate}
                                onChange={(e) => handleAnnualRateChange(e.target.value)}
                                placeholder="0,00"
                            />
                        </FormControl>
                    </SimpleGrid>

                    {hasOverride && (
                        <Box>
                            <Text fontSize="sm" color="orange.600" mb={2}>
                                Valores divergem da regra aplicada (override).
                            </Text>
                            <FormControl>
                                <FormLabel>Motivo do override (opcional)</FormLabel>
                                <Textarea
                                    value={values.override_reason}
                                    onChange={(e) => onChange('override_reason', e.target.value)}
                                    placeholder="Ex.: laudo técnico, reclassificação patrimonial"
                                    rows={2}
                                />
                            </FormControl>
                        </Box>
                    )}
                </Stack>
            )}
        </>
    )
}
