import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface CollectionServicesProps {
  servicesData?: any;
}

export function CollectionServices({ servicesData }: CollectionServicesProps) {
  const services = servicesData?.services || [];
  return (
    <Card className="p-5 bg-card/40 backdrop-blur-xl border-border/50 shadow-card animate-fade-in min-h-[480px]">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Collection Services
          </h3>
          <p className="text-xs text-muted-foreground">Revenue by service type</p>
        </div>

        <div className="space-y-2.5">
          {services.length > 0 ? services.map((service: any) => (
            <div
              key={service.serviceName}
              className="p-3 rounded-lg bg-gradient-to-r from-accent/20 to-transparent border border-border/50 hover:border-primary/30 transition-all duration-300"
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

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active Services
            </span>
            <span className="text-lg font-bold text-foreground">{servicesData?.activeServices || "0"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
