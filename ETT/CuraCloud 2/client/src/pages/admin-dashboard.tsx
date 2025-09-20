import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getCurrentUser } from '@/lib/auth';
import { Users, AlertTriangle, CheckCircle, FileText, User, X, Check } from 'lucide-react';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
    queryFn: getCurrentUser,
  });

  const { data: pendingUsers } = useQuery({
    queryKey: ['/api/pending-verifications'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: allUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: allRecords } = useQuery({
    queryKey: ['/api/records'],
    enabled: !!user && user.role === 'admin',
  });

  const verifyUserMutation = useMutation({
    mutationFn: ({ userId, verified }: { userId: string; verified: boolean }) =>
      apiRequest('POST', '/api/verify-user', { userId, verified }),
    onSuccess: (_, { verified }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: verified ? "User verified" : "User rejected",
        description: `User has been ${verified ? 'verified' : 'rejected'} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Could not update user verification status",
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    setLocation('/');
    return null;
  }

  const pendingVerifications = (pendingUsers as any)?.users || [];
  const systemUsers = (allUsers as any)?.users || [];
  const totalRecords = (allRecords as any)?.records || [];

  const filteredUsers = systemUsers.filter((user: any) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const activeDoctors = systemUsers.filter((user: any) => user.role === 'doctor' && user.verified).length;
  const activePatients = systemUsers.filter((user: any) => user.role === 'patient' && user.verified).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage users, verify accounts, and oversee system operations</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        {/* System Overview Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-users">
                  {systemUsers.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Verifications</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-pending-verifications">
                  {pendingVerifications.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Doctors</p>
                <p className="text-2xl font-bold text-accent" data-testid="text-active-doctors">
                  {activeDoctors}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-secondary" data-testid="text-total-records">
                  {totalRecords.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Verifications</CardTitle>
              <Badge variant="destructive" data-testid="badge-pending-count">
                {pendingVerifications.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingVerifications.length === 0 ? (
              <p className="text-muted-foreground">No pending verifications.</p>
            ) : (
              <div className="space-y-4">
                {pendingVerifications.map((user: any) => (
                  <div key={user._id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground" data-testid={`text-pending-user-name-${user._id}`}>
                            {user.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center mt-1">
                            <Badge variant="secondary" className="mr-2">
                              {user.role}
                            </Badge>
                            {user.specialty && (
                              <span className="text-xs text-muted-foreground">{user.specialty}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => verifyUserMutation.mutate({ userId: user._id, verified: false })}
                          disabled={verifyUserMutation.isPending}
                          data-testid={`button-reject-${user._id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => verifyUserMutation.mutate({ userId: user._id, verified: true })}
                          disabled={verifyUserMutation.isPending}
                          data-testid={`button-approve-${user._id}`}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <Button size="sm" data-testid="button-export-users">
                Export Users
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex space-x-2">
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1"
                data-testid="input-search-users"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[120px]" data-testid="select-role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="patient">Patients</SelectItem>
                  <SelectItem value="doctor">Doctors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid={`text-user-name-${user._id}`}>
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${user.verified ? 'bg-accent' : 'bg-destructive'}`}></div>
                      <span className="text-xs text-muted-foreground">
                        {user.verified ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Activity */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{activePatients}</div>
                <div className="text-sm text-muted-foreground">Active Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{activeDoctors}</div>
                <div className="text-sm text-muted-foreground">Verified Doctors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalRecords.length}</div>
                <div className="text-sm text-muted-foreground">Health Records</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
