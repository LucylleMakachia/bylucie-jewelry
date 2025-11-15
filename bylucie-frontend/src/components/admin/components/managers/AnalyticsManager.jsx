import React, { useState } from 'react';

function AnalyticsManager({ analytics }) {
  const {
    overview = {},
    charts = {},
    popularProducts = [],
    dashboardStats = {},
    trafficSources = []
  } = analytics;

  // Extract overview data with zeros as defaults
  const {
    totalRevenue = 0,
    totalOrders = 0,
    averageOrderValue = 0,
    totalUsers = 0,
    newUsers = 0,
    totalPageViews = 0,
    uniqueVisitors = 0,
    productViews = 0
  } = overview;

  // Extract dashboard stats with zeros as defaults
  const {
    today = { orders: 0, revenue: 0 },
    weekly = { orders: 0, revenue: 0 },
    alerts = { lowStock: 0, pendingOrders: 0 }
  } = dashboardStats;

  // Extract chart data with empty arrays as defaults
  const {
    monthlySales = [],
    orderStatus = []
  } = charts;

  const hasData = totalRevenue > 0 || totalOrders > 0 || totalUsers > 0;

  // Time interval state
  const [timeInterval, setTimeInterval] = useState('months');
  
  // Currency state
  const [currency, setCurrency] = useState('USD');

  // Currency configuration
  const currencies = {
    USD: { symbol: '$', code: 'USD', name: 'US Dollar', rate: 1 },
    KSH: { symbol: 'KSh', code: 'KSH', name: 'Kenyan Shilling', rate: 101.50 },
    EUR: { symbol: '€', code: 'EUR', name: 'Euro', rate: 0.85 },
    GBP: { symbol: '£', code: 'GBP', name: 'British Pound', rate: 0.75 }
  };

  // Format currency function
  const formatCurrency = (amount) => {
    try {
      const currentCurrency = currencies[currency];
      const convertedAmount = amount * currentCurrency.rate;
      
      if (currency === 'KSH') {
        return `${currentCurrency.symbol} ${Math.round(convertedAmount).toLocaleString()}`;
      } else {
        return `${currentCurrency.symbol} ${convertedAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      }
    } catch (error) {
      return `$${amount.toLocaleString()}`;
    }
  };

  // Format value for charts based on type
  const formatChartValue = (value, isCurrency = true) => {
    try {
      if (!isCurrency) return value.toLocaleString();
      
      const currentCurrency = currencies[currency];
      const convertedValue = value * currentCurrency.rate;
      
      if (currency === 'KSH') {
        return `${currentCurrency.symbol} ${Math.round(convertedValue).toLocaleString()}`;
      } else {
        return `${currentCurrency.symbol} ${convertedValue.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })}`;
      }
    } catch (error) {
      return `$${value.toLocaleString()}`;
    }
  };

  // Get value from item with standardized data structure
  const getChartValue = (item, isCurrency) => {
    if (isCurrency) return item.revenue || item.sales || item.value || 0;
    return item.count || item.orders || item.visitors || item.sales || item.value || 0;
  };

  // Get label from item with standardized data structure
  const getChartLabel = (item) => {
    return item.month || item.status || item.label || item.name || item.source || 'Item';
  };

  // Simple bar chart component for sales data
  const BarChart = ({ data, title, color = '#b8860b', isCurrency = true }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          No chart data available
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => getChartValue(item, isCurrency)));
    const barWidth = 100 / data.length;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-700">{title}</h4>
          {title.includes('Sales') && (
            <select
              value={timeInterval}
              onChange={(e) => setTimeInterval(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
            >
              <option value="years">Years</option>
              <option value="months">Months</option>
              <option value="days">Days</option>
              <option value="hours">Hours</option>
            </select>
          )}
        </div>
        <div className="flex items-end justify-between h-48 space-x-1">
          {data.map((item, index) => {
            const value = getChartValue(item, isCurrency);
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const label = getChartLabel(item);
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 space-y-1">
                <div
                  className="rounded-t transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color,
                    width: '70%',
                    minHeight: '4px'
                  }}
                  title={`${label}: ${formatChartValue(value, isCurrency)}`}
                />
                <span className="text-xs text-gray-600 truncate w-full text-center">
                  {label}
                </span>
                <span className="text-xs font-medium text-gray-900">
                  {formatChartValue(value, isCurrency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Pie chart for traffic sources
  const TrafficSourcesChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          No traffic source data available
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + (item.visitors || item.value || 0), 0);
    const colors = ['#b8860b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    let currentAngle = 0;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700 text-center">Traffic Sources</h4>
        <div className="relative h-48 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            {data.map((item, index) => {
              const value = item.visitors || item.value || 0;
              const percentage = total > 0 ? (value / total) * 100 : 0;
              const angle = (percentage / 100) * 360;
              
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              // Convert angles to radians
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              
              // Calculate coordinates
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              
              const largeArc = angle > 180 ? 1 : 0;

              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="#fff"
                  strokeWidth="1"
                  className="hover:opacity-80 cursor-pointer"
                  title={`${item.source}: ${value.toLocaleString()} visitors (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {data.map((item, index) => {
            const value = item.visitors || item.value || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="truncate flex-1">{item.source}</span>
                <span className="font-medium">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="analytics-dashboard" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h2>
          <p className="text-gray-600">Analytics data will appear as users interact with your site</p>
        </div>
        
        {/* Currency Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Currency:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b8860b] bg-white"
          >
            {Object.values(currencies).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Currency Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <strong>Current currency:</strong> {currencies[currency].name} ({currencies[currency].symbol})
        {currency !== 'USD' && (
          <span className="ml-2">
            • Exchange rate: 1 USD = {currencies[currency].rate} {currencies[currency].code}
          </span>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{totalPageViews.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">📄</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales Chart with Time Interval Selector */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Sales Over Time</h3>
          <BarChart 
            data={monthlySales} 
            title={`Sales by ${timeInterval}`} 
            color="#b8860b"
            isCurrency={true}
          />
        </div>

        {/* Traffic Sources Chart */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Traffic Sources</h3>
          <TrafficSourcesChart data={trafficSources} />
        </div>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Order Status Chart */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Order Status Distribution</h3>
          <BarChart 
            data={orderStatus} 
            title="Orders by Status" 
            color="#3b82f6"
            isCurrency={false}
          />
        </div>

        {/* Popular Products */}
        {popularProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Popular Products</h3>
            <BarChart 
              data={popularProducts} 
              title="Product Performance" 
              color="#10b981"
              isCurrency={false}
            />
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{today.orders}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weekly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(weekly.revenue)}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.pendingOrders}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Message */}
      {!hasData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">No Analytics Data Yet</h3>
          <p className="text-blue-700">
            Analytics data will automatically appear here once users start interacting with your site.
            All metrics currently show zero as the platform is not yet operational.
          </p>
        </div>
      )}
    </div>
  );
}

export default AnalyticsManager;