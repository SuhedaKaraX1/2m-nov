import { Bell, Check, Clock, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Notification = {
  id: string;
  type: "info" | "success" | "reminder";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Challenge Completed!",
    message: "You completed '5-minute meditation' and earned 10 points",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "reminder",
    title: "Daily Challenge Reminder",
    message: "Don't forget to complete your daily challenge today!",
    timestamp: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "New Achievement Unlocked",
    message: "You've unlocked the 'First Steps' achievement",
    timestamp: "1 day ago",
    read: true,
  },
  {
    id: "4",
    type: "success",
    title: "Streak Milestone!",
    message: "Congratulations! You've maintained a 7-day streak",
    timestamp: "2 days ago",
    read: true,
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return <Check className="h-5 w-5 text-green-500" />;
    case "reminder":
      return <Clock className="h-5 w-5 text-blue-500" />;
    case "info":
      return <Info className="h-5 w-5 text-yellow-500" />;
  }
};

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" data-testid="button-mark-all-read">
              Mark all as read
            </Button>
          )}
        </div>

        <Card className="bg-card/30 border-border rounded-2xl" data-testid="card-notifications">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">
              Stay updated with your wellness journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {mockNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              mockNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors ${
                      !notification.read ? "bg-accent/30" : ""
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                  {index < mockNotifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Notification settings can be managed in your{" "}
            <a href="/settings" className="text-primary hover:underline">
              Account Settings
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
