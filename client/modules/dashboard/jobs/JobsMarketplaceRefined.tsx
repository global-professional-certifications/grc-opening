import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

type DiscoveryJob = {
  id: string;
  companyName: string;
  companyLogoText: string;
  title: string;
  category: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  experienceLevel: string;
  postedAtLabel: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  applicationWindowLabel: string;
  applyUrl: string;
  tags: string[];
  verified: boolean;
};

type DiscoveryFilters = {
  categories: string[];
  workModes: Array<"Remote" | "Hybrid" | "On-site">;
  experienceLevels: string[];
  salaryRange: {
    min: number;
    max: number;
  };
};

type DiscoveryResponse = {
  jobs: DiscoveryJob[];
  filters: DiscoveryFilters;
  meta: {
    totalJobs: number;
  };
};

type SupportedCurrency = "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD";

const SYNE = { fontFamily: "'Syne', sans-serif" };
const MANROPE = { fontFamily: "'Manrope', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const PAGE_SIZE = 4;
const TEAL = "#00A896";
const TEAL_SOFT = "#00A896";
const SURFACE = "#f6fbff";
const CARD = "#ffffff";
const PANEL = "#eef5fb";
const INSET = "#f9fcff";
const BORDER = "#d8e6f2";
const TEXT_PRIMARY = "#16263d";
const TEXT_SECONDARY = "#647d96";
const TEXT_MUTED = "#8091a5";
const AMBER = "#f4b11a";
const CURRENCY_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.1,
  CAD: 1.36,
  AUD: 1.52,
};

