import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Edit, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  image_url?: string;
  barcode?: string;
  active: boolean;
  category_id?: number;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    loadProducts()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/login")
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando produtos...</p>
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
                Produtos
              </h1>
              <p className="text-muted-foreground">
                Gerencie seu catálogo de cosméticos
              </p>
            </div>
            <Button 
              onClick={() => navigate("/products/new")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>

          {/* Search */}
          <Card className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <Card className="shadow-card border-0">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente buscar com outros termos" : "Comece adicionando seus primeiros produtos"}
                </p>
                <Button 
                  onClick={() => navigate("/products/new")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="shadow-card border-0 hover:shadow-glow transition-all group">
                  <CardHeader className="pb-3">
                    <div className="aspect-square bg-secondary rounded-lg mb-3 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                        <div className="flex space-x-1">
                          {product.stock_quantity <= product.min_stock_level && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Baixo
                            </Badge>
                          )}
                          {!product.active && (
                            <Badge variant="secondary" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Preço</p>
                          <p className="font-semibold text-success">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estoque</p>
                          <p className={`font-semibold ${
                            product.stock_quantity <= product.min_stock_level 
                              ? 'text-destructive' 
                              : 'text-foreground'
                          }`}>
                            {product.stock_quantity} un.
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>Custo: {formatCurrency(product.cost)}</p>
                        <p>Margem: {formatCurrency(product.price - product.cost)}</p>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full hover:shadow-soft transition-all"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Products;