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
  'BIDDING_UPDATE'
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
  role?: 'customer' | 'contractor' | 'guest' | 'admin';
  jobId?: string;
  biddingJobId?: string;
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

class TrackingWebSocketServer {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, TrackingRoom> = new Map();
  private biddingRooms: Map<string, BiddingRoom> = new Map();
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
    this.clients.clear();
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
}

export const trackingWSServer = new TrackingWebSocketServer();