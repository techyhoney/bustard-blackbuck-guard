import { useState } from "react";
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
import { mockSurveyEntries, SurveyEntry } from "@/lib/mockData";
import { toast } from "sonner";

const Surveys = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");
  const [selectedObserverType, setSelectedObserverType] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<SurveyEntry | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const filteredEntries = mockSurveyEntries.filter((entry) => {
    const matchesSearch =
      entry.observerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.range.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies =
      selectedSpecies === "all" || entry.species === selectedSpecies;
    const matchesType =
      selectedObserverType === "all" || entry.observerType === selectedObserverType;
    return matchesSearch && matchesSpecies && matchesType;
  });

  const gibEntries = filteredEntries.filter(
    (e) => e.species === "Great Indian Bustard"
  );
  const blackbuckEntries = filteredEntries.filter((e) => e.species === "Blackbuck");

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

  const EntryTable = ({ entries }: { entries: SurveyEntry[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Entry ID</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Observer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Count</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">{entry.id}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {entry.date} {entry.time}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-muted-foreground" />
                {entry.observerName}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={entry.observerType === "Staff" ? "default" : "secondary"}
              >
                {entry.observerType}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {entry.range}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{entry.individualsCount}</Badge>
            </TableCell>
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
                <SelectItem value="Blackbuck">Blackbuck</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedObserverType}
              onValueChange={setSelectedObserverType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Observer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
                <SelectItem value="Farmer">Farmer</SelectItem>
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
              <EntryTable entries={gibEntries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blackbuck">
          <Card>
            <CardContent className="pt-6">
              <EntryTable entries={blackbuckEntries} />
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
              {selectedEntry?.id} - {selectedEntry?.species}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {selectedEntry.date} at {selectedEntry.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observer</p>
                  <p className="font-medium">{selectedEntry.observerName}</p>
                  <Badge
                    variant={
                      selectedEntry.observerType === "Staff" ? "default" : "secondary"
                    }
                    className="mt-1"
                  >
                    {selectedEntry.observerType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GPS Coordinates</p>
                  <p className="font-medium">
                    {selectedEntry.gpsLat}, {selectedEntry.gpsLng}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Individuals Count</p>
                  <p className="font-medium text-2xl">{selectedEntry.individualsCount}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Location Details</p>
                <p className="font-medium">
                  Range: {selectedEntry.range} | Division: {selectedEntry.division} |
                  Beat: {selectedEntry.beat}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Behavior Observed</p>
                <p className="font-medium">{selectedEntry.behavior}</p>
              </div>

              {selectedEntry.habitatType && (
                <div>
                  <p className="text-sm text-muted-foreground">Habitat Type</p>
                  <p className="font-medium">{selectedEntry.habitatType}</p>
                </div>
              )}

              {selectedEntry.threats && (
                <div>
                  <p className="text-sm text-muted-foreground">Threats Observed</p>
                  <p className="font-medium text-destructive">{selectedEntry.threats}</p>
                </div>
              )}

              {selectedEntry.conservation && (
                <div>
                  <p className="text-sm text-muted-foreground">Conservation Activities</p>
                  <p className="font-medium text-success">{selectedEntry.conservation}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{selectedEntry.notes}</p>
              </div>

              {selectedEntry.mediaUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Media</p>
                  <img
                    src={selectedEntry.mediaUrl}
                    alt="Survey media"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Surveys;