const FALLBACK_DISCOVERY_RESPONSE: DiscoveryResponse = {
  jobs: [
    {
      id: "disc-1",
      companyName: "Stripe",
      companyLogoText: "S",
      title: "Senior Risk & Compliance Manager",
      category: "Risk Management",
      location: "Dublin, IE",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 2 days ago",
      salaryMin: 110000,
      salaryMax: 135000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Mar 15",
      applyUrl: "#",
      tags: ["CISA", "SOX", "GDPR"],
      verified: true,
    },
    {
      id: "disc-2",
      companyName: "Revolut",
      companyLogoText: "R",
      title: "Head of Information Security Audit",
      category: "IT Audit",
      location: "London, UK",
      workMode: "Hybrid",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 5 hours ago",
      salaryMin: 145000,
      salaryMax: 180000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Apr 02",
      applyUrl: "#",
      tags: ["IT Audit", "CRISC", "PCI DSS"],
      verified: true,
    },
    {
      id: "disc-3",
      companyName: "Coinbase",
      companyLogoText: "C",
      title: "Global Compliance Analyst",
      category: "Compliance",
      location: "New York, US",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 1 week ago",
      salaryMin: 95000,
      salaryMax: 115000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Open indefinitely",
      applyUrl: "#",
      tags: ["AML/KYC", "FINRA"],
      verified: false,
    },
    {
      id: "disc-4",
      companyName: "Notion",
      companyLogoText: "N",
      title: "Governance, Risk & Controls Lead",
      category: "Risk Management",
      location: "San Francisco, US",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted today",
      salaryMin: 130000,
      salaryMax: 162000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Apr 10",
      applyUrl: "#",
      tags: ["ERM", "Controls"],
      verified: true,
    },
    {
      id: "disc-5",
      companyName: "Atlassian",
      companyLogoText: "A",
      title: "Privacy & Regulatory Compliance Specialist",
      category: "Compliance",
      location: "Bengaluru, IN",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 3 days ago",
      salaryMin: 85000,
      salaryMax: 110000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Apr 18",
      applyUrl: "#",
      tags: ["ISO 27701", "GDPR"],
      verified: true,
    },
    {
      id: "disc-7",
      companyName: "PwC",
      companyLogoText: "P",
      title: "Senior IT Audit Consultant",
      category: "IT Audit",
      location: "Mumbai, IN",
      workMode: "On-site",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted yesterday",
      salaryMin: 70000,
      salaryMax: 98000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Apr 12",
      applyUrl: "#",
      tags: ["IT Audit", "SOC 2", "ISO 27001"],
      verified: true,
    },
    {
      id: "disc-9",
      companyName: "Microsoft",
      companyLogoText: "M",
      title: "GRC & Security Architect",
      category: "Risk Management",
      location: "Redmond, US",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 1 day ago",
      salaryMin: 155000,
      salaryMax: 190000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes May 15",
      applyUrl: "#",
      tags: ["NIST", "Azure", "Zero Trust"],
      verified: true,
    },
    {
      id: "disc-10",
      companyName: "Google",
      companyLogoText: "G",
      title: "Privacy Engineering Lead",
      category: "Compliance",
      location: "Mountain View, US",
      workMode: "Hybrid",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 3 hours ago",
      salaryMin: 170000,
      salaryMax: 215000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes May 20",
      applyUrl: "#",
      tags: ["GDPR", "Privacy by Design"],
      verified: true,
    },
    {
      id: "disc-11",
      companyName: "Meta",
      companyLogoText: "M",
      title: "Regulatory Compliance Counsel",
      category: "Compliance",
      location: "Berlin, DE",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 1 week ago",
      salaryMin: 140000,
      salaryMax: 175000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Open indefinitely",
      applyUrl: "#",
      tags: ["Digital Services Act", "Legal"],
      verified: true,
    },
    {
      id: "disc-12",
      companyName: "KPMG",
      companyLogoText: "K",
      title: "IT Audit Senior Associate",
      category: "IT Audit",
      location: "Toronto, CA",
      workMode: "On-site",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 5 days ago",
      salaryMin: 85000,
      salaryMax: 115000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Jun 01",
      applyUrl: "#",
      tags: ["IT Audit", "SOC 1", "ISO 27001"],
      verified: true,
    },
    {
      id: "disc-13",
      companyName: "Deloitte",
      companyLogoText: "D",
      title: "Risk Transformation Director",
      category: "Risk Management",
      location: "London, UK",
      workMode: "Hybrid",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 2 days ago",
      salaryMin: 160000,
      salaryMax: 205000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes May 10",
      applyUrl: "#",
      tags: ["ERM", "Digital Risk"],
      verified: true,
    },
    {
      id: "disc-14",
      companyName: "Amazon",
      companyLogoText: "A",
      title: "Cloud Compliance Specialist",
      category: "Compliance",
      location: "Seattle, US",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted today",
      salaryMin: 130000,
      salaryMax: 165000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Open indefinitely",
      applyUrl: "#",
      tags: ["AWS", "FedRAMP", "HIPAA"],
      verified: true,
    },
    {
      id: "disc-15",
      companyName: "Goldman Sachs",
      companyLogoText: "G",
      title: "AML/KYC Compliance Manager",
      category: "Compliance",
      location: "New York, US",
      workMode: "Hybrid",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 1 week ago",
      salaryMin: 150000,
      salaryMax: 185000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes May 30",
      applyUrl: "#",
      tags: ["FINRA", "AML", "KYC"],
      verified: true,
    },
    {
      id: "disc-16",
      companyName: "Shopify",
      companyLogoText: "S",
      title: "Data Governance Specialist",
      category: "Risk Management",
      location: "Ottawa, CA",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 3 days ago",
      salaryMin: 95000,
      salaryMax: 125000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Jun 15",
      applyUrl: "#",
      tags: ["Data Privacy", "Pipelines"],
      verified: true,
    },
    {
      id: "disc-17",
      companyName: "Spotify",
      companyLogoText: "S",
      title: "Content Risk & Integrity Lead",
      category: "Risk Management",
      location: "Stockholm, SE",
      workMode: "Hybrid",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 4 days ago",
      salaryMin: 110000,
      salaryMax: 145000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Jun 20",
      applyUrl: "#",
      tags: ["Trust & Safety", "Audit"],
      verified: true,
    },
    {
      id: "disc-18",
      companyName: "Tesla",
      companyLogoText: "T",
      title: "Environmental & Safety Compliance Manager",
      category: "Compliance",
      location: "Austin, US",
      workMode: "On-site",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 6 days ago",
      salaryMin: 120000,
      salaryMax: 155000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Jul 01",
      applyUrl: "#",
      tags: ["OSHA", "EPA"],
      verified: false,
    },
    {
      id: "disc-19",
      companyName: "TikTok",
      companyLogoText: "T",
      title: "Global Trust & Safety Policy Analyst",
      category: "Risk Management",
      location: "Singapore, SG",
      workMode: "Hybrid",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted yesterday",
      salaryMin: 105000,
      salaryMax: 135000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Jul 05",
      applyUrl: "#",
      tags: ["Policy", "Governance"],
      verified: true,
    },
    {
      id: "disc-20",
      companyName: "Binance",
      companyLogoText: "B",
      title: "Crypto Regulatory Compliance Officer",
      category: "Compliance",
      location: "Dubai, AE",
      workMode: "Remote",
      experienceLevel: "Senior (5-8y)",
      postedAtLabel: "Posted 2 days ago",
      salaryMin: 140000,
      salaryMax: 180000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Open indefinitely",
      applyUrl: "#",
      tags: ["VARA", "Crypto Compliance"],
      verified: true,
    },
    {
      id: "disc-21",
      companyName: "JPMorgan Chase",
      companyLogoText: "J",
      title: "Technology Audit Manager",
      category: "IT Audit",
      location: "Hong Kong, HK",
      workMode: "Hybrid",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 1 day ago",
      salaryMin: 125000,
      salaryMax: 160000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Jun 30",
      applyUrl: "#",
      tags: ["IT Audit", "Cloud Security", "FinTech"],
      verified: true,
    },
    {
      id: "disc-22",
      companyName: "EY",
      companyLogoText: "E",
      title: "Senior Manager - IT Risk & Audit",
      category: "IT Audit",
      location: "Sydney, AU",
      workMode: "On-site",
      experienceLevel: "Manager (8y+)",
      postedAtLabel: "Posted 2 days ago",
      salaryMin: 145000,
      salaryMax: 185000,
      salaryCurrency: "USD",
      applicationWindowLabel: "Closes Jul 15",
      applyUrl: "#",
      tags: ["IT Audit", "CISA", "GRC Tech"],
      verified: true,
    },
  ],
  filters: {
    categories: ["Risk Management", "IT Audit", "Compliance"],
    workModes: ["Remote", "Hybrid", "On-site"],
    experienceLevels: ["Senior (5-8y)", "Manager (8y+)"],
    salaryRange: {
      min: 80000,
      max: 250000,
    },
  },
  meta: {
    totalJobs: 1248,
  },
};

