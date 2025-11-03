import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

interface StaffPerformanceProps {
  agentsData?: any;
}

export function StaffPerformance({ agentsData }: StaffPerformanceProps) {
  const staff = agentsData?.topAgents || [];
  return (
    <Card className="p-4 sm:p-5 md:p-6 bg-card/40 backdrop-blur-xl border-border/50 shadow-card animate-fade-in min-h-[400px] sm:min-h-[480px] w-full overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning flex-shrink-0" />
              <span className="truncate">Top Performing Agent</span>
            </h3>
            <p className="text-xs text-muted-foreground">Staff collection activity</p>
          </div>
          <Badge variant="secondary" className="gap-1 h-6 text-xs flex-shrink-0">
            <TrendingUp className="h-3 w-3" />
            <span className="hidden sm:inline">Live</span>
          </Badge>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          {staff.length > 0 ? staff.map((member: any) => (
            <div
              key={member.staffId}
              className="group flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-accent/30 to-transparent hover:from-accent/50 transition-all duration-300"
            >
              <Avatar className="h-11 w-11 border-2 border-border">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-xs">
                  {member.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {member.staffName}
                </p>

                <div className="flex gap-4 mt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Pickups</p>
                    <p className="text-xs font-bold text-success">{member.pickups}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customers</p>
                    <p className="text-xs font-bold text-primary">{member.customers}</p>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No agent data available</p>
              <p className="text-xs mt-1">Agent performance will appear here once staff start making collections</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border/50 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-bold text-foreground">{agentsData?.totalPickups?.toLocaleString() || "0"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Success</p>
            <p className="text-base font-bold text-success">{agentsData?.successRate?.toFixed(1) || "0"}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Staff</p>
            <p className="text-base font-bold text-foreground">{agentsData?.totalStaff || "0"}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
