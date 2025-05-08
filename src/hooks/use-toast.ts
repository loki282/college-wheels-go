
// Import directly from the source component file
import { useToast as useHookToast } from "@/components/ui/use-toast.tsx";
import { toast as hookToast } from "@/components/ui/use-toast.tsx";

// Export them without creating circular references
export const useToast = useHookToast;
export const toast = hookToast;
