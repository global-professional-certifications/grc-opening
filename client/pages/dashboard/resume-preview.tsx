import { useRouter } from "next/router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const SYNE = { fontFamily: "'Syne', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };

/** Returns true only for files the browser can natively render in an iframe. */
function isPdfFile(fileName: string | null): boolean {
  if (!fileName) return true; // no name → assume PDF (legacy URLs without ?name=)
  return fileName.toLowerCase().endsWith(".pdf");
}

export default function ResumePreviewPage() {
  const router = useRouter();

  const resumeUrl =
    typeof router.query.url === "string" ? router.query.url : null;
  const resumeFileName =
    typeof router.query.name === "string" ? router.query.name : null;

  const canPreview = isPdfFile(resumeFileName);

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-semibold"
            style={{ ...SYNE, color: "var(--db-text)" }}
          >
            Resume Preview
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Viewing your uploaded resume.
          </p>
        </div>

        {/* Fix: always navigate to /dashboard/profile instead of router.back().
            This page is opened in a new tab (_blank) so history is empty —
            router.back() would silently do nothing. */}
        <button
          onClick={() => router.push("/dashboard/profile")}
          className="db-btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: "var(--db-btn-sec)",
            color: "var(--db-text-secondary)",
            border: "1px solid var(--db-border)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_back
          </span>
          Back to Profile
        </button>
      </header>

      {/* ── No URL provided ─────────────────────────────────── */}
      {!resumeUrl && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-3"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--db-text-muted)" }}
          >
            description_off
          </span>
          <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
            No resume URL provided
          </p>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            Return to your profile and upload a resume first.
          </p>
        </div>
      )}

      {/* ── PDF — render in iframe ───────────────────────────── */}
      {resumeUrl && canPreview && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            height: "calc(100vh - 200px)",
            minHeight: 480,
          }}
        >
          <iframe
            src={resumeUrl}
            className="w-full h-full"
            title="Resume Preview"
            style={{ border: "none" }}
          />
        </div>
      )}

      {/* ── Non-PDF (DOC / DOCX / etc.) — browser can't render these ── */}
      {resumeUrl && !canPreview && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", minHeight: 480 }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.12)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36, color: "#3b82f6" }}
            >
              description
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {resumeFileName ?? "Document"}
            </p>
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              This file format cannot be previewed in the browser.
            </p>
          </div>

          <p className="text-xs px-6" style={{ ...MONO, color: "var(--db-text-muted)" }}>
            Supported preview format: <strong style={{ color: "var(--db-text)" }}>PDF</strong>.
            &nbsp;For Word documents, download the file and open it locally.
          </p>

          <a
            href={resumeUrl}
            download={resumeFileName ?? "resume"}
            className="db-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--db-primary)", color: "var(--db-primary-text)", textDecoration: "none" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              download
            </span>
            Download File
          </a>
        </div>
      )}
    </DashboardLayout>
  );
}
