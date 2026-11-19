/* ============================================================
   MAKEUP DATE — site interactions
   Vanilla JS, no dependencies. Everything is demo data stored in
   localStorage so the prototype can be presented on any laptop.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var MD = window.MD || { artists: [], styles: [], locations: [], packages: [], portfolio: [], posts: [], reviews: [], faqs: [] };

  var param = function (k) { return new URLSearchParams(location.search).get(k); };
  var money = function (n) { return "¥" + Number(n).toLocaleString("en-US"); };

  var store = {
    get: function (k, fb) {
      try { var v = localStorage.getItem("md:" + k); return v ? JSON.parse(v) : fb; }
      catch (e) { return fb; }
    },
    set: function (k, v) {
      try { localStorage.setItem("md:" + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  var byId = function (list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  };
  var sLabel = function (st) { return st.cn === st.name ? st.name : st.cn + " " + st.name; };

  /* ---------------- toast ---------------- */
  var toastWrap;
  function toast(msg) {
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "toast-wrap";
      document.body.appendChild(toastWrap);
    }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = "<span>✦</span><span>" + msg + "</span>";
    toastWrap.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; }, 2200);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------------- header / nav ---------------- */
  var header = $("#siteHeader");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var mobileNav = $("#mobileNav"), menuToggle = $("#menuToggle");
  function setNav(open) {
    if (!mobileNav) return;
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (menuToggle) menuToggle.addEventListener("click", function () { setNav(true); });
  $$("[data-close-nav]").forEach(function (el) { el.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setNav(false); closeLightbox(); closeModal(); } });
  $$(".nav-item .nav-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var item = link.parentElement;
      var drop = $(".nav-drop", item);
      if (drop && window.innerWidth > 1080 && !item.classList.contains("is-open")) {
        /* first tap on touch laptops opens the menu instead of navigating */
        if (e.pointerType === "touch" || window.matchMedia("(hover: none)").matches) {
          e.preventDefault();
          $$(".nav-item.is-open").forEach(function (n) { if (n !== item) n.classList.remove("is-open"); });
          item.classList.toggle("is-open");
        }
      }
    });
  });

  /* ---------------- favorites ---------------- */
  var favs = store.get("favorites", []);

  function paintFavs() {
    $$("[data-fav]").forEach(function (btn) {
      var on = favs.indexOf(btn.dataset.fav) !== -1;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var badges = $$("[data-fav-count]");
    badges.forEach(function (b) {
      b.textContent = favs.length;
      b.hidden = favs.length === 0;
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    var id = btn.dataset.fav;
    var i = favs.indexOf(id);
    var a = byId(MD.artists, id);
    if (i === -1) { favs.push(id); toast("已收藏 " + (a ? a.name : "妆娘")); }
    else { favs.splice(i, 1); toast("已取消收藏 " + (a ? a.name : "")); }
    store.set("favorites", favs);
    paintFavs();
    if (document.body.dataset.page === "favorites") renderFavorites();
  });

  /* ---------------- reveal on scroll ----------------
     先给 <html> 打上 is-reveal，CSS 才会把 .reveal 设为透明；
     脚本没跑到或用户偏好减少动效时，内容保持可见。 */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("is-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
    // 兜底：1.2 秒后仍在视口内的元素直接显示
    setTimeout(function () {
      $$(".reveal:not(.in)").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add("in");
      });
    }, 1200);
  }

  /* ---------------- lightbox / modal ---------------- */
  var lb, lbImg, lbCap;
  function openLightbox(src, cap) {
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "lb";
      lb.innerHTML = '<button class="lb-close" aria-label="Close">✕</button><img alt=""><div class="lb-cap"></div>';
      document.body.appendChild(lb);
      lbImg = $("img", lb); lbCap = $(".lb-cap", lb);
      lb.addEventListener("click", function (e) {
        if (e.target === lb || e.target.classList.contains("lb-close")) closeLightbox();
      });
    }
    lbImg.src = src; lbCap.textContent = cap || "";
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (lb) lb.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  var modal;
  function closeModal() {
    if (modal) modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function openPost(post) {
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = '<div class="modal-card" style="position:relative"><button class="modal-close" aria-label="Close">✕</button><img alt=""><div class="mc-body"></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener("click", function (e) {
        if (e.target === modal || e.target.classList.contains("modal-close")) closeModal();
      });
    }
    var a = byId(MD.artists, post.artistId);
    $("img", modal).src = "assets/img/" + post.img;
    $(".mc-body", modal).innerHTML =
      '<div class="post-author" style="margin-bottom:14px"><img class="avatar" src="assets/img/' + (a ? a.img : "artist-1.jpg") + '" alt=""><span>' + post.author + '</span><span style="opacity:.4">·</span><span>' + post.time + '</span></div>' +
      '<h2 style="font-size:1.6rem">' + post.title + '</h2>' +
      '<p style="color:var(--ink-2)">' + post.body + '</p>' +
      '<div class="mt-3" style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-sm" href="artist.html?id=' + (a ? a.id : "a1") + '">查看妆娘 Profile</a>' +
      '<a class="btn btn-ghost btn-sm" href="community.html">返回社区</a></div>';
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  /* ---------------- shared card renderer ---------------- */
  function artistCard(a) {
    var tags = a.styles.map(function (s) {
      var st = byId(MD.styles, s);
      return "<span>" + (st ? st.cn : s) + "</span>";
    }).join("");
    return '<article class="artist-card" data-id="' + a.id + '">' +
      '<div class="ac-media"><a href="artist.html?id=' + a.id + '" tabindex="-1" aria-hidden="true">' +
      '<img src="assets/img/' + a.img + '" alt="' + a.name + '" loading="lazy"></a>' +
      (a.tag ? '<span class="ac-badge">' + a.tag + "</span>" : "") +
      '<button class="ac-fav' + (favs.indexOf(a.id) !== -1 ? " is-on" : "") + '" data-fav="' + a.id + '" aria-label="收藏 ' + a.name + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button></div>' +
      '<div class="ac-body"><h3 class="ac-name"><a href="artist.html?id=' + a.id + '">' + a.name + "</a></h3>" +
      '<div class="ac-meta"><span>' + a.areaCn + " " + a.area + '</span><span class="dot">·</span><span>' + a.rating + " (" + a.reviews + ")</span></div>" +
      '<div class="ac-styles">' + tags + "</div>" +
      '<div class="ac-foot"><div class="price">' + money(a.price) + ' <small>起 / 次</small></div>' +
      '<a class="btn btn-ghost btn-sm" href="artist.html?id=' + a.id + '">View</a></div></div></article>';
  }

  /* ============================================================
     PAGE MODULES
     ============================================================ */
  var page = document.body.dataset.page;

  /* ---- 01 home: search ---- */
  if (page === "home") {
    var form = $("#heroSearch");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = new URLSearchParams();
        var st = $("#hsStyle").value, lo = $("#hsLoc").value, bd = $("#hsBudget").value, sv = $("#hsService").value;
        if (st) q.set("style", st);
        if (lo) q.set("loc", lo);
        if (bd) q.set("max", bd);
        if (sv) q.set("service", sv);
        location.href = "artists.html" + (q.toString() ? "?" + q.toString() : "");
      });
    }
  }

  /* ---- 02 artists: filter + sort ---- */
  if (page === "artists") {
    var grid = $("#artistGrid");
    var cards = $$(".artist-card", grid);
    var countEl = $("#resultCount");
    var emptyEl = $("#emptyState");
    var state = {
      style: param("style") || "all",
      loc: param("loc") || "all",
      max: param("max") || "all",
      service: param("service") || "all",
      artist: param("artist") || "all",
      sort: "rec"
    };

    if (param("q")) { /* free-text from home pages that pass q */ }

    function applyChips() {
      $$("[data-filter-style]").forEach(function (c) {
        c.classList.toggle("is-active", c.dataset.filterStyle === state.style);
      });
      $$("[data-filter-loc]").forEach(function (c) {
        c.classList.toggle("is-active", c.dataset.filterLoc === state.loc);
      });
      $$("[data-filter-max]").forEach(function (c) {
        c.classList.toggle("is-active", c.dataset.filterMax === state.max);
      });
      $$("[data-filter-artist]").forEach(function (c) {
        c.classList.toggle("is-active", c.dataset.filterArtist === state.artist);
      });
      var sel = $("#sortSelect");
      if (sel) sel.value = state.sort;
    }

    function apply() {
      var shown = 0;
      var SV = { studio: "工作室", onsite: "上门", follow: "跟妆" };
      cards.forEach(function (c) {
        var okStyle = state.style === "all" || c.dataset.style.split(" ").indexOf(state.style) !== -1;
        var okLoc = state.loc === "all" || c.dataset.loc === state.loc;
        var okMax = state.max === "all" || Number(c.dataset.price) <= Number(state.max);
        var okSvc = state.service === "all" || (c.dataset.service || "").indexOf(SV[state.service]) !== -1;
        var okArtist = state.artist === "all" || c.dataset.id === state.artist;
        var show = okStyle && okLoc && okMax && okSvc && okArtist;
        c.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (countEl) countEl.innerHTML = "共 <b>" + shown + "</b> 位妆娘可预约";
      if (emptyEl) emptyEl.hidden = shown !== 0;

      var visible = cards.filter(function (c) { return c.style.display !== "none"; });
      visible.sort(function (a, b) {
        if (state.sort === "price-asc") return Number(a.dataset.price) - Number(b.dataset.price);
        if (state.sort === "price-desc") return Number(b.dataset.price) - Number(a.dataset.price);
        if (state.sort === "rating") return Number(b.dataset.rating) - Number(a.dataset.rating);
        return 0;
      });
      visible.forEach(function (c) { grid.appendChild(c); });
      applyChips();
    }

    $$("[data-filter-style]").forEach(function (c) {
      c.addEventListener("click", function () { state.style = c.dataset.filterStyle; apply(); });
    });
    $$("[data-filter-loc]").forEach(function (c) {
      c.addEventListener("click", function () { state.loc = c.dataset.filterLoc; apply(); });
    });
    $$("[data-filter-max]").forEach(function (c) {
      c.addEventListener("click", function () { state.max = c.dataset.filterMax; apply(); });
    });
    $$("[data-filter-artist]").forEach(function (c) {
      c.addEventListener("click", function () { state.artist = c.dataset.filterArtist; apply(); });
    });
    var sortSel = $("#sortSelect");
    if (sortSel) sortSel.addEventListener("change", function () { state.sort = sortSel.value; apply(); });
    var reset = $("#resetFilters");
    if (reset) reset.addEventListener("click", function () {
      state = { style: "all", loc: "all", max: "all", service: "all", artist: "all", sort: "rec" };
      apply();
    });
    apply();

    /* contextual note when arriving from a style / location page */
    var note = $("#filterNote");
    if (note) {
      var bits = [];
      if (state.style !== "all") { var s = byId(MD.styles, state.style); if (s) bits.push(s.cn + " " + s.name); }
      if (state.loc !== "all") { var l = byId(MD.locations, state.loc); if (l) bits.push(l.cn + " " + l.name); }
      if (state.max !== "all") bits.push("≤ " + money(state.max));
      if (state.service !== "all") bits.push({ studio: "工作室", onsite: "上门", follow: "跟妆" }[state.service] || state.service);
      if (state.artist !== "all") { var ar = byId(MD.artists, state.artist); if (ar) bits.push(ar.cn || ar.name); }
      note.innerHTML = bits.length ? "目前筛选：<b>" + bits.join(" · ") + "</b>" : "";
      note.hidden = bits.length === 0;
    }
  }

  /* ---- 05 artist profile ---- */
  if (page === "artist") {
    var a = byId(MD.artists, param("id") || "a1") || MD.artists[0];
    document.title = a.name + " · MAKEUP DATE";
    var set = function (sel, val) { var el = $(sel); if (el) el.innerHTML = val; };
    set("#apName", a.name);
    set("#apCrumb", a.name);
    set("#apCn", a.cn);
    set("#apHeadline", a.headline);
    set("#apBio", a.bio);
    set("#apArea", a.areaCn + " " + a.area);
    set("#apArea2", a.areaCn + " " + a.area);
    set("#apRating", '<span class="star">★</span> <b>' + a.rating + "</b> <span>(" + a.reviews + " reviews)</span>");
    set("#apPrice", money(a.price) + ' <small>起 / 次</small>');
    set("#apService", a.service);
    set("#apResponse", a.response);
    set("#apSince", "Since " + a.since);
    set("#apLangs", a.langs);
    set("#apStyles", a.styles.map(function (s) { var st = byId(MD.styles, s); return '<a class="tag" href="artists.html?style=' + s + '">' + sLabel(st) + "</a>"; }).join(" "));
    var img = $("#apImg");
    if (img) { img.src = "assets/img/" + a.img; img.alt = a.name + " — " + a.area; }
    var fav = $("#apFav");
    if (fav) {
      fav.dataset.fav = a.id;
      fav.classList.toggle("is-on", favs.indexOf(a.id) !== -1);
      fav.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg><span>收藏</span>';
    }
    $$("[data-book-artist]").forEach(function (el) { el.href = "booking.html?artist=" + a.id; });

    /* gallery: portfolio pieces of this artist + profile shot */
    var mine = MD.portfolio.filter(function (p) { return p.artistId === a.id; });
    var gal = $("#apGallery");
    if (gal) {
      var imgs = [{ img: a.img, title: a.headline }].concat(mine);
      gal.innerHTML = imgs.map(function (p, i) {
        return '<figure data-lb="assets/img/' + p.img + '" data-cap="' + (p.title || "") + '"><img src="assets/img/' + p.img + '" alt="' + (p.title || a.name) + '" loading="lazy"><figcaption><b>' + (p.title || "Profile") + '</b><span>0' + (i + 1) + "</span></figcaption></figure>";
      }).join("");
      $$("#apGallery [data-lb]").forEach(function (f) {
        f.addEventListener("click", function () { openLightbox(f.dataset.lb, f.dataset.cap); });
      });
    }

    /* tabs */
    var revWrap = $("#apReviews");
    if (revWrap) {
      var rs = MD.reviews.filter(function (r) { return r.artistId === a.id; });
      if (!rs.length) rs = MD.reviews.slice(0, 2);
      revWrap.innerHTML = rs.map(function (r) {
        return '<article class="review"><div class="review-head">' +
          '<img src="assets/img/' + a.img + '" alt="' + r.author + '">' +
          "<div><b>" + r.author + "</b><small>" + r.date + ' · <span class="sample-flag">Sample</span></small></div>' +
          '<span class="stars">' + "★".repeat(r.rating) + "☆".repeat(5 - r.rating) + "</span></div>" +
          "<p>" + r.text + "</p><div class=\"review-tags\">" +
          r.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div></article>";
      }).join("");
    }

    $$(".tabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".tabs button").forEach(function (x) { x.classList.remove("is-active"); });
        $$(".tab-panel").forEach(function (p) { p.classList.remove("is-active"); });
        b.classList.add("is-active");
        var panel = $("#" + b.dataset.tab);
        if (panel) panel.classList.add("is-active");
      });
    });
  }

  /* ---- 06 portfolio: filter + lightbox ---- */
  if (page === "portfolio") {
    $$("[data-pf-filter]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.pfFilter;
        $$("[data-pf-filter]").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
        $$("[data-pf-style]").forEach(function (fig) {
          fig.style.display = (f === "all" || fig.dataset.pfStyle === f) ? "" : "none";
        });
      });
    });
    $$("[data-lb]").forEach(function (fig) {
      fig.addEventListener("click", function () { openLightbox(fig.dataset.lb, fig.dataset.cap); });
    });
  }

  /* ---- 07 services: choose package -> booking ---- */
  if (page === "services") {
    $$("[data-pick-pkg]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        location.href = "booking.html?pkg=" + btn.dataset.pickPkg;
      });
    });
  }

  /* ---- 08 calendar ---- */
  if (page === "calendar") {
    var calGrid = $("#calGrid"), calLabel = $("#calLabel");
    var cursor = new Date();
    cursor.setDate(1);
    var chosen = { date: null, slot: null };
    var artistSel = $("#calArtist");
    if (artistSel) {
      artistSel.innerHTML = MD.artists.map(function (x) {
        return '<option value="' + x.id + '">' + (x.cn || x.name) + " · " + x.areaCn + "</option>";
      }).join("");
      if (param("artist")) artistSel.value = param("artist");
    }

    function statusOf(d, monthOffset) {
      var k = (d.getDate() * 7 + d.getMonth() * 3 + monthOffset * 5) % 11;
      if (k === 0 || k === 4) return "full";
      if (k === 8) return "rest";
      return "available";
    }

    function render() {
      var y = cursor.getFullYear(), m = cursor.getMonth();
      calLabel.textContent = y + " 年 " + (m + 1) + " 月";
      var first = new Date(y, m, 1).getDay();
      var days = new Date(y, m + 1, 0).getDate();
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var html = ["日", "一", "二", "三", "四", "五", "六"].map(function (d) {
        return '<div class="cal-dow">' + d + "</div>";
      }).join("");
      for (var i = 0; i < first; i++) html += '<div class="cal-day is-empty"></div>';
      for (var d = 1; d <= days; d++) {
        var date = new Date(y, m, d);
        var st = statusOf(date, 0);
        var past = date < today;
        var cls = past ? "rest" : st;
        var key = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        var sel = chosen.date === key ? " is-selected" : "";
        html += '<button type="button" class="cal-day ' + cls + sel + '" data-date="' + key + '" data-status="' + cls + '"' +
          (cls !== "available" ? " disabled" : "") + ">" + d + "</button>";
      }
      calGrid.innerHTML = html;
      $$(".cal-day.available", calGrid).forEach(function (b) {
        b.addEventListener("click", function () {
          chosen.date = b.dataset.date; chosen.slot = null;
          render(); renderSlots();
        });
      });
      var info = $("#calSelection");
      if (info) info.textContent = chosen.date ? chosen.date : "请先选择日期";
    }

    function renderSlots() {
      var wrapEl = $("#slotWrap");
      if (!wrapEl) return;
      if (!chosen.date) { wrapEl.innerHTML = '<p class="tiny">选择日期后显示可预约时段。</p>'; return; }
      var slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30", "20:00"];
      var seed = chosen.date.split("-").join("") % 7;
      wrapEl.innerHTML = '<div class="slot-grid">' + slots.map(function (s, i) {
        var off = (i + seed) % 4 === 0;
        return '<button type="button" class="slot' + (off ? " is-off" : "") + (chosen.slot === s ? " is-active" : "") + '"' +
          (off ? " disabled" : "") + ' data-slot="' + s + '">' + s + "</button>";
      }).join("") + '</div><a class="btn btn-block mt-2" id="calContinue" href="#">继续预约</a>';
      $$(".slot:not(.is-off)", wrapEl).forEach(function (b) {
        b.addEventListener("click", function () {
          chosen.slot = b.dataset.slot;
          $$(".slot", wrapEl).forEach(function (x) { x.classList.remove("is-active"); });
          b.classList.add("is-active");
          updateContinue();
        });
      });
      updateContinue();
    }

    function updateContinue() {
      var go = $("#calContinue");
      if (!go) return;
      if (chosen.date && chosen.slot) {
        go.classList.remove("disabled");
        go.style.opacity = "";
        go.href = "booking.html?artist=" + (artistSel ? artistSel.value : "a1") + "&date=" + chosen.date + "&slot=" + chosen.slot;
      } else {
        go.style.opacity = ".45";
        go.href = "#";
        go.onclick = function (e) { e.preventDefault(); toast("请先选择日期与时段"); };
      }
    }

    var prev = $("#calPrev"), next = $("#calNext");
    if (prev) prev.addEventListener("click", function () {
      var t = new Date(); t.setDate(1);
      var min = new Date(t.getFullYear(), t.getMonth(), 1);
      if (cursor > min) { cursor.setMonth(cursor.getMonth() - 1); render(); }
      else toast("已回到本月");
    });
    if (next) next.addEventListener("click", function () {
      cursor.setMonth(cursor.getMonth() + 1); render();
    });
    if (calGrid) { render(); renderSlots(); }
  }

  /* ---- 09 booking ---- */
  if (page === "booking") {
    var artistOpts = $("#bkArtist");
    var pkgOpts = $("#bkPackage");
    if (artistOpts) {
      artistOpts.innerHTML = MD.artists.map(function (x) {
        return '<option value="' + x.id + '" data-price="' + x.price + '">' + (x.cn || x.name) + " · " + x.areaCn + " · " + money(x.price) + " 起</option>";
      }).join("");
    }
    if (pkgOpts) {
      pkgOpts.innerHTML = MD.packages.map(function (p) {
        return '<option value="' + p.id + '" data-price="' + p.price + '">' + p.name + " " + p.cn + " · " + money(p.price) + "</option>";
      }).join("");
    }

    var f = { artist: $("#bkArtist"), pkg: $("#bkPackage"), date: $("#bkDate"), slot: $("#bkSlot"), style: $("#bkStyle") };
    if (f.artist && param("artist")) f.artist.value = param("artist");
    if (f.pkg && param("pkg")) f.pkg.value = param("pkg");
    if (f.date) {
      var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
      f.date.min = t.toISOString().slice(0, 10);
      if (param("date")) f.date.value = param("date");
    }
    if (f.slot && param("slot")) f.slot.value = param("slot");
    if (f.slot) {
      f.slot.innerHTML = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30", "20:00"].map(function (s) {
        return '<option value="' + s + '">' + s + "</option>";
      }).join("") + '<option value="flex">弹性 / Flexible</option>';
      if (param("slot")) f.slot.value = param("slot");
    }

    function serviceFee(v) { return v === "onsite" ? 150 : v === "follow" ? 200 : 0; }

    function summary() {
      var a = byId(MD.artists, f.artist ? f.artist.value : "");
      var p = byId(MD.packages, f.pkg ? f.pkg.value : "");
      var svc = ($('input[name="service"]:checked') || {}).value || "studio";
      var base = p ? p.price : 0;
      var extra = serviceFee(svc);
      var total = base + extra;
      var setT = function (id, v) { var el = $(id); if (el) el.textContent = v; };
      setT("#sumArtist", a ? a.name + " · " + a.areaCn : "—");
      setT("#sumPkg", p ? p.name + " " + p.cn : "—");
      setT("#sumDate", f.date && f.date.value ? f.date.value : "未选择");
      setT("#sumSlot", f.slot ? f.slot.value : "—");
      setT("#sumService", svc === "studio" ? "工作室" : svc === "onsite" ? "上门（+¥80）" : "跟妆（+¥120/小时）");
      setT("#sumBase", money(base));
      setT("#sumExtra", extra ? "+" + money(extra) : "—");
      setT("#sumTotal", money(total));
      var hidden = $("#bkTotal");
      if (hidden) hidden.value = total;
      return { a: a, p: p, svc: svc, base: base, extra: extra, total: total };
    }

    [f.artist, f.pkg, f.date, f.slot].forEach(function (el) {
      if (el) el.addEventListener("change", summary);
    });
    $$('input[name="service"]').forEach(function (r) { r.addEventListener("change", summary); });
    summary();

    var form = $("#bookingForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var s = summary();
        if (!f.date.value) { toast("请选择日期"); f.date.focus(); return; }
        var d = new Date(f.date.value + "T00:00:00");
        var id = "MD-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);
        var order = {
          id: id,
          artistId: s.a.id,
          artistName: s.a.name,
          artistImg: s.a.img,
          packageId: s.p.id,
          packageName: s.p.name + " " + s.p.cn,
          date: f.date.value,
          slot: f.slot.value,
          service: s.svc,
          style: f.style ? f.style.value : s.a.styles[0],
          total: s.total,
          name: $("#bkName").value,
          email: $("#bkEmail").value,
          notes: $("#bkNotes").value,
          status: "Pending",
          createdAt: new Date().toISOString()
        };
        var orders = store.get("orders", []);
        orders.unshift(order);
        store.set("orders", orders);
        store.set("lastOrder", id);
        location.href = "confirmation.html?id=" + id;
      });
    }
  }

  /* ---- 10 confirmation ---- */
  if (page === "confirmation") {
    var orders = store.get("orders", []);
    var wanted = param("id") || store.get("lastOrder", null);
    var order = null;
    for (var i = 0; i < orders.length; i++) { if (orders[i].id === wanted) order = orders[i]; }
    if (!order) {
      order = {
        id: "MD-DEMO-2401", artistId: "a1", artistName: "Luna Chan", artistImg: "artist-1.jpg",
        packageName: "Theme Look 主题妆", date: "2026-11-28", slot: "14:00", service: "studio",
        style: "korean", total: 780, name: "Demo Guest", email: "demo@makeupdate.demo",
        notes: "毕业照拍摄，想要干净一点的妆感。", status: "Pending", createdAt: new Date().toISOString()
      };
    }
    var put = function (sel, v) { var el = $(sel); if (el) el.innerHTML = v; };
    put("#cfNo", order.id);
    put("#cfArtist", order.artistName);
    put("#cfPkg", order.packageName);
    put("#cfDate", order.date + " · " + order.slot);
    put("#cfService", order.service === "studio" ? "工作室" : order.service === "onsite" ? "上门" : "跟妆");
    put("#cfTotal", money(order.total));
    put("#cfName", order.name);
    put("#cfEmail", order.email);
    put("#cfNotes", order.notes || "—");
    var st = byId(MD.styles, order.style);
    put("#cfStyle", st ? st.cn + " " + st.name : "—");
    var av = $("#cfAvatar");
    if (av) { av.src = "assets/img/" + order.artistImg; av.alt = order.artistName; }
  }

  /* ---- 11 my bookings ---- */
  if (page === "my-bookings") {
    var wrapEl = $("#bookingList");
    var demo = [
      { id: "MD-261114-2048", artistId: "a3", artistName: "Su Wen", artistImg: "artist-3.jpg", packageName: "Full Transformation Cosplay／古风全妆造", date: "2026-11-29", slot: "10:30", total: 1180, status: "Confirmed", service: "studio" },
      { id: "MD-260921-1173", artistId: "a6", artistName: "Chloe Ho", artistImg: "artist-6.jpg", packageName: "Basic Look 基础妆", date: "2026-09-22", slot: "09:00", total: 520, status: "Completed", service: "studio" }
    ];
    var mine = store.get("orders", []);
    var all = mine.concat(demo);
    var label = { Pending: "待确认", Confirmed: "已确认", Completed: "已完成", Cancelled: "已取消" };

    function renderBookings() {
      if (!all.length) {
        wrapEl.innerHTML = '<div class="empty-state"><h3>还没有预约</h3><p>从妆娘页面选择服务与时段，就可以在这里看到所有预约纪录。</p><a class="btn" href="artists.html">Find an artist</a></div>';
        return;
      }
      wrapEl.innerHTML = all.map(function (o, idx) {
        return '<article class="booking-item"><img src="assets/img/' + o.artistImg + '" alt="' + o.artistName + '" loading="lazy">' +
          '<div class="bi-main"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">' +
          '<h3 style="margin:0"><a href="artist.html?id=' + o.artistId + '">' + o.artistName + "</a></h3>" +
          '<span class="status status--' + o.status.toLowerCase() + '"><i></i>' + label[o.status] + "</span></div>" +
          "<p>" + o.packageName + "</p>" +
          '<div class="bi-meta"><span>📅 ' + o.date + " · " + o.slot + "</span><span>#" + o.id + "</span><span>" + money(o.total) + "</span></div></div>" +
          '<div class="bi-action" style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<a class="btn btn-ghost btn-sm" href="artist.html?id=' + o.artistId + '">详情</a>' +
          (o.status === "Pending" ? '<button class="btn btn-ghost btn-sm" data-cancel="' + idx + '">取消</button>' : "") +
          "</div></article>";
      }).join("");
      $$("[data-cancel]", wrapEl).forEach(function (b) {
        b.addEventListener("click", function () {
          var i = Number(b.dataset.cancel);
          if (!confirm("确定取消这笔预约？（示范操作）")) return;
          all[i].status = "Cancelled";
          var stored = store.get("orders", []);
          stored.forEach(function (o) { if (o.id === all[i].id) o.status = "Cancelled"; });
          store.set("orders", stored);
          toast("已取消预约 " + all[i].id);
          renderBookings();
        });
      });
    }
    if (wrapEl) renderBookings();
  }

  /* ---- 12 favorites ---- */
  function renderFavorites() {
    var wrapEl = $("#favGrid");
    if (!wrapEl) return;
    var list = favs.map(function (id) { return byId(MD.artists, id); }).filter(Boolean);
    var emptyEl = $("#favEmpty");
    if (!list.length) {
      wrapEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    wrapEl.innerHTML = list.map(artistCard).join("");
  }
  if (page === "favorites") {
    renderFavorites();
    var clear = $("#clearFavs");
    if (clear) clear.addEventListener("click", function () {
      favs = []; store.set("favorites", favs); paintFavs(); renderFavorites(); toast("已清空收藏夹");
    });
  }

  /* ---- 13 community ---- */
  if (page === "community") {
    var order = ["Latest", "Most liked"];
    $$("[data-like]").forEach(function (btn) {
      var on = store.get("liked:" + btn.dataset.like, false);
      if (on) { btn.classList.add("is-on"); btn.querySelector("span").textContent = Number(btn.dataset.count) + 1; }
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var pid = btn.dataset.like;
        var isOn = btn.classList.contains("is-on");
        btn.classList.toggle("is-on", !isOn);
        btn.querySelector("span").textContent = Number(btn.dataset.count) + (isOn ? 0 : 1);
        store.set("liked:" + pid, !isOn);
        if (!isOn) toast("已点赞 · 谢谢你的喜欢");
      });
    });
    $$("[data-post]").forEach(function (card) {
      var go = function () {
        var p = null;
        MD.posts.forEach(function (x) { if (x.id === card.dataset.post) p = x; });
        if (p) openPost(p);
      };
      card.addEventListener("click", go);
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }

  /* ---- 14 reviews ---- */
  if (page === "reviews") {
    $$("[data-rv-filter]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.rvFilter;
        $$("[data-rv-filter]").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
        $$("[data-rv]").forEach(function (r) {
          r.style.display = (f === "all" || r.dataset.rv === f) ? "" : "none";
        });
      });
    });
  }

  /* ---- 15 guide: FAQ ---- */
  $$(".faq-item button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.parentElement;
      var open = item.classList.contains("is-open");
      $$(".faq-item").forEach(function (x) { x.classList.remove("is-open"); });
      item.classList.toggle("is-open", !open);
    });
  });

  /* ---- 16 join ---- */
  if (page === "join") {
    var jf = $("#joinForm");
    if (jf) {
      jf.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!jf.checkValidity()) { jf.reportValidity(); return; }
        jf.hidden = true;
        var ok = $("#joinSuccess");
        if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
        toast("申请已送出，我们会在 3 个工作天内回复");
      });
    }
  }

  /* ---- 17 dashboard: animate bars ---- */
  if (page === "dashboard") {
    var bars = $$(".dash-chart .col i");
    bars.forEach(function (b) {
      var h = b.dataset.h || "40";
      b.style.height = "0%";
      setTimeout(function () { b.style.height = h + "%"; }, 120);
    });
  }

  /* init */
  paintFavs();
})();
