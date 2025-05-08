
import { UserIcon } from "lucide-react";
import { Profile } from "@/services/profileService";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  profile: Profile;
  onEditClick: () => void;
}

export function ProfileHeader({ profile, onEditClick }: ProfileHeaderProps) {
  const memberSince = profile.created_at 
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : 'Recently joined';

  return (
    <div className="flex flex-col items-center">
      <div className="h-24 w-24 rounded-full bg-taxiyellow flex items-center justify-center mb-4">
        <UserIcon className="h-12 w-12 text-charcoal" />
      </div>
      <h2 className="text-2xl font-bold">{profile.full_name || "Update your profile"}</h2>
      <div className="mt-1 text-xs text-muted-foreground">
        Member since {memberSince}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={onEditClick}
      >
        Edit Profile
      </Button>
    </div>
  );
}
