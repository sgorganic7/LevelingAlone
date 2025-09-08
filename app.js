(function () {
  // ===== Firebase =====
  const firebaseConfig = {
    apiKey: "AIzaSyAFdZnQXPfAkIu74HJ7EXU5A2XKwOYjN44",
    authDomain: "ejercicio-f91ac.firebaseapp.com",
    projectId: "ejercicio-f91ac",
    storageBucket: "ejercicio-f91ac.firebasestorage.app",
    messagingSenderId: "694493495253",
    appId: "1:694493495253:web:a192a5147fa3c46b5a875c",
    measurementId: "G-1J2PLMYNPR"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  // ===== Keys / estado local =====
  const INTRO_KEY = "sg_intro_done_v1";
  const QUESTS_KEY  = "sg_daily_quests_v1";
  const LAST_RESET_KEY = "sg_last_reset_date";

  // ===== Refs =====
  const authOv = document.getElementById("auth-overlay");
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  const loginEmail = document.getElementById("loginEmail");
  const loginPass  = document.getElementById("loginPass");
  const regEmail   = document.getElementById("regEmail");
  const regPass    = document.getElementById("regPass");
  const authMsg    = document.getElementById("authMsg");
  const regMsg     = document.getElementById("regMsg");
  const btnReset   = document.getElementById("btnReset");

  const topbar   = document.getElementById("topbar");
  const appMain  = document.getElementById("app");

  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const closeSide = document.getElementById("closeSide");
  const sideOverlay = document.getElementById("sideOverlay");
  const navLinks = document.querySelectorAll(".side-link");
  const homeView = document.getElementById("homeView");
  const friendsView = document.getElementById("friendsView");
  const btnSignOut = document.getElementById("btnSignOut");
  const bottomNav = document.querySelector(".bottom-nav");

  // Training / quests / timer
  const pendingCountEl = document.getElementById("pendingCount");
  const ring = document.getElementById("ring");
  const progressText = document.getElementById("progressText");
  const listEl = document.getElementById("questsList");
  const countdownEl = document.getElementById("dailyCountdown");

  // Intro modal
  const overlay = document.getElementById("alarm-overlay");
  const alarmBtn = document.getElementById("alarm-accept");
  const textEl = document.getElementById("alarm-text");
  const titleEl = document.getElementById("alarm-title");

  // Amigos
  const addFriendForm = document.getElementById("addFriendForm");
  const friendEmailInput = document.getElementById("friendEmail");
  const friendMsg = document.getElementById("friendMsg");
  const friendsList = document.getElementById("friendsList");

  // ===== Utils =====
  const local = {
    getQuests(){ try{ return JSON.parse(localStorage.getItem(QUESTS_KEY)||"{}"); }catch{ return {}; } },
    setQuests(q){ localStorage.setItem(QUESTS_KEY, JSON.stringify(q)); },
    getLastReset(){ return localStorage.getItem(LAST_RESET_KEY)||""; },
    setLastReset(d){ localStorage.setItem(LAST_RESET_KEY, d); },
    getIntro(){ return localStorage.getItem(INTRO_KEY)==="1"; },
    setIntro(){ localStorage.setItem(INTRO_KEY,"1"); }
  };

  function setAuthVisible(v){
    authOv.classList.toggle("hidden", !v);
    authOv.setAttribute("aria-hidden", v ? "false" : "true");
    // Cuando el auth está visible, oculto toda la UI detrás
    document.body.classList.toggle("no-ui", v);
  }
  function appVisible(v){
    document.body.classList.toggle("no-ui", !v);
    topbar.classList.toggle("hidden", !v);
    appMain.classList.toggle("hidden", !v);
  }

  // Iniciamos en modo login visible
  setAuthVisible(true);
  appVisible(false);

  // ===== Tabs auth (sin bug) =====
  function showRegister(){
    tabRegister.classList.add("active"); tabRegister.setAttribute("aria-selected","true");
    tabLogin.classList.remove("active"); tabLogin.setAttribute("aria-selected","false");
    formRegister.classList.remove("hidden"); formLogin.classList.add("hidden");
    regMsg.textContent=""; authMsg.textContent="";
  }
  function showLogin(){
    tabLogin.classList.add("active"); tabLogin.setAttribute("aria-selected","true");
    tabRegister.classList.remove("active"); tabRegister.setAttribute("aria-selected","false");
    formLogin.classList.remove("hidden"); formRegister.classList.add("hidden");
    regMsg.textContent=""; authMsg.textContent="";
  }
  tabRegister.addEventListener("click", showRegister);
  tabLogin.addEventListener("click", showLogin);

  formRegister.addEventListener("submit", async (e)=>{
    e.preventDefault();
    regMsg.textContent="Creando cuenta…";
    try{
      const cred = await auth.createUserWithEmailAndPassword(regEmail.value, regPass.value);
      await db.collection("users").doc(cred.user.uid).set({ email: regEmail.value, profile:{}, quests:{}, createdAt: Date.now() }, { merge:true });
      regMsg.textContent="Cuenta creada. Entrando…";
    }catch(err){ regMsg.textContent="Error: " + (err.message || err.code); }
  });

  formLogin.addEventListener("submit", async (e)=>{
    e.preventDefault();
    authMsg.textContent="Entrando…";
    try{
      await auth.signInWithEmailAndPassword(loginEmail.value, loginPass.value);
      authMsg.textContent="";
      // NO ocultamos aquí; esperamos a onAuthStateChanged que es la fuente de verdad
    }catch(err){
      if(err && (err.code==="auth/user-not-found"||/user-not-found/i.test(err.message))){
        authMsg.textContent="No existe esa cuenta. Crea tu cuenta primero.";
        showRegister(); regEmail.value=loginEmail.value; regPass.focus();
      }else{
        authMsg.textContent="Error: " + (err.message || err.code);
      }
    }
  });

  btnReset.addEventListener("click", async ()=>{
    const email = loginEmail.value.trim();
    if(!email){ authMsg.textContent="Escribe tu correo arriba."; return; }
    try{ await auth.sendPasswordResetEmail(email); authMsg.textContent="Te enviamos el correo de restablecimiento."; }
    catch(err){ authMsg.textContent="Error: " + (err.message || err.code); }
  });

  // ===== Drawer & vistas =====
  function openDrawer(){ sideMenu.classList.add("open"); sideOverlay.hidden=false; }
  function closeDrawer(){ sideMenu.classList.remove("open"); sideOverlay.hidden=true; }
  menuBtn.addEventListener("click", openDrawer);
  closeSide.addEventListener("click", closeDrawer);
  sideOverlay.addEventListener("click", closeDrawer);

  function setView(v){
    navLinks.forEach(n=>n.classList.toggle("active", n.dataset.view===v));
    if(bottomNav){
      bottomNav.querySelectorAll(".btnc").forEach(b=>b.classList.toggle("active", b.dataset.view===v));
    }
    if(v==="friends"){ homeView.classList.add("hidden"); friendsView.classList.remove("hidden"); }
    else { friendsView.classList.add("hidden"); homeView.classList.remove("hidden"); }
  }
  navLinks.forEach(n=>n.addEventListener("click", ()=>{ setView(n.dataset.view); closeDrawer(); }));
  if(bottomNav){
    bottomNav.addEventListener("click",(e)=>{
      const b=e.target.closest(".btnc"); if(!b) return;
      setView(b.dataset.view||"home");
    });
  }
  btnSignOut.addEventListener("click", ()=> auth.signOut());

  // ===== Auth state =====
  let unsubFriends=null;
  auth.onAuthStateChanged(async (user)=>{
    if(!user){
      // Mostrar login, ocultar app e intro
      setAuthVisible(true);
      appVisible(false);
      overlay.classList.add("hidden");
      document.body.classList.remove("intro-open");
      if(unsubFriends){ unsubFriends(); unsubFriends=null; }
      return;
    }

    // Usuario autenticado: oculto login
    setAuthVisible(false);

    if(!local.getIntro()){
      // Intro única: sin UI detrás
      document.body.classList.add("intro-open");
      openIntro();
    }else{
      // UI normal
      document.body.classList.remove("intro-open");
      appVisible(true);
      ensureDailyReset(user.uid);
      await loadFromCloud(user.uid);
      startDailyCountdown(user.uid);
      subscribeFriends(user.uid);
    }
  });

  // ===== Intro única =====
  let step=1;
  const STEP1 = `[Has completado todos los requerimientos necesarios<br/>para la quest secreta ‘Coraje del Débil’.]`;
  const STEP2 = `[Bienvenido, <span class="emph-green">Jugador</span>.]`;
  const STEP3 = `
    <div>[Entrenamiento para volverte un gran guerrero.]</div>
    <div style="margin-top:8px;font-weight:800;letter-spacing:.1em">OBJETIVOS</div>
    <div class="muted" style="margin-top:6px">Completa los ejercicios listados.</div>`;

  function openIntro(){
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden","false");
    titleEl.textContent="ALARMA";
    textEl.innerHTML=STEP1; step=1;
  }
  function closeIntro(){
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden","true");
    document.body.classList.remove("intro-open");
  }
  alarmBtn.addEventListener("click", async ()=>{
    if(step===1){ textEl.innerHTML=STEP2; step=2; return; }
    if(step===2){ titleEl.textContent="DIRECCIONES DE LA QUEST"; textEl.innerHTML=STEP3; step=3; return; }
    // cerrar definitivamente intro
    local.setIntro();
    closeIntro();
    // mostrar app y continuar flujo
    appVisible(true);
    const uid = auth.currentUser?.uid;
    if(uid){
      ensureDailyReset(uid);
      await loadFromCloud(uid);
      startDailyCountdown(uid);
      subscribeFriends(uid);
    }
  });

  // ===== Quests =====
  const QUEST_IDS = ["flexiones","sentadillas","abdominales1","correr"];
  function paintQuests(saved){
    document.querySelectorAll(".q-item").forEach(item=>{
      const id=item.dataset.id, max=Number(item.dataset.max||0), unit=item.dataset.unit||"";
      const done=!!saved[id];
      item.classList.toggle("done", done);
      item.querySelector(".q-progress").textContent =
        done ? (unit==="km"?`[${max}/${max}${unit}]`:`[${max}/${max}]`)
             : (unit==="km"?`[0/${max}${unit}]`:`[0/${max}]`);
      item.querySelector(".q-toggle").checked = done;
    });
    updateHeader(saved);
  }
  function updateHeader(saved){
    const total=QUEST_IDS.length, done=QUEST_IDS.reduce((a,k)=>a+(saved[k]?1:0),0);
    pendingCountEl.textContent=String(total-done);
    const pct=Math.round((done/total)*100);
    progressText.textContent=`${pct}%`;
    ring.style.strokeDasharray="100 100";
    ring.style.strokeDashoffset=String(100-pct);
  }
  function getSaved(){ try{return JSON.parse(localStorage.getItem(QUESTS_KEY)||"{}");}catch{return{};} }
  function saveLocal(q){ localStorage.setItem(QUESTS_KEY, JSON.stringify(q)); }

  listEl.addEventListener("change", async (e)=>{
    const ck=e.target.closest(".q-toggle"); if(!ck) return;
    const id=ck.closest(".q-item").dataset.id;
    const saved=getSaved();
    if(ck.checked) saved[id]=true; else delete saved[id];
    saveLocal(saved); paintQuests(saved);
    const uid=auth.currentUser?.uid;
    if(uid) await db.collection("users").doc(uid).set({quests:saved,updatedAt:Date.now()},{merge:true});
  });

  function paintFromLocal(){ paintQuests(getSaved()); }

  // ===== Reset diario + reloj =====
  function todayKey(){ const d=new Date(); const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), da=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; }
  async function resetDaily(uid){
    saveLocal({}); localStorage.setItem(LAST_RESET_KEY,todayKey()); paintQuests({});
    if(uid) await db.collection("users").doc(uid).set({quests:{},lastReset:todayKey(),updatedAt:Date.now()},{merge:true});
  }
  function ensureDailyReset(uid){ if((localStorage.getItem(LAST_RESET_KEY)||"")!==todayKey()) resetDaily(uid); }
  let timerId=null;
  function nextMidnight(){ const n=new Date(); const x=new Date(n); x.setHours(24,0,0,0); return x; }
  function fmt(ms){ if(ms<0) ms=0; const s=Math.floor(ms/1000), h=String(Math.floor(s/3600)).padStart(2,"0"), m=String(Math.floor((s%3600)/60)).padStart(2,"0"), ss=String(s%60).padStart(2,"0"); return `${h}:${m}:${ss}`; }
  function startDailyCountdown(uid){
    if(timerId) clearInterval(timerId);
    const tick=()=>{ const ms=nextMidnight()-new Date(); if(ms<=0) resetDaily(uid); countdownEl.textContent=fmt(ms); };
    tick(); timerId=setInterval(tick,1000);
  }

  // ===== Carga de nube =====
  async function loadFromCloud(uid){
    const doc=await db.collection("users").doc(uid).get();
    const localQ=getSaved();
    if(doc.exists){ const data=doc.data()||{}; const q={...localQ,...data.quests}; saveLocal(q); paintQuests(q); }
    else{ await db.collection("users").doc(uid).set({quests:localQ,createdAt:Date.now()},{merge:true}); paintQuests(localQ); }
  }

  // ===== Amigos =====
  function friendsCol(uid){ return db.collection("users").doc(uid).collection("friends"); }
  function renderFriendCard(uid,data){
    const p=data.profile||{}, q=data.quests||{};
    const total=["flexiones","sentadillas","abdominales1","correr"].reduce((a,k)=>a+(q[k]?1:0),0);
    const ava=p.avatar||"data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%230b0b0b'/></svg>");
    return `<div class="friend" data-uid="${uid}">
      <img class="ava" src="${ava}" alt="Avatar"/>
      <div class="meta"><div class="name">${p.name||"Jugador"}</div><div class="small">Edad: ${p.age||"—"} | Peso: ${p.weight? p.weight+" kg":"—"}</div></div>
      <div class="score">${total}/4</div><button class="btn small remove">Eliminar</button></div>`;
  }
  function subscribeFriends(uid){
    if(unsubFriends) unsubFriends();
    unsubFriends=friendsCol(uid).onSnapshot(async snap=>{
      const cards=await Promise.all(snap.docs.map(async d=>{ const fid=d.id; const ds=await db.collection("users").doc(fid).get(); return ds.exists?renderFriendCard(fid,ds.data()):""; }));
      friendsList.innerHTML=cards.length?cards.join(""):`<div class="muted">Aún no has agregado amigos.</div>`;
    });
  }
  addFriendForm.addEventListener("submit", async e=>{
    e.preventDefault();
    friendMsg.textContent="Buscando…";
    const me=auth.currentUser; if(!me){ friendMsg.textContent="Inicia sesión"; return; }
    const email=friendEmailInput.value.trim().toLowerCase(); if(!email){ friendMsg.textContent="Correo inválido."; return; }
    if(me.email && me.email.toLowerCase()===email){ friendMsg.textContent="No puedes agregarte."; return; }
    try{
      const q=await db.collection("users").where("email","==",email).limit(1).get();
      if(q.empty){ friendMsg.textContent="No se encontró ese correo."; return; }
      const target=q.docs[0];
      await friendsCol(me.uid).doc(target.id).set({friendUid:target.id,addedAt:Date.now()},{merge:true});
      friendMsg.textContent="Amigo agregado ✓"; friendEmailInput.value="";
    }catch(err){ friendMsg.textContent="Error: "+(err.message||err.code); }
  });
  friendsList.addEventListener("click", async e=>{
    const btn=e.target.closest(".remove"); if(!btn) return;
    const me=auth.currentUser; if(!me) return;
    const uid=btn.closest(".friend")?.dataset?.uid; if(!uid) return;
    try{ await friendsCol(me.uid).doc(uid).delete(); }catch(err){ alert("No se pudo eliminar: "+(err.message||err.code)); }
  });

  // ===== Pintar local por si acaso =====
  function paintFromLocal(){ paintQuests(getSaved()); }
  paintFromLocal();

  // ===== Intro helpers (reusan variables) =====
  function openIntro(){
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden","false");
  }

})();
