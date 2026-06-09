import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VOICES = [
  { id: "en-US-Aria", name: "Aria", lang: "English (US)", tag: "Warm", gender: "F" },
  { id: "en-US-Guy", name: "Guy", lang: "English (US)", tag: "Confident", gender: "M" },
  { id: "en-GB-Libby", name: "Libby", lang: "English (UK)", tag: "Crisp", gender: "F" },
  { id: "en-GB-Ryan", name: "Ryan", lang: "English (UK)", tag: "Authoritative", gender: "M" },
  { id: "hi-IN-Swara", name: "Swara", lang: "Hindi", tag: "Soft", gender: "F" },
  { id: "es-ES-Elvira", name: "Elvira", lang: "Spanish", tag: "Lively", gender: "F" },
  { id: "ja-JP-Nanami", name: "Nanami", lang: "Japanese", tag: "Gentle", gender: "F" },
  { id: "fr-FR-Denise", name: "Denise", lang: "French", tag: "Elegant", gender: "F" },
  { id: "de-DE-Katja", name: "Katja", lang: "German", tag: "Clear", gender: "F" },
];
const STYLES = ["Default", "Cheerful", "Empathetic", "Newscast", "Narration", "Excited", "Calm"];

const FAQS = [
  { q: "Is VoiceBot AI really free to use?", a: "Yes — 100% free, with no signup, no watermark, and no credit card required. Convert as much text as you need." },
  { q: "How do I convert text to voice online?", a: "Paste your text, select a voice and style, click Generate, then download the resulting MP3. The whole flow takes seconds." },
  { q: "What languages does the AI voice generator support?", a: "Over 50 languages including English, Hindi, Spanish, French, German, Japanese, Arabic, Mandarin and many more." },
  { q: "Can I download the audio as MP3?", a: "Yes. Every generation produces a high-quality MP3 file you can download with one click." },
  { q: "Are the AI voices natural-sounding?", a: "We use advanced neural TTS that delivers human-like, expressive speech with control over emotion, pacing and intonation." },
  { q: "Can I use the audio commercially?", a: "Yes. Generated audio is yours to use in YouTube videos, podcasts, ads, e-learning, apps and other commercial projects." },
];

