import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Truck,
  BarChart3,
  Camera,
  Upload,
  Edit,
  Eye,
  DollarSign,
  Archive,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Boxes,
  History,
  FileText,
  QrCode,
} from "lucide-react";

// Part form schema
const partFormSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  name: z.string().min(1, "Part name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  unitCost: z.number().min(0, "Unit cost must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  imageUrl: z.string().optional(),
  specifications: z.string().optional(),
  isActive: z.boolean().default(true),
  // Compatibility fields
  compatibleMake: z.string().optional(),
  compatibleModel: z.string().optional(),
  compatibleYear: z.number().optional(),
});

// Inventory adjustment schema
const inventoryAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.number().min(0, "Quantity must be positive"),
  transactionType: z.string().min(1, "Transaction type is required"),
  notes: z.string().optional(),
});

// Purchase order schema
const purchaseOrderSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierContact: z.string().optional(),
  expectedDeliveryDays: z.number().min(1, "Expected delivery days is required"),
});

type PartFormData = z.infer<typeof partFormSchema>;
type InventoryAdjustmentData = z.infer<typeof inventoryAdjustmentSchema>;
type PurchaseOrderData = z.infer<typeof purchaseOrderSchema>;

export default function PartsInventory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | undefined>();
  const [showInactive, setShowInactive] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedPartsForOrder, setSelectedPartsForOrder] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("catalog");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch parts catalog
  const { data: catalogData, isLoading: catalogLoading, refetch: refetchCatalog } = useQuery({
    queryKey: ['/api/parts/catalog', searchQuery, selectedCategory, selectedManufacturer, showInactive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedManufacturer) params.append('manufacturer', selectedManufacturer);
      params.append('isActive', (!showInactive).toString());
      
      const response = await fetch(`/api/parts/catalog?${params}`);
      if (!response.ok) throw new Error('Failed to fetch parts catalog');
      return response.json();
    }
  });

  // Fetch inventory levels
  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['/api/parts/inventory', showInactive],
    queryFn: async () => {
      const response = await fetch(`/api/parts/inventory?includeInactive=${showInactive}`);
      if (!response.ok) throw new Error('Failed to fetch inventory levels');
      return response.json();
    }
  });

  // Fetch reorder needs
  const { data: reorderData, isLoading: reorderLoading } = useQuery({
    queryKey: ['/api/parts/reorder'],
    queryFn: async () => {
      const response = await fetch('/api/parts/reorder');
      if (!response.ok) throw new Error('Failed to fetch reorder needs');
      return response.json();
    },
    enabled: activeTab === 'reorder'
  });

  // Fetch purchase orders
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/parts/orders'],
    queryFn: async () => {
      const response = await fetch('/api/parts/orders');
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      return response.json();
    },
    enabled: activeTab === 'orders'
  });

  // Fetch inventory valuation
  const { data: valuationData, isLoading: valuationLoading } = useQuery({
    queryKey: ['/api/reports/inventory-value'],
    queryFn: async () => {
      const response = await fetch('/api/reports/inventory-value');
      if (!response.ok) throw new Error('Failed to fetch inventory valuation');
      return response.json();
    },
    enabled: activeTab === 'analytics'
  });

  // Part form
  const partForm = useForm<PartFormData>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      isActive: true,
    }
  });

  // Inventory adjustment form
  const adjustmentForm = useForm<InventoryAdjustmentData>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      warehouseId: 'main',
      transactionType: 'adjustment'
    }
  });

  // Purchase order form
  const orderForm = useForm<PurchaseOrderData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      expectedDeliveryDays: 7
    }
  });

  // Add/update part mutation
  const partMutation = useMutation({
    mutationFn: async (data: PartFormData & { id?: string }) => {
      const url = data.id ? `/api/parts/${data.id}` : '/api/parts';
      const method = data.id ? 'PUT' : 'POST';
      
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: selectedPart ? "Part updated successfully" : "Part added successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/catalog'] });
      setIsPartDialogOpen(false);
      setSelectedPart(null);
      partForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Inventory adjustment mutation
  const adjustmentMutation = useMutation({
    mutationFn: async (data: InventoryAdjustmentData & { partId: string }) => {
      return apiRequest('PUT', `/api/parts/${data.partId}/stock`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory adjusted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/inventory'] });
      setIsAdjustmentDialogOpen(false);
      setSelectedPart(null);
      adjustmentForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create purchase order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: PurchaseOrderData & { items: any[] }) => {
      return apiRequest('POST', '/api/parts/orders', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase order created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/orders'] });
      setIsOrderDialogOpen(false);
      setSelectedPartsForOrder([]);
      orderForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Receive order mutation
  const receiveOrderMutation = useMutation({
    mutationFn: async ({ orderId, receivedItems, trackingNumber }: any) => {
      return apiRequest('PUT', `/api/parts/orders/${orderId}/receive`, { receivedItems, trackingNumber });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order received successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts/inventory'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle part edit
  const handleEditPart = (part: any) => {
    setSelectedPart(part);
    partForm.reset({
      partNumber: part.partNumber,
      name: part.name,
      description: part.description,
      category: part.category,
      manufacturer: part.manufacturer,
      unitCost: part.unitCost,
      sellingPrice: part.sellingPrice,
      imageUrl: part.imageUrl,
      specifications: JSON.stringify(part.specifications),
      isActive: part.isActive,
      compatibleMake: part.compatibleMake,
      compatibleModel: part.compatibleModel,
      compatibleYear: part.compatibleYear,
    });
    setIsPartDialogOpen(true);
  };

  // Handle inventory adjustment
  const handleAdjustInventory = (part: any) => {
    setSelectedPart(part);
    adjustmentForm.reset();
    setIsAdjustmentDialogOpen(true);
  };

  // Handle add to purchase order
  const handleAddToOrder = (part: any) => {
    if (!selectedPartsForOrder.find(p => p.partId === part.id)) {
      setSelectedPartsForOrder([...selectedPartsForOrder, {
        partId: part.id,
        partName: part.name,
        quantity: part.reorderQuantity || 10,
        unitCost: part.unitCost
      }]);
    }
  };

  // Calculate markup percentage
  const calculateMarkup = (cost: number, price: number) => {
    if (!cost || cost === 0) return 0;
    return ((price - cost) / cost * 100).toFixed(1);
  };

  // Get stock status badge
  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge className="bg-green-500">In Stock</Badge>;
      case 'low-stock':
        return <Badge className="bg-yellow-500">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge className="bg-red-500">Out of Stock</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get order status badge
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-gray-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'ordered':
        return <Badge className="bg-blue-500"><ShoppingCart className="w-3 h-3 mr-1" />Ordered</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500"><Truck className="w-3 h-3 mr-1" />Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Parts Inventory Management</h1>
          <p className="text-muted-foreground">Manage parts catalog, inventory levels, and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetchCatalog()} 
            variant="outline"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              setSelectedPart(null);
              partForm.reset();
              setIsPartDialogOpen(true);
            }}
            data-testid="button-add-part"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{catalogData?.parts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${valuationData?.valuation?.totalValue || '0'}</div>
            <p className="text-xs text-muted-foreground">Total valuation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inventoryData?.inventory?.filter((i: any) => i.stockStatus === 'low-stock').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersData?.orders?.filter((o: any) => o.status !== 'delivered').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="catalog" data-testid="tab-catalog">
            <Package className="w-4 h-4 mr-2" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Boxes className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reorder" data-testid="tab-reorder">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reorder
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Catalog Tab */}
        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Parts Catalog</CardTitle>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Search parts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                    data-testid="input-search"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40" data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
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
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showInactive}
                      onCheckedChange={setShowInactive}
                      data-testid="switch-show-inactive"
                    />
                    <label className="text-sm">Show inactive</label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="text-center py-8">Loading parts catalog...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Markup</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogData?.parts?.map((part: any) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-mono">{part.partNumber}</TableCell>
                        <TableCell>{part.name}</TableCell>
                        <TableCell>{part.category}</TableCell>
                        <TableCell>{part.manufacturer}</TableCell>
                        <TableCell>${part.unitCost?.toFixed(2)}</TableCell>
                        <TableCell>${part.sellingPrice?.toFixed(2)}</TableCell>
                        <TableCell>{calculateMarkup(part.unitCost, part.sellingPrice)}%</TableCell>
                        <TableCell>
                          <Badge variant={part.isActive ? "default" : "secondary"}>
                            {part.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPart(part)}
                              data-testid={`button-edit-${part.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdjustInventory(part)}
                              data-testid={`button-adjust-${part.id}`}
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory Levels</CardTitle>
              <CardDescription>Real-time stock levels across all warehouses</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="text-center py-8">Loading inventory levels...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Restocked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData?.inventory?.map((item: any) => (
                      <TableRow key={item.inventory.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.part.name}</div>
                            <div className="text-sm text-muted-foreground">{item.part.partNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.inventory.warehouseId}</TableCell>
                        <TableCell>{item.inventory.quantity}</TableCell>
                        <TableCell>{item.inventory.reorderLevel}</TableCell>
                        <TableCell>{item.inventory.location || '-'}</TableCell>
                        <TableCell>
                          {item.inventory.lastRestocked 
                            ? new Date(item.inventory.lastRestocked).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(item.stockStatus)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustInventory(item.part)}
                            data-testid={`button-adjust-inventory-${item.inventory.id}`}
                          >
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reorder Tab */}
        <TabsContent value="reorder">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Parts Needing Reorder</CardTitle>
                  <CardDescription>Items below reorder level</CardDescription>
                </div>
                {selectedPartsForOrder.length > 0 && (
                  <Button onClick={() => setIsOrderDialogOpen(true)} data-testid="button-create-order">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Create Order ({selectedPartsForOrder.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reorderLoading ? (
                <div className="text-center py-8">Loading reorder needs...</div>
              ) : reorderData?.parts?.length === 0 ? (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    All parts are adequately stocked. No reordering needed at this time.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Suggested Qty</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reorderData?.parts?.map((item: any) => (
                      <TableRow key={item.part.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.part.name}</div>
                            <div className="text-sm text-muted-foreground">{item.part.partNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.inventory.reorderLevel}</TableCell>
                        <TableCell>{item.quantityToOrder}</TableCell>
                        <TableCell>${item.estimatedCost?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.urgency === 'critical' ? 'destructive' : 
                                   item.urgency === 'high' ? 'default' : 'secondary'}
                          >
                            {item.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAddToOrder(item.part)}
                            data-testid={`button-add-to-order-${item.part.id}`}
                          >
                            Add to Order
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Purchase Orders</CardTitle>
                <Button onClick={() => setIsOrderDialogOpen(true)} data-testid="button-new-order">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">Loading purchase orders...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Ordered Date</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData?.orders?.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.orderNumber}</TableCell>
                        <TableCell>{order.supplierName}</TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell>${order.totalCost?.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(order.orderedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {order.expectedDelivery 
                            ? new Date(order.expectedDelivery).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                // Handle receive order
                              }}
                              data-testid={`button-receive-${order.id}`}
                            >
                              Receive
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-6">
            {/* Inventory Valuation */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Valuation</CardTitle>
                <CardDescription>Current inventory value using {valuationData?.valuation?.method} method</CardDescription>
              </CardHeader>
              <CardContent>
                {valuationLoading ? (
                  <div className="text-center py-8">Loading valuation...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Cost Value</div>
                        <div className="text-2xl font-bold">${valuationData?.valuation?.totalValue}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Retail Value</div>
                        <div className="text-2xl font-bold">${valuationData?.valuation?.totalRetailValue}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Potential Profit</div>
                        <div className="text-2xl font-bold text-green-600">${valuationData?.valuation?.potentialProfit}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Profit Margin</div>
                        <div className="text-2xl font-bold">{valuationData?.valuation?.profitMargin}%</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Top Value Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Part</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Total Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {valuationData?.valuation?.breakdown?.slice(0, 5).map((item: any) => (
                            <TableRow key={item.partId}>
                              <TableCell>{item.partName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.unitCost?.toFixed(2)}</TableCell>
                              <TableCell>${item.totalValue?.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Part Dialog */}
      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPart ? 'Edit Part' : 'Add New Part'}</DialogTitle>
            <DialogDescription>
              {selectedPart ? 'Update part information' : 'Add a new part to the catalog'}
            </DialogDescription>
          </DialogHeader>
          <Form {...partForm}>
            <form onSubmit={partForm.handleSubmit((data) => 
              partMutation.mutate({ ...data, id: selectedPart?.id })
            )}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <FormField
                  control={partForm.control}
                  name="partNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-part-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-part-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-part-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partForm.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-manufacturer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-unit-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partForm.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-selling-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 col-span-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable this part for ordering and inventory tracking
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-part-active"
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
                  onClick={() => setIsPartDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={partMutation.isPending} data-testid="button-save-part">
                  {partMutation.isPending ? 'Saving...' : 'Save Part'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Inventory Adjustment Dialog */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              Adjust inventory level for {selectedPart?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...adjustmentForm}>
            <form onSubmit={adjustmentForm.handleSubmit((data) => 
              adjustmentMutation.mutate({ ...data, partId: selectedPart?.id })
            )}>
              <div className="space-y-4 py-4">
                <FormField
                  control={adjustmentForm.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-warehouse">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="main">Main Warehouse</SelectItem>
                          <SelectItem value="north">North Location</SelectItem>
                          <SelectItem value="south">South Location</SelectItem>
                          <SelectItem value="east">East Location</SelectItem>
                          <SelectItem value="west">West Location</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adjustmentForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-adjustment-quantity"
                        />
                      </FormControl>
                      <FormDescription>Enter the new total quantity</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adjustmentForm.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="adjustment">Adjustment</SelectItem>
                          <SelectItem value="restocked">Restocked</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={adjustmentForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="textarea-adjustment-notes" />
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
                  onClick={() => setIsAdjustmentDialogOpen(false)}
                  data-testid="button-cancel-adjustment"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adjustmentMutation.isPending} data-testid="button-save-adjustment">
                  {adjustmentMutation.isPending ? 'Saving...' : 'Save Adjustment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Purchase Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for selected parts
            </DialogDescription>
          </DialogHeader>
          <Form {...orderForm}>
            <form onSubmit={orderForm.handleSubmit((data) => 
              createOrderMutation.mutate({ ...data, items: selectedPartsForOrder })
            )}>
              <div className="space-y-4 py-4">
                <FormField
                  control={orderForm.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-supplier-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={orderForm.control}
                  name="supplierContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Phone or email" data-testid="input-supplier-contact" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={orderForm.control}
                  name="expectedDeliveryDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-delivery-days"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedPartsForOrder.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Order Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPartsForOrder.map((item) => (
                          <TableRow key={item.partId}>
                            <TableCell>{item.partName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitCost?.toFixed(2)}</TableCell>
                            <TableCell>${(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOrderDialogOpen(false)}
                  data-testid="button-cancel-order"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createOrderMutation.isPending} data-testid="button-create-order-submit">
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}