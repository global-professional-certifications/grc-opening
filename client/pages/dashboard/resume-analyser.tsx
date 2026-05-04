import React, { useEffect } from "react";
import Head from "next/head";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { ResumeAnalyser } from "../../modules/resume-analyser/ResumeAnalyser";

export default function ResumeAnalyserPage() {
  // Hide the global auth theme toggle on dashboard pages
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => { if (toggle) toggle.style.display = ""; };
  }, []);

  return (
    <DashboardLayout>
      <Head>
        <title>AI Resume Enhancer | GRC Openings</title>
        <meta
          name="description"
          content="Enhance your GRC resume with AI. Upload your resume, paste a job description, and get a tailored, ATS-optimized version in seconds."
        />
      </Head>

      <header className="mb-8">
        <h2 className="text-3xl font-bold" style={{ color: "var(--db-text)" }}>
          AI Resume Enhancer
        </h2>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
          Tailor your resume for any GRC role — powered by AI
        </p>
      </header>

      <ResumeAnalyser isPublic={false} />
    </DashboardLayout>
  );
}
