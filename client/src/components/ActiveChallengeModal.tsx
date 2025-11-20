import { useState, useEffect } from 'react';
import { useChallengeScheduler } from '@/contexts/ChallengeSchedulerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, X, SkipForward, Check, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

type TimerPhase = 'initial' | 'running' | 'finished';

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
  const [timerPhase, setTimerPhase] = useState<TimerPhase>('initial');
  const [showFailureEffect, setShowFailureEffect] = useState(false);

  useEffect(() => {
    setIsOpen(notificationState !== 'idle');
    
    // Reset phase when modal opens
    if (notificationState === 'active') {
      setTimerPhase('initial');
    }
  }, [notificationState]);

  // Auto-start timer after modal opens (unless user cancels/postpones)
  useEffect(() => {
    if (notificationState === 'active' && timerPhase === 'initial') {
      const autoStartTimer = setTimeout(() => {
        setTimerPhase('running');
      }, 100); // Start almost immediately

      return () => clearTimeout(autoStartTimer);
    }
  }, [notificationState, timerPhase]);

  // Check when timer finishes
  useEffect(() => {
    if (activeChallenge && activeChallenge.timeRemaining <= 0 && timerPhase === 'running') {
      setTimerPhase('finished');
    }
  }, [activeChallenge, timerPhase]);

  const handleCancel = async () => {
    try {
      await cancelChallenge();
      setIsOpen(false);
      toast({
        title: 'İptal Edildi',
        description: 'Challenge iptal edildi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Challenge iptal edilemedi',
        variant: 'destructive',
      });
    }
  };

  const handlePostpone = async () => {
    try {
      await postponeChallenge();
      toast({
        title: 'Ertelendi',
        description: 'Challenge 2 dakika ertelendi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Challenge ertelenemedi',
        variant: 'destructive',
      });
    }
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#10b981', '#86efac'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#10b981', '#86efac'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handleComplete = async (status: 'success' | 'failed') => {
    if (!activeChallenge || isCompletingChallenge) return;

    setIsCompletingChallenge(true);
    const timeSpent = Math.floor((Date.now() - activeChallenge.startTime.getTime()) / 1000);

    if (status === 'success') {
      fireConfetti();
      toast({
        title: '🎉 Tebrikler!',
        description: `Challenge'ı başarıyla tamamladın! ${activeChallenge.challenge.points} puan kazandın!`,
        duration: 5000,
      });
    } else {
      setShowFailureEffect(true);
      setTimeout(() => setShowFailureEffect(false), 1000);
      
      const encouragingMessages = [
        'Olsun! Bir dahakine yaparsın 💪',
        'Sorun değil! Her deneme bir ilerleme 🌟',
        'Pes etme! Başarı yakın 🚀',
        'Bir dahaki sefere odaklan! Sen yaparsın 💫',
      ];
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      
      toast({
        title: 'Olsun!',
        description: randomMessage,
        duration: 4000,
      });
    }

    try {
      await completeChallenge(timeSpent, status, false);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Challenge tamamlanamadı. Tekrar dene.',
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
              <h2 className="text-2xl font-bold">Challenge Yakında Başlıyor!</h2>
              <p className="text-muted-foreground">Hazır ol...</p>
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
                <p className="text-sm text-muted-foreground mt-2">kaldı</p>
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
                İptal
              </Button>
              <Button
                variant="secondary"
                onClick={handlePostpone}
                className="flex-1"
                data-testid="button-postpone-countdown"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                2dk Ertele
              </Button>
              <Button onClick={startChallenge} className="flex-1" data-testid="button-start-now">
                Hemen Başla
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
        <DialogContent 
          className={`max-w-md [&>button]:hidden ${showFailureEffect ? 'animate-shake' : ''}`}
          data-testid="dialog-active-challenge"
        >
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
                  {activeChallenge.challenge.points} puan
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
                <h4 className="font-semibold mb-2">Talimatlar:</h4>
                <p className="text-sm text-muted-foreground">{activeChallenge.challenge.instructions}</p>
              </div>
            )}

            {/* Action buttons - Phase based */}
            {timerPhase === 'initial' && (
              <div className="flex gap-2 w-full pt-4">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  className="flex-1"
                  data-testid="button-cancel-challenge"
                >
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePostpone}
                  className="flex-1"
                  data-testid="button-postpone-challenge"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  2dk Ertele
                </Button>
              </div>
            )}

            {timerPhase === 'running' && (
              <div className="flex gap-2 w-full pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  data-testid="button-cancel-running"
                >
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePostpone}
                  className="flex-1"
                  data-testid="button-postpone-running"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  2dk Ertele
                </Button>
              </div>
            )}

            {timerPhase === 'finished' && (
              <div className="flex gap-2 w-full pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleComplete('failed')}
                  disabled={isCompletingChallenge}
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                  data-testid="button-complete-failed"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Yapmadım
                </Button>
                <Button
                  onClick={() => handleComplete('success')}
                  disabled={isCompletingChallenge}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  data-testid="button-complete-success"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Yaptım!
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
