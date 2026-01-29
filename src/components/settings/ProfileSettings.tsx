import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Building2, Save } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const IMAGE_UPLOAD_URL = "https://test-service.buypowerpass.africa/api/v1/uploadImage";

interface ProfileData {
  companyName: string;
  phone: string;
  address: string;
  location: string;
  state: string;
  lga: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  logo?: string;
}

export function ProfileSettings() {
  const { accessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    companyName: "",
    phone: "",
    address: "",
    location: "",
    state: "",
    lga: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
    logo: "",
  });

  useEffect(() => {
    loadProfile();
  }, [accessToken]);

  const loadProfile = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getMyProfile(accessToken);
      if (response?.data) {
        setProfile({
          companyName: response.data.companyName || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          location: response.data.location || "",
          state: response.data.state || "",
          lga: response.data.lga || "",
          contactPersonName: response.data.contactPersonName || "",
          contactPersonPhone: response.data.contactPersonPhone || "",
          contactPersonEmail: response.data.contactPersonEmail || "",
          logo: response.data.logo || "",
        });
      }
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      toast.error(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(IMAGE_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      // Assuming the API returns the image URL
      const imageUrl = data.url || data.data?.url || data.imageUrl || data.data?.imageUrl;

      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }

      // Update profile with new logo URL
      setProfile(prev => ({ ...prev, logo: imageUrl }));

      // Save the logo to backend
      await apiService.updateMyProfile(accessToken!, { logo: imageUrl });

      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error("Failed to upload logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      await apiService.updateMyProfile(accessToken, {
        phone: profile.phone,
        address: profile.address,
        location: profile.location,
        state: profile.state,
        lga: profile.lga,
        contactPersonName: profile.contactPersonName,
        contactPersonPhone: profile.contactPersonPhone,
        contactPersonEmail: profile.contactPersonEmail,
      });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>Upload your company logo to personalize your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.logo} alt={profile.companyName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {profile.companyName?.charAt(0) || <Building2 className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Recommended: Square image, at least 200x200px. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Your company details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={profile.companyName}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Company name cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="08012345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="Lagos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lga">LGA</Label>
              <Input
                id="lga"
                value={profile.lga}
                onChange={(e) => handleChange("lga", e.target.value)}
                placeholder="Ikeja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Ikeja GRA"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter your company address"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Person */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Person</CardTitle>
          <CardDescription>Primary contact information for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPersonName">Contact Name</Label>
              <Input
                id="contactPersonName"
                value={profile.contactPersonName}
                onChange={(e) => handleChange("contactPersonName", e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPersonPhone">Contact Phone</Label>
              <Input
                id="contactPersonPhone"
                value={profile.contactPersonPhone}
                onChange={(e) => handleChange("contactPersonPhone", e.target.value)}
                placeholder="08012345678"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="contactPersonEmail">Contact Email</Label>
              <Input
                id="contactPersonEmail"
                type="email"
                value={profile.contactPersonEmail}
                onChange={(e) => handleChange("contactPersonEmail", e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
