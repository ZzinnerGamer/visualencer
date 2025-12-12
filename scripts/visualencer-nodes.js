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
    const { esc } = VHelpers;
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
      file: ""
    };
  },
  compileRoot(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    const lines = block.lines;

    if (!c.file || !c.file.trim()) return;

    lines.push("seq.sound()");
    lines.push(`  .file("${esc(c.file.trim())}")`);
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
    const lines = block.lines;

    lines.push("seq.animation()");

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

VisualencerNodeTypes.register("direction", {
  label: "Direction",
  category: "scrollingText",
  role: "child",
  families: ["scrollingText","crosshair"],
  createConfig() {
    return { direction: "CENTER" };
  },
  compileChild(node, block, _ctx) {
    const raw = (node.config?.direction || "").toString().trim();
    if (!raw) return;
    const numVal = Number(raw);
    const dirVal = Number.isFinite(numVal) ? numVal : `"${VHelpers.esc(raw)}"`;
    block.lines.push(`  .direction(${dirVal})`);
  }
});

VisualencerNodeTypes.register("scrollingTextJitter", {
  label: "Scrolling Jitter",
  category: "scrollingText",
  role: "child",
  families: ["scrollingText"],
  createConfig() {
    return { jitter: 0 };
  },
  compileChild(node, block, _ctx) {
    const j = VHelpers.num(node.config?.jitter);
    if (!j) return;
    block.lines.push(`  .jitter(${j})`);
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

VisualencerNodeTypes.register("canvasPanLockView", {
  label: "Canvas Lock View",
  category: "canvasPan",
  role: "child",
  families: ["canvasPan"],
  createConfig() {
    return { lockMs: 0 };
  },
  compileChild(node, block, _ctx) {
    const ms = VHelpers.num(node.config?.lockMs);
    if (ms) block.lines.push(`  .lockView(${ms})`);
  }
});

VisualencerNodeTypes.register("canvasPanSpeed", {
  label: "Canvas Pan Speed",
  category: "canvasPan",
  role: "child",
  families: ["canvasPan"],
  createConfig() {
    return { speed: 0 };
  },
  compileChild(node, block, _ctx) {
    const spd = VHelpers.num(node.config?.speed);
    if (spd) block.lines.push(`  .speed(${spd})`);
  }
});

VisualencerNodeTypes.register("canvasPanShake", {
  label: "Canvas Shake",
  category: "canvasPan",
  role: "child",
  families: ["canvasPan"],
  createConfig() {
    return {
      duration: 0,
      strength: 0,
      frequency: 0,
      fadeInDuration: 0,
      fadeOutDuration: 0,
      rotation: true
    };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];

    if (num(c.duration)) opts.push(`duration: ${num(c.duration)}`);
    if (num(c.strength)) opts.push(`strength: ${num(c.strength)}`);
    if (num(c.frequency)) opts.push(`frequency: ${num(c.frequency)}`);
    if (num(c.fadeInDuration)) opts.push(`fadeInDuration: ${num(c.fadeInDuration)}`);
    if (num(c.fadeOutDuration)) opts.push(`fadeOutDuration: ${num(c.fadeOutDuration)}`);
    if (c.rotation === false) opts.push("rotation: false");

    if (!opts.length) block.lines.push("  .shake()");
    else block.lines.push(`  .shake({ ${opts.join(", ")} })`);
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
  }
});

function crosshairColor(value) {
  const raw = (value || "").toString().trim();
  if (!raw) return null;
  const numVal = Number(raw);
  return Number.isFinite(numVal) ? numVal : `"${VHelpers.esc(raw)}"`;
}

VisualencerNodeTypes.register("crosshairType", {
  label: "Crosshair Type",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { type: "" }; },
  compileChild(node, block, _ctx) {
    const type = (node.config?.type || "").trim();
    if (type) block.lines.push(`  .type("${VHelpers.esc(type)}")`);
  }
});

VisualencerNodeTypes.register("crosshairLabel", {
  label: "Crosshair Label",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() {
    return { label: "", dx: 0, dy: 0 };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const label = (c.label || "").trim();
    if (!label) return;
    const opts = [];
    if (VHelpers.num(c.dx)) opts.push(`dx: ${VHelpers.num(c.dx)}`);
    if (VHelpers.num(c.dy)) opts.push(`dy: ${VHelpers.num(c.dy)}`);
    if (!opts.length) block.lines.push(`  .label("${VHelpers.esc(label)}")`);
    else block.lines.push(`  .label("${VHelpers.esc(label)}", { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("crosshairSnapPosition", {
  label: "Crosshair Snap Position",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { snapPosition: "" }; },
  compileChild(node, block, _ctx) {
    const raw = (node.config?.snapPosition || "").toString().trim();
    if (!raw) return;
    const numVal = Number(raw);
    const snapVal = Number.isFinite(numVal) ? numVal : `"${VHelpers.esc(raw)}"`;
    block.lines.push(`  .snapPosition(${snapVal})`);
  }
});

VisualencerNodeTypes.register("crosshairDistance", {
  label: "Crosshair Distance",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() {
    return { distance: 0, min: 0, max: 0 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const dist = num(c.distance);
    if (!dist) return;
    const opts = [];
    if (num(c.min)) opts.push(`min: ${num(c.min)}`);
    if (num(c.max)) opts.push(`max: ${num(c.max)}`);
    if (!opts.length) block.lines.push(`  .distance(${dist})`);
    else block.lines.push(`  .distance(${dist}, { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("crosshairAngle", {
  label: "Crosshair Angle",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { angle: 0 }; },
  compileChild(node, block, _ctx) {
    const angle = VHelpers.num(node.config?.angle);
    if (angle) block.lines.push(`  .angle(${angle})`);
  }
});

VisualencerNodeTypes.register("crosshairWidth", {
  label: "Crosshair Width",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { width: 0 }; },
  compileChild(node, block, _ctx) {
    const width = VHelpers.num(node.config?.width);
    if (width) block.lines.push(`  .width(${width})`);
  }
});

VisualencerNodeTypes.register("crosshairSnapDirection", {
  label: "Snap Direction",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { snapDirection: 0 }; },
  compileChild(node, block, _ctx) {
    const snap = VHelpers.num(node.config?.snapDirection);
    if (snap) block.lines.push(`  .snapDirection(${snap})`);
  }
});

VisualencerNodeTypes.register("crosshairLockManualRotation", {
  label: "Lock Manual Rotation",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { lock: true }; },
  compileChild(node, block, _ctx) {
    const lock = !!node.config?.lock;
    block.lines.push(`  .lockManualRotation(${lock})`);
  }
});

VisualencerNodeTypes.register("crosshairLockDrag", {
  label: "Lock Drag",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { lock: false }; },
  compileChild(node, block, _ctx) {
    const lock = !!node.config?.lock;
    block.lines.push(`  .lockDrag(${lock})`);
  }
});

VisualencerNodeTypes.register("crosshairIcon", {
  label: "Crosshair Icon",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() {
    return { icon: "", borderVisible: false };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const icon = (c.icon || "").trim();
    if (!icon) return;
    const opts = [];
    if (c.borderVisible) opts.push("borderVisible: true");
    if (!opts.length) block.lines.push(`  .icon("${VHelpers.esc(icon)}")`);
    else block.lines.push(`  .icon("${VHelpers.esc(icon)}", { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("crosshairBorderColor", {
  label: "Border Color",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { color: "", alpha: 0.5 }; },
  compileChild(node, block, _ctx) {
    const color = crosshairColor(node.config?.color);
    if (!color) return;
    const alpha = Number(node.config?.alpha);
    if (Number.isFinite(alpha) && alpha >= 0 && alpha <= 1) {
      block.lines.push(`  .borderColor(${color}, { alpha: ${alpha} })`);
    } else {
      block.lines.push(`  .borderColor(${color})`);
    }
  }
});

VisualencerNodeTypes.register("crosshairFillColor", {
  label: "Fill Color",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { color: "", alpha: 0.25 }; },
  compileChild(node, block, _ctx) {
    const color = crosshairColor(node.config?.color);
    if (!color) return;
    const alpha = Number(node.config?.alpha);
    if (Number.isFinite(alpha) && alpha >= 0 && alpha <= 1) {
      block.lines.push(`  .fillColor(${color}, { alpha: ${alpha} })`);
    } else {
      block.lines.push(`  .fillColor(${color})`);
    }
  }
});

VisualencerNodeTypes.register("crosshairTexture", {
  label: "Crosshair Texture",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() {
    return { texture: "", alpha: 0.5, scale: 1 };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const tex = (c.texture || "").trim();
    if (!tex) return;
    const opts = [];
    const alpha = Number(c.alpha);
    if (Number.isFinite(alpha) && alpha >= 0 && alpha <= 1) opts.push(`alpha: ${alpha}`);
    const scale = Number(c.scale);
    if (Number.isFinite(scale) && scale !== 1) opts.push(`scale: ${scale}`);
    if (!opts.length) block.lines.push(`  .texture("${VHelpers.esc(tex)}")`);
    else block.lines.push(`  .texture("${VHelpers.esc(tex)}", { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("crosshairLocation", {
  label: "Crosshair Source",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() {
    return {
      mode: "selected-token",
      storedName: "",
      tokenId: "",
      tokenName: "",
      tileId: "",
      x: 0,
      y: 0,
      limitMinRange: 0,
      limitMaxRange: 0,
      showRange: false,
      lockToEdge: false,
      lockToEdgeDirection: false,
      offsetX: 0,
      offsetY: 0,
      wallBehavior: "",
      displayRangePoly: false,
      rangePolyFillColor: "",
      rangePolyLineColor: "",
      rangePolyFillAlpha: 0,
      rangePolyLineAlpha: 0
    };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    let target = null;

    switch (c.mode) {
      case "selected-token":
        target = "canvas.tokens.controlled[0]";
        break;
      case "selected-target":
        target = "Array.from(game.user.targets)[0]";
        break;
      case "token-id":
        if (c.tokenId?.trim()) target = `canvas.tokens.get("${esc(c.tokenId)}")`;
        break;
      case "token-name":
        if (c.tokenName?.trim()) target = `canvas.tokens.placeables.find(t => t.name === "${esc(c.tokenName)}")`;
        break;
      case "tile-id":
        if (c.tileId?.trim()) target = `canvas.tiles.get("${esc(c.tileId)}")`;
        break;
      case "stored-name":
        if (c.storedName?.trim()) target = `"${esc(c.storedName)}"`;
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
    if (num(c.limitMinRange)) opts.push(`limitMinRange: ${num(c.limitMinRange)}`);
    if (num(c.limitMaxRange)) opts.push(`limitMaxRange: ${num(c.limitMaxRange)}`);
    if (c.showRange) opts.push("showRange: true");
    if (c.lockToEdge) opts.push("lockToEdge: true");
    if (c.lockToEdgeDirection) opts.push("lockToEdgeDirection: true");
    if (num(c.offsetX) || num(c.offsetY)) {
      opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    }
    if (c.wallBehavior?.trim()) opts.push(`wallBehavior: "${esc(c.wallBehavior.trim())}"`);
    if (c.displayRangePoly) opts.push("displayRangePoly: true");

    const fillColor = crosshairColor(c.rangePolyFillColor);
    if (fillColor !== null) opts.push(`rangePolyFillColor: ${fillColor}`);
    const lineColor = crosshairColor(c.rangePolyLineColor);
    if (lineColor !== null) opts.push(`rangePolyLineColor: ${lineColor}`);

    const fillAlpha = Number(c.rangePolyFillAlpha);
    if (Number.isFinite(fillAlpha) && fillAlpha >= 0) opts.push(`rangePolyFillAlpha: ${fillAlpha}`);
    const lineAlpha = Number(c.rangePolyLineAlpha);
    if (Number.isFinite(lineAlpha) && lineAlpha >= 0) opts.push(`rangePolyLineAlpha: ${lineAlpha}`);

    if (!opts.length) block.lines.push(`  .location(${target})`);
    else block.lines.push(`  .location(${target}, { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("crosshairGridHighlight", {
  label: "Grid Highlight",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() { return { highlight: true }; },
  compileChild(node, block, _ctx) {
    const highlight = !!node.config?.highlight;
    block.lines.push(`  .gridHighlight(${highlight})`);
  }
});

VisualencerNodeTypes.register("crosshairCallback", {
  label: "Crosshair Callback",
  category: "crosshair",
  role: "child",
  families: ["crosshair"],
  createConfig() {
    return {
      hook: "Sequencer.Crosshair.CALLBACKS.SHOW",
      body: "// crosshair is available\nconsole.log(crosshair);"
    };
  },
  compileChild(node, block, _ctx) {
    const hook = (node.config?.hook || "").trim();
    if (!hook) return;
    const body = node.config?.body || "";
    block.lines.push(`  .callback(${hook}, (crosshair) => {`);
    if (body.trim()) {
      body.split("\n").forEach((line) => block.lines.push(`    ${line}`));
    }
    block.lines.push("  })");
  }
});

/* =========================
 * Nodos Hijo
 * ======================= */

VisualencerNodeTypes.register("atLocation", {
  label: "At Location",
  category: "common",
  role: "child",
  families: ["effect", "animation", "sound","scrollingText"],
  createConfig() {
    return {
      mode: "selected-token",
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
  families: ["sound","effect"],
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
      mode: "inToken",
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
  families: ["animation","effect"],
  createConfig() {
    return {
      mode: "inToken",
      tokenId: "",
      tileId: "",
      x: 0,
      y: 0,
      duration: 500,
      ease: "linear",
      delay: 0,
      rotationOffset: 0,
      cacheLocation: false,
      towardsCenter: true,
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
    if (c.attachTo) opts.push("attachTo: true");
    if (num(c.randomOffset)) opts.push(`randomOffset: ${num(c.randomOffset)}`);
    if (num(c.offsetX) || num(c.offsetY)) opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");

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
      mode: "inToken",
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
  families: ["animation","effect"],
  createConfig() { return {}; },
  compileChild(node, block, _ctx) {
    block.lines.push(`  .snapToGrid()`);
  }
});

VisualencerNodeTypes.register("rotate", {
  label: "Rotate",
  category: "animation",
  role: "child",
  families: ["animation","effect"],
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
  families: ["animation","effect"],
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
  families: ["animation","effect"],
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
  families: ["animation","effect"],
  createConfig() {
    return {
      mode: "none",
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

VisualencerNodeTypes.register("locally", {
    label: "Locally",
    category: "effect",
    role: "child",
    families: ["effect","sound","animation"],
    createConfig() {
        return { locally: true };
    },
    compileChild(node, block, _ctx) {
        const c = node.config || {};
        if (c.locally) block.lines.push("  .locally(true)");
    }
});

VisualencerNodeTypes.register("forUsers", {
    label: "For Users",
    category: "effect",
    role: "child",
    families: ["effect"],
    createConfig() {
        return { users: "" };
    },
    compileChild(node, block, _ctx) {
          const raw = (node.config?.users || "").trim();
          if (!raw) return;
          const list = raw
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          if (!list.length) return;
          const arr = list.map((v) => `"${VHelpers.esc(v)}"`).join(",");
          block.lines.push(`  .forUsers([${arr}])`);
    }
});

VisualencerNodeTypes.register("copySprite", {
  label: "Copy Sprite",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      mode: "selected-token",
      tokenId: "",
      tileId: "",
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
    let target = null;

    if (c.mode === "selected-token") target = "canvas.tokens.controlled[0]";
    else if (c.mode === "selected-tile") target = "canvas.tiles.controlled[0]";
    else if (c.mode === "token-id" && c.tokenId.trim()) target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "tile-id" && c.tileId.trim()) target = `canvas.tiles.get("${esc(c.tileId)}")`;

    if (!target) return;

    const opts = [];
    if (c.cacheLocation) opts.push("cacheLocation: true");
    if (num(c.randomOffset)) opts.push(`randomOffset: ${num(c.randomOffset)}`);
    if (num(c.offsetX) || num(c.offsetY)) opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");

    if (opts.length) block.lines.push(`  .copySprite(${target}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .copySprite(${target})`);
  }
});

VisualencerNodeTypes.register("attachTo", {
  label: "Attach To",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      mode: "selected-token",
      tokenId: "",
      tokenName: "",
      storedName: "",
      align: "center",
      edge: "on",
      bindVisibility: true,
      bindAlpha: true,
      bindScale: true,
      bindRotation: true,
      randomOffset: 0,
      offsetX: 0,
      offsetY: 0,
      local: false,
      gridUnits: false,
      template: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    let target = null;

    if (c.mode === "selected-token") target = "canvas.tokens.controlled[0]";
    else if (c.mode === "template") target = "canvas.templates.placeables[0]";
    else if (c.mode === "token-id" && c.tokenId.trim()) target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "token-name" && c.tokenName.trim()) target = `canvas.tokens.placeables.find(t => t.name === "${esc(c.tokenName)}")`;
    else if (c.mode === "name" && c.storedName.trim()) target = `"${esc(c.storedName)}"`;

    if (!target) return;

    const opts = [];
    if (c.align?.trim()) opts.push(`align: "${esc(c.align)}"`);
    if (c.edge?.trim()) opts.push(`edge: "${esc(c.edge)}"`);
    if (!c.bindVisibility) opts.push("bindVisibility: false");
    if (!c.bindAlpha) opts.push("bindAlpha: false");
    if (!c.bindScale) opts.push("bindScale: false");
    if (!c.bindRotation) opts.push("bindRotation: false");
    if (num(c.randomOffset)) opts.push(`randomOffset: ${num(c.randomOffset)}`);
    if (num(c.offsetX) || num(c.offsetY)) opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.template) opts.push("template: true");

    if (opts.length) block.lines.push(`  .attachTo(${target}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .attachTo(${target})`);
  }
});

VisualencerNodeTypes.register("stretchTo", {
  label: "Stretch To",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      mode: "selected-target",
      tokenId: "",
      tileId: "",
      x: 0,
      y: 0,
      storedName: "",
      cacheLocation: false,
      attachTo: false,
      onlyX: false,
      tiling: false,
      randomOffset: 0,
      offsetX: 0,
      offsetY: 0,
      local: false,
      gridUnits: false,
      requiresLineOfSight: false,
      hideLineOfSight: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    let target = null;

    if (c.mode === "selected-target") target = "Array.from(game.user.targets)[0]";
    else if (c.mode === "token-id" && c.tokenId.trim()) target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "tile-id" && c.tileId.trim()) target = `canvas.tiles.get("${esc(c.tileId)}")`;
    else if (c.mode === "point") target = `{ x: ${num(c.x)}, y: ${num(c.y)} }`;
    else if (c.mode === "name" && c.storedName.trim()) target = `"${esc(c.storedName)}"`;

    if (!target) return;

    const opts = [];
    if (c.cacheLocation) opts.push("cacheLocation: true");
    if (c.attachTo) opts.push("attachTo: true");
    if (c.onlyX) opts.push("onlyX: true");
    if (c.tiling) opts.push("tiling: true");
    if (num(c.randomOffset)) opts.push(`randomOffset: ${num(c.randomOffset)}`);
    if (num(c.offsetX) || num(c.offsetY)) opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.requiresLineOfSight) opts.push("requiresLineOfSight: true");
    if (c.hideLineOfSight) opts.push("hideLineOfSight: true");

    if (opts.length) block.lines.push(`  .stretchTo(${target}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .stretchTo(${target})`);
  }
});

VisualencerNodeTypes.register("spriteOffset", {
  label: "Sprite Offset",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      x: 0,
      y: 0,
      gridUnits: false,
      local: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.local) opts.push("local: true");
    if (opts.length)
      block.lines.push(`  .spriteOffset({ x: ${num(c.x)}, y: ${num(c.y)} }, { ${opts.join(", ")} })`);
    else block.lines.push(`  .spriteOffset({ x: ${num(c.x)}, y: ${num(c.y)} })`);
  }
});

VisualencerNodeTypes.register("randomSpriteRotation", {
  label: "Random Sprite Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .randomSpriteRotation()");
  }
});

VisualencerNodeTypes.register("zeroSpriteRotation", {
  label: "Zero Sprite Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    const enabled = node.config?.enabled;
    if (enabled === false) return;
    if (enabled === true || enabled === undefined) block.lines.push("  .zeroSpriteRotation(true)");
  }
});

VisualencerNodeTypes.register("persist", {
  label: "Persist",
  category: "effect",
  role: "child",
  families: ["effect","crosshair"],
  createConfig() {
    return { enabled: true, persistTokenPrototype: false };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (!c.enabled) return;
    if (c.persistTokenPrototype) block.lines.push("  .persist(true, { persistTokenPrototype: true })");
    else block.lines.push("  .persist()");
  }
});

VisualencerNodeTypes.register("temporary", {
  label: "Temporary",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .temporary()");
  }
});

VisualencerNodeTypes.register("extraEndDuration", {
  label: "Extra End Duration",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { duration: 0 }; },
  compileChild(node, block, _ctx) {
    const d = VHelpers.num(node.config?.duration);
    if (d) block.lines.push(`  .extraEndDuration(${d})`);
  }
});

VisualencerNodeTypes.register("loopOptions", {
  label: "Loop Options",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { loopDelay: 0, maxLoops: 0, endOnLastLoop: false };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (num(c.loopDelay)) opts.push(`loopDelay: ${num(c.loopDelay)}`);
    if (num(c.maxLoops)) opts.push(`maxLoops: ${num(c.maxLoops)}`);
    if (c.endOnLastLoop) opts.push("endOnLastLoop: true");
    if (!opts.length) return;
    block.lines.push(`  .loopOptions({ ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("origin", {
  label: "Origin",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { origin: "" }; },
  compileChild(node, block, _ctx) {
    const origin = (node.config?.origin || "").trim();
    if (origin) block.lines.push(`  .origin("${VHelpers.esc(origin)}")`);
  }
});

VisualencerNodeTypes.register("name", {
  label: "Name",
  category: "effect",
  role: "child",
  families: ["effect","crosshair"],
  createConfig() { return { name: "" }; },
  compileChild(node, block, _ctx) {
    const name = (node.config?.name || "").trim();
    if (name) block.lines.push(`  .name("${VHelpers.esc(name)}")`);
  }
});

VisualencerNodeTypes.register("private", {
  label: "Private",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .private(true)");
  }
});

VisualencerNodeTypes.register("missed", {
  label: "Missed",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .missed()");
  }
});

VisualencerNodeTypes.register("addOverride", {
  label: "Add Override",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { body: "// modify data here" }; },
  compileChild(node, block, _ctx) {
    const body = node.config?.body || "";
    block.lines.push("  .addOverride(async (effect, data) => {");
    if (body.trim()) {
      const lines = body.split("\n").map((l) => `    ${l}`);
      block.lines.push(...lines);
    }
    block.lines.push("    return data;");
    block.lines.push("  })");
  }
});

VisualencerNodeTypes.register("size", {
  label: "Size",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { width: 0, height: 0, gridUnits: false };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.gridUnits) opts.push("gridUnits: true");
    const w = num(c.width);
    const h = num(c.height);
    if (!w && !h) return;
    if (opts.length) block.lines.push(`  .size({ width: ${w}, height: ${h} }, { ${opts.join(", ")} })`);
    else block.lines.push(`  .size({ width: ${w}, height: ${h} })`);
  }
});

VisualencerNodeTypes.register("templateOpts", {
  label: "Template",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { gridSize: 0, startPoint: 0, endPoint: 0 }; },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    block.lines.push(
      `  .template({ gridSize: ${num(c.gridSize)}, startPoint: ${num(c.startPoint)}, endPoint: ${num(c.endPoint)} })`
    );
  }
});

VisualencerNodeTypes.register("scale", {
  label: "Scale",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mode: "uniform", scale: 1, scaleX: 1, scaleY: 1, min: 0.5, max: 1.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "random") block.lines.push(`  .scale(${num(c.min)}, ${num(c.max)})`);
    else if (c.mode === "object") block.lines.push(`  .scale({ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} })`);
    else block.lines.push(`  .scale(${num(c.scale)})`);
  }
});

VisualencerNodeTypes.register("scaleIn", {
  label: "Scale In",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { scale: 0, duration: 500, ease: "", delay: 0, isObject: false, scaleX: 0, scaleY: 0 };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    const scaleVal = c.isObject
      ? `{ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} }`
      : `${num(c.scale)}`;
    if (opts.length) block.lines.push(`  .scaleIn(${scaleVal}, ${num(c.duration)}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .scaleIn(${scaleVal}, ${num(c.duration)})`);
  }
});

VisualencerNodeTypes.register("scaleOut", {
  label: "Scale Out",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { scale: 0, duration: 500, ease: "", delay: 0, isObject: false, scaleX: 0, scaleY: 0 };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    const scaleVal = c.isObject
      ? `{ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} }`
      : `${num(c.scale)}`;
    if (opts.length) block.lines.push(`  .scaleOut(${scaleVal}, ${num(c.duration)}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .scaleOut(${scaleVal}, ${num(c.duration)})`);
  }
});

VisualencerNodeTypes.register("scaleToObject", {
  label: "Scale To Object",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { multiplier: 0, uniform: false, considerTokenScale: false };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.uniform) opts.push("uniform: true");
    if (c.considerTokenScale) opts.push("considerTokenScale: true");
    if (num(c.multiplier)) {
      if (opts.length) block.lines.push(`  .scaleToObject(${num(c.multiplier)}, { ${opts.join(", ")} })`);
      else block.lines.push(`  .scaleToObject(${num(c.multiplier)})`);
    } else if (opts.length) block.lines.push(`  .scaleToObject({ ${opts.join(", ")} })`);
    else block.lines.push("  .scaleToObject()");
  }
});

VisualencerNodeTypes.register("spriteScale", {
  label: "Sprite Scale",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mode: "uniform", scale: 1, scaleX: 1, scaleY: 1, min: 0.5, max: 1.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "random") block.lines.push(`  .spriteScale(${num(c.min)}, ${num(c.max)})`);
    else if (c.mode === "object") block.lines.push(`  .spriteScale({ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} })`);
    else block.lines.push(`  .spriteScale(${num(c.scale)})`);
  }
});

VisualencerNodeTypes.register("anchor", {
  label: "Anchor",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mode: "uniform", anchor: 0.5, x: 0.5, y: 0.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "uniform") block.lines.push(`  .anchor(${num(c.anchor)})`);
    else block.lines.push(`  .anchor({ x: ${num(c.x)}, y: ${num(c.y)} })`);
  }
});

VisualencerNodeTypes.register("spriteAnchor", {
  label: "Sprite Anchor",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mode: "uniform", anchor: 0.5, x: 0.5, y: 0.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "uniform") block.lines.push(`  .spriteAnchor(${num(c.anchor)})`);
    else block.lines.push(`  .spriteAnchor({ x: ${num(c.x)}, y: ${num(c.y)} })`);
  }
});

VisualencerNodeTypes.register("center", {
  label: "Center",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return {}; },
  compileChild(_node, block, _ctx) {
    block.lines.push("  .center()");
  }
});

