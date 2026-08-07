import { NextResponse } from "next/server";

/**
 * Cron endpoint for automated LinkedIn job ingestion.
 * Configure in vercel.json or call from an external scheduler.
 * 
 * Example vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/ingest-jobs",
 *     "schedule": "0 6 * * 1"  // Every Monday at 6 AM UTC
 *   }]
 * }
 */

const TARGET_COMPANIES = [
  "TCS",
  "Infosys",
  "Wipro",
  "Capgemini",
  "Cognizant",
  "Accenture",
  "Tech Mahindra",
  "HCLTech",
  "LTIMindtree",
  "Persistent Systems",
];

export async function GET(req: Request) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the scraper endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/jobs/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companies: TARGET_COMPANIES,
        location: "Pune, India",
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      companiesProcessed: TARGET_COMPANIES.length,
      ...result,
    });
  } catch (error: any) {
    console.error("Cron Ingestion Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
