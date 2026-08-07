import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  console.log("Starting DB seed with dummy data...");

  // 0. Ensure we have at least one Auth user for foreign keys
  console.log("Fetching/creating auth users...");
  let { data: authData } = await supabase.auth.admin.listUsers();
  let users = authData?.users || [];
  
  if (users.length === 0) {
    console.log("No auth users found. Creating a dummy auth user...");
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: "dummy_user@imed.edu",
      password: "password123",
      email_confirm: true
    });
    if (createErr) {
      console.error("Failed to create dummy auth user:", createErr.message);
    } else if (newUser.user) {
      users.push(newUser.user);
    }
  }
  
  // 1. Seed Student Profiles using valid auth users if possible
  console.log("Seeding student_profiles...");
  let studentData: any[] = [];
  
  if (users.length > 0) {
    studentData = users.slice(0, 5).map((u, i) => ({
      id: u.id,
      email: u.email,
      full_name: `Test Student ${i+1}`,
      role: "student",
      branch: i % 2 === 0 ? "Computer Science" : "IT",
      batch_year: "2024",
      readiness_score: randomInt(30, 95)
    }));
  } else {
    studentData = [
      { email: "john.doe@example.com", full_name: "John Doe", role: "student", branch: "Computer Science", batch_year: "2024", readiness_score: 85 }
    ];
  }

  const { data: students, error: studentsError } = await supabase
    .from("student_profiles")
    .upsert(studentData, { onConflict: "email" })
    .select();

  if (studentsError) console.error("Error inserting students:", studentsError.message);
  else console.log(`Inserted/Updated ${students?.length || 0} students.`);

  // 2. Seed Alumni Profiles with Auth Users
  console.log("Seeding alumni_profiles and auth accounts...");
  const baseAlumni = [
    { email: "rahul.s@example.com", full_name: "Rahul Sharma", graduation_year: "2020", branch: "Computer Science", linkedin_url: "https://linkedin.com/in/rahulsharma-demo", role_title: "SDE II", current_company: "Amazon", is_mentor: true, engagement_score: 150 },
    { email: "sneha.p@example.com", full_name: "Sneha Patil", graduation_year: "2021", branch: "Information Technology", linkedin_url: "https://linkedin.com/in/snehapatil-demo", role_title: "Product Manager", current_company: "Google", is_mentor: true, engagement_score: 220 },
    { email: "vikram.s@example.com", full_name: "Vikram Singh", graduation_year: "2019", branch: "Computer Science", linkedin_url: "https://linkedin.com/in/vikramsingh-demo", role_title: "Data Scientist", current_company: "Meta", is_mentor: false, engagement_score: 40 },
    { email: "ananya.d@example.com", full_name: "Ananya Desai", graduation_year: "2022", branch: "Electronics", linkedin_url: "https://linkedin.com/in/ananyadesai-demo", role_title: "Hardware Engineer", current_company: "Intel", is_mentor: true, engagement_score: 80 },
    { email: "karan.j@example.com", full_name: "Karan Joshi", graduation_year: "2018", branch: "Mechanical", linkedin_url: "https://linkedin.com/in/karanjoshi-demo", role_title: "Design Engineer", current_company: "Boeing", is_mentor: false, engagement_score: 10 }
  ];

  let alumniData = [];
  for (const alum of baseAlumni) {
    let userId = users.find(u => u.email === alum.email)?.id;
    if (!userId) {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: alum.email,
        password: "password123", // standard dummy password
        email_confirm: true,
        user_metadata: { role: "alumni" }
      });
      if (!createErr && newUser.user) {
        userId = newUser.user.id;
        users.push(newUser.user);
      }
    }
    alumniData.push({ ...alum, id: userId || undefined });
  }

  const { data: alumni, error: alumniError } = await supabase
    .from("alumni_profiles")
    .upsert(alumniData, { onConflict: "email" })
    .select();

  if (alumniError) console.error("Error inserting alumni:", alumniError.message);
  else console.log(`Inserted/Updated ${alumni?.length || 0} alumni.`);

  // 3. Seed Corporate Jobs
  console.log("Seeding corporate_jobs...");
  const jobData = [
    { company_name: "TechNova", role_title: "Frontend Developer", raw_requirements: "React, Next.js, Tailwind, 2 years experience" },
    { company_name: "DataWiz", role_title: "Data Analyst", raw_requirements: "SQL, Python, PowerBI, strong communication" },
    { company_name: "CyberSecure", role_title: "Security Engineer", raw_requirements: "Network Security, CEH, Penetration testing" }
  ];

  const { data: jobs, error: jobsError } = await supabase
    .from("corporate_jobs")
    .insert(jobData)
    .select();

  if (jobsError) console.error("Error inserting jobs:", jobsError.message);
  else console.log(`Inserted ${jobs?.length || 0} corporate jobs.`);

  // 4. Seed Campus Drives
  console.log("Seeding campus_drives...");
  const driveData = jobs?.map((job, idx) => ({
    company_name: job.company_name,
    role_title: job.role_title,
    drive_date: new Date(new Date().setDate(new Date().getDate() + (idx * 5))).toISOString(),
    max_slots: 100,
    min_match_score: 70 + (idx * 5),
    status: idx === 0 ? "completed" : idx === 1 ? "active" : "upcoming",
    job_id: job.id
  })) || [];

  const { data: drives, error: drivesError } = await supabase
    .from("campus_drives")
    .insert(driveData)
    .select();

  if (drivesError) console.error("Error inserting drives:", drivesError.message);
  else console.log(`Inserted ${drives?.length || 0} campus drives.`);

  // 5. Seed Job Referrals & Donations
  if (alumni && alumni.length > 0) {
    console.log("Seeding job_referrals and donations...");
    const referrals = [
      { alumni_id: alumni[0].id, company: alumni[0].current_company, role_title: "Junior SDE", location: "Bangalore", description: "Looking for fresh graduates with strong React skills.", referral_link: "https://amazon.jobs/referral/123" },
      { alumni_id: alumni[1].id, company: alumni[1].current_company, role_title: "Associate PM", location: "Hyderabad", description: "APM role for new grads. Excellent communication required.", referral_link: "https://careers.google.com/referral/456" }
    ];
    
    const donations = [
      { alumni_id: alumni[0].id, amount: 5000, campaign_name: "New Computer Lab", status: "completed" },
      { alumni_id: alumni[1].id, amount: 10000, campaign_name: "Scholarship Fund", status: "completed" },
      { alumni_id: alumni[3].id, amount: 2500, campaign_name: "Library Expansion", status: "pledged" }
    ];

    const { error: refError } = await supabase.from("job_referrals").insert(referrals);
    if (refError) console.error("Error inserting job_referrals:", refError.message);
    else console.log(`Inserted ${referrals.length} job referrals.`);

    const { error: donError } = await supabase.from("donations").insert(donations);
    if (donError) console.error("Error inserting donations:", donError.message);
    else console.log(`Inserted ${donations.length} donations.`);
  }

  // Generate Dummy Telemetry & Analytics
  if (students && students.length > 0) {
    console.log("Seeding gap_analyses and interview_logs...");
    const analyses = [];
    const interviews = [];
    const mentorships = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const isStruggling = s.readiness_score < 50;
      
      if (users.find(u => u.id === s.id)) {
        analyses.push({
          user_id: s.id,
          target_role: "Software Engineer",
          student_name: s.full_name,
          match_score: s.readiness_score,
          missing_skills: isStruggling ? ["System Design", "Advanced DSA", "Docker"] : ["AWS", "GraphQL"],
          action_plan: ["Complete course X", "Do Leetcode Y"]
        });
      }

      interviews.push({
        student_name: s.full_name,
        target_role: "SDE",
        question: "Can you explain how React's virtual DOM works?",
        feedback: "Good simple explanation. Try to mention reconciliation and diffing algorithms next time."
      });

      if (isStruggling && alumni && alumni.length > 0) {
        const mentor = alumni[i % alumni.length];
        mentorships.push({
          student_id: s.id,
          alumni_id: mentor.id,
          status: "active"
        });
      }
    }

    if (analyses.length > 0) {
      const { error: gError } = await supabase.from("gap_analyses").insert(analyses);
      if (gError) console.error("Error inserting gap_analyses:", gError.message);
      else console.log(`Inserted ${analyses.length} gap_analyses.`);
    }

    if (interviews.length > 0) {
      const { error: iError } = await supabase.from("interview_logs").insert(interviews);
      if (iError) console.error("Error inserting interview_logs:", iError.message);
      else console.log(`Inserted ${interviews.length} interview_logs.`);
    }

    if (mentorships.length > 0) {
        const { error: mError } = await supabase.from("mentorship_pairs").insert(mentorships);
        if (mError) console.error("Error inserting mentorship_pairs:", mError.message);
        else console.log(`Inserted ${mentorships.length} mentorship_pairs.`);
    }
  }

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed();
