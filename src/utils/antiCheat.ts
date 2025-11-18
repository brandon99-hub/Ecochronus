import { getFileMetadata } from './storage';

export interface AntiCheatCheck {
  name: string;
  passed: boolean;
  score: number; // 0.0 - 1.0
  message?: string;
}

export interface AntiCheatResult {
  score: number; // Overall score (0.0 - 1.0), average of all checks
  checks: AntiCheatCheck[];
}

export interface AntiCheatInput {
  proofId: string;
  type: string;
  storageKey: string;
  metadata: any;
}

// Basic anti-cheat checks for MVP
// Advanced checks can be added later (ML-based image analysis, GPS verification, etc.)
export const runAntiCheatChecks = async (input: AntiCheatInput): Promise<AntiCheatResult> => {
  const checks: AntiCheatCheck[] = [];

  // Check 1: File size validation
  const fileSize = input.metadata?.size || 0;
  const minSize = input.type === 'photo' ? 1024 : 102400; // 1KB for photo, 100KB for video
  const maxSize = input.type === 'photo' ? 10485760 : 104857600; // 10MB for photo, 100MB for video
  
  const sizeCheck: AntiCheatCheck = {
    name: 'file_size',
    passed: fileSize >= minSize && fileSize <= maxSize,
    score: fileSize >= minSize && fileSize <= maxSize ? 1.0 : 0.0,
    message: fileSize < minSize 
      ? 'File too small' 
      : fileSize > maxSize 
      ? 'File too large' 
      : 'File size valid',
  };
  checks.push(sizeCheck);

  // Check 2: Content type validation
  const contentType = input.metadata?.contentType || '';
  const expectedTypes = input.type === 'photo' 
    ? ['image/jpeg', 'image/jpg', 'image/png'] 
    : ['video/mp4', 'video/mpeg'];
  
  const contentTypeCheck: AntiCheatCheck = {
    name: 'content_type',
    passed: expectedTypes.some(type => contentType.toLowerCase().includes(type)),
    score: expectedTypes.some(type => contentType.toLowerCase().includes(type)) ? 1.0 : 0.0,
    message: `Expected ${input.type} but got ${contentType}`,
  };
  checks.push(contentTypeCheck);

  // Check 3: File age (if metadata has timeCreated)
  if (input.metadata?.timeCreated) {
    const fileAge = Date.now() - new Date(input.metadata.timeCreated).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const ageCheck: AntiCheatCheck = {
      name: 'file_age',
      passed: fileAge <= maxAge,
      score: fileAge <= maxAge ? 1.0 : 0.5, // Slightly suspicious if too old
      message: `File created ${Math.round(fileAge / (60 * 60 * 1000))} hours ago`,
    };
    checks.push(ageCheck);
  }

  // Placeholder for advanced checks (ML-based image analysis, etc.)
  const advancedCheck: AntiCheatCheck = {
    name: 'advanced_analysis',
    passed: true, // Placeholder - always pass for MVP
    score: 0.8, // Default score for MVP (can be enhanced with actual ML analysis)
    message: 'Advanced analysis not implemented (MVP placeholder)',
  };
  checks.push(advancedCheck);

  // Calculate overall score (average of all checks)
  const overallScore = checks.reduce((sum, check) => sum + check.score, 0) / checks.length;

  return {
    score: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
    checks,
  };
};
