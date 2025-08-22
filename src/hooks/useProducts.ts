// Hook customizado para produtos seguindo Single Responsibility
import { useState, useEffect } from 'react';
import { Product } from '@/types';
import ServiceFactory from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const productService = ServiceFactory.getProductService()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getProducts()
      setProducts(data)
    } catch (error) {
      toast({
        title: 'Erro ao carregar produtos',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      const product = await productService.getProductByBarcode(barcode)

      if (!product) {
        toast({
          title: 'Produto não encontrado',
          description: `Nenhum produto com o código ${barcode} foi encontrado.`,
          variant: 'destructive',
        })
        return null
      }

      if (product.stock_quantity === 0) {
        toast({
          title: 'Estoque insuficiente',
          description: `O produto ${product.name} está sem estoque.`,
          variant: 'destructive',
        })
        return null
      }

      return product
    } catch (error) {
      toast({
        title: 'Erro ao buscar produto',
        description: error.message,
        variant: 'destructive',
      })
      return null
    }
  }


  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProduct = await productService.createProduct(product)
      setProducts(prev => [...prev, newProduct])
      toast({
        title: 'Produto criado!',
        description: 'O produto foi adicionado com sucesso.',
      })
      return newProduct
    } catch (error) {
      toast({
        title: 'Erro ao criar produto',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const updateProduct = async (id: number, product: Partial<Product>) => {
    try {
      const updatedProduct = await productService.updateProduct(id, product)
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p))
      toast({
        title: 'Produto atualizado!',
        description: 'As alterações foram salvas.',
      })
      return updatedProduct
    } catch (error) {
      toast({
        title: 'Erro ao atualizar produto',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      await productService.deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      toast({
        title: 'Produto removido!',
        description: 'O produto foi excluído com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao remover produto',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const updateStock = async (id: number, newQuantity: number) => {
    try {
      await productService.updateStock(id, newQuantity)
      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, stock_quantity: newQuantity } : p
      ))
    } catch (error) {
      toast({
        title: 'Erro ao atualizar estoque',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  return {
    products,
    loading,
    loadProducts,
    getProductByBarcode,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
  }
}