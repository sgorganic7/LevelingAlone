(function () {
  // ===== Firebase =====
  const firebaseConfig = {
    apiKey: "AIzaSyAFdZnQXPfAkIu74HJ7EXU5A2XKwOYjN44",
    authDomain: "ejercicio-f91ac.firebaseapp.com",
    projectId: "ejercicio-f91ac",
    storageBucket: "ejercicio-f91ac.appspot.com",
    messagingSenderId: "694493495253",
    appId: "1:694493495253:web:a192a5147fa3c46b5a875c",
    measurementId: "G-1J2PLMYNPR"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  // ===== LocalStorage keys =====
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
  const regUser    = document.getElementById("regUser");
  const authMsg    = document.getElementById("authMsg");
  const regMsg     = document.getElementById("regMsg");
  const btnReset   = document.getElementById("btnReset");

  const topbar   = document.getElementById("topbar");
  const appMain  = document.getElementById("app");

  const menuBtn = document.getElementById("menuBtn");
  const editTopBtn = document.getElementById("editTopBtn");
  const hiddenFile = document.getElementById("hiddenFile");

  const sideMenu = document.getElementById("sideMenu");
  const closeSide = document.getElementById("closeSide");
  const sideOverlay = document.getElementById("sideOverlay");
  const navLinks = document.querySelectorAll(".side-link");
  const homeView = document.getElementById("homeView");
  const friendsView = document.getElementById("friendsView");
  const profileView = document.getElementById("profileView");
  const publicProfileView = document.getElementById("publicProfileView");
  const btnSignOut = document.getElementById("btnSignOut");

  // Quests / timer
  const pendingCountEl = document.getElementById("pendingCount");
  const ring = document.getElementById("ring");
  const progressText = document.getElementById("progressText");
  const listEl = document.getElementById("questsList");
  const countdownEl = document.getElementById("dailyCountdown");

  // Intro
  const overlay = document.getElementById("alarm-overlay");
  const alarmBtn = document.getElementById("alarm-accept");
  const textEl = document.getElementById("alarm-text");
  const titleEl = document.getElementById("alarm-title");

  // Amigos (por username)
  const addFriendForm = document.getElementById("addFriendForm");
  const friendUsernameInput = document.getElementById("friendUsername");
  const friendMsg = document.getElementById("friendMsg");
  const friendsList = document.getElementById("friendsList");

  // Perfil propio
  const pcAvatar = document.getElementById("pcAvatar");
  const pcName = document.getElementById("pcName");
  const pcLevel = document.getElementById("pcLevel");
  const pcXp = document.getElementById("pcXp");
  const pcXpMax = document.getElementById("pcXpMax");
  const pcRank = document.getElementById("pcRank");
  const stFuerza = document.getElementById("stFuerza");
  const stRes = document.getElementById("stRes");
  const stAgi = document.getElementById("stAgi");
  const stF = document.getElementById("stF");
  const stR = document.getElementById("stR");
  const stA = document.getElementById("stA");

  // Perfil público
  const friendProfileCard = document.getElementById("friendProfileCard");
  const ppBack = document.getElementById("ppBack");

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
    document.body.classList.toggle("no-ui", v);
  }
  function appVisible(v){
    document.body.classList.toggle("no-ui", !v);
    topbar.classList.toggle("hidden", !v);
    appMain.classList.toggle("hidden", !v);
  }
  setAuthVisible(true); appVisible(false);

  // ===== Tabs Auth =====
  function showRegister(){ 
    tabRegister.classList.add("active"); tabLogin.classList.remove("active"); 
    formRegister.classList.remove("hidden"); formLogin.classList.add("hidden"); 
    regMsg.textContent=""; authMsg.textContent=""; 
  }
  function showLogin(){ 
    tabLogin.classList.add("active"); tabRegister.classList.remove("active"); 
    formLogin.classList.remove("hidden"); formRegister.classList.add("hidden"); 
    regMsg.textContent=""; authMsg.textContent=""; 
  }
  tabRegister.addEventListener("click", showRegister);
  tabLogin.addEventListener("click", showLogin);

  // ===== Username helpers =====
  function cleanUsername(u){ return (u||"").trim().replace(/\s+/g,"_"); }
  function isValidUsername(u){ return /^[a-zA-Z0-9_]{3,20}$/.test(u); }

  // ===== MODAL USERNAME =====
  function openUsernameModal(prefill = "") {
    return new Promise((resolve) => {
      const modal = document.getElementById("usernameModal");
      const form  = document.getElementById("unameForm");
      const input = document.getElementById("unameInput");
      const msg   = document.getElementById("unameMsg");
      const save  = document.getElementById("unameSave");

      input.value = prefill ? cleanUsername(prefill) : "";
      msg.textContent = "";
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden","false");
      document.body.classList.add("uname-open");
      setTimeout(()=>input.focus(), 50);

      async function onSubmit(e){
        e.preventDefault();
        let uname = cleanUsername(input.value);
        if(!isValidUsername(uname)){
          msg.textContent = "Usa 3–20 caracteres: letras, números o _.";
          return;
        }
        msg.textContent = "Verificando disponibilidad…";
        save.disabled = true;

        try{
          const exists = await db.collection("users")
            .where("usernameLower","==", uname.toLowerCase())
            .limit(1).get();
          if(!exists.empty){
            msg.textContent = "Ese nombre ya está en uso. Intenta otro.";
            save.disabled = false;
            return;
          }
          close();
          resolve(uname);
        }catch(err){
          msg.textContent = "Error: " + (err.message || err.code || err);
          save.disabled = false;
        }
      }

      function onEsc(ev){ if(ev.key === "Escape"){ /* bloqueado */ } }
      function close(){
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden","true");
        document.body.classList.remove("uname-open");
        form.removeEventListener("submit", onSubmit);
        window.removeEventListener("keydown", onEsc);
      }

      form.addEventListener("submit", onSubmit);
      window.addEventListener("keydown", onEsc);
    });
  }

  async function ensureUsernameWithModal(uid, prefill = ""){
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    const data = snap.data() || {};
    if (data.username && data.usernameLower) return;

    const uname = await openUsernameModal(prefill);
    await ref.set({
      username: uname,
      usernameLower: uname.toLowerCase(),
      profile: {
        ...(data.profile || {}),
        name: (data.profile?.name) || uname
      }
    }, { merge:true });
    alert(`¡Listo! Tu nombre de usuario es @${uname}`);
  }

  // ===== Registro (primero auth, luego username) =====
  formRegister.addEventListener("submit", async (e)=>{
    e.preventDefault();
    regMsg.textContent="Creando cuenta…";
    try{
      // 1) Crear la cuenta (autentica al usuario)
      const cred = await auth.createUserWithEmailAndPassword(regEmail.value, regPass.value);

      // 2) Doc base mínimo (sin username aún)
      await db.collection("users").doc(cred.user.uid).set({
        email: regEmail.value,
        quests: {},
        createdAt: Date.now()
      }, { merge:true });

      // 3) Pedir/validar username con modal (prefill del input)
      await ensureUsernameWithModal(cred.user.uid, regUser.value);

      regMsg.textContent = "Cuenta creada. Entrando…";
      // onAuthStateChanged continuará
    }catch(err){
      regMsg.textContent="Error: " + (err?.message || err?.code || err);
    }
  });

  // ===== Login =====
  formLogin.addEventListener("submit", async (e)=>{
    e.preventDefault();
    authMsg.textContent="Entrando…";
    try{ 
      await auth.signInWithEmailAndPassword(loginEmail.value, loginPass.value); 
      authMsg.textContent=""; 
    }
    catch(err){
      if(err && (err.code==="auth/user-not-found"||/user-not-found/i.test(err.message))){
        authMsg.textContent="No existe esa cuenta. Crea tu cuenta primero."; 
        showRegister(); regEmail.value=loginEmail.value;
      } else { 
        authMsg.textContent="Error: " + (err.message || err.code); 
      }
    }
  });
  btnReset.addEventListener("click", async ()=>{
    const email = loginEmail.value.trim(); if(!email){ authMsg.textContent="Escribe tu correo arriba."; return; }
    try{ await auth.sendPasswordResetEmail(email); authMsg.textContent="Te enviamos el correo."; }
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
    homeView.classList.toggle("hidden", v!=="home");
    friendsView.classList.toggle("hidden", v!=="friends");
    profileView.classList.toggle("hidden", v!=="profile");
    publicProfileView.classList.add("hidden");
  }
  navLinks.forEach(n=>n.addEventListener("click", ()=>{ setView(n.dataset.view); closeDrawer(); }));
  btnSignOut.addEventListener("click", ()=> auth.signOut());

  // ===== Intro (1 sola vez) =====
  let step=1;
  const STEP1 = `[Has completado todos los requerimientos necesarios<br/>para la quest secreta ‘Coraje del Débil’.]`;
  const STEP2 = `[Bienvenido, <span class="emph-green">Jugador</span>.]`;
  const STEP3 = `<div>[Entrenamiento para volverte un gran guerrero.]</div>
                 <div style="margin-top:8px;font-weight:800;letter-spacing:.1em">OBJETIVOS</div>
                 <div class="muted" style="margin-top:6px">Completa los ejercicios listados.</div>`;
  function openIntro(){ overlay.classList.remove("hidden"); titleEl.textContent="ALARMA"; textEl.innerHTML=STEP1; step=1; }
  function closeIntro(){ overlay.classList.add("hidden"); document.body.classList.remove("intro-open"); }
  alarmBtn.addEventListener("click", async ()=>{
    if(step===1){ textEl.innerHTML=STEP2; step=2; return; }
    if(step===2){ titleEl.textContent="DIRECCIONES DE LA QUEST"; textEl.innerHTML=STEP3; step=3; return; }
    local.setIntro(); closeIntro(); appVisible(true);
    const uid=auth.currentUser?.uid; if(uid){ ensureDailyReset(uid); await loadAll(uid); startDailyCountdown(uid); subscribeFriends(uid); }
  });

  // ===== Quests =====
  const QUEST_IDS = ["flexiones","sentadillas","abdominales1","correr"];
  function getSaved(){ try{return JSON.parse(localStorage.getItem(QUESTS_KEY)||"{}");}catch{return{};} }
  function saveLocal(q){ localStorage.setItem(QUESTS_KEY, JSON.stringify(q)); }
  function paintQuests(saved){
    document.querySelectorAll(".q-item").forEach(item=>{
      const id=item.dataset.id, max=Number(item.dataset.max||0), unit=item.dataset.unit||"";
      const done=!!saved[id];
      item.classList.toggle("done", done);
      item.querySelector(".q-progress").textContent = done
        ? (unit==="km"?`[${max}/${max}${unit}]`:`[${max}/${max}]`)
        : (unit==="km"?`[0/${max}${unit}]`:`[0/${max}]`);
      item.querySelector(".q-toggle").checked = done;
    });
    const total=QUEST_IDS.length, done=QUEST_IDS.reduce((a,k)=>a+(saved[k]?1:0),0);
    pendingCountEl.textContent=String(total-done);
    const pct=Math.round((done/total)*100);
    progressText.textContent=`${pct}%`; ring.style.strokeDasharray="100 100"; ring.style.strokeDashoffset=String(100-pct);
  }
  listEl.addEventListener("change", async (e)=>{
    const ck=e.target.closest(".q-toggle"); if(!ck) return;
    const id=ck.closest(".q-item").dataset.id;
    const saved=getSaved(); ck.checked ? saved[id]=true : delete saved[id];
    saveLocal(saved); paintQuests(saved);
    const uid=auth.currentUser?.uid; if(uid) await db.collection("users").doc(uid).set({quests:saved,updatedAt:Date.now()},{merge:true});
  });

  // Reset diario + reloj
  function todayKey(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  async function resetDaily(uid){
    saveLocal({}); localStorage.setItem(LAST_RESET_KEY,todayKey()); paintQuests({});
    if(uid) await db.collection("users").doc(uid).set({quests:{},lastReset:todayKey(),updatedAt:Date.now()},{merge:true});
  }
  function ensureDailyReset(uid){ if((localStorage.getItem(LAST_RESET_KEY)||"")!==todayKey()) resetDaily(uid); }
  let timerId=null;
  function nextMidnight(){ const n=new Date(); const x=new Date(n); x.setHours(24,0,0,0); return x; }
  function fmt(ms){ if(ms<0) ms=0; const s=Math.floor(ms/1000), h=String(Math.floor(s/3600)).padStart(2,"0"), m=String(Math.floor((s%3600)/60)).padStart(2,"0"), ss=String(s%60).padStart(2,"0"); return `${h}:${m}:${ss}`; }
  function startDailyCountdown(uid){ if(timerId) clearInterval(timerId); const tick=()=>{ const ms=nextMidnight()-new Date(); if(ms<=0) resetDaily(uid); countdownEl.textContent=fmt(ms); }; tick(); timerId=setInterval(tick,1000); }

  // ===== Perfil =====
  function statFill(elPath, value){ const pct=Math.max(0,Math.min(100, Number(value)||0)); elPath.style.strokeDasharray="100 100"; elPath.style.strokeDashoffset=String(100-pct); }

  async function loadAll(uid){
    const doc = await db.collection("users").doc(uid).get();
    const localQ = getSaved();
    if(doc.exists){
      const data = doc.data()||{};
      const q = { ...localQ, ...data.quests }; saveLocal(q); paintQuests(q);

      const p = data.profile || {};
      pcName.textContent = p.name || data.username || "GUERRERO123";
      pcAvatar.src = p.avatar || "data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360'><rect width='100%' height='100%' fill='%230a0a0a'/></svg>");
      pcLevel.textContent = p.level ?? 1;
      pcXp.textContent = p.xp ?? 0;
      pcXpMax.textContent = p.xpMax ?? 1000;
      pcRank.textContent = p.rank || "E";

      statFill(stF, p.stats?.fuerza ?? 0);  stFuerza.textContent = p.stats?.fuerza ?? 0;
      statFill(stR, p.stats?.resistencia ?? 0);  stRes.textContent = p.stats?.resistencia ?? 0;
      statFill(stA, p.stats?.agilidad ?? 0);  stAgi.textContent = p.stats?.agilidad ?? 0;
    }else{
      await db.collection("users").doc(uid).set({ quests: localQ, createdAt: Date.now() }, { merge:true });
      paintQuests(localQ);
    }
  }

  // ===== Editar (nombre + foto) SIN Storage =====
  editTopBtn.addEventListener("click", async ()=>{
    const user = auth.currentUser; if(!user){ alert("Inicia sesión."); return; }
    const currName = pcName.textContent || "GUERRERO123";
    const newName = prompt("Nuevo nombre visible (no cambia tu @username):", currName);
    if(newName !== null){
      try{
        const snap = await db.collection("users").doc(user.uid).get();
        const p = (snap.data()||{}).profile || {};
        await db.collection("users").doc(user.uid).set({ profile: { ...p, name: newName } }, { merge:true });
      }catch(err){ alert("No se pudo guardar el nombre: "+(err.message||err.code)); }
    }
    hiddenFile.value = "";
    hiddenFile.click();
  });

  // Convertir a Data-URL (JPEG) y guardar en Firestore (campo profile.avatar)
  function fileToDataURL(file, max = 320, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > max) { height = Math.round(height * (max / width)); width = max; }
          else if (height >= width && height > max) { width = Math.round(width * (max / height)); height = max; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  hiddenFile.addEventListener("change", async ()=>{
    const file = hiddenFile.files && hiddenFile.files[0];
    if(!file){ await refreshProfile(); return; }
    const user = auth.currentUser; if(!user){ alert("Inicia sesión."); return; }
    try{
      const dataURL = await fileToDataURL(file, 320, 0.8);
      const snap = await db.collection("users").doc(user.uid).get();
      const p = (snap.data()||{}).profile || {};
      await db.collection("users").doc(user.uid).set({ profile: { ...p, avatar: dataURL } }, { merge:true });
      pcAvatar.src = dataURL;
    }catch(err){ alert("Error preparando la imagen: "+(err.message||err)); }
    await refreshProfile();
  });

  async function refreshProfile(){ const uid=auth.currentUser?.uid; if(uid) await loadAll(uid); }

  // ===== Amigos (por username) =====
  function friendsCol(uid){ return db.collection("users").doc(uid).collection("friends"); }
  function friendCard(uid,data){
    const p=data.profile||{}; const q=data.quests||{};
    const total=["flexiones","sentadillas","abdominales1","correr"].reduce((a,k)=>a+(q[k]?1:0),0);
    const display = p.name || data.username || "Jugador";
    return `<div class="friend" data-uid="${uid}">
      <div class="meta"><div class="name">${display}</div>
      <div class="small">@${(data.username||"unknown")}</div></div>
      <div class="score">${total}/4</div>
      <div class="actions"><button class="btn small view">Ver perfil</button><button class="btn small remove">Eliminar</button></div>
    </div>`;
  }
  function subscribeFriends(uid){
    if(unsubFriends) unsubFriends();
    unsubFriends=friendsCol(uid).onSnapshot(async snap=>{
      const cards=await Promise.all(snap.docs.map(async d=>{
        const fuid=d.id; const ds=await db.collection("users").doc(fuid).get();
        return ds.exists?friendCard(fuid,ds.data()):"";
      }));
      friendsList.innerHTML=cards.length?cards.join(""):`<div class="muted">Aún no has agregado amigos.</div>`;
    });
  }

  addFriendForm.addEventListener("submit", async e=>{
    e.preventDefault();
    friendMsg.textContent="Buscando…";
    const me=auth.currentUser; if(!me){ friendMsg.textContent="Inicia sesión"; return; }
    let raw = (friendUsernameInput.value || "").trim();

    try{
      let targetSnap = null;
      if (raw.includes("@")) {
        const byEmail = await db.collection("users").where("email","==", raw.toLowerCase()).limit(1).get();
        if (!byEmail.empty) targetSnap = byEmail.docs[0];
      } else {
        const uname = cleanUsername(raw);
        if (!isValidUsername(uname)) { friendMsg.textContent="Nombre inválido (3–20, letras/números/_)."; return; }
        const byUser = await db.collection("users").where("usernameLower","==", uname.toLowerCase()).limit(1).get();
        if (!byUser.empty) targetSnap = byUser.docs[0];
      }

      if (!targetSnap) { friendMsg.textContent = "No se encontró."; return; }
      if (targetSnap.id === me.uid) { friendMsg.textContent = "No puedes agregarte a ti mismo."; return; }

      await friendsCol(me.uid).doc(targetSnap.id).set({friendUid:targetSnap.id, addedAt:Date.now()},{merge:true});
      friendMsg.textContent="Amigo agregado ✓"; friendUsernameInput.value="";
    }catch(err){ friendMsg.textContent="Error: "+(err.message||err.code); }
  });

  friendsList.addEventListener("click", async e=>{
    const row = e.target.closest(".friend"); if(!row) return;
    const fuid = row.dataset.uid;
    if(e.target.closest(".remove")){
      const me=auth.currentUser; if(!me) return;
      try{ await friendsCol(me.uid).doc(fuid).delete(); }catch(err){ alert("No se pudo eliminar: "+(err.message||err.code)); }
      return;
    }
    if(e.target.closest(".view")){ openFriendProfile(fuid); }
  });

  // Perfil público (sólo lectura)
  async function openFriendProfile(uid){
    try{
      const doc = await db.collection("users").doc(uid).get();
      if(!doc.exists){ alert("No se encontró el perfil."); return; }
      renderFriendCard(friendProfileCard, doc.data());
      homeView.classList.add("hidden"); friendsView.classList.add("hidden"); profileView.classList.add("hidden");
      publicProfileView.classList.remove("hidden");
    }catch(err){ alert("Error cargando perfil: "+(err.message||err.code)); }
  }
  function renderFriendCard(container, data){
    const p = data.profile || {};
    const display = p.name || data.username || "GUERRERO123";
    container.innerHTML = `
      <div class="pc-header"><div class="pc-frame">
        <img src="${p.avatar || "data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360'><rect width='100%' height='100%' fill='%230a0a0a'/></svg>")}" alt="Avatar">
      </div></div>
      <h2 class="pc-name">${display}</h2>
      <div class="level-row">
        <div class="pill left">NIVEL <span>${p.level ?? 1}</span></div>
        <div class="pill right"><span>${p.xp ?? 0}</span>/<span>${p.xpMax ?? 1000}</span></div>
      </div>
      <div class="rank-row">
        <div class="rank-line"></div>
        <div class="rank-pill">RANGO <span>${p.rank||"E"}</span></div>
        <div class="rank-line"></div>
      </div>
      <div class="section-box">
        <div class="section-title">LOGROS</div>
        <div class="badges"><div class="badge b1"></div><div class="badge b2"></div><div class="badge b3"></div><div class="badge b4"></div></div>
      </div>
      <div class="section-title spaced">ESTADÍSTICAS</div>
      <div class="stats">
        <div class="stat">
          <svg viewBox="0 0 36 36"><path class="sg" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"/><path class="sf" style="stroke-dasharray:100 100;stroke-dashoffset:${100-(p.stats?.fuerza??0)}" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"/></svg>
          <div class="sv"><span>${p.stats?.fuerza ?? 0}</span></div><div class="sc">FUERZA</div>
        </div>
        <div class="stat">
          <svg viewBox="0 0 36 36"><path class="sg" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"/><path class="sf" style="stroke-dasharray:100 100;stroke-dashoffset:${100-(p.stats?.resistencia??0)}" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"/></svg>
          <div class="sv"><span>${p.stats?.resistencia ?? 0}</span></div><div class="sc">RESISTENCIA</div>
        </div>
        <div class="stat">
          <svg viewBox="0 0 36 36"><path class="sg" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"/><path class="sf" style="stroke-dasharray:100 100;stroke-dashoffset:${100-(p.stats?.agilidad??0)}" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"/></svg>
          <div class="sv"><span>${p.stats?.agilidad ?? 0}</span></div><div class="sc">AGILIDAD</div>
        </div>
      </div>
    `;
  }
  ppBack.addEventListener("click", ()=>{ publicProfileView.classList.add("hidden"); friendsView.classList.remove("hidden"); });

  // ===== Auth state =====
  let unsubFriends=null;
  auth.onAuthStateChanged(async (user)=>{
    if(!user){
      setAuthVisible(true); appVisible(false);
      overlay.classList.add("hidden"); document.body.classList.remove("intro-open");
      if(unsubFriends){ unsubFriends(); unsubFriends=null; }
      return;
    }
    setAuthVisible(false);

    // Asegurar username (para cuentas antiguas o recién creadas sin username)
    await ensureUsernameWithModal(user.uid);

    if(!local.getIntro()){
      document.body.classList.add("intro-open"); openIntro();
    }else{
      document.body.classList.remove("intro-open"); appVisible(true);
      ensureDailyReset(user.uid);
      await loadAll(user.uid);
      startDailyCountdown(user.uid);
      subscribeFriends(user.uid);
    }
  });

  // ===== Pintar local al arranque =====
  (function paintLocalOnBoot(){ 
    if(!local.getIntro()){ document.body.classList.add("intro-open"); }
    // pinto quests locales por si ya hay algo en cache
    try{ paintQuests(JSON.parse(localStorage.getItem(QUESTS_KEY)||"{}")); }catch{}
  })();

})();
