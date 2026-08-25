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
import { MapPin, Eye } from "@/lib/icons";

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
          <p className="font-medium text-foreground">{agent.fullName}</p>
          <p className="text-xs text-muted-foreground">{agent.phone}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      accessor: (agent) => (
        <span className="text-foreground">{agent.email}</span>
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
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {wardCount > 0 && `${wardCount} ward${wardCount > 1 ? "s" : ""}`}
              {wardCount > 0 && streetCount > 0 && ", "}
              {streetCount > 0 && `${streetCount} street${streetCount > 1 ? "s" : ""}`}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not assigned</span>
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
        <span className="text-sm text-muted-foreground">
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
          className="text-muted-foreground"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-background max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">Field Agents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage field staff • {agents.length} total agents
            </p>
          </div>

          <CreateAgentDialog onAgentCreated={fetchAgents} />
        </div>

        {/* Main Content Card */}
        <div className="bg-card rounded-lg shadow-card border border-border max-w-full overflow-hidden">
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
