import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ChevronRight, Mail, Phone } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [submode, setSubmode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [fullNameEmail, setFullNameEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, loginEmail, registerEmail } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        if (submode === "phone") {
          await login(phone, password);
        } else {
          await loginEmail(email, emailPassword);
        }
      } else {
        if (submode === "phone") {
          await register({ fullName, phone });
        } else {
          await registerEmail({ fullName: fullNameEmail, email, password: emailPassword });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: mode === "login" ? "Login failed" : "Registration failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-12 pb-16 text-primary-foreground">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-app-title">
            ZRF Rugby
          </h1>
          <p className="text-sm opacity-80 mt-1">Zanzibar Rugby Federation</p>
        </div>
      </div>

      <div className="flex-1 -mt-8 px-4 pb-8">
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6">
            <div className="flex gap-1 mb-3 bg-muted rounded-md p-1">
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "register"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
                data-testid="button-register-tab"
              >
                Get Started
              </button>
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "login"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
                data-testid="button-login-tab"
              >
                Sign In
              </button>
            </div>

            <div className="flex gap-1 mb-4 bg-muted/50 rounded-md p-0.5">
              <button
                onClick={() => setSubmode("phone")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                  submode === "phone"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Phone className="w-3 h-3" />
                Phone
              </button>
              <button
                onClick={() => setSubmode("email")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                  submode === "email"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Mail className="w-3 h-3" />
                Email
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && submode === "phone" && (
                <>
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    Join the ZRF community in seconds. You can complete your full registration after signing up.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      data-testid="input-full-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+255 7XX XXX XXX"
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </>
              )}

              {mode === "register" && submode === "email" && (
                <>
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    Join with email and choose a password.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="regEmailName">Full Name</Label>
                    <Input
                      id="regEmailName"
                      value={fullNameEmail}
                      onChange={(e) => setFullNameEmail(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Email</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEmailPassword">Password</Label>
                    <Input
                      id="regEmailPassword"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="Choose a password (min 6 chars)"
                      required
                    />
                  </div>
                </>
              )}

              {mode === "login" && submode === "phone" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="loginPhone">Phone Number</Label>
                    <Input
                      id="loginPhone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+255 7XX XXX XXX"
                      required
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      data-testid="input-password"
                    />
                  </div>
                </>
              )}

              {mode === "login" && submode === "email" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">Email</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loginEmailPassword">Password</Label>
                    <Input
                      id="loginEmailPassword"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-testid="button-submit-auth"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === "login" ? "Sign In" : "Join ZRF"}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
