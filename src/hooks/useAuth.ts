// Hook customizado para autenticação seguindo Single Responsibility
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import ServiceFactory from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()
  const authService = ServiceFactory.getAuthService()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        navigate('/login')
        return
      }
      setUser(currentUser)
    } catch (error) {
      toast({
        title: 'Erro de autenticação',
        description: 'Não foi possível verificar o usuário.',
        variant: 'destructive',
      })
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const loggedUser = await authService.login(email, password)
      setUser(loggedUser)
      return loggedUser
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Erro no logout',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return {
    user,
    loading,
    login,
    logout,
    checkAuth
  }
}