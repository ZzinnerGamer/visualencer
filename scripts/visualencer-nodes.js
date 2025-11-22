import {VisualencerNodeTypes} from "./visualencer.js";

const VHelpers = {
  num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  },
  esc(s) {
    return String(s ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }
};

if (typeof VisualencerNodeTypes === "undefined") {
  console.error(
    "Visualencer | VisualencerNodeTypes no está definido. " +
      "Asegúrate de cargar scripts/visualencer.js antes de este archivo."
  );
}

function buildEaseDelayOpts(ease, delay) {
  const parts = [];
  if (ease && String(ease).trim()) {
    parts.push(`ease: "${VHelpers.esc(ease)}"`);
  }
  const d = Number(delay);
  if (Number.isFinite(d) && d !== 0) parts.push(`delay: ${d}`);
  if (!parts.length) return "";
  return `{ ${parts.join(", ")} }`;
}


/* =========================
 * Nodos de flujo / utilidades
 * ======================= */

/** Nodo de inicio, no genera código, solo ancla el grafo */
VisualencerNodeTypes.register("start", {
  label: "Start / Sequence",
  category: "flow",
  role: "utility",
  createConfig() {
    return { label: "Inicio de secuencia" };
  },
  compile(_node, _ctx) {
  }
});

/** Nodo Play tampoco genera código */
VisualencerNodeTypes.register("play", {
  label: "Play",
  category: "flow",
  role: "utility",
  createConfig() {
    return {};
  },
  compile(_node, _ctx) {
  }
});



/* =========================
 * Effect (padre)
 * ======================= */

VisualencerNodeTypes.register("effect", {
  label: "Effect",
  category: "sequencer",
  role: "root",
  family: "effect",


  compileRoot(node, block, _ctx) {
    const c = node.config || {};
    const esc = VHelpers;
    const lines = block.lines;

    if (!c.file || !c.file.trim()) return;

    lines.push("seq.effect()");

    if (c.baseFolder && c.baseFolder.trim()) {
      lines.push(`  .baseFolder("${esc(c.baseFolder)}")`);
    }

    lines.push(`  .file("${esc(c.file.trim())}")`);

  }
});

/* =========================
 * Sound (padre)
 * ======================= */

VisualencerNodeTypes.register("sound", {
  label: "Sound",
  category: "sequencer",
  role: "root",
  family: "sound",
  createConfig() {
    return {
      file: "",
      waitUntilFinished: false,
      locally: false
    };
  },
  compileRoot(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    const lines = block.lines;

    if (!c.file || !c.file.trim()) return;

    lines.push("seq.sound()");
    lines.push(`  .file("${esc(c.file.trim())}")`);

    if (c.locally) {
      lines.push("  .locally(true)");
    }

    if (c.waitUntilFinished) {
      lines.push("  .waitUntilFinished()");
    }
  }
});

/* =========================
 * Animation (padre)
 * ======================= */

