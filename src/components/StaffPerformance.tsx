import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "@/lib/icons";

interface StaffPerformanceProps {
  agentsData?: any;
}

export function StaffPerformance({ agentsData }: StaffPerformanceProps) {
  const staff = agentsData?.topAgents || [];
  return (
    <Card className="flex min-h-[400px] w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border p-5 md:p-6">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Trophy className="h-4 w-4 flex-shrink-0 text-warning" />
            <span className="truncate">Top Performing Agent</span>
          </h3>
          <p className="text-[13px] text-muted-foreground">Staff collection activity</p>
        </div>
        <Badge variant="secondary" className="h-6 flex-shrink-0 gap-1 text-xs">
          <TrendingUp className="h-3 w-3" />
          <span className="hidden sm:inline">Live</span>
        </Badge>
      </div>

      <div className="flex-1 divide-y divide-border">
        {staff.length > 0 ? staff.map((member: any) => (
          <div
            key={member.staffId}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 md:px-6"
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {member.staffName}
              </p>
              <div className="mt-0.5 flex gap-4">
                <p className="text-xs text-muted-foreground">
                  Pickups <span className="font-semibold text-success">{member.pickups}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Customers <span className="font-semibold text-primary">{member.customers}</span>
                </p>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-16 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-10 w-10 opacity-25" />
            <p className="text-sm font-medium">No agent data available</p>
            <p className="mt-1 text-xs">Agent performance will appear here once staff start making collections</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-border p-5 text-center md:px-6">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{agentsData?.totalPickups?.toLocaleString() || "0"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Success</p>
          <p className="text-lg font-semibold tabular-nums text-success">{agentsData?.successRate?.toFixed(1) || "0"}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Staff</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{agentsData?.totalStaff || "0"}</p>
        </div>
      </div>
    </Card>
  );
}
