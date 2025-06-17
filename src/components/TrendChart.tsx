import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, ScatterChart, Scatter, Treemap } from 'recharts';
import { ProcessedCluster } from '../types/copilot';
import { TrendingUp, Clock, AlertTriangle, Users, Zap, Activity } from 'lucide-react';

interface TrendChartProps {
  clusters: ProcessedCluster[];
  timeRange: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ clusters, timeRange }) => {
  const [activeTab, setActiveTab] = useState('performance');

  // Skill Performance Heatmap Data
  const generateSkillHeatmap = () => {
    const skills = [...new Set(clusters.flatMap(c => c.affectedSkills))];
    const timeSlots = ['6-8AM', '8-10AM', '10-12PM', '12-2PM', '2-4PM', '4-6PM', '6-8PM', '8-10PM'];
    
    return skills.slice(0, 8).map(skill => {
      return {
        skill: skill.replace(/([A-Z])/g, ' $1').trim(),
        data: timeSlots.map(slot => ({
          time: slot,
          failures: Math.floor(Math.random() * 50) + 5,
          errorRate: (Math.random() * 15 + 2).toFixed(1)
        }))
      };
    });
  };

  // Failure Journey Funnel
  const generateFailureJourney = () => {
    const totalRequests = 10000;
    return [
      { stage: 'Total Requests', count: totalRequests, rate: 100 },
      { stage: 'Skill Invoked', count: 8500, rate: 85 },
      { stage: 'Context Loaded', count: 7200, rate: 72 },
      { stage: 'API Called', count: 6800, rate: 68 },
      { stage: 'Response Generated', count: 6200, rate: 62 },
      { stage: 'Success', count: 5800, rate: 58 },
    ];
  };

  // Root Cause vs Impact Matrix
  const generateImpactMatrix = () => {
    return clusters.map(cluster => ({
      name: cluster.name.split(' - ')[0],
      severity: cluster.severity === 'critical' ? 4 : cluster.severity === 'high' ? 3 : cluster.severity === 'medium' ? 2 : 1,
      frequency: cluster.failureCount,
      users: Math.floor(cluster.failureCount * 0.7),
      category: cluster.rootCause.category,
      ttd: Math.floor(Math.random() * 60) + 5, // Time to detection (minutes)
      ttr: Math.floor(Math.random() * 240) + 30, // Time to resolution (minutes)
    }));
  };

  // Skill Reliability Score
  const generateSkillReliability = () => {
    const skills = [...new Set(clusters.flatMap(c => c.affectedSkills))];
    return skills.slice(0, 10).map(skill => {
      const skillClusters = clusters.filter(c => c.affectedSkills.includes(skill));
      const totalFailures = skillClusters.reduce((sum, c) => sum + c.failureCount, 0);
      const avgSeverity = skillClusters.reduce((sum, c) => {
        const score = c.severity === 'critical' ? 4 : c.severity === 'high' ? 3 : c.severity === 'medium' ? 2 : 1;
        return sum + score;
      }, 0) / skillClusters.length;
      
      const reliability = Math.max(0, 100 - (totalFailures * 0.1) - (avgSeverity * 5));
      
      return {
        skill: skill.replace(/([A-Z])/g, ' $1').trim(),
        reliability: Math.round(reliability),
        failures: totalFailures,
        mttr: Math.floor(Math.random() * 180) + 20, // Mean time to resolution
        sla: reliability > 95 ? 'Excellent' : reliability > 85 ? 'Good' : reliability > 70 ? 'Fair' : 'Poor'
      };
    }).sort((a, b) => b.reliability - a.reliability);
  };

  // Tenant Health Overview
  const generateTenantHealth = () => {
    const tenants = ['Enterprise-A', 'Enterprise-B', 'SMB-Corp', 'StartUp-X', 'Gov-Agency', 'Healthcare-Y'];
    return tenants.map(tenant => {
      const health = Math.random() * 100;
      const failures = Math.floor(Math.random() * 200) + 10;
      return {
        tenant,
        health: Math.round(health),
        failures,
        users: Math.floor(Math.random() * 1000) + 50,
        status: health > 90 ? 'Healthy' : health > 70 ? 'Warning' : 'Critical',
        color: health > 90 ? '#10b981' : health > 70 ? '#f59e0b' : '#ef4444'
      };
    });
  };

  const skillHeatmapData = generateSkillHeatmap();
  const failureJourneyData = generateFailureJourney();
  const impactMatrixData = generateImpactMatrix();
  const skillReliabilityData = generateSkillReliability();
  const tenantHealthData = generateTenantHealth();

  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#84cc16', '#f97316', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Deep Analytics</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="health">Tenant Health</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Skill Performance Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Skill Performance Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">Failure frequency by skill and time of day</div>
                {skillHeatmapData.map((skillData, skillIndex) => (
                  <div key={skillData.skill} className="space-y-2">
                    <div className="font-medium text-sm">{skillData.skill}</div>
                    <div className="grid grid-cols-8 gap-1">
                      {skillData.data.map((timeData, timeIndex) => {
                        const intensity = timeData.failures / 50; // Normalize to 0-1
                        return (
                          <div
                            key={timeData.time}
                            className="h-8 rounded flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                              color: intensity > 0.5 ? 'white' : 'black'
                            }}
                            title={`${timeData.time}: ${timeData.failures} failures (${timeData.errorRate}%)`}
                          >
                            {timeData.failures}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>6AM</span>
                  <span>10PM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Failure Journey Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Journey Failure Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={failureJourneyData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={120} />
                    <Tooltip formatter={(value, name) => [`${value} (${((value as number) / 10000 * 100).toFixed(1)}%)`, 'Count']} />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          {/* Severity vs Frequency Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Impact vs Frequency Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={impactMatrixData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="frequency" name="Frequency" />
                    <YAxis dataKey="severity" name="Severity" domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return [
                          [`Failures: ${data.frequency}`, 'Frequency'],
                          [`Severity: ${data.severity}/4`, 'Impact'],
                          [`Users: ${data.users}`, 'Affected'],
                          [`Category: ${data.category}`, 'Root Cause']
                        ];
                      }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.name || 'Cluster'}
                    />
                    <Scatter dataKey="users" fill="#ef4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">High Impact</div>
                  <div className="text-gray-600">High Severity + High Frequency</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Quick Wins</div>
                  <div className="text-gray-600">Low Severity + High Frequency</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Monitor</div>
                  <div className="text-gray-600">High Severity + Low Frequency</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Ignore</div>
                  <div className="text-gray-600">Low Severity + Low Frequency</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time to Detection vs Resolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Detection vs Resolution Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={impactMatrixData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ttd" name="Time to Detection (min)" />
                    <YAxis dataKey="ttr" name="Time to Resolution (min)" />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return [
                          [`Detection: ${data.ttd} min`, 'TTD'],
                          [`Resolution: ${data.ttr} min`, 'TTR'],
                          [`Category: ${data.category}`, 'Type']
                        ];
                      }}
                    />
                    <Scatter dataKey="frequency" fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-6">
          {/* Skill Reliability Scorecard */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Reliability Scorecard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillReliabilityData.map((skill, index) => (
                  <div key={skill.skill} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{skill.skill}</div>
                        <div className="text-sm text-gray-600">{skill.failures} failures • MTTR: {skill.mttr}min</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: skill.reliability > 95 ? '#10b981' : skill.reliability > 85 ? '#f59e0b' : '#ef4444' }}>
                          {skill.reliability}%
                        </div>
                        <Badge variant={skill.sla === 'Excellent' ? 'default' : skill.sla === 'Good' ? 'secondary' : 'destructive'}>
                          {skill.sla}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {/* Tenant Health Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Tenant Health Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenantHealthData.map((tenant) => (
                  <div key={tenant.tenant} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">{tenant.tenant}</div>
                      <Badge style={{ backgroundColor: tenant.color, color: 'white' }}>
                        {tenant.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Health Score</span>
                        <span className="font-medium">{tenant.health}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${tenant.health}%`, 
                            backgroundColor: tenant.color 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{tenant.failures} failures</span>
                        <span>{tenant.users} users</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tenant Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tenant Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tenantHealthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tenant" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="failures" fill="#ef4444" name="Failures" />
                    <Line yAxisId="right" type="monotone" dataKey="health" stroke="#10b981" strokeWidth={3} name="Health %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
