import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Edit, Trash2, Mail, Shield, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  created_at: string;
  name_of_official: string;
  role: string;
  employee_id: string | null;
  beat_number: number | null;
  range_forest_office: string | null;
  division: string | null;
  last_update_date: string | null;
  latitude: number | null;
  longitude: number | null;
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch user profiles with email from auth.users
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profile')
        .select('*, email')
        .order('created_at', { ascending: false });

      if (profileError) {
        console.error("User profiles fetch error:", profileError);
        toast.error("Failed to fetch user profiles: " + profileError.message);
        setLoading(false);
        return;
      }

      // Transform to User interface
      const transformedUsers: User[] = (userProfiles || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || 'N/A',
        created_at: profile.created_at,
        name_of_official: profile.name_of_official || 'N/A',
        role: profile.role || 'N/A',
        employee_id: profile.employee_id || null,
        beat_number: profile.beat_number || null,
        range_forest_office: profile.range_forest_office || null,
        division: profile.division || null,
        last_update_date: profile.last_update_date || null,
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
      }));

      setUsers(transformedUsers);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name_of_official.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Get unique roles for the filter dropdown
  const uniqueRoles = Array.from(new Set(users.map(user => user.role))).sort();

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setDeleting(true);

      // Call the RPC function to delete user with profile
      const { data, error } = await supabase.rpc('delete_user_with_profile', {
        p_user_id: selectedUser.id
      });

      if (error) {
        console.error('Delete user error:', error);
        
        // Handle specific error messages
        if (error.message.includes('not_admin')) {
          toast.error('You do not have permission to delete users. Admin access required.');
        } else if (error.message.includes('cannot_delete_self')) {
          toast.error('You cannot delete your own account.');
        } else {
          toast.error('Failed to delete user: ' + error.message);
        }
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));

      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateUser = async (formData: any) => {
    try {
      // Call the RPC function to create user with profile
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        p_email: formData.email,
        p_password: formData.password,
        p_name_of_official: formData.name,
        p_role: formData.role,
        p_employee_id: formData.employeeId || null,
        p_beat_number: formData.beatNumber ? parseInt(formData.beatNumber) : null,
        p_range_forest_office: formData.rangeForestOffice || null,
        p_division: formData.division || null,
        p_latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        p_longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });

      if (error) {
        console.error('Create user error:', error);
        toast.error('Failed to create user: ' + error.message);
        return;
      }

      toast.success('User created successfully');
      setCreateModalOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + error.message);
    }
  };

  const handleUpdateUser = async (formData: any) => {
    if (!selectedUser) return;

    try {
      // Call the RPC function to update user with profile
      const { data, error } = await supabase.rpc('update_user_with_profile', {
        p_user_id: selectedUser.id,
        p_email: formData.email,
        p_name_of_official: formData.name,
        p_role: formData.role,
        p_employee_id: formData.employeeId || null,
        p_beat_number: formData.beatNumber ? parseInt(formData.beatNumber) : null,
        p_range_forest_office: formData.rangeForestOffice || null,
        p_division: formData.division || null,
        p_latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        p_longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });

      if (error) {
        console.error('Update user error:', error);
        
        // Handle specific error messages
        if (error.message.includes('not_admin')) {
          toast.error('You do not have permission to update users. Admin access required.');
        } else {
          toast.error('Failed to update user: ' + error.message);
        }
        return;
      }

      toast.success('User updated successfully');
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user: ' + error.message);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role.toLowerCase()) {
      case "farmer":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "staff":
        return "bg-green-100 text-green-800 border-green-200";
      case "ranger":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "officer":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">User Management</h2>
          <p className="text-muted-foreground">
            Manage system users and their permissions
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{user.name_of_official}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.employee_id || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.latitude && user.longitude ? (
                        `${user.latitude}, ${user.longitude}`
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.role.toLowerCase() !== 'admin' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the wildlife survey system. No email verification required.
            </DialogDescription>
          </DialogHeader>
          <CreateUserForm
            onSubmit={handleCreateUser}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSubmit={handleUpdateUser}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Name:</span> {selectedUser.name_of_official}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Email:</span> {selectedUser.email}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Role:</span> {selectedUser.role}
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
                {deleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create User Form Component
const CreateUserForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'farmer',
    employeeId: '',
    beatNumber: '',
    rangeForestOffice: '',
    division: '',
    latitude: '',
    longitude: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password (min 6 characters)"
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="farmer">Farmer</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID (Optional)</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            placeholder="WL-XXX-XXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="beatNumber">Beat Number (Optional)</Label>
          <Input
            id="beatNumber"
            type="number"
            value={formData.beatNumber}
            onChange={(e) => setFormData({ ...formData, beatNumber: e.target.value })}
            placeholder="e.g., 1, 2, 3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rangeForestOffice">Range/Forest Office (Optional)</Label>
          <Input
            id="rangeForestOffice"
            value={formData.rangeForestOffice}
            onChange={(e) => setFormData({ ...formData, rangeForestOffice: e.target.value })}
            placeholder="e.g., Jaisalmer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="division">Division (Optional)</Label>
          <Input
            id="division"
            value={formData.division}
            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            placeholder="e.g., Desert National Park"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude (Optional)</Label>
          <Input
            id="latitude"
            type="number"
            step="0.00000001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="e.g., 26.9124"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude (Optional)</Label>
          <Input
            id="longitude"
            type="number"
            step="0.00000001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="e.g., 70.9083"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create User</Button>
      </DialogFooter>
    </form>
  );
};

// Edit User Form Component
const EditUserForm = ({
  user,
  onSubmit,
  onCancel,
}: {
  user: User;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: user.name_of_official,
    email: user.email,
    role: user.role,
    employeeId: user.employee_id || '',
    beatNumber: user.beat_number?.toString() || '',
    rangeForestOffice: user.range_forest_office || '',
    division: user.division || '',
    latitude: user.latitude?.toString() || '',
    longitude: user.longitude?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="farmer">Farmer</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID (Optional)</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            placeholder="WL-XXX-XXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="beatNumber">Beat Number (Optional)</Label>
          <Input
            id="beatNumber"
            type="number"
            value={formData.beatNumber}
            onChange={(e) => setFormData({ ...formData, beatNumber: e.target.value })}
            placeholder="e.g., 1, 2, 3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rangeForestOffice">Range/Forest Office (Optional)</Label>
          <Input
            id="rangeForestOffice"
            value={formData.rangeForestOffice}
            onChange={(e) => setFormData({ ...formData, rangeForestOffice: e.target.value })}
            placeholder="e.g., Jaisalmer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="division">Division (Optional)</Label>
          <Input
            id="division"
            value={formData.division}
            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            placeholder="e.g., Desert National Park"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude (Optional)</Label>
          <Input
            id="latitude"
            type="number"
            step="0.00000001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="e.g., 26.9124"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude (Optional)</Label>
          <Input
            id="longitude"
            type="number"
            step="0.00000001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="e.g., 70.9083"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Update User</Button>
      </DialogFooter>
    </form>
  );
};

export default Users;
