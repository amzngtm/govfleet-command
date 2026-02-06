// Advanced UX Features Service
// Voice commands, holographic effects, animations, keyboard shortcuts

export interface VoiceCommand {
  phrase: string;
  action: string;
  description: string;
  parameters?: Array<{ name: string; type: string }>;
}

// Voice Command Recognition
export const VoiceCommands = {
  isSupported: (): boolean => {
    if (typeof window === "undefined") return false;
    return (
      !!(window as any).SpeechRecognition ||
      !!(window as any).webkitSpeechRecognition
    );
  },

  startListening: (
    onCommand: (command: string, confidence: number) => void,
    onError?: (error: string) => void,
  ): (() => void) | null => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.("Speech recognition not supported");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      const confidence = event.results[last][0].confidence;
      onCommand(command, confidence);
    };

    recognition.onerror = (event: any) => {
      onError?.(event.error);
    };

    recognition.start();

    return () => recognition.stop();
  },

  // Predefined commands
  commands: [
    {
      phrase: "create mission",
      action: "OPEN_DISPATCH_WIZARD",
      description: "Open dispatch wizard",
    },
    {
      phrase: "new dispatch",
      action: "OPEN_DISPATCH_WIZARD",
      description: "Create new dispatch",
    },
    {
      phrase: "show map",
      action: "VIEW_MAP",
      description: "Switch to map view",
    },
    {
      phrase: "show fleet",
      action: "VIEW_FLEET",
      description: "View fleet registry",
    },
    {
      phrase: "show missions",
      action: "VIEW_MISSIONS",
      description: "View active missions",
    },
    {
      phrase: "next mission",
      action: "NEXT_MISSION",
      description: "View next scheduled mission",
    },
    {
      phrase: "report incident",
      action: "REPORT_INCIDENT",
      description: "Report new incident",
    },
    { phrase: "search", action: "OPEN_SEARCH", description: "Open search" },
    { phrase: "help", action: "SHOW_HELP", description: "Show help" },
    {
      phrase: "take screenshot",
      action: "TAKE_SCREENSHOT",
      description: "Take screenshot",
    },
  ] as VoiceCommand[],

  parseCommand: (
    transcript: string,
  ): { action: string; params: Record<string, any> } | null => {
    const normalized = transcript.toLowerCase().trim();

    for (const cmd of VoiceCommands.commands) {
      if (normalized.includes(cmd.phrase)) {
        return { action: cmd.action, params: {} };
      }
    }

    return null;
  },
};

// Holographic Effects
export const HolographicEffects = {
  // Glow effect for critical elements
  createGlow: (element: HTMLElement, color: string = "#0ea5e9"): void => {
    element.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`;
    element.style.animation = "holographicPulse 2s ease-in-out infinite";
  },

  // Remove glow effect
  removeGlow: (element: HTMLElement): void => {
    element.style.boxShadow = "";
    element.style.animation = "";
  },

  // Add holographic border
  addHoloBorder: (element: HTMLElement, color: string = "#0ea5e9"): void => {
    element.style.position = "relative";
    element.style.overflow = "hidden";

    const before = document.createElement("div");
    before.style.cssText = `
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, transparent, ${color}, transparent);
      z-index: -1;
      animation: holoSpin 3s linear infinite;
    `;

    element.insertBefore(before, element.firstChild);
  },

  // Add scanning line animation
  addScanLine: (element: HTMLElement): void => {
    element.style.position = "relative";
    element.style.overflow = "hidden";

    const scan = document.createElement("div");
    scan.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
      animation: scanLine 2s linear infinite;
    `;

    element.appendChild(scan);
  },
};

// Advanced Animations
export const Animations = {
  // Fade in with stagger
  staggerFadeIn: (elements: HTMLElement[], delay: number = 100): void => {
    elements.forEach((el, index) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.3s ease, transform 0.3s ease";

      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, index * delay);
    });
  },

  // Number counter animation
  counter: (
    element: HTMLElement,
    from: number,
    to: number,
    duration: number = 1000,
    suffix: string = "",
  ): void => {
    const startTime = performance.now();

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = from + (to - from) * easeOutQuart;

      element.textContent = Math.round(current) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  },

  // Shake animation for errors
  shake: (element: HTMLElement): void => {
    element.style.animation = "shake 0.5s ease-in-out";
    setTimeout(() => {
      element.style.animation = "";
    }, 500);
  },

  // Pulse animation for attention
  pulse: (element: HTMLElement, color: string = "#ef4444"): void => {
    element.style.transition = "box-shadow 0.3s ease";
    element.style.boxShadow = `0 0 0 0 ${color}`;

    requestAnimationFrame(() => {
      element.style.boxShadow = `0 0 0 20px ${color}40`;
    });

    setTimeout(() => {
      element.style.boxShadow = "";
    }, 300);
  },

  // Flip card animation
  flipCard: (element: HTMLElement): void => {
    element.style.transform = "rotateY(180deg)";
    element.style.transition = "transform 0.6s";
    element.style.transformStyle = "preserve-3d";
  },
};

