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
import { AlertTriangle, TrendingUp, Database, Download, RefreshCw, Filter, Settings, AlertCircle, CheckCircle, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] to-[#e6f2ff]">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-[#e1e9f2] p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-[#0078d4]">EntraLens</h1>
              <p className="text-[#616161] mt-1">Failure Analysis Dashboard</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="border-[#0078d4] text-[#0078d4] hover:bg-[#0078d4] hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="bg-[#0078d4] hover:bg-[#106ebe]">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#0078d4]/10 to-[#0078d4]/5 rounded-lg p-4 border border-[#e1e9f2]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#616161]">Total Failures</p>
                  <h3 className="text-2xl font-semibold text-[#0078d4]">{totalFailures.toLocaleString()}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0078d4]/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[#0078d4]" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#107c10]/10 to-[#107c10]/5 rounded-lg p-4 border border-[#e1e9f2]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#616161]">Resolved</p>
                  <h3 className="text-2xl font-semibold text-[#107c10]">{clusters.filter(c => c.resolved).length}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#107c10]/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#107c10]" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#d13438]/10 to-[#d13438]/5 rounded-lg p-4 border border-[#e1e9f2]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#616161]">Critical</p>
                  <h3 className="text-2xl font-semibold text-[#d13438]">{criticalClusters}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#d13438]/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#d13438]" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0078d4]/10 to-[#0078d4]/5 rounded-lg p-4 border border-[#e1e9f2]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#616161]">Active Clusters</p>
                  <h3 className="text-2xl font-semibold text-[#0078d4]">{clusters.length}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0078d4]/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[#0078d4]" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-[#e1e9f2] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#323130]">Failure Clusters</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-[#0078d4] text-[#0078d4] hover:bg-[#0078d4] hover:text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="border-[#0078d4] text-[#0078d4] hover:bg-[#0078d4] hover:text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
                <ClusterOverview 
                  clusters={filteredClusters}
                  onClusterSelect={setSelectedCluster}
                  selectedCluster={selectedCluster}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-[#e1e9f2] p-6">
                <h2 className="text-xl font-semibold text-[#323130] mb-4">Trend Analysis</h2>
                <TrendChart clusters={clusters} timeRange={timeRange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0078d4]">Cluster Details</DialogTitle>
          </DialogHeader>
          {selectedCluster && <DrilldownPanel cluster={selectedCluster} onBack={() => setSelectedCluster(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CopilotDashboard;
