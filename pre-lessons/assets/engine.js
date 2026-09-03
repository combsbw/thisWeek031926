/* Pre-Lesson engine — renders an interactive chapter/unit pre-lesson from a data config. */
(function(){
  "use strict";

  const LS_PREFIX = "biounit1-prelesson::";

  function store(id){
    const key = LS_PREFIX + id;
    let data = {};
    try{ data = JSON.parse(localStorage.getItem(key) || "{}"); }catch(e){ data = {}; }
    return {
      get(k, fallback){ return (k in data) ? data[k] : fallback; },
      set(k, v){ data[k] = v; try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} },
      all(){ return data; }
    };
  }
  window.PreLessonStore = store; // exposed so the hub page can read every chapter's progress

  function el(tag, cls, html){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  function confettiBurst(count){
    count = count || 60;
    const colors = ["#7c3aed","#ec4899","#f59e0b","#22c55e","#38bdf8"];
    for(let i=0;i<count;i++){
      const p = el("div","confetti-piece");
      p.style.left = Math.random()*100 + "vw";
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      p.style.animationDuration = (2 + Math.random()*1.5) + "s";
      p.style.animationDelay = (Math.random()*0.4) + "s";
      p.style.transform = `rotate(${Math.random()*360}deg)`;
      document.body.appendChild(p);
      setTimeout(()=>p.remove(), 4000);
    }
  }

  function PreLesson(config){
    const S = store(config.id);
    const root = document.getElementById("app");
    const progressKeys = ["shape","folders","sort","traps","hooks","quiz"];
    let xp = S.get("xp", 0);

    function addXP(amount, key){
      if(key && S.get("done:"+key, false)) return; // no double-dipping
      if(key) S.set("done:"+key, true);
      xp += amount; S.set("xp", xp);
      renderProgress();
      pulseXP();
    }

    function pulseXP(){
      const b = document.getElementById("xpBadge");
      if(!b) return;
      b.animate([{transform:"scale(1)"},{transform:"scale(1.25)"},{transform:"scale(1)"}],{duration:400});
    }

    function computeProgress(){
      let done = 0;
      progressKeys.forEach(k => { if(S.get("done:"+k, false)) done++; });
      return Math.round((done/progressKeys.length)*100);
    }

    function renderProgress(){
      const pct = computeProgress();
      const fill = document.getElementById("progFill");
      const pctLabel = document.getElementById("progPct");
      const xpBadge = document.getElementById("xpBadge");
      if(fill) fill.style.width = pct + "%";
      if(pctLabel) pctLabel.textContent = pct + "% ready";
      if(xpBadge) xpBadge.innerHTML = "⭐ " + S.get("xp",0) + " XP";
      if(pct === 100 && !S.get("celebrated", false)){
        S.set("celebrated", true);
        confettiBurst(90);
      }
    }

    function markSectionDone(key){
      const chip = document.querySelector(`.done-check[data-key="${key}"]`);
      if(chip) chip.classList.add("show");
      addXP(sectionXP(key), key);
    }

    function sectionXP(key){
      return {shape:10, folders:15, sort:25, traps:15, hooks:10, quiz:25}[key] || 10;
    }

    // ---------- top bar ----------
    function buildTopBar(){
      const rail = el("div","progress-rail");
      rail.innerHTML = `
        <div class="progress-track"><div class="progress-fill" id="progFill"></div></div>
        <div class="progress-meta">
          <span id="progPct">0% ready</span>
          <span class="xp-badge" id="xpBadge">⭐ 0 XP</span>
        </div>`;
      root.appendChild(rail);
    }

    // ---------- hero ----------
    function buildHero(){
      const h = el("section","hero");
      h.innerHTML = `
        <div class="hero-icon">${config.icon}</div>
        <div class="kicker">${config.kicker}</div>
        <h1>${config.title}</h1>
        <p class="subtitle">${config.subtitle}</p>
        ${config.hook ? `<div class="hook"><strong>${config.hook.lead}</strong><br>${config.hook.body}</div>` : ""}
      `;
      root.appendChild(h);
    }

    // ---------- shape section ----------
    function buildShape(){
      if(!config.shape) return;
      const s = config.shape;
      const sec = el("section","section");
      sec.id = "shape";
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">The Shape of This Chapter <span class="done-check" data-key="shape">✓ got it</span></div>
          <div class="section-title">${s.title}</div>
          <p class="section-desc">${s.description}</p>
        </div>
        <div class="shape-card">
          <div class="shape-visual">${s.emoji}</div>
          <div class="shape-body">
            <span class="pattern-pill">${s.pattern}</span>
            <h3>${s.headline}</h3>
            <p style="margin-bottom:0;color:var(--ink-soft)">${s.detail}</p>
          </div>
        </div>`;
      root.appendChild(sec);
      // mark done once the card is scrolled into view
      const card = sec.querySelector(".shape-card");
      const obs = new IntersectionObserver((entries)=>{
        entries.forEach(en=>{ if(en.isIntersecting){ markSectionDone("shape"); obs.disconnect(); } });
      }, {threshold:0.5});
      obs.observe(card);
    }

    // ---------- folders section ----------
    function buildFolders(){
      if(!config.folders || !config.folders.length) return;
      const sec = el("section","section");
      sec.id = "folders";
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">Open Your Folders <span class="done-check" data-key="folders">✓ got it</span></div>
          <div class="section-title">Sort every new term into one bucket</div>
          <p class="section-desc">Tap each folder to preview what belongs inside. Open all of them before moving on.</p>
        </div>
        <div class="folders-grid" id="foldersGrid"></div>`;
      root.appendChild(sec);
      const grid = sec.querySelector("#foldersGrid");
      const openedSet = new Set(S.get("openedFolders", []));

      config.folders.forEach((f, idx)=>{
        const card = el("button","folder-card" + (openedSet.has(idx) ? " opened" : ""));
        card.type = "button";
        card.innerHTML = `
          <div class="folder-emoji">${f.emoji}</div>
          <div class="folder-name">${f.name}</div>
          <div class="folder-role">${f.role}</div>
          <div class="folder-terms">${f.terms.map(t=>`<span class="term-chip">${t}</span>`).join("")}</div>
          <div class="folder-toggle">${openedSet.has(idx) ? "Hide terms ▲" : "Preview terms ▼"}</div>`;
        card.addEventListener("click", ()=>{
          const isOpen = card.classList.toggle("opened");
          card.querySelector(".folder-toggle").textContent = isOpen ? "Hide terms ▲" : "Preview terms ▼";
          if(isOpen){ openedSet.add(idx); } else { openedSet.delete(idx); }
          S.set("openedFolders", Array.from(openedSet));
          if(openedSet.size === config.folders.length) markSectionDone("folders");
        });
        grid.appendChild(card);
      });
      if(openedSet.size === config.folders.length) markSectionDone("folders");
    }

    // ---------- sort game ----------
    function buildSortGame(){
      if(!config.sortGame) return;
      const g = config.sortGame;
      const sec = el("section","section");
      sec.id = "sort";
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">Sort It Out <span class="done-check" data-key="sort">✓ got it</span></div>
          <div class="section-title">Drag each chip into its folder</div>
          <p class="section-desc">${g.instructions}</p>
        </div>
        <div class="sort-wrap">
          <div class="chip-bank" id="chipBank"></div>
          <div class="sort-bins" id="sortBins"></div>
          <div class="sort-status" id="sortStatus">0 / ${g.chips.length} placed correctly</div>
        </div>`;
      root.appendChild(sec);

      const bank = sec.querySelector("#chipBank");
      const binsWrap = sec.querySelector("#sortBins");
      const statusEl = sec.querySelector("#sortStatus");
      const placed = S.get("sortPlaced", {}); // term -> binId
      let correctCount = 0;

      g.bins.forEach(bin=>{
        const binEl = el("div","sort-bin");
        binEl.dataset.bin = bin.id;
        binEl.innerHTML = `<h4>${bin.label}</h4><div class="bin-chips"></div>`;
        binsWrap.appendChild(binEl);
      });

      function updateStatus(){
        statusEl.textContent = `${correctCount} / ${g.chips.length} placed correctly`;
        statusEl.classList.toggle("win", correctCount === g.chips.length);
        if(correctCount === g.chips.length){
          statusEl.textContent = "🎉 All sorted! Nice pattern-matching.";
          markSectionDone("sort");
        }
      }

      let selectedChip = null; // for tap-to-place on touch devices

      function makeChip(item){
        const chip = el("div","drag-chip", item.term);
        chip.draggable = true;
        chip.dataset.term = item.term;
        chip.dataset.bin = item.bin;
        chip.addEventListener("dragstart", (e)=>{
          e.dataTransfer.setData("text/plain", item.term);
          setTimeout(()=>chip.style.opacity="0.4",0);
        });
        chip.addEventListener("dragend", ()=>{ chip.style.opacity="1"; });
        chip.addEventListener("click", ()=>{
          if(chip.classList.contains("chip-correct")) return;
          document.querySelectorAll(".drag-chip.selected").forEach(c=>c.classList.remove("selected"));
          selectedChip = chip;
          chip.classList.add("selected");
        });
        return chip;
      }

      function placeChip(term, binId, animateWrong){
        const item = g.chips.find(c=>c.term === term);
        if(!item) return;
        const chipEl = document.querySelector(`.drag-chip[data-term="${CSS.escape(term)}"]`);
        if(!chipEl) return;
        if(binId === item.bin){
          chipEl.classList.add("chip-correct");
          chipEl.classList.remove("selected");
          chipEl.draggable = false;
          binsWrap.querySelector(`.sort-bin[data-bin="${CSS.escape(binId)}"] .bin-chips`).appendChild(chipEl);
          correctCount++;
          placed[term] = binId;
          S.set("sortPlaced", placed);
          updateStatus();
        } else if(animateWrong){
          chipEl.classList.add("chip-wrong");
          setTimeout(()=>chipEl.classList.remove("chip-wrong"), 400);
        }
      }

      // build chips, restoring any already-correct placements
      const shuffled = g.chips.slice().sort(()=>Math.random()-0.5);
      shuffled.forEach(item=>{
        const chip = makeChip(item);
        if(placed[item.term] === item.bin){
          chip.classList.add("chip-correct");
          chip.draggable = false;
          binsWrap.querySelector(`.sort-bin[data-bin="${CSS.escape(item.bin)}"] .bin-chips`).appendChild(chip);
          correctCount++;
        } else {
          bank.appendChild(chip);
        }
      });
      updateStatus();

      binsWrap.querySelectorAll(".sort-bin").forEach(binEl=>{
        binEl.addEventListener("dragover", (e)=>{ e.preventDefault(); binEl.classList.add("dragover"); });
        binEl.addEventListener("dragleave", ()=> binEl.classList.remove("dragover"));
        binEl.addEventListener("drop", (e)=>{
          e.preventDefault(); binEl.classList.remove("dragover");
          const term = e.dataTransfer.getData("text/plain");
          placeChip(term, binEl.dataset.bin, true);
        });
        // tap-to-place fallback for touch/mobile
        binEl.addEventListener("click", ()=>{
          if(!selectedChip) return;
          const term = selectedChip.dataset.term;
          selectedChip.classList.remove("selected");
          placeChip(term, binEl.dataset.bin, true);
          selectedChip = null;
        });
      });
    }

    // ---------- boundary traps (flip cards) ----------
    function buildTraps(){
      if(!config.traps || !config.traps.length) return;
      const sec = el("section","section");
      sec.id = "traps";
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">Watch Out <span class="done-check" data-key="traps">✓ got it</span></div>
          <div class="section-title">Common mix-ups, flipped</div>
          <p class="section-desc">Tap a card to reveal the fix. Flip all of them.</p>
        </div>
        <div class="flip-grid" id="flipGrid"></div>`;
      root.appendChild(sec);
      const grid = sec.querySelector("#flipGrid");
      const flippedSet = new Set(S.get("flippedTraps", []));

      config.traps.forEach((t, idx)=>{
        const card = el("div","flip-card" + (flippedSet.has(idx) ? " flipped" : ""));
        card.innerHTML = `
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <div class="trap-label">⚠️ Trap</div>
              <div>${t.trap}</div>
              <div class="flip-hint">tap to flip</div>
            </div>
            <div class="flip-face flip-back">
              <div class="trap-label">✓ Actually</div>
              <div>${t.fix}</div>
            </div>
          </div>`;
        card.addEventListener("click", ()=>{
          card.classList.toggle("flipped");
          flippedSet.add(idx);
          S.set("flippedTraps", Array.from(flippedSet));
          if(flippedSet.size === config.traps.length) markSectionDone("traps");
        });
        grid.appendChild(card);
      });
      if(flippedSet.size === config.traps.length) markSectionDone("traps");
    }

    // ---------- hook questions ----------
    function buildHooks(){
      if(!config.hookQuestions || !config.hookQuestions.length) return;
      const sec = el("section","section");
      sec.id = "hooks";
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">Think About It <span class="done-check" data-key="hooks">✓ got it</span></div>
          <div class="section-title">Predict first, then peek</div>
          <p class="section-desc">No wrong answers here — just think it through before you read the chapter.</p>
        </div>
        <div class="hook-list" id="hookList"></div>`;
      root.appendChild(sec);
      const list = sec.querySelector("#hookList");
      const openedSet = new Set(S.get("openedHooks", []));

      config.hookQuestions.forEach((h, idx)=>{
        const item = el("div","hook-item" + (openedSet.has(idx) ? " open" : ""));
        item.innerHTML = `
          <button class="hook-q" type="button">
            <span>${h.q}</span><span class="arrow">▾</span>
          </button>
          <div class="hook-a"><div class="hook-a-inner">${h.a}</div></div>`;
        item.querySelector(".hook-q").addEventListener("click", ()=>{
          item.classList.toggle("open");
          openedSet.add(idx);
          S.set("openedHooks", Array.from(openedSet));
          if(openedSet.size === config.hookQuestions.length) markSectionDone("hooks");
        });
        list.appendChild(item);
      });
      if(openedSet.size === config.hookQuestions.length) markSectionDone("hooks");
    }

    // ---------- diagram (mermaid) ----------
    function buildDiagram(){
      if(!config.diagram) return;
      const sec = el("section","section");
      sec.id = "diagram";
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">Concept Map</div>
          <div class="section-title">${config.diagram.title || "How the ideas connect"}</div>
          <p class="section-desc">${config.diagram.description || ""}</p>
        </div>
        <div class="diagram-wrap"><pre class="mermaid">${config.diagram.mermaid}</pre></div>`;
      root.appendChild(sec);
    }

    // ---------- forward links ----------
    function buildForward(){
      if(!config.forwardLinks || !config.forwardLinks.length) return;
      const sec = el("section","section");
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">Where This Goes Next</div>
          <div class="section-title">This chapter keeps paying off later</div>
        </div>
        <div class="chip-scroll">
          ${config.forwardLinks.map(f=>`<div class="forward-chip"><b>${f.where}</b>${f.what}</div>`).join("")}
        </div>`;
      root.appendChild(sec);
    }

    // ---------- playbook callout ----------
    function buildPlaybook(){
      if(!config.playbook) return;
      const sec = el("section","section");
      sec.innerHTML = `
        <div class="playbook">
          <div class="pb-icon">🎯</div>
          <div><h4>Playbook Move</h4><p>${config.playbook}</p></div>
        </div>`;
      root.appendChild(sec);
    }

    // ---------- quiz ----------
    function buildQuiz(){
      if(!config.quiz || !config.quiz.length) return;
      const sec = el("section","section");
      sec.id = "quiz";
      sec.innerHTML = `
        <div class="section-head">
          <div class="section-eyebrow">Quick Check <span class="done-check" data-key="quiz">✓ got it</span></div>
          <div class="section-title">Prove you've got the shape of it</div>
          <p class="section-desc">${config.quiz.length} quick questions — about the patterns, not deep vocab recall.</p>
        </div>
        <div id="quizArea"></div>`;
      root.appendChild(sec);
      renderQuiz(sec.querySelector("#quizArea"));
    }

    function renderQuiz(area){
      area.innerHTML = "";
      let correct = 0;
      let answered = 0;
      config.quiz.forEach((q, qi)=>{
        const card = el("div","quiz-card");
        card.innerHTML = `<div class="quiz-q">${qi+1}. ${q.q}</div>
          <div class="quiz-choices"></div>
          <div class="quiz-explain">${q.explain || ""}</div>`;
        const choicesWrap = card.querySelector(".quiz-choices");
        const explainEl = card.querySelector(".quiz-explain");
        q.choices.forEach((choice, ci)=>{
          const btn = el("button","quiz-choice", choice);
          btn.type = "button";
          btn.addEventListener("click", ()=>{
            if(btn.disabled) return;
            choicesWrap.querySelectorAll("button").forEach(b=>b.disabled = true);
            answered++;
            if(ci === q.correctIndex){
              btn.classList.add("correct"); correct++;
            } else {
              btn.classList.add("wrong");
              const correctBtn = choicesWrap.children[q.correctIndex];
              if(correctBtn) correctBtn.classList.add("correct");
            }
            explainEl.classList.add("show");
            if(answered === config.quiz.length) finishQuiz(area, correct);
          });
          choicesWrap.appendChild(btn);
        });
        area.appendChild(card);
      });
    }

    function finishQuiz(area, correct){
      const total = config.quiz.length;
      const pct = Math.round((correct/total)*100);
      let badge = "Keep Exploring";
      if(pct === 100) badge = "Pattern Master 🏆";
      else if(pct >= 80) badge = "Sharp Eyes 🔍";
      else if(pct >= 50) badge = "Warming Up 🔥";
      const result = el("div","quiz-result");
      result.innerHTML = `
        <div class="score">${correct}/${total}</div>
        <div class="badge-name">${badge}</div>
        <button class="retry-btn" type="button">Try again</button>`;
      area.appendChild(result);
      result.querySelector(".retry-btn").addEventListener("click", ()=> renderQuiz(area));
      S.set("bestQuiz", Math.max(S.get("bestQuiz",0), correct));
      markSectionDone("quiz");
      if(pct === 100) confettiBurst(70);
    }

    // ---------- nav footer ----------
    function buildNav(){
      if(!config.nav) return;
      const nav = el("div","pl-nav");
      let html = "";
      if(config.nav.prev){
        html += `<a href="${config.nav.prev.href}"><div class="nav-label">◀ Back</div><div class="nav-title">${config.nav.prev.label}</div></a>`;
      }
      if(config.nav.up){
        html += `<a href="${config.nav.up.href}"><div class="nav-label">Unit</div><div class="nav-title">${config.nav.up.label}</div></a>`;
      }
      if(config.nav.next){
        html += `<a href="${config.nav.next.href}"><div class="nav-label">Next ▶</div><div class="nav-title">${config.nav.next.label}</div></a>`;
      }
      nav.innerHTML = html;
      root.appendChild(nav);
    }

    // ---------- assemble ----------
    function render(){
      buildTopBar();
      buildHero();
      if(typeof config.afterHero === "function") config.afterHero(root, store);
      buildShape();
      buildFolders();
      buildSortGame();
      buildTraps();
      buildHooks();
      buildDiagram();
      buildForward();
      buildPlaybook();
      buildQuiz();
      buildNav();
      renderProgress();
      if(window.mermaid){
        window.mermaid.initialize({startOnLoad:false, theme:"neutral", themeVariables:{fontFamily:"Inter, sans-serif"}});
        window.mermaid.run({querySelector:".mermaid"});
      }
    }

    render();
  }

  window.PreLesson = PreLesson;
})();
