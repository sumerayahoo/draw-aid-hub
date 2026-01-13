import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save, Loader2, Camera, Upload, Hash } from "lucide-react";
import { toast } from "sonner";

interface StudentData {
  email: string;
  username?: string;
  branch: string;
  fullName: string;
  avatarUrl: string;
  interests: string;
  goals: string;
  extraInfo: string;
  points: number;
  rollNo?: number | null;
}

interface StudentProfileProps {
  studentData: StudentData;
  onUpdate: () => void;
}

const branches = [
  { value: "computer_engineering", label: "Computer Engineering" },
  { value: "cst", label: "Computer Science and Technology" },
  { value: "data_science", label: "Data Science" },
  { value: "ai", label: "Artificial Intelligence" },
  { value: "ece", label: "Electronics and Communication" },
];

const StudentProfile = ({ studentData, onUpdate }: StudentProfileProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: studentData.fullName || "",
    branch: studentData.branch || "",
    avatarUrl: studentData.avatarUrl || "",
    interests: studentData.interests || "",
    goals: studentData.goals || "",
    extraInfo: studentData.extraInfo || "",
    rollNo: studentData.rollNo?.toString() || "",
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatars/${studentData.email.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("content")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("content")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast.success("Avatar uploaded! Click Save to apply changes.");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const sessionToken = localStorage.getItem("student_session_token");
    if (!sessionToken) {
      toast.error("Session expired. Please login again.");
      return;
    }

    // Validate roll number if provided
    if (formData.rollNo && (isNaN(Number(formData.rollNo)) || Number(formData.rollNo) <= 0)) {
      toast.error("Roll number must be a positive number");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("student-auth", {
        body: { 
          action: "update_profile", 
          sessionToken,
          profile: {
            ...formData,
            rollNo: formData.rollNo ? Number(formData.rollNo) : null,
          }
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Edit Profile
        </CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar 
                className="w-24 h-24 cursor-pointer transition-opacity group-hover:opacity-80"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={formData.avatarUrl} alt="Profile" />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {formData.fullName?.[0] || studentData.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click on the avatar to upload a new image
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 gap-2"
                onClick={handleAvatarClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Photo
              </Button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={studentData.username || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={studentData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNo" className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Roll Number
              </Label>
              <Input
                id="rollNo"
                type="number"
                placeholder="Your roll number"
                value={formData.rollNo}
                onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value }))}
                min={1}
              />
            </div>
          </div>

          {/* Branch Selection */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select 
              value={formData.branch} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <Textarea
              id="interests"
              placeholder="What are you interested in? (e.g., Machine Learning, Web Development, IoT)"
              value={formData.interests}
              onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals">Goals</Label>
            <Textarea
              id="goals"
              placeholder="What are your learning goals? (e.g., Master engineering drawing, Pass exams)"
              value={formData.goals}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Extra Info */}
          <div className="space-y-2">
            <Label htmlFor="extraInfo">Additional Information</Label>
            <Textarea
              id="extraInfo"
              placeholder="Any other information you'd like to share..."
              value={formData.extraInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, extraInfo: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProfile;
