import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Mail, MessageSquare, Save, TestTube, Eye, Edit, Plus,
  Trash2, Send, Copy, FileText, Loader2, Smartphone, Code
} from "lucide-react";

const TEMPLATE_CATEGORIES = {
  job: "Job Notifications",
  payment: "Payment & Billing",
  marketing: "Marketing",
  system: "System Notifications",
};

const AVAILABLE_VARIABLES = {
  customer: ["{{customerName}}", "{{customerEmail}}", "{{customerPhone}}"],
  job: ["{{jobId}}", "{{jobType}}", "{{jobStatus}}", "{{jobLocation}}", "{{jobPrice}}"],
  contractor: ["{{contractorName}}", "{{contractorPhone}}", "{{contractorCompany}}"],
  vehicle: ["{{vehicleVin}}", "{{vehicleUnit}}", "{{vehicleType}}"],
  platform: ["{{platformName}}", "{{supportEmail}}", "{{supportPhone}}"],
};

export default function AdminTemplates() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Query for templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/admin/templates', { category: selectedCategory }],
  });

  // Mutation for saving template
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/admin/templates/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
      setShowEditDialog(false);
      toast({
        title: "Template saved",
        description: "Email/SMS template has been updated successfully",
      });
    },
  });

  // Mutation for sending test
  const sendTestMutation = useMutation({
    mutationFn: async ({ templateId, recipient }: any) => {
      return apiRequest('/api/admin/templates/test', {
        method: 'POST',
        body: JSON.stringify({ templateId, recipient }),
      });
    },
    onSuccess: () => {
      setShowTestDialog(false);
      toast({
        title: "Test sent",
        description: "Test message has been sent successfully",
      });
    },
  });

  const templatesData = templates?.data || [
    {
      id: "TPL-001",
      name: "Job Confirmation Email",
      type: "email",
      category: "job",
      subject: "Your TruckFixGo Job #{{jobId}} is Confirmed",
      content: `Hi {{customerName}},

Your emergency repair request has been confirmed!

Job Details:
- Job ID: {{jobId}}
- Service: {{jobType}}
- Location: {{jobLocation}}
- Estimated Cost: {{jobPrice}}

A contractor will be assigned to your job shortly. You'll receive another notification when they're on their way.

Track your job in real-time at: {{trackingUrl}}

Need assistance? Contact us at {{supportPhone}} or {{supportEmail}}.

Thank you for choosing {{platformName}}!`,
      variables: ["customerName", "jobId", "jobType", "jobLocation", "jobPrice", "trackingUrl", "supportPhone", "supportEmail", "platformName"],
      enabled: true,
      lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "TPL-002",
      name: "Contractor Assignment SMS",
      type: "sms",
      category: "job",
      subject: null,
      content: `{{platformName}}: New job assigned! #{{jobId}} at {{jobLocation}}. Customer: {{customerName}} ({{customerPhone}}). Accept in app or reply YES.`,
      variables: ["platformName", "jobId", "jobLocation", "customerName", "customerPhone"],
      enabled: true,
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "TPL-003",
      name: "Payment Receipt",
      type: "email",
      category: "payment",
      subject: "Payment Receipt for Job #{{jobId}}",
      content: `Dear {{customerName}},

Thank you for your payment!

Payment Details:
- Amount: {{paymentAmount}}
- Method: {{paymentMethod}}
- Transaction ID: {{transactionId}}
- Date: {{paymentDate}}

Job Information:
- Job ID: {{jobId}}
- Service: {{jobType}}
- Contractor: {{contractorName}}

This receipt serves as confirmation of your payment. Please keep it for your records.

Best regards,
{{platformName}} Team`,
      variables: ["customerName", "paymentAmount", "paymentMethod", "transactionId", "paymentDate", "jobId", "jobType", "contractorName", "platformName"],
      enabled: true,
      lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  const insertVariable = (variable: string) => {
    if (!editedContent) return;
    
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = editedContent.substring(0, start) + variable + editedContent.substring(end);
    setEditedContent(newContent);
  };

  const previewTemplate = (template: any) => {
    // Replace variables with sample data
    let preview = template.content;
    const sampleData: any = {
      customerName: "John Smith",
      customerEmail: "john@example.com",
      customerPhone: "(555) 123-4567",
      jobId: "JOB-12345",
      jobType: "Emergency Repair",
      jobLocation: "I-95 Mile Marker 142, Miami, FL",
      jobPrice: "$450",
      contractorName: "Mike Johnson",
      contractorPhone: "(555) 987-6543",
      contractorCompany: "Mike's Mobile Repair",
      platformName: "TruckFixGo",
      supportEmail: "support@truckfixgo.com",
      supportPhone: "1-800-FIX-TRUCK",
      trackingUrl: "https://truckfixgo.com/track/JOB-12345",
      paymentAmount: "$450.00",
      paymentMethod: "Credit Card",
      transactionId: "TXN-789456123",
      paymentDate: new Date().toLocaleDateString(),
    };

    Object.keys(sampleData).forEach(key => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), sampleData[key]);
    });

    return preview;
  };

  return (
    <AdminLayout 
      title="Email & SMS Templates"
      breadcrumbs={[{ label: "Templates" }]}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory("all")}
              >
                All Templates
              </Button>
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>Manage email and SMS templates with variable placeholders</CardDescription>
              </div>
              <Button data-testid="button-add-template">
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {templatesData.map((template: any) => (
                  <Card key={template.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant={template.type === 'email' ? 'default' : 'secondary'}>
                              {template.type === 'email' ? (
                                <Mail className="mr-1 h-3 w-3" />
                              ) : (
                                <Smartphone className="mr-1 h-3 w-3" />
                              )}
                              {template.type}
                            </Badge>
                            <Badge variant={template.enabled ? 'success' : 'secondary'}>
                              {template.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                          {template.subject && (
                            <p className="text-sm font-medium">Subject: {template.subject}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.content}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-2">
                            {template.variables.slice(0, 5).map((variable: string) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                            {template.variables.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowPreviewDialog(true);
                            }}
                            data-testid={`button-preview-${template.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setEditedContent(template.content);
                              setShowEditDialog(true);
                            }}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowTestDialog(true);
                            }}
                            data-testid={`button-test-${template.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template - {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Edit the template content and use variable placeholders for dynamic content
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  defaultValue={selectedTemplate.name}
                  data-testid="input-template-name"
                />
              </div>

              {selectedTemplate.type === 'email' && (
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    defaultValue={selectedTemplate.subject}
                    data-testid="input-template-subject"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Content</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <p className="text-sm text-muted-foreground w-full">Quick insert variables:</p>
                  {Object.entries(AVAILABLE_VARIABLES).map(([category, vars]) => (
                    <div key={category} className="flex gap-1">
                      {vars.slice(0, 3).map(variable => (
                        <Button
                          key={variable}
                          size="sm"
                          variant="outline"
                          onClick={() => insertVariable(variable)}
                        >
                          <Code className="mr-1 h-3 w-3" />
                          {variable}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
                <Textarea
                  name="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  data-testid="textarea-template-content"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="enabled">Enable Template</Label>
                  <input
                    type="checkbox"
                    id="enabled"
                    defaultChecked={selectedTemplate.enabled}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                saveTemplateMutation.mutate({
                  id: selectedTemplate?.id,
                  content: editedContent,
                });
              }}
              disabled={saveTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {saveTemplateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview - {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              This is how the message will appear with sample data
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.type === 'email' && selectedTemplate.subject && (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {previewTemplate({ content: selectedTemplate.subject })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Content</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {previewTemplate(selectedTemplate)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Send Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test - {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Send a test {selectedTemplate?.type} to verify the template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Recipient {selectedTemplate?.type === 'email' ? 'Email' : 'Phone Number'}
              </Label>
              <Input
                type={selectedTemplate?.type === 'email' ? 'email' : 'tel'}
                placeholder={selectedTemplate?.type === 'email' ? 'test@example.com' : '+1234567890'}
                data-testid="input-test-recipient"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                sendTestMutation.mutate({
                  templateId: selectedTemplate?.id,
                  recipient: 'test@example.com',
                });
              }}
              disabled={sendTestMutation.isPending}
              data-testid="button-send-test"
            >
              {sendTestMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}