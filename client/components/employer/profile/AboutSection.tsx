import React from "react";
import type { EmployerProfileData } from "./types";
import { SectionCard, Field, TextareaField } from "./shared";

interface Props {
  data: Pick<EmployerProfileData, "tagline" | "description">;
  onChange: (updates: Partial<EmployerProfileData>) => void;
  errors?: Record<string, string>;
}

export function AboutSection({ data, onChange, errors = {} }: Props) {
  return (
    <SectionCard icon="article" title="About the Company">
      <div className="grid grid-cols-1 gap-4">
        <Field
          id="tagline"
          label="Tagline"
          value={data.tagline}
          error={errors.tagline}
          onChange={(v) => onChange({ tagline: v })}
          placeholder="Connecting GRC professionals with the opportunities that define careers"
          hint="A short, compelling one-liner shown on your public profile"
        />
        <TextareaField
          id="description"
          label="Company Description"
          required
          value={data.description}
          error={errors.description}
          onChange={(v) => onChange({ description: v })}
          placeholder="Tell candidates about your company's mission, culture, the types of GRC roles you hire for, why top professionals choose to work with you, and what makes your team unique..."
          rows={6}
          maxChars={1000}
        />
      </div>
    </SectionCard>
  );
}
