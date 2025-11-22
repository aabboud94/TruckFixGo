import { jobStatusHistory } from "@shared/schema";
import { db } from "./db";
import { storage } from "./storage";
import { pushNotificationService, NotificationType } from "./services/push-notification-service";
import { createAssignmentTimeoutManager, DEFAULT_TIMEOUT_MS } from "./assignment-timeout-manager";

export const assignmentTimeoutManager = createAssignmentTimeoutManager({
  storage,
  recordStatusHistory: async ({ jobId, fromStatus, toStatus, changedBy, reason }) => {
    await db.insert(jobStatusHistory).values({
      jobId,
      fromStatus,
      toStatus,
      changedBy,
      reason
    });
  },
  notifyReassignment: async ({ jobId, fromContractorId, toContractorId, customerId }) => {
    const notification = {
      title: 'Job reassigned',
      body: `Job ${jobId} has been reassigned to another contractor`,
      type: NotificationType.JOB_UPDATE
    } as const;

    await Promise.all([
      pushNotificationService.sendPushNotification(fromContractorId, notification),
      toContractorId ? pushNotificationService.sendPushNotification(toContractorId, notification) : Promise.resolve({ success: true, sent: 0, failed: 0, errors: [] }),
      customerId ? pushNotificationService.sendPushNotification(customerId, notification) : Promise.resolve({ success: true, sent: 0, failed: 0, errors: [] })
    ]);
  }
});

export const ASSIGNMENT_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

