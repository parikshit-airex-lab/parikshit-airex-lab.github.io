/* Twinkling night sky with an occasional shooting star.
   Draws into every <canvas class="sky">. Respects reduced motion,
   and pauses when the tab is hidden or the sky is scrolled out of view.
   Options on the canvas: data-density="0.6" (fewer stars), data-shooting="off". */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("canvas.sky").forEach(function (canvas) {
    var ctx = canvas.getContext("2d");
    var density = parseFloat(canvas.dataset.density || "1");
    var shootingOn = canvas.dataset.shooting !== "off";
    var stars = [], w = 0, h = 0, raf = null, visible = true;
    var meteor = null, nextMeteor = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round((w * h) / 2600 * density);
      stars = [];
      for (var i = 0; i < count; i++) {
        var bright = Math.random() < 0.07;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: bright ? 1.3 + Math.random() * 0.8 : 0.35 + Math.random() * 0.85,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.8,
          tint: Math.random() < 0.12
        });
      }
      if (reduce) draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = reduce ? 0.75 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.phase + t * 0.001 * s.speed));
        ctx.fillStyle = s.tint ? "#A7EDE4" : "#EEF3FC";
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.3) {
          ctx.globalAlpha = a * 0.18;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduce && shootingOn) {
        if (!meteor && t > nextMeteor) {
          meteor = {
            x: w * (0.35 + Math.random() * 0.6),
            y: h * Math.random() * 0.35,
            vx: -(6 + Math.random() * 3),
            vy: 2.2 + Math.random() * 1.6,
            life: 0
          };
        }
        if (meteor) {
          meteor.life++;
          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          var tail = 16;
          var tx = meteor.x - meteor.vx * tail, ty = meteor.y - meteor.vy * tail;
          var fade = Math.max(0, 1 - meteor.life / 70);
          var g = ctx.createLinearGradient(meteor.x, meteor.y, tx, ty);
          g.addColorStop(0, "rgba(255,255,255," + (0.95 * fade) + ")");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.globalAlpha = 1;
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          if (meteor.life > 70 || meteor.x < -80 || meteor.y > h + 80) {
            meteor = null;
            nextMeteor = t + 5000 + Math.random() * 7000;
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      raf = window.requestAnimationFrame(loop);
    }
    function start() { if (!raf && visible && !document.hidden) raf = window.requestAnimationFrame(loop); }
    function stop() { if (raf) { window.cancelAnimationFrame(raf); raf = null; } }

    resize();
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    if (reduce) return;
    nextMeteor = performance.now() + 2500;
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(canvas);
    }
    start();
  });
})();
