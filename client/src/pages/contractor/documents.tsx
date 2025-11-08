import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, FileText, AlertCircle, CheckCircle, 
  X, Calendar, Shield, Car, FileCheck
} from "lucide-react";
import { format } from "date-fns";

// Document types configuration
const REQUIRED_DOCUMENTS = [
  { type: "cdl", label: "Commercial Driver's License (CDL)", accept: ".pdf,.jpg,.png", required: true },
  { type: "insurance", label: "Business Insurance Certificate", accept: ".pdf", required: true },
  { type: "w9", label: "W-9 Tax Form", accept: ".pdf", required: true },
  { type: "vehicle_registration", label: "Vehicle Registration", accept: ".pdf,.jpg,.png", required: true },
  { type: "dot_medical", label: "DOT Medical Certificate", accept: ".pdf,.jpg,.png", required: true },
  { type: "ase_certification", label: "ASE Mechanic Certifications", accept: ".pdf,.jpg,.png", required: true }
];

const OPTIONAL_DOCUMENTS = [
  { type: "other_certification", label: "Additional Certifications", accept: ".pdf,.jpg,.png" },
  { type: "reference_letter", label: "Reference Letters", accept: ".pdf" },
  { type: "portfolio_photo", label: "Portfolio Photos", accept: ".jpg,.png" }
];

interface Document {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: string;
  expirationDate?: string;
  status: string;
}

export default function ContractorDocuments() {
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());
  const [expirationDates, setExpirationDates] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  // Query for existing documents
  const { data: documents = [], isLoading, refetch } = useQuery<Document[]>({
    queryKey: ['/api/contractor/documents']
  });

  // Query for contractor profile to check approval status
  const { data: profile } = useQuery({
    queryKey: ['/api/contractor/profile']
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ type, file, expirationDate }: { type: string; file: File; expirationDate?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (expirationDate) {
        formData.append('expirationDate', expirationDate);
      }

      return apiRequest('/api/contractor/documents', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully."
      });
      refetch();
      // Clear the uploaded file after success
      uploadedFiles.forEach((_, type) => {
        if (uploadedFiles.has(type)) {
          const newFiles = new Map(uploadedFiles);
          newFiles.delete(type);
          setUploadedFiles(newFiles);
        }
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/api/contractor/documents/${documentId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "The document has been removed."
      });
      refetch();
    }
  });

  const handleFileSelect = (type: string, file: File) => {
    const newFiles = new Map(uploadedFiles);
    newFiles.set(type, file);
    setUploadedFiles(newFiles);
  };

  const handleExpirationDate = (type: string, date: string) => {
    const newDates = new Map(expirationDates);
    newDates.set(type, date);
    setExpirationDates(newDates);
  };

  const handleUpload = async (type: string) => {
    const file = uploadedFiles.get(type);
    if (!file) return;

    const expirationDate = expirationDates.get(type);
    await uploadMutation.mutateAsync({ type, file, expirationDate });
  };

  const getDocumentForType = (type: string) => {
    return documents.find(doc => doc.type === type);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const allRequiredDocumentsUploaded = REQUIRED_DOCUMENTS.every(doc => 
    getDocumentForType(doc.type) !== undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Management</h1>
        <p className="text-muted-foreground">
          Upload and manage your professional documents and certifications
        </p>
      </div>

      {profile?.status === 'pending' && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your application is currently under review. Please ensure all required documents are uploaded.
          </AlertDescription>
        </Alert>
      )}

      {!allRequiredDocumentsUploaded && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <Upload className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Please upload all required documents to complete your profile. 
            {REQUIRED_DOCUMENTS.filter(doc => !getDocumentForType(doc.type)).length} documents remaining.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              These documents are mandatory for your contractor profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const existingDoc = getDocumentForType(doc.type);
                const selectedFile = uploadedFiles.get(doc.type);

                return (
                  <div key={doc.type} className="border rounded-lg p-4" data-testid={`document-${doc.type}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <label className="font-medium">{doc.label}</label>
                          {existingDoc && getStatusBadge(existingDoc.status)}
                        </div>
                        
                        {existingDoc ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Uploaded: {format(new Date(existingDoc.uploadedAt), 'MMM dd, yyyy')}
                            </p>
                            {existingDoc.expirationDate && (
                              <p className="text-sm text-muted-foreground">
                                Expires: {format(new Date(existingDoc.expirationDate), 'MMM dd, yyyy')}
                              </p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMutation.mutate(existingDoc.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`delete-${doc.type}`}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Replace
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Accepted formats: {doc.accept}
                            </p>
                            <input
                              type="file"
                              accept={doc.accept}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelect(doc.type, e.target.files[0]);
                                }
                              }}
                              className="text-sm"
                              data-testid={`file-input-${doc.type}`}
                            />
                            
                            {(doc.type === "cdl" || doc.type === "dot_medical" || doc.type === "insurance") && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="date"
                                  placeholder="Expiration date"
                                  className="w-48"
                                  onChange={(e) => handleExpirationDate(doc.type, e.target.value)}
                                  data-testid={`expiry-${doc.type}`}
                                />
                              </div>
                            )}

                            {selectedFile && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Selected: {selectedFile.name}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpload(doc.type)}
                                  disabled={uploadMutation.isPending}
                                  data-testid={`upload-${doc.type}`}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optional Documents</CardTitle>
            <CardDescription>
              Additional documents that can strengthen your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {OPTIONAL_DOCUMENTS.map((doc) => {
                const existingDoc = getDocumentForType(doc.type);
                const selectedFile = uploadedFiles.get(doc.type);

                return (
                  <div key={doc.type} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <label className="font-medium">{doc.label}</label>
                          {existingDoc && <Badge variant="secondary">Uploaded</Badge>}
                        </div>
                        
                        {existingDoc ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Uploaded: {format(new Date(existingDoc.uploadedAt), 'MMM dd, yyyy')}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMutation.mutate(existingDoc.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Accepted formats: {doc.accept}
                            </p>
                            <input
                              type="file"
                              accept={doc.accept}
                              multiple={doc.type === "portfolio_photo"}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelect(doc.type, e.target.files[0]);
                                }
                              }}
                              className="text-sm"
                            />

                            {selectedFile && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Selected: {selectedFile.name}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpload(doc.type)}
                                  disabled={uploadMutation.isPending}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {allRequiredDocumentsUploaded && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All required documents have been uploaded! Your profile is complete.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}