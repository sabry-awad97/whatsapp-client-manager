import { useEffect, useState } from "react";

interface UseCurrentTimeOptions {
  updateInterval?: number;
}

export function useCurrentTime(options: UseCurrentTimeOptions = {}) {
  const { updateInterval = 1000 } = options;
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  return currentTime;
}
