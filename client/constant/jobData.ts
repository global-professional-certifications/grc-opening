interface jobDataInfo {
  eLevel: string;
  title: string;
  category: string;
  description: string;
}

export const jobData: jobDataInfo[] = [
  // ===== Foundation (Entry-Level) =====
  {
    eLevel: "Foundation (Entry-Level)",
    title: "GRC Intern",
    category: "General",
    description: "Supports governance, risk, and compliance tasks including documentation, audits, and basic regulatory research."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "Compliance Associate",
    category: "Compliance",
    description: "Assists in monitoring compliance activities, maintaining documentation, and supporting audits."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "Junior Risk Analyst",
    category: "Risk",
    description: "Supports risk identification, maintains risk registers, and assists in risk assessment processes."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "Audit Associate",
    category: "Audit",
    description: "Supports internal audits, control testing, and documentation of audit findings."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "IT Controls Analyst",
    category: "IT Compliance",
    description: "Works on IT general controls (ITGC), audits, and system-level compliance validation."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "Governance Analyst",
    category: "Governance",
    description: "Maintains governance frameworks, policies, and ensures process documentation alignment."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "Risk Analyst",
    category: "Risk",
    description: "Identifies, assesses, and monitors business risks and supports mitigation strategies."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "Third-Party Risk Analyst",
    category: "Risk",
    description: "Evaluates vendor risks through due diligence and ongoing monitoring."
  },
  {
    eLevel: "Foundation (Entry-Level)",
    title: "Compliance Analyst",
    category: "Compliance",
    description: "Ensures adherence to laws and policies, maintains compliance records, and tracks regulations."
  },

  // ===== Associate (Early Career) =====
  {
    eLevel: "Associate (Early Career)",
    title: "IT Compliance Analyst",
    category: "Compliance",
    description: "Ensures IT systems comply with standards, supports audits, and documents controls."
  },
  {
    eLevel: "Associate (Early Career)",
    title: "Data Privacy Analyst",
    category: "Privacy",
    description: "Implements data protection policies and conducts privacy impact assessments."
  },
  {
    eLevel: "Associate (Early Career)",
    title: "AML/KYC Analyst",
    category: "Financial Compliance",
    description: "Performs customer due diligence and monitors transactions for fraud prevention."
  },
  {
    eLevel: "Associate (Early Career)",
    title: "Cybersecurity GRC Analyst",
    category: "Security",
    description: "Handles security risk assessments, compliance frameworks, and cybersecurity governance."
  },
  {
    eLevel: "Associate (Early Career)",
    title: "Cloud Compliance Analyst",
    category: "Cloud",
    description: "Ensures cloud environments (AWS/Azure/GCP) meet compliance and regulatory requirements."
  },

  // ===== Specialist (Mid-Level) =====
  {
    eLevel: "Specialist (Mid-Level)",
    title: "Internal Auditor",
    category: "Audit",
    description: "Evaluates internal controls and conducts audits to improve risk management."
  },
  {
    eLevel: "Specialist (Mid-Level)",
    title: "IT Auditor",
    category: "Audit",
    description: "Audits IT systems, controls, and processes for compliance and security."
  },
  {
    eLevel: "Specialist (Mid-Level)",
    title: "Controls Assurance Analyst",
    category: "Audit",
    description: "Validates effectiveness of internal controls through testing and reporting."
  },
  {
    eLevel: "Specialist (Mid-Level)",
    title: "ISO 27001 Consultant",
    category: "Compliance",
    description: "Implements ISMS frameworks and prepares organizations for ISO 27001 certification."
  },
  {
    eLevel: "Specialist (Mid-Level)",
    title: "Data Protection Officer (DPO)",
    category: "Privacy",
    description: "Leads data protection strategies and ensures regulatory compliance for personal data."
  },
  {
    eLevel: "Specialist (Mid-Level)",
    title: "Regulatory Affairs Specialist",
    category: "Legal",
    description: "Monitors regulations, ensures compliance, and manages regulatory submissions."
  },

  // ===== Lead / Principal (Advanced Roles) =====
  {
    eLevel: "Lead (Senior IC)",
    title: "Enterprise Risk Manager",
    category: "Risk",
    description: "Leads enterprise risk frameworks and drives strategic risk mitigation initiatives."
  },
  {
    eLevel: "Lead (Senior IC)",
    title: "SOX Compliance Specialist",
    category: "Compliance",
    description: "Manages Sarbanes-Oxley compliance, internal controls, and audit coordination."
  },
  {
    eLevel: "Lead (Senior IC)",
    title: "Fraud Risk Analyst",
    category: "Risk",
    description: "Detects and mitigates fraud risks and strengthens internal controls."
  },
  {
    eLevel: "Lead (Senior IC)",
    title: "GRC Platform Specialist",
    category: "Tech GRC",
    description: "Manages GRC tools like ServiceNow/Archer and automates compliance workflows."
  },
  {
    eLevel: "Lead (Senior IC)",
    title: "Corporate Governance Manager",
    category: "Governance",
    description: "Oversees governance frameworks and advises leadership on compliance strategy."
  },
  {
    eLevel: "Lead (Senior IC)",
    title: "Legal Compliance Officer",
    category: "Legal",
    description: "Ensures legal compliance across operations and advises on regulatory risks."
  },

  // ===== Principal (Expert / Strategic) =====
  {
    eLevel: "Principal (Expert / Strategic)",
    title: "Privacy Counsel",
    category: "Legal",
    description: "Provides legal guidance on data privacy laws and regulatory compliance."
  },
  {
    eLevel: "Principal (Expert / Strategic)",
    title: "Financial Compliance Specialist",
    category: "Compliance",
    description: "Ensures financial regulations are followed and supports audit readiness."
  },
  {
    eLevel: "Principal (Expert / Strategic)",
    title: "PCI-DSS Compliance Specialist",
    category: "Compliance",
    description: "Implements and maintains PCI-DSS standards for payment data security."
  },
  {
    eLevel: "Principal (Expert / Strategic)",
    title: "ESG Analyst",
    category: "Governance",
    description: "Analyzes environmental, social, and governance metrics and sustainability initiatives."
  },
  {
    eLevel: "Principal (Expert / Strategic)",
    title: "GRC Manager",
    category: "GRC",
    description: "Leads GRC programs, manages teams, and ensures regulatory alignment."
  },
  {
    eLevel: "Principal (Expert / Strategic)",
    title: "Head of Risk & Compliance",
    category: "GRC",
    description: "Oversees enterprise-wide risk and compliance strategy."
  },

  // ===== Executive (Leadership) =====
  {
    eLevel: "Executive (Leadership)",
    title: "Chief Risk Officer (CRO)",
    category: "Risk",
    description: "Leads enterprise risk strategy and aligns risk management with business goals."
  },
  {
    eLevel: "Executive (Leadership)",
    title: "Chief Compliance Officer (CCO)",
    category: "Compliance",
    description: "Oversees compliance programs and ensures adherence to regulations."
  },
  {
    eLevel: "Executive (Leadership)",
    title: "Chief Information Security Officer (CISO)",
    category: "Security",
    description: "Leads cybersecurity strategy and protects organizational digital assets."
  }
];




export const getJobDescription = (category:string,title:string):string=>{

    return jobData.find((item)=>item.category===category && item.title===title).description
}