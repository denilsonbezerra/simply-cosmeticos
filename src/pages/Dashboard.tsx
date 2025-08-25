import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, TrendingUp, ShoppingCart, AlertTriangle, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";

interface DashboardStats {
  totalSales: number;
  todaySales: number;
  salesQuantity: number;
  totalProducts: number;
  lowStockProducts: number;
  totalProfit: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    todaySales: 0,
    salesQuantity: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalProfit: 0,
  })

  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/login")
    }
  }

  const loadDashboardData = async () => {
    try {
      // Get total sales and profit
      const { data: salesData } = await supabase
        .from("sales")
        .select("total_amount, profit, created_at")

      // Get today's sales
      const today = new Date().toISOString().split('T')[0]
      const todaySalesData = salesData?.filter(sale =>
        sale.created_at.startsWith(today)
      ) || []

      // Get products count and low stock
      const { data: productsData } = await supabase
        .from("products")
        .select("stock_quantity, min_stock_level")
        .eq("active", true)

      const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
      const todaySales = todaySalesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
      const totalProfit = salesData?.reduce((sum, sale) => sum + Number(sale.profit), 0) || 0
      const lowStockProducts = productsData?.filter(product =>
        product.stock_quantity <= product.min_stock_level
      ).length || 0

      setStats({
        totalSales,
        todaySales,
        salesQuantity: salesData?.length || 0,
        totalProducts: productsData?.length || 0,
        lowStockProducts,
        totalProfit,
      })
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
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
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Visão geral das suas vendas e produtos
              </p>
            </div>
            <Button
              onClick={() => navigate("/sales/new")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-card  ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  R$ {stats.todaySales.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card  ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  R$ {stats.totalSales.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card  ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  R$ {stats.totalProfit.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card  ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.salesQuantity}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card  ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card  ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${stats.lowStockProducts > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.lowStockProducts > 0 ? 'text-warning' : ''}`}>
                  {stats.lowStockProducts}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-card  ">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:shadow-soft transition-all"
                  onClick={() => navigate("/system")}
                >
                  <Monitor className="h-6 w-6" />
                  <span>Nova venda</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:shadow-soft transition-all"
                  onClick={() => navigate("/sales")}
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span>Vendas</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:shadow-soft transition-all"
                  onClick={() => navigate("/products")}
                >
                  <Package className="h-6 w-6" />
                  <span>Produtos</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:shadow-soft transition-all"
                  onClick={() => navigate("/reports")}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span>Relatórios</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Dashboard;