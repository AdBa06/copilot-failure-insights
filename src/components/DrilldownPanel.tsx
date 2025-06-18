
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedCluster } from '../types/copilot';
import { ArrowLeft, AlertCircle, Lightbulb, Code, Clock, FileText, Copy } from 'lucide-react';

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

  const generateRAGFix = (cluster: ProcessedCluster) => {
    const ragTemplates = {
      grounding: {
        title: "Context Resolution Fix",
        description: "Fix missing user/tenant context in Copilot queries",
        template: `# RAG Knowledge Base Entry: Context Resolution

## Problem Statement
- **Issue**: Missing or invalid user/tenant context in ${cluster.affectedSkills.join(', ')} skills
- **Impact**: ${cluster.failureCount} failures affecting user experience
- **Root Cause**: ${cluster.rootCause.description}

## Solution Framework

### Prerequisites
\`\`\`json
{
  "requiredContext": {
    "userObjectId": "string",
    "tenantId": "string", 
    "userPrincipalName": "string",
    "roles": ["array"]
  }
}
\`\`\`

### Implementation Steps
1. **Context Validation**
   - Validate userObject exists before skill execution
   - Implement fallback context resolution mechanism
   - Add context enrichment from Graph API if missing

2. **Code Fix Template**
\`\`\`typescript
// Add to skill initialization
if (!context.userObject || !context.tenantId) {
  throw new ContextMissingError("Required user context not available");
}

// Implement context fallback
const enrichedContext = await enrichUserContext(context);
\`\`\`

3. **Monitoring & Validation**
   - Add telemetry for context availability
   - Monitor context resolution success rates
   - Alert on context validation failures

## Expected Outcomes
- Reduce context-related failures by 90%
- Improve user experience consistency
- Enhanced error messaging for missing context

## Related Skills: ${cluster.affectedSkills.join(', ')}
## Confidence Level: ${Math.round(cluster.rootCause.confidence * 100)}%`
      },
      timeout: {
        title: "API Timeout Resilience Fix", 
        description: "Implement retry logic and timeout handling for API calls",
        template: `# RAG Knowledge Base Entry: API Timeout Resilience

## Problem Statement
- **Issue**: API timeouts and network connectivity issues in ${cluster.affectedSkills.join(', ')}
- **Impact**: ${cluster.failureCount} timeout failures
- **Root Cause**: ${cluster.rootCause.description}

## Solution Framework

### Retry Configuration
\`\`\`json
{
  "retryPolicy": {
    "maxRetries": 3,
    "backoffMultiplier": 2,
    "initialDelay": 1000,
    "maxDelay": 10000,
    "timeoutMs": 30000
  }
}
\`\`\`

### Implementation Steps
1. **Exponential Backoff Retry**
\`\`\`typescript
async function callAPIWithRetry(apiCall: () => Promise<any>, retries = 3): Promise<any> {
  try {
    return await Promise.race([
      apiCall(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 30000)
      )
    ]);
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(Math.pow(2, 3 - retries) * 1000);
      return callAPIWithRetry(apiCall, retries - 1);
    }
    throw error;
  }
}
\`\`\`

2. **Circuit Breaker Pattern**
   - Implement circuit breaker for failing services
   - Fallback to cached responses when available
   - Graceful degradation strategies

3. **Monitoring & Alerting**
   - Track API response times and success rates
   - Alert on timeout threshold breaches
   - Monitor circuit breaker state changes

## Expected Outcomes
- Reduce timeout failures by 85%
- Improve API reliability scores
- Better user experience during service degradation

## Related Skills: ${cluster.affectedSkills.join(', ')}
## Confidence Level: ${Math.round(cluster.rootCause.confidence * 100)}%`
      },
      auth: {
        title: "Authentication & Authorization Fix",
        description: "Resolve permission and authentication issues",
        template: `# RAG Knowledge Base Entry: Authentication & Authorization

## Problem Statement
- **Issue**: Authentication/authorization failures in ${cluster.affectedSkills.join(', ')}
- **Impact**: ${cluster.failureCount} permission-related failures
- **Root Cause**: ${cluster.rootCause.description}

## Solution Framework

### Permission Requirements
\`\`\`json
{
  "requiredPermissions": {
    "graphAPI": ["User.Read", "Directory.Read.All"],
    "copilotAPI": ["Copilot.Execute", "Copilot.Read"],
    "custom": ["${cluster.affectedSkills.join('", "')}"]
  }
}
\`\`\`

### Implementation Steps
1. **Permission Validation**
\`\`\`typescript
async function validatePermissions(requiredScopes: string[]): Promise<boolean> {
  const userToken = await getAccessToken();
  const permissions = await validateTokenScopes(userToken, requiredScopes);
  
  if (!permissions.isValid) {
    throw new InsufficientPermissionsError(
      \`Missing scopes: \${permissions.missingScopes.join(', ')}\`
    );
  }
  return true;
}
\`\`\`

2. **Token Refresh Logic**
   - Implement automatic token refresh
   - Handle token expiration gracefully
   - Cache valid tokens appropriately

3. **Permission Escalation**
   - Provide clear permission request guidance
   - Implement step-up authentication where needed
   - Fallback to limited functionality with reduced permissions

## Expected Outcomes
- Eliminate authentication failures
- Improve user onboarding experience
- Clear permission error messaging

## Related Skills: ${cluster.affectedSkills.join(', ')}
## Confidence Level: ${Math.round(cluster.rootCause.confidence * 100)}%`
      },
      input: {
        title: "Input Validation & Parameter Handling Fix",
        description: "Implement robust input validation and parameter handling",
        template: `# RAG Knowledge Base Entry: Input Validation & Parameter Handling

## Problem Statement
- **Issue**: Invalid or missing input parameters in ${cluster.affectedSkills.join(', ')}
- **Impact**: ${cluster.failureCount} input validation failures  
- **Root Cause**: ${cluster.rootCause.description}

## Solution Framework

### Input Schema Definition
\`\`\`json
{
  "inputSchema": {
    "required": ["userId", "query"],
    "optional": ["context", "filters"],
    "validation": {
      "userId": "string|guid",
      "query": "string|minLength:1|maxLength:1000",
      "context": "object|optional"
    }
  }
}
\`\`\`

### Implementation Steps
1. **Input Validation Layer**
\`\`\`typescript
function validateSkillInput(input: any, schema: InputSchema): ValidationResult {
  const errors: string[] = [];
  
  // Required field validation
  schema.required.forEach(field => {
    if (!input[field]) {
      errors.push(\`Missing required field: \${field}\`);
    }
  });
  
  // Type and format validation
  Object.entries(schema.validation).forEach(([field, rules]) => {
    if (input[field] && !validateFieldRules(input[field], rules)) {
      errors.push(\`Invalid format for field: \${field}\`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
}
\`\`\`

2. **Graceful Error Handling**
   - Provide specific error messages for validation failures
   - Suggest corrections for common input mistakes
   - Implement input sanitization and normalization

3. **Default Value Handling**
   - Define sensible defaults for optional parameters
   - Document expected input formats clearly
   - Implement parameter transformation utilities

## Expected Outcomes
- Eliminate input-related failures
- Improve developer experience with clear error messages
- Reduce support tickets for parameter issues

## Related Skills: ${cluster.affectedSkills.join(', ')}
## Confidence Level: ${Math.round(cluster.rootCause.confidence * 100)}%`
      },
      api: {
        title: "General API Reliability Fix",
        description: "Improve overall API reliability and error handling",
        template: `# RAG Knowledge Base Entry: General API Reliability

## Problem Statement
- **Issue**: General API or service issues in ${cluster.affectedSkills.join(', ')}
- **Impact**: ${cluster.failureCount} API-related failures
- **Root Cause**: ${cluster.rootCause.description}

## Solution Framework

### Health Check Configuration
\`\`\`json
{
  "healthChecks": {
    "endpoints": ["api/health", "api/status"],
    "interval": 30000,
    "timeout": 5000,
    "retries": 2
  }
}
\`\`\`

### Implementation Steps
1. **Comprehensive Error Handling**
\`\`\`typescript
async function handleAPICall(apiFunction: () => Promise<any>): Promise<any> {
  try {
    const result = await apiFunction();
    return result;
  } catch (error) {
    // Log error with context
    logger.error('API call failed', {
      error: error.message,
      stack: error.stack,
      skill: '${cluster.affectedSkills[0]}',
      timestamp: new Date().toISOString()
    });
    
    // Return user-friendly error
    throw new UserFriendlyError(
      'Service temporarily unavailable. Please try again later.',
      error
    );
  }
}
\`\`\`

2. **Service Dependency Management**
   - Implement health checks for all dependencies
   - Add circuit breakers for external services
   - Monitor and alert on service degradation

3. **Performance Optimization**
   - Implement response caching where appropriate
   - Add request deduplication
   - Optimize database queries and API calls

## Expected Outcomes
- Improve overall API reliability to 99.9%
- Reduce MTTR (Mean Time To Recovery)
- Better monitoring and observability

## Related Skills: ${cluster.affectedSkills.join(', ')}
## Confidence Level: ${Math.round(cluster.rootCause.confidence * 100)}%`
      }
    };

    return ragTemplates[cluster.rootCause.category as keyof typeof ragTemplates] || ragTemplates.api;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="samples">Sample Failures</TabsTrigger>
          <TabsTrigger value="exceptions">Exception Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="ragfix">RAG Fix</TabsTrigger>
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

        <TabsContent value="ragfix">
          {(() => {
            const ragFix = generateRAGFix(cluster);
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Suggested RAG File Fix
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">{ragFix.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-100 text-purple-800">
                        {ragFix.title}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(ragFix.template)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy RAG Template
                      </Button>
                    </div>
                    
                    <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-slate-100 whitespace-pre-wrap font-mono">
                        {ragFix.template}
                      </pre>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">How to Use This RAG Fix</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Copy this template to your knowledge base or documentation system</li>
                        <li>• Use it as context for AI-assisted development or troubleshooting</li>
                        <li>• Reference it during code reviews and incident response</li>
                        <li>• Update implementation details based on your specific environment</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
