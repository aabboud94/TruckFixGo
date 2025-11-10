import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  MapPin, User, Phone, Mail, Truck, Calendar, DollarSign,
  Plus, Edit, Trash2, Save, Check, Upload, Camera, FileText,
  Wrench, Clock, Package, AlertCircle
} from "lucide-react";
import { format } from "date-fns";

// Line item type
interface LineItem {
  id: string;
  type: "part" | "labor" | "fee";
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Job data type
interface JobData {
  id: string;
  jobNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  serviceType: string;
  vehicle: {
    vin?: string;
    unit?: string;
    make?: string;
    model?: string;
    year?: string;
  };
  status: string;
  createdAt: string;
}

// Line item form schema
const lineItemSchema = z.object({
  type: z.enum(["part", "labor", "fee"]),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0.01, "Price must be greater than 0"),
});

type LineItemFormData = z.infer<typeof lineItemSchema>;

export default function JobCompletion() {
  const { id: jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showLineItemDialog, setShowLineItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery<JobData>({
    queryKey: [`/api/contractor/jobs/${jobId}`],
    enabled: !!jobId,
  });

  // Fetch default line items
  const { data: defaultCharges } = useQuery({
    queryKey: ["/api/admin/invoice-defaults"],
  });

  // Initialize default line items
  useEffect(() => {
    if (defaultCharges && lineItems.length === 0) {
      const defaults = defaultCharges
        .filter((charge: any) => charge.applyByDefault && charge.active)
        .map((charge: any) => ({
          id: `default-${Date.now()}-${Math.random()}`,
          type: charge.type as "part" | "labor" | "fee",
          description: charge.name,
          quantity: 1,
          unitPrice: charge.amount,
          total: charge.amount,
        }));
      setLineItems(defaults);
    }
  }, [defaultCharges, lineItems.length]);

  // Line item form
  const lineItemForm = useForm<LineItemFormData>({
    resolver: zodResolver(lineItemSchema),
    defaultValues: {
      type: "part",
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (showLineItemDialog) {
      if (editingItem) {
        lineItemForm.reset({
          type: editingItem.type,
          description: editingItem.description,
          quantity: editingItem.quantity,
          unitPrice: editingItem.unitPrice,
        });
      } else {
        lineItemForm.reset({
          type: "part",
          description: "",
          quantity: 1,
          unitPrice: 0,
        });
      }
    }
  }, [showLineItemDialog, editingItem, lineItemForm]);

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      // Get signature as base64
      let signatureData = null;
      if (canvasRef.current && hasSignature && !isDraft) {
        signatureData = canvasRef.current.toDataURL();
      }

      // Create FormData for photo upload
      const formData = new FormData();
      formData.append("completionNotes", completionNotes);
      formData.append("lineItems", JSON.stringify(lineItems));
      if (signatureData) {
        formData.append("signature", signatureData);
      }
      formData.append("isDraft", isDraft.toString());

      uploadedPhotos.forEach((photo) => {
        formData.append("photos", photo);
      });

      return apiRequest(`/api/contractor/jobs/${jobId}/complete`, "POST", formData);
    },
    onSuccess: (data, isDraft) => {
      toast({
        title: isDraft ? "Draft saved" : "Job completed successfully",
        description: isDraft 
          ? "Your progress has been saved" 
          : "Invoice has been generated and sent to customer",
      });
      if (!isDraft) {
        navigate(`/contractor/invoices/${jobId}`);
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete job. Please try again.",
      });
    },
  });

  // Handle line item form submission
  const handleLineItemSubmit = (data: LineItemFormData) => {
    const total = data.quantity * data.unitPrice;
    const newItem: LineItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      ...data,
      total,
    };

    if (editingItem) {
      setLineItems(lineItems.map(item => 
        item.id === editingItem.id ? newItem : item
      ));
    } else {
      setLineItems([...lineItems, newItem]);
    }

    setShowLineItemDialog(false);
    setEditingItem(null);
    lineItemForm.reset();
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
    }
  };

  // Delete line item
  const deleteLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
    setShowDeleteConfirm(null);
  };

  // Signature pad handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x = "touches" in e 
      ? e.touches[0].clientX - rect.left 
      : e.nativeEvent.offsetX;
    const y = "touches" in e 
      ? e.touches[0].clientY - rect.top 
      : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x = "touches" in e 
      ? e.touches[0].clientX - rect.left 
      : e.nativeEvent.offsetX;
    const y = "touches" in e 
      ? e.touches[0].clientY - rect.top 
      : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded-md w-1/3"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">Job not found</p>
              <Button onClick={() => navigate("/contractor/jobs")}>
                Back to Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Complete Job</h1>
            <p className="text-muted-foreground">Job #{job.jobNumber}</p>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            {job.status}
          </Badge>
        </div>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{job.customer.name}</p>
                    <p className="text-sm text-muted-foreground">Customer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{job.customer.phone}</p>
                    <p className="text-sm text-muted-foreground">Phone</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{job.customer.email}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{job.location.address}</p>
                    <p className="text-sm text-muted-foreground">Location</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{job.serviceType}</p>
                    <p className="text-sm text-muted-foreground">Service Type</p>
                  </div>
                </div>
                {job.vehicle && (
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {job.vehicle.unit || job.vehicle.vin || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {job.vehicle.make && job.vehicle.model 
                          ? `${job.vehicle.year || ""} ${job.vehicle.make} ${job.vehicle.model}`
                          : "Vehicle"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Completion Notes
            </CardTitle>
            <CardDescription>Required - Describe the work performed</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Describe the repairs/services performed, parts replaced, and any recommendations for future maintenance..."
              className="min-h-[120px]"
              data-testid="textarea-completion-notes"
            />
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Documentation Photos
            </CardTitle>
            <CardDescription>Upload photos of completed work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Upload ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index))}
                    data-testid={`button-remove-photo-${index}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Label 
                htmlFor="photo-upload" 
                className="flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted transition-colors"
                data-testid="label-photo-upload"
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </div>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                  data-testid="input-photo-upload"
                />
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Line Items
                </CardTitle>
                <CardDescription>Add parts, labor, and fees</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setShowLineItemDialog(true);
                }}
                data-testid="button-add-line-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No line items added yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-line-item-${item.id}`}>
                      <TableCell>
                        <Badge variant="outline">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(item);
                              setShowLineItemDialog(true);
                            }}
                            data-testid={`button-edit-item-${item.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(item.id)}
                            data-testid={`button-delete-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="mt-6 space-y-2">
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span data-testid="text-total-amount">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Pad */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Contractor Signature
                </CardTitle>
                <CardDescription>Sign to confirm job completion</CardDescription>
              </div>
              {hasSignature && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  data-testid="button-clear-signature"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full border rounded-md cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              data-testid="canvas-signature"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/contractor/jobs")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => completeJobMutation.mutate(true)}
              disabled={completeJobMutation.isPending}
              data-testid="button-save-draft"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => completeJobMutation.mutate(false)}
              disabled={
                !completionNotes || 
                lineItems.length === 0 || 
                !hasSignature || 
                completeJobMutation.isPending
              }
              data-testid="button-mark-complete"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </div>

        {/* Line Item Dialog */}
        <Dialog open={showLineItemDialog} onOpenChange={setShowLineItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Line Item" : "Add Line Item"}
              </DialogTitle>
              <DialogDescription>
                Enter the details for this line item
              </DialogDescription>
            </DialogHeader>
            <Form {...lineItemForm}>
              <form onSubmit={lineItemForm.handleSubmit(handleLineItemSubmit)} className="space-y-4">
                <FormField
                  control={lineItemForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-line-item-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="part">Part</SelectItem>
                          <SelectItem value="labor">Labor</SelectItem>
                          <SelectItem value="fee">Fee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={lineItemForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter description"
                          data-testid="input-line-item-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={lineItemForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            step="1"
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-line-item-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={lineItemForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-line-item-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowLineItemDialog(false)}
                    data-testid="button-cancel-line-item"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-save-line-item">
                    {editingItem ? "Update" : "Add"} Item
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Line Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this line item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(null)}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => showDeleteConfirm && deleteLineItem(showDeleteConfirm)}
                data-testid="button-confirm-delete"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}