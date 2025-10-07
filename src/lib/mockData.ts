// Mock data for the admin dashboard

export interface SurveyEntry {
  id: string;
  species: "Great Indian Bustard" | "Blackbuck";
  date: string;
  time: string;
  observerName: string;
  observerType: "Farmer" | "Staff";
  gpsLat: number;
  gpsLng: number;
  individualsCount: number;
  behavior: string;
  habitatType?: string;
  threats?: string;
  conservation?: string;
  mediaUrl?: string;
  range: string;
  division: string;
  beat: string;
  notes: string;
}

export interface User {
  id: string;
  name: string;
  role: "Admin" | "Staff" | "Farmer";
  email: string;
  employeeId?: string;
  range?: string;
  division?: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export const mockSurveyEntries: SurveyEntry[] = [
  {
    id: "GIB-001",
    species: "Great Indian Bustard",
    date: "2025-10-05",
    time: "06:30",
    observerName: "Ramesh Kumar",
    observerType: "Farmer",
    gpsLat: 26.9124,
    gpsLng: 75.7873,
    individualsCount: 3,
    behavior: "Foraging in grassland",
    range: "Jaisalmer",
    division: "Desert National Park",
    beat: "Beat 3A",
    notes: "Early morning sighting, birds appeared healthy",
    mediaUrl: "/placeholder.svg",
  },
  {
    id: "GIB-002",
    species: "Great Indian Bustard",
    date: "2025-10-04",
    time: "07:15",
    observerName: "Dr. Priya Sharma",
    observerType: "Staff",
    gpsLat: 26.8890,
    gpsLng: 75.8012,
    individualsCount: 2,
    behavior: "Walking slowly in open terrain",
    habitatType: "Grassland with sparse vegetation",
    threats: "Agricultural expansion nearby",
    conservation: "Local community awareness program conducted",
    range: "Jaisalmer",
    division: "Desert National Park",
    beat: "Beat 2B",
    notes: "Male and female pair observed",
    mediaUrl: "/placeholder.svg",
  },
  {
    id: "BB-001",
    species: "Blackbuck",
    date: "2025-10-06",
    time: "17:45",
    observerName: "Suresh Patel",
    observerType: "Farmer",
    gpsLat: 22.7196,
    gpsLng: 75.8577,
    individualsCount: 15,
    behavior: "Herd grazing peacefully",
    range: "Indore",
    division: "Velavadar",
    beat: "Beat 1C",
    notes: "Large herd with multiple males displaying territorial behavior",
    mediaUrl: "/placeholder.svg",
  },
  {
    id: "BB-002",
    species: "Blackbuck",
    date: "2025-10-03",
    time: "16:20",
    observerName: "Anjali Verma",
    observerType: "Staff",
    gpsLat: 22.7050,
    gpsLng: 75.8450,
    individualsCount: 8,
    behavior: "Resting under trees",
    habitatType: "Open grassland with scattered trees",
    threats: "Feral dogs spotted in vicinity",
    conservation: "Installed water point for wildlife",
    range: "Indore",
    division: "Velavadar",
    beat: "Beat 1A",
    notes: "Juveniles present in the group",
    mediaUrl: "/placeholder.svg",
  },
  {
    id: "GIB-003",
    species: "Great Indian Bustard",
    date: "2025-10-02",
    time: "06:00",
    observerName: "Vikram Singh",
    observerType: "Staff",
    gpsLat: 26.9200,
    gpsLng: 75.7700,
    individualsCount: 1,
    behavior: "Solo male displaying",
    habitatType: "Flat grassland",
    threats: "Power lines in area",
    conservation: "Requested power line markers installation",
    range: "Jaisalmer",
    division: "Desert National Park",
    beat: "Beat 4D",
    notes: "Bird appeared to be calling",
    mediaUrl: "/placeholder.svg",
  },
];

export const mockUsers: User[] = [
  {
    id: "USR-001",
    name: "Admin User",
    role: "Admin",
    email: "admin@wildlife.gov.in",
    employeeId: "WL-ADM-001",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "USR-002",
    name: "Dr. Priya Sharma",
    role: "Staff",
    email: "priya.sharma@wildlife.gov.in",
    employeeId: "WL-STF-042",
    range: "Jaisalmer",
    division: "Desert National Park",
    status: "Active",
    createdAt: "2024-03-20",
  },
  {
    id: "USR-003",
    name: "Ramesh Kumar",
    role: "Farmer",
    email: "ramesh.k@gmail.com",
    range: "Jaisalmer",
    status: "Active",
    createdAt: "2024-06-10",
  },
  {
    id: "USR-004",
    name: "Anjali Verma",
    role: "Staff",
    email: "anjali.v@wildlife.gov.in",
    employeeId: "WL-STF-038",
    range: "Indore",
    division: "Velavadar",
    status: "Active",
    createdAt: "2024-02-28",
  },
  {
    id: "USR-005",
    name: "Suresh Patel",
    role: "Farmer",
    email: "suresh.patel@gmail.com",
    range: "Indore",
    status: "Active",
    createdAt: "2024-07-15",
  },
  {
    id: "USR-006",
    name: "Vikram Singh",
    role: "Staff",
    email: "vikram.s@wildlife.gov.in",
    employeeId: "WL-STF-055",
    range: "Jaisalmer",
    division: "Desert National Park",
    status: "Inactive",
    createdAt: "2024-05-01",
  },
];

export const dashboardStats = {
  totalEntries: 245,
  gibEntries: 89,
  blackbuckEntries: 156,
  totalUsers: 47,
  activeStaff: 18,
  activeFarmers: 28,
  lastUpdated: "2025-10-06 17:45",
  entriesByMonth: [
    { month: "Apr", count: 32 },
    { month: "May", count: 45 },
    { month: "Jun", count: 38 },
    { month: "Jul", count: 42 },
    { month: "Aug", count: 35 },
    { month: "Sep", count: 31 },
    { month: "Oct", count: 22 },
  ],
};
