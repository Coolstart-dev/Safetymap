import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { categories } from "@/lib/categories";
import { useGeolocation } from "@/hooks/use-geolocation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { X, Camera, MapPin, Navigation } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertReportSchema;

type FormData = z.infer<typeof formSchema>;

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { location, getCurrentLocation, isLoading: locationLoading } = useGeolocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Always include required fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('involvementType', data.involvementType);
      
      // Include optional fields only if they have values
      if (data.subcategory) {
        formData.append('subcategory', data.subcategory);
      }
      if (data.latitude !== null && data.latitude !== undefined) {
        formData.append('latitude', data.latitude.toString());
      }
      if (data.longitude !== null && data.longitude !== undefined) {
        formData.append('longitude', data.longitude.toString());
      }
      if (data.locationDescription) {
        formData.append('locationDescription', data.locationDescription);
      }
      
      // Boolean field - always include
      formData.append('authoritiesContacted', data.authoritiesContacted ? 'true' : 'false');

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await apiRequest('POST', '/api/reports', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Report submitted successfully",
        description: "Thank you for helping keep our community safe.",
      });
      onClose();
      form.reset();
      setSelectedCategory("");
      setImageFile(null);
    },
    onError: () => {
      toast({
        title: "Failed to submit report",
        description: "Please try again later.",
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
      toast({
        title: "Location captured",
        description: "Using your current location and time.",
      });
    }
  };

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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleHereAndNow}
                  disabled={locationLoading}
                  data-testid="button-here-now"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {locationLoading ? "Getting location..." : "Use 'Here & Now'"}
                </Button>
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

            {/* Submit Button */}
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
      </DialogContent>
    </Dialog>
  );
}
