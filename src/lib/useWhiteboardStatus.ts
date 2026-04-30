import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface WhiteboardStatus {
  active: boolean;
  uuid?: string;
  room_token?: string;
}

export const useWhiteboardStatus = (isTeacher: boolean, pollInterval = 4000) => {
  const [whiteboardStatus, setWhiteboardStatus] = useState<WhiteboardStatus>({ active: false });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Teachers don't need to poll — they control it
    if (isTeacher) return;

    const checkStatus = async () => {
      try {
        const res = await axios.get('/api/classroom/whiteboard-status');
        setWhiteboardStatus(res.data);
      } catch (err) {
        console.error('Whiteboard status check failed:', err);
      }
    };

    // Check immediately, then every N seconds
    checkStatus();
    intervalRef.current = setInterval(checkStatus, pollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTeacher, pollInterval]);

  // Stop polling once whiteboard is found
  useEffect(() => {
    if (whiteboardStatus.active && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [whiteboardStatus.active]);

  return whiteboardStatus;
};