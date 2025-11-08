import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Camera, Upload, X, ZoomIn, Download, Trash2, 
  Image as ImageIcon, ChevronLeft, ChevronRight, Loader2 
} from "lucide-react";

interface JobPhoto {
  id: string;
  jobId: string;
  uploadedBy: string;
  photoUrl: string;
  photoType: string;
  description?: string;
  isBeforePhoto: boolean;
  metadata?: {
    originalName?: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string;
  };
  createdAt: string;
}

interface JobPhotoGalleryProps {
  jobId: string;
  photos: JobPhoto[];
  canUpload?: boolean;
  onPhotosChange?: () => void;
}

export default function JobPhotoGallery({
  jobId,
  photos,
  canUpload = false,
  onPhotosChange
}: JobPhotoGalleryProps) {
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoType, setPhotoType] = useState<'before' | 'during' | 'after'>('before');
  const [description, setDescription] = useState("");

  // Group photos by type
  const photosByType = {
    before: photos.filter(p => p.photoType === 'before'),
    during: photos.filter(p => p.photoType === 'during'),
    after: photos.filter(p => p.photoType === 'after')
  };

  const handlePhotoClick = (photo: JobPhoto, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
      setSelectedPhoto(photos[selectedPhotoIndex - 1]);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
      setSelectedPhoto(photos[selectedPhotoIndex + 1]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5); // Max 5 files
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select at least one photo to upload",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('photos', file);
    });
    formData.append('photoType', photoType);
    formData.append('description', description);

    try {
      await apiRequest('POST', `/api/jobs/${jobId}/upload-photos`, formData, {
        headers: {
          // Don't set Content-Type - let browser set it with boundary
        }
      });

      toast({
        title: "Photos uploaded",
        description: `${selectedFiles.length} photo(s) uploaded successfully`,
      });

      // Clear form
      setSelectedFiles([]);
      setDescription("");
      setShowUploadDialog(false);

      // Refresh photos
      if (onPhotosChange) {
        onPhotosChange();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photos",
      });
    } finally {
      setUploading(false);
    }
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'before':
        return 'bg-yellow-500';
      case 'during':
        return 'bg-blue-500';
      case 'after':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Job Photos
          </h3>
          {canUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
              data-testid="button-upload-photos"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No photos uploaded yet</p>
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowUploadDialog(true)}
                data-testid="button-upload-first-photo"
              >
                Upload First Photo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Before Photos */}
            {photosByType.before.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge className={`${getPhotoTypeColor('before')} text-white`}>
                    Before
                  </Badge>
                  <span className="text-muted-foreground">
                    ({photosByType.before.length} photo{photosByType.before.length !== 1 ? 's' : ''})
                  </span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {photosByType.before.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border"
                      onClick={() => handlePhotoClick(photo, photos.indexOf(photo))}
                      data-testid={`photo-before-${index}`}
                    >
                      <img
                        src={photo.photoUrl}
                        alt={photo.description || `Before photo ${index + 1}`}
                        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* During Photos */}
            {photosByType.during.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge className={`${getPhotoTypeColor('during')} text-white`}>
                    During
                  </Badge>
                  <span className="text-muted-foreground">
                    ({photosByType.during.length} photo{photosByType.during.length !== 1 ? 's' : ''})
                  </span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {photosByType.during.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border"
                      onClick={() => handlePhotoClick(photo, photos.indexOf(photo))}
                      data-testid={`photo-during-${index}`}
                    >
                      <img
                        src={photo.photoUrl}
                        alt={photo.description || `During photo ${index + 1}`}
                        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* After Photos */}
            {photosByType.after.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge className={`${getPhotoTypeColor('after')} text-white`}>
                    After
                  </Badge>
                  <span className="text-muted-foreground">
                    ({photosByType.after.length} photo{photosByType.after.length !== 1 ? 's' : ''})
                  </span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {photosByType.after.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border"
                      onClick={() => handlePhotoClick(photo, photos.indexOf(photo))}
                      data-testid={`photo-after-${index}`}
                    >
                      <img
                        src={photo.photoUrl}
                        alt={photo.description || `After photo ${index + 1}`}
                        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Badge className={`${getPhotoTypeColor(selectedPhoto?.photoType || '')} text-white`}>
                  {selectedPhoto?.photoType}
                </Badge>
                Photo {selectedPhotoIndex + 1} of {photos.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPhoto}
                  disabled={selectedPhotoIndex === 0}
                  data-testid="button-prev-photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPhoto}
                  disabled={selectedPhotoIndex === photos.length - 1}
                  data-testid="button-next-photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  data-testid="button-download-photo"
                >
                  <a href={selectedPhoto?.photoUrl} download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={selectedPhoto?.photoUrl}
              alt={selectedPhoto?.description || 'Job photo'}
              className="w-full max-h-[60vh] object-contain rounded-lg"
            />
          </div>
          {selectedPhoto?.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {selectedPhoto.description}
            </p>
          )}
          {selectedPhoto?.metadata?.uploadedAt && (
            <p className="text-xs text-muted-foreground">
              Uploaded {format(new Date(selectedPhoto.metadata.uploadedAt), "PPp")}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Job Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photo-type">Photo Type</Label>
              <Select value={photoType} onValueChange={(v) => setPhotoType(v as 'before' | 'during' | 'after')}>
                <SelectTrigger id="photo-type" data-testid="select-photo-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before Repair</SelectItem>
                  <SelectItem value="during">During Repair</SelectItem>
                  <SelectItem value="after">After Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="photo-files">Select Photos (max 5)</Label>
              <Input
                id="photo-files"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
                data-testid="input-photo-files"
              />
              {selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="photo-description">Description (optional)</Label>
              <Textarea
                id="photo-description"
                placeholder="Add a description for these photos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                data-testid="textarea-photo-description"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                data-testid="button-confirm-upload"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photos
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}