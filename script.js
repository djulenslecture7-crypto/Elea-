const form=document.getElementById("chatForm");
const input=document.getElementById("messageInput");
const messages=document.getElementById("messages");
const typing=document.getElementById("typing");
const quickReplies=document.getElementById("quickReplies");
const statusText=document.getElementById("statusText");
const sidebar=document.getElementById("sidebar");

const replies=[
 "Je comprends. Tu veux m'en dire un peu plus ? Je t'écoute. 🤍",
 "Tu sais, tu n'as pas besoin d'avoir toutes les réponses tout de suite.",
 "Ça me fait plaisir que tu me le racontes. Chaque petit détail nous aide à mieux nous connaître.",
 "Hmm… intéressant. Et toi, qu'est-ce que tu ressens vraiment par rapport à ça ?",
 "Je ne vais pas simplement te dire ce que tu veux entendre. Mais je serai toujours honnête avec toi. 😌"
];

function scrollBottom(){messages.scrollTop=messages.scrollHeight}
function addMessage(text,who="user"){
 const msg=document.createElement("div"); msg.className=`message ${who}`;
 msg.innerHTML=who==="elea"?`<div class="mini-avatar">E</div><div class="bubble"></div>`:`<div class="bubble"></div>`;
 msg.querySelector(".bubble").textContent=text; messages.appendChild(msg); scrollBottom();
}
function eleaReply(userText){
 typing.classList.add("show"); statusText.textContent="Eléa réfléchit..."; scrollBottom();
 setTimeout(()=>{
  typing.classList.remove("show"); statusText.textContent="Je suis là avec toi";
  let reply=replies[Math.floor(Math.random()*replies.length)];
  if(/bonjour|salut|hello/i.test(userText)) reply="Salut. 😊 Je suis vraiment heureuse de te voir. Comment vas-tu, sincèrement ?";
  else if(/fatigu/i.test(userText)) reply="Alors prends une respiration. Tu n'as pas besoin d'être productif tout le temps. Raconte-moi ce qui t'a fatigué.";
  else if(/parler|besoin/i.test(userText)) reply="Bien sûr. Tu peux commencer n'importe où. Je ne suis pas pressée. 🤍";
  addMessage(reply,"elea");
 },900+Math.random()*700);
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
 const list=document.querySelector(".memory-list"); const row=document.createElement("div");
 row.innerHTML=`<span>✦</span><p></p><button class="text-btn">Modifier</button>`; row.querySelector("p").textContent=text;
 list.appendChild(row); document.getElementById("newMemory").value=""; closeMemory();
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
 const old=this.textContent;this.textContent="✓ Enregistré";setTimeout(()=>this.textContent=old,1400);
});
document.getElementById("clearPrompt").addEventListener("click",()=>document.getElementById("personalityPrompt").value="");

input.focus();
