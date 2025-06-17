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
import { AlertTriangle, TrendingUp, Database, Download, RefreshCw, Filter, Settings, AlertCircle, CheckCircle, Layers, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CopilotDashboard = () => {
  const [failureLogs, setFailureLogs] = useState<FailureLog[]>([]);
  const [clusters, setClusters] = useState<ProcessedCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ProcessedCluster | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [rootCauseFilter, setRootCauseFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    // Initialize with mock data
    const mockData = generateMockData();
    setFailureLogs(mockData);
    
    // Process clusters with current threshold
    const processedClusters = processFailureClusters(mockData, clusterThreshold[0]);
    setClusters(processedClusters);
    setLoading(false);
  }, [clusterThreshold]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      // Refresh data
      const mockData = generateMockData();
      setFailureLogs(mockData);
      const processedClusters = processFailureClusters(mockData, clusterThreshold[0]);
      setClusters(processedClusters);
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, clusterThreshold]);

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

  const handleRefresh = () => {
    setLoading(true);
    // Simulate loading time for better UX
    setTimeout(() => {
      const mockData = generateMockData();
      setFailureLogs(mockData);
      const processedClusters = processFailureClusters(mockData, clusterThreshold[0]);
      setClusters(processedClusters);
      setLoading(false);
    }, 500);
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[#0078d4] text-[#0078d4] hover:bg-[#0078d4] hover:text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export to PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                className="bg-[#0078d4] hover:bg-[#106ebe]"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-[#0078d4] text-[#0078d4] hover:bg-[#0078d4] hover:text-white"
                      onClick={() => setShowFilterDialog(true)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-[#0078d4] text-[#0078d4] hover:bg-[#0078d4] hover:text-white"
                      onClick={() => setShowSettingsDialog(true)}
                    >
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

      {/* Cluster Details Dialog */}
      <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0078d4]">Cluster Details</DialogTitle>
          </DialogHeader>
          {selectedCluster && <DrilldownPanel cluster={selectedCluster} onBack={() => setSelectedCluster(null)} />}
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0078d4]">Filter Clusters</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Severity Filter */}
            <div>
              <Label className="text-base font-medium">Severity Levels</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {Object.entries(severityFilters).map(([severity, checked]) => (
                  <div key={severity} className="flex items-center space-x-2">
                    <Checkbox
                      id={severity}
                      checked={checked}
                      onCheckedChange={(checked) =>
                        setSeverityFilters(prev => ({
                          ...prev,
                          [severity]: checked as boolean
                        }))
                      }
                    />
                    <Label htmlFor={severity} className="capitalize">
                      {severity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause Filter */}
            <div>
              <Label className="text-base font-medium">Root Cause</Label>
              <Select value={rootCauseFilter} onValueChange={setRootCauseFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="grounding">Grounding Issues</SelectItem>
                  <SelectItem value="timeout">Timeout Errors</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="input">Input Validation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-base font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="resolved">Resolved Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Failure Count Range */}
            <div>
              <Label className="text-base font-medium">Failure Count Range</Label>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-sm">Minimum: {minFailureCount[0]}</Label>
                  <Slider
                    value={minFailureCount}
                    onValueChange={setMinFailureCount}
                    max={100}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Maximum: {maxFailureCount[0]}</Label>
                  <Slider
                    value={maxFailureCount}
                    onValueChange={setMaxFailureCount}
                    max={1000}
                    min={10}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0078d4]">Dashboard Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Auto Refresh */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoRefresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={(checked) => setAutoRefreshEnabled(!!checked)}
                />
                <Label htmlFor="autoRefresh" className="text-base font-medium">
                  Enable Auto Refresh
                </Label>
              </div>
              
              {autoRefreshEnabled && (
                <div>
                  <Label className="text-sm">Refresh Interval: {refreshInterval} seconds</Label>
                  <Slider
                    value={[refreshInterval]}
                    onValueChange={(value) => setRefreshInterval(value[0])}
                    max={300}
                    min={10}
                    step={10}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Cluster Threshold */}
            <div>
              <Label className="text-base font-medium">Cluster Threshold</Label>
              <p className="text-sm text-gray-600 mt-1">
                Minimum number of failures required to form a cluster
              </p>
              <div className="mt-2">
                <Label className="text-sm">Threshold: {clusterThreshold[0]} failures</Label>
                <Slider
                  value={clusterThreshold}
                  onValueChange={setClusterThreshold}
                  max={20}
                  min={2}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Time Range Default */}
            <div>
              <Label className="text-base font-medium">Default Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CopilotDashboard;
