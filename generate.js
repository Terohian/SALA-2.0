require('dotenv').config();
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── FIREBASE SETUP ────────────────────────────────────────────────────────
const serviceAccount = require('./models/serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── AI SETUP ──────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── COMPLETE SUBJECT LIST — matches PROGRAMME_CATALOG exactly ─────────────
// Shared subjects (same question pool used across multiple programmes)
const targetSubjects = [

  // ── Year 1 ──────────────────────────────────────────────────────────────
  { name: 'Introduction to Computing',          code: 'intro',        level: 'y1s1', year: 1 },
  { name: 'Discrete Mathematics',               code: 'discmath',     level: 'y1s1', year: 1 },
  { name: 'Logic and Critical Thinking',        code: 'logic',        level: 'y1s1', year: 1 },
  { name: 'Programming Fundamentals',           code: 'prog',         level: 'y1s1', year: 1 },
  { name: 'IT Fundamentals',                    code: 'it_fund',      level: 'y1s1', year: 1 },
  { name: 'Business Computing',                 code: 'biz_comp',     level: 'y1s1', year: 1 },
  { name: 'Mathematics for Business',           code: 'math_biz',     level: 'y1s1', year: 1 },
  { name: 'Accounting and Information Technology', code: 'acct_it',   level: 'y1s1', year: 1 },

  { name: 'Data Structures',                    code: 'ds',           level: 'y1s2', year: 1 },
  { name: 'Object Oriented Programming',        code: 'oop',          level: 'y1s2', year: 1 },
  { name: 'Web Development',                    code: 'web',          level: 'y1s2', year: 1 },
  { name: 'Requirements Engineering',           code: 'require',      level: 'y1s2', year: 1 },
  { name: 'E-Commerce Systems',                 code: 'ecommerce',    level: 'y1s2', year: 1 },

  // ── Year 2 ──────────────────────────────────────────────────────────────
  { name: 'Algorithms and Complexity',          code: 'algo',         level: 'y2s1', year: 2 },
  { name: 'Database Systems',                   code: 'db',           level: 'y2s1', year: 2 },
  { name: 'Statistics for Computing',           code: 'stats',        level: 'y2s1', year: 2 },
  { name: 'Business Statistics',                code: 'stats',        level: 'y2s1', year: 2 }, // same pool
  { name: 'Systems Analysis and Design',        code: 'sys_analysis', level: 'y2s1', year: 2 },
  { name: 'Software Design Patterns',           code: 'sw_design',    level: 'y2s1', year: 2 },

  { name: 'Computer Networks',                  code: 'net',          level: 'y2s2', year: 2 },
  { name: 'Operating Systems',                  code: 'os',           level: 'y2s2', year: 2 },
  { name: 'Software Engineering',               code: 'se',           level: 'y2s2', year: 2 },
  { name: 'Software Testing and Quality Assurance', code: 'testing',  level: 'y2s2', year: 2 },
  { name: 'ERP Systems',                        code: 'erp',          level: 'y2s2', year: 2 },
  { name: 'IT Project Management',              code: 'it_proj_mgmt', level: 'y2s2', year: 2 },
  { name: 'Systems Administration',             code: 'sys_admin',    level: 'y2s2', year: 2 },

  // ── Year 3 ──────────────────────────────────────────────────────────────
  { name: 'Cyber Security',                     code: 'cybersec',     level: 'y3s1', year: 3 },
  { name: 'Artificial Intelligence',            code: 'ai',           level: 'y3s1', year: 3 },
  { name: 'Mobile Application Development',     code: 'mobile',       level: 'y3s1', year: 3 },
  { name: 'DevOps and CI/CD Pipelines',         code: 'devops',       level: 'y3s1', year: 3 },
  { name: 'Data Analytics',                     code: 'data_analytics', level: 'y3s1', year: 3 },
  { name: 'Management Information Systems',     code: 'mis',          level: 'y3s1', year: 3 },
  { name: 'IT Support and Service Management',  code: 'it_support',   level: 'y3s1', year: 3 },

  { name: 'Cloud Computing',                    code: 'cloud',        level: 'y3s2', year: 3 },
  { name: 'Machine Learning',                   code: 'ml',           level: 'y3s2', year: 3 },
  { name: 'Information Systems Audit',          code: 'isa',          level: 'y3s2', year: 3 },
  { name: 'SE Project Management',              code: 'se_mgmt',      level: 'y3s2', year: 3 },
  { name: 'IT Governance and Compliance',       code: 'it_gov',       level: 'y3s2', year: 3 },
  { name: 'Digital Marketing and IT',           code: 'digital_mkt',  level: 'y3s2', year: 3 },

  // ── Year 4 ──────────────────────────────────────────────────────────────
  { name: 'Artificial Neural Networks',         code: 'ann',          level: 'y4s1', year: 4 },
  { name: 'ICT and Society',                    code: 'ict',          level: 'y4s1', year: 4 },
  { name: 'Distributed Systems',                code: 'dist',         level: 'y4s1', year: 4 },
  { name: 'UX and Human-Computer Interaction',  code: 'ux',           level: 'y4s1', year: 4 },
  { name: 'IT Strategy and Planning',           code: 'it_strategy',  level: 'y4s1', year: 4 },

  { name: 'Research Ethics in Computing',       code: 'ethics',       level: 'y4s2', year: 4 },
  { name: 'Research Methods for Computing',     code: 'research',     level: 'y4s2', year: 4 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Check if questions already exist for a subject code to allow safe re-runs
async function subjectAlreadyHasQuestions(code) {
  const snap = await db.collection('questions')
    .where('subject', '==', code)
    .limit(1)
    .get();
  return !snap.empty;
}

// ── GENERATE WITH RETRY ───────────────────────────────────────────────────
async function generateWithRetry(subject, attempts = 3) {
  const yearLabel = `Year ${subject.year}`;
  const prompt = `
You are an expert university Computer Science lecturer in Kenya.
Generate exactly 20 multiple-choice exam questions for "${subject.name}" (${yearLabel} level).

STRICT RULES:
- Respond with ONLY a raw JSON array. No markdown, no explanation, no code fences.
- Every question must be unique — no duplicates.
- Vary difficulty: 6 easy (0.2–0.3), 9 medium (0.4–0.6), 5 hard (0.7–0.9).
- The "skill" field must be a short snake_case concept tag (e.g. "binary_trees", "sql_joins").
- The "hint" must be helpful but must NOT reveal the answer directly.
- The "correct" field is the zero-based index of the correct option in the "options" array.

Use this exact JSON structure for every question:
[
  {
    "subject": "${subject.code}",
    "level": "${subject.level}",
    "text": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "skill": "skill_tag",
    "difficulty": 0.5,
    "hint": "A helpful hint that guides without giving away the answer."
  }
]
`;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result  = await model.generateContent(prompt);
      let rawText   = result.response.text();

      // Strip any accidental markdown fences
      rawText = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // Sometimes the model wraps in an outer object — unwrap if needed
      if (rawText.startsWith('{')) {
        const parsed = JSON.parse(rawText);
        rawText = JSON.stringify(Object.values(parsed)[0]);
      }

      const questions = JSON.parse(rawText);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Response was not a non-empty array');
      }

      return questions;

    } catch (err) {
      console.warn(`  ⚠️  Attempt ${attempt}/${attempts} failed for ${subject.name}: ${err.message}`);
      if (attempt < attempts) {
        const wait = attempt * 5000; // 5s, 10s
        console.log(`  ⏳ Waiting ${wait / 1000}s before retry...`);
        await sleep(wait);
      }
    }
  }

  return null; // All attempts failed
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function generateAndUpload() {
  console.log(`🚀 Starting generation for ${targetSubjects.length} subjects...\n`);

  // Deduplicate — only generate once per unique subject code
  const seen    = new Set();
  const unique  = targetSubjects.filter(s => {
    if (seen.has(s.code)) return false;
    seen.add(s.code);
    return true;
  });

  console.log(`📋 ${unique.length} unique subject codes to process.\n`);

  let totalUploaded = 0;
  let skipped       = 0;
  let failed        = [];

  for (let i = 0; i < unique.length; i++) {
    const subject = unique[i];
    console.log(`[${i + 1}/${unique.length}] ${subject.name} (${subject.code}, ${subject.level})`);

    // ✅ Skip subjects that already have questions — safe to re-run script
    const exists = await subjectAlreadyHasQuestions(subject.code);
    if (exists) {
      console.log(`  ✅ Already has questions — skipping.\n`);
      skipped++;
      continue;
    }

    const questions = await generateWithRetry(subject);

    if (!questions) {
      console.error(`  ❌ All attempts failed for ${subject.name} — adding to failed list.\n`);
      failed.push(subject.code);
      continue;
    }

    // Upload each question, enforce correct fields
    let count = 0;
    for (const q of questions) {
      try {
        await db.collection('questions').add({
          subject:    subject.code,           // ✅ Always use our code, not AI's
          level:      subject.level,          // ✅ Always tag with level
          text:       q.text       || q.question || '',
          options:    q.options    || [],
          correct:    typeof q.correct === 'number' ? q.correct : 0,
          skill:      (q.skill     || 'general').toLowerCase().replace(/\s+/g, '_'),
          difficulty: typeof q.difficulty === 'number' ? q.difficulty : 0.5,
          hint:       q.hint       || '',
          createdAt:  admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
        totalUploaded++;
      } catch (uploadErr) {
        console.warn(`  ⚠️  Failed to upload one question: ${uploadErr.message}`);
      }
    }

    console.log(`  ✅ Uploaded ${count} questions.\n`);

    // Respect Gemini rate limits — 8 seconds between subjects
    if (i < unique.length - 1) {
      console.log(`  ⏳ Waiting 8s before next subject...`);
      await sleep(8000);
    }
  }

  // ── SUMMARY ───────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log(`🎉 Generation complete!`);
  console.log(`   ✅ Uploaded : ${totalUploaded} questions`);
  console.log(`   ⏭️  Skipped  : ${skipped} subjects (already had questions)`);
  if (failed.length > 0) {
    console.log(`   ❌ Failed   : ${failed.join(', ')}`);
    console.log(`\n   Re-run the script to retry failed subjects.`);
    console.log(`   (Already-uploaded subjects will be skipped automatically)`);
  }
  console.log('═══════════════════════════════════════\n');

  process.exit(0);
}

generateAndUpload();