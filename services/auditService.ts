
/**
 * QuickSEO Audit Service
 * This file is reserved for future integration with real-world 
 * Lighthouse or Google PageSpeed APIs. Currently, the app uses 
 * mockAudit.ts for high-speed simulation of these metrics.
 */

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
