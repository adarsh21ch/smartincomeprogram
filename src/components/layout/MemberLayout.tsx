import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/landing/Logo";
import { Film, BookOpen, GraduationCap, User, LogOut, Shield, Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tabs = [
  { icon: Film, label: "Program", path: "/home" },
  { icon: BookOpen, label: "About", path: "/home/about" },
  { icon: GraduationCap, label: "Courses", path: "/home/courses" },
];

export const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { isAdmin } = useAdmin();
  const { theme, toggleTheme } = useTheme();

  const firstName = profile?.full_name?.split(" ")[0] || "Member";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/home">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {initials}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{firstName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User size={14} className="mr-2" /> My Profile
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                      <Shield size={14} className="mr-2" /> Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut size={14} className="mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden md:block border-t border-border">
          <div className="max-w-5xl mx-auto flex px-4">
            {tabs.map((tab) => {
              const active = tab.path === "/home"
                ? location.pathname === "/home"
                : location.pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border flex justify-around py-1.5 z-50 safe-area-pb">
        {tabs.map((tab) => {
          const active = tab.path === "/home"
            ? location.pathname === "/home"
            : location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
