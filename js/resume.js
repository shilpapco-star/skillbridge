(() => {
  const $ = (id) => document.getElementById(id);

  const profileRaw = localStorage.getItem("skillbridge_profile");

  // If there is no profile, show the profile message
  if (!profileRaw) {
    if ($("noProfile")) $("noProfile").classList.remove("hidden");
    return;
  }

  if ($("resumeContent")) {
    $("resumeContent").classList.remove("hidden");
  }

  let profile = {};

  try {
    profile = JSON.parse(profileRaw);
  } catch (error) {
    console.log("Profile data could not be loaded.");
  }

  const STORAGE_KEY = "skillbridge_resume_studio";

  /*
   * ---------------------------------------------------------
   * DEFAULT / SAMPLE DATA
   * ---------------------------------------------------------
   */

  const sample = {
    name: profile.name || "",
    role: profile.targetRole || "Software Developer",

    email: "",
    phone: "",
    location: "Bengaluru, India",

    linkedin: "",
    github: "",
    portfolio: "",

    summary:
      "Computer Science student with hands-on experience building practical software projects. Strong foundation in programming, databases and web development, with a focus on creating useful and user-friendly solutions.",

    skills:
      profile.skills && profile.skills.length
        ? profile.skills.join(", ")
        : "JavaScript, Python, SQL, Git, HTML, CSS",

    education: [
      {
        degree: "B.E. Computer Science & Engineering",
        school: "Sapthagiri NPS University",
        year: "2028",
        details:
          "Relevant coursework: Data Structures, DBMS, Computer Networks"
      }
    ],

    projects: [
      {
        name: "SkillBridge Career Platform",
        tech: "HTML, CSS, JavaScript, Firebase",
        desc:
          "Built an interactive career platform connecting student profiles, assessments, learning roadmaps and projects in one workflow."
      }
    ],

    experience: [],

    achievements:
      "Participated in technical projects and hackathon preparation\nBuilt academic web applications"
  };

  let state = loadState();

  /*
   * ---------------------------------------------------------
   * LOAD / SAVE
   * ---------------------------------------------------------
   */

  function loadState() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "null"
      );

      if (saved) {
        return {
          ...sample,
          ...saved
        };
      }
    } catch (error) {
      console.log("Could not load saved resume.");
    }

    return {
      ...sample
    };
  }

  function saveResume() {
    collectFormData();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

    showSaveStatus("Saved just now");

    setTimeout(() => {
      showSaveStatus("Auto-saved locally");
    }, 1600);
  }

  function autoSave() {
    collectFormData();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  function showSaveStatus(message) {
    const status = $("previewStatus");

    if (status) {
      status.textContent = message;
    }
  }

  /*
   * ---------------------------------------------------------
   * COLLECT FORM DATA
   * ---------------------------------------------------------
   */

  function collectFormData() {
    state.name = value("rName");
    state.role = value("rRole");
    state.email = value("rEmail");
    state.phone = value("rPhone");
    state.location = value("rLocation");

    state.linkedin = value("rLinkedin");
    state.github = value("rGithub");
    state.portfolio = value("rPortfolio");

    state.summary = value("rSummary");
    state.skills = value("rSkills");
    state.achievements = value("rAchievements");

    state.education = readRows("education");
    state.projects = readRows("project");
    state.experience = readRows("experience");
  }

  function value(id) {
    const element = $(id);

    return element
      ? element.value.trim()
      : "";
  }

  function readRows(type) {
    const rows = document.querySelectorAll(
      `[data-row="${type}"]`
    );

    return [...rows].map((row) => {
      const object = {};

      row.querySelectorAll("[data-field]").forEach((field) => {
        object[field.dataset.field] =
          field.value.trim();
      });

      return object;
    });
  }

  /*
   * ---------------------------------------------------------
   * RENDER FORM
   * ---------------------------------------------------------
   */

  function renderForm() {
    setValue("rName", state.name);
    setValue("rRole", state.role);

    setValue("rEmail", state.email);
    setValue("rPhone", state.phone);
    setValue("rLocation", state.location);

    setValue("rLinkedin", state.linkedin);
    setValue("rGithub", state.github);
    setValue("rPortfolio", state.portfolio);

    setValue("rSummary", state.summary);
    setValue("rSkills", state.skills);
    setValue("rAchievements", state.achievements);

    renderRows(
      "educationList",
      "education",
      state.education || []
    );

    renderRows(
      "projectList",
      "project",
      state.projects || []
    );

    renderRows(
      "experienceList",
      "experience",
      state.experience || []
    );

    updateEverything();
  }

  function setValue(id, value) {
    const element = $(id);

    if (element) {
      element.value = value || "";
    }
  }

  /*
   * ---------------------------------------------------------
   * DYNAMIC EDUCATION / PROJECT / EXPERIENCE
   * ---------------------------------------------------------
   */

  function renderRows(containerId, type, rows) {
    const container = $(containerId);

    if (!container) return;

    container.innerHTML = "";

    const data =
      rows.length > 0
        ? rows
        : [{}];

    data.forEach((row) => {
      addRow(type, row, false);
    });
  }

  function addRow(type, row = {}, shouldSave = true) {
    const container =
      type === "education"
        ? $("educationList")
        : type === "project"
        ? $("projectList")
        : $("experienceList");

    if (!container) return;

    const element = document.createElement("div");

    element.className = "dynamic-row";
    element.dataset.row = type;

    let fields = [];

    if (type === "education") {
      fields = [
        [
          "degree",
          "Degree / course",
          "e.g. B.E. Computer Science",
          "input"
        ],
        [
          "school",
          "College / institution",
          "Institution name",
          "input"
        ],
        [
          "year",
          "Year",
          "2028",
          "input"
        ],
        [
          "details",
          "Details",
          "CGPA, coursework, achievements",
          "textarea"
        ]
      ];
    }

    if (type === "project") {
      fields = [
        [
          "name",
          "Project name",
          "Project title",
          "input"
        ],
        [
          "tech",
          "Technologies",
          "JavaScript, SQL, Firebase",
          "input"
        ],
        [
          "desc",
          "Impact / description",
          "What you built, how you built it and the result",
          "textarea"
        ]
      ];
    }

    if (type === "experience") {
      fields = [
        [
          "title",
          "Role",
          "Software Intern",
          "input"
        ],
        [
          "company",
          "Company",
          "Company name",
          "input"
        ],
        [
          "year",
          "Duration",
          "Jun 2026 – Aug 2026",
          "input"
        ],
        [
          "desc",
          "Impact / responsibilities",
          "Use action verbs and measurable results",
          "textarea"
        ]
      ];
    }

    element.innerHTML = `
      <button
        type="button"
        class="remove-row"
        aria-label="Remove"
      >
        ×
      </button>

      <div class="dynamic-grid">

        ${fields
          .map(
            ([field, label, placeholder, inputType]) => `
              <label>
                ${label}

                ${
                  inputType === "textarea"
                    ? `
                      <textarea
                        data-field="${field}"
                        rows="2"
                        placeholder="${placeholder}"
                      >${escapeHtml(
                        row[field] || ""
                      )}</textarea>
                    `
                    : `
                      <input
                        type="text"
                        data-field="${field}"
                        value="${escapeAttribute(
                          row[field] || ""
                        )}"
                        placeholder="${placeholder}"
                      >
                    `
                }

              </label>
            `
          )
          .join("")}

      </div>
    `;

    const removeButton =
      element.querySelector(".remove-row");

    removeButton.addEventListener("click", () => {
      element.remove();

      updateEverything();
      autoSave();
    });

    container.appendChild(element);

    if (shouldSave) {
      updateEverything();
      autoSave();
    }
  }

  /*
   * ---------------------------------------------------------
   * UPDATE EVERYTHING
   * ---------------------------------------------------------
   */

  function updateEverything() {
    collectFormData();

    renderPreview();
    renderSkillChips();
    updateHealth();

    updateSummaryCounter();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  /*
   * ---------------------------------------------------------
   * SKILL CHIPS
   * ---------------------------------------------------------
   */

  function renderSkillChips() {
    const container = $("skillChips");

    if (!container) return;

    const skills = state.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    container.innerHTML = skills
      .map(
        (skill) => `
          <span class="edit-chip">
            ${escapeHtml(skill)}
          </span>
        `
      )
      .join("");
  }

  /*
   * ---------------------------------------------------------
   * LIVE RESUME PREVIEW
   * ---------------------------------------------------------
   */

  function renderPreview() {
    if ($("pName")) {
      $("pName").textContent =
        state.name || "Your Name";
    }

    if ($("pRole")) {
      $("pRole").textContent =
        state.role || "Target Role";
    }

    /*
     * Contact details
     */

    const contacts = [
      state.email,
      state.phone,
      state.location,
      state.linkedin,
      state.github,
      state.portfolio
    ].filter(Boolean);

    if ($("pContact")) {
      $("pContact").innerHTML =
        contacts
          .map(
            (contact) =>
              `<span>${escapeHtml(
                contact
              )}</span>`
          )
          .join("");
    }

    /*
     * Summary
     */

    if ($("pSummary")) {
      $("pSummary").textContent =
        state.summary ||
        "Add a professional summary to see it here.";
    }

    /*
     * Skills
     */

    if ($("pSkills")) {
      $("pSkills").textContent =
        state.skills ||
        "Add your technical skills.";
    }

    /*
     * Experience
     */

    const experiences =
      state.experience || [];

    if ($("pExperienceSection")) {
      $("pExperienceSection").style.display =
        experiences.length > 0
          ? "block"
          : "none";
    }

    if ($("pExperience")) {
      $("pExperience").innerHTML =
        experiences
          .map((item) =>
            createResumeItem(
              item,
              "experience"
            )
          )
          .join("");
    }

    /*
     * Projects
     */

    const projects =
      state.projects || [];

    if ($("pProjectsSection")) {
      $("pProjectsSection").style.display =
        projects.length > 0
          ? "block"
          : "none";
    }

    if ($("pProjects")) {
      $("pProjects").innerHTML =
        projects
          .map((item) =>
            createResumeItem(
              item,
              "project"
            )
          )
          .join("");
    }

    /*
     * Education
     */

    const education =
      state.education || [];

    if ($("pEducationSection")) {
      $("pEducationSection").style.display =
        education.length > 0
          ? "block"
          : "none";
    }

    if ($("pEducation")) {
      $("pEducation").innerHTML =
        education
          .map((item) =>
            createResumeItem(
              item,
              "education"
            )
          )
          .join("");
    }

    /*
     * Achievements
     */

    const achievements =
      (state.achievements || "")
        .split(/\n+/)
        .map((item) =>
          item
            .replace(/^[•*-]\s*/, "")
            .trim()
        )
        .filter(Boolean);

    if ($("pAchievementsSection")) {
      $("pAchievementsSection").style.display =
        achievements.length > 0
          ? "block"
          : "none";
    }

    if ($("pAchievements")) {
      $("pAchievements").innerHTML =
        achievements
          .map(
            (achievement) => `
              <div class="paper-item">
                <span>
                  • ${escapeHtml(
                    achievement
                  )}
                </span>
              </div>
            `
          )
          .join("");
    }
  }

  function createResumeItem(item, type) {
    if (type === "project") {
      return `
        <div class="paper-item">

          <div class="paper-item-head">
            <strong>
              ${escapeHtml(
                item.name ||
                  "Project"
              )}
            </strong>

            <em>
              ${escapeHtml(
                item.tech || ""
              )}
            </em>
          </div>

          <p>
            ${escapeHtml(
              item.desc || ""
            )}
          </p>

        </div>
      `;
    }

    if (type === "education") {
      return `
        <div class="paper-item">

          <div class="paper-item-head">
            <strong>
              ${escapeHtml(
                item.degree ||
                  "Degree"
              )}
            </strong>

            <small>
              ${escapeHtml(
                item.year || ""
              )}
            </small>
          </div>

          <div>
            <em>
              ${escapeHtml(
                item.school || ""
              )}
            </em>
          </div>

          <p>
            ${escapeHtml(
              item.details || ""
            )}
          </p>

        </div>
      `;
    }

    return `
      <div class="paper-item">

        <div class="paper-item-head">
          <strong>
            ${escapeHtml(
              item.title ||
                "Role"
            )}

            ${
              item.company
                ? ` · ${escapeHtml(
                    item.company
                  )}`
                : ""
            }
          </strong>

          <small>
            ${escapeHtml(
              item.year || ""
            )}
          </small>
        </div>

        <p>
          ${escapeHtml(
            item.desc || ""
          )}
        </p>

      </div>
    `;
  }

  /*
   * ---------------------------------------------------------
   * RESUME HEALTH
   * ---------------------------------------------------------
   */

  function updateHealth() {
    const completeText = [
      state.name,
      state.role,
      state.summary,
      state.skills,
      state.achievements,

      ...(state.projects || []).map(
        (project) =>
          `${project.name} ${project.tech} ${project.desc}`
      ),

      ...(state.experience || []).map(
        (experience) =>
          `${experience.title} ${experience.company} ${experience.desc}`
      )
    ].join(" ");

    const checks = [
      {
        title: "Contact details",
        pass:
          !!state.name &&
          !!state.email &&
          !!state.phone,
        tip:
          "Add your name, email and phone."
      },

      {
        title: "Target role",
        pass: !!state.role,
        tip:
          "Set the role you want to apply for."
      },

      {
        title: "Professional summary",
        pass:
          state.summary.length >= 80,
        tip:
          "Aim for a focused 2–3 line summary."
      },

      {
        title: "Technical skills",
        pass:
          state.skills
            .split(",")
            .filter(Boolean)
            .length >= 5,
        tip:
          "Add at least 5 relevant technical skills."
      },

      {
        title: "Projects",
        pass:
          (state.projects || []).some(
            (project) =>
              project.name &&
              project.desc
          ),
        tip:
          "Add at least one strong project."
      },

      {
        title: "Education",
        pass:
          (state.education || []).some(
            (education) =>
              education.degree &&
              education.school
          ),
        tip:
          "Add your latest education."
      },

      {
        title: "Measurable impact",
        pass:
          /\b\d+%|\b\d+\+|\b\d+\s*(users|projects|students|requests|records|hours|days)\b/i.test(
            completeText
          ),
        tip:
          "Use numbers or measurable results where possible."
      }
    ];

    const container =
      $("healthChecks");

    if (!container) return;

    container.innerHTML =
      checks
        .map(
          (check) => `
            <div class="health-item">

              <span
                class="health-icon ${
                  check.pass
                    ? "health-pass"
                    : "health-warn"
                }"
              >
                ${
                  check.pass
                    ? "✓"
                    : "!"
                }
              </span>

              <div>

                <strong>
                  ${escapeHtml(
                    check.title
                  )}
                </strong>

                <p>
                  ${
                    check.pass
                      ? "Looks good"
                      : escapeHtml(
                          check.tip
                        )
                  }
                </p>

              </div>

            </div>
          `
        )
        .join("");
  }

  /*
   * ---------------------------------------------------------
   * JOB DESCRIPTION MATCHER
   * ---------------------------------------------------------
   */

  const skillAliases = {
    html: ["html", "html5"],

    css: ["css", "css3"],

    javascript: [
      "javascript",
      "js",
      "ecmascript"
    ],

    typescript: [
      "typescript",
      "ts"
    ],

    react: [
      "react",
      "reactjs",
      "react.js"
    ],

    "node.js": [
      "node.js",
      "nodejs"
    ],

    python: ["python"],

    java: ["java"],

    sql: [
      "sql",
      "mysql",
      "postgresql"
    ],

    git: [
      "git",
      "github"
    ],

    docker: ["docker"],

    aws: [
      "aws",
      "amazon web services"
    ],

    "rest apis": [
      "rest api",
      "restful",
      "rest apis"
    ],

    "data structures": [
      "data structures",
      "dsa"
    ],

    algorithms: [
      "algorithms",
      "algorithm"
    ],

    pandas: ["pandas"],

    excel: ["excel"],

    "power bi": [
      "power bi",
      "powerbi"
    ],

    tableau: ["tableau"],

    mongodb: [
      "mongodb",
      "mongo"
    ],

    firebase: ["firebase"],

    fastapi: ["fastapi"],

    streamlit: ["streamlit"],

    "machine learning": [
      "machine learning",
      "ml"
    ],

    "artificial intelligence": [
      "artificial intelligence",
      "ai"
    ],

    "problem solving": [
      "problem solving"
    ]
  };

  function matchJobDescription() {
    const jobDescription =
      value("jobDescription").toLowerCase();

    if (!jobDescription) {
      alert(
        "Please paste a job description first."
      );
      return;
    }

    const resumeText = `
      ${state.role}
      ${state.summary}
      ${state.skills}
      ${state.achievements}

      ${(state.projects || [])
        .map(
          (project) =>
            `${project.name}
             ${project.tech}
             ${project.desc}`
        )
        .join(" ")}

      ${(state.experience || [])
        .map(
          (experience) =>
            `${experience.title}
             ${experience.company}
             ${experience.desc}`
        )
        .join(" ")}
    `.toLowerCase();

    const matched = [];
    const missing = [];

    Object.entries(skillAliases)
      .forEach(
        ([skill, aliases]) => {

          const existsInJob =
            aliases.some(
              (alias) =>
                jobDescription.includes(
                  alias
                )
            );

          if (!existsInJob) return;

          const existsInResume =
            aliases.some(
              (alias) =>
                resumeText.includes(
                  alias
                )
            );

          if (existsInResume) {
            matched.push(skill);
          } else {
            missing.push(skill);
          }
        }
      );

    const total =
      matched.length +
      missing.length;

    const score =
      total === 0
        ? 0
        : Math.round(
            (matched.length /
              total) *
              100
          );

    displayJobMatch(
      score,
      matched,
      missing
    );
  }

  function displayJobMatch(
    score,
    matched,
    missing
  ) {
    const results =
      $("jobMatchResults");

    if (!results) return;

    results.classList.remove(
      "hidden"
    );

    results.innerHTML = `
      <div class="match-score">

        <div
          class="match-score-ring"
          style="--score:${
            score * 3.6
          }deg"
        >
          <strong>
            ${score}%
          </strong>
        </div>

        <div>

          <h3>
            ${
              score >= 80
                ? "Strong match"
                : score >= 50
                ? "Good starting point"
                : "Needs improvement"
            }
          </h3>

          <p>
            ${matched.length}
            relevant skills matched ·
            ${missing.length}
            skills to strengthen
          </p>

        </div>

      </div>

      <div class="match-columns">

        <div
          class="match-box match-good"
        >

          <h4>
            ✓ Already matched
          </h4>

          <ul>

            ${
              matched.length
                ? matched
                    .map(
                      (skill) =>
                        `<li>${escapeHtml(
                          skill
                        )}</li>`
                    )
                    .join("")
                : "<li>No clear matches yet</li>"
            }

          </ul>

        </div>

        <div
          class="match-box match-gap"
        >

          <h4>
            ! Strengthen these
          </h4>

          <ul>

            ${
              missing.length
                ? missing
                    .map(
                      (skill) =>
                        `<li>${escapeHtml(
                          skill
                        )}</li>`
                    )
                    .join("")
                : "<li>No major skill gaps detected</li>"
            }

          </ul>

        </div>

      </div>

      ${
        missing.length
          ? `
            <div class="keyword-row">
              <strong>
                Tip:
              </strong>

              Only add missing skills
              if you genuinely have
              experience with them.
            </div>
          `
          : ""
      }
    `;
  }

  /*
   * ---------------------------------------------------------
   * AI-STYLE SUMMARY IMPROVEMENT
   * ---------------------------------------------------------
   *
   * This works without an API call.
   * Later we can connect it to your Gemini assistant.
   */

  function improveSummary() {
    const role =
      state.role ||
      profile.targetRole ||
      "Software Developer";

    const skills =
      state.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 6);

    const skillText =
      skills.length
        ? skills.join(", ")
        : "software development";

    const improved =
      `Computer Science student targeting ${role}, with hands-on experience building practical projects using ${skillText}. Strong problem-solving foundation with a focus on developing reliable, user-focused solutions and continuously improving technical skills.`;

    setValue(
      "rSummary",
      improved.slice(0, 300)
    );

    updateEverything();
    autoSave();
  }

  /*
   * ---------------------------------------------------------
   * SAMPLE DATA
   * ---------------------------------------------------------
   */

  function loadSampleResume() {
    state = {
      ...sample,

      education: [
        ...sample.education
      ],

      projects: [
        ...sample.projects
      ],

      experience: [
        ...sample.experience
      ]
    };

    renderForm();
    saveResume();
  }

  /*
   * ---------------------------------------------------------
   * DOWNLOAD / PRINT
   * ---------------------------------------------------------
   */

  function downloadResume() {
    collectFormData();

    const originalTitle =
      document.title;

    document.title =
      `${state.name || "Resume"} - SkillBridge`;

    window.print();

    setTimeout(() => {
      document.title =
        originalTitle;
    }, 1000);
  }

  /*
   * ---------------------------------------------------------
   * TABS
   * ---------------------------------------------------------
   */

  function setupTabs() {
    document
      .querySelectorAll(".studio-tab")
      .forEach((tab) => {

        tab.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".studio-tab"
              )
              .forEach((item) =>
                item.classList.remove(
                  "active"
                )
              );

            document
              .querySelectorAll(
                ".studio-panel"
              )
              .forEach((panel) =>
                panel.classList.remove(
                  "active"
                )
              );

            tab.classList.add(
              "active"
            );

            const target =
              $(
                `${tab.dataset.tab}Tab`
              );

            if (target) {
              target.classList.add(
                "active"
              );
            }
          }
        );
      });
  }

  /*
   * ---------------------------------------------------------
   * EVENTS
   * ---------------------------------------------------------
   */

  function setupEvents() {

    document
      .querySelectorAll(
        "#builderTab input, #builderTab textarea"
      )
      .forEach((element) => {

        element.addEventListener(
          "input",
          () => {
            updateEverything();
          }
        );

      });

    if ($("saveResumeBtn")) {
      $("saveResumeBtn").addEventListener(
        "click",
        saveResume
      );
    }

    if ($("printResumeBtn")) {
      $("printResumeBtn").addEventListener(
        "click",
        downloadResume
      );
    }

    if ($("loadSampleBtn")) {
      $("loadSampleBtn").addEventListener(
        "click",
        loadSampleResume
      );
    }

    if ($("improveSummaryBtn")) {
      $("improveSummaryBtn").addEventListener(
        "click",
        improveSummary
      );
    }

    if ($("addEducation")) {
      $("addEducation").addEventListener(
        "click",
        () =>
          addRow("education")
      );
    }

    if ($("addProject")) {
      $("addProject").addEventListener(
        "click",
        () =>
          addRow("project")
      );
    }

    if ($("addExperience")) {
      $("addExperience").addEventListener(
        "click",
        () =>
          addRow("experience")
      );
    }

    if ($("matchJobBtn")) {
      $("matchJobBtn").addEventListener(
        "click",
        matchJobDescription
      );
    }

    if ($("jobDescription")) {
      $("jobDescription").addEventListener(
        "input",
        () => {

          const text =
            $("jobDescription")
              .value
              .trim();

          const words =
            text
              ? text.split(/\s+/).length
              : 0;

          if ($("jdWords")) {
            $("jdWords").textContent =
              `${words} words`;
          }

        }
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * SUMMARY COUNTER
   * ---------------------------------------------------------
   */

  function updateSummaryCounter() {
    const summary =
      $("rSummary");

    const counter =
      $("summaryCount");

    if (
      summary &&
      counter
    ) {
      counter.textContent =
        `${summary.value.length} / 300`;
    }
  }

  /*
   * ---------------------------------------------------------
   * SECURITY / HTML HELPERS
   * ---------------------------------------------------------
   */

  function escapeHtml(value) {
    return String(value || "")
      .replace(
        /[&<>"']/g,
        (character) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[character])
      );
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  /*
   * ---------------------------------------------------------
   * INITIALIZE
   * ---------------------------------------------------------
   */

  setupTabs();
  setupEvents();
  renderForm();

})();