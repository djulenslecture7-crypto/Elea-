const form=document.getElementById("chatForm");
const input=document.getElementById("messageInput");
const messages=document.getElementById("messages");
const typing=document.getElementById("typing");
const quickReplies=document.getElementById("quickReplies");
const statusText=document.getElementById("statusText");
const sidebar=document.getElementById("sidebar");

// 👉 Remplace par l'URL de ton déploiement Vercel (ex: "https://elea-app.vercel.app")
const API_BASE_URL = "https://elea-eight.vercel.app";

// Historique de conversation, persisté sur l'appareil pour qu'Eléa "se souvienne" entre deux ouvertures de l'app
let conversationHistory = JSON.parse(localStorage.getItem("elea-history") || "[]");
function saveHistory(){ localStorage.setItem("elea-history", JSON.stringify(conversationHistory.slice(-30))); }

// ---------- Souvenirs (persistés sur l'appareil) ----------
const MEMORY_KEYS = { about:"elea-memories-about", recent:"elea-memories-recent", moments:"elea-memories-moments" };
function loadMemories(kind){ return JSON.parse(localStorage.getItem(MEMORY_KEYS[kind]) || "[]"); }
function saveMemories(kind, list){ localStorage.setItem(MEMORY_KEYS[kind], JSON.stringify(list)); }

function formatMemoryDate(iso){
 const date = new Date(iso), now = new Date();
 const diffMs = now - date, diffMin = Math.floor(diffMs/60000);
 if(diffMin < 2) return "À l'instant";
 if(diffMin < 60) return `Il y a ${diffMin} min`;
 const isSameDay = date.toDateString() === now.toDateString();
 if(isSameDay) return "Aujourd’hui";
 const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
 if(date.toDateString() === yesterday.toDateString()) return "Hier";
 return date.toLocaleDateString("fr-FR", { day:"numeric", month:"long" });
}

function addAboutMemory(icon, text){
 const list = loadMemories("about");
 if(list.some(m=>m.text.trim().toLowerCase() === text.trim().toLowerCase())) return;
 list.push({ id: Date.now()+Math.random(), icon: icon||"✨", text, date: new Date().toISOString() });
 saveMemories("about", list); renderAboutMemories();
}
function addRecentMemory(text){
 const list = loadMemories("recent");
 list.unshift({ id: Date.now()+Math.random(), text, date: new Date().toISOString() });
 saveMemories("recent", list.slice(0,20)); renderRecentMemories();
}
function addMomentMemory(text){
 const list = loadMemories("moments");
 list.push({ id: Date.now()+Math.random(), text, date: new Date().toISOString() });
 saveMemories("moments", list); renderMoments();
}

function renderAboutMemories(){
 const container = document.getElementById("aboutMemoryList"); if(!container) return;
 const list = loadMemories("about");
 container.innerHTML = "";
 if(list.length===0){
  container.innerHTML = `<p class="memory-empty">Rien encore. Au fil de vos conversations, Éléa notera ici ce qu’elle apprend sur toi. 🤍</p>`;
  return;
 }
 list.forEach(item=>{
  const row = document.createElement("div");
  row.innerHTML = `<span>${item.icon}</span><p></p><button class="text-btn" data-edit-about="${item.id}">Modifier</button>`;
  row.querySelector("p").textContent = item.text;
  container.appendChild(row);
 });
}
function renderRecentMemories(){
 const container = document.getElementById("recentMemoryList"); if(!container) return;
 const list = loadMemories("recent");
 container.innerHTML = "";
 if(list.length===0){
  container.innerHTML = `<p class="memory-empty">Aucun souvenir récent pour l’instant.</p>`;
  return;
 }
 list.forEach(item=>{
  const row = document.createElement("div"); row.className = "quote-memory";
  row.innerHTML = `« ${item.text} »<small></small><button class="text-btn" data-delete-recent="${item.id}">×</button>`;
  row.querySelector("small").textContent = formatMemoryDate(item.date);
  container.appendChild(row);
 });
}
function renderMoments(){
 const container = document.getElementById("momentsTimeline"); if(!container) return;
 const list = loadMemories("moments");
 container.innerHTML = "";
 list.forEach(item=>{
  const row = document.createElement("div"); row.className = "timeline-item";
  row.innerHTML = `<span class="timeline-dot"></span><div><strong></strong></div><time></time>`;
  row.querySelector("strong").textContent = item.text;
  row.querySelector("time").textContent = formatMemoryDate(item.date);
  container.appendChild(row);
 });
 const upcoming = document.createElement("div"); upcoming.className = "timeline-item muted";
 upcoming.innerHTML = `<span class="timeline-dot"></span><div><strong>Votre prochaine étape</strong><p>Elle apparaîtra naturellement au fil de vos échanges.</p></div><time>À venir</time>`;
 container.appendChild(upcoming);
}
function renderAllMemories(){ renderAboutMemories(); renderRecentMemories(); renderMoments(); }

