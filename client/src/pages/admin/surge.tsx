import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, TrendingUp, Clock, MapPin, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminSurgePricing() {
  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Surge Pricing</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="surge-enabled" defaultChecked data-testid="switch-surge-enabled" />
              <Label htmlFor="surge-enabled">Surge Pricing Enabled</Label>
            </div>
            <Button data-testid="button-save-surge">Save Changes</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Surge</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold">1.5x</div>
                <Badge variant="destructive">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">In 3 areas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Demand Areas</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Above threshold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hours Active</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Time-based surges</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+18%</div>
              <p className="text-xs text-muted-foreground">From surge pricing</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Triggers</CardTitle>
              <CardDescription>Conditions that activate surge pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>High Demand Threshold</Label>
                  <Badge variant="outline">1.2x - 2.0x</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Jobs per hour</span>
                    <span>10+ jobs</span>
                  </div>
                  <Slider defaultValue={[10]} max={50} step={5} data-testid="slider-demand-threshold" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Low Contractor Availability</Label>
                  <Badge variant="outline">1.3x - 2.5x</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Available contractors</span>
                    <span>&lt; 5 contractors</span>
                  </div>
                  <Slider defaultValue={[5]} max={20} step={1} data-testid="slider-contractor-threshold" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Weather Events</Label>
                  <Switch defaultChecked data-testid="switch-weather-surge" />
                </div>
                <Select defaultValue="1.5">
                  <SelectTrigger data-testid="select-weather-multiplier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.2">1.2x multiplier</SelectItem>
                    <SelectItem value="1.5">1.5x multiplier</SelectItem>
                    <SelectItem value="2.0">2.0x multiplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time-Based Surge</CardTitle>
              <CardDescription>Scheduled surge pricing periods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Weekday Rush</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span>6:00 AM - 9:00 AM</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Surge: </span>
                    <span>1.3x</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Weekend Nights</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span>10:00 PM - 2:00 AM</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Surge: </span>
                    <span>1.5x</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full" data-testid="button-add-time-surge">
                Add Time Period
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Surge Areas</CardTitle>
            <CardDescription>Real-time surge pricing by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Dallas Downtown", "Fort Worth Airport", "Houston Port"].map((area, index) => (
                <div key={area} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                      <Zap className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">{area}</p>
                      <p className="text-sm text-muted-foreground">
                        12 jobs waiting • 3 contractors available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{index === 0 ? "1.8x" : "1.5x"}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-override-${area.toLowerCase().replace(' ', '-')}`}
                    >
                      Override
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Surge Limits</CardTitle>
            <CardDescription>Maximum surge multipliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max-surge">Global Maximum</Label>
                <Input
                  id="max-surge"
                  type="number"
                  defaultValue="3.0"
                  step="0.1"
                  data-testid="input-max-surge"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fleet-max">Fleet Account Maximum</Label>
                <Input
                  id="fleet-max"
                  type="number"
                  defaultValue="1.5"
                  step="0.1"
                  data-testid="input-fleet-max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-threshold">Notification Threshold</Label>
                <Input
                  id="notification-threshold"
                  type="number"
                  defaultValue="1.5"
                  step="0.1"
                  data-testid="input-notification-threshold"
                />
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm">
                  Surge pricing above 2.0x requires manual approval and sends alerts to all admins
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}