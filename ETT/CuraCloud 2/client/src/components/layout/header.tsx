import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: getCurrentUser,
    retry: false
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      setLocation('/');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging you out.",
        variant: "destructive",
      });
    }
  });

  if (!user) {
    return null;
  }

  const getNavLinks = () => {
    switch (user.role) {
      case 'patient':
        return [
          { href: '/dashboard/overview', label: 'Dashboard' },
          { href: '/dashboard/records', label: 'Records' },
          { href: '/dashboard/access', label: 'Access' },
        ];
      case 'doctor':
        return [
          { href: '/doctor/overview', label: 'Dashboard' },
          { href: '/doctor/patients', label: 'Patients' },
          { href: '/doctor/notes', label: 'Notes' },
        ];
      case 'admin':
        return [
          { href: '/admin/overview', label: 'Dashboard' },
          { href: '/admin/users', label: 'Users' },
          { href: '/admin/verifications', label: 'Verifications' },
        ];
      default:
        return [];
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">+</span>
              </div>
              <h1 className="text-xl font-bold text-primary">CuraCloud</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            {getNavLinks().map((link) => (
              <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <span className="font-medium">{user.name}</span>
                <span className="text-muted-foreground block capitalize">{user.role}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
