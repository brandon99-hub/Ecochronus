import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Sparkles, Mail, Lock, Loader2, User, Compass, Shield, ScrollText } from "lucide-react";
import loginBg from "@assets/generated_images/login_background_nebula.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@/lib/validation";
import { z } from "zod";

const heroPoints = [
  {
    title: "Choose Your Patron",
    description: "Align with Zeus, Athena, Artemis, or Persephone to unlock unique blessings.",
    icon: Shield,
  },
  {
    title: "Cleanse Corruption",
    description: "Undertake quests that lower regional corruption and earn eco karma.",
    icon: Compass,
  },
  {
    title: "Unlock Lore",
    description: "Each chapter reveals secrets of EcoChronos and rewards rare items.",
    icon: ScrollText,
  },
];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await api.login(data);
      toast({
        title: "Welcome back, Avatar!",
        description: "Your journey to restore Earth continues.",
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
      });
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await api.register(data);
      toast({
        title: "Avatar awakened!",
        description: "Your epic journey begins now.",
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
      });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
      <ParticleField />

      <div className="relative z-10 max-w-6xl w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="space-y-6 text-white animate-fade-up">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.4em]">
            <Sparkles className="h-4 w-4 text-primary" />
            EcoChronos Codex
          </div>
          <div className="space-y-4">
            <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight text-white">
              Awaken, Avatar.
              <br />
              The timeline needs you.
            </h1>
            <p className="text-base text-white/80 max-w-xl">
              Sign in to continue your crusade or forge a new avatar to cleanse corrupted regions,
              earn eco karma, and restore divine balance.
            </p>
          </div>

          <Separator className="bg-white/20" />

          <div className="grid gap-4">
            {heroPoints.map((point) => (
              <div
                key={point.title}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <point.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-white">{point.title}</p>
                  <p className="text-sm text-white/70">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-up delay-100">
          <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-br from-primary/40 via-transparent to-primary/10 blur-2xl opacity-70" />
          <Card className="relative backdrop-blur-2xl bg-background/95 border-2 border-primary/30 shadow-2xl rounded-[32px]">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-serif text-center">
              Begin Your Journey
            </CardTitle>
            <CardDescription className="text-center text-base">
              Enter the realm and embark on your quest
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="avatar@ecochronos.com"
                                className="pl-10"
                                data-testid="input-login-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Enter your password"
                                className="pl-10"
                                data-testid="input-login-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-6 glow-primary"
                      disabled={loginForm.formState.isSubmitting}
                      data-testid="button-login"
                    >
                      {loginForm.formState.isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entering...</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Enter the Realm</>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="avatar@ecochronos.com"
                                className="pl-10"
                                data-testid="input-register-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="text"
                                placeholder="earthshaper"
                                className="pl-10"
                                data-testid="input-register-username"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Create a password"
                                className="pl-10"
                                data-testid="input-register-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-6 glow-primary"
                      disabled={registerForm.formState.isSubmitting}
                      data-testid="button-register"
                    >
                      {registerForm.formState.isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Awakening...</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Awaken as Avatar</>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

          <p className="text-center text-sm text-gray-300 mt-6">
            Join the chosen ones in their quest to save Earth.
          </p>
        </div>
      </div>
    </div>
  );
}

function ParticleField() {
  const particles = Array.from({ length: 25 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, index) => (
        <span
          key={index}
          className={cn(
            "absolute h-1 w-1 rounded-full bg-primary/40 animate-pulse",
            "blur-[1px]"
          )}
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}
