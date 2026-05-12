import fs from 'fs';
import path from 'path';

// =====================================
// TYPES
// =====================================

export interface ParsedExperience {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface ParsedEducation {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedInUrl: string;
  skills: string[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
  rawTextLength: number;
}

// =====================================
// GRC/COMPLIANCE DOMAIN SKILLS
// =====================================

const GRC_SKILLS = [
  // Core GRC
  'governance', 'risk management', 'compliance', 'grc',
  'audit', 'internal audit', 'external audit',
  'risk assessment', 'risk analysis', 'risk mitigation',
  'regulatory compliance', 'policy management',
  
  // Frameworks & Standards
  'iso 27001', 'iso 27002', 'iso 31000', 'iso 22301',
  'nist', 'nist csf', 'nist 800-53',
  'cobit', 'itil', 'coso',
  'sox', 'sarbanes-oxley', 'sarbanes oxley',
  'gdpr', 'hipaa', 'pci dss', 'pci-dss',
  'ccpa', 'ferpa', 'glba', 'fisma',
  'fedramp', 'cmmc', 'nerc cip',
  'soc 1', 'soc 2', 'soc2', 'soc 2 type ii',
  'aicpa', 'ssae 18', 'isae 3402',
  
  // Certifications (commonly listed as skills)
  'cisa', 'cism', 'cissp', 'crisc', 'cgeit',
  'cpa', 'cia', 'crma', 'grcp', 'grca',
  'cfe', 'ccsa', 'qsa', 'pcip',
  'comptia security+', 'security+',
  'certified ethical hacker', 'ceh',
  
  // Cybersecurity
  'cybersecurity', 'information security', 'infosec',
  'vulnerability assessment', 'penetration testing',
  'incident response', 'threat modeling',
  'security operations', 'soc', 'siem',
  'identity access management', 'iam',
  'data privacy', 'data protection', 'dlp',
  'encryption', 'firewall', 'intrusion detection',
  'endpoint security', 'cloud security',
  'zero trust', 'devsecops',
  
  // Tools & Platforms
  'servicenow', 'archer', 'rsa archer',
  'metricstream', 'sailpoint', 'qualys',
  'splunk', 'crowdstrike', 'tenable',
  'rapid7', 'nessus', 'burp suite',
  'azure sentinel', 'aws security hub',
  'okta', 'cyberark', 'varonis',
  'oneTrust', 'onetrust', 'trustwave',
  'veracode', 'checkmarx', 'snyk',
  'jira', 'confluence', 'sharepoint',
  
  // Business & Soft Skills
  'project management', 'stakeholder management',
  'business continuity', 'disaster recovery',
  'vendor management', 'third-party risk',
  'contract management', 'procurement',
  'change management', 'process improvement',
  'data analytics', 'data analysis',
  'report writing', 'documentation',
  'leadership', 'team management',
  'communication', 'presentation',
  
  // Technical Skills
  'sql', 'python', 'powershell', 'excel',
  'power bi', 'tableau', 'vba',
  'active directory', 'azure ad',
  'aws', 'azure', 'gcp', 'cloud computing',
  'linux', 'windows server',
  'networking', 'tcp/ip', 'dns',
  'api security', 'oauth', 'saml',
  'docker', 'kubernetes',
];

// =====================================
// SECTION DETECTION PATTERNS
// =====================================

const SECTION_HEADERS = {
  experience: /\b(work\s*experience|professional\s*experience|employment\s*history|work\s*history|experience|career\s*history)\b/i,
  education: /\b(education|academic|qualifications|degrees|schooling|university|college)\b/i,
  skills: /\b(skills|technical\s*skills|core\s*competencies|competencies|proficiencies|expertise|key\s*skills)\b/i,
  summary: /\b(summary|professional\s*summary|objective|profile|about\s*me|career\s*objective)\b/i,
  certifications: /\b(certifications?|licenses?|credentials|accreditations?)\b/i,
};

// =====================================
// CORE EXTRACTION FUNCTIONS
// =====================================

/**
 * Extract email address from text using regex.
 */
function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  if (!matches || matches.length === 0) return '';
  
  // Filter out common false positives
  const filtered = matches.filter(email => 
    !email.includes('example.com') &&
    !email.includes('domain.com') &&
    !email.endsWith('.png') &&
    !email.endsWith('.jpg')
  );
  
