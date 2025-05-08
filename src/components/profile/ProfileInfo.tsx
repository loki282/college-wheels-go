
import { MailIcon, PhoneIcon, SchoolIcon } from "lucide-react";
import { Profile } from "@/services/profileService";
import { Separator } from "@/components/ui/separator";

interface ProfileInfoProps {
  profile: Profile;
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
  return (
    <>
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
    </>
  );
}
