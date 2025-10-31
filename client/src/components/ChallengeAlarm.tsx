import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, X, Clock } from "lucide-react";
import type { Challenge } from "@shared/schema";

interface ChallengeAlarmProps {
  isOpen: boolean;
  challenge: Challenge;
  onStart: () => void;
  onSnooze: () => void;
  onCancel: () => void;
}

export function ChallengeAlarm({
  isOpen,
  challenge,
  onStart,
  onSnooze,
  onCancel,
}: ChallengeAlarmProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (!showCountdown || countdown === null) return;

    if (countdown === 0) {
      setShowCountdown(false);
      setCountdown(null);
      onStart();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, showCountdown, onStart]);

  const handleStart = () => {
    setShowCountdown(true);
    setCountdown(3); // Start countdown from 3
  };

  const handleCancel = () => {
    setShowCountdown(false);
    setCountdown(null);
    onCancel();
  };

  const handleSnooze = () => {
    setShowCountdown(false);
    setCountdown(null);
    onSnooze();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="dialog-challenge-alarm"
      >
        {showCountdown && countdown !== null ? (
          // Countdown display (3-2-1)
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-9xl font-bold text-primary animate-pulse" data-testid="text-countdown">
              {countdown}
            </div>
            <p className="text-muted-foreground mt-4">Get ready...</p>
          </div>
        ) : (
          // Alarm notification
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-primary animate-bounce" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl" data-testid="text-alarm-title">
                Challenge Time!
              </DialogTitle>
              <DialogDescription className="text-center text-base mt-2">
                It's time for your 2-minute challenge
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-lg" data-testid="text-challenge-title">
                  {challenge.title}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-challenge-description">
                  {challenge.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                    {challenge.category}
                  </span>
                  <span className="bg-secondary px-2 py-1 rounded">
                    {challenge.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    2 minutes
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                onClick={handleStart}
                size="lg"
                className="w-full"
                data-testid="button-start-challenge"
              >
                Start Challenge Now
              </Button>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleSnooze}
                  className="flex-1"
                  data-testid="button-snooze-challenge"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Snooze (2 min)
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  data-testid="button-cancel-challenge"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
