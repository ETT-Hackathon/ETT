import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getCurrentUser } from '@/lib/auth';
import { FileText, Users, Upload, Calendar, Eye, X } from 'lucide-react';

export default function PatientDashboard() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/dashboard/:section?');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentSection = params?.section || 'overview';

  // Redirect to default section if no section specified
  useEffect(() => {
    if (!params?.section) {
      setLocation('/dashboard/overview');
    }
  }, [params?.section, setLocation]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
    queryFn: getCurrentUser,
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['/api/records'],
    enabled: !!user,
  });

  const { data: accessData } = useQuery({
    queryKey: ['/api/patient-access'],
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      setSelectedFile(null);
      setDescription('');
      toast({
        title: "Upload successful",
        description: "Your health record has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: (doctorEmail: string) => apiRequest('POST', '/api/grant-access', { doctorEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patient-access'] });
      setDoctorEmail('');
      toast({
        title: "Access granted",
        description: "Doctor access has been granted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to grant access",
        description: error.message || "Failed to grant access",
        variant: "destructive",
      });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: (doctorId: string) => apiRequest('POST', '/api/revoke-access', { doctorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patient-access'] });
      toast({
        title: "Access revoked",
        description: "Doctor access has been revoked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to revoke access",
        description: error.message || "Failed to revoke access",
        variant: "destructive",
      });
    },
  });

  if (userLoading || recordsLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'patient') {
    setLocation('/');
    return null;
  }

  const records = (recordsData as any)?.records || [];
  const authorizedDoctors = (accessData as any)?.doctors || [];

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, description });
  };

  const handleGrantAccess = () => {
    if (!doctorEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a doctor's email address.",
        variant: "destructive",
      });
      return;
    }

    grantAccessMutation.mutate(doctorEmail);
  };

  // Section rendering functions
  const getSectionTitle = () => {
    switch (currentSection) {
      case 'records': return 'Health Records';
      case 'access': return 'Doctor Access';
      default: return 'Dashboard Overview';
    }
  };

  const getSectionDescription = () => {
    switch (currentSection) {
      case 'records': return 'Upload and manage your health records';
      case 'access': return 'Manage doctor access to your records';
      default: return 'Overview of your health records and access';
    }
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'records':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Health Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload onFileSelect={setSelectedFile} />
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for this record"
                    rows={3}
                    data-testid="textarea-description"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending || !selectedFile}
                    data-testid="button-upload-record"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Record'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* All Records */}
            <Card>
              <CardHeader>
                <CardTitle>All Records</CardTitle>
              </CardHeader>
              <CardContent>
                {recordsLoading ? (
                  <p>Loading records...</p>
                ) : records.length === 0 ? (
                  <p className="text-muted-foreground">No records uploaded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {records.map((record: any) => (
                      <div
                        key={record._id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-record-description-${record._id}`}>
                              {record.description || record.filename}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/download/${record._id}`, '_blank')}
                          data-testid={`button-download-${record._id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'access':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Current Access */}
            <Card>
              <CardHeader>
                <CardTitle>Authorized Doctors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {authorizedDoctors.map((doctor: any) => (
                    <div
                      key={doctor._id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-secondary-foreground">
                            {doctor.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground" data-testid={`text-doctor-name-${doctor._id}`}>
                            {doctor.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doctor.specialty || 'Doctor'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeAccessMutation.mutate(doctor._id)}
                        disabled={revokeAccessMutation.isPending}
                        data-testid={`button-revoke-${doctor._id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {authorizedDoctors.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No doctors have access yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grant Access */}
            <Card>
              <CardHeader>
                <CardTitle>Grant Doctor Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Doctor's email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    data-testid="input-doctor-email"
                  />
                  <Button
                    onClick={handleGrantAccess}
                    disabled={grantAccessMutation.isPending}
                    className="w-full"
                    data-testid="button-grant-access"
                  >
                    {grantAccessMutation.isPending ? 'Granting...' : 'Grant Access'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default: // overview
        return (
          <>
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-total-records">
                        {records.length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Authorized Doctors</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-authorized-doctors">
                        {authorizedDoctors.length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Recent Uploads</p>
                      <p className="text-2xl font-bold text-foreground">
                        {records.filter((r: any) => {
                          const uploadDate = new Date(r.uploadDate);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return uploadDate > weekAgo;
                        }).length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Upload</p>
                      <p className="text-sm font-medium text-foreground">
                        {records.length > 0
                          ? new Date(records[0].uploadDate).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-download-all">
                    <FileText className="w-4 h-4 mr-2" />
                    Download All Records
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-logs">
                    <Eye className="w-4 h-4 mr-2" />
                    View Access Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{getSectionTitle()}</h1>
        <p className="text-muted-foreground mt-2">{getSectionDescription()}</p>
      </div>
      
      {renderCurrentSection()}
    </div>
  );
}