import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  Download,
  CreditCard,
  Building2,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Banknote,
  Award
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface EarningsData {
  summary: {
    availableBalance: number;
    pendingBalance: number;
    processingBalance: number;
    weekEarnings: number;
    monthEarnings: number;
    yearEarnings: number;
    totalEarnings: number;
    totalTips: number;
    totalBonuses: number;
    averageJobValue: number;
    jobsCompleted: number;
  };
  recentEarnings: Array<{
    id: string;
    jobId: string;
    jobNumber: string;
    date: string;
    serviceType: string;
    basePay: number;
    tips: number;
    bonuses: number;
    total: number;
    status: "pending" | "processing" | "paid";
    customerName: string;
  }>;
  payoutHistory: Array<{
    id: string;
    amount: number;
    requestedAt: string;
    processedAt?: string;
    status: "pending" | "processing" | "completed" | "failed";
    method: string;
    transactionId?: string;
  }>;
  paymentMethod: {
    type: "bank_account" | "debit_card";
    last4: string;
    bankName?: string;
    isDefault: boolean;
  };
  earningsChart: Array<{
    date: string;
    earnings: number;
    jobs: number;
  }>;
  bonusInfo: {
    performanceTier: "bronze" | "silver" | "gold";
    tierBonus: number;
    weeklyStreak: number;
    streakBonus: number;
    referralBonus: number;
  };
}

