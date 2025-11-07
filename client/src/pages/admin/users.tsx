import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Search, Filter, UserPlus, Ban, CheckCircle, XCircle, Key,
  Shield, Clock, Activity, AlertCircle, RefreshCw, Download,
  Loader2, Edit, Eye, UserX, UserCheck, History, LogIn,
  Settings, Mail
} from "lucide-react";

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    phone: '',
    name: '',
    role: 'driver',
    password: '',
  });

  // Query for users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/users', { role: roleFilter, status: statusFilter, search: searchQuery }],
  });

  // Query for activity logs
  const { data: activityLogs } = useQuery({
    queryKey: ['/api/admin/users/activity', selectedUser?.id],
    enabled: !!selectedUser,
  });

  // Mutation for updating user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
    },
  });

  // Mutation for suspending/activating user
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Status updated",
        description: "User status has been updated successfully",
      });
    },
  });

  // Mutation for password reset
  const passwordResetMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/reset-password`, {});
    },
    onSuccess: () => {
      setShowPasswordReset(false);
      toast({
        title: "Password reset",
        description: "Password reset link has been sent to the user",
      });
    },
  });

  // Mutation for creating a new user
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUserData) => {
      return apiRequest('POST', '/api/admin/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowAddUser(false);
      setNewUserData({
        email: '',
        phone: '',
        name: '',
        role: 'driver',
        password: '',
      });
      toast({
        title: "User created",
        description: "New user has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating user",
        description: error.message || "Failed to create user",
      });
    },
  });

  const usersData = users?.users || users?.data || [
    {
      id: "USR-001",
      name: "John Smith",
      email: "john@example.com",
      phone: "(555) 123-4567",
      role: "driver",
      status: "active",
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      totalJobs: 45,
      emailVerified: true,
      twoFactorEnabled: false,
    },
    {
      id: "USR-002",
      name: "Mike Johnson",
      email: "mike@contractor.com",
      phone: "(555) 987-6543",
      role: "contractor",
      status: "active",
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      totalJobs: 342,
      emailVerified: true,
      twoFactorEnabled: true,
    },
    {
      id: "USR-003",
      name: "Sarah Admin",
      email: "sarah@admin.com",
      phone: "(555) 555-5555",
      role: "admin",
      status: "active",
      createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
      lastLogin: new Date(Date.now() - 5 * 60 * 1000),
      totalJobs: 0,
      emailVerified: true,
      twoFactorEnabled: true,
    },
  ];

  const activityData = activityLogs?.data || [
    {
      id: "LOG-001",
      action: "login",
      details: "Successful login from IP 192.168.1.1",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: "192.168.1.1",
      userAgent: "Chrome 120.0.0",
    },
    {
      id: "LOG-002",
      action: "job_create",
      details: "Created emergency repair job #JOB-12345",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      ipAddress: "192.168.1.1",
      userAgent: "Chrome 120.0.0",
    },
  ];

  const getRoleBadge = (role: string) => {
    const colors: any = {
      admin: 'destructive',
      contractor: 'default',
      driver: 'secondary',
      fleet: 'outline',
    };
    return <Badge variant={colors[role] || 'secondary'}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      active: 'success',
      suspended: 'destructive',
      pending: 'warning',
    };
    return <Badge variant={colors[status] || 'secondary'}>{status}</Badge>;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return LogIn;
      case 'logout': return LogIn;
      case 'job_create': return Activity;
      case 'profile_update': return Settings;
      default: return Activity;
    }
  };

  const handleExport = async () => {
    try {
      const data = await apiRequest<string>('POST', '/api/admin/users/export', { 
        format: 'csv',
        filters: { role: roleFilter, status: statusFilter }
      });
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "User data has been exported",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export user data",
      });
    }
  };

  return (
    <AdminLayout 
      title="User Management"
      breadcrumbs={[{ label: "Users" }]}
    >
      {/* Main Users Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                data-testid="button-refresh-users"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                data-testid="button-export-users"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => setShowAddUser(true)}
                data-testid="button-add-user"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="fleet">Fleet Manager</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Suspend selected users
                  }}
                >
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Send email to selected users
                  }}
                >
                  Send Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === usersData.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(usersData.map((u: any) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : usersData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  usersData.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <Shield className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{user.totalJobs}</TableCell>
                      <TableCell>{format(user.createdAt, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(user.lastLogin, 'h:mm a')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                            data-testid={`button-view-${user.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowActivityLog(true);
                            }}
                            data-testid={`button-activity-${user.id}`}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Complete user information and management options
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={selectedUser.name} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={selectedUser.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={selectedUser.phone} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value) => {
                        updateRoleMutation.mutate({
                          userId: selectedUser.id,
                          role: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="fleet">Fleet Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <Select
                      value={selectedUser.status}
                      onValueChange={(value) => {
                        updateStatusMutation.mutate({
                          userId: selectedUser.id,
                          status: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <Input value={format(selectedUser.createdAt, 'PPP')} readOnly />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.emailVerified ? 'Email address is verified' : 'Email address is not verified'}
                      </p>
                    </div>
                    {selectedUser.emailVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Button size="sm" variant="outline">
                        Send Verification
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.twoFactorEnabled ? '2FA is enabled' : '2FA is not enabled'}
                      </p>
                    </div>
                    {selectedUser.twoFactorEnabled ? (
                      <Shield className="h-5 w-5 text-green-600" />
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Password Reset</p>
                      <p className="text-sm text-muted-foreground">
                        Send a password reset link to the user
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordReset(true);
                      }}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Last Login</p>
                      <p className="text-sm text-muted-foreground">
                        {format(selectedUser.lastLogin, 'PPpp')}
                      </p>
                    </div>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {activityData.map((log: any) => {
                      const Icon = getActionIcon(log.action);
                      return (
                        <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-muted rounded-full">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{log.details}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{format(log.timestamp, 'PPp')}</span>
                              <span>IP: {log.ipAddress}</span>
                              <span>{log.userAgent}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="permissions">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Role-Based Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm">Current Role: {selectedUser.role}</Label>
                        <div className="space-y-2 mt-4">
                          {selectedUser.role === 'admin' && (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Full platform access</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">User management</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Configuration management</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Financial management</span>
                              </div>
                            </>
                          )}
                          {selectedUser.role === 'contractor' && (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Job management</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Earnings view</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Profile management</span>
                              </div>
                            </>
                          )}
                          {selectedUser.role === 'driver' && (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Job creation</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Job tracking</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Payment management</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Activity Log - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              View detailed activity history for this user
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {activityData.map((log: any) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-2 bg-muted rounded-full">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{log.details}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{format(log.timestamp, 'PPp')}</span>
                        <span>IP: {log.ipAddress}</span>
                        <span>{log.userAgent}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Password Reset</DialogTitle>
            <DialogDescription>
              Are you sure you want to send a password reset link to {selectedUser?.name}?
              This will send an email to {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordReset(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                passwordResetMutation.mutate({
                  userId: selectedUser?.id,
                });
              }}
              disabled={passwordResetMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {passwordResetMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the specified role and permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                placeholder="John Smith"
                data-testid="input-new-user-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="john@example.com"
                data-testid="input-new-user-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                data-testid="input-new-user-phone"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="••••••••"
                data-testid="input-new-user-password"
              />
              <p className="text-xs text-muted-foreground">
                User will be prompted to change password on first login
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select 
                value={newUserData.role}
                onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
              >
                <SelectTrigger data-testid="select-new-user-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="fleet_manager">Fleet Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddUser(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createUserMutation.mutate(newUserData)}
              disabled={createUserMutation.isPending || !newUserData.email || !newUserData.name || !newUserData.password}
              data-testid="button-confirm-add-user"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}