import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Users, TrendingUp } from "@/lib/icons";
import { formatCurrency } from "@/utils/formatCurrency";

interface CollectionServicesProps {
  servicesData?: any;
}

export function CollectionServices({ servicesData }: CollectionServicesProps) {
  const services = servicesData?.services || [];
  return (
    <Card className="flex min-h-[400px] w-full flex-col overflow-hidden">
      <div className="border-b border-border p-5 md:p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 flex-shrink-0 text-primary" />
          <span className="truncate">Collection Services</span>
        </h3>
        <p className="text-[13px] text-muted-foreground">Revenue by service type</p>
      </div>

      <div className="flex-1 space-y-3 p-5 md:p-6">
          {services.length > 0 ? services.map((service: any) => (
            <div
              key={service.serviceName}
              className="rounded-lg border border-border p-3.5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{service.serviceName}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {service.count}
                    </span>
                    <span>₦{service.pricePerUnit.toLocaleString()}/ea</span>
                  </div>
                </div>
                <Badge className="bg-success/20 text-success hover:bg-success/30 h-6 text-xs">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  {service.growthPercentage > 0 ? '+' : ''}{service.growthPercentage.toFixed(1)}%
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Collection Rate</span>
                  <span className="font-semibold text-foreground">
                    {service.collectionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={service.collectionRate} className="h-1.5" />
              </div>

              <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Invoiced</p>
                  <p className="text-xs font-bold text-foreground">
                    {formatCurrency(service.invoiced)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Collected</p>
                  <p className="text-xs font-bold text-success">
                    {formatCurrency(service.collected)}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No collection services yet</p>
              <p className="text-xs mt-1">Create collection services to start tracking revenue by service type</p>
            </div>
          )}
        </div>

      <div className="flex items-center justify-between border-t border-border p-5 md:px-6">
        <span className="text-[13px] font-medium text-muted-foreground">Active Services</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">{servicesData?.activeServices || "0"}</span>
      </div>
    </Card>
  );
}
