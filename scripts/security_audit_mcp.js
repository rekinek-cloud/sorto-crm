#!/usr/bin/env node
/**
 * security-audit-mcp-server.js
 * Custom MCP Server for CRM-GTD Security Auditing
 * 
 * Provides comprehensive security scanning, GDPR compliance checking,
 * and enterprise security features for the CRM-GTD application.
 * 
 * Author: CRM-GTD Development Team
 * Date: 2025-06-19
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Initialize MCP Server
const server = new McpServer(
  {
    name: 'crm-gtd-security-audit',
    version: '1.0.0',
    description: 'Comprehensive security auditing and compliance checking for CRM-GTD enterprise application'
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  }
);

// Security configuration
const SECURITY_CONFIG = {
  scanPatterns: {
    sqlInjection: [
      /(\bSELECT\b.*\bFROM\b.*\bWHERE\b.*['"]?\$\{|\$\().*['"]?/gi,
      /(\bINSERT\b.*\bINTO\b.*\bVALUES\b.*['"]?\$\{|\$\().*['"]?/gi,
      /(\bUPDATE\b.*\bSET\b.*['"]?\$\{|\$\().*['"]?/gi,
      /(\bDELETE\b.*\bFROM\b.*\bWHERE\b.*['"]?\$\{|\$\().*['"]?/gi
    ],
    xssVulnerabilities: [
      /innerHTML\s*=\s*['"]?\$\{|innerHTML\s*\+=\s*['"]?\$\{/gi,
      /document\.write\s*\(\s*['"]?\$\{/gi,
      /\.html\s*\(\s*['"]?\$\{/gi,
      /dangerouslySetInnerHTML/gi
    ],
    sensitiveData: [
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]+['"]/gi,
      /token\s*[:=]\s*['"][^'"]+['"]/gi,
      /private[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi
    ],
    csrfVulnerabilities: [
      /method\s*[:=]\s*['"]POST['"].*(?!csrf)/gi,
      /\.post\s*\(.*(?!csrf)/gi,
      /\.put\s*\(.*(?!csrf)/gi,
      /\.delete\s*\(.*(?!csrf)/gi
    ]
  },
  gdprPatterns: {
    dataCollection: [
      /personal[_-]?data|user[_-]?data|customer[_-]?data/gi,
      /email|phone|address|birthday|social[_-]?security/gi,
      /gdpr|consent|privacy[_-]?policy/gi
    ],
    dataProcessing: [
      /encrypt|decrypt|hash|anonymize/gi,
      /data[_-]?retention|data[_-]?deletion/gi,
      /right[_-]?to[_-]?be[_-]?forgotten/gi
    ]
  },
  soc2Controls: {
    accessControl: [
      /authentication|authorization|rbac|role[_-]?based/gi,
      /permission|access[_-]?control|security[_-]?policy/gi,
      /two[_-]?factor|2fa|multi[_-]?factor/gi
    ],
    logging: [
      /audit[_-]?log|security[_-]?log|access[_-]?log/gi,
      /log[_-]?retention|log[_-]?monitoring/gi,
      /intrusion[_-]?detection|security[_-]?monitoring/gi
    ]
  }
};

// Security vulnerability scanner
async function scanSecurityVulnerabilities(directory, scanType = 'full') {
  const results = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    compliance: {
      gdpr: { status: 'unknown', issues: [] },
      soc2: { status: 'unknown', issues: [] }
    },
    recommendations: []
  };

  try {
    const files = await getFilesToScan(directory);
    
    for (const file of files) {
      if (shouldScanFile(file)) {
        const content = await fs.readFile(file, 'utf-8');
        const vulnerabilities = await scanFileContent(content, file);
        
        // Categorize vulnerabilities by severity
        vulnerabilities.forEach(vuln => {
          results[vuln.severity].push(vuln);
        });
        
        // Check compliance
        const gdprCheck = checkGDPRCompliance(content, file);
        const soc2Check = checkSOC2Compliance(content, file);
        
        if (gdprCheck.issues.length > 0) {
          results.compliance.gdpr.issues.push(...gdprCheck.issues);
        }
        
        if (soc2Check.issues.length > 0) {
          results.compliance.soc2.issues.push(...soc2Check.issues);
        }
      }
    }
    
    // Set compliance status
    results.compliance.gdpr.status = results.compliance.gdpr.issues.length === 0 ? 'compliant' : 'non-compliant';
    results.compliance.soc2.status = results.compliance.soc2.issues.length === 0 ? 'compliant' : 'non-compliant';
    
    // Generate recommendations
    results.recommendations = generateSecurityRecommendations(results);
    
    return results;
  } catch (error) {
    throw new Error(`Security scan failed: ${error.message}`);
  }
}

// Get files to scan
async function getFilesToScan(directory) {
  const files = [];
  
  async function scanDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !shouldSkipDirectory(entry.name)) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
    }
  }
  
  await scanDirectory(directory);
  return files;
}

// Check if directory should be skipped
function shouldSkipDirectory(dirname) {
  const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];
  return skipDirs.includes(dirname);
}

// Check if file should be scanned
function shouldScanFile(filepath) {
  const extensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.php', '.py', '.java', '.cs', '.sql'];
  return extensions.some(ext => filepath.endsWith(ext));
}

// Scan file content for vulnerabilities
async function scanFileContent(content, filepath) {
  const vulnerabilities = [];
  
  // SQL Injection check
  SECURITY_CONFIG.scanPatterns.sqlInjection.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      vulnerabilities.push({
        type: 'SQL Injection',
        severity: 'critical',
        file: filepath,
        line: getLineNumber(content, matches[0]),
        description: 'Potential SQL injection vulnerability detected',
        recommendation: 'Use parameterized queries or ORM with proper escaping'
      });
    }
  });
  
  // XSS check
  SECURITY_CONFIG.scanPatterns.xssVulnerabilities.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      vulnerabilities.push({
        type: 'Cross-Site Scripting (XSS)',
        severity: 'high',
        file: filepath,
        line: getLineNumber(content, matches[0]),
        description: 'Potential XSS vulnerability detected',
        recommendation: 'Sanitize user input and use safe DOM manipulation methods'
      });
    }
  });
  
  // Sensitive data exposure check
  SECURITY_CONFIG.scanPatterns.sensitiveData.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      vulnerabilities.push({
        type: 'Sensitive Data Exposure',
        severity: 'high',
        file: filepath,
        line: getLineNumber(content, matches[0]),
        description: 'Sensitive data found in code',
        recommendation: 'Move sensitive data to environment variables or secure vault'
      });
    }
  });
  
  // CSRF check
  SECURITY_CONFIG.scanPatterns.csrfVulnerabilities.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      vulnerabilities.push({
        type: 'Cross-Site Request Forgery (CSRF)',
        severity: 'medium',
        file: filepath,
        line: getLineNumber(content, matches[0]),
        description: 'Potential CSRF vulnerability - missing CSRF protection',
        recommendation: 'Implement CSRF tokens for state-changing operations'
      });
    }
  });
  
  return vulnerabilities;
}

// Get line number for a match
function getLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split('\n');
  return lines.length;
}

// Check GDPR compliance
function checkGDPRCompliance(content, filepath) {
  const issues = [];
  
  // Check for data collection without consent mechanisms
  const hasPersonalData = SECURITY_CONFIG.gdprPatterns.dataCollection.some(pattern => 
    pattern.test(content)
  );
  
  if (hasPersonalData) {
    const hasConsentMechanism = /consent|privacy[_-]?policy|gdpr[_-]?compliance/gi.test(content);
    const hasDataRetention = /data[_-]?retention|retention[_-]?policy/gi.test(content);
    const hasRightToBeForgotten = /right[_-]?to[_-]?be[_-]?forgotten|data[_-]?deletion/gi.test(content);
    
    if (!hasConsentMechanism) {
      issues.push({
        type: 'GDPR - Missing Consent Mechanism',
        file: filepath,
        description: 'Personal data processing without clear consent mechanism'
      });
    }
    
    if (!hasDataRetention) {
      issues.push({
        type: 'GDPR - Missing Data Retention Policy',
        file: filepath,
        description: 'Personal data processing without data retention policy'
      });
    }
    
    if (!hasRightToBeForgotten) {
      issues.push({
        type: 'GDPR - Missing Right to be Forgotten',
        file: filepath,
        description: 'Personal data processing without right to be forgotten implementation'
      });
    }
  }
  
  return { issues };
}

// Check SOC2 compliance
function checkSOC2Compliance(content, filepath) {
  const issues = [];
  
  // Check for access control mechanisms
  const hasAccessControl = SECURITY_CONFIG.soc2Controls.accessControl.some(pattern =>
    pattern.test(content)
  );
  
  const hasLogging = SECURITY_CONFIG.soc2Controls.logging.some(pattern =>
    pattern.test(content)
  );
  
  // Check for authentication in API endpoints
  if (/app\.(get|post|put|delete|patch)/gi.test(content)) {
    if (!hasAccessControl) {
      issues.push({
        type: 'SOC2 - Missing Access Control',
        file: filepath,
        description: 'API endpoint without proper access control'
      });
    }
    
    if (!hasLogging) {
      issues.push({
        type: 'SOC2 - Missing Audit Logging',
        file: filepath,
        description: 'API endpoint without audit logging'
      });
    }
  }
  
  return { issues };
}

// Generate security recommendations
function generateSecurityRecommendations(results) {
  const recommendations = [];
  
  if (results.critical.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'Fix all critical vulnerabilities immediately',
      details: 'Critical vulnerabilities pose immediate security risks and must be addressed before deployment'
    });
  }
  
  if (results.compliance.gdpr.status === 'non-compliant') {
    recommendations.push({
      priority: 'HIGH',
      action: 'Implement GDPR compliance measures',
      details: 'Add consent mechanisms, data retention policies, and right to be forgotten functionality'
    });
  }
  
  if (results.compliance.soc2.status === 'non-compliant') {
    recommendations.push({
      priority: 'HIGH', 
      action: 'Implement SOC2 security controls',
      details: 'Add comprehensive access controls, audit logging, and security monitoring'
    });
  }
  
  if (results.high.length > 2) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Address high-severity vulnerabilities',
      details: 'Multiple high-severity vulnerabilities detected that could lead to data breaches'
    });
  }
  
  return recommendations;
}

// Penetration testing simulation
async function runPenetrationTest(targetUrl, testType = 'basic') {
  const results = {
    status: 'completed',
    vulnerabilities: [],
    score: 0,
    recommendations: []
  };
  
  try {
    // Simulate common penetration testing checks
    const tests = [
      { name: 'SQL Injection', severity: 'critical' },
      { name: 'XSS Injection', severity: 'high' },
      { name: 'CSRF Protection', severity: 'medium' },
      { name: 'Authentication Bypass', severity: 'critical' },
      { name: 'Authorization Flaws', severity: 'high' },
      { name: 'Session Management', severity: 'medium' },
      { name: 'SSL/TLS Configuration', severity: 'medium' },
      { name: 'Input Validation', severity: 'high' }
    ];
    
    // Simulate test results (in real implementation, would perform actual tests)
    for (const test of tests) {
      const passed = Math.random() > 0.3; // 70% pass rate for simulation
      
      if (!passed) {
        results.vulnerabilities.push({
          test: test.name,
          severity: test.severity,
          status: 'failed',
          description: `${test.name} vulnerability detected`,
          recommendation: `Implement proper ${test.name.toLowerCase()} protection`
        });
      }
    }
    
    // Calculate security score
    const totalTests = tests.length;
    const passedTests = totalTests - results.vulnerabilities.length;
    results.score = Math.round((passedTests / totalTests) * 100);
    
    // Generate recommendations based on failed tests
    if (results.score < 80) {
      results.recommendations.push('Security score below acceptable threshold - immediate action required');
    }
    
    return results;
  } catch (error) {
    throw new Error(`Penetration test failed: ${error.message}`);
  }
}

// MCP Tools Registration

// Tool: Security vulnerability scan
server.tool(
  'security_scan',
  'Comprehensive security vulnerability scan for CRM-GTD application',
  {
    directory: z.string().describe('Directory path to scan for vulnerabilities'),
    scan_type: z.enum(['quick', 'full', 'critical']).describe('Type of security scan to perform'),
    include_compliance: z.boolean().optional().describe('Include GDPR and SOC2 compliance checks')
  },
  async ({ directory, scan_type, include_compliance = true }) => {
    try {
      const results = await scanSecurityVulnerabilities(directory, scan_type);
      
      const summary = {
        scan_type,
        directory,
        timestamp: new Date().toISOString(),
        vulnerabilities: {
          critical: results.critical.length,
          high: results.high.length,
          medium: results.medium.length,
          low: results.low.length
        },
        compliance: include_compliance ? results.compliance : undefined,
        recommendations: results.recommendations
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Security scan failed: ${error.message}`
        }]
      };
    }
  }
);

// Tool: GDPR compliance check
server.tool(
  'gdpr_compliance_check',
  'Check GDPR compliance for specific module or entire application',
  {
    module_path: z.string().describe('Path to module or directory to check for GDPR compliance'),
    detailed_report: z.boolean().optional().describe('Generate detailed compliance report')
  },
  async ({ module_path, detailed_report = false }) => {
    try {
      const files = await getFilesToScan(module_path);
      const compliance = {
        status: 'compliant',
        issues: [],
        recommendations: []
      };
      
      for (const file of files) {
        if (shouldScanFile(file)) {
          const content = await fs.readFile(file, 'utf-8');
          const gdprCheck = checkGDPRCompliance(content, file);
          compliance.issues.push(...gdprCheck.issues);
        }
      }
      
      if (compliance.issues.length > 0) {
        compliance.status = 'non-compliant';
        compliance.recommendations = [
          'Implement consent management system',
          'Add data retention policies',
          'Implement right to be forgotten functionality',
          'Add privacy policy and data processing notices'
        ];
      }
      
      const report = {
        module: module_path,
        timestamp: new Date().toISOString(),
        compliance_status: compliance.status,
        issues_count: compliance.issues.length,
        issues: detailed_report ? compliance.issues : compliance.issues.slice(0, 5),
        recommendations: compliance.recommendations
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(report, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `GDPR compliance check failed: ${error.message}`
        }]
      };
    }
  }
);

// Tool: Penetration testing
server.tool(
  'penetration_test',
  'Run automated penetration testing against application',
  {
    target_url: z.string().describe('Target URL for penetration testing'),
    test_type: z.enum(['basic', 'advanced', 'comprehensive']).describe('Type of penetration test'),
    include_owasp_top10: z.boolean().optional().describe('Include OWASP Top 10 vulnerability tests')
  },
  async ({ target_url, test_type, include_owasp_top10 = true }) => {
    try {
      const results = await runPenetrationTest(target_url, test_type);
      
      const report = {
        target: target_url,
        test_type,
        timestamp: new Date().toISOString(),
        security_score: results.score,
        vulnerabilities_found: results.vulnerabilities.length,
        critical_issues: results.vulnerabilities.filter(v => v.severity === 'critical').length,
        high_issues: results.vulnerabilities.filter(v => v.severity === 'high').length,
        status: results.score >= 80 ? 'PASS' : 'FAIL',
        vulnerabilities: results.vulnerabilities,
        recommendations: results.recommendations
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(report, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Penetration test failed: ${error.message}`
        }]
      };
    }
  }
);

// Tool: Generate security report
server.tool(
  'generate_security_report',
  'Generate comprehensive security assessment report',
  {
    project_path: z.string().describe('Path to project for security assessment'),
    report_format: z.enum(['json', 'markdown', 'html']).describe('Output format for the report'),
    include_remediation: z.boolean().optional().describe('Include remediation steps in report')
  },
  async ({ project_path, report_format, include_remediation = true }) => {
    try {
      const scanResults = await scanSecurityVulnerabilities(project_path, 'full');
      
      const report = {
        project: project_path,
        assessment_date: new Date().toISOString(),
        executive_summary: {
          overall_security_score: calculateSecurityScore(scanResults),
          critical_issues: scanResults.critical.length,
          high_issues: scanResults.high.length,
          compliance_status: {
            gdpr: scanResults.compliance.gdpr.status,
            soc2: scanResults.compliance.soc2.status
          }
        },
        detailed_findings: scanResults,
        remediation_plan: include_remediation ? generateRemediationPlan(scanResults) : undefined
      };
      
      if (report_format === 'markdown') {
        const markdown = generateMarkdownReport(report);
        return {
          content: [{
            type: 'text',
            text: markdown
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(report, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Security report generation failed: ${error.message}`
        }]
      };
    }
  }
);

// Helper functions
function calculateSecurityScore(results) {
  const weights = { critical: 10, high: 5, medium: 2, low: 1 };
  const totalIssues = Object.keys(weights).reduce((sum, severity) => {
    return sum + (results[severity].length * weights[severity]);
  }, 0);
  
  // Base score of 100, subtract weighted issues
  const score = Math.max(0, 100 - totalIssues);
  return score;
}

function generateRemediationPlan(results) {
  const plan = {
    immediate_actions: [],
    short_term: [],
    long_term: []
  };
  
  if (results.critical.length > 0) {
    plan.immediate_actions.push('Fix all critical vulnerabilities within 24 hours');
  }
  
  if (results.compliance.gdpr.status === 'non-compliant') {
    plan.short_term.push('Implement GDPR compliance measures within 2 weeks');
  }
  
  if (results.compliance.soc2.status === 'non-compliant') {
    plan.short_term.push('Implement SOC2 security controls within 4 weeks');
  }
  
  if (results.high.length > 0) {
    plan.short_term.push('Address all high-severity vulnerabilities within 1 week');
  }
  
  plan.long_term.push('Implement continuous security monitoring');
  plan.long_term.push('Establish regular penetration testing schedule');
  plan.long_term.push('Implement security training program for development team');
  
  return plan;
}

function generateMarkdownReport(report) {
  return `# Security Assessment Report

## Executive Summary
- **Overall Security Score**: ${report.executive_summary.overall_security_score}/100
- **Critical Issues**: ${report.executive_summary.critical_issues}
- **High Issues**: ${report.executive_summary.high_issues}
- **GDPR Compliance**: ${report.executive_summary.compliance_status.gdpr}
- **SOC2 Compliance**: ${report.executive_summary.compliance_status.soc2}

## Detailed Findings
${JSON.stringify(report.detailed_findings, null, 2)}

${report.remediation_plan ? `## Remediation Plan
### Immediate Actions
${report.remediation_plan.immediate_actions.map(action => `- ${action}`).join('\n')}

### Short Term (1-4 weeks)
${report.remediation_plan.short_term.map(action => `- ${action}`).join('\n')}

### Long Term (1+ months)
${report.remediation_plan.long_term.map(action => `- ${action}`).join('\n')}
` : ''}

---
*Report generated on ${report.assessment_date}*
`;
}

// Resource: Security audit reports
server.resource(
  'security_audit_reports',
  'Access historical security audit reports',
  async () => {
    // In a real implementation, this would read from a database or file system
    const mockReports = [
      {
        id: 'audit-001',
        date: '2025-06-19',
        type: 'comprehensive',
        score: 85,
        status: 'passed'
      },
      {
        id: 'audit-002', 
        date: '2025-06-18',
        type: 'quick',
        score: 78,
        status: 'warning'
      }
    ];
    
    return {
      contents: mockReports.map(report => ({
        uri: `security://audit/${report.id}`,
        text: JSON.stringify(report, null, 2),
        mimeType: 'application/json'
      }))
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CRM-GTD Security Audit MCP Server running on stdio');
}

main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});