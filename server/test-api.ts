import fs from 'fs';

async function testAPIs() {
  console.log('Testing Apollo...');
  try {
    const apolloRes = await fetch('https://api.apollo.io/v1/organizations/search?q_organization_name=Stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ api_key: "cI2N2hY7mJ6gD5cO0uA0xU4lQ7tG4nE6" }),
    });
    console.log('Apollo status:', apolloRes.status);
    const apolloData = await apolloRes.text();
    console.log('Apollo body:', apolloData.substring(0, 300));
  } catch (err: any) {
    console.error('Apollo error:', err.message);
  }

  console.log('\nTesting Render AI API...');
  try {
    const formData = new FormData();
    const pdfBlob = new Blob(['%PDF-1.4 dummy pdf content'], { type: 'application/pdf' });
    formData.append('resume', pdfBlob, 'dummy.pdf');
    formData.append('job_description', 'We are looking for a senior GRC engineer with 5 years of experience in compliance and risk management. Must know ISO 27001.');
    formData.append('style', 'modern');

    const aiRes = await fetch('https://resume-enhancer-fmp3.onrender.com/api/resume/enhance', {
      method: 'POST',
      body: formData,
    });
    console.log('Render AI status:', aiRes.status);
    const aiData = await aiRes.text();
    console.log('Render AI body:', aiData.substring(0, 500));
  } catch (err: any) {
    console.error('Render AI error:', err.message);
  }
}

testAPIs();