  return filtered[0] || matches[0];
}

/**
 * Extract LinkedIn profile URL
 */
function extractLinkedIn(text: string): string {
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w-]+)\/?/i;
  const match = text.match(linkedinRegex);
  return match ? `linkedin.com/in/${match[1]}` : '';
}

/**
 * Extract Location (City, State/Country format) from the first few lines
 */
function extractLocation(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 20);
  const locRegex = /^([A-Z][a-zA-Z-]{1,25}(?:\s+[A-Z][a-zA-Z-]{1,25})?),\s*([A-Z][a-zA-Z-]{1,25}(?:\s+[A-Z][a-zA-Z-]{1,25}){0,2})$/;
  
  for (const line of lines) {
    if (line.length < 4 || line.length > 60) continue;
    if (/[@/\d]/.test(line)) continue; // skip emails/phones
    
    const match = line.match(locRegex);
    if (match) {
      const candidate = `${match[1].trim()}, ${match[2].trim()}`;
      if (!/\b(inc|ltd|llc|corp|co\.?|group|solutions|consulting|university|college|institute)\b/i.test(candidate)) {
        return candidate;
      }
    }
  }
  return '';
}

/**
 * Extract phone number from text using regex.
 * Supports international formats (+1, +91, etc.) and common delimiters.
 */
function extractPhone(text: string): string {
  const phonePatterns = [
    // International format: +1-234-567-8901, +91 98765 43210
    /\+?\d{1,3}[\s\-.]?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/g,
    // US format: (234) 567-8901
    /\(\d{3}\)\s?\d{3}[\s\-.]?\d{4}/g,
    // Simple: 1234567890 or 123-456-7890
    /\b\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}\b/g,
    // 10+ digit numbers
    /\b\d{10,13}\b/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first match that looks like a real phone number (7+ digits)
      const digitCount = matches[0].replace(/\D/g, '').length;
      if (digitCount >= 7 && digitCount <= 15) {
        return matches[0].trim();
      }
    }
  }
  return '';
}

/**
 * Extract candidate name from the top of the resume.
 * Heuristic: The name is usually in the first few lines, often the first non-empty line.
 */
