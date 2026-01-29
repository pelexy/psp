import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Users,
  Truck,
  ExternalLink,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AgentProfileDialogProps {
  agentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentProfileDialog({
  agentId,
  open,
  onOpenChange,
}: AgentProfileDialogProps) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    if (open && agentId && accessToken) {
      loadAgentDetails();
    }
  }, [open, agentId, accessToken]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setAgent(null);
      setLoading(true);
    }
  }, [open]);

  const loadAgentDetails = async () => {
    if (!accessToken || !agentId) return;

    setLoading(true);
    try {
      const response = await apiService.getStaffById(accessToken, agentId);
      setAgent(response);
    } catch (error: any) {
      console.error("Error loading agent:", error);
      toast.error(error.message || "Failed to load agent details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewFullProfile = () => {
    onOpenChange(false);
    navigate(`/agents/${agentId}`);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agent Overview
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : agent ? (
          <div className="space-y-5">
            {/* Agent Header */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                {agent.fullName
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{agent.fullName}</h2>
                <p className="text-xs text-gray-500 font-mono">{agent.staffId}</p>
                <Badge className={`mt-1 text-xs ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </Badge>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{agent.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{agent.phone}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <Truck className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{agent.performance?.totalPickups || 0}</p>
                <p className="text-xs text-gray-500">Total Pickups</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{agent.performance?.pickupsThisMonth || 0}</p>
                <p className="text-xs text-gray-500">This Month</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <Users className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{agent.performance?.uniqueCustomersServed || 0}</p>
                <p className="text-xs text-gray-500">Customers</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <MapPin className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{agent.performance?.customersInTerritory || 0}</p>
                <p className="text-xs text-gray-500">In Territory</p>
              </div>
            </div>

            {/* Territory Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Assigned Territory</p>
              <div className="flex flex-wrap gap-1">
                {agent.assignedWards?.length > 0 || agent.assignedStreets?.length > 0 ? (
                  <>
                    {agent.assignedWards?.slice(0, 3).map((w: any) => (
                      <Badge key={w._id} variant="secondary" className="text-xs">
                        {w.name}
                      </Badge>
                    ))}
                    {agent.assignedStreets?.slice(0, 2).map((s: any) => (
                      <Badge key={s._id} variant="outline" className="text-xs">
                        {s.name}
                      </Badge>
                    ))}
                    {(agent.assignedWards?.length > 3 || agent.assignedStreets?.length > 2) && (
                      <Badge variant="outline" className="text-xs">
                        +{(agent.assignedWards?.length || 0) + (agent.assignedStreets?.length || 0) - 5} more
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">No territory assigned</span>
                )}
              </div>
            </div>

            {/* Collection Rate (if has territory) */}
            {agent.performance?.customersInTerritory > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Collection Rate</p>
                    <p className="text-lg font-bold text-green-600">
                      {agent.performance.collectionRate}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Collected</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(agent.performance.totalPaidInTerritory)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* View Full Profile Button */}
            <Button onClick={handleViewFullProfile} className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              View Full Profile
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Agent not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
