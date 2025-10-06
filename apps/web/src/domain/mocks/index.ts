/**
 * Public API for Mock Data
 * 
 * Import all mock data and utilities from this file
 */

export {
  // Types
  type MockClient,
  type MockActivity,
  type MockMetrics,
  
  // Data Accessors
  getClients,
  getClientById,
  getClientsByStatus,
  getActivities,
  getActivitiesByType,
  getRecentActivities,
  getActivitiesByClient,
  
  // Utilities
  calculateMetrics,
  generateChartData,
  generateMetricChartData,
} from "./mock-data";