// Sound Effects
export const SoundEffects = {
  sounds: {
    alert: new Audio("/sounds/alert.mp3"),
    complete: new Audio("/sounds/complete.mp3"),
    error: new Audio("/sounds/error.mp3"),
    notification: new Audio("/sounds/notification.mp3"),
    click: new Audio("/sounds/click.mp3"),
    missionAssigned: new Audio("/sounds/mission.mp3"),
  },

  play: (name: keyof typeof SoundEffects.sounds): void => {
    const sound = SoundEffects.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore autoplay errors
    }
  },

  playWithVolume: (
    name: keyof typeof SoundEffects.sounds,
    volume: number,
  ): void => {
    const sound = SoundEffects.sounds[name];
    if (sound) {
      sound.volume = Math.min(Math.max(volume, 0), 1);
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  },
};

// Theme Manager
export const ThemeManager = {
  currentTheme: "dark" as "dark" | "light",

  setTheme: (theme: "dark" | "light" | "system"): void => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      theme = prefersDark ? "dark" : "light";
    }

    ThemeManager.currentTheme = theme;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("govfleet-theme", theme);
  },

  toggle: (): void => {
    const newTheme = ThemeManager.currentTheme === "dark" ? "light" : "dark";
    ThemeManager.setTheme(newTheme);
  },

  init: (): void => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("govfleet-theme") as
      | "dark"
      | "light"
      | null;
    ThemeManager.setTheme(saved || "dark");
  },
};

// Mini-Game Manager (Easter Eggs)
export const MiniGames = {
  // Konami code easter egg
  konamiSequence: [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ],
  currentIndex: 0,

  checkKonamiCode: (key: string): boolean => {
    if (key === MiniGames.konamiSequence[MiniGames.currentIndex]) {
      MiniGames.currentIndex++;
      if (MiniGames.currentIndex === MiniGames.konamiSequence.length) {
        MiniGames.activateSecretMode();
        MiniGames.currentIndex = 0;
        return true;
      }
    } else {
      MiniGames.currentIndex = 0;
    }
    return false;
  },

  activateSecretMode: (): void => {
    // Add party mode effects
    const style = document.createElement("style");
    style.textContent = `
      @keyframes partyMode {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
      .party-mode {
        animation: partyMode 2s linear infinite;
      }
    `;
    document.head.appendChild(style);

    document.body.classList.add("party-mode");
    alert("🎉 PARTY MODE ACTIVATED! 🎉");
    SoundEffects.play("complete");
  },

  // Matrix mode
  activateMatrixMode: (): void => {
    const canvas = document.createElement("canvas");
    canvas.id = "matrix-canvas";
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.3;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = canvas.width / 20;
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) drops[i] = 1;

    const chars = "01";

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0f0";
      ctx.font = "15px monospace";

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    // Store interval for cleanup
    (canvas as any).intervalId = interval;
  },

  deactivateMatrixMode: (): void => {
    const canvas = document.getElementById("matrix-canvas");
    if (canvas) {
      clearInterval((canvas as any).intervalId);
      canvas.remove();
    }
  },
};

// Accessibility Enhancements
export const Accessibility = {
  // Announce to screen readers
  announce: (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ): void => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      announcement.remove();
    }, 1000);
  },

  // Focus trap for modals
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);

    return () => element.removeEventListener("keydown", handleKeyDown);
  },

  // Reduce motion preference
  prefersReducedMotion: (): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  // High contrast mode
  isHighContrast: (): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-contrast: more)").matches;
  },
};

// Export CSS animations
export const injectAnimationStyles = (): void => {
  if (typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes holographicPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    
    @keyframes holoSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes scanLine {
      from { top: 0; }
      to { top: 100%; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
    
    @keyframes data-flow {
      from { background-position: 0 0; }
      to { background-position: 100% 100%; }
    }
    
    .holographic {
      background: linear-gradient(135deg, 
        rgba(14, 165, 233, 0.1), 
        rgba(139, 92, 246, 0.1), 
        rgba(14, 165, 233, 0.1)
      );
      backdrop-filter: blur(10px);
      border: 1px solid rgba(14, 165, 233, 0.3);
    }
    
    .data-flow-bg {
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(14, 165, 233, 0.03) 10px,
        rgba(14, 165, 233, 0.03) 20px
      );
      background-size: 200% 200%;
      animation: data-flow 5s linear infinite;
    }
  `;

  document.head.appendChild(style);
};

export default {
  VoiceCommands,
  HolographicEffects,
  Animations,
  SoundEffects,
  ThemeManager,
  MiniGames,
  Accessibility,
  injectAnimationStyles,
};
