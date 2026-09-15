(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const savedProfile = localStorage.getItem('skillbridge_profile');

  let profile = null;
  try {
    profile = savedProfile ? JSON.parse(savedProfile) : null;
  } catch (error) {
    console.error('Saved profile is invalid:', error);
    localStorage.removeItem('skillbridge_profile');
  }

  const noProfile = $('noProfile');
  const content = $('roadmapContent');

  // If the page was opened with a different/older HTML file, fail gracefully
  // instead of throwing "Cannot set properties of null".
  if (!noProfile || !content) {
    console.error('Roadmap HTML is missing #noProfile or #roadmapContent.');
    return;
  }

  if (!profile || !profile.targetRole) {
    noProfile.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  noProfile.classList.add('hidden');
  content.classList.remove('hidden');
  loadRoadmap(profile);

  async function loadRoadmap(user) {
    try {
      const [roles, projects] = await Promise.all([
        fetch('./data/roles.json').then((r) => {
          if (!r.ok) throw new Error('Could not load roles.json');
          return r.json();
        }),
        fetch('./data/projects.json').then((r) => {
          if (!r.ok) throw new Error('Could not load projects.json');
          return r.json();
        })
      ]);

      let quizzes = {};
      let started = [];
      try { quizzes = JSON.parse(localStorage.getItem('skillbridge_quiz_results') || '{}'); } catch (_) {}
      try { started = JSON.parse(localStorage.getItem('skillbridge_started_skills') || '[]'); } catch (_) {}

      const have = new Set((user.skills || []).map((s) => String(s).toLowerCase().trim()));
      const required = roles[user.targetRole] || [];

      if (!required.length) {
        throw new Error(`No roadmap is configured for “${user.targetRole}”`);
      }

      const results = required.map((skill, index) => {
        const quiz = quizzes[skill];
        const done = have.has(skill.toLowerCase()) || quiz?.verified === true;
        return {
          skill,
          step: index + 1,
          status: done ? 'completed' : (started.includes(skill) || quiz ? 'active' : 'upcoming'),
          project: projects[skill] || null,
          quizScore: typeof quiz?.score === 'number' ? quiz.score : undefined
        };
      });

      renderRoadmap(user, results);
    } catch (error) {
      console.error(error);
      content.innerHTML = `
        <div class="roadmap-empty">
          <h1>Your roadmap needs one small fix</h1>
          <p>${escapeHtml(error.message)}. Open Settings, save your target role, then return here.</p>
          <a href="index.html">Open Settings →</a>
        </div>`;
    }
  }

  function renderRoadmap(user, results) {
    const complete = results.filter((x) => x.status === 'completed').length;
    const active = results.filter((x) => x.status === 'active').length;
    const percent = results.length ? Math.round((complete / results.length) * 100) : 0;
    const next = results.find((x) => x.status !== 'completed');

    setText('roleHeading', `${user.targetRole} Roadmap`);
    setText('roleSubtitle', `A personalized path for ${user.name || 'you'}, built from your current skills and career goal.`);
    setText('progressPercent', `${percent}%`);
    setText('progressLabel', complete
      ? `You have completed ${complete} of ${results.length} milestones. Keep going.`
      : 'Start with one focused skill today — your roadmap will grow from there.');
    setText('completeCount', complete);
    setText('remainingCount', results.length - complete);
    setText('daysEstimate', `${results.filter((x) => x.status !== 'completed').reduce((sum, x) => sum + Number(x.project?.days || 5), 0)} days`);
    setText('roadmapStatus', `${complete} completed · ${active} in progress · ${results.length} milestones`);

    const ring = $('progressRingFill');
    if (ring) {
      const circumference = 2 * Math.PI * 70;
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${circumference * (1 - percent / 100)}`;
    }

    const list = $('skillList');
    if (list) list.style.setProperty('--path-percent', `${percent}%`);

    renderFocus(next, results.length);
    renderSkills(results);
    updateSidebar(user);
  }

  function renderFocus(next, total) {
    if (!next) {
      setText('focusIcon', '✓');
      setText('focusSkill', 'You completed every milestone');
      setText('focusDescription', 'Excellent work. Build a project or retake an assessment to deepen your skills.');
      setLink('focusVideo', 'projects.html', 'Browse projects →');
      setLink('focusProject', 'assessment.html', 'Review skills →');
      return;
    }

    setText('focusIcon', next.step);
    setText('focusSkill', `Focus on ${next.skill} next`);
    setText('focusDescription', `${next.project ? `${next.project.project} · about ${next.project.days} days. ` : ''}This is milestone ${next.step} of ${total} on your path.`);
    setLink('focusVideo', `https://www.youtube.com/results?search_query=${encodeURIComponent(`${next.skill} full course for beginners`)}`, 'Watch lesson ↗');
    setLink('focusProject', `projects.html?q=${encodeURIComponent(`${next.skill} project`)}`, 'View project →');
  }

  function renderSkills(results) {
    const list = $('skillList');
    if (!list) return;

    list.innerHTML = results.map((r, index) => {
      const labels = {
        completed: 'Completed',
        active: 'In progress',
        upcoming: 'Upcoming'
      };

      const label = labels[r.status] || 'Upcoming';
      const marker = r.status === 'completed' ? '✓' : r.step;
      const meta = r.project
        ? `${r.project.level || 'Core'} · ~${r.project.days || 5} days`
        : 'Foundation skill';

      const score = r.quizScore !== undefined
        ? `<span class="visual-score">${r.quizScore}% score</span>`
        : '';

      const safeSkill = escapeHtml(r.skill);

      const action = r.status === 'completed'
        ? `<a class="milestone-action" href="assessment.html">Review</a>`
        : r.status === 'active'
          ? `<a class="milestone-action milestone-action-primary" href="learn.html#${encodeURIComponent(r.skill)}">Continue</a>`
          : `<button type="button" class="milestone-action milestone-action-primary" data-skill="${safeSkill}">Start</button>`;

      return `
        <article class="visual-milestone milestone-${r.status}" data-step="${r.step}">
          <div class="visual-node">${marker}</div>

          <div class="visual-card">
            <div class="visual-card-top">
              <span class="visual-step">STEP ${String(r.step).padStart(2, '0')}</span>
              <span class="milestone-chip milestone-chip-${r.status}">${label}</span>
            </div>

            <h3>${safeSkill}</h3>

            <p class="visual-project">
              ${escapeHtml(r.project?.project || 'Build practical knowledge and confidence in this skill.')}
            </p>

            <div class="visual-meta">
              <span>◷ ${escapeHtml(meta)}</span>
              ${score}
            </div>

            <div class="visual-actions">${action}</div>
          </div>
        </article>
      `;
    }).join('');

    list.querySelectorAll('button[data-skill]').forEach((button) => {
      button.addEventListener('click', () => startSkill(button.dataset.skill));
    });

    const goalText = $('careerGoalText');
    if (goalText) {
      const completed = results.filter((x) => x.status === 'completed').length;
      goalText.textContent = completed === results.length
        ? 'You made it — keep building proof.'
        : `${completed} of ${results.length} milestones completed`;
    }
  }

  function startSkill(skill) {
    let started = [];
    try { started = JSON.parse(localStorage.getItem('skillbridge_started_skills') || '[]'); } catch (_) {}
    if (!started.includes(skill)) started.push(skill);
    localStorage.setItem('skillbridge_started_skills', JSON.stringify(started));
    window.location.href = `learn.html#${encodeURIComponent(skill)}`;
  }

  function updateSidebar(user) {
    setText('sidebarName', user.name || 'SkillBridge Student');
    const initials = String(user.name || 'SkillBridge')
      .split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
    setText('sidebarInitials', initials || 'SB');

    const avatar = $('sidebarAvatar');
    if (avatar && user.avatar) {
      avatar.src = user.avatar;
      avatar.classList.add('show');
    }
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function setLink(id, href, label) {
    const el = $(id);
    if (!el) return;
    el.href = href;
    el.textContent = label;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }
})();
