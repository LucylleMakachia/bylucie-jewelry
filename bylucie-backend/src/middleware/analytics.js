import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const analyticsFilePath = path.join(process.cwd(), 'data', 'analytics.json');

function ensureAnalyticsFile() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fsSync.existsSync(dataDir)) {
      fsSync.mkdirSync(dataDir, { recursive: true });
    }
    if (!fsSync.existsSync(analyticsFilePath)) {
      const initialData = {
        pageViews: [],
        userSessions: [],
        events: [],
        orders: [],
        productsViewed: []
      };
      fsSync.writeFileSync(analyticsFilePath, JSON.stringify(initialData, null, 2));
    }
  } catch (err) {
    // Silently fail - don't break the application
  }
}

async function readAnalytics() {
  try {
    ensureAnalyticsFile();
    const data = await fs.readFile(analyticsFilePath, 'utf-8');
    
    if (!data.trim()) {
      return { pageViews: [], userSessions: [], events: [], orders: [], productsViewed: [] };
    }
    
    return JSON.parse(data);
  } catch (err) {
    return { pageViews: [], userSessions: [], events: [], orders: [], productsViewed: [] };
  }
}

async function writeAnalytics(data) {
  try {
    ensureAnalyticsFile();
    await fs.writeFile(analyticsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    // Silently fail - don't break the application
  }
}

// Middleware to track page views
export const trackPageView = async (req, res, next) => {
  try {
    const analytics = await readAnalytics();
    
    const pageView = {
      id: Date.now().toString(),
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      sessionId: req.session?.id || req.get('X-Session-Id') || 'unknown'
    };

    analytics.pageViews.push(pageView);
    
    if (analytics.pageViews.length > 10000) {
      analytics.pageViews = analytics.pageViews.slice(-5000);
    }
    
    // Don't await - fire and forget
    writeAnalytics(analytics);
  } catch (err) {
    // Silently fail - don't break the request
  }
  next();
};

// Function to track custom events
export const trackEvent = async (eventType, data, userId = 'anonymous') => {
  try {
    const analytics = await readAnalytics();
    
    const event = {
      id: Date.now().toString(),
      type: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      userId: userId
    };

    analytics.events.push(event);
    
    if (analytics.events.length > 5000) {
      analytics.events = analytics.events.slice(-2500);
    }
    
    // Don't await - fire and forget
    writeAnalytics(analytics);
  } catch (err) {
    // Silently fail
  }
};

// Function to track product views
export const trackProductView = async (productId, productName, userId = 'anonymous') => {
  // Don't await - fire and forget
  trackEvent('product_view', { productId, productName }, userId)
    .catch(() => {}); // Silently fail
};

// Function to track orders
export const trackOrder = async (orderData, userId = 'anonymous') => {
  try {
    const analytics = await readAnalytics();
    
    const orderEvent = {
      id: Date.now().toString(),
      type: 'order_created',
      data: orderData,
      timestamp: new Date().toISOString(),
      userId: userId
    };

    analytics.orders.push(orderEvent);
    analytics.events.push(orderEvent);
    
    // Don't await - fire and forget
    writeAnalytics(analytics);
  } catch (err) {
    // Silently fail
  }
};

export { readAnalytics };