import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Calendar, Info } from "lucide-react";
import type { DateRangeType } from "@/utils/dateRanges";
import { getDateRange } from "@/utils/dateRanges";

interface TimeFilterProps {
  selectedRange?: DateRangeType;
  onRangeChange?: (range: DateRangeType) => void;
}

const timeRanges: Array<{
  type: DateRangeType;
  label: string;
  description: string;
}> = [
  { type: "today", label: "Today", description: "Today only" },
  {
    type: "this-week",
    label: "This Week",
    description: "Monday to Sunday of current week"
  },
  {
    type: "last-week",
    label: "Last Week",
    description: "Monday to Sunday of previous week"
  },
  {
    type: "this-month",
    label: "This Month",
    description: "1st to last day of current month"
  },
  {
    type: "last-month",
    label: "Last Month",
    description: "1st to last day of previous month"
  },
  {
    type: "last-7-days",
    label: "Last 7 Days",
    description: "Rolling 7 days including today"
  },
  {
    type: "last-30-days",
    label: "Last 30 Days",
    description: "Rolling 30 days including today"
  },
  {
    type: "last-90-days",
    label: "Last 90 Days",
    description: "Rolling 90 days including today"
  },
];

export function TimeFilter({ selectedRange = "this-month", onRangeChange }: TimeFilterProps) {
  const [selected, setSelected] = useState<DateRangeType>(selectedRange);

  const handleSelect = (range: DateRangeType) => {
    setSelected(range);
    onRangeChange?.(range);
  };

  const selectedRangeData = getDateRange(selected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[160px] justify-start">
          <Calendar className="h-4 w-4" />
          <span className="flex-1 text-left">{selectedRangeData.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Info className="h-3 w-3" />
          Select a time period
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-semibold text-foreground">
          Calendar-based
        </DropdownMenuLabel>
        {timeRanges.slice(0, 5).map((range) => (
          <DropdownMenuItem
            key={range.type}
            onClick={() => handleSelect(range.type)}
            className={`cursor-pointer flex-col items-start py-2.5 ${
              selected === range.type ? 'bg-accent' : ''
            }`}
          >
            <div className="font-medium">{range.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {range.description}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-semibold text-foreground">
          Rolling periods
        </DropdownMenuLabel>
        {timeRanges.slice(5).map((range) => (
          <DropdownMenuItem
            key={range.type}
            onClick={() => handleSelect(range.type)}
            className={`cursor-pointer flex-col items-start py-2.5 ${
              selected === range.type ? 'bg-accent' : ''
            }`}
          >
            <div className="font-medium">{range.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {range.description}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
