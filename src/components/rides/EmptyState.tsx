
import { MapPin as MapPinIcon } from "lucide-react";
import { GlassContainer } from "@/components/ui/glass-container";

interface EmptyStateProps {
  message: string;
  description: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <GlassContainer className="p-10 text-center">
      <MapPinIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
      <h3 className="text-xl font-semibold">{message}</h3>
      <p className="text-muted-foreground">{description}</p>
    </GlassContainer>
  );
}
