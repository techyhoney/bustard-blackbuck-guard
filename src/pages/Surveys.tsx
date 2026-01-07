import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Search, Eye, Edit, Trash2, MapPin, Calendar, User, CalendarIcon, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import birdLogo from "@/images/bird.png";
import animalLogo from "@/images/animal.png";
import { format } from "date-fns";

interface SurveyEntry {
  id: number;
  created_at: string;
  location: string;
  observer_name: string;
  role: string;
  type: string;
  number_of_birds_sighted: number | null;
  sex_age: string | null;
  behaviour_observed: string[] | null;
  duration_of_observation: number | null;
  bird_movement_direction: string | null;
  other_behaviour_details: string | null;
  creature: string;
  image_url: string | null;
  patrol_id: string | null;
}

interface PatrolEntry {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  observer_name: string;
  role: string;
  location_count: number;
}

const Surveys = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<SurveyEntry | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surveyEntries, setSurveyEntries] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Patrol states
  const [selectedPatrol, setSelectedPatrol] = useState<PatrolEntry | null>(null);
  const [viewPatrolModalOpen, setViewPatrolModalOpen] = useState(false);
  const [editPatrolModalOpen, setEditPatrolModalOpen] = useState(false);
  const [deletePatrolDialogOpen, setDeletePatrolDialogOpen] = useState(false);
  const [patrolEntries, setPatrolEntries] = useState<PatrolEntry[]>([]);
  const [loadingPatrols, setLoadingPatrols] = useState(true);
  const [patrolLocations, setPatrolLocations] = useState<SurveyEntry[]>([]);
  const [loadingPatrolLocations, setLoadingPatrolLocations] = useState(false);

  // Fetch survey entries from Supabase
  useEffect(() => {
    fetchSurveyEntries();
    fetchPatrolEntries();
  }, []);

  const fetchSurveyEntries = async () => {
    try {
      setLoading(true);
      
      // Fetch locations data with joined user profile information
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select(`
          *,
          user_profile:user_id (
            id,
            name_of_official,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (locationsError) {
        console.error("Locations fetch error:", locationsError);
        toast.error("Failed to fetch survey entries: " + locationsError.message);
        setLoading(false);
        return;
      }


      // Transform the data and generate signed URLs for images
      const transformedData: SurveyEntry[] = await Promise.all(
        (locationsData || []).map(async (location: any) => {
          // The join returns the user profile as an object or null
          const userProfile = location.user_profile;
          
          
          // Generate signed URL for image if it exists
          let imageUrl = null;
          if (location.image_url) {
            let fileName = location.image_url;

            // If it's a full URL, extract the filename from the URL
            if (location.image_url.startsWith('http://') || location.image_url.startsWith('https://')) {
              // Extract filename from URL like: https://.../storage/v1/object/public/sightings/filename.jpg
              const urlParts = location.image_url.split('/');
              const sightingsIndex = urlParts.indexOf('sightings');
              if (sightingsIndex !== -1 && urlParts.length > sightingsIndex + 1) {
                fileName = urlParts.slice(sightingsIndex + 1).join('/');
              } else {
                // Fallback: just get the last part of the URL
                fileName = urlParts[urlParts.length - 1];
              }
            } else {
              // If it's just a path, extract the filename
              fileName = location.image_url.split('/').pop() || location.image_url;
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
          
          return {
            id: location.id,
            created_at: location.created_at,
            location: location.location,
            observer_name: userProfile?.name_of_official || 'Unknown Observer',
            role: userProfile?.role || 'Unknown Role',
            type: location.type || 'Unknown Type',
            number_of_birds_sighted: location.number_of_birds_sighted,
            sex_age: location.sex_age,
            behaviour_observed: location.behaviour_observed,
            duration_of_observation: location.duration_of_observation,
            bird_movement_direction: location.bird_movement_direction,
            other_behaviour_details: location.other_behaviour_details,
            creature: location.creature,
            image_url: imageUrl,
            patrol_id: location.patrol_id,
          };
        })
      );

      setSurveyEntries(transformedData);
    } catch (error: any) {
      toast.error("Failed to fetch survey entries: " + error.message);
      console.error("Error fetching survey entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatrolEntries = async () => {
    try {
      setLoadingPatrols(true);
      
      // Fetch patrols data with joined user profile information
      const { data: patrolsData, error: patrolsError } = await supabase
        .from('patrols')
        .select(`
          *,
          user_profile:user_id (
            id,
            name_of_official,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (patrolsError) {
        console.error("Patrols fetch error:", patrolsError);
        toast.error("Failed to fetch patrol entries: " + patrolsError.message);
        setLoadingPatrols(false);
        return;
      }

      // Transform the data and count associated locations
      const transformedData: PatrolEntry[] = await Promise.all(
        (patrolsData || []).map(async (patrol: any) => {
          const userProfile = patrol.user_profile;
          
          // Count locations associated with this patrol
          const { count } = await supabase
            .from('locations')
            .select('*', { count: 'exact', head: true })
            .eq('patrol_id', patrol.id);
          
          return {
            id: patrol.id,
            user_id: patrol.user_id,
            start_time: patrol.start_time,
            end_time: patrol.end_time,
            status: patrol.status,
            created_at: patrol.created_at,
            updated_at: patrol.updated_at,
            observer_name: userProfile?.name_of_official || 'Unknown Observer',
            role: userProfile?.role || 'Unknown Role',
            location_count: count || 0,
          };
        })
      );

      setPatrolEntries(transformedData);
    } catch (error: any) {
      toast.error("Failed to fetch patrol entries: " + error.message);
      console.error("Error fetching patrol entries:", error);
    } finally {
      setLoadingPatrols(false);
    }
  };

  const fetchPatrolLocations = async (patrolId: string) => {
    try {
      setLoadingPatrolLocations(true);
      
      // Fetch locations associated with this patrol
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select(`
          *,
          user_profile:user_id (
            id,
            name_of_official,
            role
          )
        `)
        .eq('patrol_id', patrolId)
        .order('created_at', { ascending: false });

      if (locationsError) {
        console.error("Patrol locations fetch error:", locationsError);
        toast.error("Failed to fetch patrol locations: " + locationsError.message);
        return;
      }

      // Transform the data and generate signed URLs for images
      const transformedData: SurveyEntry[] = await Promise.all(
        (locationsData || []).map(async (location: any) => {
          const userProfile = location.user_profile;
          
          // Generate signed URL for image if it exists
          let imageUrl = null;
          if (location.image_url) {
            let fileName = location.image_url;

            if (location.image_url.startsWith('http://') || location.image_url.startsWith('https://')) {
              const urlParts = location.image_url.split('/');
              const sightingsIndex = urlParts.indexOf('sightings');
              if (sightingsIndex !== -1 && urlParts.length > sightingsIndex + 1) {
                fileName = urlParts.slice(sightingsIndex + 1).join('/');
              } else {
                fileName = urlParts[urlParts.length - 1];
              }
            } else {
              fileName = location.image_url.split('/').pop() || location.image_url;
            }

            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('sightings')
              .createSignedUrl(fileName, 3600);

            if (signedUrlError) {
              console.error('Error creating signed URL:', signedUrlError);
            } else if (signedUrlData) {
              imageUrl = signedUrlData.signedUrl;
            }
          }
          
          return {
            id: location.id,
            created_at: location.created_at,
            location: location.location,
            observer_name: userProfile?.name_of_official || 'Unknown Observer',
            role: userProfile?.role || 'Unknown Role',
            type: location.type || 'Unknown Type',
            number_of_birds_sighted: location.number_of_birds_sighted,
            sex_age: location.sex_age,
            behaviour_observed: location.behaviour_observed,
            duration_of_observation: location.duration_of_observation,
            bird_movement_direction: location.bird_movement_direction,
            other_behaviour_details: location.other_behaviour_details,
            creature: location.creature,
            image_url: imageUrl,
            patrol_id: location.patrol_id,
          };
        })
      );

      setPatrolLocations(transformedData);
    } catch (error: any) {
      toast.error("Failed to fetch patrol locations: " + error.message);
      console.error("Error fetching patrol locations:", error);
    } finally {
      setLoadingPatrolLocations(false);
    }
  };

  const filteredEntries = surveyEntries.filter((entry) => {
    const matchesSearch =
      entry.observer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.creature && entry.creature.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date filtering
    const entryDate = new Date(entry.created_at);
    const matchesDateFrom = !dateFrom || entryDate >= dateFrom;
    const matchesDateTo = !dateTo || entryDate <= new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Filter entries for tabs - handle both "Bustard" and "Great Indian Bustard"
  const gibEntries = filteredEntries.filter(
    (e) => e.creature === "Great Indian Bustard" || e.creature === "Bustard"
  );
  const blackbuckEntries = filteredEntries.filter(
    (e) => e.creature === "Blackbuck"
  );
  const otherEntries = filteredEntries.filter(
    (e) => e.creature === "Other"
  );

  // Filter patrol entries
  const filteredPatrolEntries = patrolEntries.filter((patrol) => {
    const matchesSearch =
      patrol.observer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patrol.status.toLowerCase().includes(searchTerm.toLowerCase());

    // Date filtering
    const patrolDate = new Date(patrol.start_time);
    const matchesDateFrom = !dateFrom || patrolDate >= dateFrom;
    const matchesDateTo = !dateTo || patrolDate <= new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleView = (entry: SurveyEntry) => {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  };

  const handleEdit = (entry: SurveyEntry) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (entry: SurveyEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return;

    try {
      setDeleting(true);

      // Delete the entry from the database
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', selectedEntry.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete entry: ' + error.message);
        return;
      }

      // Remove from local state
      setSurveyEntries((prev) => prev.filter((e) => e.id !== selectedEntry.id));

      toast.success('Survey entry deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateEntry = async (updatedData: Partial<SurveyEntry>) => {
    if (!selectedEntry) return;

    try {
      // Update the entry in the database
      const { error } = await supabase
        .from('locations')
        .update({
          location: updatedData.location,
          type: updatedData.type,
          number_of_birds_sighted: updatedData.number_of_birds_sighted,
          sex_age: updatedData.sex_age,
          behaviour_observed: updatedData.behaviour_observed,
          duration_of_observation: updatedData.duration_of_observation,
          bird_movement_direction: updatedData.bird_movement_direction,
          other_behaviour_details: updatedData.other_behaviour_details,
        })
        .eq('id', selectedEntry.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update entry: ' + error.message);
        return;
      }

      // Update local state
      setSurveyEntries((prev) =>
        prev.map((entry) =>
          entry.id === selectedEntry.id
            ? { ...entry, ...updatedData }
            : entry
        )
      );

      toast.success('Survey entry updated successfully');
      setEditModalOpen(false);
      setSelectedEntry(null);
      
      // Refresh data to get latest from database
      fetchSurveyEntries();
    } catch (error: any) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry: ' + error.message);
    }
  };

  // Patrol handlers
  const handleViewPatrol = (patrol: PatrolEntry) => {
    setSelectedPatrol(patrol);
    setViewPatrolModalOpen(true);
    fetchPatrolLocations(patrol.id);
  };

  const handleEditPatrol = (patrol: PatrolEntry) => {
    setSelectedPatrol(patrol);
    setEditPatrolModalOpen(true);
  };

  const handleDeletePatrolClick = (patrol: PatrolEntry) => {
    setSelectedPatrol(patrol);
    setDeletePatrolDialogOpen(true);
  };

  const handleDeletePatrolConfirm = async () => {
    if (!selectedPatrol) return;

    try {
      setDeleting(true);

      // Delete the patrol from the database
      const { error } = await supabase
        .from('patrols')
        .delete()
        .eq('id', selectedPatrol.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete patrol: ' + error.message);
        return;
      }

      // Remove from local state
      setPatrolEntries((prev) => prev.filter((p) => p.id !== selectedPatrol.id));

      toast.success('Patrol entry deleted successfully');
      setDeletePatrolDialogOpen(false);
      setSelectedPatrol(null);
    } catch (error: any) {
      console.error('Error deleting patrol:', error);
      toast.error('Failed to delete patrol: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdatePatrol = async (updatedData: Partial<PatrolEntry>) => {
    if (!selectedPatrol) return;

    try {
      // Update the patrol in the database
      const { error } = await supabase
        .from('patrols')
        .update({
          start_time: updatedData.start_time,
          end_time: updatedData.end_time,
          status: updatedData.status,
        })
        .eq('id', selectedPatrol.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update patrol: ' + error.message);
        return;
      }

      // Update local state
      setPatrolEntries((prev) =>
        prev.map((patrol) =>
          patrol.id === selectedPatrol.id
            ? { ...patrol, ...updatedData }
            : patrol
        )
      );

      toast.success('Patrol entry updated successfully');
      setEditPatrolModalOpen(false);
      setSelectedPatrol(null);
      
      // Refresh data to get latest from database
      fetchPatrolEntries();
    } catch (error: any) {
      console.error('Error updating patrol:', error);
      toast.error('Failed to update patrol: ' + error.message);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata', // IST timezone
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'farmer':
        return 'farmer';
      case 'staff':
        return 'staff';
      case 'ranger':
        return 'ranger';
      case 'officer':
        return 'officer';
      case 'admin':
        return 'admin';
      default:
        return 'default';
    }
  };

  const EntryTable = ({ entries, creatureType }: { entries: SurveyEntry[], creatureType?: string }) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading survey entries...</p>
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">No survey entries found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Observer Name</TableHead>
            <TableHead>Role</TableHead>
            {creatureType !== 'Other' && <TableHead>Type</TableHead>}
            {creatureType !== 'Blackbuck' && creatureType !== 'Other' && (
              <>
                <TableHead>Birds Sighted</TableHead>
                <TableHead>Sex/Age</TableHead>
                <TableHead>Behaviour Observed</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead>Movement Direction</TableHead>
                <TableHead>Other Details</TableHead>
              </>
            )}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatDateTime(entry.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {entry.location}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {entry.observer_name}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    entry.role?.toLowerCase() === 'farmer'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : entry.role?.toLowerCase() === 'staff'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : entry.role?.toLowerCase() === 'ranger'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : entry.role?.toLowerCase() === 'officer'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : entry.role?.toLowerCase() === 'admin'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {entry.role}
                </Badge>
              </TableCell>
              {creatureType !== 'Other' && (
                <TableCell>
                  <Badge variant="secondary">{entry.type}</Badge>
                </TableCell>
              )}
              {creatureType !== 'Blackbuck' && creatureType !== 'Other' && (
                <>
                  <TableCell className="text-center">
                    {entry.number_of_birds_sighted ?? '-'}
                  </TableCell>
                  <TableCell>{entry.sex_age || '-'}</TableCell>
                  <TableCell>
                    {entry.behaviour_observed && entry.behaviour_observed.length > 0
                      ? entry.behaviour_observed.join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.duration_of_observation ?? '-'}
                  </TableCell>
                  <TableCell>{entry.bird_movement_direction || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.other_behaviour_details || '-'}
                  </TableCell>
                </>
              )}
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleView(entry)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteClick(entry)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Survey Entries</h2>
        <p className="text-muted-foreground">
          View and manage all wildlife survey submissions
        </p>
      </div>

      {/* Search and Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or creature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(date) => dateFrom ? date < dateFrom : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="gib" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gib" className="flex items-center gap-2">
            <img src={birdLogo} alt="Bird" className="w-5 h-5 object-contain" />
            Great Indian Bustard ({gibEntries.length})
          </TabsTrigger>
          <TabsTrigger value="blackbuck" className="flex items-center gap-2">
            <img src={animalLogo} alt="Animal" className="w-5 h-5 object-contain" />
            Blackbuck ({blackbuckEntries.length})
          </TabsTrigger>
          <TabsTrigger value="others" className="flex items-center gap-2">
            Others ({otherEntries.length})
          </TabsTrigger>
          <TabsTrigger value="patrols" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Patrols ({filteredPatrolEntries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gib">
          <Card>
            <CardContent className="pt-6">
              <EntryTable entries={gibEntries} creatureType="Great Indian Bustard" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blackbuck">
          <Card>
            <CardContent className="pt-6">
              <EntryTable entries={blackbuckEntries} creatureType="Blackbuck" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="others">
          <Card>
            <CardContent className="pt-6">
              <EntryTable entries={otherEntries} creatureType="Other" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patrols">
          <Card>
            <CardContent className="pt-6">
              <PatrolTable 
                patrols={filteredPatrolEntries} 
                loading={loadingPatrols}
                onView={handleViewPatrol}
                onEdit={handleEditPatrol}
                onDelete={handleDeletePatrolClick}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Entry Details</DialogTitle>
            <DialogDescription>
              Entry #{selectedEntry?.id} - {selectedEntry?.creature}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {formatDateTime(selectedEntry.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observer</p>
                  <p className="font-medium">{selectedEntry.observer_name}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      selectedEntry.role?.toLowerCase() === 'farmer'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : selectedEntry.role?.toLowerCase() === 'staff'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : selectedEntry.role?.toLowerCase() === 'ranger'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : selectedEntry.role?.toLowerCase() === 'officer'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : selectedEntry.role?.toLowerCase() === 'admin'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {selectedEntry.role}
                  </Badge>
                </div>
                {selectedEntry.creature !== 'Other' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="secondary" className="mt-1">
                      {selectedEntry.type}
                    </Badge>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedEntry.location}</p>
                </div>
              </div>

              {/* Show image for all creatures */}
              {selectedEntry.image_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Image</p>
                  <div className="relative">
                    <img
                      src={selectedEntry.image_url}
                      alt="Survey observation"
                      className="w-full h-64 object-cover rounded-lg border"
                      onError={(e) => {
                        console.error('❌ Image failed to load:', selectedEntry.image_url);
                        console.error('Error details:', e);
                        e.currentTarget.src = '/placeholder.svg';
                        e.currentTarget.className = 'w-full h-64 object-contain rounded-lg border bg-gray-100';
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedEntry.creature !== 'Blackbuck' && selectedEntry.creature !== 'Other' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Birds Sighted</p>
                      <p className="font-medium text-2xl">
                        {selectedEntry.number_of_birds_sighted ?? 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Sex/Age</p>
                    <p className="font-medium">{selectedEntry.sex_age || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Behaviour Observed</p>
                    <p className="font-medium">
                      {selectedEntry.behaviour_observed && selectedEntry.behaviour_observed.length > 0
                        ? selectedEntry.behaviour_observed.join(', ')
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration of Observation</p>
                      <p className="font-medium">
                        {selectedEntry.duration_of_observation
                          ? `${selectedEntry.duration_of_observation} minutes`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Movement Direction</p>
                      <p className="font-medium">
                        {selectedEntry.bird_movement_direction || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedEntry.other_behaviour_details && (
                    <div>
                      <p className="text-sm text-muted-foreground">Other Behaviour Details</p>
                      <p className="font-medium">{selectedEntry.other_behaviour_details}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Survey Entry</DialogTitle>
            <DialogDescription>
              Entry #{selectedEntry?.id} - {selectedEntry?.creature}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && <EditForm entry={selectedEntry} onSave={handleUpdateEntry} onCancel={() => setEditModalOpen(false)} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Survey Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this survey entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEntry && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Entry #:</span> {selectedEntry.id}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Creature:</span> {selectedEntry.creature}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Location:</span> {selectedEntry.location}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Observer:</span> {selectedEntry.observer_name}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Entry'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patrol View Modal */}
      <Dialog open={viewPatrolModalOpen} onOpenChange={setViewPatrolModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patrol Details</DialogTitle>
            <DialogDescription>
              Patrol #{selectedPatrol?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPatrol && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="font-medium">
                    {formatDateTime(selectedPatrol.start_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="font-medium">
                    {selectedPatrol.end_time ? formatDateTime(selectedPatrol.end_time) : 'Ongoing'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observer</p>
                  <p className="font-medium">{selectedPatrol.observer_name}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      selectedPatrol.role?.toLowerCase() === 'farmer'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : selectedPatrol.role?.toLowerCase() === 'staff'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : selectedPatrol.role?.toLowerCase() === 'ranger'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : selectedPatrol.role?.toLowerCase() === 'officer'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : selectedPatrol.role?.toLowerCase() === 'admin'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {selectedPatrol.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant={selectedPatrol.status === 'active' ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {selectedPatrol.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location Entries</p>
                  <p className="font-medium text-2xl">
                    {selectedPatrol.location_count}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">
                    {formatDateTime(selectedPatrol.created_at)}
                  </p>
                </div>
              </div>

              {/* Patrol Locations Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Survey Locations ({patrolLocations.length})</h3>
                {loadingPatrolLocations ? (
                  <p className="text-muted-foreground text-center py-4">Loading locations...</p>
                ) : patrolLocations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No locations recorded for this patrol</p>
                ) : (
                  <div className="space-y-4">
                    {patrolLocations.map((location) => (
                      <Card key={location.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-muted-foreground">Species</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-medium">
                                    {location.creature}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="font-medium text-sm">{location.location}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Type</p>
                                <p className="font-medium text-sm">{location.type}</p>
                              </div>
                              {location.number_of_birds_sighted && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Number Sighted</p>
                                  <p className="font-medium text-sm">{location.number_of_birds_sighted}</p>
                                </div>
                              )}
                              {location.behaviour_observed && location.behaviour_observed.length > 0 && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Behaviour</p>
                                  <p className="font-medium text-sm">{location.behaviour_observed.join(', ')}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-muted-foreground">Recorded At</p>
                                <p className="font-medium text-sm">{formatDateTime(location.created_at)}</p>
                              </div>
                            </div>
                            
                            {/* Show image if available */}
                            {location.image_url && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Image</p>
                                <img
                                  src={location.image_url}
                                  alt={location.creature}
                                  className="w-full h-48 object-cover rounded-lg border"
                                  onError={(e) => {
                                    console.error('❌ Image failed to load:', location.image_url);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Patrol Edit Modal */}
      <Dialog open={editPatrolModalOpen} onOpenChange={setEditPatrolModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patrol</DialogTitle>
            <DialogDescription>
              Patrol #{selectedPatrol?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPatrol && <EditPatrolForm patrol={selectedPatrol} onSave={handleUpdatePatrol} onCancel={() => setEditPatrolModalOpen(false)} />}
        </DialogContent>
      </Dialog>

      {/* Patrol Delete Confirmation Dialog */}
      <Dialog open={deletePatrolDialogOpen} onOpenChange={setDeletePatrolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patrol Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this patrol entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPatrol && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Patrol #:</span> {selectedPatrol.id}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Observer:</span> {selectedPatrol.observer_name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Status:</span> {selectedPatrol.status}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Start Time:</span> {formatDateTime(selectedPatrol.start_time)}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletePatrolDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePatrolConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Patrol'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Edit Form Component
const EditForm = ({ 
  entry, 
  onSave, 
  onCancel 
}: { 
  entry: SurveyEntry; 
  onSave: (data: Partial<SurveyEntry>) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    location: entry.location,
    type: entry.type,
    number_of_birds_sighted: entry.number_of_birds_sighted || null,
    sex_age: entry.sex_age || '',
    behaviour_observed: entry.behaviour_observed || [],
    duration_of_observation: entry.duration_of_observation || 0,
    bird_movement_direction: entry.bird_movement_direction || '',
    other_behaviour_details: entry.other_behaviour_details || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleBehaviour = (behaviour: string) => {
    const current = formData.behaviour_observed || [];
    if (current.includes(behaviour)) {
      setFormData({ ...formData, behaviour_observed: current.filter(b => b !== behaviour) });
    } else {
      setFormData({ ...formData, behaviour_observed: [...current, behaviour] });
    }
  };

  // Type options based on creature
  const typeOptions = entry.creature === 'Blackbuck' || entry.creature === 'Other'
    ? ['Direct sighting', 'Indirect sighting']
    : ['Direct sighting', 'Eggs', 'Footprints'];

  const behaviourOptions = [
    'Feeding',
    'Walking/Running',
    'Flying',
    'Courtship display',
    'Nesting',
    'Chick sighted',
    'Resting',
    'Incubating',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Location</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {entry.creature !== 'Blackbuck' && entry.creature !== 'Other' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Birds Sighted</label>
              <Select 
                value={formData.number_of_birds_sighted?.toString() || ''} 
                onValueChange={(value) => setFormData({ ...formData, number_of_birds_sighted: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">More than 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Sex/Age</label>
              <Select 
                value={formData.sex_age} 
                onValueChange={(value) => setFormData({ ...formData, sex_age: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex/age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adult Male">Adult Male</SelectItem>
                  <SelectItem value="Adult Female">Adult Female</SelectItem>
                  <SelectItem value="Juvenile">Juvenile</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Behaviour Observed</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {behaviourOptions.map((behaviour) => (
                <div key={behaviour} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`behaviour-${behaviour}`}
                    checked={formData.behaviour_observed?.includes(behaviour) || false}
                    onChange={() => toggleBehaviour(behaviour)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor={`behaviour-${behaviour}`} className="text-sm">
                    {behaviour}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={formData.duration_of_observation}
                onChange={(e) => setFormData({ ...formData, duration_of_observation: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bird Movement Direction</label>
              <Select 
                value={formData.bird_movement_direction} 
                onValueChange={(value) => setFormData({ ...formData, bird_movement_direction: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">N (North)</SelectItem>
                  <SelectItem value="NE">NE (Northeast)</SelectItem>
                  <SelectItem value="E">E (East)</SelectItem>
                  <SelectItem value="SE">SE (Southeast)</SelectItem>
                  <SelectItem value="S">S (South)</SelectItem>
                  <SelectItem value="SW">SW (Southwest)</SelectItem>
                  <SelectItem value="W">W (West)</SelectItem>
                  <SelectItem value="NW">NW (Northwest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Other Behaviour Details</label>
            <Input
              value={formData.other_behaviour_details}
              onChange={(e) => setFormData({ ...formData, other_behaviour_details: e.target.value })}
              placeholder="Additional observations..."
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

// Patrol Table Component
const PatrolTable = ({ 
  patrols, 
  loading,
  onView,
  onEdit,
  onDelete
}: { 
  patrols: PatrolEntry[]; 
  loading: boolean;
  onView: (patrol: PatrolEntry) => void;
  onEdit: (patrol: PatrolEntry) => void;
  onDelete: (patrol: PatrolEntry) => void;
}) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata', // IST timezone
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-muted-foreground">Loading patrol entries...</p>
      </div>
    );
  }

  if (patrols.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-muted-foreground">No patrol entries found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Observer Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location Count</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patrols.map((patrol) => (
          <TableRow key={patrol.id}>
            <TableCell>
              <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {formatDateTime(patrol.start_time)}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                {patrol.end_time ? (
                  <>
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {formatDateTime(patrol.end_time)}
                  </>
                ) : (
                  <Badge variant="outline">Ongoing</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-muted-foreground" />
                {patrol.observer_name}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`${
                  patrol.role?.toLowerCase() === 'farmer'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : patrol.role?.toLowerCase() === 'staff'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : patrol.role?.toLowerCase() === 'ranger'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : patrol.role?.toLowerCase() === 'officer'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : patrol.role?.toLowerCase() === 'admin'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {patrol.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge 
                variant={patrol.status === 'active' ? 'default' : 'secondary'}
              >
                {patrol.status}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline">{patrol.location_count}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onView(patrol)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(patrol)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(patrol)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Edit Patrol Form Component
const EditPatrolForm = ({ 
  patrol, 
  onSave, 
  onCancel 
}: { 
  patrol: PatrolEntry; 
  onSave: (data: Partial<PatrolEntry>) => void; 
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    start_time: patrol.start_time,
    end_time: patrol.end_time || '',
    status: patrol.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      end_time: formData.end_time || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium">Start Time</label>
          <Input
            type="datetime-local"
            value={formData.start_time ? new Date(formData.start_time).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, start_time: new Date(e.target.value).toISOString() })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Time</label>
          <Input
            type="datetime-local"
            value={formData.end_time ? new Date(formData.end_time).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value ? new Date(e.target.value).toISOString() : '' })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default Surveys;
