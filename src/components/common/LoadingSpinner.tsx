// Componente de loading reutilizável seguindo Single Responsibility
interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingSpinner = ({ message = "Carregando...", size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-4 border-primary border-t-transparent mx-auto mb-4`}></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}