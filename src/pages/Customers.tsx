import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Edit, Trash2, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  birth_date?: string;
  notes?: string;
  created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    birth_date: "",
    notes: "",
  })
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    loadCustomers()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/login")
    }
  }

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name")

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(formData)
          .eq("id", editingCustomer.id)

        if (error) throw error
        
        toast({
          title: "Cliente atualizado!",
          description: "As informações foram salvas com sucesso.",
        })
      } else {
        const { error } = await supabase
          .from("customers")
          .insert([formData])

        if (error) throw error
        
        toast({
          title: "Cliente cadastrado!",
          description: "O cliente foi adicionado com sucesso.",
        })
      }

      resetForm()
      loadCustomers()
    } catch (error) {
      toast({
        title: "Erro ao salvar cliente",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      address: "",
      birth_date: "",
      notes: "",
    })
    setEditingCustomer(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      cpf: customer.cpf || "",
      address: customer.address || "",
      birth_date: customer.birth_date || "",
      notes: customer.notes || "",
    })
    setIsDialogOpen(true)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatPhone = (phone: string) => {
    if (!phone) return ""
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando clientes...</p>
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
                Clientes
              </h1>
              <p className="text-muted-foreground">
                Gerencie sua base de clientes
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCustomer ? "Atualize as informações do cliente" : "Cadastre um novo cliente"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      {editingCustomer ? "Atualizar" : "Cadastrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar clientes por nome, e-mail ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customers List */}
          {filteredCustomers.length === 0 ? (
            <Card className="shadow-card border-0">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente buscar com outros termos" : "Comece adicionando seus primeiros clientes"}
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} className="shadow-card border-0 hover:shadow-glow transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-secondary rounded-full">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{customer.name}</h3>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              {customer.email && (
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{formatPhone(customer.phone)}</span>
                                </div>
                              )}
                              {customer.cpf && (
                                <Badge variant="outline" className="text-xs">
                                  CPF: {customer.cpf}
                                </Badge>
                              )}
                            </div>
                            {customer.address && (
                              <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>
                            )}
                            {customer.notes && (
                              <p className="text-sm text-muted-foreground mt-1 italic">{customer.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          Desde {formatDate(customer.created_at)}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(customer)}
                          className="hover:shadow-soft transition-all"
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

export default Customers;