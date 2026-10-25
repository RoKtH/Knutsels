(function () {
  var KEY = "steuntje-in-de-rug:complimenten";
  var items = [];
  var lastId = null;
  var confirmId = null;

  var elPick = document.getElementById("pick");
  var elResult = document.getElementById("result");
  var elForm = document.getElementById("form");
  var elText = document.getElementById("text");
  var elWarn = document.getElementById("warn");
  var elStatus = document.getElementById("status");
  var elFrom = document.getElementById("from");
  var elAddWrap = document.getElementById("addWrap");
  var elOpen = document.getElementById("openForm");
  var elCancel = document.getElementById("cancel");
  var elSummary = document.getElementById("summary");
  var elEmpty = document.getElementById("empty");
  var elList = document.getElementById("list");
  var elNotice = document.getElementById("notice");

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (x) {
        return x && typeof x.text === "string" && typeof x.id === "string";
      });
    } catch (e) {
      elNotice.hidden = false;
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      elNotice.hidden = true;
    } catch (e) {
      elNotice.hidden = false;
    }
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function showResult(item) {
    elResult.innerHTML = "";
    if (!item) {
      var hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "Je lijst is nog leeg. Schrijf hieronder je eerste compliment of mooie moment.";
      elResult.appendChild(hint);
    } else {
      var q = document.createElement("p");
      q.className = "quote";
      q.textContent = item.text;
      var d = document.createElement("p");
      d.className = "date";
      d.textContent = "Bewaard op " + formatDate(item.date);
      elResult.appendChild(q);
      if (item.from) {
        var f = document.createElement("p");
        f.className = "from";
        f.textContent = "Van " + item.from;
        elResult.appendChild(f);
      }
      elResult.appendChild(d);
    }
    elResult.classList.remove("reveal");
    void elResult.offsetWidth;
    elResult.classList.add("reveal");
  }

  function pick() {
    if (!items.length) { showResult(null); return; }
    var pool = items;
    if (items.length > 1 && lastId) {
      pool = items.filter(function (i) { return i.id !== lastId; });
    }
    var chosen = pool[Math.floor(Math.random() * pool.length)];
    lastId = chosen.id;
    showResult(chosen);
  }

  function renderList() {
    elSummary.textContent = "Alle complimenten (" + items.length + ")";
    elEmpty.hidden = items.length > 0;
    elList.innerHTML = "";
    items.slice().reverse().forEach(function (item) {
      var li = document.createElement("li");
      var body = document.createElement("div");
      body.className = "body";
      var t = document.createElement("p");
      t.className = "text";
      t.textContent = item.text;
      var w = document.createElement("p");
      w.className = "when";
      w.textContent = (item.from ? "Van " + item.from + ", " : "") + formatDate(item.date);
      body.appendChild(t);
      body.appendChild(w);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "trash";
      if (confirmId === item.id) {
        btn.classList.add("confirm");
        btn.textContent = "Verwijder";
        btn.setAttribute("aria-label", "Bevestig: verwijder dit compliment");
      } else {
        btn.textContent = "🗑";
        btn.setAttribute("aria-label", "Verwijder dit compliment");
      }
      btn.addEventListener("click", function () {
        if (confirmId === item.id) {
          items = items.filter(function (i) { return i.id !== item.id; });
          if (lastId === item.id) lastId = null;
          confirmId = null;
          save();
        } else {
          confirmId = item.id;
        }
        renderList();
      });

      li.appendChild(body);
      li.appendChild(btn);
      elList.appendChild(li);
    });
  }

  function openForm() {
    elStatus.textContent = "";
    elAddWrap.hidden = true;
    elForm.hidden = false;
    elText.focus();
  }

  function closeForm() {
    elForm.hidden = true;
    elAddWrap.hidden = false;
    elWarn.hidden = true;
    elText.value = "";
    elFrom.value = "";
  }

  elOpen.addEventListener("click", openForm);

  elCancel.addEventListener("click", function () {
    closeForm();
    elOpen.focus();
  });

  elForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = elText.value.trim();
    var from = elFrom.value.trim();
    if (!value) {
      elWarn.hidden = false;
      elText.focus();
      return;
    }
    items.push({ id: newId(), text: value, from: from, date: new Date().toISOString() });
    save();
    confirmId = null;
    renderList();
    closeForm();
    elStatus.textContent = "Bewaard.";
    elOpen.focus();
  });

  elText.addEventListener("input", function () {
    elWarn.hidden = true;
    elStatus.textContent = "";
  });

  var elBackup = document.getElementById("backup");
  var elBackupStatus = document.getElementById("backupStatus");

  document.getElementById("makeBackup").addEventListener("click", function () {
    if (!items.length) {
      elBackup.value = "";
      elBackupStatus.textContent = "Er is nog niets om te bewaren.";
      return;
    }
    var data = { app: "steuntje-in-de-rug", versie: 1, complimenten: items };
    elBackup.value = JSON.stringify(data);
    elBackup.focus();
    elBackup.select();
    function done(ok) {
      elBackupStatus.textContent = ok
        ? "Back-up gekopieerd. Plak hem ergens veilig, bijvoorbeeld in een notitie."
        : "De back-up staat in het vak. Selecteer en kopieer de tekst zelf.";
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(elBackup.value).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    } catch (e) {
      done(false);
    }
  });

  document.getElementById("restoreBackup").addEventListener("click", function () {
    var raw = elBackup.value.trim();
    if (!raw) {
      elBackupStatus.textContent = "Plak eerst een back-up in het vak.";
      return;
    }
    var data = null;
    try { data = JSON.parse(raw); } catch (e) { data = null; }
    if (!data || data.app !== "steuntje-in-de-rug" || !Array.isArray(data.complimenten)) {
      elBackupStatus.textContent = "Dit lijkt geen back-up van deze app. Plak de volledige tekst.";
      return;
    }
    var known = {};
    items.forEach(function (i) { known[i.id] = true; });
    var added = 0;
    data.complimenten.forEach(function (x) {
      if (!x || typeof x.text !== "string" || !x.text.trim() || typeof x.id !== "string" || known[x.id]) return;
      items.push({
        id: x.id,
        text: x.text.slice(0, 500),
        from: typeof x.from === "string" ? x.from.slice(0, 80) : "",
        date: typeof x.date === "string" ? x.date : new Date().toISOString()
      });
      known[x.id] = true;
      added++;
    });
    items.sort(function (a, b) { return (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0); });
    save();
    confirmId = null;
    renderList();
    elBackup.value = "";
    elBackupStatus.textContent = added
      ? added + (added === 1 ? " compliment teruggezet." : " complimenten teruggezet.")
      : "Alles uit deze back-up stond al in je lijst.";
  });

  elPick.addEventListener("click", pick);

  items = load();
  renderList();
})();
