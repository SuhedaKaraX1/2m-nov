import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChallengeAlarm } from "@/components/ChallengeAlarm";
import { useLocation } from "wouter";
import type { Challenge, ScheduledChallenge } from "@shared/schema";

interface NotificationContextType {
  scheduleChallenge: (
    challengeId: string,
    scheduledTime: Date,
  ) => Promise<void>;
  getPendingNotifications: () => ScheduledChallenge[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [, navigate] = useLocation();
  const [activeAlarm, setActiveAlarm] = useState<{
    challenge: Challenge;
    scheduledChallengeId: string;
  } | null>(null);

  // Pending scheduled challenges'ı çek
  const { data: scheduledChallenges = [], refetch: refetchScheduled } =
    useQuery<ScheduledChallenge[]>({
      queryKey: ["/api/scheduled-challenges"],
      queryFn: async () => {
        const res = await fetch(`/api/scheduled-challenges`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            return [];
          }
          throw new Error(
            `Failed to load scheduled challenges (${res.status})`,
          );
        }
        return (await res.json()) as ScheduledChallenge[];
      },
      refetchInterval: 2000,
      staleTime: 1000,
      retry: false,
    });

  // Alarm tetikleme kontrolü
  useEffect(() => {
    if (!scheduledChallenges.length) return;

    const checkInterval = setInterval(() => {
      const currentTime = new Date();

      for (const scheduled of scheduledChallenges) {
        if (scheduled.status !== "pending") continue;

        const scheduledTime = new Date(scheduled.scheduledTime);
        const timeDiff = scheduledTime.getTime() - currentTime.getTime();

        const shouldTrigger =
          timeDiff <= 0 ||
          (scheduled.snoozedUntil &&
            new Date(scheduled.snoozedUntil) <= currentTime);

        if (shouldTrigger && !activeAlarm) {
          // Challenge detayını çek ve alarmı göster
          fetchChallengeAndShowAlarm(scheduled.challengeId, scheduled.id);
          break;
        }
      }
    }, 1000); // her saniye kontrol

    return () => clearInterval(checkInterval);
  }, [scheduledChallenges, activeAlarm]);

  const fetchChallengeAndShowAlarm = async (
    challengeId: string,
    scheduledChallengeId: string,
  ) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        console.error(
          `Failed to fetch challenge ${challengeId} (${response.status})`,
        );
        return;
      }
      const challenge = (await response.json()) as Challenge;
      setActiveAlarm({ challenge, scheduledChallengeId });
    } catch (error) {
      console.error("Error fetching challenge for alarm:", error);
    }
  };

  const snoozeMutation = useMutation({
    mutationFn: async (scheduledChallengeId: string) => {
      const snoozeUntil = new Date(Date.now() + 2 * 60 * 1000); // 2 dakika sonrası
      await apiRequest(
        "PATCH",
        `/api/scheduled-challenges/${scheduledChallengeId}`,
        {
          status: "snoozed",
          snoozedUntil: snoozeUntil.toISOString(),
        },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/scheduled-challenges"],
      });
      await refetchScheduled();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (scheduledChallengeId: string) => {
      await apiRequest(
        "PATCH",
        `/api/scheduled-challenges/${scheduledChallengeId}`,
        {
          status: "cancelled",
        },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/scheduled-challenges"],
      });
      await refetchScheduled();
    },
  });

  const startMutation = useMutation({
    mutationFn: async (scheduledChallengeId: string) => {
      await apiRequest(
        "PATCH",
        `/api/scheduled-challenges/${scheduledChallengeId}`,
        {
          status: "notified",
        },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/scheduled-challenges"],
      });
      await refetchScheduled();
    },
  });

  const handleStart = () => {
    if (!activeAlarm) return;

    startMutation.mutate(activeAlarm.scheduledChallengeId);
    // Zamanlayıcı ile challenge detay sayfasına git
    navigate(`/challenge/${activeAlarm.challenge.id}`);
    setActiveAlarm(null);
  };

  const handleSnooze = async () => {
    if (!activeAlarm) return;

    await snoozeMutation.mutateAsync(activeAlarm.scheduledChallengeId);
    setActiveAlarm(null);
  };

  const handleCancel = async () => {
    if (!activeAlarm) return;

    await cancelMutation.mutateAsync(activeAlarm.scheduledChallengeId);
    setActiveAlarm(null);
  };

  const scheduleChallenge = useCallback(
    async (challengeId: string, scheduledTime: Date) => {
      try {
        await apiRequest("POST", `/api/scheduled-challenges`, {
          challengeId,
          scheduledTime: scheduledTime.toISOString(),
          status: "pending",
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/scheduled-challenges"],
        });
      } catch (error) {
        console.error("Error scheduling challenge:", error);
        throw error;
      }
    },
    [],
  );

  const getPendingNotifications = useCallback(() => {
    return scheduledChallenges.filter((sc) => sc.status === "pending");
  }, [scheduledChallenges]);

  return (
    <NotificationContext.Provider
      value={{
        scheduleChallenge,
        getPendingNotifications,
      }}
    >
      {children}
      {activeAlarm && (
        <ChallengeAlarm
          isOpen={true}
          challenge={activeAlarm.challenge}
          onStart={handleStart}
          onSnooze={handleSnooze}
          onCancel={handleCancel}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}