// Jalon automatique : première conversation jamais ouverte dans l'app
if(!localStorage.getItem("elea-first-conversation-logged")){
 addMomentMemory("Première conversation avec Éléa.");
 localStorage.setItem("elea-first-conversation-logged","1");
}

// Édition / suppression des souvenirs (délégation d'événements)
document.getElementById("aboutMemoryList")?.addEventListener("click", e=>{
 const btn = e.target.closest("[data-edit-about]"); if(!btn) return;
 const id = Number(btn.dataset.editAbout);
 const list = loadMemories("about"); const item = list.find(m=>m.id===id); if(!item) return;
 const next = prompt("Modifier ce souvenir (laisse vide pour le supprimer) :", item.text);
 if(next===null) return;
 const trimmed = next.trim();
 const updated = trimmed ? list.map(m=>m.id===id?{...m,text:trimmed}:m) : list.filter(m=>m.id!==id);
 saveMemories("about", updated); renderAboutMemories();
});
document.getElementById("recentMemoryList")?.addEventListener("click", e=>{
 const btn = e.target.closest("[data-delete-recent]"); if(!btn) return;
 const id = Number(btn.dataset.deleteRecent);
 saveMemories("recent", loadMemories("recent").filter(m=>m.id!==id)); renderRecentMemories();
});
document.getElementById("clearAllMemoriesBtn")?.addEventListener("click", ()=>{
 if(!confirm("Effacer tous les souvenirs d’Éléa ? Cette action ne peut pas être annulée.")) return;
 Object.values(MEMORY_KEYS).forEach(key=>localStorage.removeItem(key));
 renderAllMemories();
});

// ---------- Personnalité (persistée sur l'appareil) ----------
const PERSONALITY_KEY = "elea-personality";
const DEFAULT_PERSONALITY = {
 douceur:78, serieux:52, spontaneite:68,
 affection:"Fort", humour:"Moyen", bavarde:"Moyen", empathie:"Fort",
 prompt:"J'aimerais qu'elle soit douce avec moi, mais qu'elle puisse aussi me dire franchement les choses."
};
function applyPersonalityToUI(settings){
 const ranges=document.querySelectorAll(".personality-range");
 if(ranges[0]) ranges[0].value=settings.douceur;
 if(ranges[1]) ranges[1].value=settings.serieux;
 if(ranges[2]) ranges[2].value=settings.spontaneite;
 const traits=document.querySelectorAll(".trait");
 const traitValues=[settings.affection,settings.humour,settings.bavarde,settings.empathie];
 traits.forEach((traitEl,i)=>{
  traitEl.querySelectorAll(".pill").forEach(pill=>{
   pill.classList.toggle("selected", pill.textContent.trim()===traitValues[i]);
  });
 });
 const promptEl=document.getElementById("personalityPrompt");
 if(promptEl) promptEl.value=settings.prompt||"";
}
function loadPersonality(){
 try{ const saved=JSON.parse(localStorage.getItem(PERSONALITY_KEY)||"null"); return saved; }
 catch(e){ return null; }
}
const savedPersonality = loadPersonality();
applyPersonalityToUI(savedPersonality || DEFAULT_PERSONALITY);


