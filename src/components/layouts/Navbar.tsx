import { Bell, User, Activity } from "lucide-react";
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

export const Navbar = () => {
  const { user, psp } = useAuth();

  // Get user initials
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left Side - Page Title or Breadcrumb */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {psp?.companyName || "Dashboard"}
          </h2>
          <p className="text-xs text-gray-500">Welcome back!</p>
        </div>
      </div>

      {/* Right Side - Icons */}
      <div className="flex items-center gap-3">
        {/* Live Activities */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
              <Activity className="h-5 w-5 text-gray-600 group-hover:text-primary" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Live Activities</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-3 space-y-3">
              <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New payment received</p>
                  <p className="text-xs text-gray-500">Customer ID: 1247 - ₦15,000</p>
                  <p className="text-xs text-gray-400 mt-1">Just now</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Collection completed</p>
                  <p className="text-xs text-gray-500">Zone A - 45 pickups</p>
                  <p className="text-xs text-gray-400 mt-1">2 mins ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Invoice generated</p>
                  <p className="text-xs text-gray-500">INV-2024-0892</p>
                  <p className="text-xs text-gray-400 mt-1">5 mins ago</p>
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
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New Customer Registered</p>
                  <p className="text-xs text-gray-500">
                    Jane Smith just signed up for waste collection service
                  </p>
                  <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Weekly Report Ready</p>
                  <p className="text-xs text-gray-500">
                    Your weekly performance report is now available
                  </p>
                  <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary text-sm font-medium cursor-pointer">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role || "Admin"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
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
            <DropdownMenuItem className="cursor-pointer">
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
