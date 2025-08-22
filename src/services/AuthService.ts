// Serviço de autenticação seguindo Single Responsibility Principle
import { BaseService } from './BaseService';
import { User, IAuthService } from '@/types';

export class AuthService extends BaseService implements IAuthService {
  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session) return null

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('full_name, role')
      .eq('user_id', session.user.id)
      .single()

    return {
      id: session.user.id,
      email: session.user.email!,
      full_name: profile?.full_name,
      role: (profile?.role as 'admin' | 'vendedor') || 'vendedor'
    }
  }

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      this.handleError(error, 'Login')
    }

    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('Erro ao carregar dados do usuário')
    }

    return user
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut()
    if (error) {
      this.handleError(error, 'Logout')
    }
  }
}