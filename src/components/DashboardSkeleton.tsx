import { Card } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Financial Overview Skeleton */}
      <Card className="bg-white border border-gray-200 shadow-sm min-h-[400px]">
        <div className="p-6">
          <div className="mb-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Side Skeleton */}
            <div className="space-y-6">
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Right Side Skeleton */}
            <div className="space-y-6">
              <div className="h-48 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-2 gap-2.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Hero Metrics Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-white border border-gray-200 shadow-sm min-h-[160px]">
            <div className="space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Skeleton */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm min-h-[450px]">
        <div className="space-y-5">
          <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-[320px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </Card>

      {/* Metrics Grid Skeleton - Operations */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-white border border-gray-200 shadow-sm min-h-[160px]">
            <div className="space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Skeleton */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm min-h-[450px]">
        <div className="space-y-5">
          <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-[320px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </Card>

      {/* Grid Sections Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-5 bg-white border border-gray-200 shadow-sm min-h-[480px]">
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2.5">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
