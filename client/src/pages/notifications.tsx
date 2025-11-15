import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Plus,
  Filter,
  Calendar,
  TrendingUp,
  Send,
  Eye,
  MousePointer,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// Types
interface Reminder {
  id: string;
  type: string;
  message: string;
  nextSendDate: string;
  channel: 'sms' | 'email' | 'both';
  status: 'pending' | 'completed' | 'active';
  recipientEmail?: string;
  recipientPhone?: string;
  createdAt: string;
}

interface DeliveryLog {
  id: string;
  dateSent: string;
  type: string;
  channel: 'sms' | 'email' | 'push';
  status: 'success' | 'failed' | 'pending';
  recipient: string;
  message?: string;
  error?: string;
}

interface BlacklistEntry {
  id: string;
  contact: string;
  type: 'sms' | 'email' | 'all';
  dateAdded: string;
  reason?: string;
  addedBy?: string;
}

interface PushHistory {
  id: string;
  title: string;
  body: string;
  dateSent: string;
  platform: 'web' | 'mobile' | 'all';
  status: 'delivered' | 'failed' | 'pending';
  recipientCount?: number;
}

interface NotificationMetrics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failureRate?: number;
  todayCount?: number;
  weekCount?: number;
  monthCount?: number;
}

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
    case 'delivered':
    case 'completed':
    case 'active':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
    case 'failed':
    case 'rejected':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
    case 'pending':
    case 'processing':
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950';
  }
};

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'sms':
      return MessageSquare;
    case 'email':
      return Mail;
    case 'push':
    case 'both':
      return Bell;
    default:
      return Bell;
  }
};

