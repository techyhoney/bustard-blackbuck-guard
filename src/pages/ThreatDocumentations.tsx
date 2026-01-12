import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { formatToIST } from "@/lib/utils";

interface ThreatDocumentation {
  id: string;
  created_at: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  immediate_threats: string[] | null;
  image_url: string | null;
  additional_notes: string | null;
  observer_name: string;
  role: string;
}

const ThreatDocumentations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThreat, setSelectedThreat] = useState<ThreatDocumentation | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threats, setThreats] = useState<ThreatDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchThreats();
  }, []);

  const fetchThreats = async () => {
    try {
      setLoading(true);

      // Fetch threat documentations
      const { data: threatsData, error: threatsError } = await supabase
        .from('threat_documentations')
        .select('*')
        .order('created_at', { ascending: false });

      if (threatsError) {
        console.error("Threats fetch error:", threatsError);
        toast.error("Failed to fetch threat documentations: " + threatsError.message);
        setLoading(false);
        return;
      }

      // Fetch user profiles separately
      const userIds = [...new Set((threatsData || []).map((t: any) => t.user_id))];
      const { data: userProfiles } = await supabase
        .from('user_profile')
        .select('id, name_of_official, role')
        .in('id', userIds);

      // Create a map of user profiles
      const userProfileMap = new Map(
        (userProfiles || []).map((profile: any) => [profile.id, profile])
      );

      // Transform the data
      const transformedData: ThreatDocumentation[] = await Promise.all(
        (threatsData || []).map(async (threat: any) => {
          const userProfile = userProfileMap.get(threat.user_id);

          // Ensure immediate_threats is properly parsed as array
          let threatsArray = threat.immediate_threats;
          if (typeof threatsArray === 'string') {
            try {
              threatsArray = JSON.parse(threatsArray);
            } catch (e) {
              threatsArray = null;
            }
          }

          // Generate signed URL for image if it exists
          let signedImageUrl = null;
          if (threat.image_url) {
            let fileName = threat.image_url;

            if (threat.image_url.startsWith('http://') || threat.image_url.startsWith('https://')) {
              const urlParts = threat.image_url.split('/');
              const threatDocIndex = urlParts.indexOf('threat-documentation');
              if (threatDocIndex !== -1 && urlParts.length > threatDocIndex + 1) {
                fileName = urlParts.slice(threatDocIndex + 1).join('/');
              } else {
                fileName = urlParts[urlParts.length - 1];
              }
            } else {
              fileName = threat.image_url.split('/').pop() || threat.image_url;
            }

            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('threat-documentation')
              .createSignedUrl(fileName, 3600);

            if (signedUrlError) {
              console.error('Error creating signed URL:', signedUrlError);
            } else if (signedUrlData) {
              signedImageUrl = signedUrlData.signedUrl;
            }
          }

          return {
            id: threat.id,
            created_at: threat.created_at,
            location: threat.location,
            latitude: threat.latitude,
            longitude: threat.longitude,
            immediate_threats: threatsArray,
            image_url: signedImageUrl,
            additional_notes: threat.additional_notes,
            observer_name: userProfile?.name_of_official || 'Unknown Observer',
            role: userProfile?.role || 'Unknown Role',
          };
        })
      );

      setThreats(transformedData);
    } catch (error: any) {
      toast.error("Failed to fetch threat documentations: " + error.message);
      console.error("Error fetching threats:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreats = threats.filter((threat) => {
    const matchesSearch =
      threat.observer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (threat.immediate_threats && threat.immediate_threats.some(t => 
        t.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    // Date filtering
    const threatDate = new Date(threat.created_at);
    const matchesDateFrom = !dateFrom || threatDate >= dateFrom;
    const matchesDateTo = !dateTo || threatDate <= new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleView = (threat: ThreatDocumentation) => {
    setSelectedThreat(threat);
    setViewModalOpen(true);
  };

  const handleEdit = (threat: ThreatDocumentation) => {
    setSelectedThreat(threat);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (threat: ThreatDocumentation) => {
    setSelectedThreat(threat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedThreat) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('threat_documentations')
        .delete()
        .eq('id', selectedThreat.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete threat documentation: ' + error.message);
        return;
      }

      setThreats((prev) => prev.filter((t) => t.id !== selectedThreat.id));

      toast.success('Threat documentation deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedThreat(null);
    } catch (error: any) {
      console.error('Error deleting threat:', error);
      toast.error('Failed to delete threat documentation: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateThreat = async (updatedData: Partial<ThreatDocumentation>) => {
    if (!selectedThreat) return;

    try {
      const { error } = await supabase
        .from('threat_documentations')
        .update({
          location: updatedData.location,
          latitude: updatedData.latitude,
          longitude: updatedData.longitude,
          immediate_threats: updatedData.immediate_threats,
          additional_notes: updatedData.additional_notes,
        })
        .eq('id', selectedThreat.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update threat documentation: ' + error.message);
        return;
      }

      setThreats((prev) =>
        prev.map((threat) =>
          threat.id === selectedThreat.id
            ? { ...threat, ...updatedData }
            : threat
        )
      );

      toast.success('Threat documentation updated successfully');
      setEditModalOpen(false);
      setSelectedThreat(null);

      fetchThreats();
    } catch (error: any) {
      console.error('Error updating threat:', error);
      toast.error('Failed to update threat documentation: ' + error.message);
    }
  };

  const formatDateTime = (dateString: string) => {
    return formatToIST(dateString, true);
  };

  const ThreatTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading threat documentations...</p>
        </div>
      );
    }

    if (filteredThreats.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">No threat documentations found</p>
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
            <TableHead>Immediate Threats</TableHead>
            <TableHead>Has Photo</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredThreats.map((threat) => (
            <TableRow key={threat.id}>
              <TableCell>
                <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatDateTime(threat.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {threat.location}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {threat.observer_name}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    threat.role?.toLowerCase() === 'farmer'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : threat.role?.toLowerCase() === 'staff'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : threat.role?.toLowerCase() === 'ranger'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : threat.role?.toLowerCase() === 'officer'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : threat.role?.toLowerCase() === 'admin'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {threat.role}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                {threat.immediate_threats && threat.immediate_threats.length > 0
                  ? threat.immediate_threats.slice(0, 2).join(', ') + 
                    (threat.immediate_threats.length > 2 ? '...' : '')
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={threat.image_url ? 'default' : 'outline'}>
                  {threat.image_url ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleView(threat)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(threat)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteClick(threat)}
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
        <h2 className="text-3xl font-bold text-foreground mb-2">Threat Documentations</h2>
        <p className="text-muted-foreground">
          View and manage all threat documentation submissions
        </p>
      </div>

      {/* Search and Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or threat..."
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

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <ThreatTable />
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Threat Documentation Details</DialogTitle>
            <DialogDescription>
              Documentation ID: {selectedThreat?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedThreat && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {formatDateTime(selectedThreat.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observer</p>
                  <p className="font-medium">{selectedThreat.observer_name}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      selectedThreat.role?.toLowerCase() === 'farmer'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : selectedThreat.role?.toLowerCase() === 'staff'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : selectedThreat.role?.toLowerCase() === 'ranger'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : selectedThreat.role?.toLowerCase() === 'officer'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : selectedThreat.role?.toLowerCase() === 'admin'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {selectedThreat.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedThreat.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coordinates</p>
                  <p className="font-medium">
                    {selectedThreat.latitude && selectedThreat.longitude
                      ? `${selectedThreat.latitude}, ${selectedThreat.longitude}`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Immediate Threats Observed</p>
                <p className="font-medium">
                  {selectedThreat.immediate_threats && selectedThreat.immediate_threats.length > 0
                    ? selectedThreat.immediate_threats.join(', ')
                    : 'N/A'}
                </p>
              </div>

              {selectedThreat.additional_notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional Notes</p>
                  <p className="font-medium">{selectedThreat.additional_notes}</p>
                </div>
              )}

              {selectedThreat.image_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Photo Evidence</p>
                  <img
                    src={selectedThreat.image_url}
                    alt="Threat documentation"
                    className="w-full h-64 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('❌ Image failed to load:', selectedThreat.image_url);
                      e.currentTarget.src = '/placeholder.svg';
                      e.currentTarget.className = 'w-full h-64 object-contain rounded-lg border bg-gray-100';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Threat Documentation</DialogTitle>
            <DialogDescription>
              Documentation ID: {selectedThreat?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedThreat && (
            <EditForm
              threat={selectedThreat}
              onSave={handleUpdateThreat}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Threat Documentation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this threat documentation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedThreat && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">ID:</span> {selectedThreat.id}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Location:</span> {selectedThreat.location}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Threats:</span>{' '}
                  {selectedThreat.immediate_threats?.join(', ') || 'None'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Observer:</span> {selectedThreat.observer_name}
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
                {deleting ? 'Deleting...' : 'Delete Documentation'}
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
  threat,
  onSave,
  onCancel,
}: {
  threat: ThreatDocumentation;
  onSave: (data: Partial<ThreatDocumentation>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    location: threat.location,
    latitude: threat.latitude || null,
    longitude: threat.longitude || null,
    immediate_threats: threat.immediate_threats || [],
    additional_notes: threat.additional_notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleThreat = (threatType: string) => {
    const current = formData.immediate_threats || [];
    if (current.includes(threatType)) {
      setFormData({ ...formData, immediate_threats: current.filter(t => t !== threatType) });
    } else {
      setFormData({ ...formData, immediate_threats: [...current, threatType] });
    }
  };

  const threatOptions = [
    'Power line collision risk',
    'Wind turbine disturbance',
    'Illegal grazing',
    'Habitat destruction (Fire, excessive grazing, planting trees, overgrowth of weeds, overgrowth of Prosopis juliflora, construction)',
    'Hunting / poaching evidence',
    'Vehicular traffic disturbance'
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
          <label className="text-sm font-medium">Latitude</label>
          <Input
            type="number"
            step="0.00000001"
            value={formData.latitude || ''}
            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Longitude</label>
        <Input
          type="number"
          step="0.00000001"
          value={formData.longitude || ''}
          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Immediate Threats Observed (multi-select)</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {threatOptions.map((threatType) => (
            <div key={threatType} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`threat-${threatType}`}
                checked={formData.immediate_threats?.includes(threatType) || false}
                onChange={() => toggleThreat(threatType)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor={`threat-${threatType}`} className="text-sm">
                {threatType}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Additional Notes</label>
        <Input
          value={formData.additional_notes}
          onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
          placeholder="Any additional information..."
        />
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

export default ThreatDocumentations;

