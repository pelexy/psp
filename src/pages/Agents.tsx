import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { MapPin, Eye } from "lucide-react";

const Agents = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
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

  const handleViewAgent = (agentId: string) => {
    navigate(`/agents/${agentId}`);
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
      key: "territory",
      header: "Territory",
      accessor: (agent) => {
        const wardCount = agent.assignedWards?.length || 0;
        const streetCount = agent.assignedStreets?.length || 0;
        const hasTerritory = wardCount > 0 || streetCount > 0;

        return hasTerritory ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-600">
              {wardCount > 0 && `${wardCount} ward${wardCount > 1 ? "s" : ""}`}
              {wardCount > 0 && streetCount > 0 && ", "}
              {streetCount > 0 && `${streetCount} street${streetCount > 1 ? "s" : ""}`}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Not assigned</span>
        );
      },
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
    {
      key: "actions",
      header: "",
      accessor: (agent) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewAgent(agent.id);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <Eye className="h-4 w-4" />
        </Button>
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
            onRowClick={(agent) => handleViewAgent(agent.id)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Agents;
