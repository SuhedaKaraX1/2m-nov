import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/hooks/useNotifications';
import type { Challenge } from '@shared/schema';

interface ScheduledChallenge {
  id: string;
  userId: string;
  challengeId: string;
  scheduledTime: Date;
  status: 'pending' | 'notified' | 'snoozed' | 'cancelled' | 'completed';
  snoozedUntil: Date | null;
  createdAt: Date | null;
  challenge: Challenge;
}

interface ActiveChallenge {
  scheduledChallengeId: string;
  challenge: Challenge;
  startTime: Date;
  timeRemaining: number;
}

interface ChallengeSchedulerContextType {
  nextChallenge: ScheduledChallenge | null;
  activeChallenge: ActiveChallenge | null;
  isLoading: boolean;
  notificationState: 'idle' | 'countdown' | 'active';
  countdownSeconds: number;
  startChallenge: () => void;
  cancelChallenge: () => Promise<void>;
  postponeChallenge: () => Promise<void>;
  completeChallenge: (timeSpent: number, status: 'success' | 'failed') => Promise<void>;
}

const ChallengeSchedulerContext = createContext<ChallengeSchedulerContextType | null>(null);

const POLL_INTERVAL = 30 * 1000; // 30 seconds
const NOTIFICATION_ADVANCE = 2 * 60 * 1000; // 2 minutes
const CHALLENGE_DURATION = 2 * 60; // 2 minutes in seconds

