import React from 'react';

export default function AnalyticsDashboard({ analyticsData, loading, error }) {
  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="analytics-error">Error loading analytics: {error}</div>;
  }

  if (!analyticsData || analyticsData.totalUsers === 0) {
    return <div className="analytics-empty">No analytics data available yet. Start interacting with the site to see insights here.</div>;
  }

  return (
    <div className="analytics-dashboard">
      <h2>Dashboard Stats</h2>
      <p>Total Users: {analyticsData.totalUsers}</p>
      <p>Total Orders: {analyticsData.totalOrders}</p>
      {/* Add more analytics details and charts here */}
    </div>
  );
}
