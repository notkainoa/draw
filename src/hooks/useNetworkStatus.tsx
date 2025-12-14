import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  justCameOnline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setIsOnline(true);
      
      if (wasOffline) {
        setJustCameOnline(true);
        // Reset the flag after a short delay to allow sync operations
        setTimeout(() => {
          setJustCameOnline(false);
          setWasOffline(false);
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('Network: Gone offline');
      setIsOnline(false);
      setWasOffline(true);
      setJustCameOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check periodically by trying to fetch a small resource
    const checkConnectivity = async () => {
      try {
        const response = await fetch('/health', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok && !isOnline) {
          handleOnline();
        }
      } catch (error) {
        if (isOnline) {
          handleOffline();
        }
      }
    };

    // Check connectivity every 30 seconds
    const connectivityInterval = setInterval(checkConnectivity, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    wasOffline,
    justCameOnline,
  };
}
