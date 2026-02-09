
import { AuditResult, AuditMetric, KeywordRanking, Backlink, InternalLinkOpportunity, SecurityFinding } from '../types';

const getStringHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash);
};

const getStatus = (score: number): AuditMetric['status'] => {
  if (score >= 90) return 'good';
  if (score >= 50) return 'average';
  return 'poor';
};

const generateMockSecurityFindings = (seed: number): SecurityFinding[] => {
  const findings: SecurityFinding[] = [
    {
      id: 'ssl',
      title: 'SSL/TLS Certificate',
      severity: 'high',
      status: seed % 7 === 0 ? 'vulnerable' : 'secure',
      description: 'Checks if the site uses a valid, non-expired SSL certificate.',
      remediation: 'Renew your SSL certificate via Let\'s Encrypt or your provider.'
    },
    {
      id: 'hsts',
      title: 'HSTS Policy',
      severity: 'medium',
      status: seed % 3 === 0 ? 'vulnerable' : 'secure',
      description: 'HTTP Strict Transport Security forces browsers to use HTTPS.',
      remediation: 'Add the Strict-Transport-Security header to your server configuration.'
    },
    {
      id: 'csp',
      title: 'Content Security Policy (CSP)',
      severity: 'high',
      status: seed % 2 === 0 ? 'vulnerable' : 'secure',
      description: 'Prevents XSS attacks by restricting where resources can be loaded from.',
      remediation: 'Implement a strict CSP header to block unauthorized script execution.'
    },
    {
      id: 'clickjacking',
      title: 'X-Frame-Options',
      severity: 'medium',
      status: seed % 5 === 0 ? 'vulnerable' : 'secure',
      description: 'Protects against clickjacking by preventing the site from being framed.',
      remediation: 'Set X-Frame-Options to SAMEORIGIN or DENY.'
    },
    {
      id: 'dependencies',
      title: 'Vulnerable Dependencies',
      severity: 'high',
      status: seed % 4 === 0 ? 'vulnerable' : 'secure',
      description: 'Scans for known vulnerabilities in frontend libraries (e.g., jQuery, Bootstrap).',
      remediation: 'Run "npm audit fix" and update your packages to the latest stable versions.'
    }
  ];
  return findings;
};

const generateMockKeywords = (url: string, seed: number): KeywordRanking[] => {
  const base = url.split('.')[0].replace('https://', '').replace('www.', '');
  const data = [
    { keyword: `${base} reviews`, position: 1 + (seed % 10), volume: `${5 + (seed % 50)}k`, difficulty: 20 + (seed % 60), change: (seed % 5) - 2 },
    { keyword: `best ${base} alternatives`, position: 10 + (seed % 30), volume: `${1 + (seed % 20)}k`, difficulty: 40 + (seed % 50), change: (seed % 7) - 3 },
    { keyword: `how to use ${base}`, position: 1 + (seed % 5), volume: `${2 + (seed % 15)}k`, difficulty: 15 + (seed % 40), change: (seed % 3) - 1 },
    { keyword: `${base} pricing`, position: 3 + (seed % 15), volume: `${10 + (seed % 80)}k`, difficulty: 50 + (seed % 40), change: (seed % 9) - 4 },
    { keyword: `top web tools 2024`, position: 50 + (seed % 50), volume: '150k', difficulty: 85 + (seed % 15), change: (seed % 20) - 10 },
  ];

  return data.map(item => ({
    ...item,
    history: [10, 12, 11, 13, 12, 11, 10, item.position]
  }));
};

const generateMockBacklinks = (seed: number): Backlink[] => {
  const sources = [
    { url: 'techcrunch.com/article-1', da: 92 },
    { url: 'forbes.com/sites/top-tools', da: 88 },
    { url: 'spammy-directory-xyz.biz', da: 12, toxic: 88, disavow: true },
    { url: 'low-quality-aggregator.info', da: 15, toxic: 65 },
    { url: 'github.com/awesome-web', da: 95 },
  ];
  return sources.map(s => ({
    sourceUrl: s.url,
    anchorText: 'click here',
    authority: s.da,
    toxicity: s.toxic || 2 + (seed % 10),
    type: (seed + s.da) % 2 === 0 ? 'dofollow' : 'nofollow',
    isRecommendedDisavow: s.disavow,
  }));
};

export const runSimulation = (url: string): Promise<AuditResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hash = getStringHash(url.toLowerCase().trim());
      
      const perfScore = Math.min(100, 45 + (hash % 54));
      const seoScore = Math.min(100, 52 + (hash % 47));
      const accessScore = Math.min(100, 68 + (hash % 31));
      const bestScore = Math.min(100, 58 + (hash % 41));
      
      const securityFindings = generateMockSecurityFindings(hash);
      const secureCount = securityFindings.filter(f => f.status === 'secure').length;
      const securityScore = Math.round((secureCount / securityFindings.length) * 100);

      resolve({
        performance: { label: 'Performance', score: perfScore, status: getStatus(perfScore), description: 'Load speed metrics.' },
        seo: { label: 'SEO', score: seoScore, status: getStatus(seoScore), description: 'Search optimization.' },
        accessibility: { label: 'Accessibility', score: accessScore, status: getStatus(accessScore), description: 'Usability evaluation.' },
        bestPractices: { label: 'Best Practices', score: bestScore, status: getStatus(bestScore), description: 'Web standards.' },
        security: { label: 'Security', score: securityScore, status: getStatus(securityScore), description: 'Vulnerability analysis.' },
        domainAuthority: 25 + (hash % 65),
        backlinks: {
          total: 500 + (hash % 15000),
          referringDomains: 50 + (hash % 2000),
          overallToxicity: 5 + (hash % 35),
          list: generateMockBacklinks(hash),
        },
        keywords: generateMockKeywords(url, hash),
        internalLinkOpportunities: [],
        securityFindings,
        details: [
          {
            title: 'Security Overview',
            description: 'Vulnerability and threat detection.',
            items: securityFindings.map(f => ({
              title: f.title,
              status: f.status === 'secure' ? 'pass' : 'fail',
              details: f.description
            }))
          }
        ]
      });
    }, 1500);
  });
};
