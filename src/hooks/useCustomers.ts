// Hook customizado para clientes seguindo Single Responsibility
import { useState, useEffect } from 'react';
import { Customer } from '@/types';
import ServiceFactory from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const customerService = ServiceFactory.getCustomerService()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerService.getCustomers()
      setCustomers(data)
    } catch (error) {
      toast({
        title: 'Erro ao carregar clientes',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCustomer = await customerService.createCustomer(customer)
      setCustomers(prev => [...prev, newCustomer])
      toast({
        title: 'Cliente criado!',
        description: 'O cliente foi adicionado com sucesso.',
      })
      return newCustomer
    } catch (error) {
      toast({
        title: 'Erro ao criar cliente',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const updateCustomer = async (id: number, customer: Partial<Customer>) => {
    try {
      const updatedCustomer = await customerService.updateCustomer(id, customer)
      setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c))
      toast({
        title: 'Cliente atualizado!',
        description: 'As alterações foram salvas.',
      })
      return updatedCustomer
    } catch (error) {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const deleteCustomer = async (id: number) => {
    try {
      await customerService.deleteCustomer(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
      toast({
        title: 'Cliente removido!',
        description: 'O cliente foi excluído com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao remover cliente',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  return {
    customers,
    loading,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
}