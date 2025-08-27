// Factory pattern para criar instâncias dos serviços (Dependency Injection)
import { ProductService } from './ProductService';
import { SaleService } from './SaleService';
import { CustomerService } from './CustomerService';
import { AuthService } from './AuthService';

// Singleton pattern para garantir uma única instância
class ServiceFactory {
  private static productService: ProductService
  private static saleService: SaleService
  private static customerService: CustomerService
  private static authService: AuthService

  static getProductService(): ProductService {
    if (!this.productService) {
      this.productService = new ProductService()
    }
    return this.productService
  }

  static getSaleService(): SaleService {
    if (!this.saleService) {
      this.saleService = new SaleService()
    }
    return this.saleService
  }

  static getCustomerService(): CustomerService {
    if (!this.customerService) {
      this.customerService = new CustomerService()
    }
    return this.customerService
  }

  static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService()
    }
    return this.authService
  }
}

export default ServiceFactory;
export { ProductService, SaleService, CustomerService, AuthService };