import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Settings, Ban, Save, Plus, Trash2 } from "lucide-react";
import type { ServiceType, BookingSettings } from "@shared/schema";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function AdminBookingSettings() {
  const [activeTab, setActiveTab] = useState("settings");
  const [editingSettings, setEditingSettings] = useState<Record<string, any>>({});
  
  // Fetch service types
  const { data: serviceTypes } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });
  
  // Fetch booking settings
  const { data: bookingSettings, isLoading: settingsLoading } = useQuery<BookingSettings[]>({
    queryKey: ["/api/admin/booking-settings"],
  });
  
  // Fetch blacklist
  const { data: blacklist, isLoading: blacklistLoading } = useQuery<Array<{
    id: string;
    date: string;
    serviceTypeId: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }>>({
    queryKey: ["/api/admin/booking-blacklist"],
  });
  
  // Save booking settings mutation
  const saveSettings = useMutation({
    mutationFn: async (settings: any[]) => {
      return apiRequest("POST", "/api/admin/booking-settings", { settings });
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Booking settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/booking-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });
  
  // Add blacklist entry mutation
  const addBlacklist = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/booking-blacklist", data);
    },
    onSuccess: () => {
      toast({
        title: "Blacklist Added",
        description: "Date/time has been blocked successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/booking-blacklist"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add blacklist entry",
        variant: "destructive",
      });
    },
  });
  
  // Delete blacklist entry mutation
  const deleteBlacklist = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/booking-blacklist/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Blacklist Removed",
        description: "Date/time block has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/booking-blacklist"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove blacklist entry",
        variant: "destructive",
      });
    },
  });
  
  const handleSettingChange = (serviceTypeId: string, day: number, field: string, value: any) => {
    setEditingSettings((prev) => ({
      ...prev,
      [`${serviceTypeId}-${day}-${field}`]: value,
    }));
  };
  
  const handleSaveSettings = () => {
    const settingsToSave: any[] = [];
    
    // Process edited settings
    serviceTypes?.forEach((service) => {
      DAYS_OF_WEEK.forEach((day) => {
        const key = `${service.id}-${day.value}`;
        const existing = bookingSettings?.find(
          (s) => s.serviceTypeId === service.id && s.dayOfWeek === day.value
        );
        
        const setting = {
          serviceTypeId: service.id,
          dayOfWeek: day.value,
          isActive: editingSettings[`${key}-isActive`] ?? existing?.isActive ?? true,
          startTime: editingSettings[`${key}-startTime`] ?? existing?.startTime ?? "09:00",
          endTime: editingSettings[`${key}-endTime`] ?? existing?.endTime ?? "17:00",
          slotDuration: editingSettings[`${key}-slotDuration`] ?? existing?.slotDuration ?? 60,
          bufferTime: editingSettings[`${key}-bufferTime`] ?? existing?.bufferTime ?? 15,
          maxBookingsPerSlot: editingSettings[`${key}-maxBookingsPerSlot`] ?? existing?.maxBookingsPerSlot ?? 1,
        };
        
        settingsToSave.push(setting);
      });
    });
    
    saveSettings.mutate(settingsToSave);
  };
  
  const [newBlacklist, setNewBlacklist] = useState({
    date: "",
    serviceTypeId: "",
    startTime: "",
    endTime: "",
    reason: "",
  });
  
  const handleAddBlacklist = () => {
    if (!newBlacklist.date || !newBlacklist.serviceTypeId) {
      toast({
        title: "Missing Information",
        description: "Date and service type are required",
        variant: "destructive",
      });
      return;
    }
    
    addBlacklist.mutate({
      ...newBlacklist,
      startTime: newBlacklist.startTime || null,
      endTime: newBlacklist.endTime || null,
    });
    
    setNewBlacklist({
      date: "",
      serviceTypeId: "",
      startTime: "",
      endTime: "",
      reason: "",
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Booking Configuration
          </CardTitle>
          <CardDescription>
            Manage scheduled booking availability, time slots, and blackout dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Time Slot Settings
              </TabsTrigger>
              <TabsTrigger value="blacklist" className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Blackout Dates
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-6 mt-6">
              {settingsLoading ? (
                <p>Loading settings...</p>
              ) : (
                <>
                  {serviceTypes?.map((service) => (
                    <Card key={service.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Day</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>End Time</TableHead>
                                <TableHead>Slot Duration (min)</TableHead>
                                <TableHead>Buffer (min)</TableHead>
                                <TableHead>Max Bookings</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {DAYS_OF_WEEK.map((day) => {
                                const key = `${service.id}-${day.value}`;
                                const existing = bookingSettings?.find(
                                  (s) => s.serviceTypeId === service.id && s.dayOfWeek === day.value
                                );
                                
                                return (
                                  <TableRow key={day.value}>
                                    <TableCell className="font-medium">{day.label}</TableCell>
                                    <TableCell>
                                      <Switch
                                        checked={editingSettings[`${key}-isActive`] ?? existing?.isActive ?? true}
                                        onCheckedChange={(checked) =>
                                          handleSettingChange(service.id, day.value, "isActive", checked)
                                        }
                                        data-testid={`switch-active-${key}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="time"
                                        value={editingSettings[`${key}-startTime`] ?? existing?.startTime ?? "09:00"}
                                        onChange={(e) =>
                                          handleSettingChange(service.id, day.value, "startTime", e.target.value)
                                        }
                                        className="w-24"
                                        data-testid={`input-start-${key}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="time"
                                        value={editingSettings[`${key}-endTime`] ?? existing?.endTime ?? "17:00"}
                                        onChange={(e) =>
                                          handleSettingChange(service.id, day.value, "endTime", e.target.value)
                                        }
                                        className="w-24"
                                        data-testid={`input-end-${key}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        min="15"
                                        max="240"
                                        step="15"
                                        value={editingSettings[`${key}-slotDuration`] ?? existing?.slotDuration ?? 60}
                                        onChange={(e) =>
                                          handleSettingChange(service.id, day.value, "slotDuration", parseInt(e.target.value))
                                        }
                                        className="w-20"
                                        data-testid={`input-duration-${key}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="60"
                                        step="5"
                                        value={editingSettings[`${key}-bufferTime`] ?? existing?.bufferTime ?? 15}
                                        onChange={(e) =>
                                          handleSettingChange(service.id, day.value, "bufferTime", parseInt(e.target.value))
                                        }
                                        className="w-20"
                                        data-testid={`input-buffer-${key}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={editingSettings[`${key}-maxBookingsPerSlot`] ?? existing?.maxBookingsPerSlot ?? 1}
                                        onChange={(e) =>
                                          handleSettingChange(service.id, day.value, "maxBookingsPerSlot", parseInt(e.target.value))
                                        }
                                        className="w-20"
                                        data-testid={`input-max-bookings-${key}`}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={saveSettings.isPending}
                      data-testid="button-save-settings"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveSettings.isPending ? "Saving..." : "Save All Settings"}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="blacklist" className="space-y-6 mt-6">
              {/* Add New Blacklist Entry */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Blackout Date/Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newBlacklist.date}
                          onChange={(e) => setNewBlacklist({ ...newBlacklist, date: e.target.value })}
                          data-testid="input-blacklist-date"
                        />
                      </div>
                      <div>
                        <Label>Service Type</Label>
                        <Select
                          value={newBlacklist.serviceTypeId}
                          onValueChange={(value) => setNewBlacklist({ ...newBlacklist, serviceTypeId: value })}
                        >
                          <SelectTrigger data-testid="select-blacklist-service">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes?.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Start Time (Optional)</Label>
                        <Input
                          type="time"
                          value={newBlacklist.startTime}
                          onChange={(e) => setNewBlacklist({ ...newBlacklist, startTime: e.target.value })}
                          data-testid="input-blacklist-start"
                        />
                      </div>
                      <div>
                        <Label>End Time (Optional)</Label>
                        <Input
                          type="time"
                          value={newBlacklist.endTime}
                          onChange={(e) => setNewBlacklist({ ...newBlacklist, endTime: e.target.value })}
                          data-testid="input-blacklist-end"
                        />
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Input
                          value={newBlacklist.reason}
                          onChange={(e) => setNewBlacklist({ ...newBlacklist, reason: e.target.value })}
                          placeholder="e.g., Holiday, Maintenance"
                          data-testid="input-blacklist-reason"
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleAddBlacklist}
                      disabled={addBlacklist.isPending}
                      data-testid="button-add-blacklist"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Blackout
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Existing Blacklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Blackout Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  {blacklistLoading ? (
                    <p>Loading blacklist...</p>
                  ) : blacklist && blacklist.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Time Range</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blacklist.map((entry) => {
                          const service = serviceTypes?.find((s) => s.id === entry.serviceTypeId);
                          return (
                            <TableRow key={entry.id}>
                              <TableCell>{entry.date}</TableCell>
                              <TableCell>{service?.name || entry.serviceTypeId}</TableCell>
                              <TableCell>
                                {entry.startTime && entry.endTime ? (
                                  <Badge variant="outline">
                                    {entry.startTime} - {entry.endTime}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">All Day</Badge>
                                )}
                              </TableCell>
                              <TableCell>{entry.reason || "-"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteBlacklist.mutate(entry.id)}
                                  disabled={deleteBlacklist.isPending}
                                  data-testid={`button-delete-blacklist-${entry.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No blackout dates configured</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}