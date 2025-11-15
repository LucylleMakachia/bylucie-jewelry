import { getCompleteAnalytics } from '../../../services/analytics/orderAnalyticsServices.js';

export async function GET() {
  try {
    const analytics = await getCompleteAnalytics();
    
    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}