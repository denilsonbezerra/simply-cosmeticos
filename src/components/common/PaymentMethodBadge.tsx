// Componente de badge para método de pagamento seguindo Single Responsibility
import { Badge } from "@/components/ui/badge";
import { PaymentMethodFormatter } from "@/utils/formatters";

interface PaymentMethodBadgeProps {
  method: string
}

export const PaymentMethodBadge = ({ method }: PaymentMethodBadgeProps) => {
  const config = PaymentMethodFormatter.getBadgeConfig(method)
  
  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  )
}