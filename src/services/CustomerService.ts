// Serviço de clientes seguindo Single Responsibility Principle
import { BaseService } from './BaseService';
import { Customer, ICustomerService } from '@/types';

export class CustomerService extends BaseService implements ICustomerService {
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .order('name')
    
    if (error) {
      this.handleError(error, 'Buscar clientes')
    }
    
    return data as Customer[]
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await this.supabase
      .from('customers')
      .insert([{ ...customer, created_by: user.id }])
      .select()
      .single()
    
    if (error) {
      this.handleError(error, 'Criar cliente')
    }
    
    return data as Customer
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      this.handleError(error, 'Atualizar cliente')
    }
    
    return data as Customer
  }

  async deleteCustomer(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id)
    
    if (error) {
      this.handleError(error, 'Deletar cliente')
    }
  }
}