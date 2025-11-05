import { useEffect, useRef, useState, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}

interface TrackingState {
  isConnected: boolean;
  contractorLocation: Location | null;
  customerLocation: Location | null;
  eta: string | null;
  status: string;
  contractorOnline: boolean;
}

interface UseTrackingWebSocketOptions {
  jobId: string;
  userId?: string;
  role?: 'customer' | 'contractor' | 'guest';
  onLocationUpdate?: (location: Location) => void;
  onStatusUpdate?: (status: string) => void;
  onEtaUpdate?: (eta: string) => void;
}

export const useTrackingWebSocket = ({
  jobId,
  userId,
  role = 'guest',
  onLocationUpdate,
  onStatusUpdate,
  onEtaUpdate
}: UseTrackingWebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<TrackingState>({
    isConnected: false,
    contractorLocation: null,
    customerLocation: null,
    eta: null,
    status: 'new',
    contractorOnline: false
  });

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/tracking`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true }));

        // Join tracking room
        ws.current?.send(JSON.stringify({
          type: 'JOIN_TRACKING',
          payload: { jobId, userId, role }
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false, contractorOnline: false }));
        
        // Attempt to reconnect after 3 seconds
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [jobId, userId, role]);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'JOIN_TRACKING':
        if (message.payload.success) {
          setState(prev => ({
            ...prev,
            status: message.payload.status || prev.status,
            contractorLocation: message.payload.lastLocation || prev.contractorLocation,
            eta: message.payload.lastEta || prev.eta,
            contractorOnline: message.payload.contractorOnline
          }));
        }
        break;

      case 'LOCATION_UPDATE':
        setState(prev => ({
          ...prev,
          contractorLocation: message.payload.location,
          eta: message.payload.eta
        }));
        onLocationUpdate?.(message.payload.location);
        onEtaUpdate?.(message.payload.eta);
        break;

      case 'STATUS_UPDATE':
        setState(prev => ({
          ...prev,
          status: message.payload.status
        }));
        onStatusUpdate?.(message.payload.status);
        break;

      case 'CONTRACTOR_JOINED':
        setState(prev => ({
          ...prev,
          contractorOnline: true
        }));
        break;

      case 'CONTRACTOR_LEFT':
        setState(prev => ({
          ...prev,
          contractorOnline: false
        }));
        break;

      case 'ERROR':
        console.error('WebSocket error:', message.payload.error);
        break;
    }
  }, [onLocationUpdate, onStatusUpdate, onEtaUpdate]);

  const sendLocationUpdate = useCallback((location: Location) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'LOCATION_UPDATE',
        payload: {
          lat: location.lat,
          lng: location.lng,
          accuracy: 10,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, []);

  const sendStatusUpdate = useCallback((status: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'STATUS_UPDATE',
        payload: { status }
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.send(JSON.stringify({
        type: 'LEAVE_TRACKING',
        payload: {}
      }));
      ws.current.close();
      ws.current = null;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    sendLocationUpdate,
    sendStatusUpdate,
    disconnect,
    reconnect: connect
  };
};