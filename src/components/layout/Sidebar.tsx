import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  LogOut, 
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Monitor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Monitor, label: "Sistema de Vendas", path: "/system" },
    { icon: ShoppingCart, label: "Vendas", path: "/sales" },
    { icon: Package, label: "Produtos", path: "/products" },
    { icon: Users, label: "Clientes", path: "/customers" },
    { icon: BarChart3, label: "Relatórios", path: "/reports" },
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
      navigate("/login")
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Não foi possível fazer logout.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300 shadow-card",
      collapsed ? "w-16" : "w-[300px]"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-accent rounded-lg">
                <ShoppingBag className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-accent">
                  Simply Cosméticos
                </h2>
                <p className="text-xs text-muted-foreground">Sistema de Vendas</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex flex-1 flex-col p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all hover:shadow-soft",
                  collapsed ? "px-2" : "px-4",
                  isActive && "bg-gradient-primary text-white shadow-soft"
                )}
              >
                <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed ? "px-2" : "px-4"
          )}
        >
          <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  )
}

export default Sidebar;