VisualencerNodeTypes.register("mirror", {
  label: "Mirror",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mirrorX: false, mirrorY: false, randomMirrorX: false, randomMirrorY: false };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.mirrorX) block.lines.push("  .mirrorX(true)");
    if (c.mirrorY) block.lines.push("  .mirrorY(true)");
    if (c.randomMirrorX) block.lines.push("  .randomizeMirrorX(true)");
    if (c.randomMirrorY) block.lines.push("  .randomizeMirrorY(true)");
  }
});

VisualencerNodeTypes.register("spriteRotation", {
  label: "Sprite Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { rotation: 0 }; },
  compileChild(node, block, _ctx) {
    const r = Number(node.config?.rotation);
    if (Number.isFinite(r)) block.lines.push(`  .spriteRotation(${r})`);
  }
});

VisualencerNodeTypes.register("randomRotation", {
  label: "Random Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .randomRotation()");
  }
});

VisualencerNodeTypes.register("playbackRate", {
  label: "Playback Rate",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { rate: 1 }; },
  compileChild(node, block, _ctx) {
    const r = Number(node.config?.rate);
    if (Number.isFinite(r)) block.lines.push(`  .playbackRate(${r})`);
  }
});

VisualencerNodeTypes.register("belowTokens", {
  label: "Below Tokens",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .belowTokens()");
  } 
})

