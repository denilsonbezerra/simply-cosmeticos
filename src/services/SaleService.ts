// Serviço de vendas seguindo Single Responsibility Principle
import { BaseService } from './BaseService';
import { Sale, SaleItem, ISaleService } from '@/types';

export class SaleService extends BaseService implements ISaleService {
  async getSales(): Promise<Sale[]> {
    const { data, error } = await this.supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          quantity,
          unit_price,
          total_price,
          products (name)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      this.handleError(error, 'Buscar vendas')
    }
    
    return data as Sale[]
  }

  async createSale(
    sale: Omit<Sale, 'id' | 'sale_number' | 'created_at'>, 
    items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]
  ): Promise<Sale> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Criar a venda
    const { data: createdSale, error: saleError } = await this.supabase
      .from('sales')
      .insert([{ ...sale, sold_by: user.id }])
      .select()
      .single()

    if (saleError) {
      this.handleError(saleError, 'Criar venda')
    }

    // Criar itens da venda
    const saleItems = items.map(item => ({
      ...item,
      sale_id: createdSale.id
    }))

    const { error: itemsError } = await this.supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) {
      this.handleError(itemsError, 'Criar itens da venda')
    }

    // Atualizar estoque dos produtos
    for (const item of items) {
      const { data: product } = await this.supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single()

      if (product) {
        await this.supabase
          .from('products')
          .update({ 
            stock_quantity: product.stock_quantity - item.quantity 
          })
          .eq('id', item.product_id)
      }
    }

    return createdSale as Sale
  }

  async deleteSale(id: number): Promise<void> {
    // Primeiro buscar os itens para restaurar estoque
    const { data: saleItems } = await this.supabase
      .from('sale_items')
      .select('product_id, quantity')
      .eq('sale_id', id)

    // Restaurar estoque
    if (saleItems) {
      for (const item of saleItems) {
        const { data: product } = await this.supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        if (product) {
          await this.supabase
            .from('products')
            .update({ 
              stock_quantity: product.stock_quantity + item.quantity 
            })
            .eq('id', item.product_id)
        }
      }
    }

    // Deletar itens da venda
    const { error: itemsDeleteError } = await this.supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id)

    if (itemsDeleteError) {
      this.handleError(itemsDeleteError, 'Deletar itens da venda')
    }

    // Deletar venda
    const { error: saleDeleteError } = await this.supabase
      .from('sales')
      .delete()
      .eq('id', id)

    if (saleDeleteError) {
      this.handleError(saleDeleteError, 'Deletar venda')
    }
  }
}