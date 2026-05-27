import { useState, useEffect } from "react";

interface EggCountdownProps {
  hatchReadyAt: string;
}

export function EggCountdown({ hatchReadyAt }: EggCountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(hatchReadyAt).getTime();
  const diff = target - now;

  if (diff <= 0) return <span className="egg-ready">¡Listo!</span>;

  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <span>
      {hours > 0 && `${hours}h `}{mins > 0 && `${mins}m `}{secs}s
    </span>
  );
}
