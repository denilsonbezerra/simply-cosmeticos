// Factory pattern para criar instâncias dos serviços (Dependency Injection)
import { ProductService } from './ProductService';
import { SaleService } from './SaleService';
import { AuthService } from './AuthService';

// Singleton pattern para garantir uma única instância
class ServiceFactory {
  private static productService: ProductService
  private static saleService: SaleService
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

  static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService()
    }
    return this.authService
  }
}

export default ServiceFactory;
export { ProductService, SaleService, AuthService };