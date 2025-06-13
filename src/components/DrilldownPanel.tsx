
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedCluster } from '../types/copilot';
import { ArrowLeft, AlertCircle, Lightbulb, Code, Clock } from 'lucide-react';

interface DrilldownPanelProps {
  cluster: ProcessedCluster | null;
  onBack: () => void;
}

export const DrilldownPanel: React.FC<DrilldownPanelProps> = ({ cluster, onBack }) => {
  if (!cluster) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cluster selected</h3>
          <p className="text-gray-600">Select a cluster from the overview to view detailed analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Overview
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{cluster.name}</h2>
          <p className="text-slate-600">{cluster.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cluster Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-red-600">{cluster.failureCount}</p>
                <p className="text-sm text-slate-600">Total Failures</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{cluster.affectedSkills.length}</p>
                <p className="text-sm text-slate-600">Affected Skills</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Severity</span>
                <Badge className={
                  cluster.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  cluster.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  cluster.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {cluster.severity.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Confidence</span>
                <span className="text-sm font-medium">{Math.round(cluster.rootCause.confidence * 100)}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <Badge variant={cluster.resolved ? "default" : "secondary"}>
                  {cluster.resolved ? "Resolved" : "Active"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Root Cause Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              Root Cause Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge className="mb-2 bg-purple-100 text-purple-800">
                {cluster.rootCause.category.toUpperCase()}
              </Badge>
              <p className="text-sm text-slate-700">{cluster.rootCause.description}</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {cluster.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">First Seen</span>
                <span className="text-sm font-medium">{cluster.firstSeen.toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Last Seen</span>
                <span className="text-sm font-medium">{cluster.lastSeen.toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Duration</span>
                <span className="text-sm font-medium">
                  {Math.ceil((cluster.lastSeen.getTime() - cluster.firstSeen.getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Trend</span>
                <Badge variant={
                  cluster.trend === 'increasing' ? 'destructive' :
                  cluster.trend === 'decreasing' ? 'default' : 'secondary'
                }>
                  {cluster.trend}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="samples" className="space-y-4">
        <TabsList>
          <TabsTrigger value="samples">Sample Failures</TabsTrigger>
          <TabsTrigger value="exceptions">Exception Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="samples">
          <Card>
            <CardHeader>
              <CardTitle>Representative Failed Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cluster.representativePrompts.map((prompt, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-slate-50">
                    <p className="font-mono text-sm text-slate-800">{prompt}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions">
          <Card>
            <CardHeader>
              <CardTitle>Common Exceptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cluster.commonExceptions.map((exception, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <p className="font-mono text-sm text-red-800">{exception}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Actionable Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cluster.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-slate-800">{rec}</p>
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
