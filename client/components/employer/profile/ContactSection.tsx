import React, { useState } from "react";
import { Country, State, City } from "country-state-city";
import type { EmployerProfileData } from "./types";
import { SectionCard, Field, SelectField, ComboboxField, BASE_INPUT, LABEL_STYLE, MONO } from "./shared";

interface Props {
  data: Pick<
    EmployerProfileData,
    "contactName" | "contactEmail" | "contactPhone" | "contactPhoneCode" | "address" | "city" | "state" | "stateCode" | "country" | "countryCode"
  >;
  onChange: (updates: Partial<EmployerProfileData>) => void;
  errors?: Record<string, string>;
}

const COUNTRY_CODES = [
  { code: "+1", label: "US/CA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "AU (+61)" },
  { code: "+91", label: "IN (+91)" },
  { code: "+49", label: "DE (+49)" },
  { code: "+33", label: "FR (+33)" },
];

export function ContactSection({ data, onChange, errors = {} }: Props) {
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  // Geographic lookups
  const allCountries = Country.getAllCountries().map((c) => ({
    label: c.name,
    value: c.isoCode,
  }));

  const allStates = data.countryCode
    ? State.getStatesOfCountry(data.countryCode).map((s) => ({
        label: s.name,
        value: s.isoCode,
      }))
    : [];

  const allCities = data.stateCode && data.countryCode
    ? City.getCitiesOfState(data.countryCode, data.stateCode).map((c) => ({
        label: c.name,
        value: c.name,
      }))
    : [];

  // Handlers
  const handleCountryChange = (isoCode: string) => {
    const countryObj = Country.getCountryByCode(isoCode);
    onChange({
      countryCode: isoCode,
      country: countryObj?.name || "",
      stateCode: "",
      state: "",
      city: "",
    });
  };

  const handleStateChange = (stateIso: string) => {
    if (!data.countryCode) return;
    const stateObj = State.getStateByCodeAndCountry(stateIso, data.countryCode);
    onChange({
      stateCode: stateIso,
      state: stateObj?.name || "",
      city: "",
    });
  };

  const handleCityChange = (cityName: string) => {
    onChange({ city: cityName });
  };

  const phoneError = errors.contactPhone || errors.contactPhoneCode;

  return (
    <SectionCard icon="contacts" title="Contact Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="contactName"
          label="Contact Person Name"
          required
          value={data.contactName}
          error={errors.contactName}
          onChange={(v) => {
            // Only alphabets + spaces
            const sanitized = v.replace(/[^a-zA-Z\s]/g, "");
            onChange({ contactName: sanitized });
          }}
          placeholder="Jane Smith"
        />
        <Field
          id="contactEmail"
          label="Contact Email"
          required
          value={data.contactEmail}
          error={errors.contactEmail}
          onChange={(v) => onChange({ contactEmail: v.trim() })}
          placeholder="hiring@techcorp.com"
          type="email"
        />
        
        {/* Phone number with country code */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <label htmlFor="contactPhone" style={LABEL_STYLE}>
            Phone Number <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={data.contactPhoneCode || "+1"}
              onChange={(e) => onChange({ contactPhoneCode: e.target.value, contactPhone: "" })}
              onFocus={() => setCodeFocused(true)}
              onBlur={() => setCodeFocused(false)}
              style={{
                ...BASE_INPUT,
                width: "125px",
                borderColor: phoneError ? "#ef4444" : codeFocused ? "var(--db-primary)" : "var(--db-border)",
                boxShadow: codeFocused ? (phoneError ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                paddingRight: "28px",
              }}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              id="contactPhone"
              type="tel"
              value={data.contactPhone || ""}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d\s-()]/g, ""); // strip invalid chars generally
                if (data.contactPhoneCode === "+91") {
                  // Strictly 10 digits
                  v = e.target.value.replace(/\D/g, "").slice(0, 10);
                }
                onChange({ contactPhone: v });
              }}
              placeholder={data.contactPhoneCode === "+91" ? "9876543210" : "(555) 000-0000"}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              style={{
                ...BASE_INPUT,
                flex: 1,
                borderColor: phoneError ? "#ef4444" : phoneFocused ? "var(--db-primary)" : "var(--db-border)",
                boxShadow: phoneFocused ? (phoneError ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "0 0 0 3px var(--db-primary-10)") : "none",
              }}
            />
          </div>
          {phoneError && (
            <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "#ef4444" }}>
              {phoneError}
            </p>
          )}
          {!phoneError && (
             <p className="text-[10px] mt-1.5" style={{ ...MONO, color: "var(--db-text-muted)" }}>
               {data.contactPhoneCode === "+91" ? "Requires exactly 10 digits" : "Valid international format"}
             </p>
          )}
        </div>

        <Field
          id="address"
          label="Street Address"
          value={data.address}
          error={errors.address}
          onChange={(v) => onChange({ address: v })}
          placeholder="123 Main Street"
        />

        {/* Dynamic Geography Selects */}
        <SelectField
          id="countryCode"
          label="Country"
          required
          value={data.countryCode || ""}
          error={errors.countryCode || errors.country}
          onChange={handleCountryChange}
          placeholder="Select Country..."
          options={allCountries}
        />

        <SelectField
          id="stateCode"
          label="State / Province"
          required
          value={data.stateCode || ""}
          error={errors.stateCode || errors.state}
          onChange={handleStateChange}
          placeholder={allStates.length ? "Select State..." : "No states available"}
          disabled={!data.countryCode || allStates.length === 0}
          options={allStates}
        />

        <ComboboxField
          id="city"
          label="City"
          required
          value={data.city || ""}
          error={errors.city}
          onChange={(v) => onChange({ city: v })}
          placeholder="Type or select city..."
          options={allCities}
          hint={!data.stateCode ? "Select a state first to see suggestions" : ""}
        />

      </div>
    </SectionCard>
  );
}
