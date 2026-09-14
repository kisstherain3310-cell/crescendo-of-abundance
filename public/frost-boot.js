(function bootstrapFrost() {
  if (typeof window === "undefined" || window.__FROST_BOOT__) return;

  var BRUSH = 56;

  function isChrome(target) {
    var el = target && target.nodeType === 3 ? target.parentElement : target;
    if (!el || !el.closest) return false;
    return Boolean(
      el.closest(
        "button, a, input, textarea, select, label, [data-frost-ui], [data-frost-chrome], [role='dialog']",
      ),
    );
  }

  function sizeCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = window.innerWidth;
    var height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    return { width: width, height: height, dpr: dpr };
  }

  function makeNoise() {
    var noise = document.createElement("canvas");
    noise.width = 128;
    noise.height = 128;
    var nctx = noise.getContext("2d");
    if (!nctx) return noise;
    var image = nctx.createImageData(128, 128);
    for (var i = 0; i < image.data.length; i += 4) {
      var v = 210 + Math.random() * 40;
      image.data[i] = v;
      image.data[i + 1] = v + 10;
      image.data[i + 2] = v + 18;
      image.data[i + 3] = 50 + Math.random() * 40;
    }
    nctx.putImageData(image, 0, 0);
    return noise;
  }

  function fillFrost(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var metrics = sizeCanvas(canvas);
    ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    var gradient = ctx.createLinearGradient(0, 0, metrics.width, metrics.height);
    gradient.addColorStop(0, "rgba(236, 246, 255, 0.4)");
    gradient.addColorStop(0.45, "rgba(214, 232, 245, 0.44)");
    gradient.addColorStop(1, "rgba(198, 220, 236, 0.48)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = ctx.createPattern(makeNoise(), "repeat") || gradient;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    ctx.globalAlpha = 1;
    canvas.dataset.frostFilled = "1";
  }

  function stamp(ctx, x, y) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    var gradient = ctx.createRadialGradient(x, y, BRUSH * 0.12, x, y, BRUSH);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.85)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function hideUi() {
    var ui = document.getElementById("frost-boot-ui");
    if (ui) ui.remove();
  }

  function announceCleared() {
    try {
      window.dispatchEvent(new CustomEvent("frost-skip"));
      window.dispatchEvent(new CustomEvent("frost:cleared"));
    } catch (e) {}
  }

  function skip() {
    var boot = window.__FROST_BOOT__;
    var canvas =
      (boot && boot.canvas) || document.getElementById("frost-boot-canvas");
    if (canvas) {
      var ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      canvas.style.pointerEvents = "none";
    }
    if (boot) {
      boot.cleared = true;
      boot.canvas = undefined;
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    hideUi();
    announceCleared();
  }

  function mountUi() {
    if (document.getElementById("frost-boot-ui")) return;
    var ui = document.createElement("div");
    ui.id = "frost-boot-ui";
    ui.setAttribute("data-frost-ui", "");
    ui.innerHTML =
      '<div class="frost-boot-card">' +
      '<p class="frost-boot-title">화면을 문질러 서리를 걷어내세요</p>' +
      '<p class="frost-boot-sub">Esc / Enter / Space 또는 건너뛰기로 바로 볼 수 있습니다</p>' +
      '<button type="button" id="frost-boot-skip" data-frost-chrome>서리 걷어내기</button>' +
      "</div>";
    (document.body || document.documentElement).appendChild(ui);
    var button = document.getElementById("frost-boot-skip");
    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        skip();
      });
      button.addEventListener("keydown", function (event) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          skip();
        }
      });
    }
  }

  function bindWipe(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var pointerId = null;
    var lastX = 0;
    var lastY = 0;

    function localPoint(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    document.addEventListener("pointerdown", function (event) {
      if (!window.__FROST_BOOT__ || window.__FROST_BOOT__.cleared) return;
      if (isChrome(event.target)) return;
      pointerId = event.pointerId;
      var point = localPoint(event);
      lastX = point.x;
      lastY = point.y;
      stamp(ctx, point.x, point.y);
    });

    document.addEventListener("pointermove", function (event) {
      if (pointerId !== event.pointerId) return;
      var point = localPoint(event);
      var dx = point.x - lastX;
      var dy = point.y - lastY;
      var dist = Math.hypot(dx, dy);
      if (dist > 3) {
        var steps = Math.ceil(dist / 8);
        for (var i = 1; i <= steps; i += 1) {
          var t = i / steps;
          stamp(ctx, lastX + dx * t, lastY + dy * t);
        }
      }
      lastX = point.x;
      lastY = point.y;
    });

    document.addEventListener("pointerup", function () {
      pointerId = null;
    });
    document.addEventListener("pointercancel", function () {
      pointerId = null;
    });
  }

  function mount() {
    var canvas = document.getElementById("frost-boot-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "frost-boot-canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;z-index:10;pointer-events:none;touch-action:none;display:block;";
      (document.body || document.documentElement).appendChild(canvas);
    }
    canvas.style.pointerEvents = "none";
    fillFrost(canvas);
    bindWipe(canvas);
    mountUi();
    window.__FROST_BOOT__ = {
      canvas: canvas,
      filled: true,
      cleared: false,
      skip: skip,
    };

    function isTyping(node) {
      var el = node && node.nodeType === 3 ? node.parentElement : node;
      if (!el || !el.closest) return false;
      return Boolean(el.closest("input, textarea, select, [contenteditable='true']"));
    }

    function onSkipKey(event) {
      if (window.__FROST_BOOT__ && window.__FROST_BOOT__.cleared) return;
      if (isTyping(event.target) || isTyping(document.activeElement)) return;
      if (
        event.key === "Escape" ||
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Spacebar" ||
        event.code === "Space"
      ) {
        event.preventDefault();
        skip();
      }
    }

    // Capture on both document and window so Enter/Space clear frost
    // even when a chrome button is focused (skip is not required).
    document.addEventListener("keydown", onSkipKey, true);
    window.addEventListener("keydown", onSkipKey, true);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
