import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface CircularTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  onTimeUpdate?: (timeRemaining: number) => void;
}

export function CircularTimer({ duration, onComplete, onTimeUpdate }: CircularTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((duration - timeRemaining) / duration) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (onTimeUpdate) {
            onTimeUpdate(newTime);
          }
          if (newTime <= 0) {
            setIsRunning(false);
            setIsComplete(true);
            onComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeRemaining, onComplete, onTimeUpdate]);

  const handleToggle = () => {
    if (isComplete) return; // Don't allow toggling after completion
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (isComplete) return; // Don't allow reset after completion
    setIsRunning(false);
    setIsComplete(false);
    setTimeRemaining(duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-8" data-testid="circular-timer">
      {/* Circular Progress */}
      <div className="relative">
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="8"
            className="opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))",
            }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold tabular-nums text-foreground" data-testid="timer-display">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {isComplete ? "Complete!" : "Remaining"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isComplete ? (
          <>
            <Button
              size="lg"
              onClick={handleToggle}
              className="min-w-32"
              data-testid="button-toggle-timer"
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {timeRemaining === duration ? "Start" : "Resume"}
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset-timer"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            onClick={handleReset}
            className="min-w-32"
            data-testid="button-restart-timer"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
