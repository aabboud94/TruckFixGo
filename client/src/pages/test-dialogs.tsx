import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TestDialogs() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [longDialogOpen, setLongDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Dialog Component Test Page</h1>
      
      <div className="grid gap-4">
        {/* Regular Dialog Test */}
        <Card>
          <CardHeader>
            <CardTitle>Regular Dialog</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-open-dialog">
              Open Dialog
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="John Doe" data-testid="input-name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="john@example.com" data-testid="input-email" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" placeholder="Tell us about yourself" data-testid="textarea-bio" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button onClick={() => setDialogOpen(false)} data-testid="button-save">
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Long Content Dialog Test */}
        <Card>
          <CardHeader>
            <CardTitle>Long Content Dialog (Tests Scrolling)</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLongDialogOpen(true)} data-testid="button-open-long-dialog">
              Open Long Dialog
            </Button>
            
            <Dialog open={longDialogOpen} onOpenChange={setLongDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Terms and Conditions</DialogTitle>
                  <DialogDescription>
                    Please read through all the terms carefully
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i}>
                      <h3 className="font-semibold">Section {i + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                        nisi ut aliquip ex ea commodo consequat.
                      </p>
                    </div>
                  ))}
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setLongDialogOpen(false)} data-testid="button-decline">
                    Decline
                  </Button>
                  <Button onClick={() => setLongDialogOpen(false)} data-testid="button-accept">
                    Accept
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Alert Dialog Test */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Dialog</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-open-alert">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-alert-cancel">Cancel</AlertDialogCancel>
                  <AlertDialogAction data-testid="button-alert-continue">Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Sheet Test */}
        <Card>
          <CardHeader>
            <CardTitle>Sheet Component</CardTitle>
          </CardHeader>
          <CardContent className="space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" data-testid="button-open-sheet-right">
                  Open Right Sheet
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                  <SheetDescription>
                    Configure your application preferences
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Enter username" data-testid="input-username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notifications">Notifications</Label>
                    <select id="notifications" className="w-full p-2 border rounded">
                      <option>All</option>
                      <option>Important only</option>
                      <option>None</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <select id="theme" className="w-full p-2 border rounded">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>
                </div>
                <SheetFooter>
                  <Button type="submit" data-testid="button-save-settings">Save changes</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" data-testid="button-open-sheet-bottom">
                  Open Bottom Sheet
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Select Option</SheetTitle>
                  <SheetDescription>
                    Choose one of the following options
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-2">
                  <Button className="w-full" variant="outline">Option 1</Button>
                  <Button className="w-full" variant="outline">Option 2</Button>
                  <Button className="w-full" variant="outline">Option 3</Button>
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        {/* Mobile Instructions */}
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>✓ All dialogs should fit within mobile viewport</p>
            <p>✓ Long content should scroll smoothly</p>
            <p>✓ Close buttons should be easily accessible</p>
            <p>✓ Forms should have proper spacing</p>
            <p>✓ Buttons in footer should stack on mobile</p>
            <p>✓ Safe area padding should work on notched devices</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}