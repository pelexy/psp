/**
 * Date Range Utility Functions
 *
 * This utility provides two types of date ranges:
 * 1. Calendar-based ranges (This Month, Last Month, This Week, Last Week)
 * 2. Rolling ranges (Last 7 Days, Last 30 Days)
 */

export type DateRangeType =
  | "today"
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "last-7-days"
  | "last-30-days"
  | "last-90-days"
  | "custom";

export interface DateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  label: string;
  description: string;
}

/**
 * Get the start of week (Monday)
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the end of week (Sunday)
 */
function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date range based on type
 */
export function getDateRange(type: DateRangeType, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (type) {
    case "today": {
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
        label: "Today",
        description: "Today only"
      };
    }

    case "this-week": {
      // Current week (Monday to Sunday)
      const startOfWeek = getStartOfWeek(today);
      const endOfWeek = getEndOfWeek(today);

      return {
        startDate: formatDate(startOfWeek),
        endDate: formatDate(endOfWeek),
        label: "This Week",
        description: `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`
      };
    }

    case "last-week": {
      // Previous week (Monday to Sunday)
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const startOfLastWeek = getStartOfWeek(lastWeek);
      const endOfLastWeek = getEndOfWeek(lastWeek);

      return {
        startDate: formatDate(startOfLastWeek),
        endDate: formatDate(endOfLastWeek),
        label: "Last Week",
        description: `${formatDate(startOfLastWeek)} to ${formatDate(endOfLastWeek)}`
      };
    }

    case "this-month": {
      // Current month (1st to last day)
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        label: "This Month",
        description: `${formatDate(firstDay)} to ${formatDate(lastDay)}`
      };
    }

    case "last-month": {
      // Previous month (1st to last day)
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

      return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        label: "Last Month",
        description: `${formatDate(firstDay)} to ${formatDate(lastDay)}`
      };
    }

    case "last-7-days": {
      // Rolling 7 days (today minus 6 days to today)
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      return {
        startDate: formatDate(sevenDaysAgo),
        endDate: formatDate(today),
        label: "Last 7 Days",
        description: `${formatDate(sevenDaysAgo)} to ${formatDate(today)}`
      };
    }

    case "last-30-days": {
      // Rolling 30 days (today minus 29 days to today)
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);

      return {
        startDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(today),
        label: "Last 30 Days",
        description: `${formatDate(thirtyDaysAgo)} to ${formatDate(today)}`
      };
    }

    case "last-90-days": {
      // Rolling 90 days
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 89);

      return {
        startDate: formatDate(ninetyDaysAgo),
        endDate: formatDate(today),
        label: "Last 90 Days",
        description: `${formatDate(ninetyDaysAgo)} to ${formatDate(today)}`
      };
    }

    case "custom": {
      if (!customStart || !customEnd) {
        // Default to this month if no custom dates provided
        return getDateRange("this-month");
      }

      return {
        startDate: customStart,
        endDate: customEnd,
        label: "Custom Range",
        description: `${customStart} to ${customEnd}`
      };
    }

    default:
      return getDateRange("this-month");
  }
}

/**
 * Get API query parameters for date range
 */
export function getDateRangeParams(type: DateRangeType, customStart?: string, customEnd?: string) {
  const range = getDateRange(type, customStart, customEnd);

  return {
    startDate: range.startDate,
    endDate: range.endDate,
  };
}
