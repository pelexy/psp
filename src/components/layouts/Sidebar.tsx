import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Recycle,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface NavChild {
  name: string;
  path: string;
}

interface NavItem {
  name: string;
  path?: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", path: "/customers", icon: Users },
  {
    name: "Billing",
    icon: Receipt,
    children: [
      { name: "Plans", path: "/billing/plans" },
      { name: "Invoices", path: "/billing/invoices" },
      { name: "Payments", path: "/billing/payments" },
    ],
  },
  {
    name: "Agents",
    icon: UserCog,
    children: [
      { name: "All Agents", path: "/agents" },
      { name: "Pickups", path: "/agents/pickups" },
    ],
  },
  {
    name: "Reports",
    icon: BarChart3,
    children: [
      { name: "Debt Aging", path: "/reports/debt-aging" },
      { name: "Outstanding", path: "/reports/outstanding" },
      { name: "Collection Rate", path: "/reports/collection-rate" },
      { name: "Problem Areas", path: "/reports/problem-areas" },
    ],
  },
  { name: "Settings", path: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Billing", "Agents", "Reports"]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const isPathActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const isSectionActive = (item: NavItem) => {
    if (item.path) return isPathActive(item.path);
    if (item.children) {
      return item.children.some((child) => isPathActive(child.path));
    }
    return false;
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
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isSectionActive(item);
          const isExpanded = expandedSections.includes(item.name);
          const hasChildren = item.children && item.children.length > 0;

          // Simple nav item (no children)
          if (!hasChildren && item.path) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
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
              </Link>
            );
          }

          // Expandable nav item (with children)
          return (
            <div key={item.name}>
              <button
                onClick={() => !collapsed && toggleSection(item.name)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${
                    isActive && collapsed
                      ? "bg-primary text-white shadow-md"
                      : isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${!isActive ? "group-hover:scale-110 transition-transform" : ""}`} />
                {!collapsed && (
                  <>
                    <span className={`font-medium text-sm flex-1 text-left ${isActive ? "font-semibold" : ""}`}>
                      {item.name}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {/* Children */}
              {!collapsed && hasChildren && isExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                  {item.children!.map((child) => {
                    const childActive = isPathActive(child.path);
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200
                          ${
                            childActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full group"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};
