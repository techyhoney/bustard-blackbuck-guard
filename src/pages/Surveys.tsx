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
import { Search, Eye, Edit, Trash2, MapPin, Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
}

const Surveys = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");
  const [selectedObserverType, setSelectedObserverType] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<SurveyEntry | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [surveyEntries, setSurveyEntries] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch survey entries from Supabase
  useEffect(() => {
    fetchSurveyEntries();
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

  const filteredEntries = surveyEntries.filter((entry) => {
    const matchesSearch =
      entry.observer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.creature && entry.creature.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Match species - handle both "Bustard" and "Great Indian Bustard"
    const matchesSpecies =
      selectedSpecies === "all" || 
      entry.creature === selectedSpecies ||
      (selectedSpecies === "Great Indian Bustard" && (entry.creature === "Bustard" || entry.creature === "Great Indian Bustard"));
    
    const matchesType =
      selectedObserverType === "all" || 
      entry.role?.toLowerCase() === selectedObserverType.toLowerCase();
    
    return matchesSearch && matchesSpecies && matchesType;
  });

  // Filter entries for tabs - handle both "Bustard" and "Great Indian Bustard"
  const gibEntries = filteredEntries.filter(
    (e) => e.creature === "Great Indian Bustard" || e.creature === "Bustard"
  );
  const blackbuckEntries = filteredEntries.filter(
    (e) => e.creature === "Blackbuck"
  );

  const handleView = (entry: SurveyEntry) => {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  };

  const handleEdit = (entry: SurveyEntry) => {
    toast.info(`Edit functionality for ${entry.id} - UI Demo`);
  };

  const handleDelete = (entry: SurveyEntry) => {
    toast.error(`Delete ${entry.id}? - UI Demo`);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            <TableHead>Type</TableHead>
            {creatureType !== 'Blackbuck' && (
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
              <TableCell>
                <Badge variant="secondary">{entry.type}</Badge>
              </TableCell>
              {creatureType !== 'Blackbuck' && (
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
                    onClick={() => handleDelete(entry)}
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger>
                <SelectValue placeholder="All Species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                <SelectItem value="Great Indian Bustard">
                  Great Indian Bustard
                </SelectItem>
                <SelectItem value="Bustard">Bustard</SelectItem>
                <SelectItem value="Blackbuck">Blackbuck</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedObserverType}
              onValueChange={setSelectedObserverType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Observer Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="ranger">Ranger</SelectItem>
                <SelectItem value="officer">Officer</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="gib" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gib">
            Great Indian Bustard ({gibEntries.length})
          </TabsTrigger>
          <TabsTrigger value="blackbuck">
            Blackbuck ({blackbuckEntries.length})
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
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="secondary" className="mt-1">
                    {selectedEntry.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedEntry.location}</p>
                </div>
              </div>

              {/* Show image for both GIB and Blackbuck */}
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

              {selectedEntry.creature !== 'Blackbuck' && (
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
    </div>
  );
};

export default Surveys;
