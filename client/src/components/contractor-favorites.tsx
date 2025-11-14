import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  HeartOff, 
  Star, 
  MoreVertical, 
  User, 
  Building, 
  Phone, 
  Mail,
  MessageSquare,
  Shield,
  ShieldOff,
  Loader2,
  UserX,
  Search,
  Filter,
  TrendingUp
} from "lucide-react";
import { useFavoriteContractors, useBlacklistedContractors } from "@/hooks/use-booking-preferences";

interface ContractorFavoritesProps {
  onSelectContractor?: (contractorId: string) => void;
  showBlacklist?: boolean;
}

export function ContractorFavorites({ 
  onSelectContractor, 
  showBlacklist = true 
}: ContractorFavoritesProps) {
  const { 
    favorites, 
    isLoading: favoritesLoading, 
    addFavorite, 
    removeFavorite,
    isAdding,
    isRemoving
  } = useFavoriteContractors();
  
  const {
    blacklist,
    isLoading: blacklistLoading,
    blacklistContractor,
    unblacklistContractor,
    isBlacklisting,
    isUnblacklisting
  } = useBlacklistedContractors();

  const [searchQuery, setSearchQuery] = useState("");
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");

  const handleAddFavorite = (contractorId: string, notes?: string) => {
    addFavorite({ contractorId, notes });
    setAddNoteDialogOpen(false);
    setNotes("");
  };

  const handleBlacklist = (contractorId: string, reason?: string) => {
    blacklistContractor({ contractorId, reason });
    setBlacklistDialogOpen(false);
    setBlacklistReason("");
  };

  const filteredFavorites = favorites.filter(
    (fav) => {
      if (!searchQuery) return true;
      const contractor = fav.contractor;
      const profile = fav.profile;
      const searchLower = searchQuery.toLowerCase();
      
      return (
        contractor?.firstName?.toLowerCase().includes(searchLower) ||
        contractor?.lastName?.toLowerCase().includes(searchLower) ||
        contractor?.email?.toLowerCase().includes(searchLower) ||
        profile?.companyName?.toLowerCase().includes(searchLower)
      );
    }
  );

  const filteredBlacklist = blacklist.filter(
    (item) => {
      if (!searchQuery) return true;
      const contractor = item.contractor;
      const searchLower = searchQuery.toLowerCase();
      
      return (
        contractor?.firstName?.toLowerCase().includes(searchLower) ||
        contractor?.lastName?.toLowerCase().includes(searchLower) ||
        contractor?.email?.toLowerCase().includes(searchLower) ||
        item.reason?.toLowerCase().includes(searchLower)
      );
    }
  );

  const ContractorCard = ({ 
    contractor, 
    profile, 
    notes, 
    isFavorite = false,
    isBlacklisted = false,
    blacklistReason = null 
  }: any) => {
    const initials = contractor ? 
      `${contractor.firstName?.[0] || ''}${contractor.lastName?.[0] || ''}`.toUpperCase() : 
      '??';

    return (
      <Card className="hover-elevate">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contractor?.id}`} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {contractor?.firstName} {contractor?.lastName}
                  </h4>
                  {isFavorite && (
                    <Badge variant="secondary" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      Favorite
                    </Badge>
                  )}
                  {isBlacklisted && (
                    <Badge variant="destructive" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Blocked
                    </Badge>
                  )}
                </div>
                
                {profile?.companyName && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {profile.companyName}
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {contractor?.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {contractor?.phone}
                  </span>
                </div>
                
                {profile && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {profile.averageRating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {profile.totalJobsCompleted} jobs completed
                    </div>
                    {profile.performanceTier && (
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {profile.performanceTier}
                      </Badge>
                    )}
                  </div>
                )}
                
                {(notes || blacklistReason) && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <div className="flex items-start gap-1">
                      <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {notes || blacklistReason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-menu-${contractor?.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {onSelectContractor && !isBlacklisted && (
                  <DropdownMenuItem 
                    onClick={() => onSelectContractor(contractor?.id)}
                    data-testid={`menu-select-${contractor?.id}`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Select for Booking
                  </DropdownMenuItem>
                )}
                
                {isFavorite ? (
                  <DropdownMenuItem 
                    onClick={() => removeFavorite(contractor?.id)}
                    className="text-destructive"
                    data-testid={`menu-unfavorite-${contractor?.id}`}
                  >
                    <HeartOff className="mr-2 h-4 w-4" />
                    Remove from Favorites
                  </DropdownMenuItem>
                ) : !isBlacklisted && (
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedContractor(contractor);
                      setAddNoteDialogOpen(true);
                    }}
                    data-testid={`menu-favorite-${contractor?.id}`}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Add to Favorites
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {isBlacklisted ? (
                  <DropdownMenuItem 
                    onClick={() => unblacklistContractor(contractor?.id)}
                    data-testid={`menu-unblock-${contractor?.id}`}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Unblock Contractor
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedContractor(contractor);
                      setBlacklistDialogOpen(true);
                    }}
                    className="text-destructive"
                    data-testid={`menu-block-${contractor?.id}`}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Block Contractor
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isLoading = favoritesLoading || blacklistLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Manage Contractors
          </CardTitle>
          <CardDescription>
            Manage your favorite contractors and blacklist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-contractors"
            />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="favorites" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="favorites">
                  Favorites ({filteredFavorites.length})
                </TabsTrigger>
                {showBlacklist && (
                  <TabsTrigger value="blacklist">
                    Blocked ({filteredBlacklist.length})
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="favorites" className="space-y-2">
                <ScrollArea className="h-[400px] pr-4">
                  {filteredFavorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg">No favorite contractors yet</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Add contractors to your favorites for quick booking
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFavorites.map((favorite) => (
                        <ContractorCard
                          key={favorite.id}
                          contractor={favorite.contractor}
                          profile={favorite.profile}
                          notes={favorite.notes}
                          isFavorite={true}
                          data-testid={`card-favorite-${favorite.contractor?.id}`}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              {showBlacklist && (
                <TabsContent value="blacklist" className="space-y-2">
                  <ScrollArea className="h-[400px] pr-4">
                    {filteredBlacklist.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <UserX className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-medium text-lg">No blocked contractors</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          Blocked contractors will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredBlacklist.map((item) => (
                          <ContractorCard
                            key={item.id}
                            contractor={item.contractor}
                            isBlacklisted={true}
                            blacklistReason={item.reason}
                            data-testid={`card-blocked-${item.contractor?.id}`}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={addNoteDialogOpen} onOpenChange={setAddNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Favorites</DialogTitle>
            <DialogDescription>
              Add {selectedContractor?.firstName} {selectedContractor?.lastName} to your favorites
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this contractor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-favorite-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddNoteDialogOpen(false);
                setNotes("");
              }}
              data-testid="button-cancel-favorite"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleAddFavorite(selectedContractor?.id, notes)}
              disabled={isAdding}
              data-testid="button-add-favorite"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Add to Favorites
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Contractor</DialogTitle>
            <DialogDescription>
              Block {selectedContractor?.firstName} {selectedContractor?.lastName} from receiving your job requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why are you blocking this contractor?"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                data-testid="textarea-blacklist-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBlacklistDialogOpen(false);
                setBlacklistReason("");
              }}
              data-testid="button-cancel-blacklist"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleBlacklist(selectedContractor?.id, blacklistReason)}
              disabled={isBlacklisting}
              data-testid="button-confirm-blacklist"
            >
              {isBlacklisting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Block Contractor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}