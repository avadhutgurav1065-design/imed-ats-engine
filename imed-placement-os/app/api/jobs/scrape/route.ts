import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * LinkedIn Job Scraper via RapidAPI
 * 
 * To activate: 
 * 1. Sign up at https://rapidapi.com
 * 2. Subscribe to a LinkedIn Jobs API (e.g., "LinkedIn Jobs Search" by jaypat)
 * 3. Add RAPIDAPI_KEY and RAPIDAPI_HOST to your .env.local
 */
export async function POST(req: Request) {
  try {
    const { companies, location } = await req.json();

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { error: "Provide an array of company names" },
        { status: 400 }
      );
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST || "linkedin-jobs-search.p.rapidapi.com";

    if (!rapidApiKey) {
      return NextResponse.json(
        {
          error: "RAPIDAPI_KEY not configured. Add it to .env.local to enable LinkedIn scraping.",
          stubMode: true,
          message: "Scraper is in stub mode — configure RapidAPI credentials to activate.",
        },
        { status: 501 }
      );
    }

    const results: any[] = [];

    for (const company of companies) {
      try {
        // Call RapidAPI LinkedIn Jobs endpoint
        const response = await fetch(
          `https://${rapidApiHost}/search?query=${encodeURIComponent(company + " " + (location || "India"))}&num_pages=1`,
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": rapidApiKey,
              "X-RapidAPI-Host": rapidApiHost,
            },
          }
        );

        if (!response.ok) {
          results.push({ company, status: "error", message: `API returned ${response.status}` });
          continue;
        }

        const jobs = await response.json();

        // Process each scraped job
        for (const job of (Array.isArray(jobs) ? jobs : jobs.data || []).slice(0, 5)) {
          const rawRequirements =
            job.job_description || job.description || job.summary || "";
          const roleTitle = job.job_title || job.title || "Unknown Role";

          if (!rawRequirements || rawRequirements.length < 50) continue;

          // Check for duplicates
          const { data: existing } = await supabase
            .from("corporate_jobs")
            .select("id")
            .eq("company_name", company)
            .eq("role_title", roleTitle)
            .limit(1);

          if (existing && existing.length > 0) continue;

          // Vectorize via Gemini Embedding
          const embeddingModel = genAI.getGenerativeModel({
            model: "text-embedding-004",
          });
          const embedResult = await embeddingModel.embedContent(rawRequirements);
          const embedding = embedResult.embedding.values;

          // Store in pgvector
          const { error: dbError } = await supabase.from("corporate_jobs").insert({
            company_name: company,
            role_title: roleTitle,
            raw_requirements: rawRequirements.substring(0, 5000),
            embedding,
          });

          if (!dbError) {
            results.push({ company, role: roleTitle, status: "ingested" });
          }
        }
      } catch (companyError: any) {
        results.push({ company, status: "error", message: companyError.message });
      }
    }

    return NextResponse.json({
      success: true,
      ingested: results.filter((r) => r.status === "ingested").length,
      results,
    });
  } catch (error: any) {
    console.error("LinkedIn Scraper Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
