(function(){
  const saved=localStorage.getItem("skillbridge_theme");
  if(saved==="dark"||saved==="light") document.documentElement.setAttribute("data-theme",saved);
  function ready(){
    const btn=document.getElementById("themeToggle");
    if(!btn) return;
    const update=()=>{
      const dark=document.documentElement.getAttribute("data-theme")==="dark";
      btn.innerHTML=`<span class="material-symbols-outlined">${dark?"light_mode":"dark_mode"}</span><span>Appearance</span>`;
      btn.setAttribute("aria-label",dark?"Switch to light mode":"Switch to dark mode");
      btn.dataset.theme=dark?"dark":"light";
    };
    if(!document.documentElement.getAttribute("data-theme")){
      const prefers=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme",prefers?"dark":"light");
    }
    update();
    btn.addEventListener("click",()=>{
      const next=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
      document.documentElement.setAttribute("data-theme",next);
      localStorage.setItem("skillbridge_theme",next);
      update();
      window.dispatchEvent(new CustomEvent("skillbridge:theme",{detail:{theme:next}}));
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",ready,{once:true}); else ready();
})();
