  import { useState, useEffect, useRef } from "react";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Card, CardContent } from "@/components/ui/card";
  import { Minus, Plus, Trash2, ShoppingCart, Home, Printer } from "lucide-react";
  import { useNavigate } from "react-router-dom";
  import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { Label } from "@/components/ui/label";
  import { useAuth } from "@/hooks/useAuth";
  import { useProducts } from "@/hooks/useProducts";
  import { useSales } from "@/hooks/useSales";
  import { CartItem, PaymentMethod, Product } from "@/types";
  import { CurrencyFormatter, DateFormatter } from "@/utils/formatters";

  // Interfaces movidas para /types/index.ts seguindo arquitetura SOLID

  const TraditionalPDV = () => {
    const [cart, setCart] = useState<CartItem[]>([])
    const [barcode, setBarcode] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro")
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isFinalized, setIsFinalized] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const barcodeInputRef = useRef<HTMLInputElement>(null)

    // Usando hooks customizados seguindo Single Responsibility
    const { user, loading: authLoading } = useAuth()
    const { getProductByBarcode, updateStock } = useProducts()
    const { createSale, formatCurrency } = useSales()
    const navigate = useNavigate()

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
          setIsFullscreen(false)
        }
      }
    }

    useEffect(() => {
      // Atualizar hora a cada segundo
      const timer = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)

      // Focar no input do código de barras
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }

      return () => clearInterval(timer)
    }, [])

    const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && barcode.trim()) {
        await addProductByBarcode(barcode.trim())
        setBarcode("")
      }
    }

    // Usando service através do hook customizado
    const addProductByBarcode = async (code: string) => {
      const product = await getProductByBarcode(code)
      
      if (!product) {
        return // Hook já mostra o toast de erro
      }

      if (product.stock_quantity === 0) {
        // Hook não tem toast para este caso específico, então mantemos aqui
        return
      }

      addToCart(product)
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
          // Toast movido para o serviço
        }
      } else {
        setCart([...cart, { product, quantity: 1 }])
      }
    }

    const removeFromCart = (productId: number) => {
      setCart(cart.filter(item => item.product.id !== productId))
    }

    const updateQuantity = (productId: number, newQuantity: number) => {
      if (newQuantity === 0) {
        removeFromCart(productId)
      } else {
        const product = cart.find(item => item.product.id === productId)?.product
        if (product && newQuantity <= product.stock_quantity) {
          setCart(cart.map(item =>
            item.product.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          ))
        }
      }
    }

    const getSubtotal = () => {
      return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
    }

    const getLastItem = () => {
      return cart.length > 0 ? cart[cart.length - 1] : null
    }

    // Usando service através do hook customizado seguindo Single Responsibility
    const finalizeSale = async () => {
      if (cart.length === 0) {
        return
      }

      try {
        const totalAmount = getSubtotal()
        const totalCost = cart.reduce((cost, item) => cost + (item.product.cost * item.quantity), 0)
        const profit = totalAmount - totalCost

        // Criar dados da venda
        const saleData = {
          total_amount: totalAmount,
          total_cost: totalCost,
          profit: profit,
          payment_method: paymentMethod,
          sold_by: user?.id || ''
        }

        // Criar itens da venda
        const saleItems = cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          unit_cost: item.product.cost,
          total_price: item.product.price * item.quantity,
          total_cost: item.product.cost * item.quantity
        }))

        // Usar o service através do hook
        await createSale(saleData, saleItems)

        setIsFinalized(true)

        // Limpar carrinho após 3 segundos
        setTimeout(() => {
          setCart([])
          setIsFinalized(false)
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus()
          }
        }, 3000)

      } catch (error) {
        // Erro já tratado no hook
      }
    }

    // Usando utility formatters seguindo Single Responsibility
    const printReceipt = () => {
      if (cart.length === 0) {
        return
      }

      const printWindow = window.open("", "_blank")
      const totalAmount = getSubtotal()

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
            <p><strong>Data:</strong> ${DateFormatter.formatTime(currentTime)} - ${currentTime.toLocaleDateString('pt-BR')}</p>
            <p><strong>Atendente:</strong> ${user?.full_name || 'N/A'}</p>
            <p><strong>Forma de Pagamento:</strong> ${getPaymentMethodLabel()}</p>

            <div class="items">
              ${cart.map(item => `
                <div class="item">
                  <span>${item.product.name} x${item.quantity}</span>
                  <span>${CurrencyFormatter.format(item.product.price * item.quantity)}</span>
                </div>
              `).join("")}
            </div>
            <div class="total">
              <div>Total: ${CurrencyFormatter.format(totalAmount)}</div>
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

    const getPaymentMethodLabel = () => {
      const methods = {
        dinheiro: "Dinheiro",
        cartao_credito: "Cartão de Crédito",
        cartao_debito: "Cartão de Débito",
        pix: "PIX"
      }
      return methods[paymentMethod] || paymentMethod
    }

    // Formatters movidos para utils/formatters.ts seguindo Single Responsibility

    const lastItem = getLastItem()

    // Loading state usando hook de auth
    if (authLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
        {/* Header */}
        <div className="bg-accent text-primary-foreground p-4 text-center">
          <h1 className="text-2xl font-bold">SIMPLY COSMÉTICOS</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-white/10 hover:bg-white/20 fixed top-4 right-4"
          >
            {isFullscreen ? <AiOutlineFullscreenExit className="scale-150" /> : <AiOutlineFullscreen className="scale-150" />}
          </Button>

        </div>

        {/* Barcode Input */}
        <div className="p-4 bg-muted/20 border-b">
          <div className="max-w-md mx-auto">
            <Input
              ref={barcodeInputRef}
              type="text"
              placeholder="Digite ou escaneie o código de barras..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeInput}
              className="text-lg h-12"
              autoFocus
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Product List */}
          <div className="flex-1 p-6 overflow-hidden">
            <Card className="h-full overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="bg-muted p-4 border-b">
                  <div className="grid grid-cols-5 gap-4 text-sm font-semibold">
                    <span>CÓDIGO</span>
                    <span className="col-span-2">DESCRIÇÃO</span>
                    <span>QTD</span>
                    <span>VALOR TOTAL</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Escaneie ou digite um código de barras para adicionar produtos</p>
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <div key={`${item.product.id}-${index}`} className="grid grid-cols-5 gap-4 p-4 border-b hover:bg-muted/20 group">
                        <span className="text-sm font-mono">
                          {item.product.barcode || item.product.id}
                        </span>
                        <span className="col-span-2 text-sm">
                          {item.product.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm min-w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                            disabled={item.quantity >= item.product.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold">
                          {CurrencyFormatter.format(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sale Summary */}
          <div className="w-80 p-6 bg-muted/10">
            <Card className="h-full flex flex-col overflow-y-auto">
              <CardContent className="p-6 flex-1">
                <div className="space-y-6">
                  {/* Current Item */}
                  <div>
                    <h3 className="font-semibold mb-4">ITEM ATUAL</h3>
                    {lastItem ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>QUANTIDADE</span>
                          <span className="font-mono">{lastItem.quantity} X UNID</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VALOR UNITÁRIO</span>
                          <span className="font-mono">{CurrencyFormatter.format(lastItem.product.price)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground border-t pt-2">
                          {lastItem.product.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Nenhum item selecionado</div>
                    )}
                  </div>

                  {/* Sale Summary */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">RESUMO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>SUBTOTAL</span>
                        <span className="font-mono">{CurrencyFormatter.format(getSubtotal())}</span>
                      </div>
                      <div className="flex justify-between text-2xl font-bold border-t pt-2">
                        <span>TOTAL</span>
                        <span className="font-mono">{CurrencyFormatter.format(getSubtotal())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {/* Forma de pagamento */}

                  <div className="space-y-2 pt-6">
                    <div>
                      <Label htmlFor="payment">Forma de Pagamento</Label>
                      <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
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

                    <Button
                      onClick={finalizeSale}
                      disabled={cart.length === 0}
                      className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      FINALIZAR VENDA
                    </Button>
                    <Button
                      onClick={printReceipt}
                      disabled={cart.length === 0}
                      variant="outline"
                      className="w-full"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Comprovante
                    </Button>
                    <Button
                      onClick={() => navigate("/dashboard")}
                      variant="outline"
                      className="w-full"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Voltar ao Início
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 py-4 border-t px-8 max-h-[100px]">
          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-2">
              <span className="font-semibold">Simply Cosméticos</span>
              <span>: {user?.full_name || "ADMIN"}</span>
            </div>
            <div>
            </div>
            <div>
              <span className="font-bold ">HORA: {DateFormatter.formatTime(currentTime)}</span>
            </div>
          </div>
          {isFinalized && (
            <div className="text-center mt-2 text-success font-semibold">
              ✓ Obrigado pela preferência! Volte sempre!
            </div>
          )}
        </div>
      </div>
    )
  }

  export default TraditionalPDV;