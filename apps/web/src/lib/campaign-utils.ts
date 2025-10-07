/**
 * Campaign Utilities
 * Comprehensive utilities for campaign management, CSV parsing, rate limiting, and webhooks
 */

// ============================================================================
// CSV PARSING & VALIDATION
// ============================================================================

export interface CSVRecipient {
  phoneNumber: string;
  name?: string;
  variables: Record<string, string>;
}

export interface CSVParseResult {
  recipients: CSVRecipient[];
  errors: Array<{ row: number; error: string }>;
  totalRows: number;
  validRows: number;
}

/**
 * Parse CSV file and extract recipients with variables
 */
export async function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim());
        const phoneIndex = headers.findIndex(
          (h) =>
            h.toLowerCase().includes("phone") ||
            h.toLowerCase().includes("number"),
        );
        const nameIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("name"),
        );

        if (phoneIndex === -1) {
          reject(new Error("CSV must contain a phone number column"));
          return;
        }

        const recipients: CSVRecipient[] = [];
        const errors: Array<{ row: number; error: string }> = [];

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());

          if (values.length !== headers.length) {
            errors.push({ row: i + 1, error: "Column count mismatch" });
            continue;
          }

          const phoneNumber = values[phoneIndex];
          if (!isValidPhoneNumber(phoneNumber)) {
            errors.push({
              row: i + 1,
              error: `Invalid phone number: ${phoneNumber}`,
            });
            continue;
          }

          // Extract variables from other columns
          const variables: Record<string, string> = {};
          headers.forEach((header, idx) => {
            if (idx !== phoneIndex && idx !== nameIndex) {
              variables[header] = values[idx];
            }
          });

          recipients.push({
            phoneNumber: normalizePhoneNumber(phoneNumber),
            name: nameIndex >= 0 ? values[nameIndex] : undefined,
            variables,
          });
        }

        resolve({
          recipients,
          errors,
          totalRows: lines.length - 1,
          validRows: recipients.length,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  // Check if it's between 10-15 digits (international format)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Export recipients to CSV
 */
export function exportToCSV(
  recipients: CSVRecipient[],
  filename: string,
): void {
  const headers = [
    "Phone Number",
    "Name",
    ...Object.keys(recipients[0]?.variables || {}),
  ];
  const rows = recipients.map((r) => [
    r.phoneNumber,
    r.name || "",
    ...Object.values(r.variables),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n",
  );

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitConfig {
  messagesPerSecond: number;
  messagesPerMinute: number;
  messagesPerHour: number;
  messagesPerDay: number;
  burstSize: number; // Max messages in a burst
}

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  conservative: {
    messagesPerSecond: 1,
    messagesPerMinute: 50,
    messagesPerHour: 1000,
    messagesPerDay: 10000,
    burstSize: 5,
  },
  moderate: {
    messagesPerSecond: 5,
    messagesPerMinute: 200,
    messagesPerHour: 5000,
    messagesPerDay: 50000,
    burstSize: 20,
  },
  aggressive: {
    messagesPerSecond: 10,
    messagesPerMinute: 500,
    messagesPerHour: 10000,
    messagesPerDay: 100000,
    burstSize: 50,
  },
};

/**
 * Calculate estimated completion time
 */
export function calculateETA(
  totalRecipients: number,
  rateLimit: RateLimitConfig,
): { duration: number; completionTime: Date } {
  const messagesPerSecond = Math.min(
    rateLimit.messagesPerSecond,
    rateLimit.messagesPerMinute / 60,
    rateLimit.messagesPerHour / 3600,
  );

  const durationSeconds = totalRecipients / messagesPerSecond;
  const completionTime = new Date(Date.now() + durationSeconds * 1000);

  return {
    duration: durationSeconds,
    completionTime,
  };
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

// ============================================================================
// A/B TESTING
// ============================================================================

export interface ABTestVariant {
  id: string;
  name: string;
  template: string;
  weight: number; // Percentage (0-100)
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

export interface ABTestConfig {
  enabled: boolean;
  variants: ABTestVariant[];
  splitStrategy: "random" | "sequential" | "weighted";
}

/**
 * Assign recipient to A/B test variant
 */
export function assignVariant(
  recipientIndex: number,
  config: ABTestConfig,
): ABTestVariant {
  if (!config.enabled || config.variants.length === 0) {
    return config.variants[0];
  }

  switch (config.splitStrategy) {
    case "random":
      const random = Math.random() * 100;
      let cumulative = 0;
      for (const variant of config.variants) {
        cumulative += variant.weight;
        if (random <= cumulative) return variant;
      }
      return config.variants[config.variants.length - 1];

    case "sequential":
      return config.variants[recipientIndex % config.variants.length];

    case "weighted":
      const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
      const weightedRandom = Math.random() * totalWeight;
      let weightSum = 0;
      for (const variant of config.variants) {
        weightSum += variant.weight;
        if (weightedRandom <= weightSum) return variant;
      }
      return config.variants[config.variants.length - 1];

    default:
      return config.variants[0];
  }
}

/**
 * Calculate A/B test winner based on metrics
 */
export function calculateABTestWinner(variants: ABTestVariant[]): {
  winner: ABTestVariant;
  confidence: number;
  reason: string;
} {
  const variantsWithRates = variants.map((v) => ({
    variant: v,
    deliveryRate:
      v.metrics.sent > 0 ? (v.metrics.delivered / v.metrics.sent) * 100 : 0,
    readRate:
      v.metrics.delivered > 0
        ? (v.metrics.read / v.metrics.delivered) * 100
        : 0,
  }));

  // Sort by read rate (primary) and delivery rate (secondary)
  variantsWithRates.sort((a, b) => {
    if (Math.abs(a.readRate - b.readRate) > 5) {
      return b.readRate - a.readRate;
    }
    return b.deliveryRate - a.deliveryRate;
  });

  const winner = variantsWithRates[0];
  const runnerUp = variantsWithRates[1];

  const confidence = winner.readRate - (runnerUp?.readRate || 0);

  return {
    winner: winner.variant,
    confidence: Math.min(confidence, 100),
    reason: `${winner.readRate.toFixed(1)}% read rate vs ${runnerUp?.readRate.toFixed(1) || 0}%`,
  };
}

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

export interface WebhookConfig {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  retryAttempts: number;
  timeout: number; // milliseconds
}

export type WebhookEvent =
  | "campaign.started"
  | "campaign.completed"
  | "campaign.paused"
  | "campaign.failed"
  | "message.sent"
  | "message.delivered"
  | "message.read"
  | "message.failed";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: Date;
  campaignId: string;
  data: any;
}

/**
 * Send webhook notification
 */
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload,
): Promise<boolean> {
  if (!config.events.includes(payload.event)) {
    return true; // Event not subscribed
  }

  for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": generateWebhookSignature(
            payload,
            config.secret,
          ),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return true;
      }

      // Retry on 5xx errors
      if (response.status >= 500 && attempt < config.retryAttempts) {
        await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        continue;
      }

      return false;
    } catch (error) {
      if (attempt < config.retryAttempts) {
        await delay(Math.pow(2, attempt) * 1000);
        continue;
      }
      return false;
    }
  }

  return false;
}

