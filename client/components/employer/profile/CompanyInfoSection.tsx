import React from "react";
import type { EmployerProfileData } from "./types";
import { INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS } from "./types";
import { SectionCard, Field, SelectField } from "./shared";

interface Props {
  data: Pick<
    EmployerProfileData,
    "companyName" | "industry" | "companySize" | "foundedYear" | "website"
  >;
  onChange: (updates: Partial<EmployerProfileData>) => void;
  errors?: Record<string, string>;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 1899 }, (_, i) =>
  String(currentYear - i)
);

export function CompanyInfoSection({ data, onChange, errors = {} }: Props) {
  return (
    <SectionCard icon="business" title="Company Information">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="companyName"
          label="Company Name"
          required
          value={data.companyName}
          error={errors.companyName}
          onChange={(v) => onChange({ companyName: v })}
          placeholder="Acme Corp Recruitment"
          colSpan
        />
        <SelectField
          id="industry"
          label="Industry / Category"
          required
          value={data.industry}
          error={errors.industry}
          onChange={(v) => onChange({ industry: v })}
          options={INDUSTRY_OPTIONS}
          placeholder="Select industry..."
        />
        <SelectField
          id="companySize"
          label="Company Size"
          required
          value={data.companySize}
          error={errors.companySize}
          onChange={(v) => onChange({ companySize: v })}
          options={COMPANY_SIZE_OPTIONS}
          placeholder="Select size..."
        />
        <SelectField
          id="foundedYear"
          label="Founded Year"
          required
          value={data.foundedYear}
          error={errors.foundedYear}
          onChange={(v) => onChange({ foundedYear: v })}
          options={YEAR_OPTIONS}
          placeholder="Select year..."
        />
        <Field
          id="website"
          label="Company Website"
          value={data.website}
          error={errors.website}
          onChange={(v) => {
            // Trim whitespace immediately
            onChange({ website: v.trim() });
          }}
          placeholder="https://acmecorp.com"
          type="url"
          colSpan
          hint="Include https:// for external links to work correctly"
        />
      </div>
    </SectionCard>
  );
}
