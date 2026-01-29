import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { WardSettings } from "@/components/settings/WardSettings";
import { StreetSettings } from "@/components/settings/StreetSettings";
import { PropertyTypeSettings } from "@/components/settings/PropertyTypeSettings";
import { ExpenseCategorySettings } from "@/components/settings/ExpenseCategorySettings";
import { Building2, MapPin, Navigation, Home, Wallet } from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile, property types, wards, streets, and expense categories</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="property-types" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Property</span>
            </TabsTrigger>
            <TabsTrigger value="wards" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Wards</span>
            </TabsTrigger>
            <TabsTrigger value="streets" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Streets</span>
            </TabsTrigger>
            <TabsTrigger value="expense-categories" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="property-types" className="space-y-4 mt-6">
            <PropertyTypeSettings />
          </TabsContent>

          <TabsContent value="wards" className="space-y-4 mt-6">
            <WardSettings />
          </TabsContent>

          <TabsContent value="streets" className="space-y-4 mt-6">
            <StreetSettings />
          </TabsContent>

          <TabsContent value="expense-categories" className="space-y-4 mt-6">
            <ExpenseCategorySettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
