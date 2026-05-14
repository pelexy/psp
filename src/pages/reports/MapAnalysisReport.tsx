import { useState, useEffect, useMemo, useRef } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  MapPin,
  AlertTriangle,
  Users,
  Ruler,
  Navigation,
  Home,
  Search,
  Crosshair,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

interface Ward {
  id: string;
  _id?: string;
  name: string;
}

interface Street {
  id: string;
  _id?: string;
  name: string;
  wardId?: string | { id?: string; _id?: string };
}

interface OrderedProperty {
  position: number;
  customerId: string;
  accountNumber: string;
  fullName: string;
  phone: string;
  address: string | null;
  latitude: number;
  longitude: number;
  currentBalance: number;
  isActive: boolean;
}

interface UnmappedProperty {
  customerId: string;
  accountNumber: string;
  fullName: string;
  phone: string;
  address: string | null;
  currentBalance: number;
  isActive: boolean;
}

interface Segment {
  fromCustomerId: string;
  toCustomerId: string;
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  distanceMeters: number;
  isJump: boolean;
  estimatedMissed: number;
}

interface MapAnalysisResponse {
  street: { id: string; name: string; wardId: string | null; wardName: string | null };
  stats: {
    totalProperties: number;
    mappedCount: number;
    unmappedCount: number;
    coverageRate: number;
    medianGapMeters: number;
    meanGapMeters: number;
    minGapMeters: number;
    maxGapMeters: number;
    jumpThresholdMeters: number;
    flaggedJumps: number;
    estimatedMissedProperties: number;
  };
  center: { latitude: number; longitude: number } | null;
  orderedProperties: OrderedProperty[];
  segments: Segment[];
  unmappedProperties: UnmappedProperty[];
}

const getId = (item: { id?: string; _id?: string }): string =>
  item.id || item._id || "";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const formatMeters = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(1)} m`;

const FitBounds = ({ points }: { points: Array<[number, number]> }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 17);
      return;
    }
    map.fitBounds(points as any, { padding: [40, 40] });
  }, [points, map]);
  return null;
};

/**
 * Clustered marker layer. We attach a leaflet.markercluster group directly
 * instead of one CircleMarker per property — that's the only way Leaflet
 * stays responsive past ~500 points.
 */
const ClusterLayer = ({
  properties,
  focusedId,
  onMarkerClick,
}: {
  properties: OrderedProperty[];
  focusedId: string | null;
  onMarkerClick: (customerId: string) => void;
}) => {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);
  const markerRefsById = useRef<Record<string, L.CircleMarker>>({});

  useEffect(() => {
    const group = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    markerRefsById.current = {};
    for (const p of properties) {
      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.95,
      });

      const popupHtml = `
        <div style="font-size:12px;min-width:180px">
          <div style="font-weight:600;font-size:13px">#${p.position} ${p.fullName}</div>
          <div style="font-family:monospace;color:#6b7280">${p.accountNumber}</div>
          <div>${p.phone}</div>
          ${p.address ? `<div style="margin-top:4px;color:#4b5563">${p.address}</div>` : ""}
          <div style="margin-top:4px;color:#dc2626;font-weight:600">
            Balance: ${formatCurrency(p.currentBalance)}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.on("click", () => onMarkerClick(p.customerId));

      markerRefsById.current[p.customerId] = marker;
      group.addLayer(marker);
    }

    map.addLayer(group);
    clusterGroupRef.current = group;

    return () => {
      map.removeLayer(group);
      clusterGroupRef.current = null;
      markerRefsById.current = {};
    };
  }, [properties, map, onMarkerClick]);

  // External focus → zoom to the marker and open its popup
  useEffect(() => {
    if (!focusedId) return;
    const marker = markerRefsById.current[focusedId];
    const group = clusterGroupRef.current;
    if (!marker || !group) return;

    // Highlight the focused marker
    marker.setStyle({ fillColor: "#f59e0b", radius: 11 });

    if (typeof group.zoomToShowLayer === "function") {
      group.zoomToShowLayer(marker, () => {
        marker.openPopup();
      });
    } else {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 18));
      marker.openPopup();
    }

    return () => {
      marker.setStyle({ fillColor: "#10b981", radius: 7 });
    };
  }, [focusedId, map]);

  return null;
};

const PAGE_SIZE = 25;

