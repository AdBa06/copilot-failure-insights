import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, ScatterChart, Scatter, FunnelChart, Funnel, LabelList } from 'recharts';
import { ProcessedCluster } from '../types/copilot';
import { TrendingUp, Clock, AlertTriangle, Users, Zap, Activity, Filter, Eye, MousePointer } from 'lucide-react';

interface TrendChartProps {
  clusters: ProcessedCluster[];
  timeRange: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ clusters, timeRange }) => {
  const [activeTab, setActiveTab] = useState('performance');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [heatmapView, setHeatmapView] = useState<'failures' | 'rate'>('failures');
  const [hoveredCell, setHoveredCell] = useState<any>(null);

  // Helper function for deterministic "random" values based on seed
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Enhanced Interactive Heatmap Data (stable values)
  const generateInteractiveHeatmap = () => {
    const skills = [...new Set(clusters.flatMap(c => c.affectedSkills))];
    const timeSlots = [
      { hour: 6, label: '6AM' },
      { hour: 8, label: '8AM' },
      { hour: 10, label: '10AM' },
      { hour: 12, label: '12PM' },
      { hour: 14, label: '2PM' },
      { hour: 16, label: '4PM' },
      { hour: 18, label: '6PM' },
      { hour: 20, label: '8PM' }
    ];
    
    return skills.slice(0, 6).map((skill, skillIndex) => {
      const skillClusters = clusters.filter(c => c.affectedSkills.includes(skill));
      const baseFailures = skillClusters.reduce((sum, c) => sum + c.failureCount, 0);
      
      return {
        skill: skill.replace(/([A-Z])/g, ' $1').trim(),
        originalSkill: skill,
        data: timeSlots.map((slot, timeIndex) => {
          // Use deterministic values based on skill and time slot
          const seed = (skillIndex * 100) + (timeIndex * 10) + slot.hour;
          const hourMultiplier = slot.hour >= 9 && slot.hour <= 17 ? 1.5 : 0.7;
          const variation = 0.8 + (seededRandom(seed) * 0.4); // Deterministic variation
          const failures = Math.floor((baseFailures / 8) * hourMultiplier * variation);
          const requestMultiplier = 15 + (seededRandom(seed + 1) * 25); // 15-40 range
          const totalRequests = failures * requestMultiplier;
          const errorRate = ((failures / totalRequests) * 100);
          
          return {
            time: slot.label,
            hour: slot.hour,
            failures: Math.max(1, failures),
            errorRate: Math.max(0.1, errorRate),
            totalRequests: Math.floor(totalRequests),
            resolved: Math.floor(failures * 0.7),
            avgResolutionTime: Math.floor(15 + (seededRandom(seed + 2) * 45)) // 15-60 min range
          };
        })
      };
    });
  };

  // Real User Journey with Drop-offs
  const generateRealUserJourney = () => {
    const baseUsers = 10000;
    const journeySteps = [
      { 
        stage: 'Copilot Invoked', 
        count: baseUsers, 
        dropoff: 0,
        issues: ['Initial load failures', 'Authentication timeouts']
      },
      { 
        stage: 'Intent Recognized', 
        count: Math.floor(baseUsers * 0.92), 
        dropoff: 8,
        issues: ['NLU parsing errors', 'Ambiguous queries']
      },
      { 
        stage: 'Context Retrieved', 
        count: Math.floor(baseUsers * 0.85), 
        dropoff: 7,
        issues: ['Graph API timeouts', 'Permission errors']
      },
      { 
        stage: 'Skill Executed', 
        count: Math.floor(baseUsers * 0.78), 
        dropoff: 7,
        issues: ['Skill-specific failures', 'External service errors']
      },
      { 
        stage: 'Response Generated', 
        count: Math.floor(baseUsers * 0.72), 
        dropoff: 6,
        issues: ['LLM generation errors', 'Token limits']
      },
      { 
        stage: 'User Satisfied', 
        count: Math.floor(baseUsers * 0.68), 
        dropoff: 4,
        issues: ['Incorrect results', 'Incomplete responses']
      }
    ];

         return journeySteps.map((step, index) => {
       const rate = Math.round((step.count / baseUsers) * 100);
       return {
         ...step,
         rate,
         conversionFromPrevious: index === 0 ? 100 : Math.round((step.count / journeySteps[index - 1].count) * 100),
         color: rate > 80 ? '#10b981' : rate > 60 ? '#f59e0b' : '#ef4444'
       };
     });
  };

  // Performance Impact Matrix
  const generatePerformanceMatrix = () => {
    return clusters.map((cluster, index) => {
      const seed = cluster.failureCount + index;
      return {
        name: cluster.name.split(' - ')[0],
        severity: cluster.severity === 'critical' ? 4 : cluster.severity === 'high' ? 3 : cluster.severity === 'medium' ? 2 : 1,
        frequency: cluster.failureCount,
        users: Math.floor(cluster.failureCount * (0.5 + seededRandom(seed) * 0.5)),
        category: cluster.rootCause.category,
        businessImpact: cluster.severity === 'critical' ? 'High' : cluster.severity === 'high' ? 'Medium' : 'Low',
        mttr: Math.floor(seededRandom(seed + 1) * 180) + 30, // minutes
        cost: Math.floor(cluster.failureCount * (50 + seededRandom(seed + 2) * 200)) // estimated cost
      };
    });
  };

  // Skill Health Scorecard
  const generateSkillHealth = () => {
    const skills = [...new Set(clusters.flatMap(c => c.affectedSkills))];
    return skills.slice(0, 8).map((skill, index) => {
      const skillClusters = clusters.filter(c => c.affectedSkills.includes(skill));
      const totalFailures = skillClusters.reduce((sum, c) => sum + c.failureCount, 0);
      const criticalIssues = skillClusters.filter(c => c.severity === 'critical').length;
      
      const healthScore = Math.max(0, 100 - (totalFailures * 0.2) - (criticalIssues * 10));
      const seed = totalFailures + index;
      
      return {
        skill: skill.replace(/([A-Z])/g, ' $1').trim(),
        healthScore: Math.round(healthScore),
        failures: totalFailures,
        criticalIssues,
        reliability: Math.round(95 - (totalFailures * 0.1)),
        uptime: Math.round(98 + seededRandom(seed) * 2),
        userSatisfaction: Math.round(80 + seededRandom(seed + 1) * 15),
        trend: totalFailures > 30 ? 'declining' : totalFailures < 10 ? 'improving' : 'stable'
      };
    }).sort((a, b) => b.healthScore - a.healthScore);
  };

  const heatmapData = useMemo(() => generateInteractiveHeatmap(), [clusters]);
  const userJourneyData = useMemo(() => {
    const data = generateRealUserJourney();
    console.log('User Journey Data:', data);
    return data;
  }, [clusters]);
  const performanceMatrix = useMemo(() => generatePerformanceMatrix(), [clusters]);
  const skillHealthData = useMemo(() => generateSkillHealth(), [clusters]);

  const filteredHeatmapData = selectedSkill === 'all' 
    ? heatmapData 
    : heatmapData.filter(item => item.originalSkill === selectedSkill);

  const getHeatmapIntensity = (value: number, max: number) => {
    return Math.min(1, value / max);
  };

  const getMaxValue = (type: 'failures' | 'rate') => {
    if (type === 'failures') {
      return Math.max(...heatmapData.flatMap(skill => skill.data.map(d => d.failures)));
    }
    return Math.max(...heatmapData.flatMap(skill => skill.data.map(d => d.errorRate)));
  };

  const maxFailures = getMaxValue('failures');
  const maxErrorRate = getMaxValue('rate');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Interactive Analytics</h2>
        </div>
        <div className="text-sm text-gray-500">
          Showing data for {timeRange} • Click elements to explore
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">🔥 Heat Analysis</TabsTrigger>
          <TabsTrigger value="journey">🛤️ User Journey</TabsTrigger>
          <TabsTrigger value="impact">📊 Impact Matrix</TabsTrigger>
          <TabsTrigger value="health">❤️ Skill Health</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Enhanced Interactive Heatmap */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Interactive Skill Performance Heatmap
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Skills</SelectItem>
                      {heatmapData.map(skill => (
                        <SelectItem key={skill.originalSkill} value={skill.originalSkill}>
                          {skill.skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={heatmapView} onValueChange={(value: 'failures' | 'rate') => setHeatmapView(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="failures">Failures</SelectItem>
                      <SelectItem value="rate">Error Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-sm text-gray-600">
                  {heatmapView === 'failures' ? 'Failure count' : 'Error rate (%)'} by skill and time of day • Click cells for details
                </div>
                
                {filteredHeatmapData.map((skillData) => (
                  <div key={skillData.skill} className="space-y-3">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {skillData.skill}
                      <Badge variant="outline">
                        {skillData.data.reduce((sum, d) => sum + d.failures, 0)} total failures
                      </Badge>
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                      {skillData.data.map((timeData) => {
                        const value = heatmapView === 'failures' ? timeData.failures : timeData.errorRate;
                        const maxValue = heatmapView === 'failures' ? maxFailures : maxErrorRate;
                        const intensity = getHeatmapIntensity(value, maxValue);
                        
                        return (
                          <div
                            key={`${skillData.skill}-${timeData.time}`}
                            className="relative h-16 rounded-lg flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-blue-300"
                            style={{
                              backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                              color: intensity > 0.5 ? 'white' : 'black'
                            }}
                            onClick={() => setHoveredCell({ skill: skillData.skill, time: timeData.time, data: timeData })}
                            onMouseEnter={() => setHoveredCell({ skill: skillData.skill, time: timeData.time, data: timeData })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <div className="font-bold text-sm">
                              {heatmapView === 'failures' ? timeData.failures : `${timeData.errorRate.toFixed(1)}%`}
                            </div>
                            <div className="text-[10px] opacity-80">
                              {timeData.time}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Intensity:</span>
                    <div className="flex items-center gap-1">
                      {[0.1, 0.3, 0.5, 0.7, 0.9].map(intensity => (
                        <div
                          key={intensity}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: `rgba(239, 68, 68, ${intensity})` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">Low → High</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    💡 Click cells to see detailed breakdown
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Cell Info */}
          {hoveredCell && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {hoveredCell.skill} at {hoveredCell.time}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{hoveredCell.data.failures}</div>
                    <div className="text-sm text-gray-600">Failures</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{hoveredCell.data.errorRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{hoveredCell.data.resolved}</div>
                    <div className="text-sm text-gray-600">Resolved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{hoveredCell.data.avgResolutionTime}min</div>
                    <div className="text-sm text-gray-600">Avg Resolution</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          {/* Real User Journey with Drop-offs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Journey Drop-off Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Journey Funnel */}
                <div className="mb-4 text-sm text-gray-600">
                  Drop-off analysis showing where users encounter issues (total sample: 10,000 users)
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={userJourneyData} 
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                      <YAxis dataKey="stage" type="category" width={120} />
                      <Tooltip 
                        formatter={(value: number, name) => [
                          `${value.toLocaleString()} users (${((value / 10000) * 100).toFixed(1)}%)`,
                          'Users'
                        ]}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Drop-off Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userJourneyData.map((step, index) => (
                    <div key={step.stage} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{step.stage}</div>
                        <Badge style={{ backgroundColor: step.color, color: 'white' }}>
                          {step.rate}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">{step.count.toLocaleString()}</div>
                        {index > 0 && (
                          <div className="text-sm text-red-600">
                            -{step.dropoff}% drop-off ({(userJourneyData[index-1].count - step.count).toLocaleString()} users)
                          </div>
                        )}
                        <div className="text-xs text-gray-600">
                          <div className="font-medium mb-1">Common Issues:</div>
                          <ul className="space-y-1">
                            {step.issues.map(issue => (
                              <li key={issue} className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          {/* Business Impact Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Business Impact vs Technical Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={performanceMatrix}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="frequency" name="Frequency" />
                    <YAxis dataKey="severity" name="Severity" domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return [
                          [`Failures: ${data.frequency}`, ''],
                          [`Severity: ${data.severity}/4`, ''],
                          [`Users Affected: ${data.users}`, ''],
                          [`Business Impact: ${data.businessImpact}`, ''],
                          [`Est. Cost: $${data.cost}`, '']
                        ];
                      }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.name || 'Issue'}
                    />
                    <Scatter dataKey="users" fill="#ef4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="font-medium text-red-700">🚨 Critical Priority</div>
                  <div className="text-gray-600">High Impact + High Frequency</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="font-medium text-orange-700">⚡ Quick Wins</div>
                  <div className="text-gray-600">Low Impact + High Frequency</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="font-medium text-yellow-700">👀 Monitor</div>
                  <div className="text-gray-600">High Impact + Low Frequency</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="font-medium text-green-700">✅ Low Priority</div>
                  <div className="text-gray-600">Low Impact + Low Frequency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {/* Skill Health Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Health Scorecard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillHealthData.map((skill, index) => (
                  <div key={skill.skill} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          skill.healthScore > 90 ? 'bg-green-100 text-green-700' : 
                          skill.healthScore > 70 ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{skill.skill}</div>
                          <div className="text-sm text-gray-600">
                            {skill.failures} failures • {skill.criticalIssues} critical • 
                            <span className={`ml-1 ${
                              skill.trend === 'improving' ? 'text-green-600' : 
                              skill.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {skill.trend === 'improving' ? '📈' : skill.trend === 'declining' ? '📉' : '➖'} {skill.trend}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className={`text-xl font-bold ${
                            skill.healthScore > 90 ? 'text-green-600' : 
                            skill.healthScore > 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {skill.healthScore}
                          </div>
                          <div className="text-xs text-gray-500">Health</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-blue-600">{skill.reliability}%</div>
                          <div className="text-xs text-gray-500">Reliability</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-600">{skill.uptime}%</div>
                          <div className="text-xs text-gray-500">Uptime</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-purple-600">{skill.userSatisfaction}%</div>
                          <div className="text-xs text-gray-500">Satisfaction</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
