/**
 * Single Source of Truth for Mock Data
 *
 * This module provides centralized mock data management for the application.
 * All mock data should be imported from this file to ensure consistency.
 */

import type { ActivityType } from "@/components/activity-feed";
import type { ClientStatus } from "@/components/status-monitor";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MockClient {
  id: string;
  name: string;
  phoneNumber: string;
  status: ClientStatus;
  lastConnected: Date | null;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  createdAt: Date;
}

export type MessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface Message {
  id: string;
  clientId: string;
  recipient: string;
  content: string;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  templateId?: string;
  error?: string;
}

export interface MockActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: {
    clientName?: string;
    phoneNumber?: string;
    [key: string]: string | number | undefined;
  };
}

export interface MockMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  connectedClients: number;
  totalClients: number;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generates realistic timestamp relative to current time
 */
function getRelativeTimestamp(minutesAgo: number): Date {
  return new Date(Date.now() - minutesAgo * 60 * 1000);
}

/**
 * Generates chart data based on actual client metrics
 * Distributes real data across time points with realistic patterns
 */
export function generateChartData(
  points: number,
  trend: "up" | "down" | "stable",
  baseMetric?: number,
): Array<{ value: number; timestamp?: string }> {
  const data = [];

  // Use actual metric as base, or calculate from clients
  const totalMessages = mockClients.reduce((sum, c) => sum + c.messagesSent, 0);
  const avgPerPoint = totalMessages / points;
  let baseValue = baseMetric || avgPerPoint;

  for (let i = 0; i < points; i++) {
    // Simulate business hours pattern (higher activity 9-18)
    const hour = (new Date().getHours() - (points - i)) % 24;
    const isBusinessHours = hour >= 9 && hour <= 18;
    const hourMultiplier = isBusinessHours ? 1.5 : 0.7;

    // Apply trend
    if (trend === "up") {
      baseValue += avgPerPoint * 0.05; // 5% increase per point
    } else if (trend === "down") {
      baseValue -= avgPerPoint * 0.03; // 3% decrease per point
    }

    // Add realistic variance (±10%)
    const variance = baseValue * 0.1 * (Math.random() - 0.5);
    const value = Math.max(0, baseValue * hourMultiplier + variance);

    data.push({ value: Math.round(value) });
  }

  return data;
}

/**
 * Generates chart data for specific metric type
 */
export function generateMetricChartData(
  metricType: "sent" | "delivered" | "failed" | "rate",
  points: number = 20,
): Array<{ value: number }> {
  const clients = mockClients;

  switch (metricType) {
    case "sent": {
      const total = clients.reduce((sum, c) => sum + c.messagesSent, 0);
      return generateChartData(points, "up", total / points);
    }
    case "delivered": {
      const total = clients.reduce((sum, c) => sum + c.messagesDelivered, 0);
      return generateChartData(points, "up", total / points);
    }
    case "failed": {
      const total = clients.reduce((sum, c) => sum + c.messagesFailed, 0);
      return generateChartData(points, "stable", total / points);
    }
    case "rate": {
      const metrics = calculateMetrics(clients);
      return generateChartData(points, "stable", metrics.deliveryRate);
    }
    default:
      return generateChartData(points, "stable");
  }
}

// ============================================================================
// MOCK CLIENTS DATA
// ============================================================================

