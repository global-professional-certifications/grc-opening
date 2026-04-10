import React, { useState } from "react";
import type { EmployerProfileData } from "./types";
import { SectionCard, Field, BASE_INPUT, LABEL_STYLE, MONO } from "./shared";

interface Props {
  data: Pick<EmployerProfileData, "linkedInUrl" | "twitterUrl" | "otherUrl" | "customLinks">;
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
      className="flex items-center gap-1.5 text-xs hover:underline mt-1.5 w-fit"
      style={{ ...MONO, color: "var(--db-primary)" }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
      {display || label}
    </a>
  );
}

interface ExtraLinkFieldProps {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  error?: string;
}

function ExtraLinkField({ index, value, onChange, onRemove, error }: ExtraLinkFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="sm:col-span-2">
      <label style={LABEL_STYLE}>Additional Link {index + 1}</label>
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...BASE_INPUT,
            flex: 1,
            borderColor: error ? "#ef4444" : focused ? "var(--db-primary)" : "var(--db-border)",
            boxShadow: focused ? (error ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
          }}
        />
        <button
          type="button"
          onClick={onRemove}
          title="Remove link"
          className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
          style={{
            background: "rgba(239,68,68,0.08)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>
      {error && (
        <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#ef4444" }}>
          {error}
        </p>
      )}
      {value && !error && <LinkPreview url={value} label={`Link ${index + 1}`} />}
    </div>
  );
}

export function SocialLinksSection({ data, onChange, errors = {} }: Props) {
  const customLinks = data.customLinks ?? [];

  function addLink() {
    onChange({ customLinks: [...customLinks, ""] });
  }

  function updateLink(i: number, val: string) {
    const next = [...customLinks];
    next[i] = val;
    onChange({ customLinks: next });
  }

  function removeLink(i: number) {
    const next = customLinks.filter((_, idx) => idx !== i);
    onChange({ customLinks: next });
  }

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

        {/* Dynamic extra links */}
        {customLinks.map((link, i) => (
          <ExtraLinkField
            key={i}
            index={i}
            value={link}
            error={errors[`customLink_${i}`]}
            onChange={(v) => updateLink(i, v.trim())}
            onRemove={() => removeLink(i)}
          />
        ))}

        {/* Add More Links button */}
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={addLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: "var(--db-primary-10)",
              color: "var(--db-primary)",
              border: "1.5px dashed var(--db-primary-20)",
              width: "100%",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--db-primary-20)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--db-primary-10)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            + Add More Links
          </button>
        </div>
      </div>

      {/* Helper note */}
      <p className="text-[10px] mt-1" style={{ ...MONO, color: "var(--db-text-muted)" }}>
        At least one social or web link is required to complete your profile.
      </p>
    </SectionCard>
  );
}
