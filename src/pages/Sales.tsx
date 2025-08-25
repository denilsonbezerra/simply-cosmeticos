import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingCart, Eye, Calendar, Filter, Trash2, Printer, FileDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import jsPDF from 'jspdf';

interface Sale {
  id: number;
  sale_number: string;
  total_amount: number;
  total_cost: number;
  profit: number;
  payment_method: string;
  notes?: string;
  created_at: string;
  sale_items: Array<{
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
    };
  }>;
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { toast } = useToast()
  const navigate = useNavigate()

  const openModal = (sale: Sale) => {
    setSelectedSale(sale)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedSale(null)
    setIsModalOpen(false)
  }

  useEffect(() => {
    checkAuth()
    loadSales()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/login")
    }
  }

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (name)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar vendas",
        description: "Não foi possível carregar a lista de vendas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteSale = async (saleId: number) => {
    try {
      setDeletingId(saleId)

      // First check if the sale exists and get the sale data
      const { data: saleData, error: saleCheckError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", saleId)
        .single()

      if (saleCheckError) throw saleCheckError

      // Delete sale items first (cascade delete)
      const { error: itemsError } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", saleId)

      if (itemsError) throw itemsError

      // Delete the sale
      const { error: saleError } = await supabase
        .from("sales")
        .delete()
        .eq("id", saleId)

      if (saleError) throw saleError

      toast({
        title: "Venda excluída!",
        description: "A venda foi removida com sucesso.",
      })

      loadSales() // Reload the sales list
    } catch (error) {
      console.error("Erro ao excluir venda:", error)
      toast({
        title: "Erro ao excluir venda",
        description: error.message || "Não foi possível excluir a venda.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id

    const matchesPayment = paymentFilter === "all" || sale.payment_method === paymentFilter

    let matchesDate = true
    let weekAgo = new Date()
    let monthAgo = new Date()

    if (dateFilter !== "all") {
      const saleDate = new Date(sale.created_at)
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      switch (dateFilter) {
        case "today":
          matchesDate = saleDate >= startOfDay
          break
        case "week":
          weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = saleDate >= weekAgo
          break
        case "month":
          monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = saleDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesPayment && matchesDate
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getPaymentMethodBadge = (method: string) => {
    const methods = {
      dinheiro: { label: "Dinheiro", variant: "default" as const, className: "bg-success text-success-foreground cursor-pointer" },
      cartao_credito: { label: "Cartão Crédito", variant: "default" as const, className: "bg-accent text-accent-foreground cursor-pointer" },
      cartao_debito: { label: "Cartão Débito", variant: "default" as const, className: "bg-accent text-primary-foreground cursor-pointer" },
      pix: { label: "PIX", variant: "default" as const, className: "bg-warning text-warning-foreground cursor-pointer" },
    }

    const config = methods[method as keyof typeof methods] || { label: method, variant: "outline" as const, className: "" }
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando vendas...</p>
          </div>
        </div>
      </div>
    )
  }

  const printSale = (sale: Sale) => {
    if (!sale) return

    const printWindow = window.open("", "_blank")
    const currentTime = new Date()
    
    const getPaymentMethodName = (method: string) => {
      const methods = {
        dinheiro: "Dinheiro",
        cartao_credito: "Cartão de Crédito", 
        cartao_debito: "Cartão de Débito",
        pix: "PIX"
      }
      return methods[method as keyof typeof methods] || method
    }

    if (printWindow) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Comprovante - Simply Cosméticos</title>
          <style>
            body { font-family: monospace; font-size: 12px; }
            h2 { text-align: center; margin-bottom: 10px; }
            .items { margin-top: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>SIMPLY COSMÉTICOS</h2>
          <p><strong>Data:</strong> ${formatDate(sale.created_at)}</p>
          <p><strong>Forma de Pagamento:</strong> ${getPaymentMethodName(sale.payment_method)}</p>

          <div class="items">
            ${sale.sale_items.map(item => `
              <div class="item">
                <span>${item.products.name} x${item.quantity}</span>
                <span>${formatCurrency(item.total_price)}</span>
              </div>
            `).join("")}
          </div>
          <div class="total">
            <div>Total: ${formatCurrency(sale.total_amount)}</div>
          </div>
          <p style="text-align:center; margin-top:10px;">Obrigado pela preferência!</p>
        </body>
      </html>
    `);

      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const exportSalesPDF = () => {
    const doc = new jsPDF()
    
    // Configurações de cores - mais flat e minimalista
    const primaryColor = [51, 51, 51] // cinza escuro
    const accentColor = [79, 70, 229] // indigo suave
    const textColor = [55, 65, 81] // cinza médio
    const lightGray = [249, 250, 251] // cinza muito claro
    const borderColor = [229, 231, 235] // cinza claro para bordas
    
    // Cabeçalho
    doc.setFontSize(22)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Relatório de Vendas', 20, 25)
    
    doc.setFontSize(11)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    
    // Filtros aplicados
    let filterText = 'Filtros aplicados: '
    if (dateFilter !== 'all') {
      const filterNames = { today: 'Hoje', week: '7 dias', month: '30 dias' }
      filterText += filterNames[dateFilter as keyof typeof filterNames] + ' '
    }
    if (paymentFilter !== 'all') {
      filterText += `Pagamento: ${paymentFilter} `
    }
    if (searchTerm) {
      filterText += `Busca: ${searchTerm} `
    }
    doc.text(filterText, 20, 35)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 42)
    
    // Linha separadora sutil
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
    doc.setLineWidth(0.5)
    doc.line(20, 50, 190, 50)
    
    let yPos = 65
    
    // Resumo em caixa
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
    doc.rect(20, yPos - 5, 170, 35, 'F')
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
    doc.rect(20, yPos - 5, 170, 35, 'S')
    
    doc.setFontSize(14)
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.text('Resumo Financeiro', 25, yPos + 3)
    
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0)
    const avgTicket = filteredSales.length > 0 ? totalSales / filteredSales.length : 0
    
    doc.text(`Total de Vendas: ${formatCurrency(totalSales)}`, 25, yPos + 12)
    doc.text(`Lucro Total: ${formatCurrency(totalProfit)}`, 25, yPos + 20)
    doc.text(`Quantidade: ${filteredSales.length} vendas`, 110, yPos + 12)
    doc.text(`Ticket Médio: ${formatCurrency(avgTicket)}`, 110, yPos + 20)
    
    yPos += 45
    
    // Detalhes das vendas
    doc.setFontSize(14)
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.text('Detalhes das Vendas', 20, yPos)
    yPos += 15
    
    // Processar cada venda com seus itens
    filteredSales.slice(0, 15).forEach((sale, saleIndex) => {
      // Verificar se precisa de nova página
      if (yPos > 220) {
        doc.addPage()
        yPos = 25
      }
      
      // Background da venda principal
      const isEvenSale = saleIndex % 2 === 0
      if (isEvenSale) {
        doc.setFillColor(248, 250, 252) // azul muito claro
      } else {
        doc.setFillColor(253, 253, 253) // cinza muito claro
      }
      
      // Calcular altura necessária para esta venda
      const itemsHeight = sale.sale_items.length * 6
      const totalSaleHeight = 15 + itemsHeight
      
      doc.rect(20, yPos - 3, 170, totalSaleHeight, 'F')
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
      doc.rect(20, yPos - 3, 170, totalSaleHeight, 'S')
      
      // Cabeçalho da venda
      doc.setFontSize(11)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text(`${sale.id}`, 25, yPos + 3)
      
      doc.setFontSize(9)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(new Date(sale.created_at).toLocaleDateString('pt-BR'), 120, yPos + 3)
      doc.text(`Total: ${formatCurrency(sale.total_amount)}`, 150, yPos + 3)
      
      // Método de pagamento e lucro
      const paymentLabels = {
        dinheiro: 'Dinheiro',
        cartao_credito: 'Cartão Crédito',
        cartao_debito: 'Cartão Débito',
        pix: 'PIX'
      }
      doc.text(`${paymentLabels[sale.payment_method as keyof typeof paymentLabels] || sale.payment_method}`, 25, yPos + 9)
      doc.text(`Lucro: ${formatCurrency(sale.profit)}`, 150, yPos + 9)
      
      yPos += 15
      
      // Detalhes dos produtos - background diferente
      doc.setFillColor(255, 255, 255) // branco para contraste
      doc.rect(25, yPos - 2, 160, itemsHeight + 4, 'F')
      doc.setDrawColor(230, 230, 230)
      doc.rect(25, yPos - 2, 160, itemsHeight + 4, 'S')
      
      // Cabeçalho dos itens
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Produto', 30, yPos + 2)
      doc.text('Qtd', 110, yPos + 2)
      doc.text('Unit.', 130, yPos + 2)
      doc.text('Total', 155, yPos + 2)
      yPos += 6
      
      // Lista de produtos
      sale.sale_items.forEach((item, itemIndex) => {
        doc.setFontSize(8)
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        
        const productName = item.products.name
        const truncatedName = productName.length > 25 ? productName.substring(0, 25) + '...' : productName
        doc.text(truncatedName, 30, yPos)
        doc.text(item.quantity.toString(), 110, yPos)
        doc.text(formatCurrency(item.unit_price), 130, yPos)
        doc.text(formatCurrency(item.total_price), 155, yPos)
        yPos += 6
      })
      
      yPos += 8 // Espaçamento entre vendas
    })
    
    // Rodapé minimalista
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Sistema de Vendas', 20, 285)
    doc.text(`Página 1`, 170, 285)
    
    doc.save(`vendas-detalhadas-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-accent">
                Vendas
              </h1>
              <p className="text-muted-foreground">
                Histórico e gerenciamento de vendas
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportSalesPDF}
                variant="outline"
                className="shadow-soft"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                onClick={() => navigate("/sales/new")}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Venda
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Vendas</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className="text-xl font-bold">{filteredSales.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lucro Total</p>
                    <p className="text-xl font-bold text-accent">
                      {formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.profit, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-xl font-bold text-warning">
                      {filteredSales.length > 0
                        ? formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0) / filteredSales.length)
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por ID da venda..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">7 dias</SelectItem>
                    <SelectItem value="month">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sales List */}
          {filteredSales.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || paymentFilter !== "all" || dateFilter !== "all"
                    ? "Tente ajustar os filtros ou buscar por outros termos"
                    : "Comece registrando sua primeira venda"
                  }
                </p>
                <Button
                  onClick={() => navigate("/sales/new")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Venda
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSales.map((sale) => (
                <Card key={sale.id} className="shadow-card hover:shadow-glow transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-secondary rounded-lg">
                              <ShoppingCart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Venda #{sale.id.toString().padStart(6, "0")}</h3>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-success">
                              {formatCurrency(sale.total_amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Lucro: {formatCurrency(sale.profit)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {getPaymentMethodBadge(sale.payment_method)}
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(sale.created_at)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {sale.sale_items.reduce((sum, item) => sum + item.quantity, 0)} itens
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p className="mb-1">
                            <strong>Produtos:</strong> {sale.sale_items.map(item =>
                              `${item.products.name} (${item.quantity}x)`
                            ).join(", ")}
                          </p>
                          {sale.notes && (
                            <p className="italic">Obs: {sale.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:shadow-soft transition-all"
                          onClick={() => openModal(sale)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Detalhes
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:shadow-soft transition-all text-destructive hover:bg-destructive/10"
                              disabled={deletingId === sale.id}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A venda #{sale.id} será permanentemente excluída do sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSale(sale.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        {isModalOpen && selectedSale && (
          <div className="fixed top-0 inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold mb-4">Detalhes da Venda #{selectedSale.id}</h2>

              <div className="space-y-2">
                <p><strong>Data:</strong> {formatDate(selectedSale.created_at)}</p>
                <p><strong>Forma de Pagamento:</strong> {selectedSale.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedSale.total_amount)}</p>
                <p><strong>Lucro:</strong> {formatCurrency(selectedSale.profit)}</p>
                {selectedSale.notes && <p><strong>Observações:</strong> {selectedSale.notes}</p>}
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Itens da venda</h3>
                <div className="space-y-1">
                  {selectedSale.sale_items.map((item, index) => (
                    <div key={index} className="flex justify-between border-b py-1">
                      <span>{item.products.name} ({item.quantity}x)</span>
                      <span>{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  onClick={() => printSale(selectedSale)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={closeModal} variant="outline">
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Sales;