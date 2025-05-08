
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card3D } from "@/components/ui/card-3d";
import { GlassContainer } from "@/components/ui/glass-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car as CarIcon, Bike as BikeIcon, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("rider");
  const [college, setCollege] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, sign up with Supabase Auth
      await signUp(email, password, fullName);
      
      // Then update the profile with additional information
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone_number: phone,
            university: college,
            role: role
          })
          .eq('id', session.user.id);
          
        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }
      
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md animate-fade-in">
        <Card3D className="mb-6">
          <div className="flex justify-center items-center py-6">
            <div className="bg-taxiyellow p-3 rounded-full">
              <CarIcon className="h-10 w-10 text-charcoal" />
            </div>
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-foreground">College</h1>
              <h2 className="text-xl font-bold text-electricblue">Ride Share</h2>
            </div>
          </div>
        </Card3D>

        <GlassContainer className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-background dark:bg-card border-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="bg-background dark:bg-card border-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College/University</Label>
              <Input
                id="college"
                placeholder="Enter your college/university"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
                className="bg-background dark:bg-card border-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex space-x-2">
                <div
                  className={`flex-1 flex items-center justify-center space-x-2 border rounded-md p-3 cursor-pointer transition-all duration-200 ${role === "driver"
                    ? "bg-cosmicviolet/10 border-cosmicviolet text-cosmicviolet"
                    : "hover:bg-muted"
                    }`}
                  onClick={() => setRole("driver")}
                >
                  <CarIcon className="h-4 w-4" />
                  <span>Driver</span>
                </div>
                <div
                  className={`flex-1 flex items-center justify-center space-x-2 border rounded-md p-3 cursor-pointer transition-all duration-200 ${role === "rider"
                    ? "bg-cosmicviolet/10 border-cosmicviolet text-cosmicviolet"
                    : "hover:bg-muted"
                    }`}
                  onClick={() => setRole("rider")}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Rider</span>
                </div>
                <div
                  className={`flex-1 flex items-center justify-center space-x-2 border rounded-md p-3 cursor-pointer transition-all duration-200 ${role === "both"
                    ? "bg-cosmicviolet/10 border-cosmicviolet text-cosmicviolet"
                    : "hover:bg-muted"
                    }`}
                  onClick={() => setRole("both")}
                >
                  <BikeIcon className="h-4 w-4" />
                  <span>Both</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background dark:bg-card border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background dark:bg-card border-input"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-cosmicviolet hover:bg-cosmicviolet/90 text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cosmicviolet/20"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm mt-6 text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-electricblue hover:underline">
              Sign in
            </Link>
          </p>
        </GlassContainer>
      </div>
    </div>
  );
}
