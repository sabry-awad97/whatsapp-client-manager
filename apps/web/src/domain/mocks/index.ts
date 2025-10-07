/**
 * Public API for Mock Data
 *
 * Import all mock data and utilities from this file
 */

export {
  // Client Types
  type MockClient,
  type MockActivity,
  type MockMetrics,
  type Message,
  type MessageStatus,

  // Campaign Types
  type CampaignStatus,
  type CampaignProgress,
  type MessageTemplate,
  type Recipient,
  type BulkCampaign,

  // Client Data Accessors
  getClients,
  getClientById,
  getClientsByStatus,
  getActivities,
  getActivitiesByType,
  getRecentActivities,
  getActivitiesByClient,

  // Campaign Data Accessors
  getCampaigns,
  getCampaignById,
  getCampaignsByStatus,
  getCampaignsByClient,
  getTemplates,
  getTemplateById,
  getTemplatesByCategory,

  // Utilities
  calculateMetrics,
  generateChartData,
  generateMetricChartData,
} from "./mock-data";