export function ChallengeSchedulerProvider({ children }: { children: ReactNode }) {
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null);
  const [notificationState, setNotificationState] = useState<'idle' | 'countdown' | 'active'>('idle');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [notifiedChallengeId, setNotifiedChallengeId] = useState<string | null>(null);
  const [isCompletingChallenge, setIsCompletingChallenge] = useState(false);
  const isCompletingRef = useRef(false);

  const { isGranted, requestPermission, showChallengeNotification, showChallengeStartNotification } = useNotifications();

  // Poll for next scheduled challenge
  const { data: nextChallenge, isLoading, refetch } = useQuery<ScheduledChallenge | null>({
    queryKey: ['/api/challenges/scheduled/next'],
    refetchInterval: activeChallenge ? false : POLL_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Check if we should show notification (2 minutes before)
  useEffect(() => {
    if (!nextChallenge || activeChallenge) return;

    const now = Date.now();
    const scheduledTime = new Date(nextChallenge.scheduledTime).getTime();
    const timeUntilChallenge = scheduledTime - now;

    // If we haven't notified for this challenge yet and it's within 2 minutes
    if (
      timeUntilChallenge <= NOTIFICATION_ADVANCE &&
      timeUntilChallenge > 0 &&
      notifiedChallengeId !== nextChallenge.id
    ) {
      setNotificationState('countdown');
      setNotifiedChallengeId(nextChallenge.id);
      // Seed countdown with actual remaining time
      setCountdownSeconds(Math.max(0, Math.ceil(timeUntilChallenge / 1000)));

      if (isGranted) {
        showChallengeNotification(nextChallenge.challenge.title, nextChallenge.id);
      }
    }

    // If scheduled time is in the past (user opened app after challenge time)
    // OR if countdown is active and it's time to start
    if (timeUntilChallenge <= 0) {
      if (notificationState !== 'active' && notifiedChallengeId !== nextChallenge.id) {
        setNotifiedChallengeId(nextChallenge.id);
      }
      handleChallengeStart();
    }
  }, [nextChallenge, activeChallenge, notifiedChallengeId, isGranted, notificationState]);

  // Countdown timer (full remaining time, with 3-2-1 for final seconds)
  useEffect(() => {
    if (notificationState !== 'countdown' || !nextChallenge) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const scheduledTime = new Date(nextChallenge.scheduledTime).getTime();
      const secondsRemaining = Math.ceil((scheduledTime - now) / 1000);

      // Always update countdown (not just final 3 seconds)
      setCountdownSeconds(Math.max(0, secondsRemaining));

      if (secondsRemaining <= 0) {
        handleChallengeStart();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [notificationState, nextChallenge]);

  // Active challenge timer
  useEffect(() => {
    if (!activeChallenge || isCompletingChallenge) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - activeChallenge.startTime.getTime()) / 1000; // Keep decimal precision
      const remaining = Math.max(0, CHALLENGE_DURATION - elapsed);

      setActiveChallenge((prev) => (prev ? { ...prev, timeRemaining: remaining } : null));

      if (remaining <= 0.1 && !isCompletingRef.current) { // Use ref to prevent duplicate calls
        // Auto-complete as failed if time runs out
        completeChallenge(CHALLENGE_DURATION, 'failed').catch((error) => {
          console.error('Auto-complete failed:', error);
          // Keep ref true to prevent retry loop - user must manually complete
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeChallenge, isCompletingChallenge]);

  const handleChallengeStart = useCallback(() => {
    if (!nextChallenge) return;

    setNotificationState('active');
    setActiveChallenge({
      scheduledChallengeId: nextChallenge.id,
      challenge: nextChallenge.challenge,
      startTime: new Date(),
      timeRemaining: CHALLENGE_DURATION,
    });

    if (isGranted) {
      showChallengeStartNotification(nextChallenge.challenge.title, nextChallenge.id);
    }
  }, [nextChallenge, isGranted, showChallengeStartNotification]);

  const startChallenge = useCallback(() => {
    if (nextChallenge) {
      setCountdownSeconds(0);
      handleChallengeStart();
    }
  }, [nextChallenge, handleChallengeStart]);

  const cancelChallenge = useCallback(async () => {
    const targetId = activeChallenge?.scheduledChallengeId || nextChallenge?.id;
    if (!targetId) return;

    try {
      const response = await fetch(`/api/challenges/scheduled/${targetId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to cancel challenge');

      setActiveChallenge(null);
      setNotificationState('idle');
      setNotifiedChallengeId(null);
      setCountdownSeconds(0);
      refetch();
    } catch (error) {
      console.error('Error canceling challenge:', error);
      throw error;
    }
  }, [activeChallenge, nextChallenge, refetch]);

  const postponeChallenge = useCallback(async () => {
    const targetId = activeChallenge?.scheduledChallengeId || nextChallenge?.id;
    if (!targetId) return;

    try {
      const response = await fetch(`/api/challenges/scheduled/${targetId}/postpone`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to postpone challenge');

      setActiveChallenge(null);
      setNotificationState('idle');
      setNotifiedChallengeId(null);
      setCountdownSeconds(0);
      refetch();
    } catch (error) {
      console.error('Error postponing challenge:', error);
      throw error;
    }
  }, [activeChallenge, nextChallenge, refetch]);

  const completeChallenge = useCallback(
    async (timeSpent: number, status: 'success' | 'failed') => {
      if (!activeChallenge || isCompletingRef.current) return;

      isCompletingRef.current = true;
      setIsCompletingChallenge(true);

      try {
        const response = await fetch(`/api/challenges/scheduled/${activeChallenge.scheduledChallengeId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSpent, status }),
        });

        if (!response.ok) throw new Error('Failed to complete challenge');

        setActiveChallenge(null);
        setNotificationState('idle');
        setNotifiedChallengeId(null);
        setCountdownSeconds(0);
        setIsCompletingChallenge(false);
        isCompletingRef.current = false;
        refetch();
      } catch (error) {
        console.error('Error completing challenge:', error);
        setIsCompletingChallenge(false);
        isCompletingRef.current = false;
        throw error;
      }
    },
    [activeChallenge, refetch]
  );

  // Request notification permission on mount if not granted
  useEffect(() => {
    if (!isGranted) {
      requestPermission();
    }
  }, []);

  return (
    <ChallengeSchedulerContext.Provider
      value={{
        nextChallenge: nextChallenge ?? null,
        activeChallenge,
        isLoading,
        notificationState,
        countdownSeconds,
        startChallenge,
        cancelChallenge,
        postponeChallenge,
        completeChallenge,
      }}
    >
      {children}
    </ChallengeSchedulerContext.Provider>
  );
}

export function useChallengeScheduler() {
  const context = useContext(ChallengeSchedulerContext);
  if (!context) {
    throw new Error('useChallengeScheduler must be used within ChallengeSchedulerProvider');
  }
  return context;
}
