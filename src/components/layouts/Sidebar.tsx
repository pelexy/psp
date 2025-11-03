import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Trash2,
  UserCog,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Recycle,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Invoices", path: "/invoices", icon: FileText },
  { name: "Transactions", path: "/transactions", icon: CreditCard },
  { name: "Collections", path: "/collections", icon: Trash2 },
  { name: "Agents", path: "/agents", icon: UserCog },
  { name: "Pickups", path: "/pickups", icon: Package }, // Waste collection pickups
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-sm`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Recycle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">COLLECT</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">by BuyPower</p>
            </div>
          </div>
        ) : (
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center mx-auto shadow-sm">
            <Recycle className="h-5 w-5 text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-5 p-1 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
              {!collapsed && (
                <span className={`font-medium text-sm ${isActive ? "font-semibold" : ""}`}>{item.name}</span>
              )}
              {isActive && !collapsed && (
                <div className="absolute right-3 h-2 w-2 bg-white rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full group"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};
 
