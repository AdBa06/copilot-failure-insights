#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { generateMockData, processFailureClusters } from './mockDataGenerator.js';
import { AnalyticsData } from './types.js';

class CopilotFailureMCPServer {
  private server: Server;
  private mockData: AnalyticsData;

  constructor() {
    this.server = new Server(
      {
        name: 'copilot-failure-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.refreshMockData();
    this.setupHandlers();
  }

  private refreshMockData() {
    const failureLogs = generateMockData();
    const clusters = processFailureClusters(failureLogs);
    
    this.mockData = {
      clusters,
      failureLogs,
      totalFailures: failureLogs.length,
      criticalClusters: clusters.filter(c => c.severity === 'critical').length,
      resolvedClusters: clusters.filter(c => c.resolved).length,
      lastUpdated: new Date().toISOString()
    };
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_failure_analytics',
            description: 'Get complete copilot failure analytics data including clusters and logs',
            inputSchema: {
              type: 'object',
              properties: {
                refresh: {
                  type: 'boolean',
                  description: 'Whether to refresh the data before returning',
                  default: false
                }
              }
            }
          },
          {
            name: 'get_clusters',
            description: 'Get processed failure clusters with filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                severity: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'Filter by severity level'
                },
                resolved: {
                  type: 'boolean',
                  description: 'Filter by resolution status'
                },
                minClusterSize: {
                  type: 'number',
                  description: 'Minimum cluster size threshold',
                  default: 3
                }
              }
            }
          },
          {
            name: 'get_failure_logs',
            description: 'Get raw failure logs with filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                skillName: {
                  type: 'string',
                  description: 'Filter by specific skill name'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of logs to return',
                  default: 100
                }
              }
            }
          },
          {
            name: 'analyze_trends',
            description: 'Get trend analysis and insights from failure data',
            inputSchema: {
              type: 'object',
              properties: {
                timeRange: {
                  type: 'string',
                  enum: ['24h', '7d', '30d'],
                  description: 'Time range for analysis',
                  default: '7d'
                }
              }
            }
          },
          {
            name: 'get_recommendations',
            description: 'Get AI-powered recommendations for failure remediation',
            inputSchema: {
              type: 'object',
              properties: {
                clusterId: {
                  type: 'string',
                  description: 'Specific cluster to get recommendations for'
                }
              }
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_failure_analytics':
            return await this.getFailureAnalytics(args);
          case 'get_clusters':
            return await this.getClusters(args);
          case 'get_failure_logs':
            return await this.getFailureLogs(args);
          case 'analyze_trends':
            return await this.analyzeTrends(args);
          case 'get_recommendations':
            return await this.getRecommendations(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async getFailureAnalytics(args: any): Promise<CallToolResult> {
    if (args?.refresh) {
      this.refreshMockData();
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: this.mockData,
            metadata: {
              generatedAt: new Date().toISOString(),
              dataSource: 'mock',
              version: '1.0.0'
            }
          }, null, 2)
        }
      ]
    };
  }

  private async getClusters(args: any): Promise<CallToolResult> {
    let clusters = this.mockData.clusters;

    // Apply filters
    if (args?.severity) {
      clusters = clusters.filter(c => c.severity === args.severity);
    }
    if (args?.resolved !== undefined) {
      clusters = clusters.filter(c => c.resolved === args.resolved);
    }
    if (args?.minClusterSize) {
      clusters = clusters.filter(c => c.failureCount >= args.minClusterSize);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: clusters,
            count: clusters.length,
            filters: args
          }, null, 2)
        }
      ]
    };
  }

  private async getFailureLogs(args: any): Promise<CallToolResult> {
    let logs = this.mockData.failureLogs;

    // Apply filters
    if (args?.skillName) {
      logs = logs.filter(log => log.skillName === args?.skillName);
    }
    
    const limit = args?.limit || 100;
    logs = logs.slice(0, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: logs,
            count: logs.length,
            total: this.mockData.failureLogs.length,
            filters: args
          }, null, 2)
        }
      ]
    };
  }

  private async analyzeTrends(args: any): Promise<CallToolResult> {
    const timeRange = args?.timeRange || '7d';
    const clusters = this.mockData.clusters;
    
    // Generate trend insights
    const trends = {
      overview: {
        totalClusters: clusters.length,
        increasingTrends: clusters.filter(c => c.trend === 'increasing').length,
        decreasingTrends: clusters.filter(c => c.trend === 'decreasing').length,
        stableTrends: clusters.filter(c => c.trend === 'stable').length
      },
      byRootCause: clusters.reduce((acc, cluster) => {
        const category = cluster.rootCause.category;
        acc[category] = (acc[category] || 0) + cluster.failureCount;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: clusters.reduce((acc, cluster) => {
        acc[cluster.severity] = (acc[cluster.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      timeRange,
      aiInsights: [
        "Context-related failures are the primary driver of incidents",
        "Timeout issues have increased 23% over the analysis period", 
        "GroupManagement skill shows highest failure rate",
        "Weekend failure patterns suggest automated process issues"
      ]
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: trends,
            generatedAt: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async getRecommendations(args: any): Promise<CallToolResult> {
    const clusterId = args?.clusterId;
    let recommendations;

    if (clusterId) {
      const cluster = this.mockData.clusters.find(c => c.id === clusterId);
      if (!cluster) {
        throw new Error(`Cluster ${clusterId} not found`);
      }
      
      recommendations = {
        clusterId,
        clusterName: cluster.name,
        priority: cluster.severity,
        aiRecommendations: cluster.recommendations,
        enhancedAnalysis: {
          confidenceScore: cluster.rootCause.confidence,
          impactAssessment: cluster.severity === 'critical' ? 'High business impact' : 'Moderate impact',
          effortEstimate: '2-4 hours for implementation',
          dependencies: ['Microsoft Graph API', 'Azure AD tenant configuration']
        }
      };
    } else {
      // Global recommendations
      const criticalClusters = this.mockData.clusters.filter(c => c.severity === 'critical');
      recommendations = {
        global: true,
        topPriorities: criticalClusters.slice(0, 3).map(cluster => ({
          clusterId: cluster.id,
          name: cluster.name,
          recommendation: cluster.recommendations[0],
          impact: 'Critical'
        })),
        systemwideInsights: [
          'Implement comprehensive input validation across all skills',
          'Enhance error handling and retry mechanisms',
          'Add proactive monitoring for context resolution failures',
          'Review and update service principal permissions quarterly'
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: recommendations,
            generatedAt: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Copilot Failure MCP Server running on stdio');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new CopilotFailureMCPServer();
  server.run().catch(console.error);
} 