function addMessage(text,who="user"){
 const msg=document.createElement("div"); msg.className=`message ${who}`;
 msg.innerHTML=who==="elea"?`<div class="mini-avatar">E</div><div class="bubble"></div>`:`<div class="bubble"></div>`;
 msg.querySelector(".bubble").textContent=text; messages.appendChild(msg); scrollBottom();
}

function getPersonalitySettings(){
 const ranges=document.querySelectorAll(".personality-range");
 const traits=document.querySelectorAll(".trait");
 const selected=(traitEl)=>traitEl?.querySelector(".pill.selected")?.textContent.trim()||"Moyen";
 return {
  douceur:Number(ranges[0]?.value ?? 78),
  serieux:Number(ranges[1]?.value ?? 52),
  spontaneite:Number(ranges[2]?.value ?? 68),
  affection:selected(traits[0]),
  humour:selected(traits[1]),
  bavarde:selected(traits[2]),
  empathie:selected(traits[3]),
  prompt:document.getElementById("personalityPrompt")?.value.trim()||""
 };
}

async function eleaReply(userText){
 typing.classList.add("show"); statusText.textContent="Eléa réfléchit..."; scrollBottom();
 try{
  const response=await fetch(`${API_BASE_URL}/api/chat`,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({message:userText,history:conversationHistory,personality:getPersonalitySettings()})
  });
  const data=await response.json();
  typing.classList.remove("show"); statusText.textContent="Je suis là avec toi";
  if(!response.ok||!data.reply){
   console.error(data);
   addMessage("Désolée, j'ai un petit souci de connexion. Réessaie dans un instant. 🤍","elea");
   return;
  }
  addMessage(data.reply,"elea");
  conversationHistory.push({role:"user",text:userText});
  conversationHistory.push({role:"elea",text:data.reply});
  saveHistory();
  if(data.memory && data.memory.text){
   if(data.memory.category==="moment") addMomentMemory(data.memory.text);
   else addAboutMemory(data.memory.icon, data.memory.text);
  }
 }catch(err){
  console.error(err);
  typing.classList.remove("show"); statusText.textContent="Je suis là avec toi";
  addMessage("Je n'arrive pas à me connecter en ce moment. Vérifie ta connexion internet. 🤍","elea");
 }
}
form.addEventListener("submit",e=>{e.preventDefault();const text=input.value.trim();if(!text)return;addMessage(text);input.value="";quickReplies.style.display="none";eleaReply(text)});
quickReplies.addEventListener("click",e=>{if(e.target.tagName!=="BUTTON")return;const text=e.target.textContent;addMessage(text);quickReplies.style.display="none";eleaReply(text)});

const sections=["chat","memory","gallery","voice","personality","settings"];
function showSection(section){
 sections.forEach(s=>{const el=document.getElementById(`${s}View`);if(el)el.classList.toggle("hidden",s!==section)});
 document.querySelectorAll(".nav-item[data-section]").forEach(x=>x.classList.toggle("active",x.dataset.section===section));
 sidebar.classList.remove("open");
 const titles={chat:"Je suis là avec toi",memory:"Vos souvenirs",gallery:"Vos moments",voice:"La voix d'Éléa",personality:"Sa personnalité",settings:"Tes paramètres"};
 statusText.textContent=titles[section]||"Je suis là avec toi";
}
document.querySelectorAll(".nav-item[data-section]").forEach(btn=>btn.addEventListener("click",()=>showSection(btn.dataset.section)));
document.querySelectorAll(".settings-row[data-section]").forEach(btn=>btn.addEventListener("click",()=>showSection(btn.dataset.section)));