const MapAnalysisReport = () => {
  const { accessToken } = useAuth();
  const [wards, setWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [wardId, setWardId] = useState<string>("");
  const [streetId, setStreetId] = useState<string>("");
  const [data, setData] = useState<MapAnalysisResponse | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Per-tab search + pagination
  const [propSearch, setPropSearch] = useState("");
  const [propPage, setPropPage] = useState(1);
  const [unmappedSearch, setUnmappedSearch] = useState("");
  const [unmappedPage, setUnmappedPage] = useState(1);
  const [jumpsPage, setJumpsPage] = useState(1);

  const extractArray = (res: any, ...keys: string[]): any[] => {
    if (Array.isArray(res)) return res;
    for (const key of keys) {
      if (res?.[key] && Array.isArray(res[key])) return res[key];
    }
    return [];
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!accessToken) return;
      setLoadingFilters(true);
      try {
        const [wardsRes, streetsRes] = await Promise.all([
          apiService.getActiveWards(accessToken),
          apiService.getStreets(accessToken),
        ]);
        setWards(extractArray(wardsRes, "wards", "data"));
        setStreets(extractArray(streetsRes, "streets", "data"));
      } catch (error) {
        console.error("Error loading filter options:", error);
        toast.error("Failed to load wards and streets");
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, [accessToken]);

  const filteredStreets = useMemo(() => {
    if (!wardId) return streets;
    return streets.filter((s) => {
      const sw = typeof s.wardId === "object" ? getId(s.wardId as any) : (s.wardId as any);
      return sw === wardId;
    });
  }, [streets, wardId]);

  useEffect(() => {
    if (!streetId) {
      setData(null);
      return;
    }
    const fetchAnalysis = async () => {
      if (!accessToken) return;
      setLoadingData(true);
      setPropPage(1);
      setUnmappedPage(1);
      setJumpsPage(1);
      setPropSearch("");
      setUnmappedSearch("");
      try {
        const response = await apiService.getStreetMapAnalysis(accessToken, streetId);
        setData(response);
      } catch (error: any) {
        toast.error(error.message || "Failed to load map analysis");
        setData(null);
      } finally {
        setLoadingData(false);
      }
    };
    fetchAnalysis();
  }, [accessToken, streetId]);

  const points: Array<[number, number]> = useMemo(() => {
    if (!data) return [];
    return data.orderedProperties.map((p) => [p.latitude, p.longitude]);
  }, [data]);

  // Jumps-only segment list (we no longer draw normal gaps — too noisy at scale)
  const jumpSegments = useMemo(
    () => (data ? data.segments.filter((s) => s.isJump) : []),
    [data],
  );

  // A lookup so jump rows can show endpoint names
  const propsById = useMemo(() => {
    const m: Record<string, OrderedProperty> = {};
    if (data) for (const p of data.orderedProperties) m[p.customerId] = p;
    return m;
  }, [data]);

  // Filtered + paginated views
  const filteredProperties = useMemo(() => {
    if (!data) return [];
    const q = propSearch.trim().toLowerCase();
    if (!q) return data.orderedProperties;
    return data.orderedProperties.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.accountNumber.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q),
    );
  }, [data, propSearch]);

  const filteredUnmapped = useMemo(() => {
    if (!data) return [];
    const q = unmappedSearch.trim().toLowerCase();
    if (!q) return data.unmappedProperties;
    return data.unmappedProperties.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.accountNumber.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q),
    );
  }, [data, unmappedSearch]);

  const propsPaged = useMemo(
    () =>
      filteredProperties.slice((propPage - 1) * PAGE_SIZE, propPage * PAGE_SIZE),
    [filteredProperties, propPage],
  );
  const unmappedPaged = useMemo(
    () =>
      filteredUnmapped.slice(
        (unmappedPage - 1) * PAGE_SIZE,
        unmappedPage * PAGE_SIZE,
      ),
    [filteredUnmapped, unmappedPage],
  );
  const jumpsPaged = useMemo(
    () => jumpSegments.slice((jumpsPage - 1) * PAGE_SIZE, jumpsPage * PAGE_SIZE),
    [jumpSegments, jumpsPage],
  );

  const propsTotalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / PAGE_SIZE),
  );
  const unmappedTotalPages = Math.max(
    1,
    Math.ceil(filteredUnmapped.length / PAGE_SIZE),
  );
  const jumpsTotalPages = Math.max(1, Math.ceil(jumpSegments.length / PAGE_SIZE));

  const handleFocus = (customerId: string) => {
    setFocusedId(null);
    setTimeout(() => setFocusedId(customerId), 0);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Map Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Walk a street, see gaps between properties, and flag suspected unmapped houses.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Ward (optional)
                </label>
                <Select
                  value={wardId || "_all"}
                  onValueChange={(v) => {
                    setWardId(v === "_all" ? "" : v);
                    setStreetId("");
                  }}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All wards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All wards</SelectItem>
                    {wards.map((w) => (
                      <SelectItem key={getId(w)} value={getId(w)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Street *
                </label>
                <Select
                  value={streetId}
                  onValueChange={setStreetId}
                  disabled={loadingFilters || filteredStreets.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a street to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStreets.map((s) => (
                      <SelectItem key={getId(s)} value={getId(s)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {!streetId && (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Select a street above to load its map analysis.
              </p>
            </CardContent>
          </Card>
        )}

        {streetId && loadingData && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-[480px] w-full" />
          </div>
        )}

        {streetId && !loadingData && data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-gray-500 uppercase">Properties</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.stats.totalProperties.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.stats.mappedCount.toLocaleString()} mapped •{" "}
                    {data.stats.unmappedCount.toLocaleString()} not mapped
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-gray-500 uppercase">Coverage</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.stats.coverageRate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">GPS-captured rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-gray-500 uppercase">Median Gap</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMeters(data.stats.medianGapMeters)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mean {formatMeters(data.stats.meanGapMeters)} • Max{" "}
                    {formatMeters(data.stats.maxGapMeters)}
                  </p>
                </CardContent>
              </Card>
              <Card className={data.stats.flaggedJumps > 0 ? "border-red-300" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        data.stats.flaggedJumps > 0 ? "text-red-500" : "text-gray-400"
                      }`}
                    />
                    <span className="text-xs text-gray-500 uppercase">
                      Suspected Jumps
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      data.stats.flaggedJumps > 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {data.stats.flaggedJumps.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ~{data.stats.estimatedMissedProperties.toLocaleString()} houses likely
                    missed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {data.street.name}
                  {data.street.wardName && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({data.street.wardName})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.center ? (
                  <div className="h-[560px] w-full rounded-lg overflow-hidden border">
                    <MapContainer
                      center={[data.center.latitude, data.center.longitude]}
                      zoom={17}
                      scrollWheelZoom
                      preferCanvas
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <FitBounds points={points} />
                      <ClusterLayer
                        properties={data.orderedProperties}
                        focusedId={focusedId}
                        onMarkerClick={(id) => setFocusedId(id)}
                      />
                      {/* Only draw jump segments — normal gaps would smear at 2000+ pts */}
                      {jumpSegments.map((seg, i) => (
                        <Polyline
                          key={`jump-${i}`}
                          positions={[
                            [seg.from.latitude, seg.from.longitude],
                            [seg.to.latitude, seg.to.longitude],
                          ]}
                          pathOptions={{
                            color: "#ef4444",
                            weight: 3,
                            opacity: 0.9,
                            dashArray: "8 6",
                          }}
                        />
                      ))}
                    </MapContainer>
                  </div>
                ) : (
                  <div className="h-[560px] flex items-center justify-center bg-gray-50 rounded-lg border">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No mapped properties on this street yet.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow"></div>
                    Property (clusters at low zoom)
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-0.5"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #ef4444 50%, transparent 50%)",
                        backgroundSize: "6px 100%",
                        height: "2px",
                      }}
                    ></div>
                    Suspected jump (&gt; {formatMeters(data.stats.jumpThresholdMeters)})
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs: Jumps / All Properties / Not Mapped */}
            <Card>
              <Tabs defaultValue="jumps">
                <CardHeader className="border-b">
                  <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3 sm:grid-cols-none sm:flex">
                    <TabsTrigger value="jumps" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Jumps
                      <Badge variant="secondary" className="ml-1">
                        {jumpSegments.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="properties" className="gap-2">
                      <Home className="h-4 w-4" />
                      Properties
                      <Badge variant="secondary" className="ml-1">
                        {data.orderedProperties.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="unmapped" className="gap-2">
                      <MapPin className="h-4 w-4" />
                      Not Mapped
                      <Badge variant="secondary" className="ml-1">
                        {data.unmappedProperties.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                {/* Jumps tab */}
                <TabsContent value="jumps" className="m-0">
                  <CardContent className="pt-6">
                    {jumpSegments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-12">
                        No suspected jumps on this street. Coverage looks contiguous.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 mb-4">
                          Gaps where consecutive properties are more than{" "}
                          <strong>2× the median</strong> ({formatMeters(data.stats.jumpThresholdMeters)})
                          apart. Likely missed houses between them.
                        </p>
                        <div className="overflow-x-auto border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead className="text-right">Gap</TableHead>
                                <TableHead className="text-right">~Missed</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {jumpsPaged.map((s, i) => {
                                const from = propsById[s.fromCustomerId];
                                const to = propsById[s.toCustomerId];
                                return (
                                  <TableRow key={`${s.fromCustomerId}-${s.toCustomerId}-${i}`}>
                                    <TableCell className="text-sm">
                                      <div className="font-medium">
                                        #{from?.position} {from?.fullName || "—"}
                                      </div>
                                      <div className="font-mono text-xs text-gray-500">
                                        {from?.accountNumber}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      <div className="font-medium">
                                        #{to?.position} {to?.fullName || "—"}
                                      </div>
                                      <div className="font-mono text-xs text-gray-500">
                                        {to?.accountNumber}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                      {formatMeters(s.distanceMeters)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                      {s.estimatedMissed > 0 ? `~${s.estimatedMissed}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleFocus(s.fromCustomerId)}
                                        className="gap-1"
                                      >
                                        <Crosshair className="h-3 w-3" />
                                        Zoom
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        <Pagination
                          page={jumpsPage}
                          totalPages={jumpsTotalPages}
                          total={jumpSegments.length}
                          onChange={setJumpsPage}
                        />
                      </>
                    )}
                  </CardContent>
                </TabsContent>

                {/* Properties tab */}
                <TabsContent value="properties" className="m-0">
                  <CardContent className="pt-6">
                    <div className="relative max-w-md mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search name, account, phone, address..."
                        value={propSearch}
                        onChange={(e) => {
                          setPropSearch(e.target.value);
                          setPropPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {propsPaged.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                No properties match your search.
                              </TableCell>
                            </TableRow>
                          )}
                          {propsPaged.map((p) => (
                            <TableRow key={p.customerId}>
                              <TableCell className="font-semibold text-gray-500">
                                {p.position}
                              </TableCell>
                              <TableCell className="font-medium">{p.fullName}</TableCell>
                              <TableCell className="font-mono text-xs">{p.accountNumber}</TableCell>
                              <TableCell className="text-sm">{p.phone}</TableCell>
                              <TableCell className="text-sm text-gray-600 max-w-[240px] truncate">
                                {p.address || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {p.currentBalance > 0 ? (
                                  <span className="text-red-600 font-semibold">
                                    {formatCurrency(p.currentBalance)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">₦0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFocus(p.customerId)}
                                  className="gap-1"
                                >
                                  <Crosshair className="h-3 w-3" />
                                  Zoom
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination
                      page={propPage}
                      totalPages={propsTotalPages}
                      total={filteredProperties.length}
                      onChange={setPropPage}
                    />
                  </CardContent>
                </TabsContent>

                {/* Unmapped tab */}
                <TabsContent value="unmapped" className="m-0">
                  <CardContent className="pt-6">
                    <p className="text-xs text-gray-500 mb-4">
                      These properties have no GPS coordinates yet. Send a field agent to
                      capture coordinates so they can appear on the map.
                    </p>
                    <div className="relative max-w-md mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search name, account, phone, address..."
                        value={unmappedSearch}
                        onChange={(e) => {
                          setUnmappedSearch(e.target.value);
                          setUnmappedPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Name</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unmappedPaged.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                {data.unmappedProperties.length === 0
                                  ? "Every property on this street has GPS coordinates."
                                  : "No properties match your search."}
                              </TableCell>
                            </TableRow>
                          )}
                          {unmappedPaged.map((p) => (
                            <TableRow key={p.customerId}>
                              <TableCell className="font-medium">{p.fullName}</TableCell>
                              <TableCell className="font-mono text-xs">{p.accountNumber}</TableCell>
                              <TableCell className="text-sm">{p.phone}</TableCell>
                              <TableCell className="text-sm text-gray-600 max-w-[260px] truncate">
                                {p.address || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {p.currentBalance > 0 ? (
                                  <span className="text-red-600 font-semibold">
                                    {formatCurrency(p.currentBalance)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">₦0</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination
                      page={unmappedPage}
                      totalPages={unmappedTotalPages}
                      total={filteredUnmapped.length}
                      onChange={setUnmappedPage}
                    />
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const Pagination = ({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) => {
  if (total <= PAGE_SIZE) return null;
  const startIdx = (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-gray-500">
        {startIdx.toLocaleString()}–{endIdx.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-gray-700">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MapAnalysisReport;
