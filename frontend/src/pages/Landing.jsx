import { supabase } from "../supabaseClient";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TrendingDown, PieChart, Bell, Sun, Moon, KeyRound } from 'lucide-react';

// --- BRANDING IMPORT ---
import Logo from '../assets/epramana-logo.png';

const Landing = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [resetEmail, setResetEmail] = useState('');

  const [showUpdatePassword, setShowUpdatePassword] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.href.includes("type=recovery") || window.location.hash.includes("type=recovery");
    }
    return false;
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const currentHash = window.location.hash;
    const currentUrl = window.location.href;

    if (currentHash.includes("type=recovery") || currentUrl.includes("type=recovery")) {
      setShowUpdatePassword(true);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Success! Your password has been updated. You can now log in.");
      setShowUpdatePassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      window.location.hash = '';
      window.history.replaceState(null, '', window.location.pathname);
      setShowLogin(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginData;
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let message = "Something went wrong. Please try again.";
      if (error.message.includes("Invalid login credentials")) message = "Incorrect email or password.";
      if (error.message.includes("Email not confirmed")) message = "Please confirm your email before logging in.";
      alert(message);
      return;
    }
    setShowLogin(false);
    navigate("/dashboard");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = signupData;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, full_name: name });
    }

    alert("Check your email to confirm your account");
    setShowSignup(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Success! Check your email inbox for the password reset link.");
      setShowForgot(false);
      setResetEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 transition-colors duration-500">

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* BRANDING: Header Logo + Clean Text */}
        <div className="flex items-center gap-3">
          <img src={Logo} alt="ePramana Logo" className="h-12 w-auto object-contain drop-shadow-sm" />
          <span className="text-2xl font-bold font-serif text-gray-900 dark:text-gray-100 tracking-wide">
            ePramana
          </span>
        </div>

        <div className="flex gap-3 items-center">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-gray-500 hover:text-gray-900 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:shadow-neon-emerald transition-all">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          <Button variant="outline" onClick={() => setShowLogin(true)} className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:shadow-neon-emerald transition-all duration-200 hover:scale-105">
            Login
          </Button>
          <Button onClick={() => setShowSignup(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all duration-200 hover:scale-105">
            Sign Up
          </Button>
        </div>
      </header>

      {/* BRANDING: Updated Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex justify-center mb-8">
            <img src={Logo} alt="ePramana Hero Logo" className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(184,115,51,0.2)] dark:drop-shadow-[0_0_15px_rgba(184,115,51,0.4)]" />
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold font-serif text-gray-900 dark:text-gray-100 mb-6 leading-tight">
            The <span className="text-emerald-600 dark:text-emerald-400 dark:drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">Analytics</span> of Your Wealth.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
            A secure, modern financial framework built with the precision of Nalanda methodology. Track expenses, master budgets, and unlock deep insights with our unique <strong className="text-[#8B4513] dark:text-[#E8A317]">सनातन (Vedic View)</strong> engine.
          </p>
          <Button onClick={() => setShowSignup(true)} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl dark:shadow-neon-emerald transition-all duration-300 hover:scale-110">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-900 dark:border dark:border-emerald-500/30 rounded-2xl p-8 shadow-md hover:shadow-2xl dark:hover:shadow-neon-emerald transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 dark:group-hover:shadow-neon-emerald group-hover:scale-110">
              <TrendingDown className="w-7 h-7 text-emerald-600 dark:text-emerald-400 transition-colors duration-300 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Track Expenses</h3>
            <p className="text-gray-600 dark:text-gray-400">Easily log and categorize all your daily expenses in one place.</p>
          </div>

          <div className="bg-white dark:bg-gray-900 dark:border dark:border-emerald-500/30 rounded-2xl p-8 shadow-md hover:shadow-2xl dark:hover:shadow-neon-emerald transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 dark:group-hover:shadow-neon-emerald group-hover:scale-110">
              <PieChart className="w-7 h-7 text-emerald-600 dark:text-emerald-400 transition-colors duration-300 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Vedic Visuals</h3>
            <p className="text-gray-600 dark:text-gray-400">Translate spending into the Lunisolar calendar with immersive Chakra visualizers.</p>
          </div>

          <div className="bg-white dark:bg-gray-900 dark:border dark:border-emerald-500/30 rounded-2xl p-8 shadow-md hover:shadow-2xl dark:hover:shadow-neon-emerald transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 dark:group-hover:shadow-neon-emerald group-hover:scale-110">
              <Bell className="w-7 h-7 text-emerald-600 dark:text-emerald-400 transition-colors duration-300 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Zero-Trust Security</h3>
            <p className="text-gray-600 dark:text-gray-400">Password-gated updates and admin-reviewed data wipes protect your information.</p>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
          <DialogHeader>
            <DialogTitle className="text-2xl dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">Welcome Back</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Login to continue to your dashboard</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="dark:text-gray-300">Email</Label>
              <Input
                id="login-email" type="email" placeholder="john@example.com"
                value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="login-password" className="dark:text-gray-300">Password</Label>
                <button
                  type="button"
                  onClick={() => { setShowLogin(false); setShowForgot(true); }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="login-password" type="password" placeholder="••••••••"
                value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all">
              Login
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
              <KeyRound className="w-6 h-6" /> Reset Password
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Enter your email address and we will send you a secure link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="dark:text-gray-300">Email Address</Label>
              <Input
                id="reset-email" type="email" placeholder="john@example.com"
                value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                required className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all">
              Send Reset Link
            </Button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setShowForgot(false); setShowLogin(true); }}
                className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* UPDATE PASSWORD MODAL */}
      <Dialog open={showUpdatePassword} onOpenChange={setShowUpdatePassword}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
          <DialogHeader>
            <DialogTitle className="text-2xl dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
              Secure Your Account
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Please enter a new password below to reset your access.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="dark:text-gray-300">New Password</Label>
              <Input
                id="new-password" type="password" placeholder="••••••••" required
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="dark:text-gray-300">Confirm New Password</Label>
              <Input
                id="confirm-new-password" type="password" placeholder="••••••••" required
                value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all">
              Update Password
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
          <DialogHeader>
            <DialogTitle className="text-2xl dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">Create Account</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Sign up to start tracking your expenses</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="dark:text-gray-300">Full Name</Label>
              <Input
                id="signup-name" type="text" placeholder="John Doe"
                value={signupData.name} onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                required className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="dark:text-gray-300">Email</Label>
              <Input
                id="signup-email" type="email" placeholder="john@example.com"
                value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="dark:text-gray-300">Password</Label>
              <Input
                id="signup-password" type="password" placeholder="••••••••"
                value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm" className="dark:text-gray-300">Confirm Password</Label>
              <Input
                id="signup-confirm" type="password" placeholder="••••••••"
                value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                required className="dark:bg-gray-950 dark:border-gray-700 dark:text-gray-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:hover:bg-emerald-500 dark:shadow-neon-emerald transition-all">
              Sign Up
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;