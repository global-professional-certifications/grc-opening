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
  location: string;
  linkedInUrl: string;
  summary: string;
  workExperience: WorkExperience[];
  coreCompetencies: string[];
  certifications: Certification[];
  resumeUrl: string | null;
  resumeFileName: string | null;
  avatarUrl: string | null;
}
