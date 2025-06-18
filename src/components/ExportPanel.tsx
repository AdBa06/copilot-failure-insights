
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProcessedCluster, FailureLog } from '../types/copilot';
import { Download, FileText, Share, Mail } from 'lucide-react';

interface ExportPanelProps {
  clusters: ProcessedCluster[];
  failureLogs: FailureLog[];
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ clusters, failureLogs }) => {
  const [exportFormat, setExportFormat] = useState('json');
  const [reportContent, setReportContent] = useState('');

  const generateExecutiveSummary = () => {
    const totalFailures = failureLogs.length;
    const criticalClusters = clusters.filter(c => c.severity === 'critical').length;
    const topRootCause = clusters.reduce((acc, cluster) => {
      acc[cluster.rootCause.category] = (acc[cluster.rootCause.category] || 0) + cluster.failureCount;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryCause = Object.entries(topRootCause).sort(([,a], [,b]) => b - a)[0];

    const summary = `
# Microsoft Entra Copilot Failure Analysis Report

## Executive Summary
- **Total Failures Analyzed**: ${totalFailures.toLocaleString()}
- **Clusters Identified**: ${clusters.length}
- **Critical Issues**: ${criticalClusters}
- **Primary Root Cause**: ${primaryCause ? primaryCause[0] : 'N/A'} (${primaryCause ? primaryCause[1] : 0} failures)

## Key Findings
${clusters.slice(0, 5).map((cluster, index) => `
### ${index + 1}. ${cluster.name}
- **Failures**: ${cluster.failureCount}
- **Root Cause**: ${cluster.rootCause.description}
- **Recommendation**: ${cluster.recommendations[0]}
- **Status**: ${cluster.resolved ? 'Resolved' : 'Active'}
`).join('')}

## Immediate Actions Required
${clusters.filter(c => c.severity === 'critical').map(cluster => `
- **${cluster.name}**: ${cluster.recommendations[0]}
`).join('')}

## Trends
- **Increasing Issues**: ${clusters.filter(c => c.trend === 'increasing').length} clusters
- **Stable Issues**: ${clusters.filter(c => c.trend === 'stable').length} clusters
- **Decreasing Issues**: ${clusters.filter(c => c.trend === 'decreasing').length} clusters

Generated on: ${new Date().toLocaleDateString()}
    `.trim();

    setReportContent(summary);
  };

  const exportData = (format: string) => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify({ clusters, failureLogs }, null, 2);
        filename = 'copilot-failure-analysis.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        const csvHeaders = ['Cluster Name', 'Failure Count', 'Severity', 'Root Cause', 'Status', 'First Seen', 'Last Seen'];
        const csvRows = clusters.map(cluster => [
          cluster.name,
          cluster.failureCount,
          cluster.severity,
          cluster.rootCause.category,
          cluster.resolved ? 'Resolved' : 'Active',
          cluster.firstSeen.toISOString(),
          cluster.lastSeen.toISOString()
        ]);
        content = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        filename = 'copilot-clusters.csv';
        mimeType = 'text/csv';
        break;
      case 'markdown':
        content = reportContent || 'Generate executive summary first';
        filename = 'copilot-analysis-report.md';
        mimeType = 'text/markdown';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sendEmailReport = () => {
    const totalFailures = failureLogs.length;
    const criticalClusters = clusters.filter(c => c.severity === 'critical').length;
    const resolvedClusters = clusters.filter(c => c.resolved).length;
    
    const topRootCause = clusters.reduce((acc, cluster) => {
      acc[cluster.rootCause.category] = (acc[cluster.rootCause.category] || 0) + cluster.failureCount;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryCause = Object.entries(topRootCause).sort(([,a], [,b]) => b - a)[0];

    const emailSubject = `Microsoft Entra Copilot Failure Analysis Report - ${new Date().toLocaleDateString()}`;
    
    const emailBody = `Microsoft Entra Copilot Failure Analysis Report
Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

EXECUTIVE SUMMARY
================
• Total Failures Analyzed: ${totalFailures.toLocaleString()}
• Clusters Identified: ${clusters.length}
• Critical Issues: ${criticalClusters}
• Resolved Issues: ${resolvedClusters}
• Primary Root Cause: ${primaryCause ? primaryCause[0] : 'N/A'} (${primaryCause ? primaryCause[1] : 0} failures)

TOP CRITICAL ISSUES
==================
${clusters.filter(c => c.severity === 'critical').slice(0, 5).map((cluster, index) => `
${index + 1}. ${cluster.name}
   • Failures: ${cluster.failureCount}
   • Root Cause: ${cluster.rootCause.description}
   • Recommendation: ${cluster.recommendations[0]}
   • Status: ${cluster.resolved ? 'Resolved' : 'Active'}
`).join('')}

IMMEDIATE ACTIONS REQUIRED
=========================
${clusters.filter(c => c.severity === 'critical' && !c.resolved).map(cluster => `
• ${cluster.name}: ${cluster.recommendations[0]}
`).join('')}

TREND ANALYSIS
==============
• Increasing Issues: ${clusters.filter(c => c.trend === 'increasing').length} clusters
• Stable Issues: ${clusters.filter(c => c.trend === 'stable').length} clusters
• Decreasing Issues: ${clusters.filter(c => c.trend === 'decreasing').length} clusters

For detailed analysis, please access the full dashboard at: ${window.location.href}

---
This report was generated automatically by the Microsoft Entra Copilot Failure Insights Dashboard.`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink, '_blank');
  };

  const shareLink = () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: 'Microsoft Entra Copilot Failure Analysis Dashboard',
      text: `Check out this Copilot failure analysis dashboard with ${clusters.length} clusters and ${failureLogs.length} total failures. Critical issues: ${clusters.filter(c => c.severity === 'critical').length}`,
      url: currentUrl
    };

    // Try to use Web Share API if available (mobile devices, some browsers)
    if (navigator.share) {
      navigator.share(shareData).catch((error) => {
        console.log('Error sharing:', error);
        // Fallback to copying link
        copyLinkToClipboard(currentUrl);
      });
    } else {
      // Fallback: copy link to clipboard
      copyLinkToClipboard(currentUrl);
    }
  };

  const copyLinkToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      // Show a temporary notification (you could enhance this with a toast)
      alert('Dashboard link copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy link:', error);
      // Final fallback: select the URL text
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Dashboard link copied to clipboard!');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Download className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Export & Reports</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Export Format
              </label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (Complete Data)</SelectItem>
                  <SelectItem value="csv">CSV (Cluster Summary)</SelectItem>
                  <SelectItem value="markdown">Markdown Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button onClick={() => exportData(exportFormat)} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download {exportFormat.toUpperCase()}
              </Button>
              
              <Button variant="outline" onClick={generateExecutiveSummary} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Executive Summary
              </Button>
            </div>

            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>JSON:</strong> Complete cluster and failure data</p>
              <p><strong>CSV:</strong> Cluster summary for spreadsheet analysis</p>
              <p><strong>Markdown:</strong> Executive summary report</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={sendEmailReport}>
                <Mail className="h-4 w-4 mr-2" />
                Email Report
              </Button>
              <Button variant="outline" size="sm" onClick={shareLink}>
                <Share className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Export Presets</h4>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => exportData('csv')}>
                  Critical Issues Only (CSV)
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => exportData('json')}>
                  Complete Dataset (JSON)
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={generateExecutiveSummary}>
                  Executive Summary (MD)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      {reportContent && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              className="min-h-64 font-mono text-sm"
              placeholder="Executive summary will appear here..."
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={() => copyToClipboard(reportContent)}>
                Copy to Clipboard
              </Button>
              <Button variant="outline" onClick={() => exportData('markdown')}>
                Download as Markdown
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Data Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{clusters.length}</p>
              <p className="text-sm text-slate-600">Total Clusters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{failureLogs.length}</p>
              <p className="text-sm text-slate-600">Total Failures</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {clusters.filter(c => c.severity === 'critical').length}
              </p>
              <p className="text-sm text-slate-600">Critical Issues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {clusters.filter(c => c.resolved).length}
              </p>
              <p className="text-sm text-slate-600">Resolved Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
