import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DateRange = "7d" | "14d" | "30d" | "custom";

interface DateFilterProps {
  selected: DateRange;
  onSelect: (range: DateRange) => void;
  onRefresh?: () => void;
}

export const DateFilter = ({ selected, onSelect, onRefresh }: DateFilterProps) => {
  const options: { value: DateRange; label: string }[] = [
    { value: "7d", label: "Last 7 days" },
    { value: "14d", label: "Last 14 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 p-1 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/40">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${
                selected === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2 border-border/40 hover:border-border"
        >
          <RotateCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      )}
    </div>
  );
};
