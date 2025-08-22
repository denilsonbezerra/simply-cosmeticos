// Hook customizado para vendas seguindo Single Responsibility
import { useState, useEffect } from 'react';
import { Sale, SaleItem } from '@/types';
import ServiceFactory from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const saleService = ServiceFactory.getSaleService()

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      setLoading(true)
      const data = await saleService.getSales()
      setSales(data)
    } catch (error) {
      toast({
        title: 'Erro ao carregar vendas',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createSale = async (
    sale: Omit<Sale, 'id' | 'sale_number' | 'created_at'>, 
    items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]
  ) => {
    try {
      const newSale = await saleService.createSale(sale, items)
      await loadSales() // Recarregar para pegar dados completos
      toast({
        title: 'Venda finalizada!',
        description: `Venda de ${formatCurrency(sale.total_amount)} realizada com sucesso.`,
      })
      return newSale
    } catch (error) {
      toast({
        title: 'Erro ao finalizar venda',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const deleteSale = async (id: number) => {
    try {
      await saleService.deleteSale(id)
      setSales(prev => prev.filter(s => s.id !== id))
      toast({
        title: 'Venda excluída!',
        description: 'A venda foi removida com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao excluir venda',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return {
    sales,
    loading,
    loadSales,
    createSale,
    deleteSale,
    formatCurrency
  }
}