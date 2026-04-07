export interface EmployerProfileData {
  // Company identity
  companyName: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  website: string;
  tagline: string;
  description: string;

  // Contact details
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactPhoneCode: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;

  // Social & links
  linkedInUrl: string;
  twitterUrl: string;
  otherUrl: string;
  customLinks: string[];

  // Notification preferences
  emailNotifications: boolean;
  applicantAlerts: boolean;
  weeklyDigest: boolean;

  // Media
  logoUrl: string | null;
}

export const EMPTY_EMPLOYER_PROFILE: EmployerProfileData = {
  companyName: "",
  industry: "",
  companySize: "",
  foundedYear: "",
  website: "",
  tagline: "",
  description: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactPhoneCode: "+1",
  address: "",
  city: "",
  state: "",
  stateCode: "",
  country: "",
  countryCode: "",
  linkedInUrl: "",
  twitterUrl: "",
  otherUrl: "",
  customLinks: [],
  emailNotifications: true,
  applicantAlerts: true,
  weeklyDigest: false,
  logoUrl: null,
};

export const INDUSTRY_OPTIONS = [
  "Risk Management",
  "Compliance & Audit",
  "Information Security",
  "Legal & Regulatory",
  "Financial Services",
  "Healthcare & Life Sciences",
  "Technology",
  "Government & Public Sector",
  "Energy & Utilities",
  "Manufacturing",
  "Consulting",
  "Education",
  "Other",
];

export const COMPANY_SIZE_OPTIONS = [
  "1ΓÇô10 employees",
  "11ΓÇô50 employees",
  "51ΓÇô200 employees",
  "201ΓÇô500 employees",
  "501ΓÇô1,000 employees",
  "1,000+ employees",
];