VisualencerNodeTypes.register("belowTiles", {
  label: "Below Tiles",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .belowTiles()");
  } 
})

VisualencerNodeTypes.register("aboveLighting", {
  label: "Above Lighting",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .aboveLighting()");
  } 
})

VisualencerNodeTypes.register("aboveInterface", {
  label: "Above Interface",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .aboveInterface()");
  } 
})

VisualencerNodeTypes.register("zIndex", {
  label: "Z Index",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { zIndex: 1 }; },
  compileChild(node, block, _ctx) {
    const r = Number(node.config?.rate);
    if (Number.isFinite(r)) block.lines.push(`  .zIndex(${r})`);
  }
})

VisualencerNodeTypes.register("sortLayer", {
  label: "Sort Layer",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { sortLayer: 800 }; },
  compileChild(node, block, _ctx) {
    const r = Number(node.config?.rate);
    if (Number.isFinite(r)) block.lines.push(`  .sortLayer(${r})`);
  }
})

VisualencerNodeTypes.register("animateProperty", {
  label: "Animate Property",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      target: "sprite",
      property: "position.x",
      from: 0,
      to: 100,
      duration: 500,
      ease: "linear",
      delay: 0,
      gridUnits: false,
      fromEnd: false,
      absolute: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    opts.push(`from: ${num(c.from)}`);
    opts.push(`to: ${num(c.to)}`);
    opts.push(`duration: ${num(c.duration)}`);
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.fromEnd) opts.push("fromEnd: true");
    if (c.absolute) opts.push("absolute: true");
    block.lines.push(`  .animateProperty("${esc(c.target || "sprite")}", "${esc(c.property || "position.x")}", { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("loopProperty", {
  label: "Loop Property",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      target: "sprite",
      property: "position.x",
      from: 0,
      to: 100,
      duration: 500,
      ease: "linear",
      delay: 0,
      pingPong: false,
      loops: 0,
      gridUnits: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    opts.push(`from: ${num(c.from)}`);
    opts.push(`to: ${num(c.to)}`);
    opts.push(`duration: ${num(c.duration)}`);
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    if (c.pingPong) opts.push("pingPong: true");
    if (num(c.loops)) opts.push(`loops: ${num(c.loops)}`);
    if (c.gridUnits) opts.push("gridUnits: true");
    block.lines.push(`  .loopProperty("${esc(c.target || "sprite")}", "${esc(c.property || "position.x")}", { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("filter", {
  label: "Filter",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { filter: "", options: "{}" }; },
  compileChild(node, block, _ctx) {
    const name = (node.config?.filter || "").trim();
    if (!name) {
      console.debug("Visualencer: filter node has no filter name", node.config);
      return;
    }
    block.lines.push(`  .filter("${VHelpers.esc(name)}", ${node.config.options || "{}"})`);
  }
});

VisualencerNodeTypes.register("text", {
    label: "Text",
    category: "effect",
    role: "child",
    families: ["effect", "scrollingText"],
    createConfig() {
        return {
            text: "My Text",
            style: "{\n  \"fill\": \'white\',\n  \"fontFamily\": \'Arial\',\n  \"fontSize\": 32\n}"
        };
    },
    compileChild(node, block, ctx) {
        ctx.styles = ctx.styles || [];
        ctx.styleCounter = (ctx.styleCounter || 0) + 1;

        const styleVar = `style${ctx.styleCounter}`;

        let styleSource = node.config?.style;
        if (!styleSource || !String(styleSource).trim()) {
            styleSource = "{}";
        }
        ctx.styles.push({
            name: styleVar,
            value: styleSource
        });

        const nodeTextRaw = (node.config?.text ?? "").toString();
        const nodeText = nodeTextRaw.trim();

        const lines = block.lines || [];

        let rootText = "";
        let textLineIndex = -1;

        textLineIndex = lines.findIndex(l => l.trim().startsWith(".text("));
        if (textLineIndex !== -1) {
            const m = lines[textLineIndex].match(/\.text\(`(.*)`\)/);
            if (m) {
                rootText = m[1];
            }
        }

        // Reglas:
        // - Si el nodo Text tiene texto → usar ese
        // - Si no, pero el root tenía texto → usar el del root
        // - Si ninguno tiene texto → finalText vacío ( la validación global ya habrá decidido si debe dar error)
        const rawFinal = nodeText || rootText;
        const finalText = rawFinal.trim();

        if (!finalText) {
            return;
        }

        const safeText = finalText.replace(/`/g, "\\`");
        const newLine = `  .text(\`${safeText}\`, ${styleVar})`;

        if (textLineIndex !== -1) {
            lines[textLineIndex] = newLine;
        } else {
            lines.push(newLine);
        }
    }
});

VisualencerNodeTypes.register("shape", {
  label: "Shape",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { type: "circle", options: "{\\n  \"radius\": 1\\n}" }; },
  compileChild(node, block, _ctx) {
    const type = (node.config?.type || "").trim();
    if (!type) return;
    block.lines.push(`  .shape("${VHelpers.esc(type)}", ${node.config?.options || "{}"})`);
  }
});

VisualencerNodeTypes.register("xray", {
  label: "XRay",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .xray(true)");
  }
});

VisualencerNodeTypes.register("mask", {
  label: "Mask",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { mode: "source", ids: "" }; },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.mode === "source") {
      block.lines.push("  .mask()");
      return;
    }
    const ids = (c.ids || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!ids.length) return;
    const arr = ids.map((v) => `"${VHelpers.esc(v)}"`).join(",");
    block.lines.push(`  .mask([${arr}])`);
  }
});

