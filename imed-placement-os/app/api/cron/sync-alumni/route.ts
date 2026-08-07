import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini and Supabase
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass RLS in cron
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // 1. Verify Vercel Cron Authentication (Security)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch alumni who have a LinkedIn URL
    const { data: alumni, error: fetchError } = await supabase
      .from('alumni_profiles')
      .select('id, linkedin_url')
      .not('linkedin_url', 'is', null);

    if (fetchError) throw fetchError;
    if (!alumni || alumni.length === 0) {
      return NextResponse.json({ message: 'No alumni to sync.' });
    }

    let updatedCount = 0;

    // 3. Process each alumni (in a real scenario with 1000s, you might use queues or pagination, but we do simple loop for now)
    for (const person of alumni) {
      try {
        if (!person.linkedin_url) continue;

        // --- SCRAPING PLACEHOLDER ---
        // Here you would call Proxycurl, RapidAPI, or an internal scraper service:
        // const rawScrapedData = await fetch(`https://your-scraper-api?url=${person.linkedin_url}`).then(r => r.text());
        
        // For demonstration, we simulate raw scraped text:
        const simulatedRawScrapedData = `
          Experience:
          - Software Engineer at Microsoft (Jan 2023 - Present)
          - Intern at LocalStartup (2022)
          Skills: TypeScript, React, System Architecture.
        `;

        // 4. Use Gemini AI to extract current company and role from unstructured scraped text
        const prompt = `
          Extract the CURRENT role title and CURRENT company name from the following scraped LinkedIn profile data.
          Return ONLY a JSON object with exactly these keys: "role_title", "current_company".
          If you cannot find it, return null for those fields. Do not use markdown blocks.

          Scraped Data:
          ${simulatedRawScrapedData}
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const result = await model.generateContent(prompt);
        let extractedData = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(extractedData);

        // 5. Update the alumni record in Supabase
        if (parsed.current_company || parsed.role_title) {
           await supabase
            .from('alumni_profiles')
            .update({
              current_company: parsed.current_company,
              role_title: parsed.role_title,
              last_synced_at: new Date().toISOString()
            })
            .eq('id', person.id);
            
           updatedCount++;
        }
      } catch (innerError) {
        console.error(`Failed to sync alumni ${person.id}:`, innerError);
        // Continue with the next alumni even if one fails
      }
    }

    return NextResponse.json({ success: true, updatedCount, totalChecked: alumni.length });

  } catch (error: any) {
    console.error("Cron Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
