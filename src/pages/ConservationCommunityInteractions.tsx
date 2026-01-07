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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Search, Eye, Edit, Trash2, MapPin, Calendar, User, CheckCircle, XCircle, CalendarIcon, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface ConservationInteraction {
  id: string;
  created_at: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  interaction_with_locals: boolean;
  local_feedback_on_threats: string | null;
  awareness_activity_conducted: string | null;
  observer_name: string;
  role: string;
}

const ConservationCommunityInteractions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInteraction, setSelectedInteraction] = useState<ConservationInteraction | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interactions, setInteractions] = useState<ConservationInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    try {
      setLoading(true);

      // Fetch conservation interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('conservation_community_interactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error("Interactions fetch error:", interactionsError);
        toast.error("Failed to fetch interactions: " + interactionsError.message);
        setLoading(false);
        return;
      }

      // Fetch user profiles separately
      const userIds = [...new Set((interactionsData || []).map((i: any) => i.user_id))];
      const { data: userProfiles } = await supabase
        .from('user_profile')
        .select('id, name_of_official, role')
        .in('id', userIds);

      // Create a map of user profiles
      const userProfileMap = new Map(
        (userProfiles || []).map((profile: any) => [profile.id, profile])
      );

      // Transform the data
      const transformedData: ConservationInteraction[] = (interactionsData || []).map((interaction: any) => {
        const userProfile = userProfileMap.get(interaction.user_id);

        return {
          id: interaction.id,
          created_at: interaction.created_at,
          location: interaction.location,
          latitude: interaction.latitude,
          longitude: interaction.longitude,
          interaction_with_locals: interaction.interaction_with_locals,
          local_feedback_on_threats: interaction.local_feedback_on_threats,
          awareness_activity_conducted: interaction.awareness_activity_conducted,
          observer_name: userProfile?.name_of_official || 'Unknown Observer',
          role: userProfile?.role || 'Unknown Role',
        };
      });

      setInteractions(transformedData);
    } catch (error: any) {
      toast.error("Failed to fetch interactions: " + error.message);
      console.error("Error fetching interactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInteractions = interactions.filter((interaction) => {
    const matchesSearch =
      interaction.observer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (interaction.awareness_activity_conducted && 
        interaction.awareness_activity_conducted.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date filtering
    const interactionDate = new Date(interaction.created_at);
    const matchesDateFrom = !dateFrom || interactionDate >= dateFrom;
    const matchesDateTo = !dateTo || interactionDate <= new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleView = (interaction: ConservationInteraction) => {
    setSelectedInteraction(interaction);
    setViewModalOpen(true);
  };

  const handleEdit = (interaction: ConservationInteraction) => {
    setSelectedInteraction(interaction);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (interaction: ConservationInteraction) => {
    setSelectedInteraction(interaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInteraction) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('conservation_community_interactions')
        .delete()
        .eq('id', selectedInteraction.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete interaction: ' + error.message);
        return;
      }

      setInteractions((prev) => prev.filter((i) => i.id !== selectedInteraction.id));

      toast.success('Interaction deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedInteraction(null);
    } catch (error: any) {
      console.error('Error deleting interaction:', error);
      toast.error('Failed to delete interaction: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateInteraction = async (updatedData: Partial<ConservationInteraction>) => {
    if (!selectedInteraction) return;

    try {
      const { error } = await supabase
        .from('conservation_community_interactions')
        .update({
          location: updatedData.location,
          latitude: updatedData.latitude,
          longitude: updatedData.longitude,
          interaction_with_locals: updatedData.interaction_with_locals,
          local_feedback_on_threats: updatedData.local_feedback_on_threats,
          awareness_activity_conducted: updatedData.awareness_activity_conducted,
        })
        .eq('id', selectedInteraction.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update interaction: ' + error.message);
        return;
      }

      setInteractions((prev) =>
        prev.map((interaction) =>
          interaction.id === selectedInteraction.id
            ? { ...interaction, ...updatedData }
            : interaction
        )
      );

      toast.success('Interaction updated successfully');
      setEditModalOpen(false);
      setSelectedInteraction(null);

      fetchInteractions();
    } catch (error: any) {
      console.error('Error updating interaction:', error);
      toast.error('Failed to update interaction: ' + error.message);
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

  const InteractionTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading conservation interactions...</p>
        </div>
      );
    }

    if (filteredInteractions.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">No conservation interactions found</p>
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
            <TableHead>Local Interaction</TableHead>
            <TableHead>Awareness Activity</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInteractions.map((interaction) => (
            <TableRow key={interaction.id}>
              <TableCell>
                <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatDateTime(interaction.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {interaction.location}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {interaction.observer_name}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    interaction.role?.toLowerCase() === 'farmer'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : interaction.role?.toLowerCase() === 'staff'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : interaction.role?.toLowerCase() === 'ranger'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : interaction.role?.toLowerCase() === 'officer'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : interaction.role?.toLowerCase() === 'admin'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {interaction.role}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {interaction.interaction_with_locals ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">No</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {interaction.awareness_activity_conducted || '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleView(interaction)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(interaction)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteClick(interaction)}
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
        <h2 className="text-3xl font-bold text-foreground mb-2">Conservation & Community Interactions</h2>
        <p className="text-muted-foreground">
          View and manage all conservation and community interaction records
        </p>
      </div>

      {/* Search and Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or activity..."
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
          <InteractionTable />
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conservation & Community Interaction Details</DialogTitle>
            <DialogDescription>
              Interaction ID: {selectedInteraction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedInteraction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {formatDateTime(selectedInteraction.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observer</p>
                  <p className="font-medium">{selectedInteraction.observer_name}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      selectedInteraction.role?.toLowerCase() === 'farmer'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : selectedInteraction.role?.toLowerCase() === 'staff'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : selectedInteraction.role?.toLowerCase() === 'ranger'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : selectedInteraction.role?.toLowerCase() === 'officer'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : selectedInteraction.role?.toLowerCase() === 'admin'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {selectedInteraction.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedInteraction.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coordinates</p>
                  <p className="font-medium">
                    {selectedInteraction.latitude && selectedInteraction.longitude
                      ? `${selectedInteraction.latitude}, ${selectedInteraction.longitude}`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Interaction with Locals During Survey/Monitoring?</p>
                <div className="flex items-center gap-2 mt-1">
                  {selectedInteraction.interaction_with_locals ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-600">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-500">No</span>
                    </>
                  )}
                </div>
              </div>

              {selectedInteraction.interaction_with_locals && selectedInteraction.local_feedback_on_threats && (
                <div>
                  <p className="text-sm text-muted-foreground">Local Feedback on Sightings/Threats</p>
                  <p className="font-medium">{selectedInteraction.local_feedback_on_threats}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Awareness Activity Conducted</p>
                <p className="font-medium">
                  {selectedInteraction.awareness_activity_conducted || 'None'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Conservation & Community Interaction</DialogTitle>
            <DialogDescription>
              Interaction ID: {selectedInteraction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedInteraction && (
            <EditForm
              interaction={selectedInteraction}
              onSave={handleUpdateInteraction}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conservation & Community Interaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this interaction record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInteraction && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">ID:</span> {selectedInteraction.id}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Location:</span> {selectedInteraction.location}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Local Interaction:</span>{' '}
                  {selectedInteraction.interaction_with_locals ? 'Yes' : 'No'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Observer:</span> {selectedInteraction.observer_name}
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
                {deleting ? 'Deleting...' : 'Delete Interaction'}
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
  interaction,
  onSave,
  onCancel,
}: {
  interaction: ConservationInteraction;
  onSave: (data: Partial<ConservationInteraction>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    location: interaction.location,
    latitude: interaction.latitude || null,
    longitude: interaction.longitude || null,
    interaction_with_locals: interaction.interaction_with_locals,
    local_feedback_on_threats: interaction.local_feedback_on_threats || '',
    awareness_activity_conducted: interaction.awareness_activity_conducted || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If interaction_with_locals is false, clear the feedback
    const submitData = {
      ...formData,
      local_feedback_on_threats: formData.interaction_with_locals ? formData.local_feedback_on_threats : null,
    };
    
    onSave(submitData);
  };

  const awarenessOptions = [
    'Distributed pamphlets',
    'Short talk / awareness drive',
    'None'
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
        <label className="text-sm font-medium">Interaction with locals during survey/monitoring?</label>
        <Select
          value={formData.interaction_with_locals.toString()}
          onValueChange={(value) => setFormData({ ...formData, interaction_with_locals: value === 'true' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.interaction_with_locals && (
        <div>
          <label className="text-sm font-medium">Local feedback on sightings/threats</label>
          <Input
            value={formData.local_feedback_on_threats}
            onChange={(e) => setFormData({ ...formData, local_feedback_on_threats: e.target.value })}
            placeholder="Enter feedback from locals..."
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Awareness activity conducted? (select one)</label>
        <Select
          value={formData.awareness_activity_conducted}
          onValueChange={(value) => setFormData({ ...formData, awareness_activity_conducted: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an activity" />
          </SelectTrigger>
          <SelectContent>
            {awarenessOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

export default ConservationCommunityInteractions;

