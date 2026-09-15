const profileData = JSON.parse(localStorage.getItem("skillbridge_profile") || "{}");

const lessons = [
  { skill:"HTML", title:"HTML for beginners", desc:"Build the structure of a clean, accessible page.", time:"45 min", kind:"foundation", videoId:"kUMe1FH4CHE", channel:"freeCodeCamp.org" },
  { skill:"CSS", title:"Modern CSS layouts", desc:"Master responsive layouts with Flexbox and Grid.", time:"52 min", kind:"foundation", videoId:"OXGznpKZ_sA", channel:"freeCodeCamp.org" },
  { skill:"JavaScript", title:"JavaScript essentials", desc:"Make interfaces respond to people and data.", time:"1 hr 10 min", kind:"foundation", videoId:"PkZNo7MFNFg", channel:"freeCodeCamp.org" },
  { skill:"Git", title:"Git & GitHub workflow", desc:"Track work and collaborate with confidence.", time:"38 min", kind:"practice", videoId:"RGOj5yH7evk", channel:"freeCodeCamp.org" },
  { skill:"React", title:"React component thinking", desc:"Create reusable interfaces from small building blocks.", time:"1 hr 15 min", kind:"practice", videoId:"bMknfKXIFA8", channel:"freeCodeCamp.org" },
  { skill:"Python", title:"Python foundations", desc:"Use code to solve small, real-world problems.", time:"55 min", kind:"foundation", videoId:"rfscVS0vtbw", channel:"freeCodeCamp.org" },
  { skill:"SQL", title:"SQL in one session", desc:"Ask useful questions of structured data.", time:"48 min", kind:"foundation", videoId:"HXV3zeQKqGY", channel:"freeCodeCamp.org" },
  { skill:"Node.js", title:"Node.js API basics", desc:"Build a useful backend endpoint from scratch.", time:"1 hr 8 min", kind:"practice", videoId:"Oe421EPjeBE", channel:"freeCodeCamp.org" },
  { skill:"Excel", title:"Excel for analysis", desc:"Turn everyday spreadsheets into useful insights.", time:"42 min", kind:"foundation", videoId:"Vl0H-qTclOg", channel:"freeCodeCamp.org" }
];

let filter = "all";
let query = "";
const target = new Set(profileData.skills || []);
const completed = new Set(JSON.parse(localStorage.getItem("skillbridge_learning_completed") || "[]"));

function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function render() {
  const visible = lessons.filter(x =>
    (filter === "all" || x.kind === filter) &&
    `${x.skill} ${x.title}`.toLowerCase().includes(query)
  );

  const library = document.getElementById("lessonLibrary");
  if (!library) return;

  library.innerHTML = visible.length ? visible.map((x, i) => {
    const isDone = completed.has(x.skill);
    const onPath = target.has(x.skill);
    return `
      <article id="${x.skill}" class="video-card ${isDone ? "is-complete" : ""}" style="--delay:${i * 45}ms">
        <button class="video-thumb" type="button" data-video="${x.videoId}" data-title="${x.title}" aria-label="Play ${x.title}">
          <img src="${youtubeThumb(x.videoId)}" alt="${x.title} YouTube thumbnail" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('thumb-fallback')">
          <span class="thumb-shade"></span>
          <span class="video-type">${x.kind}</span>
          <span class="play-button"><span class="material-symbols-outlined">play_arrow</span></span>
          <span class="thumb-caption">Watch inside SkillBridge</span>
        </button>
        <div class="video-body">
          <div class="lesson-meta"><span class="skill-dot"></span>${x.skill}${onPath ? " · on your path" : ""}</div>
          <h2>${x.title}</h2>
          <p>${x.desc}</p>
          <div class="video-footer">
            <span class="lesson-time"><span class="material-symbols-outlined">schedule</span>${x.time}</span>
            <div class="lesson-actions">
              <button class="mark-btn ${isDone ? "done" : ""}" type="button" data-complete="${x.skill}">
                <span class="material-symbols-outlined">${isDone ? "check_circle" : "radio_button_unchecked"}</span>
                ${isDone ? "Completed" : "Mark complete"}
              </button>
              <a target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${x.videoId}">YouTube ↗</a>
            </div>
          </div>
        </div>
      </article>`;
  }).join("") : `<div class="library-empty">No lessons match that search. Try a skill such as JavaScript or Python.</div>`;

  bindLessonActions();
  updateLibraryStats();
}

function bindLessonActions() {
  document.querySelectorAll("[data-video]").forEach(button => {
    button.addEventListener("click", () => openVideo(button.dataset.video, button.dataset.title));
  });

  document.querySelectorAll("[data-complete]").forEach(button => {
    button.addEventListener("click", () => {
      const skill = button.dataset.complete;
      if (completed.has(skill)) completed.delete(skill);
      else completed.add(skill);
      localStorage.setItem("skillbridge_learning_completed", JSON.stringify([...completed]));
      render();
    });
  });
}

function openVideo(videoId, title) {
  const modal = document.getElementById("videoModal");
  const frame = document.getElementById("learningVideoFrame");
  const titleEl = document.getElementById("videoModalTitle");
  if (!modal || !frame) return;
  titleEl.textContent = title;
  frame.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("video-modal-open");
}

function closeVideo() {
  const modal = document.getElementById("videoModal");
  const frame = document.getElementById("learningVideoFrame");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (frame) frame.src = "";
  document.body.classList.remove("video-modal-open");
}

function updateLibraryStats() {
  const count = document.getElementById("lessonCount");
  const completedEl = document.getElementById("completedCount");
  const progress = document.getElementById("learningProgress");
  if (count) count.textContent = lessons.length;
  if (completedEl) completedEl.textContent = completed.size;
  if (progress) progress.style.width = `${Math.round((completed.size / lessons.length) * 100)}%`;
}

document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(x => x.classList.toggle("active", x === button));
    render();
  });
});

const search = document.getElementById("lessonSearch");
if (search) search.addEventListener("input", e => {
  query = e.target.value.toLowerCase().trim();
  render();
});

document.getElementById("closeVideo")?.addEventListener("click", closeVideo);
document.getElementById("videoModalBackdrop")?.addEventListener("click", closeVideo);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeVideo();
});

render();
