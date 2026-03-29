import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  useColorModeValue,
  Select,
  HStack,
  Input,
  Card,
  CardBody,
  Container,
  VStack,
} from '@chakra-ui/react';
import { formatBRL, sumMoney } from '@/utils/money';

const PERIODS = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 90 dias', value: 90 },
  { label: 'Todos', value: 0 },
];

export function SupplyStatistics() {
  const [supplyStats, setSupplyStats] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [supplierId, setSupplierId] = useState('');
  const [specificDate, setSpecificDate] = useState('');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        const [suppliesRes, batchesRes] = await Promise.all([
          fetch('/api/supplies', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/supply-batches', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        const supplies = await suppliesRes.json();
        const batches = await batchesRes.json();
        setSupplyStats({
          total: supplies.length,
          belowMinimum: supplies.filter((s: any) => s.quantity < s.minimum_quantity).length,
        });
        setBatches(batches);
        // Extrai fornecedores únicos dos batches
        const uniqueSuppliers = Array.from(new Map(batches.map((b: any) => [b.supplier_id, b.supplier])).values());
        setSuppliers(uniqueSuppliers);
      } catch (e) {
        setSupplyStats(null);
        setBatches([]);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Filtro de batches por período, fornecedor e data específica
  const now = new Date();
  const filteredBatches = batches.filter((b) => {
    const batchDate = new Date(b.purchased_at);
    const periodOk = period === 0 || (now.getTime() - batchDate.getTime()) / (1000 * 60 * 60 * 24) <= period;
    const supplierOk = !supplierId || b.supplier_id === supplierId;
    const dateOk = !specificDate || batchDate.toISOString().slice(0, 10) === specificDate;
    return periodOk && supplierOk && dateOk;
  });

  const batchStatsFiltered = {
    total: filteredBatches.length,
    lastEntry: filteredBatches[0],
    avgPrice:
      filteredBatches.length > 0
        ? sumMoney(filteredBatches.map((b: any) => b.unit_price)) / filteredBatches.length
        : null,
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Estatísticas de Suprimentos</Heading>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <HStack mb={4} spacing={4} flexWrap="wrap">
              <Select value={period} onChange={e => setPeriod(Number(e.target.value))} maxW="200px">
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
              <Select value={supplierId} onChange={e => setSupplierId(e.target.value)} maxW="300px" placeholder="Todos os fornecedores">
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
              <Input
                type="date"
                value={specificDate}
                onChange={e => setSpecificDate(e.target.value)}
                maxW="200px"
                placeholder="Data específica"
              />
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Stat bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
                <StatLabel>Total de Suprimentos</StatLabel>
                <StatNumber>{supplyStats?.total ?? '-'}</StatNumber>
              </Stat>
              <Stat bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
                <StatLabel>Suprimentos abaixo do mínimo</StatLabel>
                <StatNumber color="red.400">{supplyStats?.belowMinimum ?? '-'}</StatNumber>
              </Stat>
              <Stat bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
                <StatLabel>Total de Lotes (Entradas)</StatLabel>
                <StatNumber>{batchStatsFiltered.total ?? '-'}</StatNumber>
              </Stat>
              <Stat bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
                <StatLabel>Preço Médio dos Lotes</StatLabel>
                <StatNumber>
                  {batchStatsFiltered.avgPrice != null ? formatBRL(batchStatsFiltered.avgPrice) : '-'}
                </StatNumber>
                <StatHelpText>Lote mais recente: {batchStatsFiltered.lastEntry?.quantity} un. em {batchStatsFiltered.lastEntry?.purchased_at?.slice(0,10)}</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </>
  );
} 