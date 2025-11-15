import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketState {
  isConnected: boolean;
  lastMessage: any;
  error: string | null;
}

interface UseWebSocketOptions {
  userId?: string;
  role?: 'customer' | 'contractor' | 'guest' | 'admin' | 'fleet_manager';
  eventType?: 'notifications' | 'fleet_updates' | 'earnings_updates' | 'general';
  onMessage?: (message: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  // Event-specific handlers
  onNotificationSent?: (payload: any) => void;
  onNotificationDelivered?: (payload: any) => void;
  onBlacklistUpdated?: (payload: any) => void;
  onMaintenanceAlert?: (payload: any) => void;
  onMaintenancePredictionUpdate?: (payload: any) => void;
  onMaintenanceServiceCompleted?: (payload: any) => void;
  onFleetPartsUpdate?: (payload: any) => void;
  onCommissionCalculated?: (payload: any) => void;
  onPayoutProcessed?: (payload: any) => void;
  onPerformanceUpdate?: (payload: any) => void;
  onContractorPartsUpdate?: (payload: any) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export const useWebSocket = ({
  userId,
  role = 'guest',
  eventType = 'general',
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  onNotificationSent,
  onNotificationDelivered,
  onBlacklistUpdated,
  onMaintenanceAlert,
  onMaintenancePredictionUpdate,
  onMaintenanceServiceCompleted,
  onFleetPartsUpdate,
  onCommissionCalculated,
  onPayoutProcessed,
  onPerformanceUpdate,
  onContractorPartsUpdate,
  autoReconnect = true,
  reconnectDelay = 3000
}: UseWebSocketOptions = {}) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    error: null
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
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        
        // Join the appropriate channel based on event type
        let joinMessage = null;
        switch (eventType) {
          case 'notifications':
            joinMessage = {
              type: 'JOIN_NOTIFICATIONS',
              payload: { userId, role }
            };
            break;
          case 'fleet_updates':
            joinMessage = {
              type: 'JOIN_FLEET_UPDATES',
              payload: { userId, role }
            };
            break;
          case 'earnings_updates':
            joinMessage = {
              type: 'JOIN_EARNINGS_UPDATES',
              payload: { userId, role }
            };
            break;
        }
        
        if (joinMessage) {
          ws.current.send(JSON.stringify(joinMessage));
        }
        
        onConnect?.();
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
        setState(prev => ({ ...prev, isConnected: false }));
        onDisconnect?.();
        
        // Auto-reconnect if enabled
        if (autoReconnect) {
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
          }
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        const errorMessage = 'WebSocket connection error';
        setState(prev => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [userId, role, eventType, onConnect, onDisconnect, onError, autoReconnect, reconnectDelay]);

  const handleMessage = useCallback((message: any) => {
    // Update last message in state
    setState(prev => ({ ...prev, lastMessage: message }));
    
    // Call general message handler
    onMessage?.(message);
    
    // Call specific event handlers based on message type
    switch (message.type) {
      // Notification events
      case 'NOTIFICATION_SENT':
        onNotificationSent?.(message.payload);
        break;
      case 'NOTIFICATION_DELIVERED':
        onNotificationDelivered?.(message.payload);
        break;
      case 'NOTIFICATION_BLACKLIST_UPDATED':
        onBlacklistUpdated?.(message.payload);
        break;
        
      // Fleet maintenance events
      case 'MAINTENANCE_ALERT_NEW':
        onMaintenanceAlert?.(message.payload);
        break;
      case 'MAINTENANCE_PREDICTION_UPDATED':
        onMaintenancePredictionUpdate?.(message.payload);
        break;
      case 'MAINTENANCE_SERVICE_COMPLETED':
        onMaintenanceServiceCompleted?.(message.payload);
        break;
      case 'FLEET_PARTS_UPDATED':
        onFleetPartsUpdate?.(message.payload);
        break;
        
      // Contractor earnings events
      case 'COMMISSION_CALCULATED':
        onCommissionCalculated?.(message.payload);
        break;
      case 'PAYOUT_PROCESSED':
        onPayoutProcessed?.(message.payload);
        break;
      case 'PERFORMANCE_UPDATED':
        onPerformanceUpdate?.(message.payload);
        break;
      case 'CONTRACTOR_PARTS_UPDATED':
        onContractorPartsUpdate?.(message.payload);
        break;
        
      case 'ERROR':
        console.error('WebSocket error message:', message.payload);
        setState(prev => ({ ...prev, error: message.payload.error }));
        onError?.(message.payload.error);
        break;
    }
  }, [
    onMessage,
    onNotificationSent,
    onNotificationDelivered,
    onBlacklistUpdated,
    onMaintenanceAlert,
    onMaintenancePredictionUpdate,
    onMaintenanceServiceCompleted,
    onFleetPartsUpdate,
    onCommissionCalculated,
    onPayoutProcessed,
    onPerformanceUpdate,
    onContractorPartsUpdate,
    onError
  ]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      // Send leave message based on event type
      let leaveMessage = null;
      switch (eventType) {
        case 'notifications':
          leaveMessage = { type: 'LEAVE_NOTIFICATIONS', payload: {} };
          break;
        case 'fleet_updates':
          leaveMessage = { type: 'LEAVE_FLEET_UPDATES', payload: {} };
          break;
        case 'earnings_updates':
          leaveMessage = { type: 'LEAVE_EARNINGS_UPDATES', payload: {} };
          break;
      }
      
      if (leaveMessage && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(leaveMessage));
      }
      
      ws.current.close();
      ws.current = null;
    }
  }, [eventType]);

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};