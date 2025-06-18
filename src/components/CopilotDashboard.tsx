import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ClusterOverview } from './ClusterOverview';
import { DrilldownPanel } from './DrilldownPanel';
import { TrendChart } from './TrendChart';
import { ExportPanel } from './ExportPanel';
import { generateMockData, processFailureClusters } from '../utils/dataProcessor';
import { FailureLog, ProcessedCluster } from '../types/copilot';
import { AlertTriangle, TrendingUp, Database, Download, RefreshCw, Filter, Settings, AlertCircle, CheckCircle, Layers, FileText, FileSpreadsheet, ChevronDown, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { mcpClient, MCPAnalyticsData } from '../services/mcpClient';

const CopilotDashboard = () => {
  const [failureLogs, setFailureLogs] = useState<FailureLog[]>([]);
  const [clusters, setClusters] = useState<ProcessedCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ProcessedCluster | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [rootCauseFilter, setRootCauseFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mcpConnected, setMcpConnected] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<MCPAnalyticsData | null>(null);
  
  // New state for filter and settings dialogs
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // Filter states
  const [severityFilters, setSeverityFilters] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true
  });
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'active', 'resolved'
  const [minFailureCount, setMinFailureCount] = useState([1]);
  const [maxFailureCount, setMaxFailureCount] = useState([1000]);
  
  // Settings states
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [clusterThreshold, setClusterThreshold] = useState([3]);

  // Check MCP connection status
  useEffect(() => {
    const checkConnection = () => {
      setMcpConnected(mcpClient.isServerConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data from MCP server
  useEffect(() => {
    if (mcpConnected) {
      loadAnalyticsData();
    }
  }, [mcpConnected]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled || !mcpConnected) return;
    
    const interval = setInterval(() => {
      loadAnalyticsData(true);
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, mcpConnected]);

  const loadAnalyticsData = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await mcpClient.getFailureAnalytics(refresh);
      setAnalyticsData(data);
      setClusters(data.clusters);
      setFailureLogs(data.failureLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClusters = clusters.filter(cluster => {
    // Root cause filter
    if (rootCauseFilter !== 'all' && cluster.rootCause.category !== rootCauseFilter) {
      return false;
    }
    
    // Severity filter
    if (!severityFilters[cluster.severity as keyof typeof severityFilters]) {
      return false;
    }
    
    // Status filter
    if (statusFilter === 'active' && cluster.resolved) return false;
    if (statusFilter === 'resolved' && !cluster.resolved) return false;
    
    // Failure count filter
    if (cluster.failureCount < minFailureCount[0] || cluster.failureCount > maxFailureCount[0]) {
      return false;
    }
    
    return true;
  });

  const handleApplyFilters = () => {
    setShowFilterDialog(false);
  };

  const handleResetFilters = () => {
    setSeverityFilters({ critical: true, high: true, medium: true, low: true });
    setRootCauseFilter('all');
    setStatusFilter('all');
    setMinFailureCount([1]);
    setMaxFailureCount([1000]);
  };

  const handleSaveSettings = () => {
    setShowSettingsDialog(false);
    // Settings are applied in real-time via state changes
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData(true);
    setRefreshing(false);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Clusters summary sheet
    const clustersData = filteredClusters.map(cluster => ({
      'Cluster Name': cluster.name,
      'Failure Count': cluster.failureCount,
      'Severity': cluster.severity,
      'Root Cause': cluster.rootCause.category,
      'Description': cluster.rootCause.description,
      'Status': cluster.resolved ? 'Resolved' : 'Active',
      'Affected Skills': cluster.affectedSkills.join(', '),
      'First Seen': cluster.firstSeen.toISOString().split('T')[0],
      'Last Seen': cluster.lastSeen.toISOString().split('T')[0],
      'Trend': cluster.trend,
      'Primary Recommendation': cluster.recommendations[0] || 'N/A'
    }));
    
    const clustersSheet = XLSX.utils.json_to_sheet(clustersData);
    XLSX.utils.book_append_sheet(workbook, clustersSheet, 'Clusters Summary');
    
    // Detailed failures sheet (sample)
    const failuresData = failureLogs.slice(0, 1000).map(log => ({
      'Timestamp': log.timestamp.toISOString(),
      'Skill Name': log.skillName,
      'User ID': log.userId || 'N/A',
      'Evaluation ID': log.evaluationId,
      'Session ID': log.sessionId,
      'Exception': log.exception,
      'Error Code': log.errorCode || 'N/A',
      'Prompt': log.prompt.substring(0, 100) + '...', // Truncate for Excel
      'Context Missing': log.contextMissing?.join(', ') || 'None'
    }));
    
    const failuresSheet = XLSX.utils.json_to_sheet(failuresData);
    XLSX.utils.book_append_sheet(workbook, failuresSheet, 'Failure Details');
    
    // Statistics sheet
    const statsData = [
      { Metric: 'Total Failures', Value: failureLogs.length },
      { Metric: 'Total Clusters', Value: clusters.length },
      { Metric: 'Critical Issues', Value: clusters.filter(c => c.severity === 'critical').length },
      { Metric: 'Resolved Issues', Value: clusters.filter(c => c.resolved).length },
      { Metric: 'Active Issues', Value: clusters.filter(c => !c.resolved).length },
      { Metric: 'Unique Skills', Value: new Set(failureLogs.map(log => log.skillName)).size }
    ];
    
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
    
    // Save the file
    XLSX.writeFile(workbook, `EntraLens_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('EntraLens - Failure Analysis Report', 20, 20);
    
    // Add generation date
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add summary statistics
    pdf.setFontSize(14);
    pdf.text('Executive Summary', 20, 45);
    pdf.setFontSize(10);
    pdf.text(`Total Failures: ${failureLogs.length}`, 20, 55);
    pdf.text(`Total Clusters: ${clusters.length}`, 20, 65);
    pdf.text(`Critical Issues: ${clusters.filter(c => c.severity === 'critical').length}`, 20, 75);
    pdf.text(`Resolved Issues: ${clusters.filter(c => c.resolved).length}`, 20, 85);
    
    // Add clusters table
    let yPosition = 100;
    pdf.setFontSize(14);
    pdf.text('Top Failure Clusters', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(8);
    const tableHeaders = ['Cluster Name', 'Failures', 'Severity', 'Root Cause', 'Status'];
    const tableData = filteredClusters.slice(0, 15).map(cluster => [
      cluster.name.substring(0, 30),
      cluster.failureCount.toString(),
      cluster.severity,
      cluster.rootCause.category,
      cluster.resolved ? 'Resolved' : 'Active'
    ]);
    
    // Simple table layout
    const colWidths = [80, 20, 25, 30, 25];
    let xPosition = 20;
    
    // Headers
    tableHeaders.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 10;
    
    // Data rows
    tableData.forEach(row => {
      xPosition = 20;
      row.forEach((cell, index) => {
        pdf.text(cell, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 8;
      
      // Add new page if needed
      if (yPosition > 190) {
        pdf.addPage();
        yPosition = 20;
      }
    });
    
    // Save the PDF
    pdf.save(`EntraLens_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalFailures = failureLogs.length;
  const uniqueSkills = new Set(failureLogs.map(log => log.skillName)).size;
  const criticalClusters = clusters.filter(c => c.severity === 'critical').length;

  if (loading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-lg font-semibold">Loading Copilot Analytics</p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  {mcpConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span>Connected to MCP Server</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-orange-500" />
                      <span>Connecting to MCP Server...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with MCP Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Microsoft Entra Copilot
            </h1>
            <p className="text-slate-600 text-lg">Failure Analysis Dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* MCP Connection Status */}
            <div className="flex items-center gap-2">
              {mcpConnected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    MCP Connected
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    MCP Connecting...
                  </Badge>
                </>
              )}
            </div>

            {/* Last Updated */}
            {analyticsData && (
              <div className="text-sm text-slate-600">
                Last updated: {new Date(analyticsData.lastUpdated).toLocaleTimeString()}
              </div>
            )}

            {/* Refresh Button */}
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing || !mcpConnected}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Stats Cards with MCP Data */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Failures (MCP)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsData.totalFailures.toLocaleString()}</div>
                <p className="text-blue-200 text-sm mt-1">Analyzed from server</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-100">Critical Clusters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsData.criticalClusters}</div>
                <p className="text-red-200 text-sm mt-1">Require immediate attention</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Resolved Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analyticsData.resolvedClusters}</div>
                <p className="text-green-200 text-sm mt-1">Successfully addressed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Total Clusters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{clusters.length}</div>
                <p className="text-purple-200 text-sm mt-1">Identified patterns</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="clusters" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clusters">Cluster Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trend Analytics</TabsTrigger>
            <TabsTrigger value="export">Export & Reports</TabsTrigger>
            <TabsTrigger value="mcp-insights">MCP Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="clusters" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ClusterOverview 
                  clusters={filteredClusters} 
                  onClusterSelect={setSelectedCluster}
                  selectedCluster={selectedCluster}
                />
              </div>
              <div>
                <DrilldownPanel 
                  cluster={selectedCluster} 
                  onBack={() => setSelectedCluster(null)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <TrendChart clusters={clusters} timeRange="7d" />
          </TabsContent>

          <TabsContent value="export">
            <ExportPanel clusters={clusters} failureLogs={failureLogs} />
          </TabsContent>

          {/* New MCP Insights Tab */}
          <TabsContent value="mcp-insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  MCP Server Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Connection Details</h4>
                    <div className="text-sm space-y-1">
                      <p>Status: <Badge variant={mcpConnected ? 'default' : 'secondary'}>
                        {mcpClient.getConnectionStatus()}
                      </Badge></p>
                      <p>Data Source: MCP Server v1.0.0</p>
                      <p>Protocol: Model Context Protocol</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Server Capabilities</h4>
                    <div className="text-sm space-y-1">
                      <p>✅ Real-time failure analytics</p>
                      <p>✅ AI-powered recommendations</p>
                      <p>✅ Trend analysis</p>
                      <p>🔄 Ready for Kusto integration</p>
                    </div>
                  </div>
                </div>

                {analyticsData && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>MCP Enhancement Active:</strong> Data is now flowing through the Model Context Protocol server, 
                      enabling enhanced AI analysis, real-time updates, and future integration with Azure Data Explorer (Kusto).
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
                 </Tabs>
      </div>
    </div>
  );
};

export default CopilotDashboard;
