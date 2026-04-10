import type { ProfileFormData } from "../components/profile/types";

export interface ApiProfile {
  firstName: string;
  lastName: string;
  headline: string | null;
  bio: string | null;
  resumeUrl: string | null;
  email: string;
  skills: { id: string; name: string }[];
}

const MOCK_PROFILE: ApiProfile = {
  firstName: "Sarah",
  lastName: "Jenkins",
  headline: "Lead Compliance Auditor",
  bio: "Seasoned GRC professional with 10+ years of experience in internal audit and risk management. Specialized in GDPR compliance and financial risk modeling for Tier 1 Investment banks.",
  resumeUrl: null,
  email: "sarah.jenkins@grc-openings.com",
  skills: [
    { id: "1", name: "GDPR Compliance" },
    { id: "2", name: "Internal Audit" },
    { id: "3", name: "Risk Management" },
    { id: "4", name: "Financial Controls" },
  ],
};

export function fetchMockProfile(): Promise<ApiProfile> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PROFILE), 800);
  });
}

export function mapApiToForm(api: ApiProfile): ProfileFormData {
  return {
    firstName: api.firstName,
    lastName: api.lastName,
    professionalTitle: api.headline ?? "",
    email: api.email,
    location: "London, United Kingdom",
    linkedInUrl: "linkedin.com/in/sjenkins",
    summary: api.bio ?? "",
    workExperience: [
      {
        id: "wx1",
        title: "Lead Compliance Auditor",
        company: "Global Finance Corp",
        location: "London, UK",
        startDate: "Jan 2020",
        endDate: "",
        current: true,
        description:
          "Driving the regulatory compliance strategy across EMEA operations. Managed a team of 12 auditors to successfully pass SOX compliance audits for three consecutive years.",
      },
      {
        id: "wx2",
        title: "Senior Risk Analyst",
        company: "Standard Chartered",
        location: "London, UK",
        startDate: "Jun 2016",
        endDate: "Dec 2019",
        current: false,
        description:
          "Redesigned the operational risk framework, reducing exposure by 18% within the first 12 months. Spearheaded the digital transformation of audit reporting tools.",
      },
    ],
    coreCompetencies: api.skills.map((s) => s.name),
    certifications: [
      { id: "c1", name: "CISA - Certified Information Systems Auditor" },
      { id: "c2", name: "CIA - Certified Internal Auditor" },
    ],
    resumeUrl: api.resumeUrl,
    resumeFileName: api.resumeUrl ? "Resume.pdf" : null,
    avatarUrl: null,
  };
}
