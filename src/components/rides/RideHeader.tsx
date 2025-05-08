
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function RideHeader() {
  const navigate = useNavigate();

  return (
    <header className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">My Rides</h1>
        <p className="text-muted-foreground">View and manage your rides</p>
      </div>

      <Button
        onClick={() => navigate('/create')}
        className="bg-cosmic-gradient hover:opacity-90 transition-opacity"
      >
        <PlusIcon className="mr-2" />
        New Ride
      </Button>
    </header>
  );
}
