import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import jsPDF from 'jspdf';

interface ReportData {
  salesByDay: Array<{ date: string; total: number; quantity: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByPayment: Array<{ method: string; total: number; count: number }>;
  monthlySummary: {
    totalSales: number;
    totalProfit: number;
    totalOrders: number;
    avgTicket: number;
  };
}

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    loadReportData()
  }, [period])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/login")
    }
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(period))

      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            quantity,
            total_price,
            products (name)
          )
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false })

      if (salesError) throw salesError

      // Process data for reports
      const processedData = processReportData(salesData || [])
      setReportData(processedData)
      
    } catch (error) {
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (sales): ReportData => {
    // Sales by day
    const salesByDay = sales.reduce((acc, sale) => {
      const date = new Date(sale.created_at).toLocaleDateString("pt-BR")
      const existing = acc.find((item) => item.date === date)
      
      if (existing) {
        existing.total += sale.total_amount
        existing.quantity += 1
      } else {
        acc.push({
          date,
          total: sale.total_amount,
          quantity: 1
        })
      }
      
      return acc
    }, [])

    // Top products
    const productSales = new Map()
    sales.forEach(sale => {
      sale.sale_items.forEach((item) => {
        const productName = item.products.name
        const existing = productSales.get(productName) || { quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += item.total_price
        productSales.set(productName, existing)
      })
    })

    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Sales by payment method
    const paymentMethods = sales.reduce((acc, sale) => {
      const method = sale.payment_method
      const existing = acc.find((item) => item.method === method)
      
      if (existing) {
        existing.total += sale.total_amount
        existing.count += 1
      } else {
        acc.push({
          method,
          total: sale.total_amount,
          count: 1
        })
      }
      
      return acc
    }, [])

    // Monthly summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)
    const totalOrders = sales.length
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    return {
      salesByDay: salesByDay.slice(0, 30),
      topProducts,
      salesByPayment: paymentMethods,
      monthlySummary: {
        totalSales,
        totalProfit,
        totalOrders,
        avgTicket
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão Crédito",
      cartao_debito: "Cartão Débito",
      pix: "PIX"
    }
    return labels[method as keyof typeof labels] || method
  }

  const exportToCSV = () => {
    if (!reportData) return

    const csvData = [
      ["Data", "Vendas", "Quantidade"],
      ...reportData.salesByDay.map(item => [
        `"${item.date}"`,
        `"R$ ${item.total.toFixed(2).replace('.', ',')}"`,
        item.quantity.toString()
      ])
    ]

    // Add UTF-8 BOM for proper Excel compatibility
    const BOM = '\uFEFF'
    const csvContent = BOM + csvData.map(row => row.join("")).join("\r\n")
    
    const blob = new Blob([csvContent], { 
      type: "text/csvcharset=utf-8" 
    })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-vendas-${period}-dias.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Relatório exportado!",
      description: "O arquivo CSV foi baixado com sucesso.",
    })
  }

  const exportToPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    
    // Configurações de cores e fontes
    const primaryColor = [59, 130, 246] // blue-500
    const textColor = [31, 41, 55] // gray-800
    const lightGray = [243, 244, 246] // gray-100
    
    // Cabeçalho
    doc.setFontSize(20)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Relatório de Vendas', 20, 25)
    
    doc.setFontSize(12)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(`Período: Últimos ${period} dias`, 20, 35)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 42)
    
    // Linha separadora
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
    doc.line(20, 50, 190, 50)
    
    let yPos = 65
    
    // Resumo geral
    doc.setFontSize(16)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Resumo Geral', 20, yPos)
    yPos += 10
    
    doc.setFontSize(11)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(`Vendas Totais: ${formatCurrency(reportData.monthlySummary.totalSales)}`, 20, yPos)
    yPos += 7
    doc.text(`Lucro Total: ${formatCurrency(reportData.monthlySummary.totalProfit)}`, 20, yPos)
    yPos += 7
    doc.text(`Total de Pedidos: ${reportData.monthlySummary.totalOrders}`, 20, yPos)
    yPos += 7
    doc.text(`Ticket Médio: ${formatCurrency(reportData.monthlySummary.avgTicket)}`, 20, yPos)
    yPos += 15
    
    // Vendas por dia
    doc.setFontSize(14)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Vendas por Dia', 20, yPos)
    yPos += 10
    
    // Cabeçalho da tabela
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
    doc.rect(20, yPos - 5, 170, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Data', 25, yPos)
    doc.text('Vendas', 90, yPos)
    doc.text('Quantidade', 140, yPos)
    yPos += 8
    
    // Dados das vendas por dia (primeiros 15 itens)
    const salesData = reportData.salesByDay.slice(0, 15)
    salesData.forEach((item, index) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 25
      }
      
      // Linha alternada
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(20, yPos - 5, 170, 7, 'F')
      }
      
      doc.setFontSize(9)
      doc.text(item.date, 25, yPos)
      doc.text(formatCurrency(item.total), 90, yPos)
      doc.text(item.quantity.toString(), 140, yPos)
      yPos += 7
    })
    
    yPos += 10
    
    // Nova página se necessário
    if (yPos > 250) {
      doc.addPage()
      yPos = 25
    }
    
    // Produtos mais vendidos
    doc.setFontSize(14)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Produtos Mais Vendidos', 20, yPos)
    yPos += 10
    
    // Cabeçalho da tabela de produtos
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
    doc.rect(20, yPos - 5, 170, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Pos.', 25, yPos)
    doc.text('Produto', 40, yPos)
    doc.text('Qtd.', 120, yPos)
    doc.text('Receita', 150, yPos)
    yPos += 8
    
    // Dados dos produtos (primeiros 10)
    const topProducts = reportData.topProducts.slice(0, 10)
    topProducts.forEach((product, index) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 25
      }
      
      // Linha alternada
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(20, yPos - 5, 170, 7, 'F')
      }
      
      doc.setFontSize(9)
      doc.text(`${index + 1}º`, 25, yPos)
      // Truncar nome do produto se muito longo
      const productName = product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name
      doc.text(productName, 40, yPos)
      doc.text(product.quantity.toString(), 120, yPos)
      doc.text(formatCurrency(product.revenue), 150, yPos)
      yPos += 7
    })
    
    yPos += 10
    
    // Nova página se necessário
    if (yPos > 250) {
      doc.addPage()
      yPos = 25
    }
    
    // Formas de pagamento
    doc.setFontSize(14)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Formas de Pagamento', 20, yPos)
    yPos += 10
    
    // Cabeçalho da tabela de pagamentos
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
    doc.rect(20, yPos - 5, 170, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Método', 25, yPos)
    doc.text('Transações', 90, yPos)
    doc.text('Total', 130, yPos)
    doc.text('%', 170, yPos)
    yPos += 8
    
    // Dados das formas de pagamento
    reportData.salesByPayment.forEach((payment, index) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 25
      }
      
      // Linha alternada
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(20, yPos - 5, 170, 7, 'F')
      }
      
      doc.setFontSize(9)
      doc.text(getPaymentMethodLabel(payment.method), 25, yPos)
      doc.text(payment.count.toString(), 90, yPos)
      doc.text(formatCurrency(payment.total), 130, yPos)
      const percentage = ((payment.total / reportData.monthlySummary.totalSales) * 100).toFixed(1)
      doc.text(`${percentage}%`, 170, yPos)
      yPos += 7
    })
    
    // Rodapé - simplificado para evitar erro de tipos
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('Sistema de Vendas - Relatório Gerado Automaticamente', 20, 290)
    
    // Salvar o PDF
    doc.save(`relatorio-vendas-${period}-dias.pdf`)
    
    toast({
      title: "Relatório PDF exportado!",
      description: "O arquivo PDF foi baixado com sucesso.",
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-accent">
                Relatórios
              </h1>
              <p className="text-muted-foreground">
                Análise detalhada das suas vendas
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="hover:shadow-soft transition-all"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              
              <Button 
                onClick={exportToPDF}
                variant="outline"
                className="hover:shadow-soft transition-all"
              >
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(reportData?.monthlySummary.totalSales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Últimos {period} dias
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {formatCurrency(reportData?.monthlySummary.totalProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margem de lucro
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.monthlySummary.totalOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de vendas
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <BarChart3 className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(reportData?.monthlySummary.avgTicket || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por venda
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily Sales */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Vendas por Dia</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.salesByDay.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">{item.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.quantity === 1 ? 'venda' : 'vendas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Produtos Mais Vendidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.topProducts.slice(0, 10).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}º</Badge>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} vendidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Formas de Pagamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.salesByPayment.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">{getPaymentMethodLabel(payment.method)}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.count} {payment.count === 1 ? 'transação' : 'transações'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">
                          {formatCurrency(payment.total)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((payment.total / (reportData?.monthlySummary.totalSales || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Resumo de Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 rounded-lg">
                    <h3 className="font-semibold text-success mb-2">Receita Total</h3>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(reportData?.monthlySummary.totalSales || 0)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h3 className="font-semibold text-accent mb-2">Lucro Líquido</h3>
                    <p className="text-2xl font-bold text-accent">
                      {formatCurrency(reportData?.monthlySummary.totalProfit || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Margem: {reportData?.monthlySummary.totalSales 
                        ? ((reportData.monthlySummary.totalProfit / reportData.monthlySummary.totalSales) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h3 className="font-semibold text-primary mb-2">Vendas por Dia</h3>
                    <p className="text-2xl font-bold text-primary">
                      {reportData?.monthlySummary.totalOrders 
                        ? (reportData.monthlySummary.totalOrders / parseInt(period)).toFixed(1)
                        : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Média diária
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Reports;