function convertSalary(value: number, currency: SupportedCurrency): number {
  return value * CURRENCY_RATES[currency];
}

function formatSalary(value: number, currency: SupportedCurrency): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(convertSalary(value, currency));
}

function DotToggle({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex h-[14px] w-[14px] shrink-0 rounded-full items-center justify-center transition-all duration-200 hover:shadow-[0_0_0_4px_rgba(0,168,150,0.15)]"
      style={{
        background: active ? TEAL : "#ffffff",
        border: active ? "none" : "1px solid #bfd0df",
        boxShadow: active ? "0 0 0 4px rgba(19, 213, 205, 0.08)" : "none",
      }}
    />
  );
}

function SearchField({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 items-center gap-3">
      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 22, color: TEAL_SOFT }}>
        {icon}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[0.95rem] outline-none"
        style={{ color: TEXT_PRIMARY, ...MANROPE }}
      />
    </label>
  );
}

function JobCard({ job, selectedCurrency }: { job: DiscoveryJob; selectedCurrency: SupportedCurrency }) {
  return (
    <article
      className="rounded-[20px] border px-5 py-5 md:px-6 md:py-6"
      style={{
        background: CARD,
        borderColor: BORDER,
        boxShadow: "0 18px 34px rgba(145, 170, 200, 0.14)",
      }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(180deg, #f4f2ea 0%, #d8dfdb 100%)",
              color: "#2c3a4f",
              fontWeight: 700,
              fontSize: "1rem",
              ...SYNE,
            }}
          >
            {job.companyLogoText}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.98rem] font-bold" style={{ color: TEAL_SOFT }}>
                {job.companyName}
              </span>
              {job.verified ? (
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: TEAL }}>
                  verified
                </span>
              ) : null}
            </div>

            <h3
              className="mt-1 text-[1.42rem] leading-tight md:text-[1.55rem]"
              style={{ color: TEXT_PRIMARY, fontWeight: 700, ...SYNE }}
            >
              {job.title}
            </h3>

            <div
              className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.84rem]"
              style={{ color: TEXT_SECONDARY }}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>location_on</span>
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  {job.workMode === "Remote" ? "wifi" : job.workMode === "Hybrid" ? "home_work" : "apartment"}
                </span>
                {job.workMode === "Remote" ? "Remote Friendly" : job.workMode}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                {job.postedAtLabel}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.16em]"
                  style={{
                    background: "#effcfc",
                    border: "1px solid #bceeed",
                    color: TEAL,
                    fontWeight: 700,
                    ...MONO,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:min-w-[208px] lg:text-right">
          <div className="text-[1.4rem]" style={{ color: "#24364d", fontWeight: 700, ...SYNE }}>
            {formatSalary(job.salaryMin, selectedCurrency)} - {formatSalary(job.salaryMax, selectedCurrency)}
          </div>
          <div
            className="mt-1 text-[0.68rem] uppercase tracking-[0.14em]"
            style={{
              color: job.applicationWindowLabel.toLowerCase().includes("open") ? TEAL_SOFT : AMBER,
              fontWeight: 700,
              ...MONO,
            }}
          >
            {job.applicationWindowLabel.toUpperCase()}
          </div>

          <a
            href={job.applyUrl}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[0.95rem] transition-all hover:scale-105 active:scale-95"
            style={{
              background: TEAL,
              color: "#05181d",
              fontWeight: 800,
              boxShadow: "0 12px 24px rgba(19, 213, 205, 0.18)",
            }}
          >
            Apply Now
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </a>
        </div>
      </div>
    </article>
  );
}

