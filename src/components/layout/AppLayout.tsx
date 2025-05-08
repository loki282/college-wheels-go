import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Car as CarIcon,
  Home as HomeIcon,
  MessageSquare as MessageIcon,
  User as UserIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  List as ListIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout() {
  const location = useLocation();
  const { profile } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Main content */}
        <main className="flex-1 container pb-16">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar - Cosmic Themed */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-border shadow-lg animate-slide-up backdrop-blur-lg">
          <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
            <NavItem to="/" icon={<HomeIcon />} label="Home" pathname={location.pathname} />
            {profile?.role === 'driver' || profile?.role === 'both' ? (
              <>
                <NavItem to="/find" icon={<SearchIcon />} label="Find" pathname={location.pathname} />
                <NavItem to="/create" icon={<PlusIcon />} label="Create" pathname={location.pathname} isCenter />
                <NavItem to="/messages" icon={<MessageIcon />} label="Messages" pathname={location.pathname} />
              </>
            ) : (
              <>
                <NavItem to="/my-rides" icon={<ListIcon />} label="My Rides" pathname={location.pathname} />
                <NavItem to="/find" icon={<SearchIcon />} label="Find" pathname={location.pathname} isCenter />
                <NavItem to="/messages" icon={<MessageIcon />} label="Messages" pathname={location.pathname} />
              </>
            )}
            <NavItem to="/profile" icon={<UserIcon />} label="Profile" pathname={location.pathname} />
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  isCenter?: boolean;
}

function NavItem({ to, icon, label, pathname, isCenter = false }: NavItemProps) {
  const isActive = pathname === to;

  if (isCenter) {
    return (
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center justify-center -mt-5 transition-all duration-300",
          "group relative"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full shadow-cosmic-lg",
          "bg-cosmic-gradient text-white",
          "transition-all duration-300 transform group-hover:scale-110",
        )}>
          {icon}
          {/* Ripple effect on click */}
          <span className="absolute inset-0 rounded-full opacity-0 group-active:animate-ripple bg-white/30" />
        </div>
        <span className="text-xs mt-1 font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center w-16 transition-all duration-200",
        "group",
        isActive ? "text-cosmicviolet" : "text-muted-foreground"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full",
        "transition-all duration-300 transform group-hover:scale-110",
        isActive && "bg-cosmicviolet/10"
      )}>
        {icon}
        {/* Ripple effect on click */}
        <span className="absolute inset-0 rounded-full opacity-0 group-active:animate-ripple bg-cosmicviolet/20" />
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </Link>
  );
}
