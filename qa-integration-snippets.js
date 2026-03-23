const bodyHTML_enrolled = `
  <div class="subject-meta">Enrolled · ${levelLabel}</div>
  <div class="progress-container">
    <div class="progress-label">
      <span>AI Mastery</span>
      <span style="color:${activeColor};font-weight:800">${progress}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${progress}%;background:${activeColor}"></div>
    </div>
  </div>
  <div class="card-actions" style="flex-wrap:wrap">
    <button class="btn btn-sm btn-secondary" style="flex:1"
      onclick="openModal('${s.id}','${s.name}','${s.code}')">📂 Resources</button>
    <button class="btn btn-sm"
      style="flex:1;background:${activeColor}15;color:${activeColor};border:1px solid ${activeColor}30"
      onclick="window.location.href='quiz.html?subject=${s.id}'">▶ Practice</button>
    <button class="btn btn-sm btn-secondary" style="flex:1"
      onclick="window.location.href='qa.html?subject=${s.id}'"
      title="Ask a question about this unit">
      💬 Ask
    </button>
  </div>
`;

const qaTabButton = `
<button class="tab-btn" id="tabBtnQA" onclick="switchTab('tab-qa',this)">
  <i class="fa-solid fa-comments"></i> Q&A
  <span class="tab-badge" id="pendingQABadge" style="display:none">0</span>
</button>
`;

const qaTabPane = `
<div id="tab-qa" class="tab-pane">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <div>
      <h3 style="color:var(--navy);font-family:var(--font-d);margin-bottom:4px">Student Q&A</h3>
      <p style="color:var(--muted);font-size:13px">
        Review questions from students. AI answers first — add your expert response below any answer.
      </p>
    </div>
    <div style="display:flex;gap:10px;align-items:center">
      <select class="filter-select" id="qaFilterSubject" onchange="loadQAThreads()">
        <option value="">All subjects</option>
      </select>
      <select class="filter-select" id="qaFilterStatus" onchange="loadQAThreads()">
        <option value="">All statuses</option>
        <option value="pending">⏳ Pending (no answer yet)</option>
        <option value="ai_only">🤖 AI answered only</option>
        <option value="answered">✅ Fully answered</option>
      </select>
    </div>
  </div>

  <div id="adminQAList">
    <p style="color:var(--muted);text-align:center;padding:40px">Click the Q&A tab to load questions.</p>
  </div>
</div>
`;


