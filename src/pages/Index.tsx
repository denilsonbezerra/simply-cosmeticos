import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
  
const Index = () => {
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      navigate("/dashboard")
    } else {
      navigate("/login")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <p className="text-white">Carregando...</p>
      </div>
    </div>
  )
}

export default Index;
