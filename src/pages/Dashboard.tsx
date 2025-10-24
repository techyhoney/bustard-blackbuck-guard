import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bird, Users, FileText, TrendingUp, Trees, AlertTriangle, UsersRound, MapPin, CalendarIcon, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import birdLogo from "@/images/bird.png";
import animalLogo from "@/images/animal.png";
import SurveyMap from "@/components/SurveyMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface DashboardStats {
  totalSurveyEntries: number;
  gibEntries: number;
  blackbuckEntries: number;
  otherEntries: number;
  habitatAssessments: number;
  threatDocumentations: number;
  conservationInteractions: number;
  totalUsers: number;
  activeStaff: number;
  activeFarmers: number;
  activeRangers: number;
  activeOfficers: number;
  activeAdmins: number;
  usersByRole: Record<string, number>;
  entriesByMonth: Array<{ month: string; count: number }>;
  lastUpdated: string;
}

interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  location: string;
  type: string;
  creature?: string;
  observer_name: string;
  created_at: string;
  image_url?: string | null;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSurveyEntries: 0,
    gibEntries: 0,
    blackbuckEntries: 0,
    otherEntries: 0,
    habitatAssessments: 0,
    threatDocumentations: 0,
    conservationInteractions: 0,
    totalUsers: 0,
    activeStaff: 0,
    activeFarmers: 0,
    activeRangers: 0,
    activeOfficers: 0,
    activeAdmins: 0,
    usersByRole: {},
    entriesByMonth: [],
    lastUpdated: new Date().toLocaleString('en-IN'),
  });
  const [loading, setLoading] = useState(true);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchMapLocations();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch survey entries (locations)
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('creature, created_at');

      if (locationsError) {
        console.error("Locations fetch error:", locationsError);
        toast.error("Failed to fetch survey data");
      }

      // Fetch habitat assessments count
      const { count: habitatCount, error: habitatError } = await supabase
        .from('habitat_assessments')
        .select('*', { count: 'exact', head: true });

      if (habitatError) {
        console.error("Habitat assessments fetch error:", habitatError);
      }

      // Fetch threat documentations count
      const { count: threatCount, error: threatError } = await supabase
        .from('threat_documentations')
        .select('*', { count: 'exact', head: true });

      if (threatError) {
        console.error("Threat documentations fetch error:", threatError);
      }

      // Fetch conservation interactions count
      const { count: conservationCount, error: conservationError } = await supabase
        .from('conservation_community_interactions')
        .select('*', { count: 'exact', head: true });

      if (conservationError) {
        console.error("Conservation interactions fetch error:", conservationError);
      }

      // Fetch user profiles
      const { data: users, error: usersError } = await supabase
        .from('user_profile')
        .select('role');

      if (usersError) {
        console.error("Users fetch error:", usersError);
        toast.error("Failed to fetch user data");
      }

      console.log("Fetched users:", users); // Debug log

      // Calculate survey stats
      const gibCount = (locations || []).filter(l => l.creature === 'Great Indian Bustard' || l.creature === 'Bustard').length;
      const blackbuckCount = (locations || []).filter(l => l.creature === 'Blackbuck').length;
      const otherCount = (locations || []).filter(l => l.creature === 'Other').length;
      const totalSurveys = (locations || []).length;

      // Calculate user stats (case-insensitive)
      const usersByRole = (users || []).reduce((acc: any, user) => {
        const role = (user.role || 'Unknown').toLowerCase();
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      console.log("Users by role:", usersByRole); // Debug log

      // Calculate entries by month (last 6 months)
      const monthlyData = calculateMonthlyData(locations || []);

      const statsData = {
        totalSurveyEntries: totalSurveys,
        gibEntries: gibCount,
        blackbuckEntries: blackbuckCount,
        otherEntries: otherCount,
        habitatAssessments: habitatCount || 0,
        threatDocumentations: threatCount || 0,
        conservationInteractions: conservationCount || 0,
        totalUsers: (users || []).length,
        activeStaff: usersByRole['staff'] || 0,
        activeFarmers: usersByRole['farmer'] || 0,
        activeRangers: usersByRole['ranger'] || 0,
        activeOfficers: usersByRole['officer'] || 0,
        activeAdmins: usersByRole['admin'] || 0,
        usersByRole: usersByRole,
        entriesByMonth: monthlyData,
        lastUpdated: new Date().toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      console.log("Final stats:", statsData); // Debug log
      setStats(statsData);
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyData = (locations: any[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const count = locations.filter(l => {
        const entryDate = new Date(l.created_at);
        return entryDate.getMonth() === date.getMonth() && entryDate.getFullYear() === date.getFullYear();
      }).length;

      last6Months.push({ month: monthYear, count });
    }

    return last6Months;
  };

  const fetchMapLocations = async () => {
    try {
      const allLocations: MapLocation[] = [];

      // Helper function to parse coordinates from location string
      const parseCoordinates = (locationStr: string): { lat: number; lng: number } | null => {
        if (!locationStr) return null;
        
        // Try to parse comma-separated coordinates like "30.1703971, 71.4662297"
        const parts = locationStr.split(',').map(p => p.trim());
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          
          // Validate coordinates are numbers and in valid ranges
          if (!isNaN(lat) && !isNaN(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }
        return null;
      };

      // Fetch from locations table (surveys) - this should be the primary source
      console.log("Fetching locations from locations table...");
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select(`
          id,
          location,
          type,
          creature,
          created_at,
          image_url,
          user_profile:user_id (
            name_of_official
          )
        `);

      console.log("Locations data:", locationsData);
      console.log("Locations error:", locationsError);

      if (locationsError) {
        console.error("Error fetching locations:", locationsError);
        toast.error("Error loading survey locations: " + locationsError.message);
      } else if (locationsData) {
        console.log(`Found ${locationsData.length} location entries`);
        let validCount = 0;
        let invalidCount = 0;
        
        // Process locations with image URLs
        for (const item of locationsData) {
          const coords = parseCoordinates(item.location);
          
          if (coords) {
            validCount++;
            
            // Generate signed URL for image if it exists
            let imageUrl = null;
            if (item.image_url) {
              let fileName = item.image_url;

              // If it's a full URL, extract the filename
              if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
                const urlParts = item.image_url.split('/');
                const sightingsIndex = urlParts.indexOf('sightings');
                if (sightingsIndex !== -1 && urlParts.length > sightingsIndex + 1) {
                  fileName = urlParts.slice(sightingsIndex + 1).join('/');
                } else {
                  fileName = urlParts[urlParts.length - 1];
                }
              } else {
                fileName = item.image_url.split('/').pop() || item.image_url;
              }

              // Generate signed URL (valid for 1 hour)
              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('sightings')
                .createSignedUrl(fileName, 3600);

              if (signedUrlError) {
                console.error('Error creating signed URL:', signedUrlError);
              } else if (signedUrlData) {
                imageUrl = signedUrlData.signedUrl;
              }
            }
            
            allLocations.push({
              id: `location-${item.id}`,
              latitude: coords.lat,
              longitude: coords.lng,
              location: item.location,
              type: item.type || 'Survey',
              creature: item.creature,
              observer_name: item.user_profile?.name_of_official || 'Unknown',
              created_at: item.created_at,
              image_url: imageUrl,
            });
          } else {
            invalidCount++;
            console.log("Skipping location - could not parse coordinates:", {
              id: item.id,
              location: item.location
            });
          }
        }
        
        console.log(`Valid locations with coordinates: ${validCount}, Invalid: ${invalidCount}`);
      }

      // Fetch habitat assessments with coordinates
      const { data: habitatData, error: habitatError } = await supabase
        .from('habitat_assessments')
        .select(`
          id,
          latitude,
          longitude,
          location,
          habitat_type,
          created_at,
          user_profile:user_id (
            name_of_official
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!habitatError && habitatData) {
        habitatData.forEach((item: any) => {
          if (item.latitude && item.longitude) {
            allLocations.push({
              id: `habitat-${item.id}`,
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
              location: item.location,
              type: 'Habitat Assessment',
              creature: item.habitat_type,
              observer_name: item.user_profile?.name_of_official || 'Unknown',
              created_at: item.created_at,
            });
          }
        });
      }

      // Fetch threat documentations with coordinates
      const { data: threatData, error: threatError } = await supabase
        .from('threat_documentations')
        .select(`
          id,
          latitude,
          longitude,
          location,
          created_at,
          user_profile:user_id (
            name_of_official
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!threatError && threatData) {
        threatData.forEach((item: any) => {
          if (item.latitude && item.longitude) {
            allLocations.push({
              id: `threat-${item.id}`,
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
              location: item.location,
              type: 'Threat Documentation',
              observer_name: item.user_profile?.name_of_official || 'Unknown',
              created_at: item.created_at,
            });
          }
        });
      }

      // Fetch conservation interactions with coordinates
      const { data: conservationData, error: conservationError } = await supabase
        .from('conservation_community_interactions')
        .select(`
          id,
          latitude,
          longitude,
          location,
          created_at,
          user_profile:user_id (
            name_of_official
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!conservationError && conservationData) {
        conservationData.forEach((item: any) => {
          if (item.latitude && item.longitude) {
            allLocations.push({
              id: `conservation-${item.id}`,
              latitude: parseFloat(item.latitude),
              longitude: parseFloat(item.longitude),
              location: item.location,
              type: 'Conservation Interaction',
              observer_name: item.user_profile?.name_of_official || 'Unknown',
              created_at: item.created_at,
            });
          }
        });
      }

      console.log(`Total locations to display on map: ${allLocations.length}`);
      setMapLocations(allLocations);
    } catch (error: any) {
      console.error("Error fetching map locations:", error);
      toast.error("Failed to load map locations: " + error.message);
    }
  };

  // Filter map locations by date and species
  const filteredMapLocations = mapLocations.filter((location) => {
    const locationDate = new Date(location.created_at);
    const matchesDateFrom = !dateFrom || locationDate >= dateFrom;
    const matchesDateTo = !dateTo || locationDate <= new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);
    
    // Species filter - if no species selected, show all
    const matchesSpecies = selectedSpecies.length === 0 || 
      selectedSpecies.includes(location.creature || '') || 
      selectedSpecies.includes(location.type);
    
    return matchesDateFrom && matchesDateTo && matchesSpecies;
  });

  // Get unique species/types for filter
  const availableSpecies = Array.from(
    new Set(
      mapLocations.map(loc => loc.creature || loc.type).filter(Boolean)
    )
  ).sort();

  const toggleSpecies = (species: string) => {
    setSelectedSpecies(prev => 
      prev.includes(species) 
        ? prev.filter(s => s !== species)
        : [...prev, species]
    );
  };

  const statCards = [
    {
      title: "Total Survey Entries",
      value: stats.totalSurveyEntries,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Great Indian Bustard",
      value: stats.gibEntries,
      icon: Bird,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      isImage: true,
      imageSrc: birdLogo,
    },
    {
      title: "Blackbuck Surveys",
      value: stats.blackbuckEntries,
      icon: TrendingUp,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      isImage: true,
      imageSrc: animalLogo,
    },
    {
      title: "Active Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  const moduleCards = [
    {
      title: "Habitat Assessments",
      value: stats.habitatAssessments,
      icon: Trees,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Threat Documentations",
      value: stats.threatDocumentations,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Conservation Interactions",
      value: stats.conservationInteractions,
      icon: UsersRound,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Other Species",
      value: stats.otherEntries,
      icon: Bird,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Wildlife survey data and system statistics
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                {stat.isImage ? (
                  <img src={stat.imageSrc} alt={stat.title} className="w-5 h-5 object-contain" />
                ) : (
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {moduleCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Width Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Survey Locations Map
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredMapLocations.length} of {mapLocations.length} locations
              </p>
            </div>
          </div>
          
          {/* Date Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[1000]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[1000]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  disabled={(date) => dateFrom ? date < dateFrom : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo || selectedSpecies.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setSelectedSpecies([]);
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Species Filter */}
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Filter by Species/Type:</p>
            <div className="flex flex-wrap gap-2">
              {availableSpecies.map((species) => (
                <Badge
                  key={species}
                  variant={selectedSpecies.includes(species) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => toggleSpecies(species)}
                >
                  {species}
                  {selectedSpecies.includes(species) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative z-0">
            <SurveyMap 
              locations={filteredMapLocations} 
              height="600px" 
              birdIcon={birdLogo}
              animalIcon={animalLogo}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center p-1">
                <img src={birdLogo} alt="Bird" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs">Great Indian Bustard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full border-2 border-green-500 flex items-center justify-center p-1">
                <img src={animalLogo} alt="Animal" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs">Blackbuck</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span className="text-xs">Other Species</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution by Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(stats.usersByRole)
            .sort(([roleA], [roleB]) => roleA.localeCompare(roleB))
            .map(([role, count]) => {
              const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                farmer: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
                staff: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
                ranger: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
                officer: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
                admin: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
              };

              const colors = roleColors[role.toLowerCase()] || { 
                bg: 'bg-gray-50', 
                border: 'border-gray-200', 
                text: 'text-gray-700' 
              };

              return (
                <div 
                  key={role} 
                  className={`flex justify-between items-center p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <span className="text-sm font-medium capitalize">{role}</span>
                  <span className={`text-lg font-bold ${colors.text}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          {Object.keys(stats.usersByRole).length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Survey Entries</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalSurveyEntries}
              </p>
              <p className="text-xs text-muted-foreground">
                GIB: {stats.gibEntries} | Blackbuck: {stats.blackbuckEntries} | Other: {stats.otherEntries}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Conservation Data</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.habitatAssessments + stats.threatDocumentations + stats.conservationInteractions}
              </p>
              <p className="text-xs text-muted-foreground">
                Habitat: {stats.habitatAssessments} | Threats: {stats.threatDocumentations} | Community: {stats.conservationInteractions}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-lg font-semibold text-foreground">
                {stats.lastUpdated}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Users: {stats.totalUsers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
