// Classe base para serviços seguindo DRY e Single Responsibility
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export abstract class BaseService {
  protected handleError(error: PostgrestError | Error | null, context: string): never {
    const errorMessage = error?.message || 'Erro desconhecido'
    console.error(`Erro em ${context}:`, error)
    throw new Error(`${context}: ${errorMessage}`)
  }

  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null, error: PostgrestError | null }>,
    context: string
  ): Promise<T> {
    const { data, error } = await queryFn()
    if (error) {
      this.handleError(error, context)
    }
    if (!data) {
      throw new Error(`${context}: Nenhum dado retornado`)
    }
    return data;
  }

  protected async executeCommand(
    queryFn: () => Promise<{ error: PostgrestError | null }>,
    context: string
  ): Promise<void> {
    const { error } = await queryFn()
    if (error) {
      this.handleError(error, context)
    }
  }

  protected get supabase() {
    return supabase;
  }
}