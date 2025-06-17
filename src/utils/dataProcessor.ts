
import { FailureLog, ProcessedCluster } from '../types/copilot';

// Mock data generator
export const generateMockData = (): FailureLog[] => {
  const skills = ['UserLookup', 'PasswordReset', 'GroupManagement', 'DeviceQuery', 'LicenseCheck'];
  const prompts = [
    'Find user John Smith',
    'Reset password for user@company.com',
    'List all users in Sales group',
    'What devices does Alice have?',
    'Check license status for user',
    'Add user to security group',
    'Remove inactive users',
    'Get user profile information',
    'Update user department',
    'Find users without MFA'
  ];
  
  const exceptions = [
    'User context not found in tenant',
    'Insufficient permissions for operation',
    'API timeout after 30 seconds',
    'Invalid skill input parameter',
    'Token expired during execution',
    'Missing required field: userPrincipalName',
    'Rate limit exceeded for Graph API',
    'Skill configuration error',
    'Network connectivity issue',
    'Malformed JSON in skill input'
  ];

  const logs: FailureLog[] = [];
  
  for (let i = 0; i < 500; i++) {
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
    
    logs.push({
      evaluationId: `eval_${i.toString().padStart(6, '0')}`,
      sessionId: `session_${Math.floor(Math.random() * 100)}`,
      prompt: prompts[Math.floor(Math.random() * prompts.length)],
      skillName: skills[Math.floor(Math.random() * skills.length)],
      skillInputs: {
        query: prompts[Math.floor(Math.random() * prompts.length)],
        userId: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 1000)}` : null,
        tenantId: `tenant_${Math.floor(Math.random() * 10)}`
      },
      exception: exceptions[Math.floor(Math.random() * exceptions.length)],
      timestamp,
      errorCode: `ERR_${Math.floor(Math.random() * 9000) + 1000}`,
      contextMissing: Math.random() > 0.7 ? ['userContext', 'tenantInfo'] : []
    });
  }
  
  return logs;
};

// Clustering algorithm (simplified)
export const processFailureClusters = (logs: FailureLog[], minClusterSize: number = 3): ProcessedCluster[] => {
  const clusters: ProcessedCluster[] = [];
  
  // Group by similar error patterns
  const errorGroups = new Map<string, FailureLog[]>();
  
  logs.forEach(log => {
    const key = `${log.skillName}_${log.exception.split(' ').slice(0, 3).join('_')}`;
    if (!errorGroups.has(key)) {
      errorGroups.set(key, []);
    }
    errorGroups.get(key)!.push(log);
  });
  
  errorGroups.forEach((groupLogs, key) => {
    if (groupLogs.length >= minClusterSize) { // Use dynamic threshold
      const cluster = createClusterFromLogs(groupLogs, key);
      clusters.push(cluster);
    }
  });
  
  return clusters.sort((a, b) => b.failureCount - a.failureCount);
};

const createClusterFromLogs = (logs: FailureLog[], key: string): ProcessedCluster => {
  const skillName = logs[0].skillName;
  const commonException = logs[0].exception;
  
  // Determine root cause based on patterns
  const rootCause = determineRootCause(logs);
  
  // Generate recommendations
  const recommendations = generateRecommendations(rootCause, skillName, logs);
  
  // Calculate severity
  const severity = logs.length > 50 ? 'critical' : 
                  logs.length > 20 ? 'high' : 
                  logs.length > 10 ? 'medium' : 'low';
  
  const timestamps = logs.map(l => l.timestamp);
  const firstSeen = new Date(Math.min(...timestamps.map(t => t.getTime())));
  const lastSeen = new Date(Math.max(...timestamps.map(t => t.getTime())));
  
  return {
    id: `cluster_${key}`,
    name: generateClusterName(rootCause, skillName),
    summary: generateClusterSummary(rootCause, skillName, logs.length),
    failureCount: logs.length,
    representativePrompts: [...new Set(logs.slice(0, 5).map(l => l.prompt))],
    commonExceptions: [...new Set(logs.map(l => l.exception))],
    rootCause,
    recommendations,
    affectedSkills: [...new Set(logs.map(l => l.skillName))],
    severity: severity as any,
    firstSeen,
    lastSeen,
    trend: determineTrend(logs),
    resolved: false,
    tags: generateTags(rootCause, logs),
    failureLogs: logs
  };
};

const determineRootCause = (logs: FailureLog[]) => {
  const exceptions = logs.map(l => l.exception.toLowerCase());
  
  if (exceptions.some(e => e.includes('context') || e.includes('tenant'))) {
    return {
      category: 'grounding' as const,
      description: 'Missing or invalid user/tenant context',
      confidence: 0.85
    };
  }
  
  if (exceptions.some(e => e.includes('timeout') || e.includes('network'))) {
    return {
      category: 'timeout' as const,
      description: 'API timeouts or network connectivity issues',
      confidence: 0.90
    };
  }
  
  if (exceptions.some(e => e.includes('permission') || e.includes('unauthorized'))) {
    return {
      category: 'auth' as const,
      description: 'Authorization or permission issues',
      confidence: 0.88
    };
  }
  
  if (exceptions.some(e => e.includes('parameter') || e.includes('input'))) {
    return {
      category: 'input' as const,
      description: 'Invalid or missing skill input parameters',
      confidence: 0.82
    };
  }
  
  return {
    category: 'api' as const,
    description: 'General API or service issues',
    confidence: 0.70
  };
};

const generateRecommendations = (rootCause: any, skillName: string, logs: FailureLog[]): string[] => {
  switch (rootCause.category) {
    case 'grounding':
      return [
        'Fix grounding logic for userObject in tenant context',
        'Add validation for required context fields',
        'Implement fallback context resolution'
      ];
    case 'timeout':
      return [
        'Increase API timeout thresholds',
        'Implement retry logic with exponential backoff',
        'Add circuit breaker pattern for failing services'
      ];
    case 'auth':
      return [
        'Review and update service principal permissions',
        'Implement proper token refresh mechanism',
        'Add user permission validation before skill execution'
      ];
    case 'input':
      return [
        `Update ${skillName} skill to handle null values gracefully`,
        'Add input parameter validation',
        'Provide better error messages for missing inputs'
      ];
    default:
      return [
        'Monitor API health and performance',
        'Review service dependencies',
        'Implement comprehensive error handling'
      ];
  }
};

const generateClusterName = (rootCause: any, skillName: string): string => {
  const categoryNames = {
    grounding: 'Context Issues',
    timeout: 'Timeout Failures',
    auth: 'Permission Errors',
    input: 'Input Validation',
    api: 'API Failures'
  };
  
  return `${skillName} - ${categoryNames[rootCause.category as keyof typeof categoryNames]}`;
};

const generateClusterSummary = (rootCause: any, skillName: string, count: number): string => {
  const templates = {
    grounding: `Missing user context in ${skillName} queries (${count} failures)`,
    timeout: `API timeouts in ${skillName} operations (${count} failures)`,
    auth: `Permission errors in ${skillName} execution (${count} failures)`,
    input: `Invalid inputs to ${skillName} skill (${count} failures)`,
    api: `Service errors in ${skillName} API calls (${count} failures)`
  };
  
  return templates[rootCause.category as keyof typeof templates];
};

const determineTrend = (logs: FailureLog[]): 'increasing' | 'decreasing' | 'stable' => {
  const sorted = logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);
  
  if (secondHalf.length > firstHalf.length * 1.2) return 'increasing';
  if (secondHalf.length < firstHalf.length * 0.8) return 'decreasing';
  return 'stable';
};

const generateTags = (rootCause: any, logs: FailureLog[]): string[] => {
  const tags = [rootCause.category];
  
  const skills = [...new Set(logs.map(l => l.skillName))];
  tags.push(...skills.map(s => s.toLowerCase()));
  
  if (logs.length > 50) tags.push('high-volume');
  if (logs.some(l => l.contextMissing?.length)) tags.push('context-missing');
  
  return tags;
};