function JobGridCard({ job, selectedCurrency }: { job: DiscoveryJob; selectedCurrency: SupportedCurrency }) {
  return (
    <article
      className="flex flex-col rounded-[24px] border p-6 transition-all hover:shadow-[0_20px_40px_rgba(145,170,200,0.18)]"
      style={{
        background: CARD,
        borderColor: BORDER,
        boxShadow: "0 14px 28px rgba(145, 170, 200, 0.12)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(180deg, #f4f2ea 0%, #d8dfdb 100%)",
            color: "#2c3a4f",
            fontWeight: 700,
            fontSize: "0.9rem",
            ...SYNE,
          }}
        >
          {job.companyLogoText}
        </div>
        <div
          className="rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em]"
          style={{
            background: job.applicationWindowLabel.toLowerCase().includes("open") ? "rgba(0, 168, 150, 0.08)" : "rgba(244, 177, 26, 0.08)",
            color: job.applicationWindowLabel.toLowerCase().includes("open") ? TEAL_SOFT : AMBER,
            fontWeight: 700,
            ...MONO,
          }}
        >
          {job.applicationWindowLabel}
        </div>
      </div>

      <div className="mt-5 grow">
        <div className="flex items-center gap-1.5">
          <span className="text-[0.88rem] font-bold" style={{ color: TEAL_SOFT }}>
            {job.companyName}
          </span>
          {job.verified && (
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: TEAL }}>
              verified
            </span>
          )}
        </div>

        <h3 className="mt-1 text-[1.25rem] leading-snug" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...SYNE }}>
          {job.title}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.78rem]" style={{ color: TEXT_SECONDARY }}>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
            {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {job.workMode === "Remote" ? "wifi" : job.workMode === "Hybrid" ? "home_work" : "apartment"}
            </span>
            {job.workMode}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em]"
              style={{
                background: "#f0f9f9",
                border: "1px solid #c8eded",
                color: TEAL,
                fontWeight: 700,
                ...MONO,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t pt-5" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between">
          <div className="text-[1.15rem]" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...SYNE }}>
            {formatSalary(job.salaryMin, selectedCurrency)}
          </div>
          <a
            href={job.applyUrl}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[0.85rem] transition-all hover:scale-105 active:scale-95"
            style={{
              background: TEAL,
              color: "#05181d",
              fontWeight: 800,
              boxShadow: "0 8px 16px rgba(19, 213, 205, 0.15)",
            }}
          >
            Apply
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function JobsMarketplaceRefined() {
  const [data, setData] = useState<DiscoveryResponse>(FALLBACK_DISCOVERY_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [sourceLabel, setSourceLabel] = useState<"backend" | "fallback">("backend");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>("");
  const [selectedExperience, setSelectedExperience] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("USD");
  const [salaryCap, setSalaryCap] = useState(FALLBACK_DISCOVERY_RESPONSE.filters.salaryRange.max);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    let mounted = true;

    apiFetch<DiscoveryResponse>("/jobs/discover")
      .then((response) => {
        if (!mounted) return;
        setData(response);
        setSalaryCap(response.filters.salaryRange.max);
        setSourceLabel("backend");
      })
      .catch(() => {
        if (!mounted) return;
        setData(FALLBACK_DISCOVERY_RESPONSE);
        setSalaryCap(FALLBACK_DISCOVERY_RESPONSE.filters.salaryRange.max);
        setSourceLabel("fallback");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    return data.jobs.filter((job) => {
      const q = query.trim().toLowerCase();
      const loc = location.trim().toLowerCase();
      const catInput = categoryInput.trim().toLowerCase();

      const queryOk =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.companyName.toLowerCase().includes(q) ||
        job.tags.some((tag) => tag.toLowerCase().includes(q));

      const locationOk = !loc || job.location.toLowerCase().includes(loc);
      const categoryInputOk = !catInput || job.category.toLowerCase().includes(catInput);
      const categoryOk = !selectedCategory || job.category === selectedCategory;
      const workModeOk = !selectedWorkMode || job.workMode === selectedWorkMode;
      const experienceOk = !selectedExperience || job.experienceLevel === selectedExperience;
      const salaryOk = job.salaryMin <= salaryCap;

      return queryOk && locationOk && categoryInputOk && categoryOk && workModeOk && experienceOk && salaryOk;
    });
  }, [categoryInput, data.jobs, location, query, salaryCap, selectedCategory, selectedExperience, selectedWorkMode]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, location, categoryInput, selectedCategory, selectedWorkMode, selectedExperience, salaryCap]);

  function clearFilters() {
    setQuery("");
    setLocation("");
    setCategoryInput("");
    setSelectedCategory("");
    setSelectedWorkMode("");
    setSelectedExperience("");
    setSelectedCurrency("USD");
    setSalaryCap(data.filters.salaryRange.max);
  }

  const pageButtons = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, index) => String(index + 1))
    : ["1", "2", "3", "...", String(pageCount)];

  return (
    <section className="space-y-10" style={MANROPE}>
      <div
        className="overflow-hidden rounded-[34px] border"
        style={{
          background: SURFACE,
          borderColor: BORDER,
          boxShadow: "0 22px 48px rgba(170, 190, 214, 0.18)",
        }}
      >
        <div className="border-b px-6 py-4 md:px-8 md:py-5" style={{ borderColor: BORDER }}>
          <div className="grid grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div
              className="grid grid-cols-1 items-center gap-6 rounded-[24px] border px-5 py-3 md:grid-cols-[1fr_auto]"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                borderColor: BORDER,
              }}
            >
              <div className="grid min-w-0 grid-cols-1 items-center gap-4 md:grid-cols-[1fr_1px_0.9fr]">
                <SearchField icon="search" placeholder="Job Title, Keywords..." value={query} onChange={setQuery} />
                <div className="hidden h-10 md:block" style={{ width: 1, background: BORDER }} />
                <SearchField icon="location_on" placeholder="Location" value={location} onChange={setLocation} />
              </div>

              <button
                type="button"
                aria-label="Search jobs"
                className="inline-flex h-[50px] w-[50px] items-center justify-center justify-self-center rounded-full transition-transform hover:scale-110 active:scale-95 md:h-[54px] md:w-[54px] md:justify-self-end"
                style={{ background: TEAL, color: "#04141a" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>arrow_forward</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-5 xl:justify-end">
              <div className="text-right">
                <div className="text-[0.74rem] uppercase tracking-[0.28em]" style={{ color: TEAL_SOFT, fontWeight: 700, ...MONO }}>
                  Results
                </div>
                <div className="text-[1.03rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                  {filteredJobs.length.toLocaleString()} GRC jobs
                </div>
              </div>

              <div
                className="flex items-center gap-1 rounded-full border p-1"
                style={{
                  background: CARD,
                  borderColor: BORDER,
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all"
                  style={{
                    background: viewMode === "list" ? "rgba(18, 199, 191, 0.12)" : "transparent",
                    color: viewMode === "list" ? TEAL : TEXT_SECONDARY,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>view_agenda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all"
                  style={{
                    background: viewMode === "grid" ? "rgba(18, 199, 191, 0.12)" : "transparent",
                    color: viewMode === "grid" ? TEAL : TEXT_SECONDARY,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>grid_view</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 px-6 py-8 md:px-8 md:py-9 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-8">
          <div className="space-y-7">
            <aside
              className="rounded-[18px] border px-5 py-6"
              style={{
                background: PANEL,
                borderColor: BORDER,
              }}
            >
              <div className="space-y-8">
                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[0.82rem] uppercase tracking-[0.24em]" style={{ color: TEAL_SOFT, fontWeight: 700, ...MONO }}>
                      Category
                    </h3>
                    <span className="material-symbols-outlined" style={{ color: TEXT_SECONDARY, fontSize: 18 }}>expand_more</span>
                  </div>
                  <div className="mt-5 space-y-3.5">
                    {data.filters.categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory((current) => (current === category ? "" : category))}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <DotToggle active={selectedCategory === category} />
                        <span className="text-[0.97rem]" style={{ color: TEXT_PRIMARY }}>{category}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[0.82rem] uppercase tracking-[0.24em]" style={{ color: TEAL_SOFT, fontWeight: 700, ...MONO }}>
                      Work Mode
                    </h3>
                    <span className="material-symbols-outlined" style={{ color: TEXT_SECONDARY, fontSize: 18 }}>expand_more</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {data.filters.workModes.map((mode) => {
                      const active = selectedWorkMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSelectedWorkMode((current) => (current === mode ? "" : mode))}
                          className="rounded-full px-4 py-2 text-[0.77rem]"
                          style={{
                            background: active ? TEAL : CARD,
                            color: active ? "#04161a" : TEXT_PRIMARY,
                            border: active ? "none" : "1px solid #cad9e7",
                            fontWeight: 700,
                          }}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[0.82rem] uppercase tracking-[0.24em]" style={{ color: TEAL_SOFT, fontWeight: 700, ...MONO }}>
                      Salary Range
                    </h3>
                    <span className="material-symbols-outlined" style={{ color: TEXT_SECONDARY, fontSize: 18 }}>expand_more</span>
                  </div>
                  <div className="mt-5">
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {(Object.keys(CURRENCY_RATES) as SupportedCurrency[]).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setSelectedCurrency(curr)}
                          className="rounded-lg px-2.5 py-1 text-[0.68rem] font-bold transition-all"
                          style={{
                            background: selectedCurrency === curr ? TEAL : PANEL,
                            color: selectedCurrency === curr ? "#04161a" : TEXT_SECONDARY,
                            border: `1px solid ${selectedCurrency === curr ? TEAL : BORDER}`,
                            ...MONO,
                          }}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={data.filters.salaryRange.min}
                      max={data.filters.salaryRange.max}
                      step={5000}
                      value={salaryCap}
                      onChange={(e) => setSalaryCap(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: TEAL }}
                    />
                    <div className="mt-5 grid grid-cols-3 gap-2 text-[0.66rem]" style={{ color: TEAL_SOFT, fontWeight: 700, ...MONO }}>
                      <span className="text-left">{formatSalary(data.filters.salaryRange.min, selectedCurrency)}</span>
                      <span className="text-center">{formatSalary(Math.max(salaryCap, data.filters.salaryRange.min), selectedCurrency)}</span>
                      <span className="text-right">{formatSalary(data.filters.salaryRange.max, selectedCurrency)}+</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[0.82rem] uppercase tracking-[0.24em]" style={{ color: TEAL_SOFT, fontWeight: 700, ...MONO }}>
                      Experience Level
                    </h3>
                    <span className="material-symbols-outlined" style={{ color: TEXT_SECONDARY, fontSize: 18 }}>expand_more</span>
                  </div>
                  <div className="mt-5 space-y-3.5">
                    {data.filters.experienceLevels.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedExperience((current) => (current === level ? "" : level))}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <DotToggle active={selectedExperience === level} />
                        <span className="text-[0.97rem]" style={{ color: TEXT_PRIMARY }}>{level}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </aside>

            <button
              type="button"
              onClick={clearFilters}
              className="group flex w-full items-center justify-center gap-3 rounded-full px-7 py-3.5 text-[0.8rem] uppercase tracking-[0.2em] transition-all hover:scale-[1.05] active:scale-95"
              style={{
                background: TEAL,
                color: "#05181d",
                fontWeight: 800,
                boxShadow: "0 12px 24px rgba(19, 213, 205, 0.18)",
                ...MONO,
              }}
            >
              <span className="material-symbols-outlined text-[22px] transition-transform group-hover:rotate-180">
                restart_alt
              </span>
              CLEAR ALL FILTERS
            </button>
          </div>

          <div className="min-w-0 space-y-6">
            {loading ? (
              <div className="rounded-[20px] border px-8 py-8" style={{ background: CARD, borderColor: BORDER, color: TEXT_SECONDARY }}>
                Loading jobs...
              </div>
            ) : paginatedJobs.length > 0 ? (
              viewMode === "list" ? (
                <div className="space-y-6">
                  {paginatedJobs.map((job) => (
                    <JobCard key={job.id} job={job} selectedCurrency={selectedCurrency} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {paginatedJobs.map((job) => (
                    <JobGridCard key={job.id} job={job} selectedCurrency={selectedCurrency} />
                  ))}
                </div>
              )
            ) : (
              <div
                className="flex flex-col items-center justify-center rounded-[24px] border px-8 py-12 text-center"
                style={{
                  background: "linear-gradient(90deg, rgba(0, 168, 150, 0.12) 0%, rgba(0, 168, 150, 0.05) 100%)",
                  borderColor: "rgba(0, 168, 150, 0.34)",
                  color: TEAL,
                }}
              >
                <span className="material-symbols-outlined mb-3" style={{ fontSize: 48, opacity: 0.8 }}>
                  search_off
                </span>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", ...SYNE }}>No matching jobs found</div>
                <p className="mt-2 text-[0.92rem]" style={{ color: TEXT_SECONDARY, maxWidth: "300px" }}>
                  Try adjusting your filters or search keywords to find more opportunities.
                </p>
              </div>
            )}

            {sourceLabel === "fallback" ? (
              <div className="text-[0.8rem]" style={{ color: TEXT_MUTED }}>
                Showing safe fallback discovery data while the backend route is unavailable in the current server process.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
            style={{
              background: CARD,
              borderColor: BORDER,
              color: TEAL_SOFT,
            }}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <div
            className="flex items-center gap-2 rounded-full border px-3 py-2"
            style={{
              background: PANEL,
              borderColor: BORDER,
            }}
          >
            {pageButtons.map((value, index) => {
              const isCurrent = value === String(currentPage);
              const isEllipsis = value === "...";
              return (
                <button
                  key={`${value}-${index}`}
                  type="button"
                  disabled={isEllipsis}
                  onClick={() => {
                    if (!isEllipsis) setPage(Number(value));
                  }}
                  className="h-10 w-10 rounded-full text-[0.95rem]"
                  style={{
                    background: isCurrent ? TEAL : "transparent",
                    color: isCurrent ? "#06171b" : TEXT_SECONDARY,
                    fontWeight: isCurrent ? 800 : 700,
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={currentPage === pageCount}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
            style={{
              background: CARD,
              borderColor: BORDER,
              color: TEAL_SOFT,
            }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      ) : null}

      <footer
        className="flex flex-col gap-5 rounded-[26px] border px-6 py-6 lg:flex-row lg:items-center lg:justify-between"
        style={{
          background: CARD,
          borderColor: BORDER,
        }}
      >
        <div className="flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ background: TEAL, color: "#06161b" }}>
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <div>
            <div className="text-[1.1rem]" style={{ color: TEXT_PRIMARY, fontWeight: 700, ...SYNE }}>
              GRC <span style={{ color: TEAL }}>Openings</span>
            </div>
            <p className="mt-1 max-w-[620px] text-[0.96rem]" style={{ color: TEXT_SECONDARY }}>
              The leading niche job board for governance, risk, and compliance professionals worldwide.
              Trusted by 500+ global enterprises.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5" style={{ color: TEAL_SOFT }}>
          <span className="material-symbols-outlined">language</span>
          <span className="material-symbols-outlined">mail</span>
          <span className="material-symbols-outlined">hub</span>
        </div>
      </footer>
    </section>
  );
}

