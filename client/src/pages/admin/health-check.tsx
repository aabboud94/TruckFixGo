import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Mail, Database, Server, Shield, Globe, Cpu, Clock, Activity } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface HealthCheckItem {
  name: string;
  endpoint: string;
  status: 'checking' | 'healthy' | 'unhealthy' | 'warning';
  message?: string;
  details?: any;
  icon: any;
}

export default function HealthCheck() {
  const [checks, setChecks] = useState<HealthCheckItem[]>([
    { name: 'Email Service', endpoint: '/api/health/email', status: 'checking', icon: Mail },
    { name: 'Database', endpoint: '/api/health/database', status: 'checking', icon: Database },
    { name: 'Server', endpoint: '/api/health', status: 'checking', icon: Server },
    { name: 'WebSocket', endpoint: '/api/health/websocket', status: 'checking', icon: Globe },
    { name: 'Authentication', endpoint: '/api/health/auth', status: 'checking', icon: Shield },
    { name: 'Storage', endpoint: '/api/health/storage', status: 'checking', icon: Database },
    { name: 'System', endpoint: '/api/health/system', status: 'checking', icon: Cpu },
    { name: 'Errors', endpoint: '/api/health/errors', status: 'checking', icon: Activity }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  const runHealthChecks = async () => {
    setIsChecking(true);
    const updatedChecks = [...checks];
    
    for (let i = 0; i < updatedChecks.length; i++) {
      const check = updatedChecks[i];
      check.status = 'checking';
      setChecks([...updatedChecks]);
      
      try {
        const response = await fetch(check.endpoint);
        const data = await response.json();
        
        if (response.ok) {
          check.status = data.status === 'unhealthy' ? 'unhealthy' : 'healthy';
          check.message = data.message || 'Service is operational';
          check.details = data;
        } else {
          check.status = 'unhealthy';
          check.message = data.message || `HTTP ${response.status} error`;
          check.details = data;
        }
      } catch (error) {
        check.status = 'unhealthy';
        check.message = 'Failed to connect to service';
        check.details = { error: (error as Error).message };
      }
      
      updatedChecks[i] = check;
      setChecks([...updatedChecks]);
    }
    
    setIsChecking(false);
    setLastCheck(new Date());
    
    const unhealthyCount = updatedChecks.filter(c => c.status === 'unhealthy').length;
    const warningCount = updatedChecks.filter(c => c.status === 'warning').length;
    
    if (unhealthyCount === 0 && warningCount === 0) {
      toast({
        title: "All Systems Operational",
        description: "All health checks passed successfully",
      });
    } else if (unhealthyCount > 0) {
      toast({
        title: "System Issues Detected",
        description: `${unhealthyCount} service(s) are unhealthy`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Warnings Detected",
        description: `${warningCount} service(s) have warnings`,
      });
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" data-testid="icon-healthy" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" data-testid="icon-unhealthy" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" data-testid="icon-warning" />;
      default:
        return <RefreshCw className="h-5 w-5 animate-spin text-gray-400" data-testid="icon-checking" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-healthy">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive" data-testid="badge-unhealthy">Unhealthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800" data-testid="badge-warning">Warning</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-checking">Checking...</Badge>;
    }
  };

  const overallStatus = checks.every(c => c.status === 'healthy') ? 'healthy' : 
                       checks.some(c => c.status === 'unhealthy') ? 'unhealthy' : 
                       checks.some(c => c.status === 'warning') ? 'warning' : 'checking';

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Production Health Check</CardTitle>
              <CardDescription>
                Monitor the status of all critical services
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {overallStatus === 'healthy' && (
                <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2" data-testid="status-overall-healthy">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  All Systems Operational
                </Badge>
              )}
              {overallStatus === 'unhealthy' && (
                <Badge variant="destructive" className="text-lg px-4 py-2" data-testid="status-overall-unhealthy">
                  <XCircle className="h-5 w-5 mr-2" />
                  Issues Detected
                </Badge>
              )}
              {overallStatus === 'warning' && (
                <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2" data-testid="status-overall-warning">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Warnings Present
                </Badge>
              )}
              <Button 
                onClick={runHealthChecks} 
                disabled={isChecking}
                data-testid="button-run-checks"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Checks
                  </>
                )}
              </Button>
            </div>
          </div>
          {lastCheck && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Last checked: {lastCheck.toLocaleString()}
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((check, index) => (
          <Card key={check.name} data-testid={`card-check-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <check.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{check.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  {getStatusBadge(check.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {check.message && (
                <p className="text-sm text-muted-foreground mb-2" data-testid={`text-message-${index}`}>
                  {check.message}
                </p>
              )}
              
              {check.details && check.status !== 'checking' && (
                <div className="bg-muted/50 rounded p-3 text-xs font-mono">
                  {check.name === 'Email Service' && check.details.configured !== undefined && (
                    <div className="space-y-1">
                      <div>Environment: {check.details.environment}</div>
                      <div>Configured: {check.details.configured ? 'Yes' : 'No'}</div>
                      <div>Ready: {check.details.ready ? 'Yes' : 'No'}</div>
                      {check.details.credentials && (
                        <>
                          <div>Email: {check.details.credentials.email}</div>
                          <div>Password: {check.details.credentials.password}</div>
                        </>
                      )}
                      {check.details.fix_instructions && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200">
                          <div className="font-bold mb-1">Fix Required:</div>
                          {Object.entries(check.details.fix_instructions).map(([step, instruction]) => (
                            <div key={step}>{step}: {instruction as string}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {check.name === 'Database' && check.details.connected !== undefined && (
                    <div className="space-y-1">
                      <div>Connected: {check.details.connected ? 'Yes' : 'No'}</div>
                      <div>Provider: {check.details.provider || 'Unknown'}</div>
                      {check.details.tables !== undefined && (
                        <div>Tables: {check.details.tables}</div>
                      )}
                    </div>
                  )}
                  
                  {check.name === 'System' && check.details.memory && (
                    <div className="space-y-1">
                      <div>Memory: {Math.round(check.details.memory.used / 1024 / 1024)}MB / {Math.round(check.details.memory.total / 1024 / 1024)}MB</div>
                      <div>CPU Load: {check.details.cpu?.loadAverage?.join(', ')}</div>
                      <div>Uptime: {Math.round((check.details.uptime || 0) / 60)} minutes</div>
                      <div>Node: {check.details.node?.version}</div>
                    </div>
                  )}
                  
                  {check.name === 'Errors' && check.details.errorCount !== undefined && (
                    <div className="space-y-1">
                      <div>Total Errors: {check.details.errorCount}</div>
                      <div>Recent Errors: {check.details.recentErrors?.length || 0}</div>
                      {check.details.errorRate !== undefined && (
                        <div>Error Rate: {check.details.errorRate}%</div>
                      )}
                    </div>
                  )}
                  
                  {!['Email Service', 'Database', 'System', 'Errors'].includes(check.name) && (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}