VisualencerNodeTypes.register("tieToDocuments", {
  label: "Tie To Documents",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { uuids: "" }; },
  compileChild(node, block, _ctx) {
    const ids = (node.config?.uuids || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!ids.length) return;
    const arr = ids.map((v) => `"${VHelpers.esc(v)}"`).join(",");
    block.lines.push(`  .tieToDocuments([${arr}])`);
  }
});

VisualencerNodeTypes.register("syncGroup", {
  label: "Sync Group",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { name: "" }; },
  compileChild(node, block, _ctx) {
    const name = (node.config?.name || "").trim();
    if (name) block.lines.push(`  .syncGroup("${VHelpers.esc(name)}")`);
  }
});

VisualencerNodeTypes.register("isometric", {
  label: "Isometric",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { overlay: false }; },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.overlay) block.lines.push("  .isometric({ overlay: true })");
    else block.lines.push("  .isometric(true)");
  }
});

VisualencerNodeTypes.register("screenSpace", {
  label: "Screen Space",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      screenSpace: true,
      aboveUI: false,
      anchor: 0.5,
      anchorX: 0.5,
      anchorY: 0.5,
      posX: 0,
      posY: 0,
      scaleX: 1,
      scaleY: 1,
      fitX: false,
      fitY: false,
      ratioX: false,
      ratioY: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.screenSpace) block.lines.push("  .screenSpace(true)");
    if (c.aboveUI) block.lines.push("  .screenSpaceAboveUI(true)");
    block.lines.push(`  .screenSpaceAnchor({ x: ${num(c.anchorX ?? c.anchor)}, y: ${num(c.anchorY ?? c.anchor)} })`);
    block.lines.push(`  .screenSpacePosition({ x: ${num(c.posX)}, y: ${num(c.posY)} })`);
    block.lines.push(
      `  .screenSpaceScale({ x: ${num(c.scaleX)}, y: ${num(c.scaleY)}, fitX: ${!!c.fitX}, fitY: ${!!c.fitY}, ratioX: ${!!c.ratioX}, ratioY: ${!!c.ratioY} })`
    );
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

VisualencerNodeTypes.register("endTime", {
  label: "End Time",
  category: "common",
  role: "child",
  families: ["effect", "sound"],
  createConfig() {
    return {
      endTime: 0,
      endTimePerc: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    const lines = block.lines;

    if (num(c.endTime) > 0) {
      lines.push(`  .endTime(${num(c.endTime)})`);
    }

    const etp = c.endTimePerc;
    if (etp !== null && etp !== "" && !Number.isNaN(Number(etp))) {
      lines.push(`  .endTimePerc(${Number(etp)})`);
    }
  }
});

VisualencerNodeTypes.register("timeRange", {
  label: "Time Range",
  category: "common",
  role: "child",
  families: ["effect", "sound"],
  createConfig() {
    return {
      start: 0,
      end: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    const lines = block.lines;

    const start = num(c.start);
    const end = num(c.end);
    if (start >= 0 && end > start) {
      lines.push(`  .timeRange(${start}, ${end})`);
    }
  }
});

VisualencerNodeTypes.register("preset", {
  label: "Preset",
  category: "common",
  role: "child",
  families: ["sound", "effect"],
  createConfig() {
    return { preset: "" };
  },
  compileChild(node, block, _ctx) {
    const raw = (node.config?.preset || "").trim();
    if (!raw) return;
    block.lines.push(`  .preset("${VHelpers.esc(raw)}")`);
  }
});

VisualencerNodeTypes.register("baseFolder", {
  label: "Base Folder",
  category: "common",
  role: "child",
  families: ["sound", "effect"],
  createConfig() {
    return { baseFolder: "" };
  },
  compileChild(node, block, _ctx) {
    const raw = (node.config?.baseFolder || "").trim();
    if (!raw) return;
    block.lines.push(`  .baseFolder("${VHelpers.esc(raw)}")`);
  }
});

/* =========================
 * Effect Specific
 * ======================= */

VisualencerNodeTypes.register("locally", {
  label: "Locally",
  category: "effect",
  role: "child",
  families: ["effect", "sound", "animation"],
  createConfig() {
    return { locally: true };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.locally) block.lines.push("  .locally(true)");
  }
});

VisualencerNodeTypes.register("forUsers", {
  label: "For Users",
  category: "effect",
  role: "child",
  families: ["effect", "sound","scrollingText"],
  createConfig() {
    return { users: "" };
  },
  compileChild(node, block, _ctx) {
    const raw = (node.config?.users || "").trim();
    if (!raw) return;
    const list = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!list.length) return;
    if (list.length === 1) block.lines.push(`  .forUsers("${VHelpers.esc(list[0])}")`);
    else block.lines.push(`  .forUsers([${list.map((u) => `"${VHelpers.esc(u)}"`).join(",")}])`);
  }
});

VisualencerNodeTypes.register("copySprite", {
  label: "Copy Sprite",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      mode: "selected-token", 
      tokenId: "",
      tileId: "",
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
    let target = null;

    if (c.mode === "selected-token") target = "canvas.tokens.controlled[0]";
    else if (c.mode === "selected-tile") target = "canvas.tiles.controlled[0]";
    else if (c.mode === "token-id" && c.tokenId.trim()) target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "tile-id" && c.tileId.trim()) target = `canvas.tiles.get("${esc(c.tileId)}")`;

    if (!target) return;

    const opts = [];
    if (c.cacheLocation) opts.push("cacheLocation: true");
    if (num(c.randomOffset)) opts.push(`randomOffset: ${num(c.randomOffset)}`);
    if (num(c.offsetX) || num(c.offsetY)) opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");

    if (opts.length) block.lines.push(`  .copySprite(${target}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .copySprite(${target})`);
  }
});

