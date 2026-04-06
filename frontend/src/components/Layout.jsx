import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, LogOut, Menu, X, Sun, Moon, User } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { supabase } from '../supabaseClient';
// NEW IMPORT: Bring in the Profile Modal
import ProfileModal from './ProfileModal';

// --- BRANDING IMPORT ---
import Logo from '../assets/epramana-logo.png';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
  // NEW STATE: Control the Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- DARK MODE STATE & LOGIC ---
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
  // -------------------------------

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setEmail(user.email);
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
        
      if (data) {
        setFullName(data.full_name);
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 transition-colors duration-300 dark:bg-gray-900 dark:border-emerald-500/50 dark:shadow-neon-emerald">
        <div className="flex items-center justify-between px-4 py-3">
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden dark:text-emerald-400 dark:hover:bg-gray-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            {/* BRANDING: LOGO + CLEAN TEXT */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <img 
                src={Logo} 
                alt="ePramana Logo" 
                className="h-10 w-auto object-contain drop-shadow-sm" 
              />
              <span className="text-2xl font-bold font-serif text-gray-900 dark:text-gray-100 tracking-wide">
                ePramana
              </span>
            </Link>

          </div>

          {/* RIGHT SIDE (Theme Toggle + Profile) */}
          <div className="flex items-center gap-4">
            
            {/* THEME TOGGLE BUTTON */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full text-gray-500 hover:text-gray-900 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:shadow-neon-emerald transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full dark:hover:bg-emerald-900/30">
                  {/* AVATAR */}
                  <Avatar className="dark:border dark:border-emerald-500/50 dark:shadow-neon-emerald">
                    <AvatarFallback className="dark:bg-gray-800 dark:text-emerald-400 font-bold">
                      {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 dark:bg-gray-900 dark:border-emerald-500/50" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium dark:text-emerald-400">{fullName}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-emerald-500/30" />
                
                {/* NEW: Profile Details Menu Item */}
                <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="cursor-pointer dark:hover:bg-gray-800">
                  <User className="mr-2 h-4 w-4" />
                  Profile Details
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer dark:text-red-400 dark:hover:bg-gray-800">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className={`
          fixed lg:sticky top-[57px] left-0 z-30 h-[calc(100vh-57px)]
          w-64 bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          dark:bg-gray-900 dark:border-emerald-500/30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700 font-semibold dark:bg-emerald-900/40 dark:text-emerald-400 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)] dark:border dark:border-emerald-500/30'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-emerald-300'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden dark:bg-opacity-70"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* NEW: Render the Profile Modal at the layout level */}
      <ProfileModal 
        open={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        currentEmail={email}
        fullName={fullName}
      />

    </div>
  );
};

export default Layout;