// Test services initialization
console.log('Testing services initialization...');

try {
  const { AnalyticsService } = require('./lib/services/analyticsService');
  console.log('✓ AnalyticsService imported');
  
  const analyticsService = new AnalyticsService();
  console.log('✓ AnalyticsService instantiated');
  
  console.log('All services initialized successfully!');
} catch (error) {
  console.error('Error initializing services:', error);
}