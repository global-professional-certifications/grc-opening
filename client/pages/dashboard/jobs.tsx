import React, { useEffect } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { JobsMarketplaceRefined } from "../../modules/dashboard/jobs/JobsMarketplaceRefined";

export default function DashboardJobsPage() {
  useEffect(() => {
    const toggle = document.querySelector<HTMLElement>(".theme-toggle");
    if (toggle) toggle.style.display = "none";
    return () => {
      if (toggle) toggle.style.display = "";
    };
  }, []);

  return (
    <DashboardLayout>
      <JobsMarketplaceRefined />
    </DashboardLayout>
  );
}
