import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bird, Users, FileText, TrendingUp, Calendar, Trees, AlertTriangle, UsersRound } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import birdLogo from "@/images/bird.png";
import animalLogo from "@/images/animal.png";

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

  useEffect(() => {
    fetchDashboardStats();
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
      const gibCount = (locations || []).filter(l => l.creature === 'Great Indian Bustard').length;
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Monthly Survey Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.entriesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
      </div>

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
