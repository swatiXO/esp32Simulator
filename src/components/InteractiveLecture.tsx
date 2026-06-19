'use client';
import DOMPurify from 'isomorphic-dompurify';
import React, { useState, useEffect } from 'react';
import { LECTURES_STRUCTURED_DATA, LectureSection, LectureBlock, QuizQuestion } from '@/lib/lecturesStructuredData';
import { createClient } from '@/utils/supabase/client';

interface InteractiveLectureProps {
  levelId: string | number;
  lessonId: string;
  stepId: string;
}

/* ─── Design tokens (PCB / diagnostic console palette) ───
   BASE    #0A120D  substrate background
   PANEL   #0F1B14  component panel
   PANEL2  #0A120D  recessed panel
   BORDER  #23362A  hairline border
   SILK    #EDF3EE  primary text (silkscreen white)
   SILK_DIM #9FB3A8 secondary text
   SILK_FAINT #5C6E64 muted text
   COPPER  #C9824F  trace / highlight accent
   GREEN   #4ADE80  signal / correct / read
   CYAN    #5EEAD4  info / AI accent
   AMBER   #F2B25C  warning / hint
   RED     #F87171  error / incorrect
*/

/* ─── Premium SVG Icons ─── */
const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconBrain = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 6v12" />
    <path d="M8 10c0-1.5 1-2.5 2-2.5s2 1 2 2.5v4c0 1.5-1 2.5-2 2.5s-2-1-2-2.5" />
    <path d="M12 10c0-1.5 1-2.5 2-2.5s2 1 2 2.5v4c0 1.5-1 2.5-2 2.5s-2-1-2-2.5" />
  </svg>
);

const IconVolume2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const IconVolumeX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconLightbulb = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ─── Emoji Stripping Helper ─── */
const stripEmojis = (str: string): string => {
  if (!str) return '';
  return str.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2b1b}\u{2b1c}\u{2b50}\u{2b55}\u{303d}\u{3297}\u{3299}\u{23E9}-\u{23EF}\u{23F0}\u{23F3}\u{23F8}-\u{23FA}\u{200D}\u{FE0F}]/gu, '').trim();
};

/* ─── Glossary Dictionary for Technical Key Terms ─── */
const GLOSSARY: Record<string, string> = {
  'ESP32': 'A powerful yet cheap microcontroller with built-in Wi-Fi and Bluetooth, widely used for IoT and smart hardware projects.',
  'microcontroller': 'A compact integrated circuit designed to govern a specific operation in an embedded system, containing a processor, memory, and I/O pins.',
  'pinMode': 'A configuration command that defines whether a specific pin behaves as an INPUT (to read sensors) or an OUTPUT (to send power).',
  'OUTPUT': 'A pin configuration mode where the controller pushes voltage (3.3V or 0V) out to control external components like LEDs or motors.',
  'INPUT': 'A pin configuration mode where the controller listens to external voltage levels, used to read switches, buttons, and sensors.',
  'HIGH': 'The active ON state in digital control, applying full system voltage (3.3V) to a pin.',
  'LOW': 'The inactive OFF state in digital control, pulling the pin voltage down to ground level (0V).',
  'digitalWrite': 'A command that sets a digital pin to either HIGH (ON) or LOW (OFF) state.',
  'digitalRead': 'A command that checks whether a digital pin is receiving HIGH or LOW electrical signals.',
  'analogWrite': 'A command used to simulate analog voltages on digital pins using high-frequency Pulse Width Modulation (PWM).',
  'analogRead': 'A command that converts incoming variable voltage into a numerical value (0 to 4095 on the controller).',
  'PWM': 'Pulse Width Modulation—a technique to control average voltage by pulsing a digital signal ON and OFF at very high speeds.',
  'LDR': 'Light Dependent Resistor—a sensor whose physical resistance decreases when exposed to bright light.',
  'Photoresistor': 'Another term for an LDR, a sensor that measures light intensity.',
  'Duty Cycle': 'The percentage of time a digital signal remains HIGH compared to the total period of one ON/OFF pulse cycle.',
  'map': 'A mathematical function that scales a value from one source range (e.g., 0-4095) to a target range (e.g., 0-255) proportionally.',
  'Setup': 'A mandatory function in microcontroller code that runs once when power is applied, used to configure initial pin behaviors.',
  'Loop': 'A mandatory function in microcontroller code that repeats forever in a continuous cycle after the setup function completes.',
  'delay': 'An instruction that pauses code execution for a set duration of time (measured in milliseconds).',
  'variable': 'A labeled memory space in a program used to store and manipulate dynamic values (like sensor readings or counters).',
  'counter': 'A specific variable used to keep track of increments or occurrences of events in loops.',
  'Logical AND': 'A logical operation that returns true only if all of its comparison conditions are simultaneously true.',
  'Logical OR': 'A logical operation that returns true if at least one of its comparison conditions is true.',
  'Logical NOT': 'A logical operation that inverts a boolean value (turning true to false, and false to true).',
  'For Loop': 'A control structure used to repeat a block of code a specific, pre-determined number of times.',
  'While Loop': 'A control structure that continues to repeat a block of code as long as its specified condition remains true.',
  'nesting': 'The practice of placing one control structure (like an if statement or loop) inside another control structure.',
  'feedback control loop': 'A continuous system process that reads inputs, evaluates actions, and applies adjustments to match a desired target state automatically.'
};

/* ─── Browser Web Audio API sound chime synthesizer (unchanged) ─── */
const playSound = (type: 'correct' | 'incorrect') => {
  if (typeof window === 'undefined') return;
  const isMuted = localStorage.getItem('lecture_audio_muted') === 'true';
  if (isMuted) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();

    if (type === 'correct') {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } else {
      const now = ctx.currentTime;
      [150, 147].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      });
    }
  } catch (e) {
  }
};