document.getElementById("themeBtn").addEventListener("click",toggleTheme);
document.getElementById("settingsTheme").addEventListener("click",toggleTheme);
function toggleTheme(){
 document.body.classList.toggle("dark");
 document.getElementById("appearanceText").textContent=document.body.classList.contains("dark")?"Sombre":"Clair";
 localStorage.setItem("elea-theme",document.body.classList.contains("dark")?"dark":"light");
}
if(localStorage.getItem("elea-theme")==="dark"){document.body.classList.add("dark");document.getElementById("appearanceText").textContent="Sombre"}

document.getElementById("menuBtn").addEventListener("click",()=>sidebar.classList.toggle("open"));
document.getElementById("voiceBtn").addEventListener("click",()=>{statusText.textContent="Eléa écoute...";setTimeout(()=>statusText.textContent="Je suis là avec toi",1800)});
document.getElementById("callBtn").addEventListener("click",()=>showSection("voice"));

const memoryModal=document.getElementById("memoryModal");
function openMemory(){memoryModal.classList.remove("hidden");memoryModal.setAttribute("aria-hidden","false");document.getElementById("newMemory").focus()}
function closeMemory(){memoryModal.classList.add("hidden");memoryModal.setAttribute("aria-hidden","true")}
document.getElementById("addMemoryBtn").addEventListener("click",openMemory);
document.getElementById("closeMemory").addEventListener("click",closeMemory);
document.getElementById("cancelMemory").addEventListener("click",closeMemory);
memoryModal.querySelector(".modal-backdrop").addEventListener("click",closeMemory);
document.getElementById("saveMemory").addEventListener("click",()=>{
 const text=document.getElementById("newMemory").value.trim(); if(!text)return;
 addRecentMemory(text);
 document.getElementById("newMemory").value=""; closeMemory();
});

document.querySelectorAll(".toggle").forEach(toggle=>toggle.addEventListener("click",e=>{
 e.stopPropagation(); toggle.classList.toggle("on");
}));

document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
}));

document.querySelectorAll(".voice-choice").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".voice-choice").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 document.querySelector(".voice-options .card-top p").textContent=`Éléa — ${btn.querySelector("b").textContent}`;
}));
const speedRange=document.getElementById("speedRange");
speedRange.addEventListener("input",()=>document.getElementById("speedValue").textContent=`${speedRange.value}×`);
const previewVoice=document.getElementById("previewVoice"),voiceOrb=document.getElementById("voiceOrb"),voiceStatus=document.getElementById("voiceStatus");
previewVoice.addEventListener("click",()=>{
 voiceOrb.classList.add("speaking");voiceStatus.textContent="Éléa te parle...";
 previewVoice.textContent="◼ Arrêter l'extrait";
 setTimeout(()=>{voiceOrb.classList.remove("speaking");voiceStatus.textContent="Prête à te parler";previewVoice.innerHTML="▶ Écouter un extrait"},3500);
});
document.getElementById("autoVoice").addEventListener("click",function(){this.classList.toggle("on")});

document.querySelectorAll(".pill").forEach(btn=>btn.addEventListener("click",()=>{
 const group=btn.parentElement;group.querySelectorAll(".pill").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");
}));
document.getElementById("savePersonality").addEventListener("click",function(){
 localStorage.setItem(PERSONALITY_KEY, JSON.stringify(getPersonalitySettings()));
 const old=this.textContent;this.textContent="✓ Enregistré";setTimeout(()=>this.textContent=old,1400);
});
document.getElementById("clearPrompt").addEventListener("click",function(){
 if(!confirm("Réinitialiser la personnalité d’Éléa à ses réglages par défaut ?")) return;
 localStorage.removeItem(PERSONALITY_KEY);
 applyPersonalityToUI(DEFAULT_PERSONALITY);
 const old=this.textContent;this.textContent="✓ Réinitialisé";setTimeout(()=>this.textContent=old,1400);
});

function renderHistory(){
 if(conversationHistory.length===0)return;
 quickReplies.style.display="none";
 conversationHistory.forEach(turn=>addMessage(turn.text,turn.role==="elea"?"elea":"user"));
}
renderHistory();
renderAllMemories();

input.focus();
