"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"
import {supabase} from "@/lib/supabaseClient"
import { useRouter } from "next/navigation";

type AuthFormType = "login" | "signup" | "forgot-password"

export function AuthForm({ className, ...props }: React.ComponentProps<"div">) {
  const [formType, setFormType] = useState<AuthFormType>("login")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) {
        setError(error.message);
        return;
      }
  
      if (data.session) {
        const userId = data.session.user.id;
  
        // Query the membership info
        const { data: statusData, error: statusError } = await supabase
          .from("users")
          .select("status") // or whatever your column is called (maybe 'type')
          .eq("id", userId)
          .single();
  
        if (statusError || !statusData) {
          console.error('Error fetching role:', statusError);
          setError('Could not determine user role.');
          return;
        }
  
        const role = statusData.status;
  
        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError('Login failed. No session found.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    const user = data?.user;

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      router.push('/products');
      
    }
 
  };

  // Get the token from URL query parameter
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (token && token !== 'reset-password') {
      setResetToken(token);
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setResetSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetToken) return;

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      router.push('/login');
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 p-0 items-stretch">
          <div className="p-6 md:p-8">
            {formType === "login" && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                handleLogin={handleLogin}
                loading={loading}
                error={error}
                onSignUpClick={() => setFormType("signup")}
                onForgotPasswordClick={() => setFormType("forgot-password")}
              />
            )}
            {formType === "signup" && (
              <SignUpForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                handleSubmit={handleSubmit}
                loading={isSubmitting}
                error={error}
                onLoginClick={() => setFormType("login")}
              />
            )}
            {formType === "forgot-password" && (
              <ForgotPasswordForm
                email={email}
                setEmail={setEmail}
                handleReset={handleReset}
                loading={loading}
                error={error}
                success={success}
                onBackToLoginClick={() => setFormType("login")}
              />
            )}
            {resetToken && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="p-6 md:p-8 relative overflow-hidden hidden md:block">
            <div className="absolute inset-0 bg-moving-gradient"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full animate-pulse [animation-delay:2s]"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/30 rounded-full animate-pulse [animation-delay:4s]"></div>
            <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-white/10 rounded-full animate-pulse [animation-delay:6s]"></div>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  )
}

function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  loading,
  error,
  onSignUpClick,
  onForgotPasswordClick,
}: {
  email: string
  setEmail: React.Dispatch<React.SetStateAction<string>>
  password: string
  setPassword: React.Dispatch<React.SetStateAction<string>>
  handleLogin: () => Promise<void>
  loading: boolean
  error: string | null
  onSignUpClick: () => void
  onForgotPasswordClick: () => void
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-balance text-muted-foreground">Login to your Acme Inc account</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="m@example.com" required  value={email}
          onChange={(e) => setEmail(e.target.value)}/>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Type your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm underline-offset-2 hover:underline"
          >
            Forgot your password?
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Login with Apple</span>
        </Button>
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Login with Google</span>
        </Button>
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Login with Meta</span>
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSignUpClick} className="underline underline-offset-4 hover:text-primary">
          Sign up
        </button>
      </div>
    </form>
  )
}

function SignUpForm({
  email,
  setEmail,
  password,
  setPassword,
  handleSubmit,
  loading,
  error,
  onLoginClick,
}: {
  email: string
  setEmail: React.Dispatch<React.SetStateAction<string>>
  password: string
  setPassword: React.Dispatch<React.SetStateAction<string>>
  handleSubmit: (e: React.FormEvent) => Promise<void>
  loading: boolean
  error: string | null
  onLoginClick: () => void
}) {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-muted-foreground">Sign up to get started with Acme Inc</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Sign up with Apple</span>
        </Button>
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Sign up with Google</span>
        </Button>
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Sign up with Meta</span>
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <button type="button" onClick={onLoginClick} className="underline underline-offset-4 hover:text-primary">
          Login
        </button>
      </div>
    </form>
  )
}

function ForgotPasswordForm({
  email,
  setEmail,
  handleReset,
  loading,
  error,
  success,
  onBackToLoginClick,
}: {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  handleReset: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
  onBackToLoginClick: () => void;
}) {
  return (
    <form onSubmit={handleReset} className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBackToLoginClick}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </button>
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-balance text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending reset link...' : 'Send Reset Link'}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {success && <p className="text-green-500 text-sm mt-2">Check your email for the reset link.</p>}
      <div className="text-center text-sm">
        Remember your password?{' '}
        <button
          type="button"
          onClick={onBackToLoginClick}
          className="underline underline-offset-4 hover:text-primary"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}
