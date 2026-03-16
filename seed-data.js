require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./models/serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const auth = admin.auth();
const db   = admin.firestore();

const PROGRAMME_CATALOG = {

  cs: {
    label: 'BSc. Computer Science',
    levels: {
      y1s1: { label: 'Year 1 – Semester 1', subjects: [
        { id: 'intro',    code: 'ICS 1101', name: 'Introduction to Computing',   icon: '💻' },
        { id: 'discmath', code: 'ICS 1102', name: 'Discrete Mathematics',         icon: '📐' },
        { id: 'logic',    code: 'ICS 1103', name: 'Logic & Critical Thinking',    icon: '🧠' },
        { id: 'prog',     code: 'ICS 1104', name: 'Programming Fundamentals',     icon: '⌨️' },
      ]},
      y1s2: { label: 'Year 1 – Semester 2', subjects: [
        { id: 'ds',  code: 'ICS 1201', name: 'Data Structures',  icon: '🌳' },
        { id: 'oop', code: 'ICS 1202', name: 'OOP Programming',  icon: '🧩' },
        { id: 'web', code: 'ICS 1203', name: 'Web Development',  icon: '🌐' },
      ]},
      y2s1: { label: 'Year 2 – Semester 1', subjects: [
        { id: 'algo',  code: 'ICS 2101', name: 'Algorithms',       icon: '⚡' },
        { id: 'db',    code: 'ICS 2102', name: 'Database Systems', icon: '🗄️' },
        { id: 'stats', code: 'ICS 2103', name: 'Statistics',       icon: '📊' },
      ]},
      y2s2: { label: 'Year 2 – Semester 2', subjects: [
        { id: 'net', code: 'ICS 2201', name: 'Computer Networks',    icon: '📡' },
        { id: 'os',  code: 'ICS 2202', name: 'Operating Systems',    icon: '💾' },
        { id: 'se',  code: 'ICS 2203', name: 'Software Engineering', icon: '🏗️' },
      ]},
      y3s1: { label: 'Year 3 – Semester 1', subjects: [
        { id: 'cybersec', code: 'ICS 3101', name: 'Cyber Security',          icon: '🔒' },
        { id: 'ai',       code: 'ICS 3102', name: 'Artificial Intelligence', icon: '🤖' },
        { id: 'mobile',   code: 'ICS 3103', name: 'Mobile Development',      icon: '📱' },
      ]},
      y3s2: { label: 'Year 3 – Semester 2', subjects: [
        { id: 'cloud', code: 'ICS 3201', name: 'Cloud Computing',    icon: '☁️' },
        { id: 'ml',    code: 'ICS 3202', name: 'Machine Learning',   icon: '📈' },
        { id: 'isa',   code: 'ICS 3203', name: 'Info Systems Audit', icon: '📋' },
      ]},
      y4s1: { label: 'Year 4 – Semester 1', subjects: [
        { id: 'ann',  code: 'ICS 4101', name: 'Artificial Neural Networks', icon: '🕸️' },
        { id: 'ict',  code: 'ICS 4102', name: 'ICT and Society',            icon: '🌍' },
        { id: 'dist', code: 'ICS 4103', name: 'Distributed Systems',        icon: '🔗' },
      ]},
      y4s2: { label: 'Year 4 – Semester 2', subjects: [
        { id: 'ethics',   code: 'ICS 4201', name: 'Research Ethics',    icon: '⚖️' },
        { id: 'research', code: 'ICS 4202', name: 'Research Methods',   icon: '🔬' },
        { id: 'project',  code: 'ICS 4203', name: 'Final Year Project', icon: '🏆' },
      ]},
    }
  },

  bse: {
    label: 'BSc. Software Engineering',
    levels: {
      y1s1: { label: 'Year 1 – Semester 1', subjects: [
        { id: 'intro',    code: 'SEN 1101', name: 'Introduction to Computing',  icon: '💻' },
        { id: 'discmath', code: 'SEN 1102', name: 'Discrete Mathematics',        icon: '📐' },
        { id: 'prog',     code: 'SEN 1103', name: 'Programming Fundamentals',    icon: '⌨️' },
        { id: 'web',      code: 'SEN 1104', name: 'Web Development Basics',      icon: '🌐' },
      ]},
      y1s2: { label: 'Year 1 – Semester 2', subjects: [
        { id: 'ds',      code: 'SEN 1201', name: 'Data Structures',          icon: '🌳' },
        { id: 'oop',     code: 'SEN 1202', name: 'OOP Programming',          icon: '🧩' },
        { id: 'require', code: 'SEN 1203', name: 'Requirements Engineering', icon: '📝' },
      ]},
      y2s1: { label: 'Year 2 – Semester 1', subjects: [
        { id: 'algo',      code: 'SEN 2101', name: 'Algorithms',       icon: '⚡' },
        { id: 'db',        code: 'SEN 2102', name: 'Database Systems', icon: '🗄️' },
        { id: 'sw_design', code: 'SEN 2103', name: 'Software Design',  icon: '🎨' },
      ]},
      y2s2: { label: 'Year 2 – Semester 2', subjects: [
        { id: 'net',     code: 'SEN 2201', name: 'Computer Networks', icon: '📡' },
        { id: 'testing', code: 'SEN 2202', name: 'Software Testing',  icon: '🧪' },
        { id: 'os',      code: 'SEN 2203', name: 'Operating Systems', icon: '💾' },
      ]},
      y3s1: { label: 'Year 3 – Semester 1', subjects: [
        { id: 'mobile', code: 'SEN 3101', name: 'Mobile Development', icon: '📱' },
        { id: 'cloud',  code: 'SEN 3102', name: 'Cloud Computing',    icon: '☁️' },
        { id: 'devops', code: 'SEN 3103', name: 'DevOps & CI/CD',     icon: '🔄' },
      ]},
      y3s2: { label: 'Year 3 – Semester 2', subjects: [
        { id: 'cybersec', code: 'SEN 3201', name: 'Cyber Security',        icon: '🔒' },
        { id: 'se_mgmt',  code: 'SEN 3202', name: 'SE Project Management', icon: '📅' },
        { id: 'ai',       code: 'SEN 3203', name: 'AI for Engineers',      icon: '🤖' },
      ]},
      y4s1: { label: 'Year 4 – Semester 1', subjects: [
        { id: 'dist', code: 'SEN 4101', name: 'Distributed Systems',             icon: '🔗' },
        { id: 'ux',   code: 'SEN 4102', name: 'UX & Human-Computer Interaction', icon: '🖱️' },
        { id: 'ict',  code: 'SEN 4103', name: 'ICT and Society',                 icon: '🌍' },
      ]},
      y4s2: { label: 'Year 4 – Semester 2', subjects: [
        { id: 'ethics',   code: 'SEN 4201', name: 'Research Ethics',    icon: '⚖️' },
        { id: 'research', code: 'SEN 4202', name: 'Research Methods',   icon: '🔬' },
        { id: 'project',  code: 'SEN 4203', name: 'Final Year Project', icon: '🏆' },
      ]},
    }
  },

  bbit: {
    label: 'BSc. Business Information Technology',
    levels: {
      y1s1: { label: 'Year 1 – Semester 1', subjects: [
        { id: 'intro',    code: 'BIT 1101', name: 'Introduction to Computing', icon: '💻' },
        { id: 'biz_comp', code: 'BIT 1102', name: 'Business Computing',        icon: '💼' },
        { id: 'math_biz', code: 'BIT 1103', name: 'Mathematics for Business',  icon: '🔢' },
        { id: 'acct_it',  code: 'BIT 1104', name: 'Accounting & IT',           icon: '💰' },
      ]},
      y1s2: { label: 'Year 1 – Semester 2', subjects: [
        { id: 'db',        code: 'BIT 1201', name: 'Database Systems', icon: '🗄️' },
        { id: 'web',       code: 'BIT 1202', name: 'Web Development',  icon: '🌐' },
        { id: 'ecommerce', code: 'BIT 1203', name: 'E-Commerce',       icon: '🛒' },
      ]},
      y2s1: { label: 'Year 2 – Semester 1', subjects: [
        { id: 'sys_analysis', code: 'BIT 2101', name: 'Systems Analysis & Design', icon: '🔍' },
        { id: 'net',          code: 'BIT 2102', name: 'Computer Networks',          icon: '📡' },
        { id: 'stats',        code: 'BIT 2103', name: 'Business Statistics',        icon: '📊' },
      ]},
      y2s2: { label: 'Year 2 – Semester 2', subjects: [
        { id: 'erp',          code: 'BIT 2201', name: 'ERP Systems',            icon: '🏢' },
        { id: 'it_proj_mgmt', code: 'BIT 2202', name: 'IT Project Management', icon: '📅' },
        { id: 'os',           code: 'BIT 2203', name: 'Operating Systems',      icon: '💾' },
      ]},
      y3s1: { label: 'Year 3 – Semester 1', subjects: [
        { id: 'cybersec',       code: 'BIT 3101', name: 'Cyber Security',                 icon: '🔒' },
        { id: 'data_analytics', code: 'BIT 3102', name: 'Data Analytics',                 icon: '📉' },
        { id: 'mis',            code: 'BIT 3103', name: 'Management Information Systems', icon: '🗂️' },
      ]},
      y3s2: { label: 'Year 3 – Semester 2', subjects: [
        { id: 'cloud',  code: 'BIT 3201', name: 'Cloud Computing',           icon: '☁️' },
        { id: 'isa',    code: 'BIT 3202', name: 'Information Systems Audit', icon: '📋' },
        { id: 'it_gov', code: 'BIT 3203', name: 'IT Governance',             icon: '🏛️' },
      ]},
      y4s1: { label: 'Year 4 – Semester 1', subjects: [
        { id: 'ict',         code: 'BIT 4101', name: 'ICT and Society',   icon: '🌍' },
        { id: 'digital_mkt', code: 'BIT 4102', name: 'Digital Marketing', icon: '📣' },
        { id: 'it_strategy', code: 'BIT 4103', name: 'IT Strategy',       icon: '♟️' },
      ]},
      y4s2: { label: 'Year 4 – Semester 2', subjects: [
        { id: 'ethics',   code: 'BIT 4201', name: 'Research Ethics',  icon: '⚖️' },
        { id: 'research', code: 'BIT 4202', name: 'Research Methods', icon: '🔬' },
        { id: 'project',  code: 'BIT 4203', name: 'Capstone Project', icon: '🏆' },
      ]},
    }
  },

  it: {
    label: 'BSc. Information Technology',
    levels: {
      y1s1: { label: 'Year 1 – Semester 1', subjects: [
        { id: 'intro',    code: 'ICT 1101', name: 'Introduction to Computing', icon: '💻' },
        { id: 'it_fund',  code: 'ICT 1102', name: 'IT Fundamentals',           icon: '🖥️' },
        { id: 'prog',     code: 'ICT 1103', name: 'Programming Fundamentals',  icon: '⌨️' },
        { id: 'discmath', code: 'ICT 1104', name: 'Discrete Mathematics',       icon: '📐' },
      ]},
      y1s2: { label: 'Year 1 – Semester 2', subjects: [
        { id: 'ds',  code: 'ICT 1201', name: 'Data Structures',  icon: '🌳' },
        { id: 'web', code: 'ICT 1202', name: 'Web Development',  icon: '🌐' },
        { id: 'db',  code: 'ICT 1203', name: 'Database Systems', icon: '🗄️' },
      ]},
      y2s1: { label: 'Year 2 – Semester 1', subjects: [
        { id: 'net',   code: 'ICT 2101', name: 'Computer Networks', icon: '📡' },
        { id: 'os',    code: 'ICT 2102', name: 'Operating Systems', icon: '💾' },
        { id: 'stats', code: 'ICT 2103', name: 'Statistics',        icon: '📊' },
      ]},
      y2s2: { label: 'Year 2 – Semester 2', subjects: [
        { id: 'cybersec',  code: 'ICT 2201', name: 'Cyber Security',         icon: '🔒' },
        { id: 'mobile',    code: 'ICT 2202', name: 'Mobile Development',     icon: '📱' },
        { id: 'sys_admin', code: 'ICT 2203', name: 'Systems Administration', icon: '🛠️' },
      ]},
      y3s1: { label: 'Year 3 – Semester 1', subjects: [
        { id: 'cloud',      code: 'ICT 3101', name: 'Cloud Computing',           icon: '☁️' },
        { id: 'isa',        code: 'ICT 3102', name: 'Information Systems Audit', icon: '📋' },
        { id: 'it_support', code: 'ICT 3103', name: 'IT Support & ITSM',        icon: '🎧' },
      ]},
      y3s2: { label: 'Year 3 – Semester 2', subjects: [
        { id: 'ai',             code: 'ICT 3201', name: 'Artificial Intelligence', icon: '🤖' },
        { id: 'data_analytics', code: 'ICT 3202', name: 'Data Analytics',          icon: '📉' },
        { id: 'it_gov',         code: 'ICT 3203', name: 'IT Governance',            icon: '🏛️' },
      ]},
      y4s1: { label: 'Year 4 – Semester 1', subjects: [
        { id: 'ict',          code: 'ICT 4101', name: 'ICT and Society',       icon: '🌍' },
        { id: 'dist',         code: 'ICT 4102', name: 'Distributed Systems',   icon: '🔗' },
        { id: 'it_proj_mgmt', code: 'ICT 4103', name: 'IT Project Management', icon: '📅' },
      ]},
      y4s2: { label: 'Year 4 – Semester 2', subjects: [
        { id: 'ethics',   code: 'ICT 4201', name: 'Research Ethics',    icon: '⚖️' },
        { id: 'research', code: 'ICT 4202', name: 'Research Methods',   icon: '🔬' },
        { id: 'project',  code: 'ICT 4203', name: 'Final Year Project', icon: '🏆' },
      ]},
    }
  },
};

