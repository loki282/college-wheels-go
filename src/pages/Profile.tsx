import { useState, useEffect } from "react";
import { Card3D } from "@/components/ui/card-3d";
import { GlassContainer } from "@/components/ui/glass-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Car as CarIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Bell as BellIcon,
  Lock as LockIcon,
  Moon as MoonIcon,
  Globe as GlobeIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, type Profile } from "@/services/profileService";
import { format } from "date-fns";

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile> & { id?: string }>({
    full_name: '',
    email: '',
    phone_number: '',
    university: '',
    role: 'rider'
  });
  const [reviews, setReviews] = useState([]);
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    locationServices: true,
    emailNotifications: true,
    pushNotifications: true,
    language: "en-US"
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setEditedProfile({
        ...profile,
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        university: profile.university || '',
        role: profile.role || 'rider'
      });
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const handleEditProfile = () => {
    if (profile) {
      setEditedProfile({
        ...profile,
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        university: profile.university || '',
        role: profile.role || 'rider'
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profile || !profile.id) {
      toast.error("Unable to update profile: User information is missing");
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await updateProfile({
        ...editedProfile,
        id: profile.id
      });
      
      if (success) {
        toast.success("Profile updated successfully");
        refreshProfile();
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSettings(prev => ({
      ...prev,
      language: newLanguage
    }));
    toast.success(`Language changed to ${newLanguage === "en-US" ? "English" : "Spanish"}`);
  };

  const handleSettingsChange = (name: string, value: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, [name]: value };

      switch (name) {
        case 'pushNotifications':
          toast.success(value ? 'Push notifications enabled' : 'Push notifications disabled');
          break;
        case 'emailNotifications':
          toast.success(value ? 'Email notifications enabled' : 'Email notifications disabled');
          break;
        case 'locationServices':
          toast.success(value ? 'Location services enabled' : 'Location services disabled');
          break;
      }

      return newSettings;
    });
  };

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
    toast.success(`Theme changed to ${checked ? "dark" : "light"} mode`);
  };

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.auth.signOut();
      
      localStorage.removeItem('userSettings');
      
      toast.success("Logged out successfully");
      
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  if (!profile) {
    return (
      <div className="pt-6 pb-20 px-4 animate-fade-in">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </header>
        <GlassContainer className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-electricblue mx-auto"></div>
          <p className="mt-2">Loading profile information...</p>
        </GlassContainer>
      </div>
    );
  }

  const memberSince = profile.created_at 
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : 'Recently joined';

  return (
    <div className="pt-6 pb-20 px-4 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </header>

      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card3D>
            <GlassContainer className="p-6">
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-taxiyellow flex items-center justify-center mb-4">
                  <UserIcon className="h-12 w-12 text-charcoal" />
                </div>
                <h2 className="text-2xl font-bold">{profile.full_name || "Update your profile"}</h2>

                <div className="flex items-center mt-1">
                  <div className="px-2 py-1 bg-electricblue/10 text-electricblue rounded-full text-sm mr-2 flex items-center">
                    <CarIcon className="h-3 w-3 mr-1" />
                    {profile.role === "driver" ? "Driver" : profile.role === "rider" ? "Rider" : "Driver & Rider"}
                  </div>

                  {profile.is_verified && (
                    <div className="px-2 py-1 bg-limegreen/10 text-limegreen rounded-full text-sm flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Verified
                    </div>
                  )}
                </div>

                <div className="flex items-center mt-3">
                  <div className="flex">
                    {[...Array(Math.floor(profile.rating || 0))].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-taxiyellow text-taxiyellow" />
                    ))}
                    {(profile.rating || 0) % 1 > 0 && (
                      <StarIcon className="h-4 w-4 fill-taxiyellow text-taxiyellow" />
                    )}
                  </div>
                  <span className="ml-1 text-sm">{profile.rating || "No ratings"}</span>
                  <span className="mx-2 text-muted">•</span>
                  <span className="text-sm">{profile.total_rides || 0} rides</span>
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  Member since {memberSince}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </Button>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MailIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>{profile.email || "Add your email"}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>{profile.phone_number || "Add your phone number"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">College Information</h3>
                  <div className="flex items-center">
                    <SchoolIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{profile.university || "Add your university"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => setIsSettingsDialogOpen(true)}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </GlassContainer>
          </Card3D>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Your Reviews</h3>
              <div className="flex items-center">
                <div className="flex">
                  {[...Array(Math.floor(profile.rating || 0))].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 fill-taxiyellow text-taxiyellow" />
                  ))}
                  {(profile.rating || 0) % 1 > 0 && (
                    <StarIcon className="h-5 w-5 fill-taxiyellow text-taxiyellow" />
                  )}
                </div>
                <span className="ml-2 font-bold">{profile.rating || "No ratings"}</span>
              </div>
            </div>

            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map((review: any) => (
                <div key={review.id} className="p-4 border rounded-lg bg-white/50 dark:bg-charcoal/50">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{review.name}</div>
                    <div className="text-sm text-muted-foreground">{review.date}</div>
                  </div>

                  <div className="flex mb-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-taxiyellow text-taxiyellow" />
                    ))}
                    {[...Array(5 - review.rating)].map((_, i) => (
                      <StarIcon key={i + review.rating} className="h-4 w-4 text-muted" />
                    ))}
                  </div>

                  <p className="text-sm">{review.comment}</p>
                </div>
              )) : (
                <div className="text-center py-8">
                  <StarIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
                  <h3 className="text-xl font-semibold">No reviews yet</h3>
                  <p className="text-muted-foreground">Reviews will appear here after completed rides</p>
                </div>
              )}
            </div>
          </GlassContainer>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={editedProfile.full_name || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editedProfile.email || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={editedProfile.phone_number || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="university">College/University</Label>
              <Input
                id="university"
                name="university"
                value={editedProfile.university || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editedProfile.role || "rider"}
                onChange={(e) => handleInputChange({ target: { name: 'role', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>)}
              >
                <option value="rider">Rider</option>
                <option value="driver">Driver</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isLoading}>
              {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Push Notifications</span>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Email Notifications</span>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('emailNotifications', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Privacy & Security</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Location Services</span>
                  </div>
                  <Switch
                    checked={settings.locationServices}
                    onCheckedChange={(checked) => handleSettingsChange('locationServices', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Appearance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MoonIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Dark Mode</span>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Language & Region</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{settings.language === "en-US" ? "English (US)" : "Español (ES)"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLanguageChange(settings.language === "en-US" ? "es-ES" : "en-US")}
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsSettingsDialogOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
