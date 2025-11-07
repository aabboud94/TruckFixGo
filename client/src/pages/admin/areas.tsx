import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminServiceAreas() {
  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Service Areas</h2>
          <Button data-testid="button-add-area">
            <Plus className="mr-2 h-4 w-4" />
            Add Service Area
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Dallas-Fort Worth</CardTitle>
                <Badge variant="default">Active</Badge>
              </div>
              <CardDescription>Primary service area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>75 mile radius</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Contractors: </span>
                  <span className="font-medium">45 active</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Surcharge: </span>
                  <span className="font-medium">$0 base</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" data-testid="button-edit-area">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" data-testid="button-delete-area">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Houston</CardTitle>
                <Badge variant="default">Active</Badge>
              </div>
              <CardDescription>Secondary service area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>50 mile radius</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Contractors: </span>
                  <span className="font-medium">32 active</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Surcharge: </span>
                  <span className="font-medium">$25 base</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" data-testid="button-edit-area">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" data-testid="button-delete-area">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">San Antonio</CardTitle>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <CardDescription>Expansion area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>40 mile radius</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Contractors: </span>
                  <span className="font-medium">12 recruited</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Surcharge: </span>
                  <span className="font-medium">$50 base</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" data-testid="button-edit-area">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" data-testid="button-activate-area">
                  Activate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}