VisualencerNodeTypes.register("attachTo", {
  label: "Attach To",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      mode: "selected-token", 
      tokenId: "",
      tokenName: "",
      storedName: "",
      align: "center",
      edge: "on",
      bindVisibility: true,
      bindAlpha: true,
      bindScale: true,
      bindRotation: true,
      randomOffset: 0,
      offsetX: 0,
      offsetY: 0,
      local: false,
      gridUnits: false,
      template: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    let target = null;

    if (c.mode === "selected-token") target = "canvas.tokens.controlled[0]";
    else if (c.mode === "template") target = "canvas.templates.placeables[0]";
    else if (c.mode === "token-id" && c.tokenId.trim()) target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "token-name" && c.tokenName.trim()) target = `canvas.tokens.placeables.find(t => t.name === "${esc(c.tokenName)}")`;
    else if (c.mode === "name" && c.storedName.trim()) target = `"${esc(c.storedName)}"`;

    if (!target) return;

    const opts = [];
    if (c.align?.trim()) opts.push(`align: "${esc(c.align)}"`);
    if (c.edge?.trim()) opts.push(`edge: "${esc(c.edge)}"`);
    if (!c.bindVisibility) opts.push("bindVisibility: false");
    if (!c.bindAlpha) opts.push("bindAlpha: false");
    if (!c.bindScale) opts.push("bindScale: false");
    if (!c.bindRotation) opts.push("bindRotation: false");
    if (num(c.randomOffset)) opts.push(`randomOffset: ${num(c.randomOffset)}`);
    if (num(c.offsetX) || num(c.offsetY)) opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.template) opts.push("template: true");

    if (opts.length) block.lines.push(`  .attachTo(${target}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .attachTo(${target})`);
  }
});

