
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClusterOverview } from './ClusterOverview';
import { DrilldownPanel } from './DrilldownPanel';
import { TrendChart } from './TrendChart';
import { ExportPanel } from './ExportPanel';
import { generateMockData, processFailureClusters } from '../utils/dataProcessor';
import { FailureLog, ProcessedCluster } from '../types/copilot';
import { AlertTriangle, TrendingUp, Database, Download } from 'lucide-react';

const CopilotDashboard = () => {
  const [failureLogs, setFailureLogs] = useState<FailureLog[]>([]);
  const [clusters, setClusters] = useState<ProcessedCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ProcessedCluster | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [rootCauseFilter, setRootCauseFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    const mockData = generateMockData();
    setFailureLogs(mockData);
    
    // Process clusters
    const processedClusters = processFailureClusters(mockData);
    setClusters(processedClusters);
    setLoading(false);
  }, []);

  const filteredClusters = clusters.filter(cluster => 
    rootCauseFilter === 'all' || cluster.rootCause.category === rootCauseFilter
  );

  const totalFailures = failureLogs.length;
  const uniqueSkills = new Set(failureLogs.map(log => log.skillName)).size;
  const criticalClusters = clusters.filter(c => c.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Microsoft Entra Copilot Failure Analysis
              </h1>
              <p className="text-slate-600">
                Intelligent clustering and root cause analysis for Copilot performance optimization
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rootCauseFilter} onValueChange={setRootCauseFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by cause" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Causes</SelectItem>
                  <SelectItem value="grounding">Grounding Issues</SelectItem>
                  <SelectItem value="skill">Skill Misuse</SelectItem>
                  <SelectItem value="api">API Problems</SelectItem>
                  <SelectItem value="timeout">Timeouts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Failures</p>
                  <p className="text-2xl font-bold">{totalFailures.toLocaleString()}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Critical Clusters</p>
                  <p className="text-2xl font-bold">{criticalClusters}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Affected Skills</p>
                  <p className="text-2xl font-bold">{uniqueSkills}</p>
                </div>
                <Database className="h-8 w-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Clusters Found</p>
                  <p className="text-2xl font-bold">{clusters.length}</p>
                </div>
                <Download className="h-8 w-8 text-green-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview">Cluster Overview</TabsTrigger>
            <TabsTrigger value="drilldown">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
            <TabsTrigger value="export">Export & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ClusterOverview 
              clusters={filteredClusters}
              onClusterSelect={setSelectedCluster}
              selectedCluster={selectedCluster}
            />
          </TabsContent>

          <TabsContent value="drilldown">
            <DrilldownPanel 
              cluster={selectedCluster}
              onBack={() => setSelectedCluster(null)}
            />
          </TabsContent>

          <TabsContent value="trends">
            <TrendChart 
              clusters={clusters}
              timeRange={timeRange}
            />
          </TabsContent>

          <TabsContent value="export">
            <ExportPanel 
              clusters={clusters}
              failureLogs={failureLogs}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CopilotDashboard;
