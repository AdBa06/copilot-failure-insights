
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProcessedCluster } from '../types/copilot';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';

interface ClusterOverviewProps {
  clusters: ProcessedCluster[];
  onClusterSelect: (cluster: ProcessedCluster) => void;
  selectedCluster: ProcessedCluster | null;
}

export const ClusterOverview: React.FC<ClusterOverviewProps> = ({
  clusters,
  onClusterSelect,
  selectedCluster
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRootCauseColor = (category: string) => {
    switch (category) {
      case 'grounding': return 'bg-purple-100 text-purple-800';
      case 'timeout': return 'bg-red-100 text-red-800';
      case 'auth': return 'bg-orange-100 text-orange-800';
      case 'input': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          Failure Clusters ({clusters.length})
        </h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-red-50">
            {clusters.filter(c => c.severity === 'critical').length} Critical
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {clusters.filter(c => c.resolved).length} Resolved
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clusters.map((cluster) => (
          <Card 
            key={cluster.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
              cluster.severity === 'critical' ? 'border-l-red-500' : 
              cluster.severity === 'high' ? 'border-l-orange-500' :
              cluster.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
            } ${selectedCluster?.id === cluster.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
            onClick={() => onClusterSelect(cluster)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                    {cluster.name}
                  </CardTitle>
                  <p className="text-sm text-slate-600">{cluster.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(cluster.trend)}
                  {cluster.resolved && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getSeverityColor(cluster.severity)}>
                  {cluster.severity.toUpperCase()}
                </Badge>
                <Badge className={getRootCauseColor(cluster.rootCause.category)}>
                  {cluster.rootCause.category}
                </Badge>
                <Badge variant="outline">
                  {cluster.failureCount} failures
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium text-slate-700">Root Cause:</span>
                  <p className="text-slate-600 mt-1">{cluster.rootCause.description}</p>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-slate-700">Affected Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cluster.affectedSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>First seen: {cluster.firstSeen.toLocaleDateString()}</span>
                <span>Last seen: {cluster.lastSeen.toLocaleDateString()}</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onClusterSelect(cluster);
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {clusters.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clusters found</h3>
            <p className="text-gray-600">Try adjusting your filters or time range.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
