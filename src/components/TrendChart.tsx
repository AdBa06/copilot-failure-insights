
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ProcessedCluster } from '../types/copilot';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  clusters: ProcessedCluster[];
  timeRange: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ clusters, timeRange }) => {
  // Generate time series data for cluster evolution
  const generateTimeSeriesData = () => {
    const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayData: any = {
        date: date.toLocaleDateString(),
        timestamp: date.getTime()
      };
      
      clusters.slice(0, 5).forEach((cluster, index) => {
        // Simulate daily failure counts based on cluster trend
        const baseCount = Math.floor(cluster.failureCount / days);
        const variation = cluster.trend === 'increasing' ? i * 0.5 : 
                         cluster.trend === 'decreasing' ? (days - i) * 0.5 : 0;
        dayData[`cluster${index}`] = Math.max(0, Math.floor(baseCount + variation + Math.random() * 3));
      });
      
      data.push(dayData);
    }
    
    return data;
  };

  const timeSeriesData = generateTimeSeriesData();

  // Root cause distribution data
  const rootCauseData = clusters.reduce((acc, cluster) => {
    const category = cluster.rootCause.category;
    acc[category] = (acc[category] || 0) + cluster.failureCount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(rootCauseData).map(([category, count]) => ({
    name: category,
    value: count,
    percentage: Math.round((count / clusters.reduce((sum, c) => sum + c.failureCount, 0)) * 100)
  }));

  // Severity distribution data
  const severityData = clusters.reduce((acc, cluster) => {
    acc[cluster.severity] = (acc[cluster.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(severityData).map(([severity, count]) => ({
    severity,
    count,
    fill: severity === 'critical' ? '#ef4444' :
          severity === 'high' ? '#f97316' :
          severity === 'medium' ? '#eab308' : '#3b82f6'
  }));

  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Trend Analysis</h2>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Failure Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                {clusters.slice(0, 5).map((cluster, index) => (
                  <Line
                    key={cluster.id}
                    type="monotone"
                    dataKey={`cluster${index}`}
                    stroke={colors[index]}
                    strokeWidth={2}
                    name={cluster.name}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Root Cause Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Root Cause Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cluster Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Failing Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Most Affected Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clusters.slice(0, 10).map((cluster, index) => (
              <div key={cluster.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{cluster.name}</p>
                    <p className="text-sm text-slate-600">{cluster.affectedSkills.join(', ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{cluster.failureCount}</p>
                  <p className="text-xs text-slate-500">failures</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
