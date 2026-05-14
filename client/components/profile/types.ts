export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  gpa: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
}

export interface ProfileFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  professionalTitle: string;
  email: string;
  phone?: string;
  location: string;
  linkedInUrl: string;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  coreCompetencies: string[];
  certifications: Certification[];
  resumeUrl: string | null;
  resumeFileName: string | null;
  avatarUrl: string | null;
  openToShareCriticalInfo: boolean;
  ctcCurrency: string;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  buybackOption: string;
  reasonForChange: string[];
  reasonForChangeOther: string;
}