VisualencerNodeTypes.register("stretchTo", {
  label: "Stretch To",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      mode: "selected-target", 
      tokenId: "",
      tileId: "",
      x: 0,
      y: 0,
      storedName: "",
      cacheLocation: false,
      attachTo: false,
      onlyX: false,
      tiling: false,
      randomOffset: 0,
      offsetX: 0,
      offsetY: 0,
      local: false,
      gridUnits: false,
      requiresLineOfSight: false,
      hideLineOfSight: false
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num, esc } = VHelpers;
    let target = null;

    if (c.mode === "selected-target") target = "Array.from(game.user.targets)[0]";
    else if (c.mode === "token-id" && c.tokenId.trim()) target = `canvas.tokens.get("${esc(c.tokenId)}")`;
    else if (c.mode === "tile-id" && c.tileId.trim()) target = `canvas.tiles.get("${esc(c.tileId)}")`;
    else if (c.mode === "point") target = `{ x: ${num(c.x)}, y: ${num(c.y)} }`;
    else if (c.mode === "name" && c.storedName.trim()) target = `"${esc(c.storedName)}"`;

    if (!target) return;

    const opts = [];
    if (c.cacheLocation) opts.push("cacheLocation: true");
    if (c.attachTo) opts.push("attachTo: true");
    if (c.onlyX) opts.push("onlyX: true");
    if (c.tiling) opts.push("tiling: true");
    if (num(c.randomOffset)) opts.push(`randomOffset: ${num(c.randomOffset)}`);
    if (num(c.offsetX) || num(c.offsetY)) opts.push(`offset: { x: ${num(c.offsetX)}, y: ${num(c.offsetY)} }`);
    if (c.local) opts.push("local: true");
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.requiresLineOfSight) opts.push("requiresLineOfSight: true");
    if (c.hideLineOfSight) opts.push("hideLineOfSight: true");

    if (opts.length) block.lines.push(`  .stretchTo(${target}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .stretchTo(${target})`);
  }
});

VisualencerNodeTypes.register("spriteOffset", {
  label: "Sprite Offset",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      x: 0,
      y: 0,
      gridUnits: false,
      local: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.local) opts.push("local: true");
    if (opts.length)
      block.lines.push(`  .spriteOffset({ x: ${num(c.x)}, y: ${num(c.y)} }, { ${opts.join(", ")} })`);
    else block.lines.push(`  .spriteOffset({ x: ${num(c.x)}, y: ${num(c.y)} })`);
  }
});

VisualencerNodeTypes.register("randomSpriteRotation", {
  label: "Random Sprite Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .randomSpriteRotation()");
  }
});

VisualencerNodeTypes.register("zeroSpriteRotation", {
  label: "Zero Sprite Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    const enabled = node.config?.enabled;
    if (enabled === false) return;
    if (enabled === true || enabled === undefined) block.lines.push("  .zeroSpriteRotation(true)");
  }
});

VisualencerNodeTypes.register("temporary", {
  label: "Temporary",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .temporary()");
  }
});

VisualencerNodeTypes.register("extraEndDuration", {
  label: "Extra End Duration",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { duration: 0 }; },
  compileChild(node, block, _ctx) {
    const d = VHelpers.num(node.config?.duration);
    if (d) block.lines.push(`  .extraEndDuration(${d})`);
  }
});