function qaAdminScripts() { return `

// ── Q&A ADMIN FUNCTIONS ──────────────────────────────────────────

// Call this when Q&A tab becomes active — update switchTab() to include:
// if (tabId === 'tab-qa') { loadQADropdowns(); loadQAThreads(); }

function loadQADropdowns() {
  const sel  = document.getElementById('qaFilterSubject');
  if (sel.options.length > 1) return; // already loaded
  const seen = new Set();
  Object.values(window.PROGRAMME_CATALOG).forEach(prog =>
    Object.values(prog.levels).forEach(lvl =>
      lvl.subjects.forEach(s => {
        if (seen.has(s.id)) return; seen.add(s.id);
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.icon + ' ' + s.name;
        sel.appendChild(opt);
      })
    )
  );
}

async function loadQAThreads() {
  const list      = document.getElementById('adminQAList');
  const subjectF  = document.getElementById('qaFilterSubject').value;
  const statusF   = document.getElementById('qaFilterStatus').value;
  const db        = window.salaDB;

  list.innerHTML = '<p style="text-align:center;padding:40px;color:var(--muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</p>';

  try {
    let query = db.collection('qa_threads').orderBy('createdAt', 'desc').limit(80);
    if (subjectF) query = query.where('subject', '==', subjectF);
    if (statusF)  query = query.where('status',  '==', statusF);

    const snap = await query.get();
    const threads = [];
    snap.forEach(doc => threads.push({ id: doc.id, ...doc.data() }));

    // Update pending badge
    const pending = threads.filter(t => !t.lecturerAnswer).length;
    const badge   = document.getElementById('pendingQABadge');
    if (badge) { badge.textContent = pending; badge.style.display = pending ? 'inline-flex' : 'none'; }

    if (!threads.length) {
      list.innerHTML = '<p style="text-align:center;padding:40px;color:var(--muted)">No questions found.</p>';
      return;
    }

    list.innerHTML = threads.map(t => {
      const subj = getSubjectName(t.subject);
      const when = t.createdAt?.toDate ? timeAgo(t.createdAt.toDate().getTime()) : '';
      const hasLecturer = !!t.lecturerAnswer;
      const hasAI       = !!t.aiAnswer;
      const statusColor = hasLecturer ? 'var(--green)' : hasAI ? 'var(--blue)' : 'var(--amber)';
      const statusLabel = hasLecturer ? '✅ Answered' : hasAI ? '🤖 AI Only' : '⏳ Pending';

      return \`
        <div style="background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-lg);
                    margin-bottom:14px;overflow:hidden;box-shadow:var(--shadow-sm)">

          <!-- Question header -->
          <div style="padding:16px 20px;display:flex;align-items:flex-start;gap:14px">
            <div style="flex:1">
              <div style="font-size:14.5px;font-weight:700;color:var(--navy);margin-bottom:6px">
                \${t.question}
              </div>
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                <span style="font-size:12px;color:var(--muted)">
                  <i class="fa-regular fa-user"></i> \${t.askedByName || 'Student'}
                  \${t.askedByRole === 'lecturer' ? '<span style="font-size:10px;font-weight:700;color:var(--teal);background:rgba(0,191,166,.1);padding:1px 6px;border-radius:3px">LECTURER</span>' : ''}
                </span>
                <span style="font-size:12px;color:var(--muted)">📚 \${subj}</span>
                <span style="font-size:12px;color:var(--muted)"><i class="fa-regular fa-clock"></i> \${when}</span>
                <span style="font-size:12px;font-weight:700;color:\${statusColor};
                       background:\${statusColor}18;padding:2px 8px;border-radius:4px">
                  \${statusLabel}
                </span>
              </div>
            </div>
          </div>

          <!-- AI answer block -->
          \${hasAI ? \`
            <div style="padding:14px 20px;background:rgba(61,90,254,.02);border-top:1px solid var(--border)">
              <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:8px;
                          display:flex;align-items:center;gap:6px">
                <i class="fa-solid fa-robot"></i> Claude AI Answer
              </div>
              <div style="font-size:13.5px;color:var(--text2);line-height:1.7;white-space:pre-wrap">\${t.aiAnswer}</div>
            </div>
          \` : ''}

          <!-- Lecturer answer (if exists) -->
          \${hasLecturer ? \`
            <div style="padding:14px 20px;background:rgba(0,191,166,.03);border-top:1px solid var(--border)">
              <div style="font-size:12px;font-weight:700;color:#009e8a;margin-bottom:8px;
                          display:flex;align-items:center;gap:6px">
                <i class="fa-solid fa-chalkboard-teacher"></i> \${t.lecturerName || 'Lecturer'}'s Answer
              </div>
              <div style="font-size:13.5px;color:var(--text2);line-height:1.7;white-space:pre-wrap">\${t.lecturerAnswer}</div>
            </div>
          \` : ''}

          <!-- Reply box (always shown for lecturers) -->
          <div style="padding:14px 20px;background:var(--surface);border-top:1px solid var(--border);
                      display:flex;gap:10px;align-items:flex-end">
            <textarea id="admin-reply-\${t.id}"
                      style="flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;
                             font-family:var(--font-b);font-size:13.5px;resize:none;min-height:42px;
                             max-height:120px;background:var(--card);color:var(--navy);transition:border .18s"
                      placeholder="\${hasLecturer ? 'Update your answer…' : 'Add your expert response…'}">\${hasLecturer ? t.lecturerAnswer : ''}</textarea>
            <button onclick="saveAdminQAReply('\${t.id}')"
                    style="padding:10px 16px;background:var(--teal);color:#fff;border:none;
                           border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;
                           font-family:var(--font-b);white-space:nowrap;transition:background .18s"
                    onmouseover="this.style.background='var(--blue)'"
                    onmouseout="this.style.background='var(--teal)'">
              <i class="fa-solid fa-paper-plane"></i>
              \${hasLecturer ? 'Update' : 'Reply'}
            </button>
          </div>

        </div>\`;
    }).join('');

  } catch(e) {
    console.error('QA load error:', e);
    list.innerHTML = '<p style="text-align:center;padding:30px;color:var(--red)">Failed to load Q&A.</p>';
  }
}

async function saveAdminQAReply(threadId) {
  const ta   = document.getElementById('admin-reply-' + threadId);
  const text = ta.value.trim();
  if (!text) { showToast('⚠️ Please write a response first.', true); return; }

  const btn  = ta.nextElementSibling;
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  btn.disabled  = true;

  try {
    await window.salaDB.collection('qa_threads').doc(threadId).update({
      lecturerAnswer:     text,
      lecturerName:       window._cachedUserData?.name || 'Lecturer',
      lecturerAnsweredAt: firebase.firestore.FieldValue.serverTimestamp(),
      status:             'answered',
    });
    showToast('✅ Answer saved. Students can now see your response.');
    await loadQAThreads();
  } catch(e) {
    showToast('❌ Failed to save.', true);
  } finally {
    btn.innerHTML = orig;
    btn.disabled  = false;
  }
}
`; }
