
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card3D } from "@/components/ui/card-3d";
import { GlassContainer } from "@/components/ui/glass-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car as CarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      navigate("/");
      toast.success("Successfully logged in!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md animate-fade-in">
        <Card3D className="mb-6">
          <div className="flex justify-center items-center py-8">
            <div className="bg-taxiyellow p-4 rounded-full">
              <CarIcon className="h-12 w-12 text-charcoal" />
            </div>
            <div className="ml-4">
              <h1 className="text-4xl font-bold text-foreground">College</h1>
              <h2 className="text-2xl font-bold text-electricblue">Ride Share</h2>
            </div>
          </div>
        </Card3D>

        <GlassContainer className="p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background dark:bg-card border-input"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-electricblue hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background dark:bg-card border-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-cosmicviolet hover:bg-cosmicviolet/90 text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cosmicviolet/20"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm mt-6 text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-electricblue hover:underline">
              Sign up
            </Link>
          </p>
        </GlassContainer>
      </div>
    </div>
  );
}
