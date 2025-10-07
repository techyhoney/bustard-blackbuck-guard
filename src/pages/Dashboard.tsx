import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bird, Users, FileText, TrendingUp, Calendar } from "lucide-react";
import { dashboardStats } from "@/lib/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Survey Entries",
      value: dashboardStats.totalEntries,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Great Indian Bustard",
      value: dashboardStats.gibEntries,
      icon: Bird,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Blackbuck Surveys",
      value: dashboardStats.blackbuckEntries,
      icon: TrendingUp,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Active Users",
      value: dashboardStats.totalUsers,
      icon: Users,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Wildlife survey data and system statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
              Monthly Survey Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardStats.entriesByMonth}>
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
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Active Staff Members</span>
              <span className="text-lg font-bold text-primary">
                {dashboardStats.activeStaff}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Active Farmers</span>
              <span className="text-lg font-bold text-secondary">
                {dashboardStats.activeFarmers}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {dashboardStats.lastUpdated}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Entries (GIB)</p>
              <p className="text-2xl font-bold text-foreground">
                {dashboardStats.gibEntries}
              </p>
              <p className="text-xs text-success">Great Indian Bustard surveys</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Entries (Blackbuck)</p>
              <p className="text-2xl font-bold text-foreground">
                {dashboardStats.blackbuckEntries}
              </p>
              <p className="text-xs text-warning">Blackbuck population surveys</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">User Accounts</p>
              <p className="text-2xl font-bold text-foreground">
                {dashboardStats.totalUsers}
              </p>
              <p className="text-xs text-info">
                Staff: {dashboardStats.activeStaff} | Farmers: {dashboardStats.activeFarmers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