export const mockClients: MockClient[] = [
  {
    id: "1",
    name: "Primary Business",
    phoneNumber: "+1234567890",
    status: "connected",
    lastConnected: getRelativeTimestamp(5),
    messagesSent: 1247,
    messagesDelivered: 1198,
    messagesFailed: 12,
    createdAt: getRelativeTimestamp(60 * 24 * 30), // 30 days ago
  },
  {
    id: "2",
    name: "Support Line",
    phoneNumber: "+1234567891",
    status: "connected",
    lastConnected: getRelativeTimestamp(2),
    messagesSent: 3421,
    messagesDelivered: 3389,
    messagesFailed: 8,
    createdAt: getRelativeTimestamp(60 * 24 * 45), // 45 days ago
  },
  {
    id: "3",
    name: "Marketing Account",
    phoneNumber: "+1234567892",
    status: "disconnected",
    lastConnected: getRelativeTimestamp(60 * 2), // 2 hours ago
    messagesSent: 892,
    messagesDelivered: 856,
    messagesFailed: 24,
    createdAt: getRelativeTimestamp(60 * 24 * 15), // 15 days ago
  },
  {
    id: "4",
    name: "Sales Team",
    phoneNumber: "+1234567893",
    status: "connecting",
    lastConnected: null,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    createdAt: getRelativeTimestamp(10),
  },
  {
    id: "5",
    name: "Customer Service",
    phoneNumber: "+1234567894",
    status: "connected",
    lastConnected: getRelativeTimestamp(8),
    messagesSent: 2156,
    messagesDelivered: 2089,
    messagesFailed: 15,
    createdAt: getRelativeTimestamp(60 * 24 * 60), // 60 days ago
  },
  {
    id: "6",
    name: "E-commerce Bot",
    phoneNumber: "+1234567895",
    status: "connected",
    lastConnected: getRelativeTimestamp(1),
    messagesSent: 5432,
    messagesDelivered: 5398,
    messagesFailed: 34,
    createdAt: getRelativeTimestamp(60 * 24 * 90), // 90 days ago
  },
  {
    id: "7",
    name: "Notifications Service",
    phoneNumber: "+1234567896",
    status: "idle",
    lastConnected: getRelativeTimestamp(60 * 4), // 4 hours ago
    messagesSent: 678,
    messagesDelivered: 665,
    messagesFailed: 13,
    createdAt: getRelativeTimestamp(60 * 24 * 20), // 20 days ago
  },
  {
    id: "8",
    name: "Beta Testing Account",
    phoneNumber: "+1234567897",
    status: "error",
    lastConnected: getRelativeTimestamp(60), // 1 hour ago
    messagesSent: 45,
    messagesDelivered: 38,
    messagesFailed: 7,
    createdAt: getRelativeTimestamp(60 * 24 * 5), // 5 days ago
  },
  {
    id: "9",
    name: "VIP Customer Line",
    phoneNumber: "+1234567898",
    status: "connected",
    lastConnected: getRelativeTimestamp(12),
    messagesSent: 987,
    messagesDelivered: 978,
    messagesFailed: 9,
    createdAt: getRelativeTimestamp(60 * 24 * 40), // 40 days ago
  },
  {
    id: "10",
    name: "Backup Instance",
    phoneNumber: "+1234567899",
    status: "disconnected",
    lastConnected: getRelativeTimestamp(60 * 24 * 3), // 3 days ago
    messagesSent: 234,
    messagesDelivered: 228,
    messagesFailed: 6,
    createdAt: getRelativeTimestamp(60 * 24 * 100), // 100 days ago
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    clientId: "1",
    recipient: "+1234567890",
    content: "Welcome to our service!",
    status: "delivered",
    sentAt: new Date(Date.now() - 1000 * 60 * 30),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 29),
  },
  {
    id: "msg-2",
    clientId: "1",
    recipient: "+1234567891",
    content: "Your order has been confirmed",
    status: "read",
    sentAt: new Date(Date.now() - 1000 * 60 * 60),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 59),
    readAt: new Date(Date.now() - 1000 * 60 * 58),
  },
  {
    id: "msg-3",
    clientId: "2",
    recipient: "+1234567892",
    content: "Thank you for contacting support",
    status: "delivered",
    sentAt: new Date(Date.now() - 1000 * 60 * 15),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 14),
  },
  {
    id: "msg-4",
    clientId: "1",
    recipient: "+1234567893",
    content: "Your appointment is scheduled for tomorrow",
    status: "sent",
    sentAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "msg-5",
    clientId: "3",
    recipient: "+1234567894",
    content: "Special offer just for you!",
    status: "failed",
    sentAt: new Date(Date.now() - 1000 * 60 * 45),
    error: "Recipient number is invalid",
  },
];

// ============================================================================
// MOCK ACTIVITIES DATA
// ============================================================================

