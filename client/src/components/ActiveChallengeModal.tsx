import { useState, useEffect } from 'react';
import { useChallengeScheduler } from '@/contexts/ChallengeSchedulerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, X, SkipForward, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ActiveChallengeModal() {
  const {
    activeChallenge,
    notificationState,
    countdownSeconds,
    startChallenge,
    cancelChallenge,
    postponeChallenge,
    completeChallenge,
  } = useChallengeScheduler();

  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCompletingChallenge, setIsCompletingChallenge] = useState(false);

  useEffect(() => {
    setIsOpen(notificationState !== 'idle');
  }, [notificationState]);

  const handleCancel = async () => {
    try {
      await cancelChallenge();
      toast({
        title: 'Challenge Cancelled',
        description: 'The challenge has been cancelled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel challenge',
        variant: 'destructive',
      });
    }
  };

  const handlePostpone = async () => {
    try {
      await postponeChallenge();
      toast({
        title: 'Challenge Postponed',
        description: 'The challenge has been postponed for 2 minutes.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to postpone challenge',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async (status: 'success' | 'failed') => {
    if (!activeChallenge || isCompletingChallenge) return;

    setIsCompletingChallenge(true);
    const timeSpent = Math.floor((Date.now() - activeChallenge.startTime.getTime()) / 1000);

    try {
      await completeChallenge(timeSpent, status);
      toast({
        title: status === 'success' ? 'Challenge Completed!' : 'Challenge Failed',
        description:
          status === 'success'
            ? `Great job! You earned ${activeChallenge.challenge.points} points.`
            : 'Better luck next time!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete challenge',
        variant: 'destructive',
      });
    } finally {
      setIsCompletingChallenge(false);
    }
  };

  // Countdown screen (3-2-1 before challenge starts)
  if (notificationState === 'countdown') {
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    const showLargeCountdown = countdownSeconds > 0 && countdownSeconds <= 3;

    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md [&>button]:hidden" data-testid="dialog-countdown">
          <div className="flex flex-col items-center justify-center space-y-8 py-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Challenge Starting Soon!</h2>
              <p className="text-muted-foreground">Get ready...</p>
            </div>

            {showLargeCountdown ? (
              <div className="relative">
                <div className="text-9xl font-bold text-primary animate-pulse" data-testid="text-final-countdown">
                  {countdownSeconds}
                </div>
              </div>
            ) : (
              <div className="text-center" data-testid="text-time-remaining">
                <div className="text-5xl font-bold text-muted-foreground">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">until challenge starts</p>
              </div>
            )}

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                data-testid="button-cancel-countdown"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handlePostpone}
                className="flex-1"
                data-testid="button-postpone-countdown"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Postpone 2m
              </Button>
              <Button onClick={startChallenge} className="flex-1" data-testid="button-start-now">
                Start Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Active challenge screen with circular timer
  if (notificationState === 'active' && activeChallenge) {
    const progress = (activeChallenge.timeRemaining / 120) * 100;
    const minutes = Math.floor(activeChallenge.timeRemaining / 60);
    const seconds = Math.floor(activeChallenge.timeRemaining % 60);

    // Calculate color gradient from green to red
    const hue = (progress / 100) * 120; // 120 = green, 0 = red
    const color = `hsl(${hue}, 70%, 50%)`;

    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md [&>button]:hidden" data-testid="dialog-active-challenge">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">{activeChallenge.challenge.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            {/* Circular Timer */}
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  opacity="0.2"
                />
                {/* Progress circle with gradient */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                />
              </svg>

              {/* Timer text in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold" style={{ color }} data-testid="text-timer">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {activeChallenge.challenge.points} points
                </div>
              </div>
            </div>

            {/* Challenge description */}
            <div className="text-center max-w-sm">
              <p className="text-muted-foreground">{activeChallenge.challenge.description}</p>
            </div>

            {/* Instructions */}
            {activeChallenge.challenge.instructions && (
              <div className="w-full bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Instructions:</h4>
                <p className="text-sm text-muted-foreground">{activeChallenge.challenge.instructions}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 w-full pt-4">
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="flex-1"
                data-testid="button-cancel-challenge"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handlePostpone}
                className="flex-1"
                data-testid="button-postpone-challenge"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Postpone 2m
              </Button>
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => handleComplete('failed')}
                disabled={isCompletingChallenge}
                className="flex-1"
                data-testid="button-complete-failed"
              >
                I Couldn't Do It
              </Button>
              <Button
                onClick={() => handleComplete('success')}
                disabled={isCompletingChallenge}
                className="flex-1"
                data-testid="button-complete-success"
              >
                <Check className="w-4 h-4 mr-2" />
                Completed!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
