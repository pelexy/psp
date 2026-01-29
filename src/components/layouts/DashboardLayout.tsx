import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Recycle,
  UserCog,
  Bell,
  User,
  Menu,
  X,
  Package,
  Receipt,
  BarChart3,
  Wallet,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavChild {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  {
    name: "Billing",
    icon: Receipt,
    children: [
      { name: "Plans", href: "/billing/plans" },
      { name: "Invoices", href: "/billing/invoices" },
      { name: "Payments", href: "/billing/payments" },
    ],
  },
  {
    name: "Agents",
    icon: UserCog,
    children: [
      { name: "All Agents", href: "/agents" },
      { name: "Pickups", href: "/agents/pickups" },
    ],
  },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  {
    name: "Reports",
    icon: BarChart3,
    children: [
      { name: "Debt Aging", href: "/reports/debt-aging" },
      { name: "Outstanding", href: "/reports/outstanding" },
      { name: "Collection Rate", href: "/reports/collection-rate" },
      { name: "Problem Areas", href: "/reports/problem-areas" },
    ],
  },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Billing", "Agents", "Reports"]);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    if (item.href) return isPathActive(item.href);
    if (item.children) {
      return item.children.some((child) => isPathActive(child.href));
    }
    return false;
  };

  // Get user initials
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50 overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-sm",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Recycle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">COLLECT</h1>
                <p className="text-[9px] text-gray-500 -mt-0.5">by BuyPower</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Recycle className="h-4 w-4 text-white" />
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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isSectionActive(item);
            const isExpanded = expandedSections.includes(item.name);
            const hasChildren = item.children && item.children.length > 0;

            // Simple nav item (no children)
            if (!hasChildren && item.href) {
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {!collapsed && (
                    <span className={cn("text-[13px]", isActive ? "font-semibold" : "font-medium")}>
                      {item.name}
                    </span>
                  )}
                </NavLink>
              );
            }

            // Expandable nav item (with children)
            return (
              <div key={item.name}>
                <button
                  onClick={() => !collapsed && toggleSection(item.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive && collapsed
                      ? "bg-primary text-white"
                      : isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className={cn("text-[13px] flex-1 text-left", isActive ? "font-semibold" : "font-medium")}>
                        {item.name}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isExpanded ? "rotate-180" : ""
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Children */}
                {!collapsed && hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-1">
                    {item.children!.map((child) => {
                      const childActive = isPathActive(child.href);
                      return (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all duration-200",
                            childActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <span>{child.name}</span>
                        </NavLink>
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full group"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span className="font-medium text-[13px]">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-w-0",
          "lg:ml-64",
          collapsed && "lg:ml-20"
        )}
      >
        {/* Modern Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>

          {/* Right Side - Icons */}
          <div className="flex items-center gap-2 lg:gap-3 ml-auto">
            {/* Live Pickup Activities */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
                  <Package className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Live Pickup Activities
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                  <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Pickup completed</p>
                      <p className="text-xs text-gray-500">Agent: John Doe - Customer ID: 1247</p>
                      <p className="text-xs text-gray-400 mt-1">Just now</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
                  <Bell className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    3
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                  <DropdownMenuItem className="p-3 cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">Payment Overdue</p>
                      <p className="text-xs text-gray-500">
                        Customer John Doe has an overdue payment of ₦25,000
                      </p>
                      <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.firstName || user?.email?.split('@')[0]} {user?.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500 font-medium capitalize">
                      {user?.role || 'User'}
                    </p>
                  </div>
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.firstName || user?.email?.split('@')[0]} {user?.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
};
