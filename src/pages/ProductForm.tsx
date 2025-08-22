import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Package, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: number;
  name: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  category_id: number;
  barcode: string;
  image_url: string;
  active: boolean;
}

const ProductForm = () => {
  const { id } = useParams()
  const isEditing = !!id
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    description: "",
    price: 0,
    cost: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    category_id: 0,
    barcode: "",
    image_url: "",
    active: true,
  })
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    loadCategories()
    if (isEditing) {
      loadProduct()
    } else {
      setLoading(false)
    }
  }, [id])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/login")
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      })
    }
  }

  const loadProduct = async () => {
    if (!id) return

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", parseInt(id))
        .single()

      if (error) throw error

      setFormData({
        name: data.name,
        description: data.description || "",
        price: data.price,
        cost: data.cost,
        stock_quantity: data.stock_quantity,
        min_stock_level: data.min_stock_level,
        category_id: data.category_id || 0,
        barcode: data.barcode || "",
        image_url: data.image_url || "",
        active: data.active,
      })
    } catch (error) {
      toast({
        title: "Erro ao carregar produto",
        description: "Não foi possível carregar os dados do produto.",
        variant: "destructive",
      })
      navigate("/products")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const productData = {
        ...formData,
        created_by: user.id
      }

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", parseInt(id))

        if (error) throw error

        toast({
          title: "Produto atualizado!",
          description: "As alterações foram salvas com sucesso.",
        })
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData])

        if (error) throw error

        toast({
          title: "Produto cadastrado!",
          description: "O produto foi adicionado com sucesso.",
        })
      }

      navigate("/products")
    } catch (error) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const calculateProfit = () => {
    return formData.price - formData.cost
  }

  const calculateMargin = () => {
    if (formData.price === 0) return 0
    return ((formData.price - formData.cost) / formData.price) * 100
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando produto...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/products")}
                className="hover:shadow-soft transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-accent">
                  {isEditing ? "Editar Produto" : "Novo Produto"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? "Atualize as informações do produto" : "Adicione um novo produto ao catálogo"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card className="shadow-card ">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Informações Básicas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Batom Vermelho Mate"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição detalhada do produto..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category_id.toString()}
                      onValueChange={(value) => setFormData({ ...formData, category_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={"Selecionar categoria"}>
                          Selecionar Categoria
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="barcode">Código de Barras</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      onKeyDown={(e) => {
                        // Allow barcode scanners to input automatically
                        if (e.key === "Enter") {
                          e.preventDefault()
                        }
                      }}
                      placeholder="Digite ou escaneie o código de barras"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use um leitor de código de barras ou digite manualmente
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label htmlFor="active">Produto ativo</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Image and Financial */}
              <Card className="shadow-card ">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Imagem e Preços</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="image_url">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                    {formData.image_url && (
                      <div className="mt-2">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost">Custo *</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                        placeholder="0,00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Preço de Venda *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>

                  {/* Profit Calculation */}
                  <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Custo:</span>
                      <span>{formatCurrency(formData.cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Preço:</span>
                      <span>{formatCurrency(formData.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-accent border-t pt-2">
                      <span>Lucro:</span>
                      <span>{formatCurrency(calculateProfit())}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Margem:</span>
                      <span>{calculateMargin().toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Information */}
              <Card className="shadow-card  md:col-span-2">
                <CardHeader>
                  <CardTitle>Controle de Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="min_stock_level">Estoque Mínimo *</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        min="0"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                        placeholder="5"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="w-full">
                        <Label>Status do Estoque</Label>
                        <div className="h-10 flex items-center">
                          {formData.stock_quantity <= formData.min_stock_level ? (
                            <span className="text-destructive font-medium">⚠️ Estoque Baixo</span>
                          ) : (
                            <span className="text-success font-medium">✅ Estoque OK</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/products")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft"
              >
                {saving ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Atualizar Produto" : "Cadastrar Produto"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ProductForm;