VisualencerNodeTypes.register("loopOptions", {
  label: "Loop Options",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { loopDelay: 0, maxLoops: 0, endOnLastLoop: false };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (num(c.loopDelay)) opts.push(`loopDelay: ${num(c.loopDelay)}`);
    if (num(c.maxLoops)) opts.push(`maxLoops: ${num(c.maxLoops)}`);
    if (c.endOnLastLoop) opts.push("endOnLastLoop: true");
    if (!opts.length) return;
    block.lines.push(`  .loopOptions({ ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("origin", {
  label: "Origin",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { origin: "" }; },
  compileChild(node, block, _ctx) {
    const origin = (node.config?.origin || "").trim();
    if (origin) block.lines.push(`  .origin("${VHelpers.esc(origin)}")`);
  }
});

VisualencerNodeTypes.register("name", {
  label: "Name",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { name: "" }; },
  compileChild(node, block, _ctx) {
    const name = (node.config?.name || "").trim();
    if (name) block.lines.push(`  .name("${VHelpers.esc(name)}")`);
  }
});

VisualencerNodeTypes.register("private", {
  label: "Private",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .private(true)");
  }
});

VisualencerNodeTypes.register("missed", {
  label: "Missed",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .missed()");
  }
});

VisualencerNodeTypes.register("addOverride", {
  label: "Add Override",
  category: "effect",
  role: "child",
  families: ["effect", "sound"],
  createConfig() { return { body: "// Modify data as needed\nreturn data;" }; },
  compileChild(node, block, _ctx) {
    const body = node.config?.body || "";
    block.lines.push("  .addOverride(async (entry, data) => {");
    if (body.trim()) {
      const lines = body.split("\n").map((l) => `    ${l}`);
      block.lines.push(...lines);
    }
    if (!body.includes("return")) block.lines.push("    return data;");
    block.lines.push("  })");
  }
});

VisualencerNodeTypes.register("size", {
  label: "Size",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { width: 0, height: 0, gridUnits: false };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.gridUnits) opts.push("gridUnits: true");
    const w = num(c.width);
    const h = num(c.height);
    if (!w && !h) return;
    if (opts.length) block.lines.push(`  .size({ width: ${w}, height: ${h} }, { ${opts.join(", ")} })`);
    else block.lines.push(`  .size({ width: ${w}, height: ${h} })`);
  }
});

VisualencerNodeTypes.register("templateOpts", {
  label: "Template",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { gridSize: 0, startPoint: 0, endPoint: 0 }; },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    block.lines.push(
      `  .template({ gridSize: ${num(c.gridSize)}, startPoint: ${num(c.startPoint)}, endPoint: ${num(c.endPoint)} })`
    );
  }
});

VisualencerNodeTypes.register("setMustache", {
  label: "Set Mustache",
  category: "effect",
  role: "child",
  families: ["effect", "sound"],
  createConfig() { return { mustache: "{ \"color\": \"Blue\" }" }; },
  compileChild(node, block, _ctx) {
    const raw = (node.config?.mustache || "").trim();
    if (!raw) return;
    block.lines.push(`  .setMustache(${raw})`);
  }
});

VisualencerNodeTypes.register("scale", {
  label: "Scale",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mode: "uniform", scale: 1, scaleX: 1, scaleY: 1, min: 0.5, max: 1.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "random") block.lines.push(`  .scale(${num(c.min)}, ${num(c.max)})`);
    else if (c.mode === "object") block.lines.push(`  .scale({ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} })`);
    else block.lines.push(`  .scale(${num(c.scale)})`);
  }
});

VisualencerNodeTypes.register("scaleIn", {
  label: "Scale In",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { scale: 0, duration: 500, ease: "", delay: 0, isObject: false, scaleX: 0, scaleY: 0 };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    const scaleVal = c.isObject
      ? `{ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} }`
      : `${num(c.scale)}`;
    if (opts.length) block.lines.push(`  .scaleIn(${scaleVal}, ${num(c.duration)}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .scaleIn(${scaleVal}, ${num(c.duration)})`);
  }
});

VisualencerNodeTypes.register("scaleOut", {
  label: "Scale Out",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { scale: 0, duration: 500, ease: "", delay: 0, isObject: false, scaleX: 0, scaleY: 0 };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    const scaleVal = c.isObject
      ? `{ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} }`
      : `${num(c.scale)}`;
    if (opts.length) block.lines.push(`  .scaleOut(${scaleVal}, ${num(c.duration)}, { ${opts.join(", ")} })`);
    else block.lines.push(`  .scaleOut(${scaleVal}, ${num(c.duration)})`);
  }
});

VisualencerNodeTypes.register("scaleToObject", {
  label: "Scale To Object",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { multiplier: 0, uniform: false, considerTokenScale: false };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    const opts = [];
    if (c.uniform) opts.push("uniform: true");
    if (c.considerTokenScale) opts.push("considerTokenScale: true");
    if (num(c.multiplier)) {
      if (opts.length) block.lines.push(`  .scaleToObject(${num(c.multiplier)}, { ${opts.join(", ")} })`);
      else block.lines.push(`  .scaleToObject(${num(c.multiplier)})`);
    } else if (opts.length) block.lines.push(`  .scaleToObject({ ${opts.join(", ")} })`);
    else block.lines.push("  .scaleToObject()");
  }
});

VisualencerNodeTypes.register("spriteScale", {
  label: "Sprite Scale",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mode: "uniform", scale: 1, scaleX: 1, scaleY: 1, min: 0.5, max: 1.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "random") block.lines.push(`  .spriteScale(${num(c.min)}, ${num(c.max)})`);
    else if (c.mode === "object") block.lines.push(`  .spriteScale({ x: ${num(c.scaleX)}, y: ${num(c.scaleY)} })`);
    else block.lines.push(`  .spriteScale(${num(c.scale)})`);
  }
});

VisualencerNodeTypes.register("anchor", {
  label: "Anchor",
  category: "effect",
  role: "child",
  families: ["effect","scrollingText"],
  createConfig() {
    return { mode: "uniform", anchor: 0.5, x: 0.5, y: 0.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "uniform") block.lines.push(`  .anchor(${num(c.anchor)})`);
    else block.lines.push(`  .anchor({ x: ${num(c.x)}, y: ${num(c.y)} })`);
  }
});

VisualencerNodeTypes.register("spriteAnchor", {
  label: "Sprite Anchor",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mode: "uniform", anchor: 0.5, x: 0.5, y: 0.5 };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.mode === "uniform") block.lines.push(`  .spriteAnchor(${num(c.anchor)})`);
    else block.lines.push(`  .spriteAnchor({ x: ${num(c.x)}, y: ${num(c.y)} })`);
  }
});

VisualencerNodeTypes.register("center", {
  label: "Center",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return {}; },
  compileChild(_node, block, _ctx) {
    block.lines.push("  .center()");
  }
});

VisualencerNodeTypes.register("mirror", {
  label: "Mirror",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return { mirrorX: false, mirrorY: false, randomMirrorX: false, randomMirrorY: false };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.mirrorX) block.lines.push("  .mirrorX(true)");
    if (c.mirrorY) block.lines.push("  .mirrorY(true)");
    if (c.randomMirrorX) block.lines.push("  .randomizeMirrorX(true)");
    if (c.randomMirrorY) block.lines.push("  .randomizeMirrorY(true)");
  }
});

VisualencerNodeTypes.register("spriteRotation", {
  label: "Sprite Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { rotation: 0 }; },
  compileChild(node, block, _ctx) {
    const r = Number(node.config?.rotation);
    if (Number.isFinite(r)) block.lines.push(`  .spriteRotation(${r})`);
  }
});

VisualencerNodeTypes.register("randomRotation", {
  label: "Random Rotation",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .randomRotation()");
  }
});

VisualencerNodeTypes.register("playbackRate", {
  label: "Playback Rate",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { rate: 1 }; },
  compileChild(node, block, _ctx) {
    const r = Number(node.config?.rate);
    if (Number.isFinite(r)) block.lines.push(`  .playbackRate(${r})`);
  }
});

VisualencerNodeTypes.register("layering", {
  label: "Layering",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      belowTokens: false,
      belowTiles: false,
      aboveLighting: false,
      aboveInterface: false,
      zIndex: 0,
      sortLayer: 0
    };
  },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    const { num } = VHelpers;
    if (c.belowTokens) block.lines.push("  .belowTokens(true)");
    if (c.belowTiles) block.lines.push("  .belowTiles(true)");
    if (c.aboveLighting) block.lines.push("  .aboveLighting(true)");
    if (c.aboveInterface) block.lines.push("  .aboveInterface(true)");
    if (num(c.zIndex)) block.lines.push(`  .zIndex(${num(c.zIndex)})`);
    if (num(c.sortLayer)) block.lines.push(`  .sortLayer(${num(c.sortLayer)})`);
  }
});

VisualencerNodeTypes.register("animateProperty", {
  label: "Animate Property",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      target: "sprite",
      property: "position.x",
      from: 0,
      to: 100,
      duration: 500,
      ease: "linear",
      delay: 0,
      gridUnits: false,
      fromEnd: false,
      absolute: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    opts.push(`from: ${num(c.from)}`);
    opts.push(`to: ${num(c.to)}`);
    opts.push(`duration: ${num(c.duration)}`);
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    if (c.gridUnits) opts.push("gridUnits: true");
    if (c.fromEnd) opts.push("fromEnd: true");
    if (c.absolute) opts.push("absolute: true");
    block.lines.push(`  .animateProperty("${esc(c.target || "sprite")}", "${esc(c.property || "position.x")}", { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("loopProperty", {
  label: "Loop Property",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      target: "sprite",
      property: "position.x",
      from: 0,
      to: 100,
      duration: 500,
      ease: "linear",
      delay: 0,
      pingPong: false,
      loops: 0,
      gridUnits: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num, esc } = VHelpers;
    const c = node.config || {};
    const opts = [];
    opts.push(`from: ${num(c.from)}`);
    opts.push(`to: ${num(c.to)}`);
    opts.push(`duration: ${num(c.duration)}`);
    if (c.ease?.trim()) opts.push(`ease: "${esc(c.ease)}"`);
    if (num(c.delay)) opts.push(`delay: ${num(c.delay)}`);
    if (c.pingPong) opts.push("pingPong: true");
    if (num(c.loops)) opts.push(`loops: ${num(c.loops)}`);
    if (c.gridUnits) opts.push("gridUnits: true");
    block.lines.push(`  .loopProperty("${esc(c.target || "sprite")}", "${esc(c.property || "position.x")}", { ${opts.join(", ")} })`);
  }
});

VisualencerNodeTypes.register("filter", {
  label: "Filter",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { filter: "", options: "{}" }; },
  compileChild(node, block, _ctx) {
    const name = (node.config?.filter || "").trim();
    if (!name) {
      console.debug("Visualencer: filter node has no filter name", node.config);
      return;
    }
    block.lines.push(`  .filter("${VHelpers.esc(name)}", ${node.config.options || "{}"})`);
  }
});

