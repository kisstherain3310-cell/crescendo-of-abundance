(function bootstrapFrost() {
  if (typeof window === "undefined" || window.__FROST_BOOT__) return;

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
    gradient.addColorStop(0, "rgba(236, 246, 255, 0.88)");
    gradient.addColorStop(0.45, "rgba(214, 232, 245, 0.9)");
    gradient.addColorStop(1, "rgba(198, 220, 236, 0.92)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = ctx.createPattern(makeNoise(), "repeat") || gradient;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    ctx.globalAlpha = 1;
    canvas.dataset.frostFilled = "1";
  }

  function mount() {
    var canvas = document.getElementById("frost-boot-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "frost-boot-canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;z-index:30;touch-action:none;cursor:crosshair;display:block;";
      (document.body || document.documentElement).appendChild(canvas);
    }
    fillFrost(canvas);
    window.__FROST_BOOT__ = { canvas: canvas, filled: true };
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
