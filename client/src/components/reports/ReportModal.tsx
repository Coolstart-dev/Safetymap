import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { categories } from "@/lib/categories";
import { useGeolocation } from "@/hooks/use-geolocation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { z } from "zod";

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { X, Camera, MapPin, Navigation, Calendar, Clock } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  locationSelectionMode?: boolean;
  onLocationSelectionModeToggle?: () => void;
  onLocationSelectionStart?: () => void;
}

const formSchema = insertReportSchema;

type FormData = z.infer<typeof formSchema>;

export default function ReportModal({ 
  isOpen, 
  onClose, 
  selectedLocation, 
  onLocationSelect, 
  locationSelectionMode = false,
  onLocationSelectionModeToggle,
  onLocationSelectionStart
}: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { location, getCurrentLocation, isLoading: locationLoading } = useGeolocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      subcategory: undefined,
      latitude: undefined,
      longitude: undefined,
      locationDescription: undefined,
      authoritiesContacted: false,
      involvementType: "witness",
      incidentDateTime: undefined,
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Creating FormData from:", data);

      const formData = new FormData();

      // Always include required fields
      console.log("Adding title:", data.title);
      formData.append('title', data.title);
      console.log("Adding description:", data.description);
      formData.append('description', data.description);
      console.log("Adding category:", data.category);
      formData.append('category', data.category);
      console.log("Adding involvementType:", data.involvementType);
      formData.append('involvementType', data.involvementType);

      // Include optional fields only if they have values
      if (data.subcategory) {
        console.log("Adding subcategory:", data.subcategory);
        formData.append('subcategory', data.subcategory);
      }
      if (data.latitude !== null && data.latitude !== undefined) {
        console.log("Adding latitude:", data.latitude);
        formData.append('latitude', data.latitude.toString());
      }
      if (data.longitude !== null && data.longitude !== undefined) {
        console.log("Adding longitude:", data.longitude);
        formData.append('longitude', data.longitude.toString());
      }
      if (data.locationDescription) {
        console.log("Adding locationDescription:", data.locationDescription);
        formData.append('locationDescription', data.locationDescription);
      }

      // Boolean field - always include
      console.log("Adding authoritiesContacted:", data.authoritiesContacted);
      formData.append('authoritiesContacted', data.authoritiesContacted ? 'true' : 'false');

      if (data.incidentDateTime) {
        console.log("Adding incidentDateTime:", data.incidentDateTime);
        formData.append('incidentDateTime', data.incidentDateTime);
      }

      if (imageFile) {
        console.log("Adding image file:", imageFile.name);
        formData.append('image', imageFile);
      }

      // Log all FormData entries
      console.log("Final FormData entries:");
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(key + ': ' + value);
      });

      console.log("Sending request to /api/reports...");
      const response = await apiRequest('POST', '/api/reports', formData);
      console.log("Response received:", response.status);
      return response.json();
    },
    onSuccess: () => {
      console.log("Report submitted successfully, invalidating queries...");
      // Force refresh all reports queries with different category filters
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      queryClient.refetchQueries({ queryKey: ['/api/reports'] });
      queryClient.refetchQueries({ queryKey: ['/api/reports', { category: 'all' }] });
      queryClient.refetchQueries({ queryKey: ['/api/reports', { category: 'dangerous' }] });
      toast({
        title: "Report submitted successfully",
        description: "Thank you for helping keep our community safe.",
      });
      onClose();
      form.reset();
      setSelectedCategory("");
      setImageFile(null);
      // Turn off location selection mode when closing
      if (locationSelectionMode && onLocationSelectionModeToggle) {
        onLocationSelectionModeToggle();
      }
    },
    onError: (error: any) => {
      console.log("Submission error:", error);

      // Try to parse the error response for specific moderation messages
      let errorTitle = "Failed to submit report";
      let errorDescription = "Please try again later.";

      if (error?.message?.includes("Content rejected by moderation")) {
        errorTitle = "Report niet geaccepteerd";
        errorDescription = "Je melding bevat inhoud die niet voldoet aan onze richtlijnen. Controleer op ongepaste taal of persoonlijke informatie.";
      } else if (error?.message?.includes("400")) {
        errorTitle = "Melding geweigerd";
        errorDescription = "Je melding kon niet worden geaccepteerd. Controleer de inhoud en probeer opnieuw.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    form.setValue("category", categoryKey);
  };

  const handleHereAndNow = async () => {
    const position = await getCurrentLocation();
    if (position) {
      form.setValue("latitude", position.latitude);
      form.setValue("longitude", position.longitude);
          // Set current time for "Here & Now"
      const currentTime = new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
      form.setValue("incidentDateTime", currentTime);

      if (onLocationSelect) {
        onLocationSelect({ lat: position.latitude, lng: position.longitude });
      }
      toast({
        title: "Location and time captured",
        description: "Using your current location and time.",
      });
    }
  };

  const handleSelectOnMap = () => {
    if (onLocationSelectionModeToggle) {
      onLocationSelectionModeToggle();
      if (!locationSelectionMode) {
        // Starting location selection - snap bottom sheet down for better map visibility
        if (onLocationSelectionStart) {
          onLocationSelectionStart();
        }
        toast({
          title: "Map selection enabled",
          description: "Click anywhere on the map to set the location",
        });
      } else {
        toast({
          title: "Location confirmed",
          description: "Continue filling out your report",
        });
      }
    }
  };

  // Update form when location is selected from map
  useEffect(() => {
    if (selectedLocation) {
      form.setValue("latitude", selectedLocation.lat);
      form.setValue("longitude", selectedLocation.lng);
    }
  }, [selectedLocation, form]);

  // iOS-specific scroll handling
  useEffect(() => {
    if (isOpen && isIOS()) {
      // Store the current scroll position
      const scrollY = window.scrollY;

      // Apply iOS-specific fixes
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore the previous state
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    } else if (isMobile && isOpen) {
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [isMobile, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const onSubmit = (data: FormData) => {
    console.log("Form data being submitted:", data);

    // Validate required fields before submission
    if (!data.category) {
      toast({
        title: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    createReportMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/80 overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center">
            <DialogContent className="w-full max-w-md m-4 max-h-[calc(100vh-2rem)] bg-background rounded-lg border shadow-lg">
              <div className="h-full flex flex-col">
                <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
                  <DialogTitle>Report Incident</DialogTitle>
                  <DialogDescription className="sr-only">
                    Create a new incident report with location, category, and details
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-0 pb-8">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium mb-3 block">
                    What type of incident? <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(categories).map(([key, category]) => (
                      <button
                        key={key}
                        type="button"
                        className={`p-3 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left ${
                          field.value === key ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => {
                          field.onChange(key);
                          setSelectedCategory(key);
                        }}
                        data-testid={`category-${key}`}
                      >
                        <div 
                          className="w-6 h-6 rounded-full mb-2"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="text-sm font-medium text-foreground">{category.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.subcategories[0]}...
                        </div>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategory */}
            {(selectedCategory || form.watch("category")) && (
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => {
                  const currentCategory = selectedCategory || form.watch("category");
                  return (
                    <FormItem>
                      <FormLabel>Specific type</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value}>
                          {categories[currentCategory as keyof typeof categories]?.subcategories.map((sub) => (
                            <div key={sub} className="flex items-center space-x-2">
                              <RadioGroupItem value={sub} id={sub} />
                              <Label htmlFor={sub} className="text-sm">{sub}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Brief title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Quick summary of the incident" 
                      {...field} 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about the incident..."
                      rows={4}
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <div>
              <Label className="block text-sm font-medium mb-2">Location</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={handleHereAndNow}
                    disabled={locationLoading}
                    data-testid="button-here-now"
                    variant={selectedLocation && !locationSelectionMode ? "default" : "outline"}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {locationLoading ? "Getting..." : "Use Here"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSelectOnMap}
                    data-testid="button-select-map"
                    variant={locationSelectionMode ? "default" : "outline"}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {locationSelectionMode ? "Exit Map" : "Select on Map"}
                  </Button>
                </div>

                {selectedLocation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800">
                      ✓ Location selected: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                    </div>
                  </div>
                )}

                {locationSelectionMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      📍 Click anywhere on the map to set the location, or drag the red marker
                    </div>
                  </div>
                )}

                <div className="text-center text-xs text-muted-foreground">or</div>
                <FormField
                  control={form.control}
                  name="locationDescription"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        placeholder="Describe the location manually"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-location"
                      />
                    </FormControl>
                  )}
                />
              </div>
            </div>

            {/* Date & Time */}
            <FormField
              control={form.control}
              name="incidentDateTime"
              render={({ field }) => {
                // Default to current time if no value set
                const currentDateTime = field.value || new Date().toISOString().slice(0, 16);

                return (
                  <FormItem>
                    <FormLabel>When did this happen?</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <input
                          type="datetime-local"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={currentDateTime}
                          onChange={(e) => field.onChange(e.target.value)}
                          data-testid="input-datetime"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const now = new Date().toISOString().slice(0, 16);
                              field.onChange(now);
                            }}
                            data-testid="button-now"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Now
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange("")}
                            data-testid="button-clear"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Defaults to current time - adjust above if the incident happened at a different time
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Image Upload */}
            <div>
              <Label className="block text-sm font-medium mb-2">Add photo (optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer" data-testid="input-image">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : "Tap to add photo for credibility"}
                  </p>
                </label>
              </div>
            </div>

            {/* Authorities Contacted */}
            <FormField
              control={form.control}
              name="authoritiesContacted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Were authorities contacted?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === 'true')}
                      value={field.value ? 'true' : 'false'}
                    >
                      <div className="flex space-x-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="auth-yes" />
                          <Label htmlFor="auth-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="auth-no" />
                          <Label htmlFor="auth-no">No</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Involvement Type */}
            <FormField
              control={form.control}
              name="involvementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your involvement</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="victim" id="victim" />
                          <Label htmlFor="victim">I was the victim/directly affected</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="witness" id="witness" />
                          <Label htmlFor="witness">I witnessed this happen to someone else</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
                  type="submit"
                  className="w-full"
                  disabled={createReportMutation.isPending}
                  data-testid="button-submit-report"
                >
                  {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            </Form>
                </div>
              </div>
            </DialogContent>
          </div>
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  );
}