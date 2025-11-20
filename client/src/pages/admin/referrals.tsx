import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, DollarSign, TrendingUp, Copy, Settings } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminReferrals() {
  const referralStats = {
    totalReferrals: 342,
    activeReferrers: 89,
    conversionRate: 23.5,
    totalPaid: 17100,
  };

  const topReferrers = [
    { id: 1, name: "John Smith", code: "JOHN123", referrals: 45, earned: 2250, status: "active" },
    { id: 2, name: "Mike Johnson", code: "MIKE456", referrals: 32, earned: 1600, status: "active" },
    { id: 3, name: "Sarah Davis", code: "SARAH789", referrals: 28, earned: 1400, status: "active" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Referral Program</h2>
          <Button data-testid="button-program-settings">
            <Settings className="mr-2 h-4 w-4" />
            Program Settings
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats.activeReferrers}</div>
              <p className="text-xs text-muted-foreground">Currently earning rewards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Referral to customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${referralStats.totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Lifetime rewards</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Program Rules</CardTitle>
              <CardDescription>Active referral incentives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Referrer Reward</Label>
                <div className="flex gap-2">
                  <Input defaultValue="50" className="w-24" data-testid="input-referrer-reward" />
                  <span className="flex items-center text-sm text-muted-foreground">
                    per successful referral
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Customer Discount</Label>
                <div className="flex gap-2">
                  <Input defaultValue="25" className="w-24" data-testid="input-customer-discount" />
                  <span className="flex items-center text-sm text-muted-foreground">
                    off first service
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimum Service Amount</Label>
                <div className="flex gap-2">
                  <Input defaultValue="100" className="w-24" data-testid="input-min-service" />
                  <span className="flex items-center text-sm text-muted-foreground">
                    to qualify for rewards
                  </span>
                </div>
              </div>
              <Button className="w-full" data-testid="button-update-rules">
                Update Rules
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generate Referral Code</CardTitle>
              <CardDescription>Create custom referral codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code-user">User Email</Label>
                <Input
                  id="code-user"
                  type="email"
                  placeholder="user@example.com"
                  data-testid="input-code-user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-code">Custom Code (optional)</Label>
                <Input
                  id="custom-code"
                  placeholder="Leave blank for auto-generate"
                  data-testid="input-custom-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code-limit">Usage Limit</Label>
                <Input
                  id="code-limit"
                  type="number"
                  defaultValue="0"
                  data-testid="input-code-limit"
                />
                <p className="text-xs text-muted-foreground">Set to 0 for unlimited</p>
              </div>
              <Button className="w-full" data-testid="button-generate-code">
                Generate Code
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Highest performing referral partners</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Referrals</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReferrers.map((referrer) => (
                  <TableRow key={referrer.id}>
                    <TableCell className="font-medium">{referrer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {referrer.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          data-testid={`button-copy-${referrer.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{referrer.referrals}</TableCell>
                    <TableCell className="text-right">${referrer.earned}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" data-testid={`button-view-${referrer.id}`}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}