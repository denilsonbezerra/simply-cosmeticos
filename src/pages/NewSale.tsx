import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Package,
  Check
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

interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock_quantity: number;
  image_url?: string;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const NewSale = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<number>()
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro")
  const [notes, setNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/login")
    }
  }

  const loadData = async () => {
    try {
      const [productsResult, customersResult] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .gt("stock_quantity", 0)
          .order("name"),
        supabase
          .from("customers")
          .select("id, name, email, phone")
          .order("name")
      ])

      if (productsResult.error) throw productsResult.error
      if (customersResult.error) throw customersResult.error

      setProducts(productsResult.data || [])
      setCustomers(customersResult.data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar produtos e clientes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      } else {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${product.stock_quantity} unidades disponíveis.`,
          variant: "destructive",
        })
      }
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.product.id !== productId))
    } else {
      const product = products.find(p => p.id === productId)
      if (product && newQuantity <= product.stock_quantity) {
        setCart(cart.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        ))
      } else {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${product?.stock_quantity} unidades disponíveis.`,
          variant: "destructive",
        })
      }
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const getCartProfit = () => {
    return cart.reduce((profit, item) => 
      profit + ((item.product.price - item.product.cost) * item.quantity), 0
    )
  }

  const getCartCost = () => {
    return cart.reduce((cost, item) => cost + (item.product.cost * item.quantity), 0)
  }

  const completeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a venda.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const totalAmount = getCartTotal()
      const totalCost = getCartCost()
      const profit = getCartProfit()

      // Criar a venda
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([{
          total_amount: totalAmount,
          total_cost: totalCost,
          profit: profit,
          payment_method: paymentMethod,
          notes: notes || null,
          customer_id: selectedCustomer || null,
          sold_by: user.id
        }])
        .select()
        .single()

      if (saleError) throw saleError

      // Criar os itens da venda
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        unit_cost: item.product.cost,
        total_price: item.product.price * item.quantity,
        total_cost: item.product.cost * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems)

      if (itemsError) throw itemsError

      // Atualizar estoque dos produtos
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock_quantity: item.product.stock_quantity - item.quantity
          })
          .eq("id", item.product.id)

        if (stockError) throw stockError
      }

      toast({
        title: "Venda finalizada!",
        description: `Venda de ${formatCurrency(totalAmount)} realizada com sucesso.`,
      })

      navigate("/sales")
    } catch (error) {
      toast({
        title: "Erro ao finalizar venda",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                Nova Venda
              </h1>
              <p className="text-muted-foreground">
                Selecione produtos e finalize a venda
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate("/sales")}
            >
              Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2 space-y-4">
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
              <div className="grid gap-4 md:grid-cols-2">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="shadow-card border-0 hover:shadow-glow transition-all cursor-pointer" onClick={() => addToCart(product)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-lg font-bold text-success">
                            {formatCurrency(product.price)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Estoque: {product.stock_quantity}
                            </Badge>
                            {cart.find(item => item.product.id === product.id) && (
                              <Badge variant="default" className="text-xs">
                                No carrinho: {cart.find(item => item.product.id === product.id)?.quantity}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart Section */}
            <div className="space-y-4">
              {/* Cart Items */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Carrinho ({cart.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Carrinho vazio
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-sm text-success font-semibold">
                            {formatCurrency(item.product.price)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Sale Details */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle>Detalhes da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer */}
                  <div>
                    <Label htmlFor="customer">Cliente (opcional)</Label>
                    <Select value={selectedCustomer.toString()} onValueChange={(value) => setSelectedCustomer(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Selecionar cliente">{selectedCustomer}</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toLocaleString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label htmlFor="payment">Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre a venda..."
                      rows={3}
                    />
                  </div>

                  {/* Summary */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(getCartTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Custo:</span>
                      <span>{formatCurrency(getCartCost())}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-accent">
                      <span>Lucro:</span>
                      <span>{formatCurrency(getCartProfit())}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-success">{formatCurrency(getCartTotal())}</span>
                    </div>
                  </div>

                  {/* Complete Sale Button */}
                  <Button
                    onClick={completeSale}
                    disabled={cart.length === 0 || saving}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft"
                  >
                    {saving ? (
                      "Finalizando..."
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Finalizar Venda
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NewSale;