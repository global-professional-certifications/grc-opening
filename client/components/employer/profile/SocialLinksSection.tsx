import React from "react";
import type { EmployerProfileData } from "./types";
import { SectionCard, Field, BASE_INPUT, LABEL_STYLE, MONO } from "./shared";

interface Props {
  data: Pick<EmployerProfileData, "linkedInUrl" | "twitterUrl" | "otherUrl">;
  onChange: (updates: Partial<EmployerProfileData>) => void;
  errors?: Record<string, string>;
}

function LinkPreview({ url, label }: { url: string; label: string }) {
  if (!url) return null;
  const href = url.startsWith("http") ? url : `https://${url}`;
  const display = url.replace(/^https?:\/\/(www\.)?/, "");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs mt-1.5 w-fit"
      style={{ ...MONO, color: "var(--db-primary)" }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
      {display || label}
    </a>
  );
}

export function SocialLinksSection({ data, onChange, errors = {} }: Props) {
  return (
    <SectionCard icon="link" title="Social & Links">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* LinkedIn */}
        <div>
          <Field
            id="linkedInUrl"
            label="LinkedIn Company Page"
            value={data.linkedInUrl}
            error={errors.linkedInUrl}
            onChange={(v) => onChange({ linkedInUrl: v.trim() })}
            placeholder="linkedin.com/company/techcorp"
          />
          <LinkPreview url={data.linkedInUrl} label="LinkedIn" />
        </div>

        {/* Twitter / X */}
        <div>
          <Field
            id="twitterUrl"
            label="Twitter / X"
            value={data.twitterUrl}
            error={errors.twitterUrl}
            onChange={(v) => onChange({ twitterUrl: v.trim() })}
            placeholder="twitter.com/techcorp"
          />
          <LinkPreview url={data.twitterUrl} label="Twitter" />
        </div>

        {/* Other link */}
        <div className="sm:col-span-2">
          <Field
            id="otherUrl"
            label="Other Link (blog, careers page, etc.)"
            value={data.otherUrl}
            error={errors.otherUrl}
            onChange={(v) => onChange({ otherUrl: v.trim() })}
            placeholder="https://careers.techcorp.com"
            type="url"
          />
          <LinkPreview url={data.otherUrl} label="Link" />
        </div>
      </div>

      {/* Helper note */}
      <p className="text-[10px] mt-1" style={{ ...MONO, color: "var(--db-text-muted)" }}>
        At least one social or web link is required to complete your profile.
      </p>
    </SectionCard>
  );
}