function getEnrolledSubjects(programme, level) {
  return (PROGRAMME_CATALOG[programme]?.levels[level]?.subjects || []).map(s => s.id);
}

const usersToSeed = [

  // ── Staff ──────────────────────────────────────────────────────────────
  {
    name:       'Dr. Ephantus Mwangi',
    email:      'ephantus@sala.ac.ke',
    password:   'Admin@2026',
    role:       'admin',
    regNumber:  'STAFF001',
    programme:  null,
    level:      null,
  },
  {
    name:       'Prof. Grace Wambui',
    email:      'grace.wambui@sala.ac.ke',
    password:   'Lecturer@2026',
    role:       'lecturer',
    regNumber:  'STAFF002',
    programme:  null,
    level:      null,
  },

  // ── BSc. Computer Science ──────────────────────────────────────────────
  {
    name:       'Ian Muriithi',
    email:      'ian.muriithi@sala.ac.ke',
    password:   'Student@2026',
    role:       'student',
    regNumber:  'ICS/G/001/22',
    programme:  'cs',
    level:      'y2s1',
  },
  {
    name:       'Brenda Achieng',
    email:      'brenda.achieng@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'ICS/G/002/23',
    programme:  'cs',
    level:      'y1s2',
  },
  {
    name:       'Kevin Odhiambo',
    email:      'kevin.odhiambo@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'ICS/G/003/21',
    programme:  'cs',
    level:      'y3s1',
  },
  {
    name:       'Mercy Njeri',
    email:      'mercy.njeri@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'ICS/G/004/21',
    programme:  'cs',
    level:      'y4s2',
  },

  // ── BSc. Software Engineering ──────────────────────────────────────────
  {
    name:       'Brian Kiptonui',
    email:      'brian.kiptonui@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'SEN/G/001/22',
    programme:  'bse',
    level:      'y2s2',
  },
  {
    name:       'Sharon Muthoni',
    email:      'sharon.muthoni@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'SEN/G/002/23',
    programme:  'bse',
    level:      'y1s1',
  },
  {
    name:       'Dennis Kamau',
    email:      'dennis.kamau@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'SEN/G/003/21',
    programme:  'bse',
    level:      'y3s2',
  },

  // ── BSc. Business Information Technology ──────────────────────────────
  {
    name:       'Joyce Wanjiku',
    email:      'joyce.wanjiku@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'BIT/G/001/22',
    programme:  'bbit',
    level:      'y2s1',
  },
  {
    name:       'Amos Njuguna',
    email:      'amos.njuguna@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'BIT/G/002/21',
    programme:  'bbit',
    level:      'y3s1',
  },
  {
    name:       'Faith Chebet',
    email:      'faith.chebet@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'BIT/G/003/23',
    programme:  'bbit',
    level:      'y1s2',
  },

  // ── BSc. Information Technology ────────────────────────────────────────
  {
    name:       'Collins Otieno',
    email:      'collins.otieno@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'ICT/G/001/22',
    programme:  'it',
    level:      'y2s2',
  },
  {
    name:       'Lydia Wairimu',
    email:      'lydia.wairimu@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'ICT/G/002/21',
    programme:  'it',
    level:      'y3s2',
  },
  {
    name:       'Samuel Kipchoge',
    email:      'samuel.kipchoge@sala.ac.ke',
    password:   'Student@2024',
    role:       'student',
    regNumber:  'ICT/G/003/23',
    programme:  'it',
    level:      'y1s1',
  },
];