/* ─── Confetti Particle Canvas Shower (recolored to board palette) ─── */
function ConfettiShower() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const colors = ['#4ADE80', '#5EEAD4', '#C9824F', '#F2B25C', '#EDF3EE'];
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    for (let i = 0; i < 90; i++) {
      const fromLeft = Math.random() > 0.5;
      particles.push({
        x: fromLeft ? 0 : width,
        y: height,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (fromLeft ? 1 : -1) * (Math.random() * 9 + 4),
        speedY: -(Math.random() * 11 + 9),
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 12 - 6
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.22;
        p.speedX *= 0.98;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-[20px]" />;
}

/* ─── Callout: "component spec sticker" with bracket corners + label tag ─── */
function Callout({
  icon,
  children,
  bg,
  border,
  text,
  label,
}: {
  icon?: string;
  children: React.ReactNode;
  bg?: string;
  border?: string;
  text?: string;
  label?: string;
}) {
  let IconComponent = IconLightbulb;
  let derivedLabel = 'NOTE';
  let derivedAccent = '#5EEAD4';

  if (icon) {
    if (icon.includes('⚠️') || icon.includes('🚨') || icon.includes('⚡')) {
      IconComponent = IconAlertTriangle; derivedLabel = 'WARNING'; derivedAccent = '#F2B25C';
    } else if (icon.includes('🎉') || icon.includes('✅') || icon.includes('🏆') || icon.includes('✓')) {
      IconComponent = IconCheckCircle; derivedLabel = 'CORRECT'; derivedAccent = '#4ADE80';
    } else if (icon.includes('ℹ️') || icon.includes('📌') || icon.includes('🔧') || icon.includes('💡')) {
      IconComponent = IconInfo; derivedLabel = 'INFO'; derivedAccent = '#5EEAD4';
    }
  }

  const finalLabel = label || derivedLabel;
  const accent = text || derivedAccent;
  const isDefaultLight = bg === '#EFF6FF' || !bg;
  const cardBg = isDefaultLight ? 'rgba(94,234,212,0.05)' : bg;
  const cardBorder = isDefaultLight ? 'rgba(94,234,212,0.25)' : border;

  return (
    <div
      className="relative rounded-xl px-5 pt-6 pb-4 text-sm md:text-base shadow-sm border transition-all duration-300"
      style={{ background: cardBg, borderColor: cardBorder }}
    >
      <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: accent }} />
      <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: accent }} />
      <span
        className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest bg-[#0A120D] border"
        style={{ color: accent, borderColor: accent }}
      >
        {finalLabel}
      </span>
      <div className="flex items-start gap-3.5">
        <span className="flex-shrink-0 mt-0.5" style={{ color: accent }}>
          <IconComponent />
        </span>
        <span className="leading-relaxed font-medium text-[#EDF3EE]">{children}</span>
      </div>
    </div>
  );
}

/* ─── Bullet "via pad" Icons ─── */
function BulletIcon({ styleIndex, color }: { styleIndex: number; color: string; blockIndex: number }) {
  switch (styleIndex) {
    case 0: // Glow via
      return (
        <div className="flex-shrink-0 mt-1 relative w-3.5 h-3.5 flex items-center justify-center">
          <span className="absolute w-2.5 h-2.5 rounded-full transition-all duration-300 animate-pulse" style={{ background: color }} />
          <span className="absolute w-3.5 h-3.5 rounded-full opacity-20 animate-ping" style={{ background: color }} />
        </div>
      );
    case 1: // Component pad (square + via)
      return (
        <div className="flex-shrink-0 mt-1.5 relative w-2.5 h-2.5 flex items-center justify-center border transition-all duration-300 hover:rotate-45" style={{ borderColor: color }}>
          <span className="absolute w-1 h-1 rounded-full" style={{ background: color }} />
        </div>
      );
    case 2: // Signal arrow
      return (
        <div className="flex-shrink-0 mt-1.5 text-[10px] leading-none font-black font-mono transition-transform duration-300 hover:translate-x-0.5" style={{ color }}>
          ▶
        </div>
      );
    case 3: // Test point marker
      return (
        <div className="flex-shrink-0 mt-1 w-2.5 h-2.5 rounded-full border-2 transition-transform hover:scale-110" style={{ borderColor: '#F2B25C', background: 'transparent' }} />
      );
    case 4:
    default: // Hex pin
      return (
        <div className="flex-shrink-0 mt-1.5 w-2.5 h-2.5 flex items-center justify-center transition-all duration-300 hover:scale-110">
          <svg viewBox="0 0 100 100" className="w-2.5 h-2.5" fill={color}>
            <polygon points="50,1 95,25 95,75 50,99 5,75 5,25" />
          </svg>
        </div>
      );
  }
}