function extractName(text: string): string {
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return '';

  // The first substantial line is likely the name
  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like headers, emails, phones, URLs
    if (line.match(/^(resume|curriculum vitae|cv|page \d)/i)) continue;
    if (line.includes('@')) continue;
    if (line.match(/^\+?\d[\d\s\-().]{6,}/)) continue;
    if (line.match(/^https?:\/\//)) continue;
    if (line.match(/^(linkedin|github|twitter|portfolio)/i)) continue;
    
    // Name should be relatively short (2-5 words) and contain only letters/spaces
    const cleaned = line.replace(/[^a-zA-Z\s.''-]/g, '').trim();
    const words = cleaned.split(/\s+/);
    if (words.length >= 1 && words.length <= 5 && cleaned.length >= 3 && cleaned.length <= 60) {
      return cleaned;
    }
  }

  // Fallback: return the first line cleaned up
  return lines[0].replace(/[^a-zA-Z\s.''-]/g, '').trim().substring(0, 60);
}

/**
 * Extract skills from text using keyword matching against the GRC domain skill set.
 */
function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundSkills = new Set<string>();

  for (const skill of GRC_SKILLS) {
    // Use word boundary matching to avoid false positives
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    if (regex.test(lowerText)) {
      // Capitalize properly for display
      foundSkills.add(skill.split(' ')
        .map(word => {
          // Keep acronyms uppercase
          if (word.length <= 4 && word === word.toUpperCase()) return word;
          if (word.toUpperCase() === word && word.length <= 5) return word.toUpperCase();
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ')
      );
    }
  }

  return Array.from(foundSkills).sort();
}

/**
 * Split text into sections based on header detection.
 */
function splitIntoSections(text: string): Record<string, string> {
  const lines = text.split('\n');
  const sections: Record<string, string> = { header: '' };
  let currentSection = 'header';

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if this line is a section header
    let foundSection = false;
    for (const [sectionName, pattern] of Object.entries(SECTION_HEADERS)) {
      // Section headers are typically short lines that match the pattern
      if (trimmed.length < 60 && pattern.test(trimmed)) {
        currentSection = sectionName;
        sections[currentSection] = '';
        foundSection = true;
        break;
      }
    }

    if (!foundSection) {
      sections[currentSection] = (sections[currentSection] || '') + line + '\n';
    }
  }

  return sections;
}

/**
 * Parse experience entries from an experience section text.
 */
function parseExperienceSection(text: string): ParsedExperience[] {
  if (!text || text.trim().length === 0) return [];

  const experiences: ParsedExperience[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Date pattern to identify experience boundaries
  const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s*\.?\s*\d{2,4}\s*[-–—to]+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)?\s*\.?\s*\d{0,4}\s*|present|current/i;
  const yearPattern = /\b(19|20)\d{2}\s*[-–—to]+\s*(19|20)?\d{2,4}\s*|present|current/i;

  let currentExp: Partial<ParsedExperience> | null = null;
  let descriptionLines: string[] = [];

  const flushExperience = () => {
    if (currentExp && (currentExp.title || currentExp.company)) {
      experiences.push({
        title: currentExp.title || 'Unknown Title',
        company: currentExp.company || 'Unknown Company',
        location: currentExp.location,
        startDate: currentExp.startDate,
        endDate: currentExp.endDate,
        current: currentExp.current || false,
        description: descriptionLines.join(' ').trim() || undefined,
      });
    }
    currentExp = null;
    descriptionLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDate = datePattern.test(line) || yearPattern.test(line);
    
    if (hasDate || (i === 0 && line.length < 80)) {
      // This might be a new experience entry
      if (currentExp) flushExperience();
      
      currentExp = { current: false };

      // Try to extract dates from this line
      const dateMatch = line.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{2,4})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{2,4}|present|current)/i);
      const yearMatch = line.match(/((19|20)\d{2})\s*[-–—to]+\s*((19|20)?\d{2,4}|present|current)/i);
      
      if (dateMatch) {
        currentExp.startDate = dateMatch[1].trim();
        const end = dateMatch[2].trim().toLowerCase();
        if (end === 'present' || end === 'current') {
          currentExp.current = true;
        } else {
          currentExp.endDate = dateMatch[2].trim();
        }
      } else if (yearMatch) {
        currentExp.startDate = yearMatch[1];
        const end = yearMatch[3].toLowerCase();
        if (end === 'present' || end === 'current') {
          currentExp.current = true;
        } else {
          currentExp.endDate = yearMatch[3];
        }
      }

      // Extract title/company from the line (remove the date parts)
      const cleanedLine = line
        .replace(datePattern, '')
        .replace(yearPattern, '')
        .replace(/[-–—|,]/g, ' ')
        .trim();
      
      if (cleanedLine) {
        // Heuristic: title comes before company, often separated by " at " or " - "
        const atSplit = cleanedLine.split(/\s+(?:at|@)\s+/i);
        if (atSplit.length >= 2) {
          currentExp.title = atSplit[0].trim();
          currentExp.company = atSplit.slice(1).join(' at ').trim();
        } else {
          currentExp.title = cleanedLine;
        }
      }
      
      // Check next line for company if not found
      if (!currentExp.company && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.length > 0 && nextLine.length < 80 && !datePattern.test(nextLine)) {
          currentExp.company = nextLine;
          i++; // Skip this line in the main loop
        }
      }
    } else if (currentExp) {
      // This is a description line for the current experience
      descriptionLines.push(line);
    }
  }

  // Flush the last experience
  flushExperience();

  return experiences;
}

/**
 * Parse education entries from an education section text.
 */
