import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { storage } from './storage';
import { z } from 'zod';

// WebSocket message types
const MessageTypeEnum = z.enum([
  'JOIN_TRACKING',
  'LEAVE_TRACKING', 
  'LOCATION_UPDATE',
  'STATUS_UPDATE',
  'ETA_UPDATE',
  'CONTRACTOR_JOINED',
  'CONTRACTOR_LEFT',
  'ERROR',
  // Job assignment message types
  'JOB_ASSIGNED',
  'JOB_UNASSIGNED',
  'CONTRACTOR_STATUS_CHANGE',
  // Bidding message types
  'JOIN_BIDDING',
  'LEAVE_BIDDING',
  'NEW_BID',
  'BID_ACCEPTED',
  'BID_REJECTED',
  'BID_COUNTERED',
  'BID_WITHDRAWN',
  'BIDDING_CLOSED',
  'BIDDING_UPDATE',
  // Route tracking message types
  'JOIN_ROUTE_TRACKING',
  'LEAVE_ROUTE_TRACKING',
  'ROUTE_UPDATE',
  'ROUTE_STOP_ARRIVED',
  'ROUTE_STOP_COMPLETED',
  'ROUTE_STOP_SKIPPED',
  'ROUTE_ETA_UPDATE',
  'ROUTE_DEVIATION',
  'ROUTE_OPTIMIZED',
  'ROUTE_COMPLETED',
  // Chat message types
  'JOIN_CHAT',
  'LEAVE_CHAT',
  'SEND_MESSAGE',
  'EDIT_MESSAGE',
  'DELETE_MESSAGE',
  'TYPING_INDICATOR',
  'STOP_TYPING',
  'READ_RECEIPT',
  'USER_JOINED_CHAT',
  'USER_LEFT_CHAT',
  'MESSAGE_REACTION',
  'REMOVE_REACTION',
  'MESSAGE_DELIVERED',
  'MESSAGE_EDITED',
  'MESSAGE_DELETED',
  'UNREAD_COUNT_UPDATE',
  // Emergency SOS message types
  'EMERGENCY_SOS',
  'EMERGENCY_ACKNOWLEDGED',
  'EMERGENCY_RESOLVED',
  'EMERGENCY_LOCATION_UPDATE',
  'JOIN_EMERGENCY',
  'LEAVE_EMERGENCY',
  // Fuel tracking message types
  'FUEL_PRICE_UPDATE',
  'FUEL_ALERT',
  'JOIN_FUEL_TRACKING',
  'LEAVE_FUEL_TRACKING',
  // Notification events
  'NOTIFICATION_SENT',
  'NOTIFICATION_DELIVERED',
  'NOTIFICATION_BLACKLIST_UPDATED',
  'JOIN_NOTIFICATIONS',
  'LEAVE_NOTIFICATIONS',
  // Fleet maintenance events
  'MAINTENANCE_ALERT_NEW',
  'MAINTENANCE_PREDICTION_UPDATED',
  'MAINTENANCE_SERVICE_COMPLETED',
  'FLEET_PARTS_UPDATED',
  'JOIN_FLEET_UPDATES',
  'LEAVE_FLEET_UPDATES',
  // Contractor earnings events
  'COMMISSION_CALCULATED',
  'PAYOUT_PROCESSED',
  'PERFORMANCE_UPDATED',
  'CONTRACTOR_PARTS_UPDATED',
  'JOIN_EARNINGS_UPDATES',
  'LEAVE_EARNINGS_UPDATES'
]);

const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  timestamp: z.string()
});

const WebSocketMessageSchema = z.object({
  type: MessageTypeEnum,
  payload: z.any()
});

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  role?: 'customer' | 'contractor' | 'guest' | 'admin' | 'fleet_manager';
  jobId?: string;
  biddingJobId?: string;
  routeId?: string;
  chatJobId?: string;
  isTyping?: boolean;
  typingTimeout?: NodeJS.Timeout;
}

interface TrackingRoom {
  jobId: string;
  customers: Set<ExtendedWebSocket>;
  contractor?: ExtendedWebSocket;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  lastEta?: string;
  status?: string;
}

interface BiddingRoom {
  jobId: string;
  customer?: ExtendedWebSocket;
  contractors: Set<ExtendedWebSocket>;
  admins: Set<ExtendedWebSocket>;
  currentBids: Map<string, {
    contractorId: string;
    bidAmount: number;
    timestamp: string;
  }>;
  biddingDeadline?: Date;
  status: 'active' | 'closed' | 'cancelled';
}

interface RouteRoom {
  routeId: string;
  contractor?: ExtendedWebSocket;
  customers: Map<string, Set<ExtendedWebSocket>>; // Map of jobId to customers
  currentStop?: {
    stopId: string;
    jobId: string;
    location: { lat: number; lng: number };
    arrivalTime?: string;
  };
  nextStops: Array<{
    stopId: string;
    jobId: string;
    estimatedArrival: string;
    location: { lat: number; lng: number };
  }>;
  routeStatus: 'planned' | 'active' | 'completed';
  lastUpdate?: string;
}

interface ChatRoom {
  jobId: string;
  participants: Map<string, ExtendedWebSocket>; // Map of userId to WebSocket
  typingUsers: Set<string>; // Set of userIds currently typing
  onlineUsers: Set<string>; // Set of online userIds
  lastActivity?: Date;
  messageCache?: Array<{
    id: string;
    message: string;
    senderId: string;
    timestamp: Date;
  }>;
}

interface TypingTimeout {
  userId: string;
  jobId: string;
  timeout: NodeJS.Timeout;
}

class ChatRoom {
  jobId: string;
  participants: Map<string, ExtendedWebSocket>;
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
  lastActivity: Date;
  typingTimeouts: Map<string, NodeJS.Timeout>;

  constructor(jobId: string) {
    this.jobId = jobId;
    this.participants = new Map();
    this.typingUsers = new Set();
    this.onlineUsers = new Set();
    this.lastActivity = new Date();
    this.typingTimeouts = new Map();
  }

  addParticipant(userId: string, ws: ExtendedWebSocket): void {
    this.participants.set(userId, ws);
    this.onlineUsers.add(userId);
    this.lastActivity = new Date();
  }

  removeParticipant(userId: string): void {
    this.participants.delete(userId);
    this.onlineUsers.delete(userId);
    this.stopTyping(userId);
    this.lastActivity = new Date();
  }

