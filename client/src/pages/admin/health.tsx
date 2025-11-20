import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  Activity,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  HardDrive,
  Cpu,
  Wifi
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminSystemHealth() {
  const services = [
    { name: "API Server", status: "operational", uptime: "99.99%", responseTime: "45ms" },
    { name: "Database", status: "operational", uptime: "99.95%", responseTime: "12ms" },
    { name: "WebSocket Server", status: "operational", uptime: "99.90%", responseTime: "8ms" },
    { name: "Payment Gateway", status: "operational", uptime: "100%", responseTime: "120ms" },
    { name: "SMS Service", status: "degraded", uptime: "98.5%", responseTime: "450ms" },
    { name: "Email Service", status: "operational", uptime: "99.99%", responseTime: "200ms" },
  ];

  const recentIncidents = [
    { id: 1, service: "SMS Service", issue: "High latency", time: "2 hours ago", severity: "medium" },
    { id: 2, service: "Database", issue: "Connection spike", time: "Yesterday", severity: "low" },
    { id: 3, service: "API Server", issue: "Memory leak fixed", time: "3 days ago", severity: "high" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="button-refresh-health">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button data-testid="button-run-diagnostics">
              <Activity className="mr-2 h-4 w-4" />
              Run Diagnostics
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border p-4">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-lg font-medium">All Systems Operational</span>
          <Badge variant="default" className="ml-auto">
            Last checked: 2 min ago
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.95%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
              <Progress value={99.95} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87ms</div>
              <p className="text-xs text-muted-foreground">Average API response</p>
              <Progress value={87} max={500} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.12%</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
              <Progress value={0.12} max={5} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>Real-time service health monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {service.status === "operational" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : service.status === "degraded" ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm capitalize">{service.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{service.uptime}</TableCell>
                      <TableCell>{service.responseTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>Server resource consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span>CPU Usage</span>
                  </div>
                  <span className="font-medium">32%</span>
                </div>
                <Progress value={32} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>Memory Usage</span>
                  </div>
                  <span className="font-medium">64%</span>
                </div>
                <Progress value={64} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span>Disk Usage</span>
                  </div>
                  <span className="font-medium">45%</span>
                </div>
                <Progress value={45} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Database Connections</span>
                  </div>
                  <span className="font-medium">125/500</span>
                </div>
                <Progress value={25} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>System issues and resolutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        incident.severity === "high"
                          ? "bg-destructive/10"
                          : incident.severity === "medium"
                          ? "bg-yellow-500/10"
                          : "bg-blue-500/10"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          incident.severity === "high"
                            ? "text-destructive"
                            : incident.severity === "medium"
                            ? "text-yellow-500"
                            : "text-blue-500"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{incident.service}</p>
                      <p className="text-sm text-muted-foreground">{incident.issue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        incident.severity === "high"
                          ? "destructive"
                          : incident.severity === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {incident.severity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{incident.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" data-testid="button-view-all-incidents">
              View All Incidents
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>System maintenance operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-4">
            <Button variant="outline" data-testid="button-clear-cache">
              Clear Cache
            </Button>
            <Button variant="outline" data-testid="button-restart-workers">
              Restart Workers
            </Button>
            <Button variant="outline" data-testid="button-backup-database">
              Backup Database
            </Button>
            <Button variant="outline" data-testid="button-view-logs">
              View Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}