async function seedSubjects() {
  console.log('\n Seeding subjects catalogue...\n');

  const seen    = new Set();
  const batch   = db.batch();
  let   count   = 0;

  for (const [progKey, prog] of Object.entries(PROGRAMME_CATALOG)) {
    for (const [levelKey, lvl] of Object.entries(prog.levels)) {
      for (const subject of lvl.subjects) {

        // Only write once per unique subject id
        if (seen.has(subject.id)) continue;
        seen.add(subject.id);

        const ref = db.collection('subjects').doc(subject.id);
        batch.set(ref, {
          id:         subject.id,
          name:       subject.name,
          icon:       subject.icon,
          // Store all programme codes that use this subject
          programmes: [], 
          createdAt:  admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        count++;
      }
    }
  }

  await batch.commit();
  console.log(`  ✅ Wrote ${count} unique subjects to Firestore.\n`);

  console.log('  🔗 Linking subjects to programmes...');
  const subjectMeta = {}; // subjectId → { programmes: Set, levels: Set }

  for (const [progKey, prog] of Object.entries(PROGRAMME_CATALOG)) {
    for (const [levelKey, lvl] of Object.entries(prog.levels)) {
      for (const subject of lvl.subjects) {
        if (!subjectMeta[subject.id]) {
          subjectMeta[subject.id] = { programmes: new Set(), levels: new Set(), codes: new Set() };
        }
        subjectMeta[subject.id].programmes.add(progKey);
        subjectMeta[subject.id].levels.add(levelKey);
        subjectMeta[subject.id].codes.add(subject.code);
      }
    }
  }

  // Write metadata back
  const metaBatch = db.batch();
  for (const [subId, meta] of Object.entries(subjectMeta)) {
    const ref = db.collection('subjects').doc(subId);
    metaBatch.update(ref, {
      programmes: Array.from(meta.programmes),
      levels:     Array.from(meta.levels),
      codes:      Array.from(meta.codes),
    });
  }
  await metaBatch.commit();
  console.log('  ✅ Subject metadata linked.\n');
}

async function seedUsers() {
  console.log('👥 Seeding users...\n');

  let successCount = 0;
  let skipCount    = 0;
  let failCount    = 0;

  for (const user of usersToSeed) {
    try {
      console.log(`  Creating: ${user.name} (${user.role})...`);

  
      const userRecord = await auth.createUser({
        email:       user.email,
        password:    user.password,
        displayName: user.name,
      });

      const enrolledSubjects = user.programme && user.level
        ? getEnrolledSubjects(user.programme, user.level)
        : [];

      const profile = {
        name:             user.name,
        email:            user.email,
        role:             user.role,
        regNumber:        user.regNumber,
        programme:        user.programme  || null,
        level:            user.level      || null,
        enrolledSubjects,
        bkt_profile:      {},
        streakCount:      0,
        lastLoginDate:    null,
        createdAt:        admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('users').doc(userRecord.uid).set(profile);

      console.log(`  ✅ ${user.name}`);
      if (enrolledSubjects.length > 0) {
        console.log(`     Programme : ${user.programme?.toUpperCase()} · ${user.level}`);
        console.log(`     Units     : ${enrolledSubjects.join(', ')}`);
      }
      console.log();

      successCount++;

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`Skipped (already exists): ${user.email}\n`);
        skipCount++;
      } else {
        console.error(`Failed for ${user.name}: ${error.message}\n`);
        failCount++;
      }
    }
  }

  return { successCount, skipCount, failCount };
}

async function main() {
  console.log('        SALA – Database Seeder');

  try {
    await seedSubjects();
    const { successCount, skipCount, failCount } = await seedUsers();
    console.log(`Users created  : ${successCount}`);
    console.log(`Users skipped  : ${skipCount}`);
    console.log(`Users failed   : ${failCount}`);

  } catch (err) {
    console.error('Fatal error during seeding:', err);
  }

  process.exit(0);
}

main();