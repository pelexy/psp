import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const Reports = () => {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-2">Financial reports coming soon...</p>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
