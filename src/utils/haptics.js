let iosSwitchLabel = null;
let audioCtx = null;
let debugTimers = [];

const HAPTIC_PATTERNS = {
  light: 12,
  medium: 22,
  cardSettle: [10, 35, 18],
  cardCascade: 10,
  success: [14, 50, 24],
  error: [35, 45, 35],
};

// Reproduce un pulso grave (tipo Taptic Engine) para escuchar el ritmo en PC
const playHapticThump = (durationMs) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(68, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(36, audioCtx.currentTime + durationMs / 1000);

    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {}
};

// Simulador visual en pantalla (solo activo en localhost / desarrollo)
const simulateHapticInDesktop = (type, pattern) => {
  if (typeof document === "undefined") return;

  const sequence = Array.isArray(pattern) ? pattern : [pattern];
  debugTimers.forEach((t) => window.clearTimeout(t));
  debugTimers = [];

  // Crear o reutilizar el badge flotante arriba a la derecha
  let badge = document.getElementById("nx-haptic-debugger");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "nx-haptic-debugger";
    badge.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(17, 24, 39, 0.92);
      color: #FFFFFF;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      pointer-events: none;
      opacity: 0;
      transform: translateY(-6px);
      transition: opacity 0.15s ease, transform 0.15s ease;
    `;
    badge.innerHTML = `
      <span id="nx-haptic-dot" style="width:9px;height:9px;border-radius:50%;background:#4ADE80;transition:transform 0.06s ease,opacity 0.06s ease;"></span>
      <span id="nx-haptic-text"></span>
    `;
    document.body.appendChild(badge);
  }

  const dot = document.getElementById("nx-haptic-dot");
  const text = document.getElementById("nx-haptic-text");
  const phoneEl = document.querySelector(".phone");

  text.textContent = `Haptic · ${type} (${JSON.stringify(pattern)} ms)`;
  badge.style.opacity = "1";
  badge.style.transform = "translateY(0)";

  console.debug(`[Haptic] ${type}:`, pattern);

  // Ejecutar cada tramo [vibrar, pausa, vibrar...] en tiempo real
  let elapsed = 0;
  sequence.forEach((ms, index) => {
    const isVibratePhase = index % 2 === 0;

    if (isVibratePhase) {
      // Inicio del pulso
      debugTimers.push(
        window.setTimeout(() => {
          playHapticThump(Math.max(ms, 18));
          if (dot) {
            dot.style.transform = "scale(1.65)";
            dot.style.background = "#4ADE80";
          }
          if (phoneEl) {
            phoneEl.style.transform = "translate3d(1.5px, -1px, 0)";
          }
        }, elapsed)
      );

      // Fin del pulso
      debugTimers.push(
        window.setTimeout(() => {
          if (dot) {
            dot.style.transform = "scale(1)";
            dot.style.background = "#6B7280";
          }
          if (phoneEl) {
            phoneEl.style.transform = "";
          }
        }, elapsed + Math.max(ms, 25))
      );
    }

    elapsed += ms;
  });

  // Ocultar el indicador al terminar
  debugTimers.push(
    window.setTimeout(() => {
      badge.style.opacity = "0";
      badge.style.transform = "translateY(-6px)";
    }, elapsed + 650)
  );
};

const triggerIOSHaptic = () => {
  if (typeof document === "undefined") return;
  try {
    if (!iosSwitchLabel) {
      const id = "nx-ios-haptic-switch";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.setAttribute("switch", "");
      input.style.cssText = "position:fixed;top:-100px;left:-100px;opacity:0;pointer-events:none;";

      const label = document.createElement("label");
      label.htmlFor = id;
      label.style.cssText = "position:fixed;top:-100px;left:-100px;opacity:0;pointer-events:none;";

      document.body.appendChild(input);
      document.body.appendChild(label);
      iosSwitchLabel = label;
    }
    iosSwitchLabel.click();
  } catch {}
};

export const triggerHaptic = (type = "light") => {
  if (typeof window === "undefined") return;

  const pattern = HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.light;

  // En desarrollo en PC (cuando no es pantalla táctil móvil), mostramos el simulador
  const isDesktopDev = import.meta.env?.DEV && window.matchMedia?.("(pointer: fine)")?.matches;
  if (isDesktopDev) {
    simulateHapticInDesktop(type, pattern);
  }

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
      return;
    } catch {}
  }

  triggerIOSHaptic();
};