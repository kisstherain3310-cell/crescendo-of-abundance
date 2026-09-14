(function bootstrapTomatoes() {
  if (typeof window === "undefined" || window.__TOMATO_BOOT__) return;

  var PALETTE = [
    ["#ffd7c4", "#ff8a72", "#e23a2b", "#8a1210", "#2f6b28"],
    ["#ffe1d0", "#ff7a63", "#d61f1a", "#7a0d12", "#245c22"],
    ["#ffcfd6", "#ff6f7a", "#c81d3b", "#6d1024", "#1f5a2b"],
    ["#ffe4c8", "#ffb07a", "#f26b2b", "#9a3412", "#3b6d27"],
    ["#fff1c9", "#ffd27a", "#f0a202", "#a15c00", "#3a7224"],
    ["#fff8d6", "#fff0a8", "#f5c518", "#b45309", "#2f6a22"],
    ["#ffd6cc", "#ff9d8a", "#ef4444", "#9f1239", "#276749"],
  ];

  var RECIPES = [
    {
      title: "과잉 파스타",
      subtitle: "터지는 방울토마토 오일 스파게티 · 18분 · 2인분",
      body: "가격이 무너진 날엔 소스보다 과육이 주인공입니다. 방울토마토를 한꺼번에 넣고 껍질이 갈라질 때까지 볶은 뒤 면과 섞습니다.",
    },
    {
      title: "서리 카프레제",
      subtitle: "차가운 과잉을 한입에 · 10분 · 4인분",
      body: "산지 출하가 정점을 찍은 날은 가열보다 생식이 정답입니다. 토마토를 반으로 갈라 치즈 위에 무너뜨리듯 올립니다.",
    },
    {
      title: "폭락 잼",
      subtitle: "남는 단맛을 병에 가둡니다 · 45분",
      body: "시세가 바닥일 때 저장은 소비의 연장입니다. 토마토를 설탕과 재운 뒤 중불에서 끓여 병에 담습니다.",
    },
    {
      title: "대지의 콩피",
      subtitle: "느린 불에 맡긴 방울토마토 · 40분 · 3~4인분",
      body: "물량이 중력처럼 내려앉는 날, 천천히 익히면 단맛이 남습니다. 오일·허브·마늘과 함께 140°C에 굽습니다.",
    },
  ];

  var tomatoes = [];
  var width = 390;
  var height = 640;
  var frame = 0;
  var concealed = false;
  var canvas;
  var ctx;

  function count() {
    var el = document.querySelector("[data-body-count]");
    var n = el ? parseInt(el.getAttribute("data-body-count") || "0", 10) : 0;
    if (!n || n < 18) n = 48;
    return Math.min(Math.max(n, 18), 110);
  }

  function size() {
    width = Math.max(window.innerWidth || 0, 390);
    height = Math.max(window.innerHeight || 0, 640);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    tomatoes.length = 0;
    var n = count();
    for (var i = 0; i < n; i += 1) {
      var r = 18 + (i % 5) * 2.4;
      tomatoes.push({
        x: r + 16 + Math.random() * Math.max(width - r * 2 - 32, 40),
        y: 80 + Math.random() * Math.max(height - 180, 160),
        vx: (Math.random() - 0.5) * 4.5,
        vy: -2 - Math.random() * 5,
        r: r,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.18,
        swatch: i % PALETTE.length,
      });
    }
    canvas.dataset.tomatoCount = String(tomatoes.length);
    canvas.dataset.physicsReady = tomatoes.length ? "1" : "0";
  }

  function drawTomato(t) {
    var sw = PALETTE[t.swatch];
    var radius = Math.max(t.r, 12);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.beginPath();
    ctx.ellipse(4, radius * 0.22, radius * 0.98, radius * 0.86, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(40, 0, 8, 0.35)";
    ctx.fill();
    var pulp = ctx.createRadialGradient(
      -radius * 0.28,
      -radius * 0.32,
      radius * 0.12,
      0,
      0,
      radius,
    );
    pulp.addColorStop(0, sw[0]);
    pulp.addColorStop(0.18, sw[1]);
    pulp.addColorStop(0.55, sw[2]);
    pulp.addColorStop(1, sw[3]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = pulp;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-radius * 0.28, -radius * 0.34, radius * 0.32, radius * 0.2, -0.45, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fill();
    ctx.translate(0, -radius * 0.82);
    ctx.fillStyle = sw[4];
    for (var i = 0; i < 5; i += 1) {
      ctx.save();
      ctx.rotate((i / 5) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(radius * 0.09, -radius * 0.05, 0, -radius * 0.28);
      ctx.quadraticCurveTo(-radius * 0.09, -radius * 0.05, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#1f4d1c";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paint() {
    var sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#5a2428");
    sky.addColorStop(0.45, "#7a3030");
    sky.addColorStop(1, "#3a1518");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    for (var i = 0; i < tomatoes.length; i += 1) drawTomato(tomatoes[i]);
  }

  function step() {
    for (var i = 0; i < tomatoes.length; i += 1) {
      var t = tomatoes[i];
      t.vy += 0.18;
      t.x += t.vx;
      t.y += t.vy;
      t.angle += t.spin;
      if (t.x < t.r) {
        t.x = t.r;
        t.vx = Math.abs(t.vx) * 0.7;
      } else if (t.x > width - t.r) {
        t.x = width - t.r;
        t.vx = -Math.abs(t.vx) * 0.7;
      }
      if (t.y > height - t.r) {
        t.y = height - t.r;
        t.vy = -Math.abs(t.vy) * 0.45;
        t.vx *= 0.98;
      } else if (t.y < t.r) {
        t.y = t.r;
        t.vy = Math.abs(t.vy);
      }
    }
  }

  function tick() {
    if (!concealed) {
      step();
      paint();
    }
    frame = window.requestAnimationFrame(tick);
  }

  function recipeFor(seed) {
    return RECIPES[Math.abs(Math.floor(seed)) % RECIPES.length];
  }

  function showRecipe(seed) {
    try {
      window.dispatchEvent(new CustomEvent("open-recipe", { detail: { seed: seed } }));
    } catch (e) {}
    window.setTimeout(function () {
      if (document.querySelector("[data-recipe-modal]")) return;
      var recipe = recipeFor(seed);
      var existing = document.getElementById("recipe-boot-modal");
      if (existing) existing.remove();
      var wrap = document.createElement("div");
      wrap.id = "recipe-boot-modal";
      wrap.setAttribute("data-recipe-modal", "1");
      wrap.setAttribute("data-frost-ui", "");
      wrap.setAttribute("role", "dialog");
      wrap.style.cssText =
        "position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:12px;";
      wrap.innerHTML =
        '<div style="position:absolute;inset:0;background:rgba(0,0,0,.7)" data-recipe-backdrop="1"></div>' +
        '<div style="position:relative;z-index:1;max-width:34rem;width:min(92vw,34rem);max-height:88dvh;overflow:auto;border-radius:1rem;border:1px solid rgba(255,200,200,.2);background:#2a1216;color:#fff5f2;padding:1.5rem">' +
        '<button type="button" data-recipe-close="1" aria-label="닫기" style="position:absolute;right:1rem;top:1rem;background:none;border:0;color:#fff;font-size:1.2rem;cursor:pointer">×</button>' +
        '<p style="font-size:.7rem;letter-spacing:.32em;text-transform:uppercase;opacity:.7">과잉 레시피</p>' +
        "<h2 style=\"font-size:1.5rem;margin:.5rem 0 .25rem\">" +
        recipe.title +
        "</h2>" +
        '<p style="opacity:.8;font-size:.9rem">' +
        recipe.subtitle +
        "</p>" +
        '<p style="margin-top:1rem;line-height:1.5">' +
        recipe.body +
        "</p></div>";
      (document.body || document.documentElement).appendChild(wrap);
      wrap.addEventListener("click", function (event) {
        var t = event.target;
        if (!t || !t.closest) return;
        if (t.closest("[data-recipe-close]") || t.closest("[data-recipe-backdrop]")) {
          wrap.remove();
        }
      });
    }, 80);
  }

  function tapAt(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var hit = null;
    var best = Infinity;
    for (var i = 0; i < tomatoes.length; i += 1) {
      var t = tomatoes[i];
      var d = Math.hypot(t.x - x, t.y - y);
      if (d < t.r + 36 && d < best) {
        best = d;
        hit = t;
      }
    }
    if (!hit) return false;
    showRecipe(hit.swatch * 13 + Math.round(hit.x + hit.y));
    hit.vy -= 4;
    hit.vx += (Math.random() - 0.5) * 3;
    return true;
  }

  function isChrome(target) {
    return Boolean(
      target &&
        target.closest &&
        target.closest(
          "button, a, input, textarea, select, label, [data-frost-ui], [data-frost-chrome], [role='dialog']",
        ),
    );
  }

  function mount() {
    canvas = document.getElementById("tomato-boot-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "tomato-boot-canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;";
      document.documentElement.insertBefore(canvas, document.body);
    }
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    size();
    spawn();
    paint();
    tick();
    window.addEventListener("resize", function () {
      size();
    });
    document.addEventListener(
      "click",
      function (event) {
        var t = event.target;
        if (t && t.closest && t.closest("#open-recipe-cta")) {
          event.preventDefault();
          showRecipe(3);
        }
      },
      true,
    );
    document.addEventListener("pointerup", function (event) {
      if (concealed) return;
      if (isChrome(event.target)) return;
      tapAt(event.clientX, event.clientY);
    });
    window.__TOMATO_BOOT__ = {
      canvas: canvas,
      ready: true,
      count: tomatoes.length,
      tapAt: tapAt,
      conceal: function () {
        concealed = true;
        canvas.style.visibility = "hidden";
      },
      reveal: function () {
        concealed = false;
        canvas.style.visibility = "visible";
      },
    };
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
