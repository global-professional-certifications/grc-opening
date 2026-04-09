import { useEffect } from 'react';
import Head from 'next/head';
import { EmployerDashboardLayout } from '../../../components/layout/EmployerDashboardLayout';
import { ActiveJobListings } from '../../../modules/employer/dashboard/ActiveJobListings';

export default function MyJobListingsPage() {
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>('.theme-toggle');
    if (toggle) toggle.style.display = 'none';
    return () => {
      if (toggle) toggle.style.display = '';
    };
  }, []);

  return (
    <EmployerDashboardLayout>
      <Head>
        <title>My Job Listings | GRC Openings</title>
        <meta name="description" content="Manage your active and closed job postings on GRC Openings." />
      </Head>

      {/* Page header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "'Syne', sans-serif", color: 'var(--db-text)' }}
        >
          My Job Listings
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--db-text-muted)' }}>
          All jobs you&apos;ve posted — active, closed, and drafts.
        </p>
      </div>

      {/* Job table — reads from EmployerJobsContext (shared store) */}
      <ActiveJobListings />
    </EmployerDashboardLayout>
  );
}
