import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        description: error.message || "Could not grant doctor access",
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
        description: error.message || "Could not revoke doctor access",
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Patient Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your health records and doctor access</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-3">
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
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Upload</p>
                    <p className="text-2xl font-bold text-foreground">
                      {records.length > 0 ? 
                        Math.ceil((Date.now() - new Date(records[0].uploadDate).getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">days ago</p>
                  </div>
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
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

          {/* Recent Records */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Records</CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <p>Loading records...</p>
              ) : records.length === 0 ? (
                <p className="text-muted-foreground">No records uploaded yet.</p>
              ) : (
                <div className="space-y-3">
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
                      <Button variant="ghost" size="icon">
                        <Eye className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Doctor Access Management */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Doctor Access</CardTitle>
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
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Input
                  placeholder="Doctor's email"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  data-testid="input-doctor-email"
                />
                <Button
                  className="w-full"
                  onClick={handleGrantAccess}
                  disabled={grantAccessMutation.isPending}
                  data-testid="button-grant-access"
                >
                  {grantAccessMutation.isPending ? 'Granting...' : 'Grant Access'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" data-testid="button-download-all">
                  <FileText className="w-4 h-4 mr-2" />
                  Download All Records
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-access-logs">
                  <Eye className="w-4 h-4 mr-2" />
                  View Access Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
