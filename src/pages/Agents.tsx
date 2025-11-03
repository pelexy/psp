import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const Agents = () => {
  const { accessToken } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, [accessToken]);

  const fetchAgents = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getAllStaff(accessToken);
      setAgents(response || []);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      toast.error(error.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: "staffId",
      header: "Staff ID",
      accessor: (agent) => (
        <span className="font-mono text-sm font-medium">{agent.staffId}</span>
      ),
    },
    {
      key: "fullName",
      header: "Name",
      accessor: (agent) => (
        <div>
          <p className="font-medium text-gray-900">{agent.fullName}</p>
          <p className="text-xs text-gray-500">{agent.phone}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      accessor: (agent) => (
        <span className="text-gray-700">{agent.email}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (agent) => {
        const status = agent.status || 'active';
        const variant =
          status === 'active' ? 'default' :
          status === 'suspended' ? 'destructive' :
          'secondary';

        return (
          <Badge variant={variant} className="font-medium capitalize">
            {status}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created",
      accessor: (agent) => (
        <span className="text-sm text-gray-600">
          {agent.createdAt ? format(new Date(agent.createdAt), "MMM dd, yyyy") : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-accent/5 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Field Agents</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage field staff • {agents.length} total agents
            </p>
          </div>

          <CreateAgentDialog onAgentCreated={fetchAgents} />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-hidden">
          {/* Data Table */}
          <DataTable
            columns={columns}
            data={agents}
            loading={loading}
            emptyMessage="No agents found. Create your first agent to get started."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Agents;