function parseEducationSection(text: string): ParsedEducation[] {
  if (!text || text.trim().length === 0) return [];

  const educations: ParsedEducation[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Common degree patterns
  const degreePattern = /\b(b\.?s\.?c?\.?|m\.?s\.?c?\.?|b\.?a\.?|m\.?a\.?|ph\.?d\.?|m\.?b\.?a\.?|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|bachelor|master|doctor|diploma|associate|certificate)\b/i;
  
  let currentEdu: Partial<ParsedEducation> | null = null;

  const flushEducation = () => {
    if (currentEdu && currentEdu.institution) {
      educations.push({
        institution: currentEdu.institution || 'Unknown Institution',
        degree: currentEdu.degree,
        field: currentEdu.field,
        startDate: currentEdu.startDate,
        endDate: currentEdu.endDate,
        description: currentEdu.description,
      });
    }
    currentEdu = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDegree = degreePattern.test(line);
    const hasYear = /\b(19|20)\d{2}\b/.test(line);

    if (hasDegree || (hasYear && line.length < 120) || i === 0) {
      if (currentEdu) flushEducation();
      
      currentEdu = {};

      // Extract degree
      const degreeMatch = line.match(degreePattern);
      if (degreeMatch) {
        currentEdu.degree = degreeMatch[0].trim();
      }

      // Extract year range
      const yearMatch = line.match(/\b((?:19|20)\d{2})\s*[-–—to]*\s*((?:19|20)\d{2})?\b/);
      if (yearMatch) {
        currentEdu.startDate = yearMatch[1];
        if (yearMatch[2]) currentEdu.endDate = yearMatch[2];
      }

      // Extract field of study - text after "in" or after degree
      const fieldMatch = line.match(/(?:in|of)\s+([A-Za-z\s&,]+?)(?:\s*[-–—,|]\s*|\s*\d{4}|$)/i);
      if (fieldMatch) {
        currentEdu.field = fieldMatch[1].trim();
      }

      // Remove date/degree parts to get institution name
      const cleaned = line
        .replace(degreePattern, '')
        .replace(/\b(19|20)\d{2}\b/g, '')
        .replace(/[-–—|,]/g, ' ')
        .replace(/\b(in|of)\s+\w+/i, '')
        .trim();
      
      if (cleaned.length > 2) {
        currentEdu.institution = cleaned;
      }

      // Check next line for institution if not found
      if (!currentEdu.institution && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.length > 0 && nextLine.length < 100) {
          currentEdu.institution = nextLine;
          i++;
        }
      }
    } else if (currentEdu && !currentEdu.institution && line.length < 100) {
      currentEdu.institution = line;
    }
  }

  flushEducation();
  return educations;
}

// =====================================
// MAIN PARSER
// =====================================

/**
 * Parse a PDF resume and extract structured data.
 * 
 * Strategy:
 * 1. Extract raw text from PDF using pdf-parse
 * 2. Detect and split sections (experience, education, skills)
 * 3. Extract contact info (email, phone) via regex
 * 4. Extract skills via keyword matching
 * 5. Parse experience/education entries from sections
 * 
 * This is designed to be replaceable — when NLP/NER is added later,
 * swap this function's internals without changing the interface.
 * 
 * @param filePath - Absolute path to the PDF file
 * @returns Structured resume data
 */
export async function parseResume(filePath: string): Promise<ParsedResumeData> {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Resume file not found: ${filePath}`);
  }

  // Validate file extension
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.pdf') {
    throw new Error(`Unsupported file format: ${ext}. Only PDF is currently supported.`);
  }

  // Read and parse PDF
  const { PDFParse } = await import('pdf-parse');
  const fileBuffer = fs.readFileSync(filePath);
  const fileArray = new Uint8Array(fileBuffer);
  
  let rawText: string;
  try {
    // pdf-parse v2: constructor takes a LoadParameters object ({ data: ... }),
    // NOT a raw Uint8Array. getText() loads the document internally — load() is private.
    const parser = new PDFParse({ data: fileArray });
    const result = await parser.getText();
    rawText = result.text;
  } catch (err: any) {
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }



  if (!rawText || rawText.trim().length < 20) {
    throw new Error('PDF appears to be empty or contains no extractable text. It may be a scanned image.');
  }

  // Split into sections
  const sections = splitIntoSections(rawText);

  // Extract structured data
  const name = extractName(rawText);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const location = extractLocation(rawText);
  const linkedInUrl = extractLinkedIn(rawText);
  const skills = extractSkills(rawText);
  const experience = parseExperienceSection(sections.experience || '');
  const education = parseEducationSection(sections.education || '');

  return {
    name,
    email,
    phone,
    location,
    linkedInUrl,
    skills,
    experience,
    education,
    rawTextLength: rawText.length,
  };
}

/**
 * Validate parsed resume data completeness.
 * Returns an array of warnings (not errors — partial data is still useful).
 */
export function validateParsedData(data: ParsedResumeData): string[] {
  const warnings: string[] = [];

  if (!data.name) warnings.push('Could not extract candidate name');
  if (!data.email) warnings.push('Could not extract email address');
  if (!data.phone) warnings.push('Could not extract phone number');
  if (data.skills.length === 0) warnings.push('No skills detected');
  if (data.experience.length === 0) warnings.push('No experience entries detected');
  if (data.education.length === 0) warnings.push('No education entries detected');
  if (data.rawTextLength < 100) warnings.push('Very little text extracted from PDF');

  return warnings;
}
