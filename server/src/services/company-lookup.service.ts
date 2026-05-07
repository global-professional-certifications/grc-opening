export interface CompanyLookupResult {
  companyName: string;
  industry?: string;
  companySize?: string;
  description?: string;
  website?: string;
  foundedYear?: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export class CompanyLookupService {
  private apolloKey = process.env.APOLLO_API_KEY;
  private openCorpToken = process.env.OPENCORPORATES_API_TOKEN;

  async lookupCompany(query: string): Promise<CompanyLookupResult | null> {
    if (!query || query.trim().length < 2) return null;
    const name = query.trim();

    let result: CompanyLookupResult = { companyName: name };
    let apolloSuccess = false;

    // 1. Try Apollo.io Search API first (rich business data)
    if (this.apolloKey) {
      try {
        const apolloRes = await fetch(
          `https://api.apollo.io/api/v1/organizations/search?q_organization_name=${encodeURIComponent(name)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Api-Key': this.apolloKey,
            },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(10000) as any,
          }
        );

        if (apolloRes.ok) {
          const data: any = await apolloRes.json();
          if (data.organizations && data.organizations.length > 0) {
            const org = data.organizations[0];
            result = this.mapApolloData(org);
            apolloSuccess = true;
          }
        } else {
          console.error(`[Apollo] Error ${apolloRes.status}:`, await apolloRes.text().catch(() => ''));
        }
      } catch (err) {
        console.error('[Apollo] Search failed:', err);
      }
    }

    // 2. Try OpenCorporates if Apollo failed or if we want to supplement legal data
    // OpenCorporates requires a token.
    if (this.openCorpToken && !apolloSuccess) {
      try {
        const ocRes = await fetch(
          `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(name)}&api_token=${this.openCorpToken}&per_page=1`,
          { signal: AbortSignal.timeout(5000) as any }
        );

        if (ocRes.ok) {
          const data: any = await ocRes.json();
          if (data.results?.companies?.length > 0) {
            const company = data.results.companies[0].company;
            result = {
              ...result, // keep existing name/fallback
              ...this.mapOpenCorpData(company)
            };
          }
        } else {
          console.error(`[OpenCorp] Error ${ocRes.status}:`, await ocRes.text().catch(() => ''));
        }
      } catch (err) {
        console.error('[OpenCorp] Search failed:', err);
      }
    }

    if (!result.website && !result.description && !result.foundedYear && !result.address && !result.country && !apolloSuccess) {
      // If we didn't find anything meaningful, just return null so frontend knows to say "Not found"
      return null;
    }

    return result;
  }

  private mapApolloData(org: any): CompanyLookupResult {
    let sizeRange = '';
    if (org.estimated_num_employees) {
      const emp = org.estimated_num_employees;
      if (emp < 50) sizeRange = "1-50";
      else if (emp < 200) sizeRange = "51-200";
      else if (emp < 1000) sizeRange = "201-1000";
      else if (emp < 5000) sizeRange = "1001-5000";
      else if (emp < 10000) sizeRange = "5001-10000";
      else sizeRange = "10000+";
    }

    return {
      companyName: org.name,
      industry: org.industry || org.sector,
      companySize: sizeRange,
      description: org.short_description || org.seo_description,
      website: org.website_url,
      foundedYear: org.founded_year?.toString(),
      logoUrl: org.logo_url,
      address: org.street_address,
      city: org.city,
      state: org.state,
      country: org.country,
    };
  }

  private mapOpenCorpData(company: any): Partial<CompanyLookupResult> {
    const data: Partial<CompanyLookupResult> = {};
    if (company.incorporation_date) {
      data.foundedYear = company.incorporation_date.substring(0, 4);
    }
    if (company.registered_address_in_full) {
      data.address = company.registered_address_in_full;
    }
    if (company.jurisdiction_code) {
      // rough mapping e.g., us_de -> US
      const code = company.jurisdiction_code.split('_')[0].toUpperCase();
      data.country = code;
    }
    return data;
  }
}
