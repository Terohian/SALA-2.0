function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if(sidebar) sidebar.classList.toggle('open');
  if(overlay) overlay.classList.toggle('active');
}

if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey:            "AIzaSyDBAVTtUoCz6bFA8MQS53NkjNih1lFtqx0",
      authDomain:        "sala-d7d30.firebaseapp.com",
      projectId:         "sala-d7d30",
      storageBucket:     "sala-d7d30.firebasestorage.app",
      messagingSenderId: "192793186155",
      appId:             "1:192793186155:web:43575148b343da8f9f462e",
      measurementId: "G-LXWWQW1W0E"
    });
  }
 
  window.salaDB = firebase.firestore();
  window.salaDB.enablePersistence().catch(err => {
    if (err.code === 'failed-precondition') console.warn('Multiple tabs: offline mode limited.');
    else if (err.code === 'unimplemented') console.warn('Browser does not support offline persistence.');
  });
}

const SALA = {
  version: '1.0.0',
  currentUser: null,
  config: {
    quizTimeDefault: 30,
    adaptiveThreshold: 0.7,
    weakThreshold: 0.6,
  },
  KEYS: {
    USER: 'sala_user',
    SESSION: 'sala_session',
    QUIZ_STATE: 'sala_quiz_state',
    PERFORMANCE: 'sala_performance',
  }
};

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
        { id: 'ds',      code: 'SEN 1201', name: 'Data Structures',           icon: '🌳' },
        { id: 'oop',     code: 'SEN 1202', name: 'OOP Programming',           icon: '🧩' },
        { id: 'require', code: 'SEN 1203', name: 'Requirements Engineering',  icon: '📝' },
      ]},
      y2s1: { label: 'Year 2 – Semester 1', subjects: [
        { id: 'algo',      code: 'SEN 2101', name: 'Algorithms',        icon: '⚡' },
        { id: 'db',        code: 'SEN 2102', name: 'Database Systems',  icon: '🗄️' },
        { id: 'sw_design', code: 'SEN 2103', name: 'Software Design',   icon: '🎨' },
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
        { id: 'dist', code: 'SEN 4101', name: 'Distributed Systems',              icon: '🔗' },
        { id: 'ux',   code: 'SEN 4102', name: 'UX & Human-Computer Interaction',  icon: '🖱️' },
        { id: 'ict',  code: 'SEN 4103', name: 'ICT and Society',                  icon: '🌍' },
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
        { id: 'cybersec',       code: 'BIT 3101', name: 'Cyber Security',                  icon: '🔒' },
        { id: 'data_analytics', code: 'BIT 3102', name: 'Data Analytics',                  icon: '📉' },
        { id: 'mis',            code: 'BIT 3103', name: 'Management Information Systems',  icon: '🗂️' },
      ]},
      y3s2: { label: 'Year 3 – Semester 2', subjects: [
        { id: 'cloud',  code: 'BIT 3201', name: 'Cloud Computing',          icon: '☁️' },
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
        { id: 'intro',    code: 'ICT 1101', name: 'Introduction to Computing',  icon: '💻' },
        { id: 'it_fund',  code: 'ICT 1102', name: 'IT Fundamentals',            icon: '🖥️' },
        { id: 'prog',     code: 'ICT 1103', name: 'Programming Fundamentals',   icon: '⌨️' },
        { id: 'discmath', code: 'ICT 1104', name: 'Discrete Mathematics',        icon: '📐' },
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
        { id: 'cybersec',  code: 'ICT 2201', name: 'Cyber Security',          icon: '🔒' },
        { id: 'mobile',    code: 'ICT 2202', name: 'Mobile Development',      icon: '📱' },
        { id: 'sys_admin', code: 'ICT 2203', name: 'Systems Administration',  icon: '🛠️' },
      ]},
      y3s1: { label: 'Year 3 – Semester 1', subjects: [
        { id: 'cloud',      code: 'ICT 3101', name: 'Cloud Computing',          icon: '☁️' },
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

// ✅ Assign immediately so any script can check window.PROGRAMME_CATALOG
window.PROGRAMME_CATALOG = PROGRAMME_CATALOG;

// ── Catalogue helpers ────────────────────────────────────────────────────
window.getProgrammeSubjects = (prog, level) =>
  PROGRAMME_CATALOG[prog]?.levels[level]?.subjects || [];

window.getProgrammeLabel = (prog) =>
  PROGRAMME_CATALOG[prog]?.label || prog || '—';

window.getLevelLabel = (prog, level) =>
  PROGRAMME_CATALOG[prog]?.levels[level]?.label || level || '—';



class AuthManager {
  constructor() { this.currentUser = null; }
  get auth() { return firebase.auth(); }
  get db() { return window.salaDB || firebase.firestore(); }


  async login(email, password) {
    try {
      const credential = await this.auth.signInWithEmailAndPassword(email, password);
      const uid = credential.user.uid;
      const doc = await this.db.collection('users').doc(uid).get();
      if (!doc.exists) throw new Error('User profile not found in database.');
      this.currentUser = { uid, ...doc.data() };
      localStorage.setItem('sala_user', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  }

  async register(name, email, password, role = 'student', regNumber = '', programme = 'cs', level = 'y1s1') {
    try {
      const credential = await this.auth.createUserWithEmailAndPassword(email, password);
      const uid = credential.user.uid;

      const subjects = window.getProgrammeSubjects(programme, level);
      const enrolledSubjects = subjects.map(s => s.id);

      const profile = {
        name,
        email,
        role,
        regNumber,
        programme,
        level,
        enrolledSubjects,
        bkt_profile: {},
        streakCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await this.db.collection('users').doc(uid).set(profile);
      this.currentUser = { uid, ...profile };
      localStorage.setItem('sala_user', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: error.message };
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.currentUser = null;
      localStorage.removeItem('sala_user');
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}

window.salaAuth = new AuthManager();


class QuizEngine {
  constructor() {
    this.db = window.salaDB;
  }

  // ✅ count and timePerQ passed as parameters — no longer reads DOM
  async loadSubject(subjectCode, count = 10, timePerQ = 30) {
    try {
      console.log(`🔍 Fetching questions for: ${subjectCode}`);

      const snapshot = await this.db.collection('questions')
        .where('subject', '==', subjectCode)
        .get();

      if (snapshot.empty) {
        alert(`No questions available for ${subjectCode.toUpperCase()} yet.`);
        return false;
      }

      let questions = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        questions.push({
          q:    d.text,
          opts: d.options,
          ans:  d.correct,
          hint: d.hint || `Think about the core concepts of ${(d.skill || 'this topic').replace(/_/g, ' ')}.`,
          fb: {
            c: 'Excellent! The AI has recorded your correct answer.',
            w: `Not quite. Review ${(d.skill || 'this topic').replace(/_/g, ' ')}.`,
          },
          diff:  d.difficulty || 0.5,
          skill: d.skill || 'general',
        });
      });


      questions = questions.sort(() => Math.random() - 0.5).slice(0, count);

      window.state = {
        subj:                 subjectCode,
        diff:                 window.selectedDiff || 'adaptive',
        currentDifficultyLabel: 'medium',
        total:                questions.length,
        timePerQ,
        current:  0,
        correct:  0,
        wrong:    0,
        answers:  [],
        startTime: Date.now(),
        questions,
      };

      console.log(`✅ Loaded ${questions.length} questions for ${subjectCode}`);
      return true;
    } catch (error) {
      console.error('QuizEngine error:', error);
      return false;
    }
  }
}


class PerformanceTracker {
  constructor(userId) {
    this.userId = userId;
    this.db = window.salaDB;
  }

  async updateStreak() {
    if (!this.userId) return;
    const userRef = this.db.collection('users').doc(this.userId);
    try {
      const doc = await userRef.get();
      if (!doc.exists) return;

      const data   = doc.data();
      const now    = new Date();
      const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastTS = data.lastLoginDate?.toDate?.() || null;
      const lastDay = lastTS
        ? new Date(lastTS.getFullYear(), lastTS.getMonth(), lastTS.getDate()).getTime()
        : 0;

      // Don't update if already logged in today
      if (today === lastDay) return data.streakCount || 0;

      const oneDay = 86400000;
      let streak = today === lastDay + oneDay
        ? (data.streakCount || 0) + 1
        : 1;

      await userRef.update({
        streakCount:   streak,
        lastLoginDate: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return streak;
    } catch (e) {
      console.error('Streak error:', e);
    }
  }
}

class UIHelper {
  static showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: '💬' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
  }

  static formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}

async function syncSidebarProfile(user) {
  if (!user) return null;

  // ✅ Return cached data if already fetched this page load
  if (window._cachedUserData) {
    applySidebarData(window._cachedUserData);
    return window._cachedUserData;
  }

  try {
    const doc = await window.salaDB.collection('users').doc(user.uid).get();
    if (!doc.exists) return null;

    const data = { uid: user.uid, ...doc.data() };
    window._cachedUserData = data; // Cache for this page load

    applySidebarData(data);
    return data;
  } catch (e) {
    console.error('Profile sync failed:', e);
    return null;
  }
}

function applySidebarData(data) {
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const avaEl  = document.getElementById('userAva');
  if (nameEl) nameEl.textContent = data.name || 'Student';
  if (roleEl) roleEl.textContent = (data.role || 'Student').toUpperCase();
  if (avaEl && data.name) {
    avaEl.textContent = data.name.charAt(0).toUpperCase();
    const colors = ['#3d5afe', '#00bfa6', '#ffb703', '#ff4d6d', '#7209b7'];
    avaEl.style.backgroundColor = colors[data.name.length % colors.length];
  }
}


// ═══════════════════════════════════════════════════════════════════
// MAIN INITIALIZATION
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // ✅ Single onAuthStateChanged — handles sidebar + streak only
  // Individual pages handle their own data fetching
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // Sync sidebar using cached fetch
      await syncSidebarProfile(user);

      // Update salaAuth.currentUser so page scripts can use it
      if (window.salaAuth) window.salaAuth.currentUser = { uid: user.uid };

      // ✅ Only run streak on dashboard — not on every page
      const path = window.location.pathname;
      if (path.includes('dashboard.html')) {
        const tracker = new PerformanceTracker(user.uid);
        tracker.updateStreak();
      }

      // ✅ updateGreeting is called by dashboard.js with real name from Firestore
      // Do NOT call it here with user.displayName (always null for email auth)

    } else {
      // Auth state null — may still be settling from IndexedDB.
      // Do NOT redirect from here. Each page has its own auth guard that
      // handles unauthenticated users after a longer, page-specific timeout.
    }
  });

  // Initialise QuizEngine on quiz page only
  if (window.location.pathname.includes('quiz.html')) {
    window.quizEngine = new QuizEngine();
  }
});

window.handleLogout = function () {
  firebase.auth().signOut()
    .then(() => window.location.href = 'login.html')
    .catch(e => console.error('Logout error:', e));
};

function nav(url) { window.location.href = url; }

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.update();
      console.log('[App] Service Worker registered');
    }).catch(err => {
      console.warn('[App] SW registration failed:', err);
    });
  });
}
