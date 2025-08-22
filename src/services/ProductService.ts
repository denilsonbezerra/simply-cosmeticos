// Serviço de produtos seguindo Single Responsibility Principle
import { BaseService } from './BaseService';
import { Product, IProductService } from '@/types';

export class ProductService extends BaseService implements IProductService {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')
    
    if (error) {
      this.handleError(error, 'Buscar produtos')
    }
    
    return data as Product[]
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      this.handleError(error, 'Buscar produto por código')
    }

    return data
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert([product])
      .select()
      .single()
    
    if (error) {
      this.handleError(error, 'Criar produto')
    }
    
    return data as Product
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      this.handleError(error, 'Atualizar produto')
    }
    
    return data as Product
  }

  async deleteProduct(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) {
      this.handleError(error, 'Deletar produto')
    }
  }

  async updateStock(id: number, newQuantity: number): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ stock_quantity: newQuantity })
      .eq('id', id)
    
    if (error) {
      this.handleError(error, 'Atualizar estoque')
    }
  }
}