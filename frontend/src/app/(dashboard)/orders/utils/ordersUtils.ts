import type { ServiceOrderDTO } from '@/features/operations'
import jsPDF from 'jspdf'
import { formatBRL } from '@/utils/money'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, PieController } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, PieController)

export interface OrderFilters {
    equipment: string
    status: string
    date: string
    serialNumber: string
}

export const filterOrders = (orders: ServiceOrderDTO[], filters: OrderFilters): ServiceOrderDTO[] => {
    let result = [...orders]

    if (filters.equipment) {
        result = result.filter(order =>
            order.model.toLowerCase().includes(filters.equipment.toLowerCase()) ||
            order.equipment_description.toLowerCase().includes(filters.equipment.toLowerCase())
        )
    }

    if (filters.status) {
        result = result.filter(order => {
            if (filters.status === 'completed') return order.exit_date
            if (filters.status === 'in_progress') return !order.exit_date
            return true
        })
    }

    if (filters.date) {
        const filterDate = new Date(filters.date).toISOString().split('T')[0]
        result = result.filter(order =>
            order.entry_date.split('T')[0] === filterDate
        )
    }

    if (filters.serialNumber) {
        result = result.filter(order =>
            order.serial_number.toLowerCase().includes(filters.serialNumber.toLowerCase())
        )
    }

    return result
}

export const generateOrdersPDF = async (
    filteredOrders: ServiceOrderDTO[],
    filters: OrderFilters,
    toast: any
): Promise<void> => {
    if (!filteredOrders.length) {
        toast({
            title: 'Aviso',
            description: 'Não há ordens de serviço para exportar',
            status: 'warning',
            duration: 3000,
            isClosable: true,
        })
        return
    }

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm'
    })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tableStartY = 40
    let currentY = tableStartY

    // Add title
    doc.setFontSize(20)
    doc.text('Relatório de Ordens de Serviço', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(12)

    // Add date and filters
    const currentDate = new Date().toLocaleDateString()
    doc.text(`Data do relatório: ${currentDate}`, margin, 30)

    // Add active filters
    let filterY = 35
    if (filters.equipment) {
        doc.text(`Filtro de equipamento: ${filters.equipment}`, margin, filterY)
        filterY += 5
    }
    if (filters.status) {
        doc.text(`Status: ${filters.status === 'completed' ? 'Concluídas' : 'Em andamento'}`, margin, filterY)
        filterY += 5
    }
    if (filters.date) {
        doc.text(`Data: ${new Date(filters.date).toLocaleDateString()}`, margin, filterY)
        filterY += 5
    }
    if (filters.serialNumber) {
        doc.text(`Número de série: ${filters.serialNumber}`, margin, filterY)
        filterY += 5
    }

    currentY = filterY + 5

    // Table headers
    const headers = ['Nº OS', 'Cliente', 'Equipamento', 'Nº Série', 'Status', 'Data Entrada', 'Valor Total']
    const columnWidths = [25, 45, 45, 35, 35, 35, 35]
    let x = margin

    // Draw headers
    headers.forEach((header, i) => {
        doc.text(header, x, currentY)
        x += columnWidths[i]
    })

    currentY += 10

    // Draw table rows
    filteredOrders.forEach(order => {
        if (currentY > pageHeight - 20) {
            doc.addPage()
            currentY = margin
        }

        x = margin
        const row = [
            order.order_number,
            order.client_name,
            order.model,
            order.serial_number,
            order.exit_date ? 'Concluída' : 'Em andamento',
            new Date(order.entry_date).toLocaleDateString(),
            formatBRL(order.total_price)
        ]

        row.forEach((cell, i) => {
            doc.text(cell, x, currentY)
            x += columnWidths[i]
        })

        currentY += 10
    })

    // Add pie chart on a new page
    doc.addPage()

    // Calculate status distribution
    const completedCount = filteredOrders.filter(order => order.exit_date).length
    const inProgressCount = filteredOrders.filter(order => !order.exit_date).length

    // Create a temporary div to render the chart
    const tempDiv = document.createElement('div')
    tempDiv.style.width = '600px'
    tempDiv.style.height = '400px'
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    document.body.appendChild(tempDiv)

    // Create canvas element
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 400
    tempDiv.appendChild(canvas)

    // Create and render the chart
    const chartData = {
        labels: ['Concluídas', 'Em andamento'],
        datasets: [{
            data: [completedCount, inProgressCount],
            backgroundColor: ['#48BB78', '#ECC94B'],
            borderColor: ['#38A169', '#D69E2E'],
            borderWidth: 1,
        }],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            title: {
                display: true,
                text: 'Distribuição de Status das Ordens de Serviço',
                font: {
                    size: 16
                }
            }
        }
    }

    // Create a new chart instance
    const chart = new ChartJS(canvas.getContext('2d')!, {
        type: 'pie',
        data: chartData,
        options: chartOptions
    })

    // Wait for the chart to be rendered
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
        // Convert the chart to an image
        const chartImage = canvas.toDataURL('image/png')

        // Add chart to PDF
        doc.text('Distribuição de Status', pageWidth / 2, 20, { align: 'center' })
        doc.addImage(chartImage, 'PNG', margin, 30, pageWidth - (margin * 2), pageHeight - (margin * 2))

        // Save the PDF
        doc.save('ordens-de-servico.pdf')
    } catch (error) {
        toast({
            title: 'Erro',
            description: 'Erro ao gerar o PDF. Por favor, tente novamente.',
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    } finally {
        // Clean up
        chart.destroy()
        document.body.removeChild(tempDiv)
    }
} 