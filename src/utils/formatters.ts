// Utilitários de formatação seguindo Single Responsibility
export class CurrencyFormatter {
  static format(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
}

export class DateFormatter {
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  static formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}

export class SaleNumberFormatter {
  static format(saleNumber: number): string {
    return `#${saleNumber.toString().padStart(5, '0')}`
  }
}

export class PaymentMethodFormatter {
  private static methods = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX'
  }

  static format(method: string): string {
    return this.methods[method as keyof typeof this.methods] || method
  }

  static getBadgeConfig(method: string) {
    const configs = {
      dinheiro: { label: "Dinheiro", className: "bg-success text-success-foreground cursor-pointer" },
      cartao_credito: { label: "Cartão Crédito", className: "bg-accent text-accent-foreground cursor-pointer" },
      cartao_debito: { label: "Cartão Débito", className: "bg-accent text-primary-foreground cursor-pointer" },
      pix: { label: "PIX", className: "bg-warning text-warning-foreground cursor-pointer" },
    }
    
    return configs[method as keyof typeof configs] || { label: method, className: "" }
  }
}