export default function ContractorEarnings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("month");
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("instant");

  // Fetch earnings data
  const { data: earningsData, isLoading, refetch } = useQuery<EarningsData>({
    queryKey: ["/api/contractor/earnings", timeFilter]
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async (data: { amount: number; method: string }) => {
      return await apiRequest("/api/contractor/payout", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted and will be processed soon."
      });
      setPayoutDialogOpen(false);
      setPayoutAmount("");
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Payout Failed",
        description: error.message || "Failed to request payout",
        variant: "destructive"
      });
    }
  });

  const exportEarnings = () => {
    const earnings = earningsData?.recentEarnings || [];
    if (earnings.length === 0) {
      toast({
        title: "No Data",
        description: "No earnings data to export",
        variant: "destructive"
      });
      return;
    }

    const csv = [
      ["Date", "Job Number", "Service Type", "Customer", "Base Pay", "Tips", "Bonuses", "Total", "Status"],
      ...earnings.map(e => [
        format(new Date(e.date), "MM/dd/yyyy"),
        e.jobNumber,
        e.serviceType,
        e.customerName,
        e.basePay.toFixed(2),
        e.tips.toFixed(2),
        e.bonuses.toFixed(2),
        e.total.toFixed(2),
        e.status
      ])
    ];

    const csvContent = csv.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Earnings data has been exported to CSV"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summary = earningsData?.summary;
  const recentEarnings = earningsData?.recentEarnings || [];
  const payoutHistory = earningsData?.payoutHistory || [];
  const paymentMethod = earningsData?.paymentMethod;
  const earningsChart = earningsData?.earningsChart || [];
  const bonusInfo = earningsData?.bonusInfo;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Earnings & Payouts</h1>
              <p className="text-muted-foreground">Track your earnings and manage payouts</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/contractor/dashboard")}
                data-testid="button-back-dashboard"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={exportEarnings}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-request-payout">
                    <CircleDollarSign className="w-4 h-4 mr-2" />
                    Request Payout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <DialogDescription>
                      Available balance: ${summary?.availableBalance?.toFixed(2) || '0.00'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payout-amount">Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="payout-amount"
                          type="number"
                          step="0.01"
                          min="10"
                          max={summary?.availableBalance}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="pl-10"
                          placeholder="0.00"
                          data-testid="input-payout-amount"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum payout: $10.00
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payout-method">Payout Method</Label>
                      <RadioGroup value={payoutMethod} onValueChange={setPayoutMethod}>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="instant" id="instant" />
                          <Label htmlFor="instant" className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">Instant Payout</p>
                              <p className="text-sm text-muted-foreground">
                                Get paid in 30 minutes (1.5% fee)
                              </p>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">Standard Payout</p>
                              <p className="text-sm text-muted-foreground">
                                Get paid in 2-3 business days (No fee)
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Payment Method</p>
                      <div className="flex items-center gap-2 mt-1">
                        {paymentMethod?.type === "bank_account" ? (
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">
                          {paymentMethod?.bankName || "Debit Card"} ••••{paymentMethod?.last4}
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="ml-auto p-0 h-auto"
                          onClick={() => navigate("/contractor/profile")}
                        >
                          Change
                        </Button>
                      </div>
                    </div>

                    {payoutMethod === "instant" && payoutAmount && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Payout Amount:</span>
                          <span>${parseFloat(payoutAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Processing Fee (1.5%):</span>
                          <span>-${(parseFloat(payoutAmount) * 0.015).toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>You'll Receive:</span>
                          <span>${(parseFloat(payoutAmount) * 0.985).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPayoutDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (payoutAmount && parseFloat(payoutAmount) >= 10) {
                          requestPayoutMutation.mutate({
                            amount: parseFloat(payoutAmount),
                            method: payoutMethod
                          });
                        }
                      }}
                      disabled={
                        !payoutAmount || 
                        parseFloat(payoutAmount) < 10 ||
                        parseFloat(payoutAmount) > (summary?.availableBalance || 0) ||
                        requestPayoutMutation.isPending
                      }
                      data-testid="button-confirm-payout"
                    >
                      {requestPayoutMutation.isPending ? "Processing..." : "Request Payout"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Banknote className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-available-balance">
                ${summary?.availableBalance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-green-600 dark:text-green-500">
                Ready for payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-balance">
                ${summary?.pendingBalance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Processing payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-month-earnings">
                ${summary?.monthEarnings?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.jobsCompleted || 0} jobs completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-earnings">
                ${summary?.totalEarnings?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                All-time earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bonuses & Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">${summary?.totalTips?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">Customer tips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">${summary?.totalBonuses?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">Performance bonuses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">${summary?.averageJobValue?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">Per job average</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Earnings Trend</CardTitle>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32" data-testid="select-time-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={earningsChart}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                  labelFormatter={(label) => format(new Date(label), 'PPP')}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEarnings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Tabs defaultValue="recent">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" data-testid="tab-recent">Recent Earnings</TabsTrigger>
            <TabsTrigger value="payouts" data-testid="tab-payouts">Payout History</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings</CardTitle>
                <CardDescription>Your earnings from completed jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Job #</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Base Pay</TableHead>
                        <TableHead className="text-right">Tips</TableHead>
                        <TableHead className="text-right">Bonus</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentEarnings.map((earning) => (
                        <TableRow key={earning.id}>
                          <TableCell>
                            {format(new Date(earning.date), 'MMM d')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {earning.jobNumber}
                          </TableCell>
                          <TableCell>{earning.serviceType}</TableCell>
                          <TableCell>{earning.customerName}</TableCell>
                          <TableCell className="text-right">
                            ${earning.basePay.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {earning.tips > 0 && (
                              <span className="text-green-600">
                                +${earning.tips.toFixed(2)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {earning.bonuses > 0 && (
                              <span className="text-blue-600">
                                +${earning.bonuses.toFixed(2)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${earning.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              earning.status === 'paid' ? 'default' :
                              earning.status === 'processing' ? 'secondary' :
                              'outline'
                            }>
                              {earning.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Your previous payout requests</CardDescription>
              </CardHeader>
              <CardContent>
                {payoutHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No payout history</p>
                    <p className="text-sm mt-1">Your payout requests will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {payoutHistory.map((payout) => (
                        <Card key={payout.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-lg">
                                    ${payout.amount.toFixed(2)}
                                  </span>
                                  <Badge variant={
                                    payout.status === 'completed' ? 'default' :
                                    payout.status === 'processing' ? 'secondary' :
                                    payout.status === 'failed' ? 'destructive' :
                                    'outline'
                                  }>
                                    {payout.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Requested: {format(new Date(payout.requestedAt), 'PPP')}
                                </p>
                                {payout.processedAt && (
                                  <p className="text-sm text-muted-foreground">
                                    Processed: {format(new Date(payout.processedAt), 'PPP')}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Method: {payout.method} • Transaction: {payout.transactionId || 'N/A'}
                                </p>
                              </div>
                              <div>
                                {payout.status === 'completed' && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {payout.status === 'processing' && (
                                  <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
                                )}
                                {payout.status === 'failed' && (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bonus Information */}
        {bonusInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Bonus & Incentives</CardTitle>
              <CardDescription>Your performance bonuses and streaks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tier Bonus</span>
                    <Badge className={`${
                      bonusInfo.performanceTier === 'gold' ? 'bg-yellow-500' :
                      bonusInfo.performanceTier === 'silver' ? 'bg-gray-400' :
                      'bg-orange-600'
                    } text-white`}>
                      {bonusInfo.performanceTier.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">${bonusInfo.tierBonus.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Weekly Streak</span>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{bonusInfo.weeklyStreak} weeks</p>
                  <p className="text-xs text-muted-foreground">+${bonusInfo.streakBonus.toFixed(2)} bonus</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Referral Bonus</span>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">${bonusInfo.referralBonus.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total earned</p>
                </div>

                <div className="p-3 border rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Next Tier</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm">Complete 5 more jobs</p>
                  <p className="text-xs text-muted-foreground">To reach {
                    bonusInfo.performanceTier === 'bronze' ? 'Silver' :
                    bonusInfo.performanceTier === 'silver' ? 'Gold' :
                    'Platinum'
                  }</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}