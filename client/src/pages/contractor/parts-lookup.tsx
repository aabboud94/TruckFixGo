import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  Package,
  MapPin,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  QrCode,
  Camera,
  ShieldCheck,
  Info,
  AlertCircle,
  Car,
  Wrench,
  DollarSign,
  History,
  Plus,
  Calendar,
  Truck,
} from "lucide-react";

// Parts request schema
const partsRequestSchema = z.object({
  partId: z.string().min(1, "Part is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  warehouseId: z.string().optional(),
  warrantyMonths: z.number().min(0).default(12),
  notes: z.string().optional(),
});

// Defect report schema
const defectReportSchema = z.object({
  partId: z.string().min(1, "Part is required"),
  jobId: z.string().min(1, "Job is required"),
  defectDescription: z.string().min(10, "Please provide a detailed description"),
  warrantyClaimRequested: z.boolean().default(false),
});

type PartsRequestData = z.infer<typeof partsRequestSchema>;
type DefectReportData = z.infer<typeof defectReportSchema>;

export default function PartsLookup() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isDefectDialogOpen, setIsDefectDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [scannedCode, setScannedCode] = useState("");
  const [partsCart, setPartsCart] = useState<any[]>([]);

  // Fetch compatible parts based on vehicle
  const { data: compatiblePartsData, isLoading: compatibleLoading, refetch: refetchCompatible } = useQuery({
    queryKey: ['/api/parts/compatibility', selectedMake, selectedModel, selectedYear],
    queryFn: async () => {
      if (!selectedMake || !selectedModel || !selectedYear) return null;
      
      const params = new URLSearchParams({
        make: selectedMake,
        model: selectedModel,
        year: selectedYear
      });
      
      const response = await fetch(`/api/parts/compatibility?${params}`);
      if (!response.ok) throw new Error('Failed to fetch compatible parts');
      return response.json();
    },
    enabled: !!selectedMake && !!selectedModel && !!selectedYear
  });

  // Search parts catalog
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/parts/catalog', searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('isActive', 'true');
      params.append('limit', '20');
      
      const response = await fetch(`/api/parts/catalog?${params}`);
      if (!response.ok) throw new Error('Failed to search parts');
      return response.json();
    },
    enabled: searchQuery.length > 2 || selectedCategory !== 'all'
  });

  // Get current job's parts
  const { data: jobPartsData, isLoading: jobPartsLoading } = useQuery({
    queryKey: ['/api/jobs', activeJobId, 'parts'],
    queryFn: async () => {
      if (!activeJobId) return null;
      const response = await fetch(`/api/jobs/${activeJobId}/parts`);
      if (!response.ok) throw new Error('Failed to fetch job parts');
      return response.json();
    },
    enabled: !!activeJobId && activeTab === 'current-job'
  });

  // Get part details by ID
  const { data: partDetails } = useQuery({
    queryKey: ['/api/parts', selectedPart?.id],
    queryFn: async () => {
      if (!selectedPart?.id) return null;
      const response = await fetch(`/api/parts/${selectedPart.id}`);
      if (!response.ok) throw new Error('Failed to fetch part details');
      return response.json();
    },
    enabled: !!selectedPart?.id
  });

  // Check inventory levels for selected part
  const { data: inventoryData } = useQuery({
    queryKey: ['/api/parts/inventory', selectedPart?.id],
    queryFn: async () => {
      if (!selectedPart?.id) return null;
      const params = new URLSearchParams({ partId: selectedPart.id });
      const response = await fetch(`/api/parts/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
    enabled: !!selectedPart?.id
  });

  // Parts request form
  const requestForm = useForm<PartsRequestData>({
    resolver: zodResolver(partsRequestSchema),
    defaultValues: {
      quantity: 1,
      warrantyMonths: 12,
      warehouseId: 'main'
    }
  });

  // Defect report form
  const defectForm = useForm<DefectReportData>({
    resolver: zodResolver(defectReportSchema),
    defaultValues: {
      warrantyClaimRequested: false
    }
  });

  // Request parts mutation
  const requestPartsMutation = useMutation({
    mutationFn: async (data: PartsRequestData & { jobId: string }) => {
      return apiRequest(`/api/jobs/${data.jobId}/parts`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Parts requested successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', activeJobId, 'parts'] });
      setIsRequestDialogOpen(false);
      setSelectedPart(null);
      requestForm.reset();
      setPartsCart([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Report defect mutation
  const reportDefectMutation = useMutation({
    mutationFn: async (data: DefectReportData) => {
      // This would typically call an API endpoint to report defects
      // For now, we'll simulate it
      return apiRequest('/api/parts/defects', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Defect reported successfully"
      });
      setIsDefectDialogOpen(false);
      defectForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle part selection
  const handleSelectPart = (part: any) => {
    setSelectedPart(part);
  };

  // Add part to cart
  const handleAddToCart = (part: any, quantity: number = 1) => {
    const existing = partsCart.find(item => item.partId === part.id);
    if (existing) {
      setPartsCart(partsCart.map(item => 
        item.partId === part.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setPartsCart([...partsCart, {
        partId: part.id,
        partName: part.name,
        partNumber: part.partNumber,
        quantity,
        unitPrice: part.sellingPrice,
        warrantyMonths: 12
      }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${part.name} x${quantity} added to parts request`
    });
  };

  // Remove from cart
  const handleRemoveFromCart = (partId: string) => {
    setPartsCart(partsCart.filter(item => item.partId !== partId));
  };

  // Calculate cart total
  const cartTotal = partsCart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Get availability badge
  const getAvailabilityBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge className="bg-red-500">Out of Stock</Badge>;
    } else if (quantity < 5) {
      return <Badge className="bg-yellow-500">Low Stock ({quantity})</Badge>;
    } else {
      return <Badge className="bg-green-500">In Stock ({quantity})</Badge>;
    }
  };

  // Handle barcode/QR scan
  const handleScan = (code: string) => {
    setScannedCode(code);
    setSearchQuery(code);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Parts Lookup & Request</h1>
          <p className="text-muted-foreground">Search parts, check availability, and request for jobs</p>
        </div>
        {partsCart.length > 0 && (
          <Button 
            onClick={() => setIsRequestDialogOpen(true)}
            size="lg"
            data-testid="button-view-cart"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Request Parts ({partsCart.length})
          </Button>
        )}
      </div>

      {/* Active Job Alert */}
      {!activeJobId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Job</AlertTitle>
          <AlertDescription>
            Select an active job to request parts or enter a job ID manually
          </AlertDescription>
          <div className="mt-2">
            <Input 
              placeholder="Enter Job ID"
              value={activeJobId || ''}
              onChange={(e) => setActiveJobId(e.target.value)}
              className="max-w-sm"
              data-testid="input-job-id"
            />
          </div>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="search" data-testid="tab-search">
            <Search className="w-4 h-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="vehicle" data-testid="tab-vehicle">
            <Car className="w-4 h-4 mr-2" />
            By Vehicle
          </TabsTrigger>
          <TabsTrigger value="current-job" data-testid="tab-current-job">
            <Wrench className="w-4 h-4 mr-2" />
            Current Job
          </TabsTrigger>
          <TabsTrigger value="warranties" data-testid="tab-warranties">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Warranties
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Parts Catalog</CardTitle>
              <CardDescription>Find parts by name, number, or barcode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by part name or number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-parts"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48" data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="engine">Engine</SelectItem>
                      <SelectItem value="transmission">Transmission</SelectItem>
                      <SelectItem value="brakes">Brakes</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="suspension">Suspension</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="exhaust">Exhaust</SelectItem>
                      <SelectItem value="tires">Tires</SelectItem>
                      <SelectItem value="fluids">Fluids</SelectItem>
                      <SelectItem value="filters">Filters</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" data-testid="button-scan">
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan
                  </Button>
                </div>

                {searchLoading && (
                  <div className="text-center py-8">Searching parts...</div>
                )}

                {searchResults?.parts && searchResults.parts.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.parts.map((part: any) => (
                      <Card key={part.id} className="hover-elevate cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{part.name}</h4>
                                <Badge variant="outline">{part.partNumber}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {part.manufacturer} • {part.category}
                              </p>
                              {part.description && (
                                <p className="text-sm mt-2">{part.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-lg font-bold">${part.sellingPrice?.toFixed(2)}</span>
                                {inventoryData?.inventory && (
                                  <span>{getAvailabilityBadge(inventoryData.inventory[0]?.quantity || 0)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectPart(part)}
                                data-testid={`button-details-${part.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(part)}
                                data-testid={`button-add-cart-${part.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {searchResults?.parts && searchResults.parts.length === 0 && (
                  <Alert>
                    <AlertDescription>No parts found matching your search</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Compatibility Tab */}
        <TabsContent value="vehicle">
          <Card>
            <CardHeader>
              <CardTitle>Find Parts by Vehicle</CardTitle>
              <CardDescription>Enter vehicle details to find compatible parts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Make</label>
                    <Input
                      placeholder="e.g., Freightliner"
                      value={selectedMake}
                      onChange={(e) => setSelectedMake(e.target.value)}
                      data-testid="input-vehicle-make"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input
                      placeholder="e.g., Cascadia"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      data-testid="input-vehicle-model"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <Input
                      placeholder="e.g., 2020"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      data-testid="input-vehicle-year"
                    />
                  </div>
                </div>

                {compatibleLoading && (
                  <div className="text-center py-8">Finding compatible parts...</div>
                )}

                {compatiblePartsData?.parts && compatiblePartsData.parts.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Compatible Parts</h3>
                    <div className="space-y-2">
                      {compatiblePartsData.parts.map((part: any) => (
                        <Card key={part.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{part.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {part.partNumber} • {part.manufacturer}
                                </p>
                                <p className="text-lg font-bold mt-2">${part.sellingPrice?.toFixed(2)}</p>
                              </div>
                              <Button
                                onClick={() => handleAddToCart(part)}
                                data-testid={`button-add-compatible-${part.id}`}
                              >
                                Add to Request
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {compatiblePartsData?.parts && compatiblePartsData.parts.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      No compatible parts found for {selectedMake} {selectedModel} {selectedYear}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Job Tab */}
        <TabsContent value="current-job">
          <Card>
            <CardHeader>
              <CardTitle>Current Job Parts</CardTitle>
              <CardDescription>Parts used or requested for job #{activeJobId}</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeJobId ? (
                <Alert>
                  <AlertDescription>Please enter a job ID to view job parts</AlertDescription>
                </Alert>
              ) : jobPartsLoading ? (
                <div className="text-center py-8">Loading job parts...</div>
              ) : jobPartsData?.parts && jobPartsData.parts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Warranty</TableHead>
                      <TableHead>Installed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobPartsData.parts.map((item: any) => (
                      <TableRow key={item.jobPart.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.part.name}</div>
                            <div className="text-sm text-muted-foreground">{item.part.partNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.jobPart.quantity}</TableCell>
                        <TableCell>${item.jobPart.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell>${(item.jobPart.quantity * item.jobPart.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>{item.jobPart.warrantyMonths} months</TableCell>
                        <TableCell>
                          {item.jobPart.installedAt 
                            ? new Date(item.jobPart.installedAt).toLocaleDateString()
                            : 'Not installed'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPart(item.part);
                              setIsDefectDialogOpen(true);
                            }}
                            data-testid={`button-report-defect-${item.jobPart.id}`}
                          >
                            Report Defect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total Parts Cost:
                      </TableCell>
                      <TableCell className="font-bold">
                        ${jobPartsData.parts.reduce((sum: number, item: any) => 
                          sum + (item.jobPart.quantity * item.jobPart.unitPrice), 0
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertDescription>No parts have been added to this job yet</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warranties Tab */}
        <TabsContent value="warranties">
          <Card>
            <CardHeader>
              <CardTitle>Parts Warranties</CardTitle>
              <CardDescription>View and manage part warranties</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>Warranty Information</AlertTitle>
                <AlertDescription>
                  All parts come with manufacturer warranties. Track warranty periods and claim procedures here.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Active Warranties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12</div>
                      <p className="text-xs text-muted-foreground">Parts under warranty</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Expiring Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">3</div>
                      <p className="text-xs text-muted-foreground">Within 30 days</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Recent Warranty Claims</h3>
                  <Alert>
                    <AlertDescription>No recent warranty claims</AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Part Details Panel */}
      {selectedPart && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedPart.name}</CardTitle>
                <CardDescription>{selectedPart.partNumber} • {selectedPart.manufacturer}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${selectedPart.sellingPrice?.toFixed(2)}</div>
                {inventoryData?.inventory && (
                  <div className="mt-1">{getAvailabilityBadge(inventoryData.inventory[0]?.quantity || 0)}</div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedPart.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPart.description}</p>
                </div>
              )}
              
              {selectedPart.specifications && (
                <div>
                  <h4 className="font-medium mb-1">Specifications</h4>
                  <div className="text-sm text-muted-foreground">
                    {typeof selectedPart.specifications === 'object' 
                      ? JSON.stringify(selectedPart.specifications, null, 2)
                      : selectedPart.specifications}
                  </div>
                </div>
              )}

              {inventoryData?.inventory && inventoryData.inventory.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Warehouse Availability</h4>
                  <div className="space-y-2">
                    {inventoryData.inventory.map((inv: any) => (
                      <div key={inv.id} className="flex justify-between items-center p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{inv.warehouseId}</span>
                          {inv.location && (
                            <Badge variant="outline">{inv.location}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{inv.quantity} units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleAddToCart(selectedPart)}
                  data-testid="button-add-selected"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPart(null)}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Parts for Job</DialogTitle>
            <DialogDescription>
              Review and submit parts request for job #{activeJobId}
            </DialogDescription>
          </DialogHeader>
          
          {!activeJobId ? (
            <Alert>
              <AlertDescription>Please enter a job ID before requesting parts</AlertDescription>
              <div className="mt-2">
                <Input
                  placeholder="Enter Job ID"
                  value={activeJobId || ''}
                  onChange={(e) => setActiveJobId(e.target.value)}
                  data-testid="input-dialog-job-id"
                />
              </div>
            </Alert>
          ) : (
            <div className="space-y-4 py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partsCart.map((item) => (
                    <TableRow key={item.partId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.partName}</div>
                          <div className="text-sm text-muted-foreground">{item.partNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value);
                            setPartsCart(partsCart.map(cartItem =>
                              cartItem.partId === item.partId
                                ? { ...cartItem, quantity: newQuantity }
                                : cartItem
                            ));
                          }}
                          className="w-20"
                          min="1"
                          data-testid={`input-quantity-${item.partId}`}
                        />
                      </TableCell>
                      <TableCell>${item.unitPrice?.toFixed(2)}</TableCell>
                      <TableCell>${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromCart(item.partId)}
                          data-testid={`button-remove-${item.partId}`}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total:
                    </TableCell>
                    <TableCell className="font-bold">
                      ${cartTotal.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes</label>
                <Textarea
                  placeholder="Add any special instructions or notes..."
                  data-testid="textarea-request-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestDialogOpen(false)}
              data-testid="button-cancel-request"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (activeJobId) {
                  // Submit all parts in cart
                  partsCart.forEach(item => {
                    requestPartsMutation.mutate({
                      jobId: activeJobId,
                      partId: item.partId,
                      quantity: item.quantity,
                      warehouseId: 'main',
                      warrantyMonths: item.warrantyMonths
                    });
                  });
                }
              }}
              disabled={!activeJobId || partsCart.length === 0 || requestPartsMutation.isPending}
              data-testid="button-submit-request"
            >
              {requestPartsMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Defect Report Dialog */}
      <Dialog open={isDefectDialogOpen} onOpenChange={setIsDefectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Defective Part</DialogTitle>
            <DialogDescription>
              Report a defective part for warranty claim or replacement
            </DialogDescription>
          </DialogHeader>
          
          <Form {...defectForm}>
            <form onSubmit={defectForm.handleSubmit((data) => reportDefectMutation.mutate(data))}>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Part</label>
                  <div className="mt-1 p-2 border rounded">
                    <div className="font-medium">{selectedPart?.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedPart?.partNumber}</div>
                  </div>
                </div>
                
                <FormField
                  control={defectForm.control}
                  name="defectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defect Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe the defect in detail..."
                          rows={4}
                          data-testid="textarea-defect-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={defectForm.control}
                  name="warrantyClaimRequested"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Request Warranty Claim</FormLabel>
                        <FormDescription>
                          Request a warranty claim for this defective part
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                          data-testid="checkbox-warranty-claim"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDefectDialogOpen(false)}
                  data-testid="button-cancel-defect"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={reportDefectMutation.isPending}
                  data-testid="button-submit-defect"
                >
                  {reportDefectMutation.isPending ? 'Reporting...' : 'Report Defect'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}