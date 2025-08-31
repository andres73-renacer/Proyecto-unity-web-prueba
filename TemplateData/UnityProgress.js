function UnityProgress(gameInstance, progress) {
  if (!gameInstance.Module) return;

  if (!gameInstance._lp) {
    const S = gameInstance._lp = {
      W: 154, H: 130,
      tile: 8,
      spread: 40,
      holdMs: 2000,
      transMs: 3000,
      startTime: null,
      phase: 'init',
      tiles: [],
      imgs: { unity: new Image(), godot: new Image() },
      offA: document.createElement('canvas'),
      offB: document.createElement('canvas'),
      lastFrame: 0,
      frameInterval: 1000 / 28 // 28 fps
    };

    if (!gameInstance.logo) {
      gameInstance.logo = document.createElement("div");
      gameInstance.logo.className = "logo " + gameInstance.Module.splashScreenStyle;
      gameInstance.logo.style.background = "#000";
      gameInstance.container.appendChild(gameInstance.logo);
    }

    const canvas = document.createElement('canvas');
    canvas.width = S.W; canvas.height = S.H;
    gameInstance.logo.appendChild(canvas);
    S.canvas = canvas;
    S.ctx = canvas.getContext('2d');

    S.offA.width = S.W; S.offA.height = S.H;
    S.offB.width = S.W; S.offB.height = S.H;

    S.imgs.unity.src = "unity_white_on_black.png";
    S.imgs.godot.src = "godot_blue_on_black.png";

    let loaded = 0;
    function onImg() {
      loaded++;
      if (loaded === 2) {
        precomputeTiles(S);
        S.startTime = performance.now();
        S.phase = 'hold';
        requestAnimationFrame(tick);
      }
    }
    S.imgs.unity.onload = onImg;
    S.imgs.godot.onload = onImg;

    function precomputeTiles(S) {
      const { W, H, tile, imgs, offA, offB } = S;
      const gA = offA.getContext('2d');
      const gB = offB.getContext('2d');
      gA.drawImage(imgs.unity, 0, 0, W, H);
      gB.drawImage(imgs.godot, 0, 0, W, H);
      const dataA = gA.getImageData(0, 0, W, H).data;
      const dataB = gB.getImageData(0, 0, W, H).data;

      const tilesA = [], tilesB = [];
      const isColored = (x, y, data, W) => {
        const idx = 4 * (y * W + x);
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        if (a < 200) return false;
        return (r + g + b) > 30;
      };

      for (let y = 0; y < H; y += tile) {
        for (let x = 0; x < W; x += tile) {
          const cx = Math.min(x + (tile >> 1), W - 1);
          const cy = Math.min(y + (tile >> 1), H - 1);
          if (isColored(cx, cy, dataA, W)) tilesA.push({ x, y });
          if (isColored(cx, cy, dataB, W)) tilesB.push({ x, y });
        }
      }

      const count = Math.max(tilesA.length, tilesB.length);
      const cx = W / 2, cy = H / 2;
      S.tiles = [];
      for (let i = 0; i < count; i++) {
        const a = tilesA[i % tilesA.length] || tilesA[tilesA.length - 1];
        const b = tilesB[i % tilesB.length] || tilesB[tilesB.length - 1];
        const vx = (a.x + tile / 2) - cx;
        const vy = (a.y + tile / 2) - cy;
        const len = Math.hypot(vx, vy) || 1;
        const dirx = vx / len, diry = vy / len;

        S.tiles.push({
          sx: a.x, sy: a.y,
          dx: b.x, dy: b.y,
          dirx, diry,
          rot0: (Math.random() - 0.5) * 0.6,
          rot1: (Math.random() - 0.5) * 1.2,
          delay: Math.random() * 150
        });
      }
    }

    const easeOutQuad = t => 1 - (1 - t) * (1 - t);
    const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick(now) {
      if (now - S.lastFrame < S.frameInterval) {
        requestAnimationFrame(tick);
        return;
      }
      S.lastFrame = now;

      const { ctx, W, H, tile, imgs, startTime, holdMs, transMs, spread } = S;
      const t = now - startTime;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      if (S.phase === 'hold') {
        ctx.drawImage(imgs.unity, 0, 0, W, H);
        if (t >= holdMs) {
          S.phase = 'trans';
          S.transStart = now;
        }
      } else if (S.phase === 'trans') {
        const tt = now - S.transStart;
        const u = Math.min(1, tt / transMs);
        const disperse = u <= 0.5 ? easeOutQuad(u / 0.5) : 1;
        const gather = u > 0.5 ? easeInOut((u - 0.5) / 0.5) : 0;

        for (let i = 0; i < S.tiles.length; i++) {
          const ttile = S.tiles[i];
          const local = Math.max(0, (tt - ttile.delay)) / (transMs - ttile.delay);
          const l = Math.min(1, local);

          const ox = ttile.sx + ttile.dirx * spread * disperse;
          const oy = ttile.sy + ttile.diry * spread * disperse;
          const mx = ox + (ttile.dx - ox) * gather;
          const my = oy + (ttile.dy - oy) * gather;
          const rot = ttile.rot0 + (ttile.rot1 - ttile.rot0) * disperse;

          // Interpolación de color: blanco (Unity) → azul (Godot)
          const colorT = l;
          const r = Math.round(lerp(255, 0, colorT));
          const g = Math.round(lerp(255, 162, colorT));
          const b = Math.round(lerp(255, 232, colorT));

          ctx.save();
          ctx.translate(mx + tile / 2, my + tile / 2);
          ctx.rotate(rot);
          ctx.drawImage(imgs.unity, ttile.sx, ttile.sy, tile, tile, -tile / 2, -tile / 2, tile, tile);
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(-tile / 2, -tile / 2, tile, tile);
          ctx.globalCompositeOperation = "source-over";
          ctx.restore();
        }

        if (u === 1) {
          ctx.drawImage(imgs.godot, 0, 0, W, H);
          S.phase = 'done';
        }
      } else if (S.phase === 'done') {
        ctx.drawImage(S.imgs.godot, 0, 0, W, H);
      }

      if (S.phase !== 'done') requestAnimationFrame(tick);
    }
  }

  if (progress === 1 && gameInstance.logo) {
    gameInstance.logo.style.transition = 'opacity 300ms ease';
    gameInstance.logo.style.opacity = '0';
    setTimeout(() => {
      gameInstance.logo.style.display = 'none';
    }, 320);
  }
}