  startTyping(userId: string): void {
    this.typingUsers.add(userId);
    
    // Clear existing timeout if any
    const existingTimeout = this.typingTimeouts.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout to automatically stop typing after 5 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(userId);
      this.broadcastTypingStatus();
    }, 5000);
    
    this.typingTimeouts.set(userId, timeout);
  }

  stopTyping(userId: string): void {
    this.typingUsers.delete(userId);
    
    const timeout = this.typingTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(userId);
    }
  }

  broadcastTypingStatus(): void {
    const typingArray = Array.from(this.typingUsers);
    this.participants.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'TYPING_INDICATOR',
          payload: {
            typingUsers: typingArray.filter(id => id !== userId)
          }
        }));
      }
    });
  }

  broadcast(message: any, excludeUserId?: string): void {
    this.participants.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN && userId !== excludeUserId) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  sendTo(userId: string, message: any): void {
    const ws = this.participants.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

class TrackingWebSocketServer {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, TrackingRoom> = new Map();
  private biddingRooms: Map<string, BiddingRoom> = new Map();
  private routeRooms: Map<string, RouteRoom> = new Map();
  private chatRooms: Map<string, ChatRoom> = new Map();
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  public async initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/tracking'
    });

    this.wss.on('connection', (ws: ExtendedWebSocket, request) => {
      console.log('New WebSocket connection');
      ws.isAlive = true;

      // Handle ping-pong for connection health
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const validatedMessage = WebSocketMessageSchema.parse(message);
          await this.handleMessage(ws, validatedMessage);
        } catch (error) {
          console.error('WebSocket message error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(ws);
      });
    });

    // Start ping interval to check connection health
    this.startPingInterval();

    console.log('WebSocket tracking server initialized');
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.wss) {
        this.wss.clients.forEach((ws: ExtendedWebSocket) => {
          if (!ws.isAlive) {
            ws.terminate();
            this.handleDisconnect(ws);
            return;
          }
          ws.isAlive = false;
          ws.ping();
        });
      }
    }, 30000); // Ping every 30 seconds
  }

  private async handleMessage(ws: ExtendedWebSocket, message: z.infer<typeof WebSocketMessageSchema>) {
    switch (message.type) {
      case 'JOIN_TRACKING':
        await this.handleJoinTracking(ws, message.payload);
        break;
      case 'LEAVE_TRACKING':
        this.handleLeaveTracking(ws);
        break;
      case 'LOCATION_UPDATE':
        await this.handleLocationUpdate(ws, message.payload);
        break;
      case 'STATUS_UPDATE':
        await this.handleStatusUpdate(ws, message.payload);
        break;
      // Bidding message handlers
      case 'JOIN_BIDDING':
        await this.handleJoinBidding(ws, message.payload);
        break;
      case 'LEAVE_BIDDING':
        this.handleLeaveBidding(ws);
        break;
      // Route tracking handlers
      case 'JOIN_ROUTE_TRACKING':
        await this.handleJoinRouteTracking(ws, message.payload);
        break;
      case 'LEAVE_ROUTE_TRACKING':
        this.handleLeaveRouteTracking(ws);
        break;
      case 'ROUTE_UPDATE':
        await this.handleRouteUpdate(ws, message.payload);
        break;
      // Chat message handlers
      case 'JOIN_CHAT':
        await this.handleJoinChat(ws, message.payload);
        break;
      case 'LEAVE_CHAT':
        this.handleLeaveChat(ws);
        break;
      case 'SEND_MESSAGE':
        await this.handleSendMessage(ws, message.payload);
        break;
      case 'EDIT_MESSAGE':
        await this.handleEditMessage(ws, message.payload);
        break;
      case 'DELETE_MESSAGE':
        await this.handleDeleteMessage(ws, message.payload);
        break;
      case 'TYPING_INDICATOR':
        this.handleTypingIndicator(ws, message.payload);
        break;
      case 'STOP_TYPING':
        this.handleStopTyping(ws);
        break;
      case 'READ_RECEIPT':
        await this.handleReadReceipt(ws, message.payload);
        break;
      case 'MESSAGE_REACTION':
        await this.handleMessageReaction(ws, message.payload);
        break;
      case 'REMOVE_REACTION':
        await this.handleRemoveReaction(ws, message.payload);
        break;
      // Notification event handlers
      case 'JOIN_NOTIFICATIONS':
        await this.handleJoinNotifications(ws, message.payload);
        break;
      case 'LEAVE_NOTIFICATIONS':
        this.handleLeaveNotifications(ws);
        break;
      // Fleet maintenance event handlers
      case 'JOIN_FLEET_UPDATES':
        await this.handleJoinFleetUpdates(ws, message.payload);
        break;
      case 'LEAVE_FLEET_UPDATES':
        this.handleLeaveFleetUpdates(ws);
        break;
      // Contractor earnings event handlers
      case 'JOIN_EARNINGS_UPDATES':
        await this.handleJoinEarningsUpdates(ws, message.payload);
        break;
      case 'LEAVE_EARNINGS_UPDATES':
        this.handleLeaveEarningsUpdates(ws);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleJoinTracking(ws: ExtendedWebSocket, payload: any) {
    const { jobId, userId, role } = payload;

    if (!jobId) {
      this.sendError(ws, 'Job ID is required');
      return;
    }

    // Verify job exists
    const job = await storage.getJob(jobId);
    if (!job) {
      this.sendError(ws, 'Job not found');
      return;
    }

    // Set client properties
    ws.jobId = jobId;
    ws.userId = userId;
    ws.role = role || 'guest';

    // Get or create room
    let room = this.rooms.get(jobId);
    if (!room) {
      room = {
        jobId,
        customers: new Set(),
        status: job.status
      };
      this.rooms.set(jobId, room);
    }

    // Add client to room
    if (ws.role === 'contractor') {
      room.contractor = ws;
      
      // Notify customers that contractor joined
      this.broadcastToRoom(jobId, {
        type: 'CONTRACTOR_JOINED',
        payload: {
          contractorId: userId,
          timestamp: new Date().toISOString()
        }
      }, ws);
    } else {
      room.customers.add(ws);
    }

    // Store client reference
    if (userId) {
      this.clients.set(userId, ws);
    }

    // Send initial state to the new client
    this.sendMessage(ws, {
      type: 'JOIN_TRACKING',
      payload: {
        success: true,
        jobId,
        status: room.status,
        lastLocation: room.lastLocation,
        lastEta: room.lastEta,
        contractorOnline: !!room.contractor
      }
    });

    console.log(`Client joined tracking for job ${jobId}, role: ${ws.role}`);
  }

  private handleLeaveTracking(ws: ExtendedWebSocket) {
    if (!ws.jobId) return;

    const room = this.rooms.get(ws.jobId);
    if (room) {
      if (ws.role === 'contractor') {
        room.contractor = undefined;
        
        // Notify customers that contractor left
        this.broadcastToRoom(ws.jobId, {
          type: 'CONTRACTOR_LEFT',
          payload: {
            timestamp: new Date().toISOString()
          }
        });
      } else {
        room.customers.delete(ws);
      }

      // Clean up empty rooms
      if (room.customers.size === 0 && !room.contractor) {
        this.rooms.delete(ws.jobId);
      }
    }

    // Remove from clients map
    if (ws.userId) {
      this.clients.delete(ws.userId);
    }

    console.log(`Client left tracking for job ${ws.jobId}`);
  }

  private async handleLocationUpdate(ws: ExtendedWebSocket, payload: any) {
    if (!ws.jobId || ws.role !== 'contractor') {
      this.sendError(ws, 'Unauthorized to send location updates');
      return;
    }

    try {
      const location = LocationSchema.parse(payload);
      const room = this.rooms.get(ws.jobId);
      
      if (room) {
        room.lastLocation = {
          lat: location.lat,
          lng: location.lng,
          timestamp: location.timestamp
        };

        // Update database
        await storage.updateJob(ws.jobId, {
          contractorLocation: {
            lat: location.lat,
            lng: location.lng
          },
          contractorLocationUpdatedAt: new Date()
        });

        // Calculate new ETA
        const job = await storage.getJob(ws.jobId);
        if (job && job.location) {
          const eta = this.calculateETA(
            { lat: location.lat, lng: location.lng },
            job.location as { lat: number; lng: number }
          );
          room.lastEta = eta;

          // Update database with new ETA
          await storage.updateJob(ws.jobId, {
            estimatedArrival: new Date(eta)
          });
        }

        // Broadcast location update to all room members
        this.broadcastToRoom(ws.jobId, {
          type: 'LOCATION_UPDATE',
          payload: {
            location: room.lastLocation,
            eta: room.lastEta
          }
        });
      }
    } catch (error) {
      console.error('Location update error:', error);
      this.sendError(ws, 'Failed to update location');
    }
  }

  private async handleStatusUpdate(ws: ExtendedWebSocket, payload: any) {
    if (!ws.jobId) {
      this.sendError(ws, 'Not tracking any job');
      return;
    }

    const { status } = payload;
    const room = this.rooms.get(ws.jobId);
    
    if (room) {
      room.status = status;

      // Update database
      await storage.updateJob(ws.jobId, {
        status,
        [`${status.toLowerCase()}At`]: new Date()
      });

      // Broadcast status update to all room members
      this.broadcastToRoom(ws.jobId, {
        type: 'STATUS_UPDATE',
        payload: {
          status,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  private calculateETA(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
    // Simple distance calculation using Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Assume average speed of 45 mph
    const avgSpeed = 45;
    const hoursToArrival = distance / avgSpeed;
    const minutesToArrival = Math.round(hoursToArrival * 60);

    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + minutesToArrival);
    
    return eta.toISOString();
  }

  private broadcastToRoom(jobId: string, message: any, exclude?: ExtendedWebSocket) {
    const room = this.rooms.get(jobId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    // Send to all customers
    room.customers.forEach(client => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });

    // Send to contractor if connected
    if (room.contractor && room.contractor !== exclude && room.contractor.readyState === WebSocket.OPEN) {
      room.contractor.send(messageStr);
    }
  }

  private sendMessage(ws: ExtendedWebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: ExtendedWebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'ERROR',
      payload: { error }
    });
  }

  private handleDisconnect(ws: ExtendedWebSocket) {
    this.handleLeaveTracking(ws);
    this.handleLeaveBidding(ws);
  }

  // ==================== BIDDING HANDLERS ====================
  
  private async handleJoinBidding(ws: ExtendedWebSocket, payload: any) {
    const { jobId, userId, role } = payload;

    if (!jobId) {
      this.sendError(ws, 'Job ID is required');
      return;
    }

    // Verify job exists and allows bidding
    const job = await storage.getJob(jobId);
    if (!job) {
      this.sendError(ws, 'Job not found');
      return;
    }

    if (!job.allowBidding) {
      this.sendError(ws, 'Job does not allow bidding');
      return;
    }

    // Set client properties
    ws.biddingJobId = jobId;
    ws.userId = userId;
    ws.role = role;

    // Get or create bidding room
    let room = this.biddingRooms.get(jobId);
    if (!room) {
      const biddingDeadline = job.biddingDeadline ? new Date(job.biddingDeadline) : undefined;
      room = {
        jobId,
        contractors: new Set(),
        admins: new Set(),
        currentBids: new Map(),
        biddingDeadline,
        status: biddingDeadline && biddingDeadline < new Date() ? 'closed' : 'active'
      };
      this.biddingRooms.set(jobId, room);
    }

    // Add client to room based on role
    if (role === 'customer' && job.customerId === userId) {
      room.customer = ws;
    } else if (role === 'contractor') {
      room.contractors.add(ws);
    } else if (role === 'admin') {
      room.admins.add(ws);
    }

    // Get current bids for the job
    const bids = await storage.getJobBids(jobId);
    
    // Send initial state to the new client
    this.sendMessage(ws, {
      type: 'JOIN_BIDDING',
      payload: {
        success: true,
        jobId,
        status: room.status,
        biddingDeadline: room.biddingDeadline,
        currentBids: bids.map(b => ({
          id: b.id,
          contractorId: b.contractorId,
          bidAmount: b.bidAmount,
          estimatedHours: b.estimatedHours,
          status: b.status,
          createdAt: b.createdAt
        })),
        totalBids: bids.length
      }
    });

    console.log(`Client joined bidding for job ${jobId}, role: ${role}`);
  }

  private handleLeaveBidding(ws: ExtendedWebSocket) {
    if (!ws.biddingJobId) return;

    const room = this.biddingRooms.get(ws.biddingJobId);
    if (room) {
      if (ws.role === 'customer') {
        room.customer = undefined;
      } else if (ws.role === 'contractor') {
        room.contractors.delete(ws);
      } else if (ws.role === 'admin') {
        room.admins.delete(ws);
      }

      // Clean up empty rooms
      if (!room.customer && room.contractors.size === 0 && room.admins.size === 0) {
        this.biddingRooms.delete(ws.biddingJobId);
      }
    }

    console.log(`Client left bidding for job ${ws.biddingJobId}`);
  }

  // Broadcast location updates for tracking
  public broadcastLocationUpdate(jobId: string, locationData: any) {
    const room = this.rooms.get(jobId);
    if (!room) return;

    const message = {
      type: 'LOCATION_UPDATE',
      payload: locationData
    };

    this.broadcastToRoom(jobId, message);
  }

  // Broadcast job updates
  public broadcastJobUpdate(jobId: string, update: any) {
    const room = this.rooms.get(jobId);
    if (!room) return;

    this.broadcastToRoom(jobId, update);
  }

  // Broadcast ETA updates
  public broadcastETAUpdate(jobId: string, eta: string) {
    const room = this.rooms.get(jobId);
    if (!room) return;

    room.lastEta = eta;
    
    const message = {
      type: 'ETA_UPDATE',
      payload: {
        eta,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcastToRoom(jobId, message);
  }

  // Broadcast bid updates to all participants
  public async broadcastNewBid(jobId: string, bid: any) {
    const room = this.biddingRooms.get(jobId);
    if (!room) return;

    const message = {
      type: 'NEW_BID',
      payload: {
        bidId: bid.id,
        jobId: bid.jobId,
        contractorId: bid.contractorId,
        bidAmount: bid.bidAmount,
        estimatedHours: bid.estimatedHours,
        message: bid.message,
        timestamp: bid.createdAt
      }
    };

    // Send to customer
    if (room.customer) {
      this.sendMessage(room.customer, message);
    }

    // Send to all contractors (anonymized if bidding is active)
    room.contractors.forEach(contractor => {
      const anonymizedMessage = room.status === 'active' ? {
        ...message,
        payload: {
          ...message.payload,
          contractorId: undefined // Hide contractor identity during active bidding
        }
      } : message;
      this.sendMessage(contractor, anonymizedMessage);
    });

    // Send to admins
    room.admins.forEach(admin => {
      this.sendMessage(admin, message);
    });
  }

  // Broadcast bid acceptance
  public async broadcastBidAccepted(jobId: string, bidId: string, contractorId: string) {
    const room = this.biddingRooms.get(jobId);
    if (!room) return;

    const message = {
      type: 'BID_ACCEPTED',
      payload: {
        bidId,
        jobId,
        contractorId,
        timestamp: new Date().toISOString()
      }
    };

    // Update room status
    room.status = 'closed';

    // Broadcast to all participants
    this.broadcastToBiddingRoom(jobId, message);

    // Send specific notifications
    const winnerClient = this.clients.get(contractorId);
    if (winnerClient) {
      this.sendMessage(winnerClient, {
        type: 'BIDDING_UPDATE',
        payload: {
          message: 'Congratulations! Your bid has been accepted.',
          type: 'success'
        }
      });
    }

    // Notify other contractors they didn't win
    room.contractors.forEach(contractor => {
      if (contractor.userId !== contractorId) {
        this.sendMessage(contractor, {
          type: 'BIDDING_UPDATE',
          payload: {
            message: 'This job has been awarded to another contractor.',
            type: 'info'
          }
        });
      }
    });
  }

  // Broadcast bid rejection
  public async broadcastBidRejected(jobId: string, bidId: string, contractorId: string) {
    const room = this.biddingRooms.get(jobId);
    if (!room) return;

    const message = {
      type: 'BID_REJECTED',
      payload: {
        bidId,
        jobId,
        contractorId,
        timestamp: new Date().toISOString()
      }
    };

    // Send to the affected contractor
    const contractorClient = this.clients.get(contractorId);
    if (contractorClient) {
      this.sendMessage(contractorClient, message);
    }

    // Also update customer and admins
    if (room.customer) {
      this.sendMessage(room.customer, message);
    }
    room.admins.forEach(admin => {
      this.sendMessage(admin, message);
    });
  }

  // Broadcast bidding deadline approaching
  public async broadcastBiddingDeadlineWarning(jobId: string, minutesRemaining: number) {
    const room = this.biddingRooms.get(jobId);
    if (!room) return;

    const message = {
      type: 'BIDDING_UPDATE',
      payload: {
        type: 'deadline_warning',
        message: `Bidding closes in ${minutesRemaining} minutes`,
        minutesRemaining,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcastToBiddingRoom(jobId, message);
  }

  // Broadcast to all participants in a bidding room
  private broadcastToBiddingRoom(jobId: string, message: any, exclude?: ExtendedWebSocket) {
    const room = this.biddingRooms.get(jobId);
    if (!room) return;

    // Send to customer
    if (room.customer && room.customer !== exclude) {
      this.sendMessage(room.customer, message);
    }

    // Send to contractors
    room.contractors.forEach(contractor => {
      if (contractor !== exclude) {
        this.sendMessage(contractor, message);
      }
    });

    // Send to admins
    room.admins.forEach(admin => {
      if (admin !== exclude) {
        this.sendMessage(admin, message);
      }
    });
  }

  // Notify job assignment (simple version for route integration)
  public notifyJobAssignment(jobId: string, contractorId: string) {
    console.log(`[WebSocket] Notifying job assignment to contractor ${contractorId}`);
    
    // Find contractor's WebSocket connection
    const contractorWs = this.clients.get(contractorId);
    
    if (contractorWs && contractorWs.readyState === WebSocket.OPEN) {
      this.sendMessage(contractorWs, {
        type: 'JOB_ASSIGNED',
        payload: {
          jobId,
          timestamp: new Date().toISOString()
        }
      });
      console.log(`[WebSocket] Job assignment notification sent to contractor ${contractorId}`);
    } else {
      console.log(`[WebSocket] Contractor ${contractorId} not connected, will receive notification on next login`);
    }
    
    // Also notify tracking room if exists
    this.broadcastToRoom(jobId, {
      type: 'JOB_ASSIGNED',
      payload: {
        jobId,
        contractorId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Broadcast job assignment to contractor
  public async broadcastJobAssignment(jobId: string, contractorId: string, jobDetails: any) {
    console.log(`[WebSocket] Broadcasting job assignment to contractor ${contractorId}`);
    
    // Find contractor's WebSocket connection
    const contractorWs = this.clients.get(contractorId);
    
    if (contractorWs && contractorWs.readyState === WebSocket.OPEN) {
      this.sendMessage(contractorWs, {
        type: 'JOB_ASSIGNED',
        payload: {
          jobId,
          ...jobDetails,
          timestamp: new Date().toISOString()
        }
      });
      console.log(`[WebSocket] Job assignment sent to contractor ${contractorId}`);
    } else {
      console.log(`[WebSocket] Contractor ${contractorId} not connected, will receive notification on next login`);
    }
  }

  // Broadcast to all online contractors when a new job is available
  public async broadcastNewJobAvailable(jobDetails: any) {
    console.log('[WebSocket] Broadcasting new job available to all online contractors');
    
    let count = 0;
    this.clients.forEach((ws, userId) => {
      if (ws.role === 'contractor' && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, {
          type: 'NEW_JOB_AVAILABLE',
          payload: jobDetails
        });
        count++;
      }
    });
    
    console.log(`[WebSocket] Notified ${count} online contractors about new job`);
  }

  // ==================== WEATHER EVENT HANDLERS ====================
  
  // Broadcast severe weather alert to all users
  public async broadcastWeatherAlert(alert: any) {
    console.log('[WebSocket] Broadcasting weather alert to all connected users');
    
    let count = 0;
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, {
          type: 'weather:alert',
          payload: {
            id: alert.id,
            alertType: alert.alertType,
            severity: alert.severity,
            location: alert.location,
            message: alert.message,
            startTime: alert.startTime,
            endTime: alert.endTime,
            timestamp: new Date().toISOString()
          }
        });
        count++;
      }
    });
    
    console.log(`[WebSocket] Weather alert sent to ${count} connected users`);
  }

  // Send weather update for a specific job
  public async sendJobWeatherUpdate(jobId: string, weatherData: any) {
    console.log(`[WebSocket] Sending weather update for job ${jobId}`);
    
    const job = await storage.getJob(jobId);
    if (!job) {
      console.log(`[WebSocket] Job ${jobId} not found`);
      return;
    }
    
    // Send to customer
    if (job.customerId) {
      const customerWs = this.clients.get(job.customerId);
      if (customerWs && customerWs.readyState === WebSocket.OPEN) {
        this.sendMessage(customerWs, {
          type: 'weather:update',
          payload: {
            jobId,
            weather: weatherData,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    // Send to contractor
    if (job.contractorId) {
      const contractorWs = this.clients.get(job.contractorId);
      if (contractorWs && contractorWs.readyState === WebSocket.OPEN) {
        this.sendMessage(contractorWs, {
          type: 'weather:update',
          payload: {
            jobId,
            weather: weatherData,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    console.log(`[WebSocket] Weather update sent for job ${jobId}`);
  }

  // Send weather updates for active jobs
  public async broadcastActiveJobsWeatherUpdate() {
    console.log('[WebSocket] Broadcasting weather updates for active jobs');
    
    try {
      // Get active jobs
      const activeJobs = await storage.findJobs({
        status: ['assigned', 'en_route', 'on_site', 'scheduled']
      });
      
      let updateCount = 0;
      for (const job of activeJobs) {
        if (job.location) {
          const weather = await weatherService.getCurrentWeather(
            job.location.lat, 
            job.location.lng
          );
          await this.sendJobWeatherUpdate(job.id, weather);
          updateCount++;
        }
      }
      
      console.log(`[WebSocket] Weather updates sent for ${updateCount} active jobs`);
    } catch (error) {
      console.error('[WebSocket] Error broadcasting weather updates:', error);
    }
  }

  // ==================== ROUTE TRACKING HANDLERS ====================
  
  private async handleJoinRouteTracking(ws: ExtendedWebSocket, payload: any) {
    const { routeId, jobId, userId, role } = payload;

    if (!routeId) {
      this.sendError(ws, 'Route ID is required');
      return;
    }

    // Verify route exists
    const route = await storage.getRoute(routeId);
    if (!route) {
      this.sendError(ws, 'Route not found');
      return;
    }

    // Set client properties
    ws.routeId = routeId;
    ws.jobId = jobId;
    ws.userId = userId;
    ws.role = role || 'guest';

    // Get or create route room
    let room = this.routeRooms.get(routeId);
    if (!room) {
      const stops = await storage.getRouteStops(routeId);
      const currentStop = stops.find(s => s.status === 'in_progress');
      const nextStops = stops
        .filter(s => s.status === 'pending')
        .slice(0, 3)
        .map(s => ({
          stopId: s.id,
          jobId: s.jobId || '',
          estimatedArrival: s.plannedArrivalTime?.toISOString() || '',
          location: s.location as { lat: number; lng: number }
        }));

      room = {
        routeId,
        customers: new Map(),
        routeStatus: route.status as 'planned' | 'active' | 'completed',
        currentStop: currentStop ? {
          stopId: currentStop.id,
          jobId: currentStop.jobId || '',
          location: currentStop.location as { lat: number; lng: number },
          arrivalTime: currentStop.actualArrival?.toISOString()
        } : undefined,
        nextStops
      };
      this.routeRooms.set(routeId, room);
    }

    // Add client to room
    if (ws.role === 'contractor') {
      room.contractor = ws;
    } else if (ws.role === 'customer' && jobId) {
      if (!room.customers.has(jobId)) {
        room.customers.set(jobId, new Set());
      }
      room.customers.get(jobId)!.add(ws);
    }

    // Send initial state
    this.sendMessage(ws, {
      type: 'JOIN_ROUTE_TRACKING',
      payload: {
        success: true,
        routeId,
        routeStatus: room.routeStatus,
        currentStop: room.currentStop,
        nextStops: room.nextStops,
        contractorOnline: !!room.contractor
      }
    });

    console.log(`Client joined route tracking for route ${routeId}, role: ${ws.role}`);
  }

  private handleLeaveRouteTracking(ws: ExtendedWebSocket) {
    if (!ws.routeId) return;

    const room = this.routeRooms.get(ws.routeId);
    if (room) {
      if (ws.role === 'contractor') {
        room.contractor = undefined;
      } else if (ws.role === 'customer' && ws.jobId) {
        const customers = room.customers.get(ws.jobId);
        if (customers) {
          customers.delete(ws);
          if (customers.size === 0) {
            room.customers.delete(ws.jobId);
          }
        }
      }

      // Clean up empty rooms
      if (!room.contractor && room.customers.size === 0) {
        this.routeRooms.delete(ws.routeId);
      }
    }

    console.log(`Client left route tracking for route ${ws.routeId}`);
  }

  private async handleRouteUpdate(ws: ExtendedWebSocket, payload: any) {
    if (!ws.routeId || ws.role !== 'contractor') {
      this.sendError(ws, 'Unauthorized to send route updates');
      return;
    }

    const room = this.routeRooms.get(ws.routeId);
    if (!room) {
      this.sendError(ws, 'Route room not found');
      return;
    }

    const { type, data } = payload;

    switch (type) {
      case 'location':
        // Update route progress with current location
        const { location, currentStopId } = data;
        await storage.updateRouteProgress(ws.routeId, currentStopId, location);
        
        // Broadcast to all customers on the route
        this.broadcastToRouteCustomers(ws.routeId, {
          type: 'ROUTE_UPDATE',
          payload: {
            location,
            currentStopId,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'stop_arrived':
        const { stopId } = data;
        await storage.markStopArrived(stopId, new Date());
        
        // Notify customer for this specific job
        const stop = await storage.getRouteStops(ws.routeId)
          .then(stops => stops.find(s => s.id === stopId));
        
        if (stop && stop.jobId) {
          this.notifyJobCustomers(stop.jobId, {
            type: 'ROUTE_STOP_ARRIVED',
            payload: {
              stopId,
              jobId: stop.jobId,
              arrivalTime: new Date().toISOString()
            }
          });
        }
        break;

      case 'stop_completed':
        const { stopId: completedStopId } = data;
        await storage.markStopCompleted(completedStopId, new Date());
        
        // Update room's current and next stops
        const stops = await storage.getRouteStops(ws.routeId);
        const nextStop = stops.find(s => s.status === 'pending');
        
        if (nextStop) {
          room.currentStop = {
            stopId: nextStop.id,
            jobId: nextStop.jobId || '',
            location: nextStop.location as { lat: number; lng: number }
          };
          
          // Update next stops list
          room.nextStops = stops
            .filter(s => s.status === 'pending' && s.id !== nextStop.id)
            .slice(0, 3)
            .map(s => ({
              stopId: s.id,
              jobId: s.jobId || '',
              estimatedArrival: s.plannedArrivalTime?.toISOString() || '',
              location: s.location as { lat: number; lng: number }
            }));
        }

        // Broadcast completion
        this.broadcastToRouteCustomers(ws.routeId, {
          type: 'ROUTE_STOP_COMPLETED',
          payload: {
            completedStopId,
            nextStop: room.currentStop,
            nextStops: room.nextStops
          }
        });
        break;

      case 'eta_update':
        const { stopId: etaStopId, estimatedArrival } = data;
        
        // Update ETA for specific stop
        const etaStop = room.nextStops.find(s => s.stopId === etaStopId);
        if (etaStop) {
          etaStop.estimatedArrival = estimatedArrival;
        }

        // Notify affected customers
        const affectedStop = await storage.getRouteStops(ws.routeId)
          .then(stops => stops.find(s => s.id === etaStopId));
        
        if (affectedStop && affectedStop.jobId) {
          this.notifyJobCustomers(affectedStop.jobId, {
            type: 'ROUTE_ETA_UPDATE',
            payload: {
              stopId: etaStopId,
              jobId: affectedStop.jobId,
              estimatedArrival
            }
          });
        }
        break;
    }

    room.lastUpdate = new Date().toISOString();
  }

  // Broadcast to all customers on a route
  private broadcastToRouteCustomers(routeId: string, message: any) {
    const room = this.routeRooms.get(routeId);
    if (!room) return;

    room.customers.forEach((customerSet) => {
      customerSet.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    });
  }

  // Notify customers for a specific job
  private notifyJobCustomers(jobId: string, message: any) {
    // Check route rooms
    this.routeRooms.forEach(room => {
      const customers = room.customers.get(jobId);
      if (customers) {
        customers.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        });
      }
    });

    // Also check regular tracking rooms for backward compatibility
    const trackingRoom = this.rooms.get(jobId);
    if (trackingRoom) {
      trackingRoom.customers.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // Handle route deviation detection
  public async checkRouteDeviation(routeId: string, currentLocation: { lat: number; lng: number }) {
    const deviation = await storage.handleRouteDeviation(routeId, currentLocation);
    
    if (deviation.isDeviated) {
      this.broadcastToRouteCustomers(routeId, {
        type: 'ROUTE_DEVIATION',
        payload: {
          isDeviated: true,
          deviationDistance: deviation.deviationDistance,
          recommendedAction: deviation.recommendedAction,
          currentLocation
        }
      });
    }
  }

  // Notify route optimization
  public async notifyRouteOptimized(routeId: string, newStops: any[]) {
    this.broadcastToRouteCustomers(routeId, {
      type: 'ROUTE_OPTIMIZED',
      payload: {
        routeId,
        newStops,
        timestamp: new Date().toISOString()
      }
    });
  }

  public shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.rooms.clear();
    this.routeRooms.clear();
    this.clients.clear();
  }

  // Get WebSocket server status
  public getStatus() {
    return {
      initialized: !!this.wss,
      rooms: this.rooms.size,
      biddingRooms: this.biddingRooms.size,
      clients: this.clients.size,
      connections: this.wss?.clients?.size || 0
    };
  }

  // Get number of tracking rooms
  public getRoomCount(): number {
    return this.rooms.size + this.biddingRooms.size;
  }

  // Get number of active connections
  public getConnectionCount(): number {
    return this.wss?.clients?.size || 0;
  }

  // Demo mode: Simulate contractor movement
  public startDemoMovement(jobId: string, startLocation: { lat: number; lng: number }, endLocation: { lat: number; lng: number }) {
    let progress = 0;
    const updateInterval = setInterval(() => {
      progress += 0.05; // Move 5% closer each update
      
      if (progress >= 1) {
        clearInterval(updateInterval);
        progress = 1;
      }

      const currentLat = startLocation.lat + (endLocation.lat - startLocation.lat) * progress;
      const currentLng = startLocation.lng + (endLocation.lng - startLocation.lng) * progress;

      const room = this.rooms.get(jobId);
      if (room) {
        const location = {
          lat: currentLat,
          lng: currentLng,
          timestamp: new Date().toISOString()
        };

        room.lastLocation = location;

        // Calculate ETA
        const eta = this.calculateETA(
          { lat: currentLat, lng: currentLng },
          endLocation
        );
        room.lastEta = eta;

        // Broadcast update
        this.broadcastToRoom(jobId, {
          type: 'LOCATION_UPDATE',
          payload: {
            location,
            eta,
            demo: true
          }
        });
      } else {
        clearInterval(updateInterval);
      }
    }, 5000); // Update every 5 seconds for demo

    return updateInterval;
  }

  // ==================== CHAT HANDLERS ====================
  
  private async handleJoinChat(ws: ExtendedWebSocket, payload: any) {
    const { jobId, userId, role } = payload;
    
    if (!jobId || !userId) {
      this.sendError(ws, 'Job ID and User ID are required');
      return;
    }
    
    // Verify job exists
    const job = await storage.getJob(jobId);
    if (!job) {
      this.sendError(ws, 'Job not found');
      return;
    }
    
    // Set websocket properties
    ws.chatJobId = jobId;
    ws.userId = userId;
    ws.role = role || 'guest';
    
    // Get or create chat room
    let room = this.chatRooms.get(jobId);
    if (!room) {
      room = new ChatRoom(jobId);
      this.chatRooms.set(jobId, room);
    }
    
    // Add participant
    room.addParticipant(userId, ws);
    
    // Store client reference
    this.clients.set(userId, ws);
    
    // Get recent messages
    const recentMessages = await storage.getJobMessages(jobId, 50);
    const unreadCount = await storage.getUnreadMessageCount(jobId, userId);
    
    // Send join confirmation with initial data
    this.sendMessage(ws, {
      type: 'JOIN_CHAT',
      payload: {
        success: true,
        jobId,
        messages: recentMessages.reverse(),
        unreadCount,
        onlineUsers: Array.from(room.onlineUsers)
      }
    });
    
    // Notify other participants
    room.broadcast({
      type: 'USER_JOINED_CHAT',
      payload: {
        userId,
        timestamp: new Date().toISOString()
      }
    }, userId);
  }
  
  private handleLeaveChat(ws: ExtendedWebSocket) {
    if (!ws.chatJobId || !ws.userId) return;
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) return;
    
    // Remove participant
    room.removeParticipant(ws.userId);
    
    // Notify others
    room.broadcast({
      type: 'USER_LEFT_CHAT',
      payload: {
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });
    
    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.chatRooms.delete(ws.chatJobId);
    }
    
    // Remove client reference
    this.clients.delete(ws.userId);
    ws.chatJobId = undefined;
  }
  
  private async handleSendMessage(ws: ExtendedWebSocket, payload: any) {
    const { message, replyToId, attachmentUrl, attachmentType } = payload;
    
    if (!ws.chatJobId || !ws.userId) {
      this.sendError(ws, 'Not in a chat room');
      return;
    }
    
    if (!message || message.trim().length === 0) {
      this.sendError(ws, 'Message cannot be empty');
      return;
    }
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) {
      this.sendError(ws, 'Chat room not found');
      return;
    }
    
    try {
      // Save message to database
      const newMessage = await storage.addJobMessage({
        jobId: ws.chatJobId,
        senderId: ws.userId,
        message: message.trim(),
        replyToId,
        attachmentUrl,
        attachmentType,
        isSystemMessage: false
      });
      
      // Send acknowledgment to sender
      this.sendMessage(ws, {
        type: 'MESSAGE_DELIVERED',
        payload: {
          tempId: payload.tempId, // Client-side temporary ID
          messageId: newMessage.id,
          timestamp: newMessage.createdAt
        }
      });
      
      // Broadcast to all participants
      room.broadcast({
        type: 'SEND_MESSAGE',
        payload: {
          ...newMessage,
          senderName: payload.senderName // Include sender name if provided
        }
      });
      
      // Stop typing indicator for sender
      room.stopTyping(ws.userId);
      room.broadcastTypingStatus();
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.sendError(ws, 'Failed to send message');
    }
  }
  
  private async handleEditMessage(ws: ExtendedWebSocket, payload: any) {
    const { messageId, newContent } = payload;
    
    if (!ws.chatJobId || !ws.userId) {
      this.sendError(ws, 'Not in a chat room');
      return;
    }
    
    if (!messageId || !newContent || newContent.trim().length === 0) {
      this.sendError(ws, 'Invalid edit request');
      return;
    }
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) {
      this.sendError(ws, 'Chat room not found');
      return;
    }
    
    try {
      // Edit message in database
      const editedMessage = await storage.editMessage(messageId, newContent.trim(), ws.userId);
      
      if (!editedMessage) {
        this.sendError(ws, 'Message not found or you do not have permission to edit');
        return;
      }
      
      // Broadcast edit to all participants
      room.broadcast({
        type: 'MESSAGE_EDITED',
        payload: editedMessage
      });
      
    } catch (error) {
      console.error('Error editing message:', error);
      this.sendError(ws, 'Failed to edit message');
    }
  }
  
  private async handleDeleteMessage(ws: ExtendedWebSocket, payload: any) {
    const { messageId } = payload;
    
    if (!ws.chatJobId || !ws.userId) {
      this.sendError(ws, 'Not in a chat room');
      return;
    }
    
    if (!messageId) {
      this.sendError(ws, 'Message ID is required');
      return;
    }
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) {
      this.sendError(ws, 'Chat room not found');
      return;
    }
    
    try {
      // Delete message in database
      const deleted = await storage.deleteMessage(messageId, ws.userId);
      
      if (!deleted) {
        this.sendError(ws, 'Message not found or you do not have permission to delete');
        return;
      }
      
      // Broadcast deletion to all participants
      room.broadcast({
        type: 'MESSAGE_DELETED',
        payload: { messageId }
      });
      
    } catch (error) {
      console.error('Error deleting message:', error);
      this.sendError(ws, 'Failed to delete message');
    }
  }
  
  private handleTypingIndicator(ws: ExtendedWebSocket, payload: any) {
    if (!ws.chatJobId || !ws.userId) return;
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) return;
    
    // Start typing indicator
    room.startTyping(ws.userId);
    room.broadcastTypingStatus();
  }
  
  private handleStopTyping(ws: ExtendedWebSocket) {
    if (!ws.chatJobId || !ws.userId) return;
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) return;
    
    // Stop typing indicator
    room.stopTyping(ws.userId);
    room.broadcastTypingStatus();
  }
  
  private async handleReadReceipt(ws: ExtendedWebSocket, payload: any) {
    const { messageIds } = payload;
    
    if (!ws.chatJobId || !ws.userId) {
      this.sendError(ws, 'Not in a chat room');
      return;
    }
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      this.sendError(ws, 'Message IDs are required');
      return;
    }
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) {
      this.sendError(ws, 'Chat room not found');
      return;
    }
    
    try {
      // Mark messages as read
      const receipts = await Promise.all(
        messageIds.map(msgId => storage.markMessageAsRead(msgId, ws.userId))
      );
      
      // Get updated unread count
      const unreadCount = await storage.getUnreadMessageCount(ws.chatJobId, ws.userId);
      
      // Send updated count to user
      this.sendMessage(ws, {
        type: 'UNREAD_COUNT_UPDATE',
        payload: { unreadCount }
      });
      
      // Broadcast read receipts to other participants
      room.broadcast({
        type: 'READ_RECEIPT',
        payload: {
          userId: ws.userId,
          messageIds,
          timestamp: new Date().toISOString()
        }
      }, ws.userId);
      
    } catch (error) {
      console.error('Error handling read receipt:', error);
      this.sendError(ws, 'Failed to mark messages as read');
    }
  }
  
  private async handleMessageReaction(ws: ExtendedWebSocket, payload: any) {
    const { messageId, emoji } = payload;
    
    if (!ws.chatJobId || !ws.userId) {
      this.sendError(ws, 'Not in a chat room');
      return;
    }
    
    if (!messageId || !emoji) {
      this.sendError(ws, 'Message ID and emoji are required');
      return;
    }
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) {
      this.sendError(ws, 'Chat room not found');
      return;
    }
    
    try {
      // Add reaction in database
      const updatedMessage = await storage.addMessageReaction(messageId, ws.userId, emoji);
      
      if (!updatedMessage) {
        this.sendError(ws, 'Message not found');
        return;
      }
      
      // Broadcast reaction to all participants
      room.broadcast({
        type: 'MESSAGE_REACTION',
        payload: {
          messageId,
          userId: ws.userId,
          emoji,
          reactions: updatedMessage.reactions
        }
      });
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      this.sendError(ws, 'Failed to add reaction');
    }
  }
  
  private async handleRemoveReaction(ws: ExtendedWebSocket, payload: any) {
    const { messageId, emoji } = payload;
    
    if (!ws.chatJobId || !ws.userId) {
      this.sendError(ws, 'Not in a chat room');
      return;
    }
    
    if (!messageId || !emoji) {
      this.sendError(ws, 'Message ID and emoji are required');
      return;
    }
    
    const room = this.chatRooms.get(ws.chatJobId);
    if (!room) {
      this.sendError(ws, 'Chat room not found');
      return;
    }
    
    try {
      // Remove reaction in database
      const updatedMessage = await storage.removeMessageReaction(messageId, ws.userId, emoji);
      
      if (!updatedMessage) {
        this.sendError(ws, 'Message not found');
        return;
      }
      
      // Broadcast reaction removal to all participants
      room.broadcast({
        type: 'REMOVE_REACTION',
        payload: {
          messageId,
          userId: ws.userId,
          emoji,
          reactions: updatedMessage.reactions
        }
      });
      
    } catch (error) {
      console.error('Error removing reaction:', error);
      this.sendError(ws, 'Failed to remove reaction');
    }
  }
  
  // ==================== FUEL TRACKING METHODS ====================
  
  public async broadcastFuelPriceUpdate(update: {
    stationId: string;
    fuelType: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
    location: { lat: number; lng: number };
  }) {
    const message = {
      type: 'FUEL_PRICE_UPDATE',
      payload: update
    };
    
    // Broadcast to all connected clients
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  public async broadcastFuelAlert(alert: {
    id: string;
    type: string;
    severity: string;
    message: string;
    stationId?: string;
    location?: { lat: number; lng: number };
    priceInfo?: {
      fuelType: string;
      price: number;
      previousPrice?: number;
    };
  }) {
    const message = {
      type: 'FUEL_ALERT',
      payload: alert
    };
    
    // Broadcast to all connected clients
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // ==================== NOTIFICATION METHODS ====================
  
  // Broadcast notification sent event
  public async broadcastNotificationSent(notification: {
    id: string;
    recipientId: string;
    type: string;
    channel: 'sms' | 'email' | 'both';
    message: string;
    timestamp: string;
  }) {
    const message = {
      type: 'NOTIFICATION_SENT',
      payload: notification
    };
    
    // Send to the recipient if connected
    const recipientWs = this.clients.get(notification.recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      this.sendMessage(recipientWs, message);
    }
    
    // Also broadcast to admins
    this.clients.forEach((ws) => {
      if (ws.role === 'admin' && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }
  
  // Broadcast notification delivery status
  public async broadcastNotificationDelivered(delivery: {
    id: string;
    notificationId: string;
    recipientId: string;
    status: 'delivered' | 'failed' | 'pending';
    channel: 'sms' | 'email' | 'push';
    error?: string;
    timestamp: string;
  }) {
    const message = {
      type: 'NOTIFICATION_DELIVERED',
      payload: delivery
    };
    
    // Send to the recipient if connected
    const recipientWs = this.clients.get(delivery.recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      this.sendMessage(recipientWs, message);
    }
    
    // Also broadcast to admins
    this.clients.forEach((ws) => {
      if (ws.role === 'admin' && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }
  
  // Broadcast blacklist update
  public async broadcastBlacklistUpdate(update: {
    action: 'added' | 'removed';
    contact: string;
    type: 'sms' | 'email' | 'all';
    timestamp: string;
  }) {
    const message = {
      type: 'NOTIFICATION_BLACKLIST_UPDATED',
      payload: update
    };
    
    // Broadcast to all admins
    this.clients.forEach((ws) => {
      if (ws.role === 'admin' && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }
  
  // ==================== FLEET MAINTENANCE METHODS ====================
  
  // Broadcast new maintenance alert
  public async broadcastMaintenanceAlert(alert: {
    id: string;
    vehicleId: string;
    fleetAccountId: string;
    alertType: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    recommendedAction?: string;
    timestamp: string;
  }) {
    const message = {
      type: 'MAINTENANCE_ALERT_NEW',
      payload: alert
    };
    
    // Broadcast to fleet managers of this account
    this.clients.forEach((ws) => {
      if (ws.role === 'fleet_manager' && ws.readyState === WebSocket.OPEN) {
        // TODO: Add fleet account check when implementing user sessions
        this.sendMessage(ws, message);
      }
    });
  }
  
  // Broadcast maintenance prediction update
  public async broadcastMaintenancePredictionUpdate(prediction: {
    vehicleId: string;
    fleetAccountId: string;
    predictionType: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    predictedDate: string;
    estimatedCost?: number;
    confidence: number;
    timestamp: string;
  }) {
    const message = {
      type: 'MAINTENANCE_PREDICTION_UPDATED',
      payload: prediction
    };
    
    // Broadcast to fleet managers of this account
    this.clients.forEach((ws) => {
      if (ws.role === 'fleet_manager' && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }
  
  // Broadcast service completion
  public async broadcastMaintenanceServiceCompleted(service: {
    id: string;
    vehicleId: string;
    fleetAccountId: string;
    serviceType: string;
    completedBy?: string;
    cost?: number;
    notes?: string;
    timestamp: string;
  }) {
    const message = {
      type: 'MAINTENANCE_SERVICE_COMPLETED',
      payload: service
    };
    
    // Broadcast to fleet managers of this account
    this.clients.forEach((ws) => {
      if (ws.role === 'fleet_manager' && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }
  
  // Broadcast fleet parts inventory update
  public async broadcastFleetPartsUpdate(update: {
    fleetAccountId: string;
    partId: string;
    partName: string;
    action: 'added' | 'removed' | 'updated';
    quantity?: number;
    unitCost?: number;
    timestamp: string;
  }) {
    const message = {
      type: 'FLEET_PARTS_UPDATED',
      payload: update
    };
    
    // Broadcast to fleet managers of this account
    this.clients.forEach((ws) => {
      if (ws.role === 'fleet_manager' && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }
  
  // ==================== CONTRACTOR EARNINGS METHODS ====================
  
  // Broadcast commission calculation
  public async broadcastCommissionCalculated(commission: {
    contractorId: string;
    jobId: string;
    amount: number;
    commissionRate: number;
    earned: number;
    serviceType: string;
    timestamp: string;
  }) {
    const message = {
      type: 'COMMISSION_CALCULATED',
      payload: commission
    };
    
    // Send to the specific contractor
    const contractorWs = this.clients.get(commission.contractorId);
    if (contractorWs && contractorWs.readyState === WebSocket.OPEN) {
      this.sendMessage(contractorWs, message);
    }
  }
  
  // Broadcast payout processed
  public async broadcastPayoutProcessed(payout: {
    contractorId: string;
    payoutId: string;
    amount: number;
    method: string;
    status: 'completed' | 'processing' | 'failed';
    referenceNumber?: string;
    timestamp: string;
  }) {
    const message = {
      type: 'PAYOUT_PROCESSED',
      payload: payout
    };
    
    // Send to the specific contractor
    const contractorWs = this.clients.get(payout.contractorId);
    if (contractorWs && contractorWs.readyState === WebSocket.OPEN) {
      this.sendMessage(contractorWs, message);
    }
  }
  
  // Broadcast performance update
  public async broadcastPerformanceUpdate(performance: {
    contractorId: string;
    metric: string;
    oldValue: number;
    newValue: number;
    trend: 'up' | 'down' | 'stable';
    timestamp: string;
  }) {
    const message = {
      type: 'PERFORMANCE_UPDATED',
      payload: performance
    };
    
    // Send to the specific contractor
    const contractorWs = this.clients.get(performance.contractorId);
    if (contractorWs && contractorWs.readyState === WebSocket.OPEN) {
      this.sendMessage(contractorWs, message);
    }
  }
  
  // Broadcast contractor parts update
  public async broadcastContractorPartsUpdate(update: {
    contractorId: string;
    partId: string;
    partName: string;
    action: 'added' | 'used' | 'restocked';
    quantity?: number;
    remainingStock?: number;
    timestamp: string;
  }) {
    const message = {
      type: 'CONTRACTOR_PARTS_UPDATED',
      payload: update
    };
    
    // Send to the specific contractor
    const contractorWs = this.clients.get(update.contractorId);
    if (contractorWs && contractorWs.readyState === WebSocket.OPEN) {
      this.sendMessage(contractorWs, message);
    }
  }

  // ==================== SUBSCRIPTION HANDLERS ====================
  
  // Handle joining notifications updates
  private async handleJoinNotifications(ws: ExtendedWebSocket, payload: any) {
    // Simply acknowledge the subscription
    this.sendMessage(ws, {
      type: 'JOIN_NOTIFICATIONS',
      payload: { success: true }
    });
  }
  
  // Handle leaving notifications updates
  private handleLeaveNotifications(ws: ExtendedWebSocket) {
    // No special cleanup needed for now
  }
  
  // Handle joining fleet updates
  private async handleJoinFleetUpdates(ws: ExtendedWebSocket, payload: any) {
    // Simply acknowledge the subscription
    this.sendMessage(ws, {
      type: 'JOIN_FLEET_UPDATES', 
      payload: { success: true }
    });
  }
  
  // Handle leaving fleet updates
  private handleLeaveFleetUpdates(ws: ExtendedWebSocket) {
    // No special cleanup needed for now
  }
  
  // Handle joining earnings updates
  private async handleJoinEarningsUpdates(ws: ExtendedWebSocket, payload: any) {
    // Simply acknowledge the subscription
    this.sendMessage(ws, {
      type: 'JOIN_EARNINGS_UPDATES',
      payload: { success: true }
    });
  }
  
  // Handle leaving earnings updates
  private handleLeaveEarningsUpdates(ws: ExtendedWebSocket) {
    // No special cleanup needed for now
  }
}

export const trackingWSServer = new TrackingWebSocketServer();