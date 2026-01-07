import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";

interface HabitatAssessment {
  id: string;
  created_at: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  habitat_type: string;
  crop_type: string | null;
  surrounding_land_use: string[] | null;
  habitat_changes_from_last_survey: boolean | null;
  habitat_changes_description: string | null;
  observer_name: string;
  role: string;
}

const HabitatAssessments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<HabitatAssessment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessments, setAssessments] = useState<HabitatAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Fetch assessments from Supabase
  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);

      // Fetch habitat assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('habitat_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assessmentsError) {
        console.error("Assessments fetch error:", assessmentsError);
        toast.error("Failed to fetch habitat assessments: " + assessmentsError.message);
        setLoading(false);
        return;
      }

      // Fetch user profiles separately
      const userIds = [...new Set((assessmentsData || []).map((a: any) => a.user_id))];
      const { data: userProfiles } = await supabase
        .from('user_profile')
        .select('id, name_of_official, role')
        .in('id', userIds);

      // Create a map of user profiles
      const userProfileMap = new Map(
        (userProfiles || []).map((profile: any) => [profile.id, profile])
      );

      // Transform the data
      const transformedData: HabitatAssessment[] = (assessmentsData || []).map((assessment: any) => {
        const userProfile = userProfileMap.get(assessment.user_id);

        // Ensure surrounding_land_use is properly parsed as array
        let landUseArray = assessment.surrounding_land_use;
        if (typeof landUseArray === 'string') {
          try {
            landUseArray = JSON.parse(landUseArray);
          } catch (e) {
            landUseArray = null;
          }
        }

        return {
          id: assessment.id,
          created_at: assessment.created_at,
          location: assessment.location,
          latitude: assessment.latitude,
          longitude: assessment.longitude,
          habitat_type: assessment.habitat_type,
          crop_type: assessment.crop_type,
          surrounding_land_use: landUseArray,
          habitat_changes_from_last_survey: assessment.habitat_changes_from_last_survey,
          habitat_changes_description: assessment.habitat_changes_description,
          observer_name: userProfile?.name_of_official || 'Unknown Observer',
          role: userProfile?.role || 'Unknown Role',
        };
      });

      setAssessments(transformedData);
    } catch (error: any) {
      toast.error("Failed to fetch habitat assessments: " + error.message);
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.observer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.habitat_type && assessment.habitat_type.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date filtering
    const assessmentDate = new Date(assessment.created_at);
    const matchesDateFrom = !dateFrom || assessmentDate >= dateFrom;
    const matchesDateTo = !dateTo || assessmentDate <= new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleView = (assessment: HabitatAssessment) => {
    setSelectedAssessment(assessment);
    setViewModalOpen(true);
  };

  const handleEdit = (assessment: HabitatAssessment) => {
    setSelectedAssessment(assessment);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (assessment: HabitatAssessment) => {
    setSelectedAssessment(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssessment) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('habitat_assessments')
        .delete()
        .eq('id', selectedAssessment.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete assessment: ' + error.message);
        return;
      }

      setAssessments((prev) => prev.filter((a) => a.id !== selectedAssessment.id));

      toast.success('Habitat assessment deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAssessment(null);
    } catch (error: any) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateAssessment = async (updatedData: Partial<HabitatAssessment>) => {
    if (!selectedAssessment) return;

    try {
      const { error } = await supabase
        .from('habitat_assessments')
        .update({
          location: updatedData.location,
          latitude: updatedData.latitude,
          longitude: updatedData.longitude,
          habitat_type: updatedData.habitat_type,
          crop_type: updatedData.crop_type,
          surrounding_land_use: updatedData.surrounding_land_use,
          habitat_changes_from_last_survey: updatedData.habitat_changes_from_last_survey,
          habitat_changes_description: updatedData.habitat_changes_description,
        })
        .eq('id', selectedAssessment.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update assessment: ' + error.message);
        return;
      }

      setAssessments((prev) =>
        prev.map((assessment) =>
          assessment.id === selectedAssessment.id
            ? { ...assessment, ...updatedData }
            : assessment
        )
      );

      toast.success('Habitat assessment updated successfully');
      setEditModalOpen(false);
      setSelectedAssessment(null);

      fetchAssessments();
    } catch (error: any) {
      console.error('Error updating assessment:', error);
      toast.error('Failed to update assessment: ' + error.message);
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

  const AssessmentTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading habitat assessments...</p>
        </div>
      );
    }

    if (filteredAssessments.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">No habitat assessments found</p>
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
            <TableHead>Habitat Type</TableHead>
            <TableHead>Crop Type</TableHead>
            <TableHead>Surrounding Land Use</TableHead>
            <TableHead>Changes Detected</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAssessments.map((assessment) => (
            <TableRow key={assessment.id}>
              <TableCell>
                <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatDateTime(assessment.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {assessment.location}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {assessment.observer_name}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    assessment.role?.toLowerCase() === 'farmer'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : assessment.role?.toLowerCase() === 'staff'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : assessment.role?.toLowerCase() === 'ranger'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : assessment.role?.toLowerCase() === 'officer'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : assessment.role?.toLowerCase() === 'admin'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {assessment.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{assessment.habitat_type}</Badge>
              </TableCell>
              <TableCell>{assessment.crop_type || '-'}</TableCell>
              <TableCell className="max-w-xs">
                {assessment.surrounding_land_use && assessment.surrounding_land_use.length > 0
                  ? assessment.surrounding_land_use.join(', ')
                  : '-'}
              </TableCell>
              <TableCell>
                {assessment.habitat_changes_from_last_survey !== null ? (
                  <Badge variant={assessment.habitat_changes_from_last_survey ? 'default' : 'outline'}>
                    {assessment.habitat_changes_from_last_survey ? 'Yes' : 'No'}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleView(assessment)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(assessment)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteClick(assessment)}
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
        <h2 className="text-3xl font-bold text-foreground mb-2">Habitat Assessments</h2>
        <p className="text-muted-foreground">
          View and manage all habitat assessment submissions
        </p>
      </div>

      {/* Search and Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or habitat type..."
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
          <AssessmentTable />
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Habitat Assessment Details</DialogTitle>
            <DialogDescription>
              Assessment ID: {selectedAssessment?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {formatDateTime(selectedAssessment.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observer</p>
                  <p className="font-medium">{selectedAssessment.observer_name}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      selectedAssessment.role?.toLowerCase() === 'farmer'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : selectedAssessment.role?.toLowerCase() === 'staff'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : selectedAssessment.role?.toLowerCase() === 'ranger'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : selectedAssessment.role?.toLowerCase() === 'officer'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : selectedAssessment.role?.toLowerCase() === 'admin'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {selectedAssessment.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedAssessment.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coordinates</p>
                  <p className="font-medium">
                    {selectedAssessment.latitude && selectedAssessment.longitude
                      ? `${selectedAssessment.latitude}, ${selectedAssessment.longitude}`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Habitat Type</p>
                  <Badge variant="secondary" className="mt-1">
                    {selectedAssessment.habitat_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Crop Type</p>
                  <p className="font-medium">{selectedAssessment.crop_type || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Surrounding Land Use (500m radius)</p>
                <p className="font-medium">
                  {selectedAssessment.surrounding_land_use && selectedAssessment.surrounding_land_use.length > 0
                    ? selectedAssessment.surrounding_land_use.join(', ')
                    : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Habitat Changes from Last Survey</p>
                <Badge
                  variant={selectedAssessment.habitat_changes_from_last_survey ? 'default' : 'outline'}
                  className="mt-1"
                >
                  {selectedAssessment.habitat_changes_from_last_survey ? 'Yes' : 'No'}
                </Badge>
              </div>

              {selectedAssessment.habitat_changes_description && (
                <div>
                  <p className="text-sm text-muted-foreground">Habitat Changes Description</p>
                  <p className="font-medium">{selectedAssessment.habitat_changes_description}</p>
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
            <DialogTitle>Edit Habitat Assessment</DialogTitle>
            <DialogDescription>
              Assessment ID: {selectedAssessment?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <EditForm
              assessment={selectedAssessment}
              onSave={handleUpdateAssessment}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Habitat Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this habitat assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAssessment && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">ID:</span> {selectedAssessment.id}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Location:</span> {selectedAssessment.location}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Habitat Type:</span> {selectedAssessment.habitat_type}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Observer:</span> {selectedAssessment.observer_name}
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
                {deleting ? 'Deleting...' : 'Delete Assessment'}
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
  assessment,
  onSave,
  onCancel,
}: {
  assessment: HabitatAssessment;
  onSave: (data: Partial<HabitatAssessment>) => void;
  onCancel: () => void;
}) => {
  const cropOptions = [
    'Sunflower',
    'Cotton',
    'Groundnut',
    'Sorghum',
    'Ragi',
    'Bajra',
    'Navane (foxtail millet)',
    'Chana',
    'Paddy',
    'Other'
  ];

  const isOtherCrop = assessment.crop_type && !cropOptions.slice(0, -1).includes(assessment.crop_type);

  const [formData, setFormData] = useState({
    location: assessment.location,
    latitude: assessment.latitude || null,
    longitude: assessment.longitude || null,
    habitat_type: assessment.habitat_type,
    crop_type: assessment.crop_type || '',
    surrounding_land_use: assessment.surrounding_land_use || [],
    habitat_changes_from_last_survey: assessment.habitat_changes_from_last_survey ?? false,
    habitat_changes_description: assessment.habitat_changes_description || '',
  });

  const [showOtherCropInput, setShowOtherCropInput] = useState(isOtherCrop);
  const [otherCropValue, setOtherCropValue] = useState(isOtherCrop ? assessment.crop_type : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If "Other" was selected, use the custom input value
    const submitData = {
      ...formData,
      crop_type: showOtherCropInput ? otherCropValue : formData.crop_type
    };
    
    onSave(submitData);
  };

  const toggleLandUse = (landUse: string) => {
    const current = formData.surrounding_land_use || [];
    if (current.includes(landUse)) {
      setFormData({ ...formData, surrounding_land_use: current.filter(l => l !== landUse) });
    } else {
      setFormData({ ...formData, surrounding_land_use: [...current, landUse] });
    }
  };

  const habitatTypeOptions = [
    'Grassland',
    'Agriculture land (dry, uncultivated)',
    'Agricultural land with crops',
    'Fallow land',
    'Scrubland',
    'Mixed habitat',
    'Land with full of Ballari Jail (Prosopis juliflora)',
    'Other'
  ];

  const landUseOptions = [
    'Windmills',
    'Powerlines',
    'Villages/settlements',
    'Grazing activity',
    'Water source (tank/lake/stream)'
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
          <label className="text-sm font-medium">Habitat Type</label>
          <Select
            value={formData.habitat_type}
            onValueChange={(value) => setFormData({ ...formData, habitat_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select habitat type" />
            </SelectTrigger>
            <SelectContent>
              {habitatTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Latitude</label>
          <Input
            type="number"
            step="0.00000001"
            value={formData.latitude || ''}
            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
          />
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
      </div>

      {formData.habitat_type === 'Agricultural land with crops' && (
        <div>
          <label className="text-sm font-medium">Crop Type</label>
          <Select
            value={showOtherCropInput ? 'Other' : formData.crop_type}
            onValueChange={(value) => {
              if (value === 'Other') {
                setShowOtherCropInput(true);
                setOtherCropValue('');
              } else {
                setShowOtherCropInput(false);
                setFormData({ ...formData, crop_type: value });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select crop type" />
            </SelectTrigger>
            <SelectContent>
              {cropOptions.map((crop) => (
                <SelectItem key={crop} value={crop}>
                  {crop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showOtherCropInput && (
            <Input
              className="mt-2"
              value={otherCropValue}
              onChange={(e) => setOtherCropValue(e.target.value)}
              placeholder="Please specify crop type..."
            />
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Land use in surrounding 500m radius (multi-select)</label>
        <div className="space-y-2 mt-2">
          {landUseOptions.map((landUse) => (
            <div key={landUse} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`landuse-${landUse}`}
                checked={formData.surrounding_land_use?.includes(landUse) || false}
                onChange={() => toggleLandUse(landUse)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor={`landuse-${landUse}`} className="text-sm">
                {landUse}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Any habitat changes compared to last survey?</label>
        <Select
          value={formData.habitat_changes_from_last_survey ? 'yes' : 'no'}
          onValueChange={(value) => setFormData({ ...formData, habitat_changes_from_last_survey: value === 'yes' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.habitat_changes_from_last_survey && (
        <div>
          <label className="text-sm font-medium">Description of habitat changes</label>
          <Input
            value={formData.habitat_changes_description}
            onChange={(e) => setFormData({ ...formData, habitat_changes_description: e.target.value })}
            placeholder="Please describe the changes observed..."
          />
        </div>
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

export default HabitatAssessments;

