import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeadphonesIcon, MessageSquare, Mail, Phone, Search, ExternalLink, Clock, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminSupport() {
  const tickets = [
    { id: "T-1234", user: "john@trucking.com", subject: "Payment issue", status: "open", priority: "high", created: "10 min ago" },
    { id: "T-1233", user: "sarah@fleet.com", subject: "Can't find contractor", status: "in_progress", priority: "medium", created: "1 hour ago" },
    { id: "T-1232", user: "mike@logistics.com", subject: "App not loading", status: "open", priority: "low", created: "2 hours ago" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Support Tools</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                className="pl-8 w-[200px]"
                data-testid="input-search-tickets"
              />
            </div>
            <Button data-testid="button-new-ticket">
              <HeadphonesIcon className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">8 high priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 min</div>
              <p className="text-xs text-muted-foreground">-3 min from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Same day resolution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Live support sessions</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="live">Live Chat</TabsTrigger>
            <TabsTrigger value="tools">User Tools</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Tickets</CardTitle>
                <CardDescription>Manage customer support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono">{ticket.id}</TableCell>
                        <TableCell>{ticket.user}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge
                            variant={ticket.status === "open" ? "destructive" : "secondary"}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ticket.priority === "high"
                                ? "destructive"
                                : ticket.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.created}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Chat Sessions</CardTitle>
                <CardDescription>Active customer conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">John Smith</p>
                      <p className="text-sm text-muted-foreground">Issue with contractor no-show</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" data-testid="button-join-chat-1">
                      <MessageSquare className="mr-2 h-3 w-3" />
                      Join Chat
                    </Button>
                    <Button size="sm" variant="outline" data-testid="button-transfer-chat-1">
                      Transfer
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Fleet billing question</p>
                    </div>
                    <Badge variant="secondary">Waiting</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" data-testid="button-join-chat-2">
                      <MessageSquare className="mr-2 h-3 w-3" />
                      Join Chat
                    </Button>
                    <Button size="sm" variant="outline" data-testid="button-transfer-chat-2">
                      Transfer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Lookup</CardTitle>
                  <CardDescription>Search for user information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Email, phone, or user ID"
                    data-testid="input-user-lookup"
                  />
                  <Button className="w-full" data-testid="button-search-user">
                    Search User
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common support operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" data-testid="button-reset-password">
                    Reset User Password
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-refund">
                    Process Refund
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-unlock-account">
                    Unlock Account
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-cancel-job">
                    Cancel Job
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Send Notification</CardTitle>
                <CardDescription>Send message to user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="User email or ID" data-testid="input-notification-user" />
                <Textarea
                  placeholder="Message content..."
                  className="min-h-[100px]"
                  data-testid="input-notification-message"
                />
                <div className="flex gap-2">
                  <Button variant="outline" data-testid="button-send-email">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button variant="outline" data-testid="button-send-sms">
                    <Phone className="mr-2 h-4 w-4" />
                    Send SMS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Templates</CardTitle>
                <CardDescription>Pre-written responses for common issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">Payment Failed</p>
                      <Button size="sm" variant="ghost" data-testid="button-use-template-1">
                        Use
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We noticed your payment didn't go through. Please update your payment method
                      in the app to continue using our services.
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">Contractor Delayed</p>
                      <Button size="sm" variant="ghost" data-testid="button-use-template-2">
                        Use
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We apologize for the delay. Your contractor is on the way and should arrive
                      within the next 15 minutes. You can track them in real-time through the app.
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">Refund Processing</p>
                      <Button size="sm" variant="ghost" data-testid="button-use-template-3">
                        Use
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your refund has been processed and should appear in your account within 3-5
                      business days. Reference number: #REF-
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" data-testid="button-add-template">
                  Add New Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}