/* ─── Unified Bullet Item Picker (unchanged logic) ─── */
const getBulletStyleIndex = (text: string) => {
  let hash = 0;
  for (let j = 0; j < text.length; j++) {
    hash = text.charCodeAt(j) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 5;
};

function BulletItem({
  text,
  blockIndex,
  styleIndex,
  color,
  highlightText
}: {
  text: string;
  blockIndex: number;
  styleIndex: number;
  color: string;
  highlightText: (t: string) => React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3.5 pl-1 my-2.5 animate-fadeIn group">
      <BulletIcon styleIndex={styleIndex} color={color} blockIndex={blockIndex} />
      <span className="flex-1 leading-relaxed text-base text-[#C7D6CC] transition-colors duration-200 group-hover:text-[#EDF3EE]">
        {highlightText(text)}
      </span>
    </div>
  );
}

/* ─── Code Block: oscilloscope-style terminal ─── */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  };
  return (
    <div className="my-5 rounded-xl overflow-hidden border border-[#23362A] shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F1B14] border-b border-[#23362A]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F87171]/70" />
          <span className="w-2 h-2 rounded-full bg-[#F2B25C]/70" />
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]/70" />
          <span className="ml-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#93A89C]">
            {lang || 'code'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[10px] font-mono font-bold px-3 py-1 rounded-md border border-[#23362A] text-[#93A89C] hover:text-[#8B5CF6] hover:border-[#8B5CF6]/40 transition-all duration-200 active:scale-95"
        >
          {copied ? 'COPIED ✓' : 'COPY'}
        </button>
      </div>
      <pre className="px-5 py-4 bg-[#070C09] text-[#4ADE80] text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

/* ─── Reveal Block: "probe a test point" ─── */
function RevealBlock({ question, answer, accentColor }: { question: string; answer: string; accentColor: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div
      className="my-4 rounded-xl border border-dashed overflow-hidden animate-fadeIn bg-[#0F1B14]/50"
      style={{ borderColor: accentColor + '50' }}
    >
      <button
        type="button"
        onClick={() => setRevealed(r => !r)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors duration-200 hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="flex-shrink-0 font-mono text-[10px] font-bold px-2 py-1 rounded border"
            style={{ color: accentColor, borderColor: accentColor + '60' }}
          >
            TP
          </span>
          <span className="text-sm md:text-base font-semibold text-[#EDF3EE] leading-snug">{question}</span>
        </div>
        <span
          className="ml-3 flex-shrink-0 font-mono text-[10px] font-black px-3 py-1.5 rounded-md text-[#0A120D] transition-all duration-300"
          style={{ background: revealed ? '#4ADE80' : accentColor }}
        >
          {revealed ? 'PROBED' : 'PROBE'}
        </span>
      </button>
      {revealed && (
        <div
          className="px-5 py-4 border-t border-dashed text-sm md:text-base text-[#C7D6CC] leading-relaxed font-medium animate-slideDown flex items-start gap-3"
          style={{ borderColor: accentColor + '35' }}
        >
          <span className="font-mono font-bold flex-shrink-0" style={{ color: '#4ADE80' }}>&gt;</span>
          <span>{answer}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Preprocessed Render Type for Side-by-Side Comparison Grid ─── */
type RenderItem =
  | { type: 'block'; block: LectureBlock; blockIndex: number }
  | {
    type: 'list';
    bullets: Array<{ text: string; blockIndex: number }>;
    styleIndex: number;
  }
  | {
    type: 'comparison';
    leftTitle: string;
    leftBullets: Array<{ text: string; blockIndex: number }>;
    leftStyleIndex: number;
    rightTitle: string;
    rightBullets: Array<{ text: string; blockIndex: number }>;
    rightStyleIndex: number;
  };

/* ─── Collapsible Panel Section ─── */
interface SectionProps {
  sec: LectureSection;
  isRead: boolean;
  onToggleRead: () => void;
}

function SectionCard({ sec, isRead, onToggleRead }: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || isRead) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onToggleRead();
          observer.disconnect();
        }
      },
      { threshold: 1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isOpen, isRead]);

  const highlightText = (text: string) => {
    const terms = Object.keys(GLOSSARY);
    terms.sort((a, b) => b.length - a.length);

    let processed = stripEmojis(text);
    terms.forEach(term => {
      const definition = GLOSSARY[term].replace(/"/g, '&quot;');
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      processed = processed.replace(regex, `<span class="glossary-term cursor-help border-b border-dashed border-[#C9824F]/70 hover:border-[#C9824F] transition-colors font-semibold text-[#E3A573]">$1<span class="tooltip-text"><strong class="block text-[#C9824F] font-mono font-bold text-[11px] mb-1 uppercase tracking-wide">$1</strong>${definition}</span></span>`);
    });

    return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processed) }} />;
  };

  const preprocessBlocks = (blocks: LectureBlock[]): RenderItem[] => {
    const items: RenderItem[] = [];
    let i = 0;

    while (i < blocks.length) {
      const block = blocks[i];
      const textClean = block.text.trim().toLowerCase();

      const isLeftHeader =
        (block.type === 'bullet' || block.type === 'paragraph') &&
        (textClean.startsWith('without') ||
          textClean.startsWith('before') ||
          textClean.startsWith('instead') ||
          textClean.startsWith('option a') ||
          textClean.startsWith('incorrect') ||
          textClean.startsWith('poor'));

      if (isLeftHeader) {
        const leftTitle = block.text.trim();
        const leftBullets: Array<{ text: string; blockIndex: number }> = [];
        let j = i + 1;
        while (
          j < blocks.length &&
          blocks[j].type === 'bullet' &&
          !blocks[j].text.trim().toLowerCase().startsWith('with') &&
          !blocks[j].text.trim().toLowerCase().startsWith('after') &&
          !blocks[j].text.trim().toLowerCase().startsWith('option b') &&
          !blocks[j].text.trim().toLowerCase().startsWith('correct') &&
          !blocks[j].text.trim().toLowerCase().startsWith('better') &&
          !blocks[j].text.trim().endsWith(':')
        ) {
          leftBullets.push({ text: blocks[j].text, blockIndex: j });
          j++;
        }

        if (j < blocks.length) {
          const nextBlock = blocks[j];
          const nextTextClean = nextBlock.text.trim().toLowerCase();

          const isRightHeader =
            (nextBlock.type === 'bullet' || nextBlock.type === 'paragraph') &&
            (nextTextClean.startsWith('with') ||
              nextTextClean.startsWith('after') ||
              nextTextClean.startsWith('option b') ||
              nextTextClean.startsWith('correct') ||
              nextTextClean.startsWith('better'));

          if (isRightHeader) {
            const rightTitle = nextBlock.text.trim();
            const rightBullets: Array<{ text: string; blockIndex: number }> = [];
            let k = j + 1;
            while (k < blocks.length && blocks[k].type === 'bullet' && !blocks[k].text.trim().endsWith(':')) {
              rightBullets.push({ text: blocks[k].text, blockIndex: k });
              k++;
            }

            if (leftBullets.length > 0 || rightBullets.length > 0) {
              const leftStyleIndex = leftBullets.length > 0 ? getBulletStyleIndex(leftBullets[0].text) : 0;
              const rightStyleIndex = rightBullets.length > 0 ? getBulletStyleIndex(rightBullets[0].text) : 1;

              items.push({
                type: 'comparison',
                leftTitle,
                leftBullets,
                leftStyleIndex,
                rightTitle,
                rightBullets,
                rightStyleIndex
              });
              i = k;
              continue;
            }
          }
        }
      }

      if (block.type === 'bullet') {
        const bullets: Array<{ text: string; blockIndex: number }> = [];
        let j = i;
        while (j < blocks.length && blocks[j].type === 'bullet') {
          bullets.push({ text: blocks[j].text, blockIndex: j });
          j++;
        }

        const styleIndex = bullets.length > 0 ? getBulletStyleIndex(bullets[0].text) : 0;
        items.push({
          type: 'list',
          bullets,
          styleIndex
        });

        i = j;
        continue;
      }

      items.push({ type: 'block', block, blockIndex: i });
      i++;
    }

    return items;
  };

  const currentThemeColor = isRead ? '#4ADE80' : '#8B5CF6';
  const preprocessedItems = preprocessBlocks(sec.blocks || []);

  const renderComparison = (
    leftTitle: string,
    leftBullets: Array<{ text: string; blockIndex: number }>,
    leftStyleIndex: number,
    rightTitle: string,
    rightBullets: Array<{ text: string; blockIndex: number }>,
    rightStyleIndex: number
  ) => {
    const isLeftNegative = leftTitle.toLowerCase().includes('without') || leftTitle.toLowerCase().includes('poor') || leftTitle.toLowerCase().includes('incorrect') || leftTitle.toLowerCase().includes('instead');
    const isRightPositive = rightTitle.toLowerCase().includes('with') || rightTitle.toLowerCase().includes('correct') || rightTitle.toLowerCase().includes('better');

    const leftAccent = isLeftNegative ? '#F87171' : '#5C6E64';
    const rightAccent = isRightPositive ? '#4ADE80' : currentThemeColor;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 animate-fadeIn">
        <div
          className="relative rounded-xl border p-5 pt-6 transition-all duration-300"
          style={{ borderColor: leftAccent + '40', background: leftAccent + '08' }}
        >
          <span
            className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest bg-[#0A120D] border"
            style={{ color: leftAccent, borderColor: leftAccent }}
          >
            {stripEmojis(leftTitle.replace(/:$/, '')).toUpperCase()}
          </span>
          <div className="space-y-1">
            {leftBullets.map(b => (
              <BulletItem
                key={b.blockIndex}
                text={b.text}
                blockIndex={b.blockIndex}
                styleIndex={leftStyleIndex}
                color={leftAccent}
                highlightText={highlightText}
              />
            ))}
          </div>
        </div>

        <div
          className="relative rounded-xl border p-5 pt-6 transition-all duration-300"
          style={{ borderColor: rightAccent + '40', background: rightAccent + '08' }}
        >
          <span
            className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest bg-[#0A120D] border"
            style={{ color: rightAccent, borderColor: rightAccent }}
          >
            {stripEmojis(rightTitle.replace(/:$/, '')).toUpperCase()}
          </span>
          <div className="space-y-1">
            {rightBullets.map(b => (
              <BulletItem
                key={b.blockIndex}
                text={b.text}
                blockIndex={b.blockIndex}
                styleIndex={rightStyleIndex}
                color={rightAccent}
                highlightText={highlightText}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex gap-3 md:gap-4">
      {/* trace pad node */}
      <div className="relative z-10 flex-shrink-0 w-12 flex flex-col items-center pt-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-sm font-bold border-2 transition-all duration-500"
          style={{
            borderColor: currentThemeColor,
            color: isRead ? '#0A120D' : currentThemeColor,
            background: isRead ? '#4ADE80' : '#0A120D',
            boxShadow: isRead ? '0 0 16px rgba(74,222,128,0.55)' : 'none',
          }}
        >
          {isRead ? '✓' : String(sec.number).padStart(2, '0')}
        </div>
      </div>

      <div
        className="flex-1 min-w-0 rounded-2xl border bg-[#0F1B14] shadow-sm overflow-hidden transition-all duration-500"
        style={{ borderColor: isOpen ? currentThemeColor + '45' : '#1c2a21' }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(o => !o)}
          className="group w-full flex items-center gap-3.5 px-5 md:px-6 py-4 md:py-5 text-left transition-all duration-300 hover:bg-white/[0.02]"
          style={{ borderBottom: isOpen ? `1px solid ${currentThemeColor}22` : 'none' }}
        >
          <span className="flex-1 font-bold text-[#EDF3EE] text-base md:text-lg leading-snug">
            {stripEmojis(sec.title)}
          </span>
          <span
            className="flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center font-mono text-[10px] font-black transition-all duration-300"
            style={{ borderColor: currentThemeColor + '55', color: currentThemeColor, transform: isOpen ? 'rotate(180deg)' : 'none' }}
          >
            ▾
          </span>
        </button>

        {isOpen && (
          <div className="px-5 md:px-6 pb-6 pt-5 text-sm md:text-base text-[#C7D6CC] leading-relaxed space-y-4 animate-slideDown">
            {preprocessedItems.map((item, idx) => {
              const stagger = { animationDelay: `${idx * 45}ms`, animationFillMode: 'forwards' as const, opacity: 0 };

              if (item.type === 'comparison') {
                return (
                  <div key={idx} className="animate-fadeIn" style={stagger}>
                    {renderComparison(
                      item.leftTitle, item.leftBullets, item.leftStyleIndex,
                      item.rightTitle, item.rightBullets, item.rightStyleIndex
                    )}
                  </div>
                );
              }

              if (item.type === 'list') {
                return (
                  <div key={idx} className="space-y-1 animate-fadeIn" style={stagger}>
                    {item.bullets.map(b => (
                      <BulletItem
                        key={b.blockIndex}
                        text={b.text}
                        blockIndex={b.blockIndex}
                        styleIndex={item.styleIndex}
                        color={currentThemeColor}
                        highlightText={highlightText}
                      />
                    ))}
                  </div>
                );
              }

              const { block } = item;

              if (block.type === 'code') {
                return (
                  <div key={idx} className="animate-fadeIn" style={stagger}>
                    <CodeBlock code={block.text} lang={block.lang || 'code'} />
                  </div>
                );
              }

              if (block.type === 'reveal') {
                return (
                  <div key={idx} className="animate-fadeIn" style={stagger}>
                    <RevealBlock
                      question={stripEmojis(block.question || 'Think about this...')}
                      answer={stripEmojis(block.text)}
                      accentColor={currentThemeColor}
                    />
                  </div>
                );
              }

              if (block.type === 'paragraph') {
                return (
                  <p
                    key={idx}
                    className={`leading-relaxed animate-fadeIn ${block.isSubheading ? 'font-bold text-[#EDF3EE] text-base md:text-lg mt-6 mb-3 border-b border-[#23362A] pb-2 flex items-center gap-2' : 'text-[#C7D6CC]'}`}
                    style={stagger}
                  >
                    {block.isSubheading && <span className="inline-block w-2 h-2" style={{ background: currentThemeColor }} />}
                    {highlightText(block.text)}
                  </p>
                );
              }
              if (block.type === 'callout') {
                return (
                  <div key={idx} className="my-4 animate-fadeIn" style={stagger}>
                    <Callout icon={block.icon} bg={block.bg} border={block.border} text={block.textColor}>
                      {stripEmojis(block.text)}
                    </Callout>
                  </div>
                );
              }
              if (block.type === 'image') {
                return (
                  <div key={idx} className="my-6 rounded-xl overflow-hidden border border-[#23362A] shadow-md max-w-xl mx-auto bg-[#070C09] transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-fadeIn relative group" style={stagger}>
                    <img src={block.text} alt="Step illustration" className="w-full object-contain max-h-80 mx-auto" />
                  </div>
                );
              }
              return null;
            })}

            {sec.images && sec.images.length > 0 && (
              <div className="space-y-4 my-6 max-w-xl mx-auto animate-fadeIn">
                {sec.images.map((imgUrl, imgIdx) => (
                  <div key={imgIdx} className="rounded-xl overflow-hidden border border-[#23362A] shadow-md bg-[#070C09] transition-all duration-300 hover:scale-[1.01] hover:shadow-lg relative group">
                    <img src={imgUrl} alt={`${sec.title} - ${imgIdx + 1}`} className="w-full object-contain max-h-80 mx-auto" />
                  </div>
                ))}
              </div>
            )}

            <div ref={sentinelRef} className="h-px" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Interactive Quiz Box: diagnostic check panel ─── */
function QuizCard({ quiz, onQuizComplete }: { quiz: QuizQuestion[], onQuizComplete?: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMuted(localStorage.getItem('lecture_audio_muted') === 'true');
    }
  }, []);

  const toggleMuted = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    localStorage.setItem('lecture_audio_muted', String(nextMuted));
  };

  const pick = (qIdx: number, oIdx: number) => {
    if (revealed[qIdx]) return;
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const check = (qIdx: number) => {
    if (answers[qIdx] === undefined) return;
    const isCorrect = answers[qIdx] === quiz[qIdx].correct;
    playSound(isCorrect ? 'correct' : 'incorrect');
    setRevealed(prev => {
      const next = { ...prev, [qIdx]: true };

      const nextScore = Object.entries(next).filter(
        ([idx, done]) => done && answers[Number(idx)] === quiz[Number(idx)].correct
      ).length;

      if (Object.keys(next).length === quiz.length) {
        onQuizComplete?.(nextScore);
      }

      return next;
    });
  };

  const score = Object.entries(revealed).filter(
    ([idx, done]) => done && answers[Number(idx)] === quiz[Number(idx)].correct
  ).length;

  const allDone = Object.keys(revealed).length === quiz.length;
  const hasMissed = allDone && score < quiz.length;

  const retryMissed = () => {
    const missedIndices = quiz.reduce<number[]>((acc, _, i) => {
      if (revealed[i] && answers[i] !== quiz[i].correct) acc.push(i);
      return acc;
    }, []);
    const newRevealed = { ...revealed };
    const newAnswers = { ...answers };
    const newHints = { ...showHints };
    missedIndices.forEach(i => {
      delete newRevealed[i];
      delete newAnswers[i];
      delete newHints[i];
    });
    setRevealed(newRevealed);
    setAnswers(newAnswers);
    setShowHints(newHints);
  };

  return (
    <div className="rounded-2xl border border-[#23362A] bg-[#0F1B14] p-6 md:p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#23362A]">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
          <p className="text-sm md:text-base font-mono font-bold uppercase tracking-widest text-[#EDF3EE]">
            Diagnostic Check
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMuted}
            className="text-[#93A89C] hover:text-[#5EEAD4] transition-colors p-1 rounded-md flex items-center justify-center"
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? <IconVolumeX /> : <IconVolume2 />}
          </button>
          {allDone && (
            <span className="font-mono bg-[#4ADE80]/10 border border-[#4ADE80]/40 text-[#4ADE80] text-sm font-black px-3 py-1.5 rounded-md">
              {score}/{quiz.length}
            </span>
          )}
        </div>
      </div>

      {quiz.map((q, qIdx) => {
        const chosen = answers[qIdx];
        const done = revealed[qIdx];
        const correct = q.correct;

        return (
          <div key={qIdx} className="rounded-xl border border-[#23362A] bg-[#0A120D] p-5 md:p-6 space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-md bg-[#0F1B14] border border-[#23362A] flex items-center justify-center font-mono text-xs font-bold text-[#5EEAD4] mt-0.5">
                {String(qIdx + 1).padStart(2, '0')}
              </span>
              <p className="font-bold text-[#EDF3EE] text-base md:text-lg leading-snug">
                {stripEmojis(q.question)}
              </p>
            </div>

            {q.hint && !done && (
              <div className="pl-10">
                {showHints[qIdx] ? (
                  <div className="text-sm text-[#F2B25C] bg-[#F2B25C]/[0.07] border border-[#F2B25C]/30 rounded-lg px-4 py-2.5 flex items-start gap-2 animate-fadeIn">
                    <span className="flex-shrink-0 mt-0.5"><IconLightbulb /></span>
                    <span className="font-semibold leading-relaxed">{stripEmojis(q.hint)}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowHints(prev => ({ ...prev, [qIdx]: true }))}
                    className="text-xs font-mono font-bold text-[#F2B25C]/80 hover:text-[#F2B25C] flex items-center gap-1.5 transition-colors duration-200 uppercase tracking-wide underline underline-offset-4 decoration-dashed"
                  >
                    <IconLightbulb /> Show Hint
                  </button>
                )}
              </div>
            )}

            <div className="grid gap-2.5 pl-10">
              {q.options.map((opt, oIdx) => {
                const choiceLetter = String.fromCharCode(65 + oIdx);
                let rowClasses = 'border-[#23362A] bg-[#0F1B14] text-[#C7D6CC] hover:border-[#5EEAD4]/40 hover:bg-[#5EEAD4]/[0.04]';
                let dotColor = 'transparent';
                let dotBorder = '#3D4D44';
                let letterStyle = 'border-[#23362A] text-[#93A89C]';

                if (done) {
                  if (oIdx === correct) {
                    rowClasses = 'border-[#4ADE80] bg-[#4ADE80]/10 text-[#86F0B0] font-semibold';
                    dotColor = '#4ADE80'; dotBorder = '#4ADE80';
                    letterStyle = 'border-[#4ADE80] text-[#4ADE80]';
                  } else if (oIdx === chosen) {
                    rowClasses = 'border-[#F87171] bg-[#F87171]/10 text-[#FCA5A5]';
                    dotColor = '#F87171'; dotBorder = '#F87171';
                    letterStyle = 'border-[#F87171] text-[#F87171]';
                  } else {
                    rowClasses = 'border-[#1c2a21] bg-transparent text-[#5C6E64] opacity-50';
                    letterStyle = 'border-[#1c2a21] text-[#5C6E64]';
                  }
                } else if (oIdx === chosen) {
                  rowClasses = 'border-[#5EEAD4] bg-[#5EEAD4]/10 text-[#A8F0E4] font-semibold';
                  dotColor = '#5EEAD4'; dotBorder = '#5EEAD4';
                  letterStyle = 'border-[#5EEAD4] text-[#5EEAD4]';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => pick(qIdx, oIdx)}
                    disabled={done}
                    className={`group w-full text-left rounded-lg px-4 py-3 text-sm md:text-base transition-all duration-200 active:scale-[0.99] flex items-center gap-3 border ${rowClasses}`}
                  >
                    <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full border-2 transition-all duration-200" style={{ background: dotColor, borderColor: dotBorder }} />
                    <span className={`flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center font-mono text-[11px] font-black transition-all duration-200 ${letterStyle}`}>
                      {choiceLetter}
                    </span>
                    <span className="flex-1 leading-snug">{stripEmojis(opt)}</span>
                  </button>
                );
              })}
            </div>

            <div className="pl-10">
              {!done ? (
                <button
                  type="button"
                  onClick={() => check(qIdx)}
                  disabled={chosen === undefined}
                  className="font-mono text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-lg bg-[#5EEAD4] text-[#0A120D] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 hover:bg-[#7FF2DF] active:translate-y-px"
                >
                  Run Check
                </button>
              ) : (
                <div className="mt-3 animate-fadeIn">
                  <Callout
                    icon={chosen === correct ? '✓' : '💡'}
                    bg={chosen === correct ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)'}
                    border={chosen === correct ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}
                    text={chosen === correct ? '#4ADE80' : '#F87171'}
                    label={chosen === correct ? 'CORRECT' : 'REVIEW'}
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-base">{chosen === correct ? 'Correct — nice diagnosis.' : "Not quite. Here's why:"}</p>
                      <p className="text-sm leading-relaxed opacity-90 font-medium">{stripEmojis(q.explanation)}</p>
                    </div>
                  </Callout>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {hasMissed && (
        <div className="flex justify-center pt-2 animate-fadeIn">
          <button
            type="button"
            onClick={retryMissed}
            className="font-mono text-xs font-black uppercase tracking-wider px-6 py-3 rounded-lg border-2 border-[#F87171]/50 text-[#F87171] hover:bg-[#F87171]/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Retry {quiz.length - score} Missed
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function InteractiveLecture({ levelId, lessonId, stepId }: InteractiveLectureProps) {
  const [progress, setProgress] = useState<Set<number>>(new Set());
  const [user, setUser] = useState<any>(null);

  const [aiQuizOpen, setAiQuizOpen] = useState(false);
  const [aiQuizLoading, setAiQuizLoading] = useState(false);
  const [aiQuizError, setAiQuizError] = useState<string | null>(null);
  const [aiQuizQuestions, setAiQuizQuestions] = useState<
    { question: string; options: string[]; correctIndex: number; explanation: string }[]
  >([]);
  const [aiQuizAnswers, setAiQuizAnswers] = useState<Record<number, number>>({});
  const [aiQuizRevealed, setAiQuizRevealed] = useState<Record<number, boolean>>({});
  const [aiQuizXpAwarded, setAiQuizXpAwarded] = useState(false);

  const supabase = createClient();

  const key = `${levelId}-${lessonId}-${stepId}`;
  const lecture = LECTURES_STRUCTURED_DATA[key];

  const renderMarkdownInline = (text: string) => {
    if (!text) return '';
    const clean = stripEmojis(text);
    const processed = clean
      .replace(/^#+\s*/, '')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[90%]">$1</code>');
    return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processed) }} />;
  };

  useEffect(() => {
    let currentUser: any = null;

    supabase.auth.getUser().then(({ data }) => {
      currentUser = data.user;
      setUser(currentUser);
      if (currentUser) {
        supabase.from('user_progress').select('read_sections, quiz_score').match({
          user_id: currentUser.id,
          level_id: levelId.toString(),
          lesson_id: lessonId,
          step_id: stepId
        }).single().then(({ data }) => {
          if (data) {
            if (data.read_sections) {
              setProgress(new Set(data.read_sections));
            } else {
              setProgress(new Set());
            }
            if (data.quiz_score !== null && data.quiz_score !== undefined) {
              window.dispatchEvent(new CustomEvent('quiz-complete'));
            }
          } else {
            setProgress(new Set());
          }
        });
      } else {
        setProgress(new Set());
      }
    });
  }, [key]);

  useEffect(() => {
    if (lecture && lecture.sections.length > 0 && progress.size === lecture.sections.length) {
      window.dispatchEvent(new CustomEvent('lecture-complete'));
    }
  }, [progress.size, lecture]);

  if (!lecture) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 bg-[#0A120D]">
        <div className="text-center p-6 bg-[#0F1B14] border border-[#23362A] rounded-2xl shadow-sm max-w-sm">
          <h2 className="mt-4 font-mono font-bold text-[#EDF3EE] animate-pulse uppercase tracking-wide text-sm">No structured lecture found</h2>
          <p className="text-sm text-[#9FB3A8] mt-1.5 leading-relaxed">
            There is no structured lecture for level {levelId} lesson {lessonId} ({stepId}).
          </p>
        </div>
      </div>
    );
  }

  const wordCount = lecture.sections.reduce((acc, sec) => {
    let count = sec.title.split(/\s+/).length;
    sec.blocks.forEach(b => {
      if (b.type === 'paragraph' || b.type === 'bullet' || b.type === 'callout') {
        count += b.text.split(/\s+/).length;
      }
    });
    return acc + count;
  }, 0);
  const readTime = Math.max(1, Math.round(wordCount / 180));

  const totalSections = lecture.sections.length;
  const pct = totalSections > 0 ? Math.round((progress.size / totalSections) * 100) : 0;
  const allRead = progress.size === totalSections;

  const getLectureText = () => {
    return lecture.sections.map(sec => {
      const blockText = sec.blocks
        .filter(b => b.type === 'paragraph' || b.type === 'bullet' || b.type === 'callout')
        .map(b => b.text)
        .join(' ');
      return `${sec.title}: ${blockText}`;
    }).join('\n\n');
  };

  const handleAiQuiz = async () => {
    setAiQuizOpen(true);
    if (aiQuizQuestions.length > 0) return;
    setAiQuizLoading(true);
    setAiQuizError(null);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: stripEmojis(lecture.levelTitle || `Level ${levelId} - ${lessonId}`),
          lectureContent: stripEmojis(getLectureText()),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiQuizError(data.error || 'Could not generate quiz. Try again.');
      } else {
        setAiQuizQuestions(data.questions || []);
      }
    } catch {
      setAiQuizError('Could not reach the AI service. Try again.');
    } finally {
      setAiQuizLoading(false);
    }
  };

  const handleAiQuizAnswer = (qIdx: number, oIdx: number) => {
    if (aiQuizRevealed[qIdx]) return;
    setAiQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleAiQuizReveal = (qIdx: number) => {
    if (aiQuizAnswers[qIdx] === undefined) return;
    const isCorrect = aiQuizAnswers[qIdx] === aiQuizQuestions[qIdx].correctIndex;
    playSound(isCorrect ? 'correct' : 'incorrect');
    setAiQuizRevealed(prev => {
      const next = { ...prev, [qIdx]: true };
      const allDone = Object.keys(next).length === aiQuizQuestions.length;
      if (allDone && !aiQuizXpAwarded) {
        const correctCount = Object.keys(next).filter(
          i => aiQuizAnswers[Number(i)] === aiQuizQuestions[Number(i)].correctIndex
        ).length;
        if (correctCount === aiQuizQuestions.length) {
          setAiQuizXpAwarded(true);
          supabase.auth.getUser().then(({ data }) => {
            if (!data.user) return;
            supabase.from('user_stats').upsert(
              { user_id: data.user.id, bonus_xp_events: new Date().toISOString() },
              { onConflict: 'user_id' }
            );
          });
        }
      }
      return next;
    });
  };

  const toggleRead = (idx: number) => {
    setProgress(prev => {
      const next = new Set(prev);
      const isNewlyRead = !next.has(idx);
      if (isNewlyRead) {
        next.add(idx);
      } else {
        next.delete(idx);
      }

      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        supabase
          .from('user_progress')
          .upsert(
            {
              user_id: data.user.id,
              level_id: levelId.toString(),
              lesson_id: lessonId,
              step_id: stepId,
              read_sections: Array.from(next),
              completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,course_id,level_id,lesson_id,step_id' }
          )
          .then(() => {});
      });

      return next;
    });
  };

  const getContextualSubtitle = () => {
    const t = lecture.stepType.toLowerCase();
    if (t.includes('intro')) return 'Build your mental model of this topic.';
    if (t.includes('concept')) return 'Deepen your understanding with structured theory.';
    if (t.includes('explore') || t.includes('exploration')) return 'Experiment and observe how things work.';
    if (t.includes('mapping')) return 'Connect block logic to real hardware.';
    return 'Follow each collapsible step, read carefully, and test your comprehension!';
  };

  const getLevelAccent = () => {
    const l = Number(levelId);
    if (l === 1) return '#8B5CF6';
    if (l === 2) return '#5EEAD4';
    if (l === 3) return '#C9824F';
    return '#F2B25C';
  };
  const levelAccent = getLevelAccent();

  return (
    <div className="min-h-full bg-[#0A120D] pb-16 relative">
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }

        .glossary-term {
          position: relative;
          display: inline-block;
        }
        .glossary-term .tooltip-text {
          visibility: hidden;
          width: 260px;
          background-color: #0A120D;
          color: #EDF3EE;
          text-align: left;
          border-radius: 10px;
          padding: 12px 14px;
          position: absolute;
          z-index: 50;
          bottom: 130%;
          left: 50%;
          transform: translateX(-50%) translateY(6px);
          opacity: 0;
          transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 12.5px;
          line-height: 1.5;
          font-weight: 500;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          pointer-events: none;
          border: 1px solid #23362A;
        }
        .glossary-term:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      {/* ── Hero "Boot Panel" ── */}
      <div className="relative mb-8 rounded-2xl border border-[#23362A] bg-[#0F1B14] px-6 md:px-9 py-8 md:py-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#EDF3EE 1px, transparent 1px), linear-gradient(90deg, #EDF3EE 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${levelAccent}, transparent 70%)` }}
        />

        <div className="relative flex flex-wrap items-center gap-2 mb-4 font-mono text-[11px] uppercase tracking-widest">
          <span className="px-2.5 py-1 rounded-md border" style={{ color: levelAccent, borderColor: levelAccent + '55' }}>
            LVL {levelId}
          </span>
          <span className="text-[#3D4D44]">/</span>
          <span className="px-2.5 py-1 rounded-md border border-[#23362A] text-[#93A89C]">
            LESSON {lessonId}
          </span>
          <span className="text-[#3D4D44]">/</span>
          <span className="px-2.5 py-1 rounded-md border border-[#23362A] text-[#93A89C]">
            {renderMarkdownInline(lecture.stepType)}
          </span>
          <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#23362A] text-[#93A89C] normal-case tracking-normal">
            <IconClock /> {readTime} min read
          </span>
        </div>

        <h1 className="relative text-2xl md:text-4xl font-extrabold mb-2.5 leading-tight text-[#EDF3EE]">
          {renderMarkdownInline(lecture.levelTitle)}
        </h1>
        <p className="relative text-sm md:text-base text-[#9FB3A8] max-w-xl leading-relaxed font-medium">
          {stripEmojis(getContextualSubtitle())}
        </p>

        <div className="relative mt-7 max-w-md">
          <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest text-[#93A89C] mb-2">
            <span>Boot Progress</span>
            <span style={{ color: levelAccent }}>{pct}%</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 20 }).map((_, i) => {
              const filled = i < Math.round((pct / 100) * 20);
              return (
                <div
                  key={i}
                  className="h-2.5 flex-1 rounded-[2px] transition-all duration-300"
                  style={{
                    background: filled ? '#4ADE80' : '#1c2a21',
                    boxShadow: filled ? '0 0 6px rgba(74,222,128,0.5)' : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Collapsible Sections List with trace spine ── */}
      <div className="relative space-y-5 mb-8">
        <div
          className="absolute left-6 top-5 bottom-5 w-px pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(201,130,79,0.45), #23362A 12%, #23362A 88%, rgba(201,130,79,0.45))' }}
        />
        {lecture.sections.map((sec, idx) => (
          <div key={idx} id={`section-${idx}`}>
            <SectionCard
              sec={sec}
              isRead={progress.has(idx)}
              onToggleRead={() => toggleRead(idx)}
            />
          </div>
        ))}
      </div>

      {/* ── Interactive Quiz Section ── */}
      {lecture.quiz && lecture.quiz.length > 0 && (
        <div className="mb-8 animate-fadeIn">
          <QuizCard
            quiz={lecture.quiz}
            onQuizComplete={(score) => {
              window.dispatchEvent(new CustomEvent('quiz-complete'));
              if (user) {
                supabase.from('user_progress').upsert(
                  {
                    user_id: user.id,
                    level_id: levelId.toString(),
                    lesson_id: lessonId,
                    step_id: stepId,
                    quiz_score: score
                  },
                  {
                    onConflict: 'user_id,course_id,level_id,lesson_id,step_id'
                  }
                ).then(() => {});
              }
            }}
          />
        </div>
      )}

      {/* ── "System Online" Completion Banner ── */}
      {allRead && (
        <div className="relative rounded-2xl p-8 md:p-10 text-center flex flex-col items-center justify-center overflow-hidden animate-fadeIn border border-[#4ADE80]/25 bg-[#0A120D]">
          <div
            style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 280, height: 160, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(74,222,128,0.16), transparent 65%)',
              pointerEvents: 'none',
            }}
          />
          <ConfettiShower />

          <div
            className="relative z-10 w-14 h-14 rounded-xl mb-5 flex items-center justify-center border"
            style={{ background: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.4)', color: '#4ADE80' }}
          >
            <IconCheckCircle />
          </div>

          <p className="relative z-10 font-mono text-xs uppercase tracking-[0.2em] text-[#4ADE80] mb-2">
            All Sections Read
          </p>

          <h2 className="relative z-10 text-xl md:text-2xl font-bold text-[#EDF3EE]">
            Lesson fully booted
          </h2>

          <p className="relative z-10 mt-2 max-w-sm text-sm text-[#9FB3A8] leading-relaxed">
            You've read {totalSections === 1 ? '' : 'all'} {totalSections} section{totalSections === 1 ? '' : 's'}.
            Hit <strong className="text-[#4ADE80] font-bold">Next</strong> in the sidebar to move on to your next task.
          </p>

          <button
            type="button"
            onClick={handleAiQuiz}
            className="relative z-10 mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xs font-black uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#5EEAD4', color: '#0A120D' }}
          >
            <IconBrain /> Run AI Diagnostic
          </button>
        </div>
      )}

      {/* ── AI Quiz Modal: diagnostics console ── */}
      {aiQuizOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(4,8,6,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'fadeIn 0.18s ease',
          }}
          onClick={e => { if (e.target === e.currentTarget) setAiQuizOpen(false); }}
        >
          <div style={{
            background: 'linear-gradient(160deg,#0A120D,#0F1B14)',
            border: '1px solid rgba(94,234,212,0.2)',
            borderRadius: 18,
            width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
            padding: 28,
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#5EEAD4' }}><IconBrain /></span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#EDF3EE', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>
                    AI Diagnostic
                  </p>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(237,243,238,0.5)', fontFamily: '"Inter",sans-serif' }}>
                    Perfect run = 2× XP bonus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiQuizOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid #23362A',
                  borderRadius: 8, color: 'rgba(237,243,238,0.5)', cursor: 'pointer',
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, lineHeight: 1, fontFamily: '"JetBrains Mono",monospace',
                }}
              >×</button>
            </div>

            {/* Loading */}
            {aiQuizLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid rgba(94,234,212,0.2)',
                  borderTopColor: '#5EEAD4',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 14px',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(237,243,238,0.55)', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.04em' }}>
                  COMPILING QUESTIONS…
                </p>
              </div>
            )}

            {/* Error */}
            {aiQuizError && !aiQuizLoading && (
              <div style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: 10, padding: '14px 16px', textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#F87171', fontFamily: '"Inter",sans-serif' }}>
                  {aiQuizError}
                </p>
                <button
                  type="button"
                  onClick={() => { setAiQuizError(null); setAiQuizLoading(true); handleAiQuiz(); }}
                  style={{
                    marginTop: 12, padding: '7px 18px', borderRadius: 8,
                    background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                    color: '#F87171', fontSize: 11, fontWeight: 800,
                    cursor: 'pointer', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}
                >Try again</button>
              </div>
            )}

            {/* Questions */}
            {!aiQuizLoading && !aiQuizError && aiQuizQuestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {aiQuizQuestions.map((q, qIdx) => {
                  const chosen = aiQuizAnswers[qIdx];
                  const revealed = aiQuizRevealed[qIdx];

                  return (
                    <div key={qIdx} style={{
                      background: 'rgba(255,255,255,0.025)', border: '1px solid #1c2a21',
                      borderRadius: 14, padding: '16px 18px',
                    }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                        <span style={{
                          minWidth: 24, height: 24, borderRadius: 6, flexShrink: 0,
                          background: 'rgba(94,234,212,0.1)', border: '1px solid rgba(94,234,212,0.3)',
                          color: '#5EEAD4', fontSize: 11, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: '"JetBrains Mono",monospace',
                        }}>{String(qIdx + 1).padStart(2, '0')}</span>
                        <p style={{
                          margin: 0, fontSize: 15, fontWeight: 700,
                          color: '#EDF3EE', lineHeight: 1.55,
                          fontFamily: '"Inter",sans-serif',
                        }}>{stripEmojis(q.question)}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 34 }}>
                        {q.options.map((opt, oIdx) => {
                          const isChosen = chosen === oIdx;
                          const isCorrect = oIdx === q.correctIndex;
                          let bg = 'rgba(255,255,255,0.03)';
                          let border = '#23362A';
                          let color = 'rgba(237,243,238,0.7)';
                          if (revealed) {
                            if (isCorrect) { bg = 'rgba(74,222,128,0.12)'; border = 'rgba(74,222,128,0.45)'; color = '#86F0B0'; }
                            else if (isChosen && !isCorrect) { bg = 'rgba(248,113,113,0.1)'; border = 'rgba(248,113,113,0.35)'; color = '#FCA5A5'; }
                          } else if (isChosen) {
                            bg = 'rgba(94,234,212,0.12)'; border = 'rgba(94,234,212,0.45)'; color = '#A8F0E4';
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleAiQuizAnswer(qIdx, oIdx)}
                              disabled={!!revealed}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 9,
                                padding: '10px 13px', borderRadius: 9,
                                background: bg, border: `1px solid ${border}`,
                                color, fontSize: 13.5, fontWeight: 600,
                                textAlign: 'left', cursor: revealed ? 'default' : 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: '"Inter",sans-serif',
                              }}
                            >
                              <span style={{
                                minWidth: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                background: 'rgba(255,255,255,0.04)', border: `1px solid ${border}`,
                                fontSize: 10, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: '"JetBrains Mono",monospace',
                              }}>{['A', 'B', 'C', 'D'][oIdx]}</span>
                              {stripEmojis(opt)}
                            </button>
                          );
                        })}
                      </div>

                      {/* Check answer button */}
                      {!revealed && (
                        <div style={{ paddingLeft: 34, marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => handleAiQuizReveal(qIdx)}
                            disabled={chosen === undefined}
                            style={{
                              padding: '7px 16px', borderRadius: 8,
                              background: chosen !== undefined ? '#5EEAD4' : 'rgba(255,255,255,0.03)',
                              border: '1px solid ' + (chosen !== undefined ? '#5EEAD4' : '#23362A'),
                              color: chosen !== undefined ? '#0A120D' : 'rgba(237,243,238,0.25)',
                              fontSize: 11, fontWeight: 800,
                              cursor: chosen !== undefined ? 'pointer' : 'not-allowed',
                              fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em', textTransform: 'uppercase',
                            }}
                          >Check Answer</button>
                        </div>
                      )}

                      {/* Explanation */}
                      {revealed && (
                        <div style={{
                          paddingLeft: 34, marginTop: 10,
                          background: 'rgba(74,222,128,0.06)',
                          border: '1px solid rgba(74,222,128,0.18)',
                          borderRadius: 8, padding: '9px 12px 9px 46px',
                          position: 'relative'
                        }}>
                          <span style={{ position: 'absolute', left: 16, top: 10, color: '#4ADE80' }}><IconLightbulb /></span>
                          <p style={{
                            margin: 0, fontSize: 12.5, lineHeight: 1.6,
                            color: 'rgba(237,243,238,0.65)',
                            fontFamily: '"Inter",sans-serif',
                          }}>{stripEmojis(q.explanation)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Final score banner */}
                {Object.keys(aiQuizRevealed).length === aiQuizQuestions.length && (() => {
                  const aiScore = Object.keys(aiQuizRevealed).filter(
                    i => aiQuizAnswers[Number(i)] === aiQuizQuestions[Number(i)].correctIndex
                  ).length;
                  const perfect = aiScore === aiQuizQuestions.length;
                  return (
                    <div style={{
                      textAlign: 'center', padding: '16px',
                      background: perfect ? 'rgba(74,222,128,0.08)' : 'rgba(242,178,92,0.08)',
                      border: `1px solid ${perfect ? 'rgba(74,222,128,0.3)' : 'rgba(242,178,92,0.3)'}`,
                      borderRadius: 14,
                    }}>
                      <p style={{
                        margin: '0 0 4px', fontSize: 22, fontWeight: 900,
                        color: perfect ? '#4ADE80' : '#F2B25C',
                        fontFamily: '"JetBrains Mono",monospace',
                      }}>
                        {aiScore}/{aiQuizQuestions.length}
                      </p>
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: 600,
                        color: 'rgba(237,243,238,0.65)',
                        fontFamily: '"Inter",sans-serif',
                      }}>
                        {perfect
                          ? 'Perfect run — 2× XP bonus awarded!'
                          : 'Good effort. Review the explanations and try again.'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}