/**
 * Generate HMAC signature for webhook verification
 */
function generateWebhookSignature(
  payload: WebhookPayload,
  secret?: string,
): string {
  if (!secret) return "";

  // TODO: Implement actual HMAC-SHA256 signature
  // const crypto = require('crypto');
  // return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  return "mock-signature";
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  // TODO: Implement actual signature verification
  return true;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface RecipientAnalytics {
  recipientId: string;
  phoneNumber: string;
  name?: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  deliveryTime?: number; // milliseconds
  readTime?: number; // milliseconds
  variant?: string; // A/B test variant
}

export interface CampaignAnalytics {
  campaignId: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  readRate: number;
  averageDeliveryTime: number;
  averageReadTime: number;
  failureReasons: Record<string, number>;
  hourlyBreakdown: Array<{ hour: number; sent: number; delivered: number }>;
  variantPerformance?: Record<string, ABTestVariant["metrics"]>;
}

/**
 * Calculate comprehensive campaign analytics
 */
export function calculateCampaignAnalytics(
  recipients: RecipientAnalytics[],
): CampaignAnalytics {
  const sent = recipients.filter((r) => r.status !== "pending").length;
  const delivered = recipients.filter(
    (r) => r.status === "delivered" || r.status === "read",
  ).length;
  const read = recipients.filter((r) => r.status === "read").length;
  const failed = recipients.filter((r) => r.status === "failed").length;
  const pending = recipients.filter((r) => r.status === "pending").length;

  const deliveryTimes = recipients
    .filter((r) => r.deliveryTime)
    .map((r) => r.deliveryTime!);
  const readTimes = recipients
    .filter((r) => r.readTime)
    .map((r) => r.readTime!);

  const failureReasons: Record<string, number> = {};
  recipients
    .filter((r) => r.failureReason)
    .forEach((r) => {
      failureReasons[r.failureReason!] =
        (failureReasons[r.failureReason!] || 0) + 1;
    });

  return {
    campaignId: "",
    totalRecipients: recipients.length,
    sent,
    delivered,
    read,
    failed,
    pending,
    deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    readRate: delivered > 0 ? (read / delivered) * 100 : 0,
    averageDeliveryTime: average(deliveryTimes),
    averageReadTime: average(readTimes),
    failureReasons,
    hourlyBreakdown: [],
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(variables: string[]): string {
  const headers = ["phone_number", "name", ...variables];
  const sampleRow = [
    "+1234567890",
    "John Doe",
    ...variables.map(() => "Sample Value"),
  ];

  return [headers.join(","), sampleRow.join(",")].join("\n");
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(variables: string[]): void {
  const csv = generateCSVTemplate(variables);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "campaign-recipients-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