VisualencerNodeTypes.register("animation", {
  label: "Animation",
  category: "sequencer",
  role: "root",
  family: "animation",


  compileRoot(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    const lines = block.lines;

    lines.push("seq.animation()");

    if (c.preset && c.preset.trim()) {
      const preset = c.preset.replace(/"/g, '\\"');
      lines.push(`  .preset("${preset}")`);
    }

  }
});

/* =========================
 * Scrolling Text (padre)
 * ======================= */

VisualencerNodeTypes.register("scrollingText", {
  label: "ScrollingText",
  category: "sequencer",
  role: "root",
  family: "scrollingText",
  createConfig() {
    return {
      text: "Texto",
      at: "selected-token",
      durationMs: 1000
    };
  },
  compileRoot(node, block, _ctx) {
    const c = node.config || {};
    const lines = block.lines;

    lines.push("seq.scrollingText()");

    if (c.at === "selected-token") {
      lines.push("  .atLocation(canvas.tokens.controlled[0])");
    }

    const text = (c.text || "").replace(/`/g, "\\`");
    lines.push(`  .text(\`${text}\`)`);

    if (c.durationMs && Number(c.durationMs) > 0) {
      lines.push(`  .duration(${Number(c.durationMs)})`);
    }
  }
});

/* =========================
 * Canvas Pan (padre)
 * ======================= */

VisualencerNodeTypes.register("canvasPan", {
  label: "CanvasPan",
  category: "sequencer",
  role: "root",
  family: "canvasPan",
  createConfig() {
    return {
      at: "selected-token",
      durationMs: 1000,
      scale: 1.0,
      lockViewMs: 0
    };
  },
  compileRoot(node, block, _ctx) {
    const c = node.config || {};
    const lines = block.lines;

    lines.push("seq.canvasPan()");

    if (c.at === "selected-token") {
      lines.push("  .atLocation(canvas.tokens.controlled[0])");
    }

    if (c.durationMs && Number(c.durationMs) > 0) {
      lines.push(`  .duration(${Number(c.durationMs)})`);
    }

    if (c.scale && Number(c.scale) !== 1) {
      lines.push(`  .scale(${Number(c.scale)})`);
    }

    if (c.lockViewMs && Number(c.lockViewMs) > 0) {
      lines.push(`  .lockView(${Number(c.lockViewMs)})`);
    }
  }
});

/* =========================
 * Crosshair
 * ======================= */

VisualencerNodeTypes.register("crosshair", {
  label: "Crosshair",
  category: "sequencer",
  role: "root",
  family: "crosshair",
  createConfig() {
    return {
      name: "target",
      file: ""
    };
  },
  compileRoot(node, block, _ctx) {
    const c = node.config || {};
    const { esc } = VHelpers;
    const lines = block.lines;

    const name = (c.name || "target").replace(/"/g, '\\"');
    const file = c.file && c.file.trim() ? esc(c.file.trim()) : null;

    if (name) lines.push(`seq.crosshair("${name}")`);
    else lines.push("seq.crosshair()");

    if (file) {
      lines.push(`  .texture("${file}")`);
    }
  }
});

/* =========================
 * Nodos Hijo
 * ======================= */

VisualencerNodeTypes.register("atLocation", {
  label: "At Location",
  category: "common",
  role: "child",
  families: ["effect", "animation", "sound"],
  createConfig() {
    return {
      mode: "selected-token", // selected-token | selected-target | token-id | token-name | tile-id | point
      tokenId: "",
      tokenName: "",
      tileId: "",
      x: 0,
      y: 0,
      cacheLocation: false,
      randomOffset: 0,
      offsetX: 0,
      offsetY: 0,
      local: false,
      gridUnits: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    const lines = block.lines;

    let target = null;

    switch (c.mode) {
      case "selected-token":
        target = "canvas.tokens.controlled[0]";
        break;
      case "selected-target":
        target = "Array.from(game.user.targets)[0]";
        break;
      case "token-id":
        if (c.tokenId?.trim()) {
          target = `canvas.tokens.get("${esc(c.tokenId)}")`;
        }
        break;
      case "token-name":
        if (c.tokenName?.trim()) {
          target = `canvas.tokens.placeables.find(t => t.name === "${esc(c.tokenName)}")`;
        }
        break;
      case "tile-id":
        if (c.tileId?.trim()) {
          target = `canvas.tiles.get("${esc(c.tileId)}")`;
        }
        break;
      case "point": {
        const x = num(c.x);
        const y = num(c.y);
        target = `{ x: ${x}, y: ${y} }`;
        break;
      }
    }

    if (!target) return;

    const opts = [];

    if (c.cacheLocation) opts.push("cacheLocation: true");

    const ro = num(c.randomOffset);
    if (ro) opts.push(`randomOffset: ${ro}`);

    if (num(c.offsetX) || num(c.offsetY)) {
      opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    }

    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");

    if (opts.length) {
      lines.push(`  .atLocation(${target}, { ${opts.join(", ")} })`);
    } else {
      lines.push(`  .atLocation(${target})`);
    }
  }
});


VisualencerNodeTypes.register("waitUntilFinished", {
    label: "Wait Until Finished",
    category: "common",
    role: "child",
    families: ["animation", "effect", "sound", "scrollingText", "canvasPan"],
    createConfig(){
        return {
            waitUntilFinished: true
        };
    },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const lines = block.lines;

    lines.push(`  .waitUntilFinished()`);
  }
});

VisualencerNodeTypes.register("async", {
    label: "Async",
    category: "common",
    role: "child",
    families: ["animation", "effect", "sound", "scrollingText", "canvasPan"],
    createConfig(){
        return {
            async: true
        };
    },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const lines = block.lines;

    lines.push(`  .async()`);
  }
});

VisualencerNodeTypes.register("repeats", {
  label: "Repeats",
  category: "flow",
  role: "child",
  families: ["effect", "animation", "sound", "scrollingText"],
  createConfig() {
    return {
      repeats: 1,
      repeatDelayMin: 0,
      repeatDelayMax: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};    
    const { num } = VHelpers;
    const lines = block.lines;

    if (num(c.repeats) > 1) {
      const min = num(c.repeatDelayMin);
      const max = num(c.repeatDelayMax);
      if (max && max > min) {
        lines.push(`  .repeats(${num(c.repeats)}, ${min}, ${max})`);
      } else if (min) {
        lines.push(`  .repeats(${num(c.repeats)}, ${min})`);
      } else {
        lines.push(`  .repeats(${num(c.repeats)})`);
      }
    }
  }
});

VisualencerNodeTypes.register("playIf", {
  label: "Play If",
  category: "flow",
  role: "child",
  families: ["effect", "animation", "sound", "scrollingText", "canvasPan"],
  createConfig() {
    return {
      mode: "always",
      bool: true,
      chance: 0.5
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const mode = c.mode || "always";

    if (mode === "boolean") {
      const b = !!c.bool;
      block.lines.push(`  .playIf(${b})`);
      return;
    }

    if (mode === "chance") {
      const ch = Number(c.chance);
      if (Number.isFinite(ch) && ch > 0 && ch < 1) {
        block.lines.push(`  .playIf(() => Math.random() < ${ch})`);
      }
      return;
    }
  }
});

VisualencerNodeTypes.register("delay", {
    label: "Delay",
    category: "common",
    role: "child",
    families: ["animation", "effect", "sound", "scrollingText", "canvasPan"],
    createConfig(){
        return {
            delayMin: 0,
            delayMax: 0
        };
    },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    const lines = block.lines;

    if (num(c.delayMax) > 0) {
      lines.push(`  .delay(${num(c.delayMin)} , ${num(c.delayMax)})`);
    } else {
      lines.push(`  .delay(${num(c.delayMin)})`);        
    }
  }
});

VisualencerNodeTypes.register("opacity", {
  label: "Opacity",
  category: "visual",
  role: "child",
  families: ["animation", "effect"],
  createConfig() {
    return {
      opacity: 1
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.opacity === null || c.opacity === "" || c.opacity === undefined) return;

    const o = Number(c.opacity);
    if (!Number.isFinite(o)) return;

    block.lines.push(`  .opacity(${o})`);
  }
});

VisualencerNodeTypes.register("fade", {
  label: "Fade (Visual)",
  category: "common",
  role: "child",
  families: ["effect", "animation"],
  createConfig() {
    return {
      fadeInDuration: 0,
      fadeInEase: "",
      fadeInDelay: 0,
      fadeOutDuration: 0,
      fadeOutEase: "",
      fadeOutDelay: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    const lines = block.lines;

    if (num(c.fadeInDuration) > 0) {
      const dur = num(c.fadeInDuration);
      const opts = buildEaseDelayOpts(c.fadeInEase, c.fadeInDelay);
      if (opts) lines.push(`  .fadeIn(${dur}, ${opts})`);
      else lines.push(`  .fadeIn(${dur})`);
    }

    if (num(c.fadeOutDuration) > 0) {
      const dur = num(c.fadeOutDuration);
      const opts = buildEaseDelayOpts(c.fadeOutEase, c.fadeOutDelay);
      if (opts) lines.push(`  .fadeOut(${dur}, ${opts})`);
      else lines.push(`  .fadeOut(${dur})`);
    }
  }
});

VisualencerNodeTypes.register("duration", {
  label: "Duration",
  category: "common",
  role: "child",
  families: ["animation","effect","sound","scrollingText","canvasPan"],
  createConfig() {
    return {
      duration: 500
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.duration === null || c.duration === "" || c.duration === undefined) return;

    const d = Number(c.duration);
    if (!Number.isFinite(d)) return;

    block.lines.push(`  .duration(${d})`);
  }
});

VisualencerNodeTypes.register("volume", {
  label: "Volume",
  category: "common",
  role: "child",
  families: ["sound"],
  createConfig() {
    return {
      volume: 0.8
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.volume === null || c.volume === "" || c.volume === undefined) return;

    const v = Number(c.volume);
    if (!Number.isFinite(v)) return;

    block.lines.push(`  .volume(${v})`);
  }
});

VisualencerNodeTypes.register("fadeAudio", {
  label: "Fade (Audio)",
  category: "common",
  role: "child",
  families: ["effect", "sound", "animation"],
  createConfig() {
    return {
      fadeInDuration: 0,
      fadeInEase: "",
      fadeInDelay: 0,
      fadeOutDuration: 0,
      fadeOutEase: "",
      fadeOutDelay: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    const lines = block.lines;

    if (num(c.fadeInDuration) > 0) {
      const dur = num(c.fadeInDuration);
      const opts = buildEaseDelayOpts(c.fadeInEase, c.fadeInDelay);
      if (opts) lines.push(`  .fadeInAudio(${dur}, ${opts})`);
      else lines.push(`  .fadeInAudio(${dur})`);
    }

    if (num(c.fadeOutDuration) > 0) {
      const dur = num(c.fadeOutDuration);
      const opts = buildEaseDelayOpts(c.fadeOutEase, c.fadeOutDelay);
      if (opts) lines.push(`  .fadeOutAudio(${dur}, ${opts})`);
      else lines.push(`  .fadeOutAudio(${dur})`);
    }
  }
});

VisualencerNodeTypes.register("on", {
  label: "On (Target)",
  category: "animation",
  role: "child",
  families: ["animation", "effect"],
  createConfig() {
    return {
      mode: "inToken", // inToken | inTile | token-id | tile-id | point
      tokenId: "",
      tileId: "",
      x: 0,
      y: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const lines = block.lines;

    // === soportado por wiki ===
    if (c.mode === "inToken") {
      lines.push(`  .on(inToken)`);
      return;
    }
    if (c.mode === "inTile") {
      lines.push(`  .on(inTile)`);
      return;
    }

    if (c.mode === "token-id" && c.tokenId.trim()) {
      const id = c.tokenId.replace(/"/g, '\\"');
      lines.push(`  .on(canvas.tokens.get("${id}"))`);
      return;
    }

    if (c.mode === "tile-id" && c.tileId.trim()) {
      const id = c.tileId.replace(/"/g, '\\"');
      lines.push(`  .on(canvas.tiles.get("${id}"))`);
      return;
    }

    if (c.mode === "point") {
      const x = num(c.x);
      const y = num(c.y);
      lines.push(`  .on({ x: ${x}, y: ${y} })`);
      return;
    }

  }
});

VisualencerNodeTypes.register("moveTowards", {
  label: "Move Towards",
  category: "visual",
  role: "child",
  families: ["animation", "effect"],
  createConfig() {
    return {
      mode: "inToken",
      tokenId: "",
      tileId: "",
      x: 0,
      y: 0,
      ease: "linear",
      delay: 0,
      relativeToCenter: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    const lines = block.lines;

    let target = null;

    if (c.mode === "inToken") {
      target = "inToken";
    }
    else if (c.mode === "inTile") {
      target = "inTile";
    }

    else if (c.mode === "token-id" && c.tokenId.trim()) {
      const id = esc(c.tokenId);
      target = `canvas.tokens.get("${id}")`;
    }
    else if (c.mode === "tile-id" && c.tileId.trim()) {
      const id = esc(c.tileId);
      target = `canvas.tiles.get("${id}")`;
    }
    else if (c.mode === "point") {
      const x = num(c.x);
      const y = num(c.y);
      target = `{ x: ${x}, y: ${y} }`;
    }

    if (!target) return;

    const opts = [];

    if (c.ease && c.ease.trim() && c.mode !== "inToken") {
      opts.push(`ease: "${esc(c.ease)}"`);
    }

    const d = num(c.delay);
    if (d) opts.push(`delay: ${d}`);

    if (c.relativeToCenter) opts.push("relativeToCenter: true");

    if (opts.length)
      lines.push(`  .moveTowards(${target}, { ${opts.join(", ")} })`);
    else
      lines.push(`  .moveTowards(${target})`);
  }
});

VisualencerNodeTypes.register("moveSpeed", {
  label: "Move Speed",
  category: "visual",
  role: "child",
  families: ["animation","effect"],
  createConfig() {
    return {
      moveSpeed: 500
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.moveSpeed === null || c.moveSpeed === "" || c.moveSpeed === undefined) return;

    const m = Number(c.moveSpeed);
    if (!Number.isFinite(m)) return;

    block.lines.push(`  .moveSpeed(${m})`);
  }
});

VisualencerNodeTypes.register("rotateTowards", {
  label: "Rotate Towards",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() {
    return {
      mode: "inToken", // inToken | inTile | point | token-id | tile-id
      tokenId: "",
      tileId: "",
      x: 0,
      y: 0,
      duration: 500,
      ease: "linear",
      delay: 0,
      rotationOffset: 0,
      towardsCenter: true,
      cacheLocation: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    const lines = block.lines;

    let target = null;

    if (c.mode === "inToken") target = "inToken";
    else if (c.mode === "inTile") target = "inTile";
    else if (c.mode === "token-id") target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "tile-id") target = `canvas.tiles.get("${esc(c.tileId)}")`;
    else if (c.mode === "point") target = `{ x: ${num(c.x)}, y: ${num(c.y)} }`;

    if (!target) return;

    const opts = [];

    if (num(c.duration)) opts.push(`duration: ${num(c.duration)}`);
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    if (num(c.rotationOffset)) opts.push(`rotationOffset: ${num(c.rotationOffset)}`);
    if (!c.towardsCenter) opts.push(`towardsCenter: false`);
    if (c.cacheLocation) opts.push(`cacheLocation: true`);

    if (opts.length)
      lines.push(`  .rotateTowards(${target}, { ${opts.join(", ")} })`);
    else
      lines.push(`  .rotateTowards(${target})`);
  }
});

VisualencerNodeTypes.register("teleportTo", {
  label: "Teleport To",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() {
    return {
      mode: "inToken", // inToken | inTile | point | token-id | tile-id
      tokenId: "",
      tileId: "",
      x: 0,
      y: 0,
      delay: 0,
      relativeToCenter: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    const lines = block.lines;

    let target = null;

    if (c.mode === "inToken") target = "inToken";
    else if (c.mode === "inTile") target = "inTile";
    else if (c.mode === "token-id") target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "tile-id") target = `canvas.tiles.get("${esc(c.tileId)}")`;
    else if (c.mode === "point") target = `{ x: ${num(c.x)}, y: ${num(c.y)} }`;

    if (!target) return;

    const opts = [];

    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    if (c.relativeToCenter) opts.push(`relativeToCenter: true`);

    if (opts.length)
      lines.push(`  .teleportTo(${target}, { ${opts.join(", ")} })`);
    else
      lines.push(`  .teleportTo(${target})`);
  }
});

VisualencerNodeTypes.register("offset", {
  label: "Offset",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() {
    return {
      x: 0,
      y: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;

    block.lines.push(
      `  .offset({ x: ${num(c.x)}, y: ${num(c.y)} })`
    );
  }
});

VisualencerNodeTypes.register("closestSquare", {
  label: "Closest Square",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() { return {}; },
  compileChild(node, block, _ctx) {
    block.lines.push(`  .closestSquare()`);
  }
});

VisualencerNodeTypes.register("snapToGrid", {
  label: "Snap to Grid",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() { return {}; },
  compileChild(node, block, _ctx) {
    block.lines.push(`  .snapToGrid()`);
  }
});

VisualencerNodeTypes.register("rotate", {
  label: "Rotate",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() {
    return { rotate: 0 };
  },
  compileChild(node, block, _ctx) {
    const r = Number(node.config.rotate);
    if (Number.isFinite(r)) block.lines.push(`  .rotate(${r})`);
  }
});

VisualencerNodeTypes.register("rotateIn", {
  label: "Rotate In",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() {
    return {
      degrees: 0,
      duration: 500,
      ease: "",
      delay: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;

    const opts = [];

    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);

    if (opts.length)
      block.lines.push(`  .rotateIn(${num(c.degrees)}, ${num(c.duration)}, { ${opts.join(", ")} })`);
    else
      block.lines.push(`  .rotateIn(${num(c.degrees)}, ${num(c.duration)})`);
  }
});

VisualencerNodeTypes.register("rotateOut", {
  label: "Rotate Out",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() {
    return {
      degrees: 0,
      duration: 500,
      ease: "",
      delay: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;

    const opts = [];

    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);

    if (opts.length)
      block.lines.push(`  .rotateOut(${num(c.degrees)}, ${num(c.duration)}, { ${opts.join(", ")} })`);
    else
      block.lines.push(`  .rotateOut(${num(c.degrees)}, ${num(c.duration)})`);
  }
});

VisualencerNodeTypes.register("tint", {
  label: "Tint",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() {
    return {
      mode: "none", // none | reset | hex | decimal
      hex: "",
      dec: ""
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { esc } = VHelpers;

    if (c.mode === "reset") block.lines.push(`  .tint()`);
    else if (c.mode === "hex" && c.hex.trim()) block.lines.push(`  .tint("${esc(c.hex)}")`);
    else if (c.mode === "decimal" && c.dec.trim()) block.lines.push(`  .tint(${c.dec})`);
  }
});

VisualencerNodeTypes.register("hide", {
  label: "Hide",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() { return {}; },
  compileChild(node, block, _ctx) {
    block.lines.push(`  .hide()`);
  }
});

VisualencerNodeTypes.register("show", {
  label: "Show",
  category: "animation",
  role: "child",
  families: ["animation"],
  createConfig() { return {}; },
  compileChild(node, block, _ctx) {
    block.lines.push(`  .show()`);
  }
});




VisualencerNodeTypes.register("wait", {
  label: "Wait",
  category: "flow",
  role: "utility",
  createConfig() {
    return {
      ms: 1000
    };
  },
  compile(node, ctx) {
    const c = node.config || {};
    const ms = VHelpers.num(c.ms);
    if (ms <= 0) return;
    ctx.lines.push(`seq.wait(${ms});`);
  }
});

VisualencerNodeTypes.register("macro", {
  label: "Macro",
  category: "flow",
  role: "utility",
  createConfig() {
    return {
      macroName: "NombreDelMacro"
    };
  },
  compile(node, ctx) {
    const c = node.config || {};
    const name = (c.macroName || "Macro").replace(/"/g, '\\"');
    ctx.lines.push(`seq.macro("${name}");`);
  }
});


VisualencerNodeTypes.register("startTime", {
  label: "Start Time",
  category: "common",
  role: "child",
  families: ["effect", "sound"],
  createConfig() {
    return {
      startTime: 0,
      startTimePerc: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    const lines = block.lines;

    if (num(c.startTime) > 0) {
      lines.push(`  .startTime(${num(c.startTime)})`);
    }

    const stp = c.startTimePerc;
    if (stp !== null && stp !== "" && !Number.isNaN(Number(stp))) {
      lines.push(`  .startTimePerc(${Number(stp)})`);
    }
  }
});



