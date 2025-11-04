import {
  Home,
  Target,
  TrendingUp,
  Trophy,
  BarChart3,
  Users,
  UserIcon,
  Settings,
  Plus,
  Menu as MenuIcon,
  Bell,
  NotebookPen,
  LogOut,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JournalPage from "@/pages/Journal";    

const LOGOUT_URL = "/api/logout"; // Sunucunuz farklıysa (/api/auth/logout) burayı değiştirin.

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "My Challenges", url: "/challenges", icon: Target },
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "Journal", url: "/journal", icon: NotebookPen },
  { title: "Friends", url: "/friends", icon: Users },
  { title: "Profile", url: "/profile", icon: UserIcon },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location, navigate] = useLocation(); // <- navigate eklendi
  const { user } = useAuth();

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.email?.[0]?.toUpperCase() || "U";

  async function handleLogout() {
    try {
      await fetch(LOGOUT_URL, { method: "POST", credentials: "include" }).catch(
        () => fetch(LOGOUT_URL, { method: "GET", credentials: "include" }),
      );
    } catch {
      // Ignore network errors
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <Sidebar data-testid="sidebar-app">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <a
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Create</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/create-challenge"}
                >
                  <a
                    href="/create-challenge"
                    data-testid="link-create-challenge"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Challenge</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/my-challenges"}
                >
                  <a href="/my-challenges" data-testid="link-my-challenges">
                    <Target className="h-4 w-4" />
                    <span>My Custom Challenges</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ==== Bottom user area: click name/avatar opens dropdown ==== */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              {/* Trigger: gerçek <button> kullanıyoruz */}
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 px-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 truncate">
                    {user?.firstName || user?.username || user?.email || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild data-testid="menu-item-account">
                  <a href="/settings">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild data-testid="menu-item-notifications">
                  <a href="/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  data-testid="menu-item-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
