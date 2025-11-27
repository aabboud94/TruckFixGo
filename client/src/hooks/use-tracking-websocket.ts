import { useEffect, useRef, useState, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}

interface RouteStop {
  stopId: string;
  jobId: string;
  location: Location;
  estimatedArrival?: string;
  arrivalTime?: string;
  status?: string;
  order?: number;
}

interface TrackingState {
  isConnected: boolean;
  contractorLocation: Location | null;
  customerLocation: Location | null;
  eta: string | null;
  status: string;
  contractorOnline: boolean;
  // Route tracking state
  routeId?: string;
  routeStatus?: 'planned' | 'active' | 'completed';
  currentStop?: RouteStop;
  nextStops?: RouteStop[];
  completedStops?: number;
  totalStops?: number;
  isRouteTracking?: boolean;
}

interface UseTrackingWebSocketOptions {
  jobId?: string;
  routeId?: string;
  userId?: string;
  role?: 'customer' | 'contractor' | 'guest';
  onLocationUpdate?: (location: Location) => void;
  onStatusUpdate?: (status: string) => void;
  onEtaUpdate?: (eta: string) => void;
  onRouteUpdate?: (update: any) => void;
  onStopCompleted?: (stopId: string) => void;
}

export const useTrackingWebSocket = ({
  jobId,
  routeId,
  userId,
  role = 'guest',
  onLocationUpdate,
  onStatusUpdate,
  onEtaUpdate,
  onRouteUpdate,
  onStopCompleted
}: UseTrackingWebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<TrackingState>({
    isConnected: false,
    contractorLocation: null,
    customerLocation: null,
    eta: null,
    status: 'new',
    contractorOnline: false,
    isRouteTracking: !!routeId
  });

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    if (!jobId && !routeId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/tracking`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true }));

        // Join appropriate tracking room
        if (routeId) {
          // Join route tracking room
          ws.current?.send(JSON.stringify({
            type: 'JOIN_ROUTE_TRACKING',
            payload: { routeId, jobId, userId, role }
          }));
        } else if (jobId) {
          // Join single job tracking room
          ws.current?.send(JSON.stringify({
            type: 'JOIN_TRACKING',
            payload: { jobId, userId, role }
          }));
        }
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
  }, [jobId, routeId, userId, role]);

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

      // Route tracking messages
      case 'JOIN_ROUTE_TRACKING':
        if (message.payload.success) {
          setState(prev => ({
            ...prev,
            routeId: message.payload.routeId,
            routeStatus: message.payload.routeStatus,
            currentStop: message.payload.currentStop,
            nextStops: message.payload.nextStops,
            contractorOnline: message.payload.contractorOnline,
            isRouteTracking: true
          }));
        }
        break;

      case 'ROUTE_UPDATE':
        setState(prev => ({
          ...prev,
          contractorLocation: message.payload.location,
        }));
        onLocationUpdate?.(message.payload.location);
        onRouteUpdate?.(message.payload);
        break;

      case 'ROUTE_STOP_ARRIVED':
        if (message.payload.jobId === jobId) {
          setState(prev => ({
            ...prev,
            status: 'arrived',
          }));
          onStatusUpdate?.('arrived');
        }
        break;

      case 'ROUTE_STOP_COMPLETED':
        setState(prev => ({
          ...prev,
          currentStop: message.payload.nextStop,
          nextStops: message.payload.nextStops,
          completedStops: (prev.completedStops || 0) + 1
        }));
        onStopCompleted?.(message.payload.completedStopId);
        break;

      case 'ROUTE_ETA_UPDATE':
        if (message.payload.jobId === jobId) {
          setState(prev => ({
            ...prev,
            eta: message.payload.estimatedArrival
          }));
          onEtaUpdate?.(message.payload.estimatedArrival);
        }
        break;

      case 'ROUTE_DEVIATION':
        console.warn('Route deviation detected:', message.payload);
        break;

      case 'ROUTE_OPTIMIZED':
        setState(prev => ({
          ...prev,
          nextStops: message.payload.newStops
        }));
        onRouteUpdate?.(message.payload);
        break;
    }
  }, [onLocationUpdate, onStatusUpdate, onEtaUpdate, onRouteUpdate, onStopCompleted, jobId]);

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

  const sendRouteUpdate = useCallback((type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN && routeId) {
      ws.current.send(JSON.stringify({
        type: 'ROUTE_UPDATE',
        payload: { type, data }
      }));
    }
  }, [routeId]);

  const markStopArrived = useCallback((stopId: string) => {
    sendRouteUpdate('stop_arrived', { stopId });
  }, [sendRouteUpdate]);

  const markStopCompleted = useCallback((stopId: string) => {
    sendRouteUpdate('stop_completed', { stopId });
  }, [sendRouteUpdate]);

  const updateRouteETA = useCallback((stopId: string, estimatedArrival: string) => {
    sendRouteUpdate('eta_update', { stopId, estimatedArrival });
  }, [sendRouteUpdate]);

  const sendRouteLocation = useCallback((location: Location, currentStopId?: string) => {
    sendRouteUpdate('location', { location, currentStopId });
  }, [sendRouteUpdate]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      if (ws.current.readyState === WebSocket.OPEN) {
        if (routeId) {
          ws.current.send(
            JSON.stringify({
              type: 'LEAVE_ROUTE_TRACKING',
              payload: {}
            })
          );
        } else {
          ws.current.send(
            JSON.stringify({
              type: 'LEAVE_TRACKING',
              payload: {}
            })
          );
        }
      }
      ws.current.close();
      ws.current = null;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, [routeId]);

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
    // Route-specific methods
    sendRouteUpdate,
    markStopArrived,
    markStopCompleted,
    updateRouteETA,
    sendRouteLocation,
    disconnect,
    reconnect: connect
  };
};