export default function NotificationsManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("reminders");
  
  // Filters and pagination state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Add to blacklist dialog state
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [blacklistForm, setBlacklistForm] = useState({
    contact: "",
    type: "all" as 'sms' | 'email' | 'all',
  });

  // WebSocket setup for real-time notification updates
  const { isConnected } = useWebSocket({
    eventType: 'notifications',
    role: 'admin',
    onNotificationSent: (payload) => {
      console.log('Notification sent:', payload);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/reminders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/metrics'] });
      
      // Show toast notification
      if (payload) {
        toast({
          title: "Notification Sent",
          description: `${payload.channel || 'Notification'} sent to recipient`,
        });
      }
    },
    onNotificationDelivered: (payload) => {
      console.log('Notification delivered:', payload);
      // Invalidate logs query to show updated delivery status
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/metrics'] });
      
      // Show toast based on delivery status
      if (payload?.status === 'delivered') {
        toast({
          title: "Notification Delivered",
          description: "Notification successfully delivered to recipient",
        });
      } else if (payload?.status === 'failed') {
        toast({
          title: "Delivery Failed",
          description: payload?.error || "Failed to deliver notification",
          variant: "destructive",
        });
      }
    },
    onBlacklistUpdated: (payload) => {
      console.log('Blacklist updated:', payload);
      // Invalidate blacklist query
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/blacklist'] });
      
      // Show toast notification
      if (payload) {
        toast({
          title: "Blacklist Updated",
          description: payload.action === 'added' 
            ? `${payload.contact || 'Contact'} added to blacklist`
            : `${payload.contact || 'Contact'} removed from blacklist`,
        });
      }
    },
  });

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<NotificationMetrics>({
    queryKey: ['/api/notifications/metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch active reminders
  const { data: remindersData, isLoading: remindersLoading } = useQuery<{ reminders: Reminder[], total: number }>({
    queryKey: ['/api/notifications/reminders', currentPage],
    enabled: activeTab === 'reminders',
  });

  // Fetch delivery logs with filters
  const { data: logsData, isLoading: logsLoading } = useQuery<{ logs: DeliveryLog[], total: number }>({
    queryKey: ['/api/notifications/logs', statusFilter, dateRange, currentPage],
    enabled: activeTab === 'logs',
  });

  // Fetch blacklist
  const { data: blacklistData, isLoading: blacklistLoading, refetch: refetchBlacklist } = useQuery<{ blacklist?: BlacklistEntry[], entries?: BlacklistEntry[], total: number }>({
    queryKey: ['/api/notifications/blacklist', currentPage],
    enabled: activeTab === 'blacklist',
  });

  // Fetch push history
  const { data: pushHistoryData, isLoading: pushHistoryLoading } = useQuery<{ notifications?: PushHistory[], history?: PushHistory[], total: number }>({
    queryKey: ['/api/notifications/push-history', dateRange, currentPage],
    enabled: activeTab === 'push',
  });

  // Add to blacklist mutation
  const addToBlacklistMutation = useMutation({
    mutationFn: (data: typeof blacklistForm) => 
      apiRequest('/api/notifications/blacklist', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact added to blacklist",
      });
      setBlacklistDialogOpen(false);
      setBlacklistForm({ contact: "", type: "all" });
      refetchBlacklist();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add contact to blacklist",
        variant: "destructive",
      });
    },
  });

  // Remove from blacklist mutation
  const removeFromBlacklistMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/notifications/blacklist/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact removed from blacklist",
      });
      refetchBlacklist();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove contact from blacklist",
        variant: "destructive",
      });
    },
  });

  const handleAddToBlacklist = () => {
    if (!blacklistForm.contact) {
      toast({
        title: "Error",
        description: "Please enter a contact",
        variant: "destructive",
      });
      return;
    }
    addToBlacklistMutation.mutate(blacklistForm);
  };

  // Calculate total pages
  const getTotalPages = (total?: number) => {
    return Math.ceil((total || 0) / itemsPerPage);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications Management</h1>
          <p className="text-muted-foreground">
            Manage all aspects of your notification system
          </p>
        </div>
      </div>

      {/* Metrics Summary Card */}
      <Card data-testid="metrics-summary-card">
        <CardHeader>
          <CardTitle>Notification Metrics</CardTitle>
          <CardDescription>
            Real-time performance metrics for your notification system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Sent */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Sent</span>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{(metrics?.totalSent ?? 0).toLocaleString()}</div>
                {metrics?.todayCount !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {metrics.todayCount} today
                  </p>
                )}
              </div>

              {/* Delivery Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Delivery Rate</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{(metrics?.deliveryRate ?? 0).toFixed(1)}%</div>
                <Progress value={metrics?.deliveryRate ?? 0} className="h-2" />
              </div>

              {/* Open Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Open Rate</span>
                  <Eye className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{(metrics?.openRate ?? 0).toFixed(1)}%</div>
                <Progress value={metrics?.openRate ?? 0} className="h-2" />
              </div>

              {/* Click Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Click Rate</span>
                  <MousePointer className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">{(metrics?.clickRate ?? 0).toFixed(1)}%</div>
                <Progress value={metrics?.clickRate ?? 0} className="h-2" />
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No metrics available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-list">
          <TabsTrigger value="reminders" data-testid="tab-reminders">
            <Clock className="h-4 w-4 mr-2" />
            Active Reminders
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <Bell className="h-4 w-4 mr-2" />
            Delivery Logs
          </TabsTrigger>
          <TabsTrigger value="blacklist" data-testid="tab-blacklist">
            <Shield className="h-4 w-4 mr-2" />
            Blacklist
          </TabsTrigger>
          <TabsTrigger value="push" data-testid="tab-push">
            <Send className="h-4 w-4 mr-2" />
            Push History
          </TabsTrigger>
        </TabsList>

        {/* Active Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Reminders</CardTitle>
              <CardDescription>
                Scheduled and active notification reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {remindersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : remindersData?.reminders && remindersData.reminders.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Next Send Date</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remindersData.reminders.map((reminder) => {
                        const ChannelIcon = getChannelIcon(reminder.channel);
                        return (
                          <TableRow key={reminder.id} data-testid={`reminder-row-${reminder.id}`}>
                            <TableCell className="font-medium">{reminder.type}</TableCell>
                            <TableCell className="max-w-xs truncate">{reminder.message}</TableCell>
                            <TableCell>
                              {format(new Date(reminder.nextSendDate), 'PPP p')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ChannelIcon className="h-4 w-4" />
                                <span className="capitalize">{reminder.channel}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(reminder.status)}
                                data-testid={`reminder-status-${reminder.id}`}
                              >
                                {reminder.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, remindersData.total)} of{' '}
                      {remindersData.total} reminders
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="pagination-prev"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {getTotalPages(remindersData.total)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= getTotalPages(remindersData.total)}
                        data-testid="pagination-next"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No active reminders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Delivery Logs</CardTitle>
                  <CardDescription>
                    Track notification delivery status and history
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Range Filters */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="start-date" className="sr-only">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-[140px]"
                      data-testid="date-filter-start"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Label htmlFor="end-date" className="sr-only">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-[140px]"
                      data-testid="date-filter-end"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : logsData?.logs && logsData.logs.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date Sent</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recipient</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData.logs.map((log) => {
                        const ChannelIcon = getChannelIcon(log.channel);
                        const rowClass = log.status === 'success' 
                          ? 'bg-green-50/50 dark:bg-green-950/20' 
                          : log.status === 'failed' 
                          ? 'bg-red-50/50 dark:bg-red-950/20'
                          : '';
                        
                        return (
                          <TableRow
                            key={log.id}
                            className={rowClass}
                            data-testid={`log-row-${log.id}`}
                          >
                            <TableCell>
                              {format(new Date(log.dateSent), 'PPP p')}
                            </TableCell>
                            <TableCell className="font-medium">{log.type}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ChannelIcon className="h-4 w-4" />
                                <span className="capitalize">{log.channel}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(log.status)}
                                data-testid={`log-status-${log.id}`}
                              >
                                {log.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {log.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                                {log.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.recipient}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, logsData.total)} of{' '}
                      {logsData.total} logs
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="logs-pagination-prev"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {getTotalPages(logsData.total)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= getTotalPages(logsData.total)}
                        data-testid="logs-pagination-next"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No delivery logs found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blacklist Tab */}
        <TabsContent value="blacklist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blacklist Management</CardTitle>
                  <CardDescription>
                    Manage contacts that should not receive notifications
                  </CardDescription>
                </div>
                <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-blacklist">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Blacklist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Contact to Blacklist</DialogTitle>
                      <DialogDescription>
                        This contact will no longer receive notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact">Email or Phone Number</Label>
                        <Input
                          id="contact"
                          placeholder="email@example.com or +1234567890"
                          value={blacklistForm.contact}
                          onChange={(e) => setBlacklistForm(prev => ({ ...prev, contact: e.target.value }))}
                          data-testid="input-blacklist-contact"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Block Type</Label>
                        <Select
                          value={blacklistForm.type}
                          onValueChange={(value: 'sms' | 'email' | 'all') => 
                            setBlacklistForm(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger id="type" data-testid="select-blacklist-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Notifications</SelectItem>
                            <SelectItem value="email">Email Only</SelectItem>
                            <SelectItem value="sms">SMS Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setBlacklistDialogOpen(false)}
                        data-testid="button-cancel-blacklist"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddToBlacklist}
                        disabled={addToBlacklistMutation.isPending}
                        data-testid="button-confirm-blacklist"
                      >
                        Add to Blacklist
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {blacklistLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (blacklistData?.blacklist || blacklistData?.entries) && (blacklistData?.blacklist || blacklistData?.entries)!.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(blacklistData?.blacklist || blacklistData?.entries || []).map((entry) => (
                        <TableRow key={entry.id} data-testid={`blacklist-row-${entry.id}`}>
                          <TableCell className="font-medium">{entry.contact}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {entry.type === 'all' ? 'All Channels' : entry.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.dateAdded), 'PPP')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromBlacklistMutation.mutate(entry.id)}
                              disabled={removeFromBlacklistMutation.isPending}
                              data-testid={`button-remove-blacklist-${entry.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="ml-2">Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, blacklistData.total)} of{' '}
                      {blacklistData.total} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="blacklist-pagination-prev"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {getTotalPages(blacklistData.total)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= getTotalPages(blacklistData.total)}
                        data-testid="blacklist-pagination-next"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No blacklisted contacts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Push History Tab */}
        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Push Notification History</CardTitle>
                  <CardDescription>
                    Recent push notifications sent to users
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      end: new Date().toISOString().split('T')[0],
                    })}
                    data-testid="button-load-more-history"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Load Last 30 Days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pushHistoryLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (pushHistoryData?.notifications || pushHistoryData?.history) && (pushHistoryData?.notifications || pushHistoryData?.history)!.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Body</TableHead>
                        <TableHead>Date Sent</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(pushHistoryData?.notifications || pushHistoryData?.history || []).map((push) => (
                        <TableRow key={push.id} data-testid={`push-row-${push.id}`}>
                          <TableCell className="font-medium">{push.title}</TableCell>
                          <TableCell className="max-w-md truncate">{push.body}</TableCell>
                          <TableCell>
                            {format(new Date(push.dateSent), 'PPP p')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {push.platform}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(push.status)}
                              data-testid={`push-status-${push.id}`}
                            >
                              {push.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, pushHistoryData.total)} of{' '}
                      {pushHistoryData.total} push notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="push-pagination-prev"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {getTotalPages(pushHistoryData.total)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= getTotalPages(pushHistoryData.total)}
                        data-testid="push-pagination-next"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No push notifications sent in the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}