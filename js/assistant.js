(()=>{
const $=id=>document.getElementById(id);
let profile=null,roadmap=[],projects={},quiz={};
try{profile=JSON.parse(localStorage.getItem("skillbridge_profile")||"null")}catch(e){}
const noProfile=$("noProfile"),content=$("assistantContent");
if(!profile||!profile.targetRole){noProfile?.classList.remove("hidden");return}
content.classList.remove("hidden");

async function init(){
  const [rr,pr]=await Promise.all([fetch("data/roles.json"),fetch("data/projects.json")]);
  const roles=await rr.json(); projects=await pr.json();
  quiz=JSON.parse(localStorage.getItem("skillbridge_quiz_results")||"{}");
  const have=new Set((profile.skills||[]).map(s=>s.toLowerCase().trim()));
  roadmap=(roles[profile.targetRole]||[]).map((skill,i)=>{
    const q=quiz[skill];
    const done=have.has(skill.toLowerCase())||q?.verified===true;
    return {skill,step:i+1,status:done?"have":q?"improve":"missing",project:projects[skill]||null};
  });
  renderProfile(); greet(); renderSuggestions(); bind();
}
function renderProfile(){
  const have=roadmap.filter(x=>x.status==="have").length;
  $("aiProgress").textContent=Math.round(have/Math.max(1,roadmap.length)*100)+"%";
  $("aiMissing").textContent=roadmap.filter(x=>x.status!=="have").length;
  $("aiXP").textContent=window.SkillBridgeGamification?.getXP?.()||0;
  $("aiStudentName").textContent=profile.name||"Student"; $("aiTargetRole").textContent=profile.targetRole;
  const initials=(profile.name||"SB").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase(); $("aiAvatar").textContent=initials;
}
function addMessage(sender,text){const el=document.createElement("div");el.className="ai-message "+sender;el.textContent=text;$("chatWindow").appendChild(el);$("chatWindow").scrollTop=$("chatWindow").scrollHeight}
function greet(){addMessage("assistant",`Hi ${profile.name?.split(" ")[0]||"there"}! I’m your SkillBridge Career Copilot. Ask me about your roadmap, projects, interviews, resume or placement preparation.`)}
function renderSuggestions(){
  const qs=["What should I learn next?","Show my skill gaps","Give me a 7-day plan","Which project should I build?","How should I prepare for placements?"];
  const box=$("suggestedQuestions"); box.innerHTML=""; qs.forEach(q=>{const b=document.createElement("button");b.className="ai-suggestion";b.textContent=q;b.onclick=()=>ask(q);box.appendChild(b)});
  const quick=$("quickActions"); quick.innerHTML=""; qs.slice(0,3).forEach(q=>{const b=document.createElement("button");b.className="page-chip";b.textContent=q;b.onclick=()=>ask(q);quick.appendChild(b)});
}
function bind(){
  const input=$("chatInput"), send=$("sendBtn");
  if(!input || !send) return;
  send.type="button";
  send.onclick=()=>ask(input.value);
  input.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){
      e.preventDefault();
      ask(input.value);
    }
  });
  input.addEventListener("click",e=>e.stopPropagation());
  input.addEventListener("mousedown",e=>e.stopPropagation());
  $("clearChat").onclick=()=>{$("chatWindow").innerHTML="";greet()};
  if(getGeminiKey()){setMode("Gemini ready");}
  const q=new URLSearchParams(location.search).get("q"); if(q){$("chatInput").value=q;ask(q)}
}
function getGeminiKey(){
  const direct=String(window.SKILLBRIDGE_GEMINI_API_KEY||"").trim();
  if(direct && !direct.includes("PASTE_YOUR_GEMINI_API_KEY_HERE")) return direct;
  return "";
}
function setMode(text){$("aiModeLabel").textContent=text}
async function ask(text){
  const quotaCooldown=Number(sessionStorage.getItem("skillbridge_gemini_quota_until")||0);
  if(quotaCooldown>Date.now()){
    text=(text||"").trim(); if(!text)return; addMessage("user",text); $("chatInput").value="";
    setMode("Smart mode · Gemini quota cooldown");
    addMessage("assistant",`Gemini is currently on a short quota cooldown, so I’m using SkillBridge Smart Mode instead.\n\n${smart(text)}\n\nYou can reconnect Gemini later when the quota resets.`);
    return;
  }
  text=(text||"").trim(); if(!text)return; addMessage("user",text); $("chatInput").value="";
  const key=getGeminiKey();
  if(key){
    setMode("Gemini is thinking…");
    try{
      const savedModel=sessionStorage.getItem("skillbridge_gemini_model");
      const model=savedModel||await pickGeminiModel(key);
      const answer=await callGeminiWithFallback(key,text,true,model);
      const used=answer.model;
      sessionStorage.setItem("skillbridge_gemini_model",used);
      setMode(`Gemini ready · ${shortModel(used)}`);
      addMessage("assistant",answer.text);return
    }catch(e){
      setMode("Smart mode");
      if(e?.status===429){
        // Avoid hammering the API after quota exhaustion. This is a client-side demo cooldown only.
        sessionStorage.setItem("skillbridge_gemini_quota_until",String(Date.now()+120000));
      }
      addMessage("assistant",`Gemini is temporarily unavailable, so I switched to SkillBridge Smart Mode.

${smart(text)}

${friendlyGeminiError(e)}`);return
    }
  }
  setTimeout(()=>addMessage("assistant",smart(text)),260);
}
function smart(q){
  q=q.toLowerCase(); const missing=roadmap.filter(x=>x.status!=="have"),improve=roadmap.filter(x=>x.status==="improve"),have=roadmap.filter(x=>x.status==="have"),next=roadmap.find(x=>x.status!=="have");
  if(q.includes("next")||q.includes("learn")) return next?`Your next best move is ${next.status==="improve"?"strengthening":"learning"} ${next.skill}. It is milestone ${next.step} of ${roadmap.length}.${next.project?` Build “${next.project.project}” while learning it.`:""}`:`You’ve covered your current ${profile.targetRole} roadmap. Next, strengthen your portfolio and interview practice.`;
  if(q.includes("gap")||q.includes("missing")) return missing.length?`Your biggest gaps are: ${missing.map(x=>x.skill).join(", ")}.${improve.length ? ` Also strengthen: ${improve.map(x=>x.skill).join(", ")}.` : ""}`:`Nice — your current roadmap skills are covered.`;
  if(q.includes("7-day")||q.includes("week")) return next?`7-day sprint for ${next.skill}: Day 1 fundamentals • Day 2 examples • Day 3 practice • Day 4 mini feature • Day 5 project work • Day 6 test/fix • Day 7 publish and reflect.`:`You’re ready for a portfolio sprint.`;
  if(q.includes("project")){const p=missing.concat(improve).find(x=>x.project);return p?`Build “${p.project.project}” to strengthen ${p.skill}. Keep it small, publish it on GitHub, and write a clear README.`:"Build a capstone that combines your strongest skills and one new skill."}
  if(q.includes("placement")||q.includes("interview")) return `For ${profile.targetRole} placements, focus on ${improve[0]?.skill||missing[0]?.skill||"your weakest skill"}, then prepare 2 strong projects, a concise resume and short explanations of your technical decisions.`;
  if(q.includes("progress")) return `You’re currently at ${Math.round(have.length/Math.max(1,roadmap.length)*100)}% of your ${profile.targetRole} roadmap: ${have.length}/${roadmap.length} milestones covered.`;
  return `I can help with your next skill, gaps, projects, roadmap progress, interview prep, resume or a short learning plan.`;
}
function shortModel(model){return (model||"").replace(/^models\//,"")}
function friendlyGeminiError(err){
  const msg=(err?.message||"Gemini request failed").replace(/\s+/g," ").trim();
  const lower=msg.toLowerCase();
  if(lower.includes("high demand")||err?.status===503) return "Gemini is experiencing high demand right now. Your API key may still be valid; try again in a moment.";
  if(err?.status===429||lower.includes("rate limit")||lower.includes("quota")) return "Gemini quota/rate limit is currently exhausted for this Google project. Switching to Smart Mode is expected; changing models will not bypass a project-level quota.";
  if(err?.status===401||lower.includes("api key")||lower.includes("unauthenticated")) return "Gemini rejected the API key. Check that the key is active and belongs to the correct Google project.";
  if(err?.status===403||lower.includes("permission")||lower.includes("forbidden")) return "Gemini access was denied for this key/project. Check API access and restrictions in Google AI Studio.";
  if(err?.status===404||lower.includes("not found")) return "No compatible Gemini model was available for this API key.";
  return msg;
}
async function listGeminiModels(key){
  const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models",{method:"GET",headers:{"x-goog-api-key":key}});
  if(!res.ok){
    let detail="Could not read Gemini models";try{const d=await res.json();detail=d.error?.message||detail}catch{}
    const e=new Error(detail);e.status=res.status;throw e;
  }
  const data=await res.json();
  return (data.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent"));
}
function rankGeminiModels(models){
  // Prefer stable Flash-Lite for a student demo: it is designed for low-cost/high-volume use.
  // Then try stable Flash models. We never hard-code a single model because availability and
  // quota can vary by Google project.
  const preferred=[
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview"
  ];
  const score=m=>{
    const name=(m.name||"").replace(/^models\//,"").toLowerCase();
    let i=preferred.indexOf(name);
    let s=i<0?100:i;
    if(name.includes("preview"))s+=20;
    if(name.includes("pro"))s+=30;
    return s;
  };
  return [...models].sort((a,b)=>score(a)-score(b));
}

async function pickGeminiModel(key){
  const models=rankGeminiModels(await listGeminiModels(key));
  if(!models.length){const e=new Error("This API key has no Gemini model that supports generateContent.");e.status=404;throw e;}
  return models[0].name;
}
async function callGeminiWithFallback(key,text,withContext,preferredModel){
  let models=[];
  try{models=rankGeminiModels(await listGeminiModels(key));}catch(e){
    // If model discovery is temporarily unavailable, still try the previously saved model.
    if(preferredModel) models=[{name:preferredModel}]; else throw e;
  }
  if(preferredModel){
    const normalized=preferredModel.replace(/^models\//,"");
    models=[{name:`models/${normalized}`},...models.filter(m=>m.name.replace(/^models\//,"")!==normalized)];
  }
  let lastError=null;
  for(const m of models){
    const model=m.name||m;
    try{
      const textOut=await callGemini(key,text,withContext,model);
      return {text:textOut,model};
    }catch(e){
      lastError=e;
      // 429 means the quota/rate limit for that model/project was reached.
      // Retrying immediately only burns more requests, so move to another model instead.
      // 5xx/404 errors can be worth trying on another available model.
      if(e.status===429) continue;
      if(![404,500,502,503,504].includes(e.status||0)) break;
    }
  }
  throw lastError||new Error("Gemini is unavailable");
}
async function callGemini(key,text,withContext,modelOverride){
  const context={name:profile.name,targetRole:profile.targetRole,skills:profile.skills||[],roadmap:roadmap.map(x=>({skill:x.skill,status:x.status,step:x.step}))};
  const prompt=withContext?`You are SkillBridge Career Copilot for a college student. Give practical, concise advice. Use ONLY the supplied student context; never claim a skill is completed unless status is have. Prefer clear bullets or numbered steps. Student context: ${JSON.stringify(context)}\nUser question: ${text}`:text;
  const model=modelOverride||await pickGeminiModel(key);
  let lastError=null;
  // Retry temporary 503/5xx responses briefly before moving to another model.
  for(let attempt=0;attempt<2;attempt++){
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/${model.replace(/^models\//,"models/")}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.6,maxOutputTokens:700}})});
    if(res.ok){
      const data=await res.json();const out=data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
      if(out)return out;lastError=new Error("Gemini returned an empty response");lastError.status=502;
    }else{
      let detail="Gemini request failed";try{const d=await res.json();detail=d.error?.message||detail}catch{}
      lastError=new Error(detail);lastError.status=res.status;
      if(res.status!==503 && res.status!==500 && res.status!==502 && res.status!==504)break;
    }
    if(attempt===0) await new Promise(r=>setTimeout(r,900));
  }
  throw lastError||new Error("Gemini is unavailable");
}
init().catch(e=>{console.error(e);addMessage("assistant","I couldn’t load your career data. Run SkillBridge with Live Server and try again.")});
})();
