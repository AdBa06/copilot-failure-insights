export interface FailureLog {
  evaluationId: string;
  sessionId: string;
  prompt: string;
  skillName: string;
  skillInputs: Record<string, any>;
  exception: string;
  timestamp: Date;
  errorCode?: string;
  userId?: string;
  contextMissing?: string[];
}

export interface ProcessedCluster {
  id: string;
  name: string;
  summary: string;
  failureCount: number;
  representativePrompts: string[];
  commonExceptions: string[];
  rootCause: {
    category: 'grounding' | 'skill' | 'api' | 'timeout' | 'input' | 'auth';
    description: string;
    confidence: number;
  };
  recommendations: string[];
  affectedSkills: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  firstSeen: Date;
  lastSeen: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  resolved: boolean;
  tags: string[];
  failureLogs: FailureLog[];
}

export interface AnalyticsData {
  clusters: ProcessedCluster[];
  failureLogs: FailureLog[];
  totalFailures: number;
  criticalClusters: number;
  resolvedClusters: number;
  lastUpdated: string;
} 