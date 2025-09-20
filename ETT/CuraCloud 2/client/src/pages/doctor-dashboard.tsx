import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getCurrentUser } from '@/lib/auth';
import { FileText, Users, Clock, User, Eye, Download } from 'lucide-react';

const noteSchema = z.object({
  patientId: z.string().min(1),
  consultationType: z.string().min(1),
  content: z.string().min(10),
  diagnosis: z.string().optional(),
  nextAppointment: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

export default function DoctorDashboard() {
  const [, setLocation] = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const noteForm = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      patientId: '',
      consultationType: '',
      content: '',
      diagnosis: '',
      nextAppointment: '',
    },
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
    queryFn: getCurrentUser,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['/api/doctor-patients'],
    enabled: !!user && user.role === 'doctor',
  });

  const { data: patientRecords } = useQuery({
    queryKey: ['/api/records', selectedPatient?._id],
    enabled: !!selectedPatient,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/records/${selectedPatient._id}`);
      return response.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: NoteFormData) => apiRequest('POST', '/api/notes', data),
    onSuccess: () => {
      noteForm.reset();
      toast({
        title: "Note added successfully",
        description: "Treatment note has been saved to patient record.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add note",
        description: error.message || "Could not save treatment note",
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!user || user.role !== 'doctor') {
    setLocation('/');
    return null;
  }

  const patients = (patientsData as any)?.patients || [];
  const filteredPatients = patients.filter((patient: any) =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleAddNote = (data: NoteFormData) => {
    if (!selectedPatient) {
      toast({
        title: "No patient selected",
        description: "Please select a patient first.",
        variant: "destructive",
      });
      return;
    }

    addNoteMutation.mutate({
      ...data,
      patientId: selectedPatient._id,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
        <p className="text-muted-foreground mt-2">Access authorized patient records and manage treatments</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Search & Access */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Patient Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search patient by name or email"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                data-testid="input-search-patient"
              />

              <div className="space-y-3">
                {filteredPatients.length === 0 ? (
                  <p className="text-muted-foreground">No authorized patients found.</p>
                ) : (
                  filteredPatients.map((patient: any) => (
                    <div
                      key={patient._id}
                      className={`p-3 border border-border rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?._id === patient._id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                      data-testid={`card-patient-${patient._id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground" data-testid={`text-patient-name-${patient._id}`}>
                            {patient.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                          <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                            <span className="text-xs text-muted-foreground">Access granted</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Records Reviewed</span>
                  <span className="font-semibold text-foreground" data-testid="text-records-reviewed">
                    {patientRecords?.records?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Authorized Patients</span>
                  <span className="font-semibold text-foreground" data-testid="text-patients-count">
                    {patients.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Notes Added</span>
                  <span className="font-semibold text-foreground">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Records View */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Patient Records - {selectedPatient ? (
                  <span className="text-primary" data-testid="text-selected-patient">
                    {selectedPatient.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select a patient</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPatient ? (
                <p className="text-muted-foreground">Please select a patient to view their records.</p>
              ) : patientRecords?.records?.length === 0 ? (
                <p className="text-muted-foreground">No records available for this patient.</p>
              ) : (
                <div className="space-y-4">
                  {patientRecords?.records?.map((record: any) => (
                    <div
                      key={record._id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-foreground" data-testid={`text-record-title-${record._id}`}>
                              {record.description || record.filename}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {new Date(record.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {record.fileType} • {Math.round(record.fileSize / 1024)} KB
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Button size="sm" data-testid={`button-view-${record._id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Document
                              </Button>
                              <Button variant="outline" size="sm" data-testid={`button-download-${record._id}`}>
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Treatment Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Add Treatment Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={noteForm.handleSubmit(handleAddNote)} className="space-y-4">
                <div>
                  <Label htmlFor="consultationType">Consultation Type</Label>
                  <Select onValueChange={(value) => noteForm.setValue('consultationType', value)}>
                    <SelectTrigger data-testid="select-consultation-type">
                      <SelectValue placeholder="Select consultation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  {noteForm.formState.errors.consultationType && (
                    <p className="text-sm text-destructive mt-1">
                      {noteForm.formState.errors.consultationType.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="content">Treatment Notes</Label>
                  <Textarea
                    id="content"
                    {...noteForm.register('content')}
                    placeholder="Enter detailed treatment notes, observations, and recommendations..."
                    rows={5}
                    data-testid="textarea-treatment-notes"
                  />
                  {noteForm.formState.errors.content && (
                    <p className="text-sm text-destructive mt-1">
                      {noteForm.formState.errors.content.message}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Input
                      id="diagnosis"
                      {...noteForm.register('diagnosis')}
                      placeholder="Primary diagnosis"
                      data-testid="input-diagnosis"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextAppointment">Next Appointment</Label>
                    <Input
                      id="nextAppointment"
                      type="date"
                      {...noteForm.register('nextAppointment')}
                      data-testid="input-next-appointment"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => noteForm.reset()}
                    data-testid="button-clear-form"
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={addNoteMutation.isPending || !selectedPatient}
                    data-testid="button-add-note"
                  >
                    {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