export const mockActivities: MockActivity[] = [
  {
    id: "1",
    type: "message_delivered",
    title: "Message delivered successfully",
    description: "Welcome message sent to new customer",
    timestamp: getRelativeTimestamp(2),
    metadata: {
      clientName: "Primary Business",
      phoneNumber: "+1234567890",
    },
  },
  {
    id: "2",
    type: "message_sent",
    title: "Order confirmation sent",
    description: "Automated order #12345 confirmation message",
    timestamp: getRelativeTimestamp(5),
    metadata: {
      clientName: "E-commerce Bot",
      phoneNumber: "+1555123456",
    },
  },
  {
    id: "3",
    type: "client_connected",
    title: "Client connected",
    description: "E-commerce Bot is now online",
    timestamp: getRelativeTimestamp(8),
    metadata: {
      clientName: "E-commerce Bot",
    },
  },
  {
    id: "4",
    type: "message_delivered",
    title: "Support ticket response delivered",
    description: "Response to ticket #789 sent successfully",
    timestamp: getRelativeTimestamp(12),
    metadata: {
      clientName: "Customer Service",
      phoneNumber: "+1555987654",
    },
  },
  {
    id: "5",
    type: "client_connected",
    title: "Client reconnected",
    description: "Support Line is back online",
    timestamp: getRelativeTimestamp(15),
    metadata: {
      clientName: "Support Line",
    },
  },
  {
    id: "6",
    type: "message_sent",
    title: "Bulk message campaign started",
    description: "Sending promotional messages to 150 contacts",
    timestamp: getRelativeTimestamp(30),
    metadata: {
      clientName: "Marketing Account",
    },
  },
  {
    id: "7",
    type: "message_delivered",
    title: "VIP customer inquiry response",
    description: "Priority message delivered to premium customer",
    timestamp: getRelativeTimestamp(35),
    metadata: {
      clientName: "VIP Customer Line",
      phoneNumber: "+1555111222",
    },
  },
  {
    id: "8",
    type: "message_failed",
    title: "Message delivery failed",
    description: "Unable to deliver message - recipient unavailable",
    timestamp: getRelativeTimestamp(45),
    metadata: {
      clientName: "Primary Business",
      phoneNumber: "+1987654321",
    },
  },
  {
    id: "9",
    type: "error",
    title: "Connection error detected",
    description: "Beta Testing Account experiencing connectivity issues",
    timestamp: getRelativeTimestamp(60),
    metadata: {
      clientName: "Beta Testing Account",
    },
  },
  {
    id: "10",
    type: "message_delivered",
    title: "Payment reminder sent",
    description: "Automated payment reminder for invoice #4567",
    timestamp: getRelativeTimestamp(75),
    metadata: {
      clientName: "E-commerce Bot",
      phoneNumber: "+1555333444",
    },
  },
  {
    id: "11",
    type: "info",
    title: "System health check completed",
    description: "All active clients passed health verification",
    timestamp: getRelativeTimestamp(90),
    metadata: {},
  },
  {
    id: "12",
    type: "client_disconnected",
    title: "Client disconnected",
    description: "Marketing Account went offline",
    timestamp: getRelativeTimestamp(120),
    metadata: {
      clientName: "Marketing Account",
    },
  },
  {
    id: "13",
    type: "message_sent",
    title: "Notification batch dispatched",
    description: "45 notification messages queued for delivery",
    timestamp: getRelativeTimestamp(135),
    metadata: {
      clientName: "Notifications Service",
    },
  },
  {
    id: "14",
    type: "message_delivered",
    title: "Customer feedback request delivered",
    description: "Post-purchase survey sent to 20 customers",
    timestamp: getRelativeTimestamp(150),
    metadata: {
      clientName: "Customer Service",
    },
  },
  {
    id: "15",
    type: "client_connected",
    title: "New client initialized",
    description: "Sales Team client successfully configured",
    timestamp: getRelativeTimestamp(180),
    metadata: {
      clientName: "Sales Team",
    },
  },
  {
    id: "16",
    type: "message_failed",
    title: "Bulk send partially failed",
    description: "3 out of 50 messages failed to deliver",
    timestamp: getRelativeTimestamp(200),
    metadata: {
      clientName: "Marketing Account",
    },
  },
  {
    id: "17",
    type: "message_delivered",
    title: "Appointment reminder sent",
    description: "Reminder for tomorrow's appointment delivered",
    timestamp: getRelativeTimestamp(240),
    metadata: {
      clientName: "Primary Business",
      phoneNumber: "+1555777888",
    },
  },
  {
    id: "18",
    type: "info",
    title: "Database backup completed",
    description: "Message history successfully backed up",
    timestamp: getRelativeTimestamp(300),
    metadata: {},
  },
];

// ============================================================================
// COMPUTED METRICS
// ============================================================================

/**
 * Calculates aggregated metrics from mock clients
 */
export function calculateMetrics(clients: MockClient[]): MockMetrics {
  const connectedClients = clients.filter(
    (c) => c.status === "connected",
  ).length;
  const totalSent = clients.reduce((sum, c) => sum + c.messagesSent, 0);
  const totalDelivered = clients.reduce(
    (sum, c) => sum + c.messagesDelivered,
    0,
  );
  const totalFailed = clients.reduce((sum, c) => sum + c.messagesFailed, 0);
  const deliveryRate =
    totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  return {
    totalSent,
    totalDelivered,
    totalFailed,
    deliveryRate,
    connectedClients,
    totalClients: clients.length,
  };
}

// ============================================================================
// DATA ACCESSORS
// ============================================================================

/**
 * Get all mock clients
 */
export function getClients(): MockClient[] {
  return mockClients;
}

/**
 * Get client by ID
 */
export function getClientById(id: string): MockClient | undefined {
  return mockClients.find((client) => client.id === id);
}

/**
 * Get clients by status
 */
export function getClientsByStatus(status: ClientStatus): MockClient[] {
  return mockClients.filter((client) => client.status === status);
}

/**
 * Get all mock activities
 */
export function getActivities(): MockActivity[] {
  return mockActivities;
}

/**
 * Get activities by type
 */
export function getActivitiesByType(type: ActivityType): MockActivity[] {
  return mockActivities.filter((activity) => activity.type === type);
}

/**
 * Get recent activities (last N items)
 */
export function getRecentActivities(count: number): MockActivity[] {
  return mockActivities.slice(0, count);
}

/**
 * Get activities for a specific client
 */
export function getActivitiesByClient(clientName: string): MockActivity[] {
  return mockActivities.filter(
    (activity) => activity.metadata?.clientName === clientName,
  );
}