const API_BASE = "https://voice.mybots.in";

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-md text-sm font-medium shadow-2xl border ${
        type === "ok"
          ? "bg-surface border-primary/40 text-foreground"
          : "bg-destructive border-destructive text-destructive-foreground"
      }`}
    >
      {msg}
    </motion.div>
  );
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-7 h-7 rounded-md bg-primary grid place-items-center">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" className="text-primary-foreground" />
        </svg>
      </div>
      <span className="font-display font-semibold text-[15px] tracking-tight">
        VoiceBot<span className="text-muted-foreground">.ai</span>
      </span>
    </div>
  );
}

export default function VoiceBot() {
  useReveal();
  const [text, setText] = useState(
    "Welcome to VoiceBot AI. Generate natural, expressive speech from any text — in over fifty languages, completely free."
  );
  const [voice, setVoice] = useState(VOICES[0].id);
  const [style, setStyle] = useState("Default");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const generate = async (overrideText?: string, voiceId?: string, isPreview = false) => {
    const payload = {
      text: overrideText ?? text,
      voice: voiceId ?? voice,
      style,
      speed,
      pitch,
    };
    if (!payload.text.trim()) {
      showToast("Enter some text first", "err");
      return;
    }
    if (isPreview) setPreviewing(voiceId!);
    else setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (isPreview) {
        if (previewAudioRef.current) previewAudioRef.current.pause();
        const a = new Audio(url);
        previewAudioRef.current = a;
        a.onended = () => setPreviewing(null);
        await a.play();
      } else {
        setAudioUrl(url);
        showToast("Voice generated");
        setTimeout(() => audioRef.current?.play().catch(() => {}), 150);
      }
    } catch {
      showToast("Generation failed. Please try again.", "err");
      if (isPreview) setPreviewing(null);
    } finally {
      if (!isPreview) setLoading(false);
    }
  };

  const download = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "voicebot-ai.mp3";
    a.click();
    showToast("MP3 downloaded");
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    showToast("Text copied to clipboard");
  };

  const scrollToGen = () => document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/75 border-b border-border">
        <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          <ul className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <li><a href="#generator" className="hover:text-foreground transition-colors">Generator</a></li>
            <li><a href="#voices" className="hover:text-foreground transition-colors">Voices</a></li>
            <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
            <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
          </ul>
          <button
            onClick={scrollToGen}
            className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try free
          </button>
        </nav>
      </header>

      {/* HERO — SPLIT SCREEN */}
      <section id="generator" className="relative border-b border-border bg-grid">
        <div className="ember-haze relative">
          <div className="max-w-7xl mx-auto px-6 py-14 md:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-start relative">
            {/* Left column */}
            <div className="lg:pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface/60 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-blink" />
                <span className="mono-label !text-foreground/80">Neural TTS · v4.2</span>
              </div>

              <h1 className="mt-6 font-display text-[44px] md:text-6xl lg:text-[68px] leading-[1.02] tracking-tight">
                Text to voice,
                <br />
                <span className="text-primary">without the friction.</span>
              </h1>

              <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                A free AI text-to-speech engine with 200+ neural voices across 50+ languages.
                Production-grade audio in seconds. No signup. No watermark. MP3 export.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#voices"
                  className="px-5 py-2.5 rounded-md border border-border bg-surface hover:bg-elevated text-sm font-medium transition-colors"
                >
                  Browse voice library
                </a>
                <a
                  href="#features"
                  className="px-5 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  See what's inside →
                </a>
              </div>

              {/* Stats strip */}
              <div className="mt-12 grid grid-cols-4 gap-6 max-w-xl">
                {[
                  ["200+", "Voices"],
                  ["50+", "Languages"],
                  ["1M+", "Generated"],
                  ["Free", "Forever"],
                ].map(([n, l]) => (
                  <div key={l} className="border-l border-border pl-3">
                    <div className="font-display text-2xl">{n}</div>
                    <div className="mono-label mt-1">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — Generator */}
            <div className="relative">
              <div className="rounded-xl border border-border bg-surface/80 backdrop-blur-sm overflow-hidden shadow-2xl">
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-elevated/60">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-border" />
                      <span className="w-2.5 h-2.5 rounded-full bg-border" />
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <span className="mono-label ml-2">generator.tts</span>
                  </div>
                  <span className="mono-label">{loading ? "● generating" : "○ idle"}</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Voice + style */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mono-label">Voice</span>
                      <select
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        className="mt-1.5 w-full px-3 py-2.5 rounded-md bg-background border border-border focus:border-primary outline-none text-sm transition-colors"
                      >
                        {VOICES.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} — {v.lang}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mono-label">Style</span>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="mt-1.5 w-full px-3 py-2.5 rounded-md bg-background border border-border focus:border-primary outline-none text-sm transition-colors"
                      >
                        {STYLES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Textarea */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="mono-label">Input text</span>
                      <span className="mono-label">
                        {text.length.toLocaleString()} / 5,000
                      </span>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, 5000))}
                      rows={5}
                      placeholder="Paste or type your text…"
                      className="w-full px-3.5 py-3 rounded-md bg-background border border-border focus:border-primary outline-none text-sm resize-none leading-relaxed transition-colors"
                    />
                  </div>

                  {/* Sliders */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="mono-label">Speed</span>
                        <span className="font-mono text-xs text-primary">{speed.toFixed(2)}x</span>
                      </div>
                      <input type="range" min={0.5} max={2} step={0.05} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="mono-label">Pitch</span>
                        <span className="font-mono text-xs text-primary">
                          {pitch > 0 ? `+${pitch}` : pitch}
                        </span>
                      </div>
                      <input type="range" min={-10} max={10} step={1} value={pitch} onChange={(e) => setPitch(+e.target.value)} className="w-full" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => generate()}
                      disabled={loading}
                      className="flex-1 px-4 py-3 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="spinner w-4 h-4" />
                          Generating…
                        </>
                      ) : (
                        <>Generate voice ↵</>
                      )}
                    </button>
                    <button
                      onClick={copyText}
                      className="px-4 py-3 rounded-md border border-border bg-background hover:bg-elevated text-sm transition-colors"
                      aria-label="Copy text"
                    >
                      Copy
                    </button>
                  </div>

                  {/* Player */}
                  {audioUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-3 rounded-md bg-background border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => (playing ? audioRef.current?.pause() : audioRef.current?.play())}
                          className="w-10 h-10 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
                          aria-label={playing ? "Pause" : "Play"}
                        >
                          {playing ? "❚❚" : "▶"}
                        </button>
                        <div className="flex-1 flex items-center gap-[3px] h-10 overflow-hidden">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <span
                              key={i}
                              className="wave-bar inline-block w-[3px] rounded-full bg-primary"
                              style={{
                                height: `${14 + Math.abs(Math.sin(i * 0.45)) * 22}px`,
                                animationDelay: `${i * 0.05}s`,
                                animationPlayState: playing ? "running" : "paused",
                                opacity: playing ? 1 : 0.35,
                              }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={download}
                          className="px-3 py-2 rounded-md border border-border bg-elevated hover:border-primary/60 text-xs font-medium transition-colors shrink-0"
                        >
                          ↓ MP3
                        </button>
                      </div>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onEnded={() => setPlaying(false)}
                        className="hidden"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 reveal">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10">
            <div>
              <div className="mono-label">[01] Workflow</div>
              <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-tight">
                Three steps from idea
                <br />
                to audio file.
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
              {[
                { n: "01", t: "Write", d: "Paste or type up to 5,000 characters per generation." },
                { n: "02", t: "Configure", d: "Pick a voice and style, then fine-tune speed and pitch." },
                { n: "03", t: "Export", d: "Generate and download a clean MP3 — yours to use anywhere." },
              ].map((s) => (
                <div key={s.n} className="bg-surface p-6 hover:bg-elevated transition-colors">
                  <div className="font-mono text-xs text-primary mb-3">{s.n}</div>
                  <h3 className="font-display text-lg mb-1.5">{s.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VOICE LIBRARY */}
      <section id="voices" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 reveal">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10 mb-10">
            <div>
              <div className="mono-label">[02] Library</div>
              <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-tight">
                A curated set of
                <br />
                neural voices.
              </h2>
            </div>
            <p className="text-muted-foreground self-end max-w-md">
              Sampled across languages, genders and registers. Tap any card to hear a live preview rendered through the same engine that powers the generator.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
            {VOICES.map((v) => {
              const isPreviewing = previewing === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => generate(`Hello, I'm ${v.name}. This is a quick sample of my voice.`, v.id, true)}
                  className={`group bg-surface text-left p-5 transition-colors ${
                    isPreviewing ? "bg-elevated" : "hover:bg-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="mono-label">{v.gender === "F" ? "Female" : "Male"}</span>
                    <span className="mono-label text-primary">{isPreviewing ? "● playing" : "▶ preview"}</span>
                  </div>
                  <div className="font-display text-xl">{v.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{v.lang}</div>
                  <div className="mt-4 inline-block text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                    {v.tag}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 reveal">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10 mb-10">
            <div>
              <div className="mono-label">[03] Capabilities</div>
              <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-tight">
                Built like an
                <br />
                engineering tool.
              </h2>
            </div>
            <p className="text-muted-foreground self-end max-w-md">
              Fast, deterministic, no signup gates. Designed for creators, devs and accessibility workflows that need reliable output every time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
            {[
              ["Neural TTS", "State-of-the-art deep-learning models with human-like prosody and emotion."],
              ["50+ Languages", "English, Hindi, Spanish, French, German, Japanese, Arabic, Mandarin and more."],
              ["Sub-second Latency", "Most generations finish in under a few seconds at high quality."],
              ["Fine-Grained Control", "Speed, pitch, emotional style — adjustable per generation."],
              ["MP3 Export", "High-bitrate MP3 download. Commercial use permitted."],
              ["No Signup", "Open the page, generate, leave. No accounts. No watermark."],
            ].map(([t, d]) => (
              <div key={t as string} className="bg-surface p-6 hover:bg-elevated transition-colors">
                <h3 className="font-display text-lg">{t}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 reveal">
          <div className="mono-label">[04] Made for</div>
          <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-tight max-w-2xl">
            Creators, students, podcasters and accessibility teams.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden mt-10">
            {[
              ["YouTubers", "Polished voiceovers without booking studio time."],
              ["Students", "Listen to notes, essays and reading material on the go."],
              ["Podcasters", "Generate intros, outros and inserts in seconds."],
              ["Accessibility", "Make any written content available as audio."],
            ].map(([t, d]) => (
              <div key={t as string} className="bg-surface p-6 hover:bg-elevated transition-colors">
                <h3 className="font-display text-lg">{t}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 reveal grid lg:grid-cols-[1fr_1.5fr] gap-10">
          <div>
            <div className="mono-label">[05] FAQ</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-tight">
              Common
              <br />
              questions.
            </h2>
          </div>
          <div className="divide-y divide-border border-t border-b border-border">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  >
                    <span className="font-display text-base md:text-lg group-hover:text-primary transition-colors">
                      {f.q}
                    </span>
                    <span
                      className={`text-primary text-lg transition-transform shrink-0 ${
                        open ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pr-10 text-sm text-muted-foreground leading-relaxed">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 reveal">
          <div className="relative rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="ember-haze relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center p-10 md:p-14">
              <div>
                <div className="mono-label">[06] Get started</div>
                <h2 className="mt-3 font-display text-3xl md:text-5xl tracking-tight">
                  Turn your next paragraph
                  <br />
                  into <span className="text-primary">audio</span>.
                </h2>
                <p className="mt-4 text-muted-foreground max-w-lg">
                  Free, instant, no signup. Production-grade voices a click away.
                </p>
              </div>
              <div className="flex lg:justify-end">
                <button
                  onClick={scrollToGen}
                  className="px-6 py-3.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors glow-ember"
                >
                  Open the generator →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-10 text-sm">
          <div className="sm:col-span-2 md:col-span-1">
            <Logo />
            <p className="text-muted-foreground mt-4 max-w-xs leading-relaxed">
              Free AI text-to-voice generator. Production-grade neural speech, in your browser.
            </p>
          </div>
          {[
            { title: "Product", items: [["Generator", "#generator"], ["Voices", "#voices"], ["Features", "#features"]] },
            { title: "Resources", items: [["FAQ", "#faq"], ["API docs", "#"], ["Changelog", "#"]] },
            { title: "Legal", items: [["Privacy", "#"], ["Terms", "#"], ["Contact", "mailto:hi@mybots.in"]] },
          ].map((col) => (
            <div key={col.title}>
              <div className="mono-label mb-3">{col.title}</div>
              <ul className="space-y-2">
                {col.items.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap justify-between items-center gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} VoiceBot AI — voice.mybots.in</span>
            <span className="font-mono">build · stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