VisualencerNodeTypes.register("shape", {
  label: "Shape",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { type: "circle", options: "{ radius: 1 }" }; },
  compileChild(node, block, _ctx) {
    const type = (node.config?.type || "").trim();
    if (!type) return;
    block.lines.push(`  .shape("${VHelpers.esc(type)}", ${node.config?.options || "{}"})`);
  }
});

VisualencerNodeTypes.register("xray", {
  label: "XRay",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { enabled: true }; },
  compileChild(node, block, _ctx) {
    if (node.config?.enabled) block.lines.push("  .xray(true)");
  }
});

VisualencerNodeTypes.register("mask", {
  label: "Mask",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { mode: "source", ids: "" }; },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.mode === "source") {
      block.lines.push("  .mask()");
      return;
    }
    const ids = (c.ids || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!ids.length) return;
    const arr = ids.map((v) => `"${VHelpers.esc(v)}"`).join(",");
    block.lines.push(`  .mask([${arr}])`);
  }
});

VisualencerNodeTypes.register("tieToDocuments", {
  label: "Tie To Documents",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { uuids: "" }; },
  compileChild(node, block, _ctx) {
    const ids = (node.config?.uuids || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!ids.length) return;
    const arr = ids.map((v) => `"${VHelpers.esc(v)}"`).join(",");
    block.lines.push(`  .tieToDocuments([${arr}])`);
  }
});

VisualencerNodeTypes.register("syncGroup", {
  label: "Sync Group",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { name: "" }; },
  compileChild(node, block, _ctx) {
    const name = (node.config?.name || "").trim();
    if (name) block.lines.push(`  .syncGroup("${VHelpers.esc(name)}")`);
  }
});

VisualencerNodeTypes.register("isometric", {
  label: "Isometric",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() { return { overlay: false }; },
  compileChild(node, block, _ctx) {
    const c = node.config || {};
    if (c.overlay) block.lines.push("  .isometric({ overlay: true })");
    else block.lines.push("  .isometric(true)");
  }
});

VisualencerNodeTypes.register("screenSpace", {
  label: "Screen Space",
  category: "effect",
  role: "child",
  families: ["effect"],
  createConfig() {
    return {
      screenSpace: true,
      aboveUI: false,
      anchor: 0.5,
      anchorX: 0.5,
      anchorY: 0.5,
      posX: 0,
      posY: 0,
      scaleX: 1,
      scaleY: 1,
      fitX: false,
      fitY: false,
      ratioX: false,
      ratioY: false
    };
  },
  compileChild(node, block, _ctx) {
    const { num } = VHelpers;
    const c = node.config || {};
    if (c.screenSpace) block.lines.push("  .screenSpace(true)");
    if (c.aboveUI) block.lines.push("  .screenSpaceAboveUI(true)");
    block.lines.push(`  .screenSpaceAnchor({ x: ${num(c.anchorX ?? c.anchor)}, y: ${num(c.anchorY ?? c.anchor)} })`);
    block.lines.push(`  .screenSpacePosition({ x: ${num(c.posX)}, y: ${num(c.posY)} })`);
    block.lines.push(
      `  .screenSpaceScale({ x: ${num(c.scaleX)}, y: ${num(c.scaleY)}, fitX: ${!!c.fitX}, fitY: ${!!c.fitY}, ratioX: ${!!c.ratioX}, ratioY: ${!!c.ratioY} })`
    );
  }
});

/* =========================
 * Sound Specific
 * ======================= */

VisualencerNodeTypes.register("radius", {
  label: "Radius",
  category: "sound",
  role: "child",
  families: ["sound"],
  createConfig() {
    return { radius: 0 };
  },
  compileChild(node, block, _ctx) {
    const r = VHelpers.num(node.config?.radius);
    if (r > 0) block.lines.push(`  .radius(${r})`);
  }
});

VisualencerNodeTypes.register("constrainedByWalls", {
  label: "Constrained By Walls",
  category: "sound",
  role: "child",
  families: ["sound"],
  createConfig() {
    return { constrainedByWalls: false };
  },
  compileChild(node, block, _ctx) {
    if (node.config?.constrainedByWalls) {
      block.lines.push("  .constrainedByWalls(true)");
    }
  }
});

VisualencerNodeTypes.register("distanceEasing", {
  label: "Distance Easing",
  category: "sound",
  role: "child",
  families: ["sound"],
  createConfig() {
    return { distanceEasing: true };
  },
  compileChild(node, block, _ctx) {
    const flag = node.config?.distanceEasing;
    const normalized = typeof flag === "string" ? flag.trim().toLowerCase() : flag;
    if (normalized === true || normalized === "true") {
      block.lines.push("  .distanceEasing(true)");
    } else if (normalized === false || normalized === "false") {
      block.lines.push("  .distanceEasing(false)");
    }
  }
});

VisualencerNodeTypes.register("audioChannel", {
  label: "Audio Channel",
  category: "sound",
  role: "child",
  families: ["sound"],
  createConfig() {
    return { audioChannel: "" };
  },
  compileChild(node, block, _ctx) {
    const raw = (node.config?.audioChannel || "").trim();
    if (!raw) return;
    block.lines.push(`  .audioChannel("${VHelpers.esc(raw)}")`);
  }
});

VisualencerNodeTypes.register("alwaysForGMs", {
  label: "Always For GMs",
  category: "sound",
  role: "child",
  families: ["sound"],
  createConfig() {
    return { alwaysForGMs: false };
  },
  compileChild(node, block, _ctx) {
    if (node.config?.alwaysForGMs) {
      block.lines.push("  .alwaysForGMs(true)");
    }
  }
});

function buildSoundEffectConfig(cfg) {
  const type = (cfg?.type || "").trim();
  const intensity = VHelpers.num(cfg?.intensity);
  if (!type) return null;
  const parts = [`type: \"${VHelpers.esc(type)}\"`];
  if (Number.isFinite(intensity) && intensity !== 0) parts.push(`intensity: ${intensity}`);
  return `{ ${parts.join(", ")} }`;
}

VisualencerNodeTypes.register("baseEffect", {
  label: "Base Effect",
  category: "sound",
  role: "child",
  families: ["sound"],
  createConfig() {
    return { type: "", intensity: 0 };
  },
  compileChild(node, block, _ctx) {
    const cfg = buildSoundEffectConfig(node.config);
    if (!cfg) return;
    block.lines.push(`  .baseEffect(${cfg})`);
  }
});

VisualencerNodeTypes.register("muffledEffect", {
  label: "Muffled Effect",
  category: "sound",
  role: "child",
  families: ["sound"],
  createConfig() {
    return { type: "", intensity: 0 };
  },
  compileChild(node, block, _ctx) {
    const cfg = buildSoundEffectConfig(node.config);
    if (!cfg) return;
    block.lines.push(`  .muffledEffect(${cfg})`);
  }
});


