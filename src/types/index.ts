// Interfaces e tipos centralizados seguindo Interface Segregation Principle

export interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  barcode?: string;
  description?: string;
  image_url?: string;
  category_id?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cpf?: string;
  birth_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  total_amount: number;
  total_cost: number;
  profit: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  customer_id?: number;
  sold_by: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  total_cost: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';

export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  totalProfit: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'vendedor';
}

// Interfaces para serviços (Dependency Inversion)
export interface IProductService {
  getProducts(): Promise<Product[]>
  getProductByBarcode(barcode: string): Promise<Product | null>
  createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product>
  updateProduct(id: number, product: Partial<Product>): Promise<Product>
  deleteProduct(id: number): Promise<void>
  updateStock(id: number, newQuantity: number): Promise<void>
}

export interface ISaleService {
  getSales(): Promise<Sale[]>
  createSale(sale: Omit<Sale, 'id' | 'sale_number' | 'created_at'>, items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[]): Promise<Sale>
  deleteSale(id: number): Promise<void>
}

export interface ICustomerService {
  getCustomers(): Promise<Customer[]>
  createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer>
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer>
  deleteCustomer(id: number): Promise<void>
}

export interface IAuthService {
  getCurrentUser(): Promise<User | null>
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
}