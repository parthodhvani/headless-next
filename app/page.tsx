"use client";

import { useEffect, useState, useRef } from "react";

/* ══════════════════════════════════════════════════════════════
   API ENDPOINTS
══════════════════════════════════════════════════════════════ */
// const BASE = "https://speller-choking-twisted.ngrok-free.dev/headless";

// const BASE = "https://wordpressvercel123.infinityfreeapp.com/headless";

const BASE = "http://192.168.1.112/headless";
const PAGE_API    = `${BASE}/wp-json/wp/v2/pages/18`;
const OPTIONS_API = `${BASE}/wp-json/custom/v1/options`;
const MEDIA_API   = (id: number) => `${BASE}/wp-json/wp/v2/media/${id}`;

/* ══════════════════════════════════════════════════════════════
   INTERFACES
══════════════════════════════════════════════════════════════ */
interface AcfImage  { url: string; alt?: string; }
interface AcfLink   { title: string; url: string; target: string; }
interface NavItem   { label: string; url: string; }
interface SiteOptions {
  headerLogo:       AcfImage | null;
  headerButton:     AcfLink  | null;
  headerMenu:       NavItem[];
  footerLogo:       AcfImage | null;
  footerCopy:       string;
  /* NEW footer ACF fields (Options page) ─────────────────────
     footer_tagline         — short brand tagline under logo
     footer_description     — 1-2 sentence brand blurb
     footer_social[]        repeater
       social_platform      — "Twitter" / "LinkedIn" / "GitHub" etc.
       social_url           — https://…
       social_icon          — SVG string or emoji
     footer_columns[]       repeater
       column_title         — "Company" / "Product" / "Legal"
       column_links[]       repeater
         link_label         — "About Us"
         link_url           — /about
     footer_newsletter_text — "Stay in the loop…"
     footer_badge_text      — "SOC 2 Certified · GDPR Ready"
  ─────────────────────────────────────────────────────────── */
  footerTagline:    string;
  footerDesc:       string;
  footerSocial:     { platform: string; url: string; icon: string }[];
  footerColumns:    { title: string; links: { label: string; url: string }[] }[];
  footerNewsletter: string;
  footerBadge:      string;
  /* NEW header ACF fields ────────────────────────────────────
     header_announcement    — optional top-bar text (can be empty)
     header_announcement_url— link for announcement
  ─────────────────────────────────────────────────────────── */
  headerAnnouncement:    string;
  headerAnnouncementUrl: string;
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function parseMenuHtml(html: string): NavItem[] {
  if (!html) return [];
  const m = [...html.matchAll(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  return m.map((x) => ({ url: x[1], label: x[2].replace(/<[^>]+>/g, "").trim() }));
}

async function resolveMediaUrl(id: number | null | undefined): Promise<string> {
  if (!id) return "";
  try {
    const r = await fetch(MEDIA_API(id));
    const j = await r.json();
    return j?.source_url ?? "";
  } catch { return ""; }
}

function initials(name: string) {
  return (name || "").split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════════ */
function useReveal(deps: any[] = []) {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io  = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);
}

/* ══════════════════════════════════════════════════════════════
   PARTICLE CANVAS
══════════════════════════════════════════════════════════════ */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let raf: number;
    const COLORS = ["#00f0ff", "#7c3aed", "#a855f7", "#06b6d4", "#f0abfc"];
    const pts = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.6 + 0.2,
    }));
    function draw() {
      ctx!.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx!.beginPath();
          ctx!.strokeStyle = `rgba(124,58,237,${0.15 * (1 - d / 130)})`;
          ctx!.lineWidth = 0.5;
          ctx!.moveTo(pts[i].x, pts[i].y); ctx!.lineTo(pts[j].x, pts[j].y); ctx!.stroke();
        }
      }
      pts.forEach((p) => {
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0");
        ctx!.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }} />;
}

/* ══════════════════════════════════════════════════════════════
   FAQ ACCORDION
══════════════════════════════════════════════════════════════ */
function FaqAccordion({ items }: { items: any[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq-list">
      {items.map((faq, i) => (
        <div key={i} className={`faq-item${open === i ? " faq-item--open" : ""}`}>
          <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{faq.faq_title}</span>
            <span className="faq-icon">{open === i ? "−" : "+"}</span>
          </button>
          <div className="faq-a-wrap"><p className="faq-a">{faq.faq_content}</p></div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TESTIMONIAL CARDS
══════════════════════════════════════════════════════════════ */
function TestimonialCards({ testimonials }: { testimonials: any[] }) {
  const [active, setActive] = useState(0);
  if (!testimonials.length) return null;
  const t = testimonials[active];
  return (
    <div className="testi-wrap" data-reveal="fade-up">
      <div className="testi-tabs">
        {testimonials.map((item, i) => (
          <button key={i} onClick={() => setActive(i)} className={`testi-tab${i === active ? " testi-tab--active" : ""}`}>
            {item._resolvedImage
              ? <img src={item._resolvedImage} alt={item.name} className="testi-tab-img" />
              : <span className="testi-tab-initials">{initials(item.name)}</span>}
          </button>
        ))}
      </div>
      <div className="testi-card" key={active}>
        <div className="testi-card__glow" />
        <svg className="testi-quote-icon" width="36" height="28" viewBox="0 0 37 28" fill="none">
          <path d="M0 28V17.5C0 7.833 5.167 2.167 15.5 0L17 3C13 4.333 10.5 6.5 9.5 9.5H16V28H0ZM20 28V17.5C20 7.833 25.167 2.167 35.5 0L37 3C33 4.333 30.5 6.5 29.5 9.5H36V28H20Z" fill="url(#qg)"/>
          <defs><linearGradient id="qg" x1="0" y1="0" x2="37" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#7c3aed"/><stop offset="1" stopColor="#00f0ff"/></linearGradient></defs>
        </svg>
        <p className="testi-card__text">{t.about_compney}</p>
        <div className="testi-card__author">
          {t._resolvedImage
            ? <img src={t._resolvedImage} alt={t.name} className="testi-card__img" />
            : <div className="testi-card__avatar">{initials(t.name)}</div>}
          <div>
            <p className="testi-card__name">{t.name}</p>
            <p className="testi-card__role">{t.position}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MARQUEE
══════════════════════════════════════════════════════════════ */
function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-wrap">
      <span className="marquee-label">Trusted by teams at</span>
      <div className="marquee-track">
        <div className="marquee-inner">
          {doubled.map((text, i) => (
            <span key={i} className="marquee-item"><span className="marquee-dot" />{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   YOUTUBE MODAL
══════════════════════════════════════════════════════════════ */
function YouTubeModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-iframe-wrap">
          <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen className="modal-iframe" title="Demo" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NEWSLETTER SUBSCRIBE (footer widget)
══════════════════════════════════════════════════════════════ */
function NewsletterInput({ placeholder }: { placeholder: string }) {
  const [val, setVal]   = useState("");
  const [done, setDone] = useState(false);
  return done
    ? <p className="nl-done">✓ You're on the list!</p>
    : (
      <div className="nl-form">
        <input className="nl-input" type="email" value={val} onChange={e => setVal(e.target.value)}
          placeholder={placeholder || "Enter your email"} />
        <button className="nl-btn" onClick={() => val.includes("@") && setDone(true)}>Subscribe</button>
      </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [sections,  setSections]  = useState<any[]>([]);
  const [opts,      setOpts]      = useState<SiteOptions | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const DEMO_VIDEO_ID = "xmu8YoktGGU";

  useReveal([sections]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [pageRes, optsRes] = await Promise.all([fetch(PAGE_API), fetch(OPTIONS_API)]);
        const pageJson = await pageRes.json();
        const optsJson = await optsRes.json();

        /* Parse footer columns */
        const footerColumns = Array.isArray(optsJson?.footer_columns)
          ? optsJson.footer_columns.map((col: any) => ({
              title: col.column_title ?? "",
              links: Array.isArray(col.column_links)
                ? col.column_links.map((l: any) => ({ label: l.link_label ?? "", url: l.link_url ?? "#" }))
                : [],
            }))
          : [];

        /* Parse footer social */
        const footerSocial = Array.isArray(optsJson?.footer_social)
          ? optsJson.footer_social.map((s: any) => ({
              platform: s.social_platform ?? "",
              url:      s.social_url      ?? "#",
              icon:     s.social_icon     ?? "🔗",
            }))
          : [];

        setOpts({
          headerLogo:            optsJson?.header_logo         ?? null,
          headerButton:          optsJson?.header_button        ?? null,
          headerMenu:            parseMenuHtml(optsJson?.header_menu ?? ""),
          footerLogo:            optsJson?.footer_logo          ?? null,
          footerCopy:            optsJson?.footer_copy_right    ?? "",
          footerTagline:         optsJson?.footer_tagline       ?? "",
          footerDesc:            optsJson?.footer_description   ?? "",
          footerSocial,
          footerColumns,
          footerNewsletter:      optsJson?.footer_newsletter_text ?? "",
          footerBadge:           optsJson?.footer_badge_text    ?? "",
          headerAnnouncement:    optsJson?.header_announcement     ?? "",
          headerAnnouncementUrl: optsJson?.header_announcement_url ?? "",
        });

        const raw: any[] = pageJson?.acf?.page_builder ?? [];
        const resolved = await Promise.all(raw.map(async (s) => {
          if (s.acf_fc_layout === "hero" && s.background_image)
            return { ...s, _bgUrl: await resolveMediaUrl(s.background_image) };
          if (s.acf_fc_layout === "testimonials" && Array.isArray(s.testimonials))
            return { ...s, testimonials: await Promise.all(s.testimonials.map(async (t: any) => ({ ...t, _resolvedImage: await resolveMediaUrl(t.feature_image) }))) };
          if (s.acf_fc_layout === "team" && Array.isArray(s.team_members))
            return { ...s, team_members: await Promise.all(s.team_members.map(async (m: any) => ({ ...m, _resolvedImage: await resolveMediaUrl(m.member_image) }))) };
          if (s.acf_fc_layout === "portfolio" && Array.isArray(s.portfolio_items))
            return { ...s, portfolio_items: await Promise.all(s.portfolio_items.map(async (p: any) => ({ ...p, _resolvedImage: await resolveMediaUrl(p.project_image) }))) };
          return s;
        }));
        setSections(resolved);
      } catch (err) {
        console.error(err);
        setError("Failed to load page content.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(circle at center, #0f172a 0%, #020617 45%, #000 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          zIndex: 999999,
        }}
      >
        {/* Ambient Glow */}
        <div
          style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            background: "rgba(34,211,238,0.08)",
            filter: "blur(120px)",
            borderRadius: "50%",
            animation: "pulseGlow 4s ease-in-out infinite",
          }}
        />

        {/* Main Loader */}
        <div
          style={{
            position: "relative",
            width: "160px",
            height: "160px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Outer Ring */}
          <div className="ring ring1" />

          {/* Middle Ring */}
          <div className="ring ring2" />

          {/* Inner Ring */}
          <div className="ring ring3" />

          {/* Orb */}
          <div className="core" />

          {/* Floating Particles */}
          <span className="particle p1" />
          <span className="particle p2" />
          <span className="particle p3" />
          <span className="particle p4" />
        </div>

        <style jsx>{`
        .ring {
          position: absolute;
          border-radius: 50%;
        }

        .ring1 {
          width: 160px;
          height: 160px;
          border: 2px solid rgba(34, 211, 238, 0.12);
          border-top: 2px solid #22d3ee;
          animation: spin 2s linear infinite;
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.2);
        }

        .ring2 {
          width: 120px;
          height: 120px;
          border: 2px solid rgba(59, 130, 246, 0.12);
          border-bottom: 2px solid #3b82f6;
          animation: reverseSpin 3s linear infinite;
        }

        .ring3 {
          width: 80px;
          height: 80px;
          border: 2px solid rgba(168, 85, 247, 0.12);
          border-left: 2px solid #a855f7;
          animation: spin 1.5s linear infinite;
        }

        .core {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #22d3ee 0%,
            #3b82f6 50%,
            #a855f7 100%
          );
          box-shadow:
            0 0 25px rgba(34, 211, 238, 0.9),
            0 0 50px rgba(59, 130, 246, 0.5),
            0 0 80px rgba(168, 85, 247, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: white;
          opacity: 0.9;
        }

        .p1 {
          width: 6px;
          height: 6px;
          top: 10px;
          left: 50%;
          animation: orbit1 3s linear infinite;
        }

        .p2 {
          width: 4px;
          height: 4px;
          bottom: 20px;
          right: 10px;
          animation: orbit2 4s linear infinite;
        }

        .p3 {
          width: 5px;
          height: 5px;
          left: 0;
          top: 50%;
          animation: orbit3 5s linear infinite;
        }

        .p4 {
          width: 3px;
          height: 3px;
          right: 0;
          top: 40%;
          animation: orbit4 6s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes reverseSpin {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.35);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes orbit1 {
          0% {
            transform: rotate(0deg) translateX(80px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(80px) rotate(-360deg);
          }
        }

        @keyframes orbit2 {
          0% {
            transform: rotate(0deg) translateX(60px) rotate(0deg);
          }
          100% {
            transform: rotate(-360deg) translateX(60px) rotate(360deg);
          }
        }

        @keyframes orbit3 {
          0% {
            transform: rotate(0deg) translateX(100px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(100px) rotate(-360deg);
          }
        }

        @keyframes orbit4 {
          0% {
            transform: rotate(0deg) translateX(45px) rotate(0deg);
          }
          100% {
            transform: rotate(-360deg) translateX(45px) rotate(360deg);
          }
        }
      `}</style>
      </div>
    );
  }

  if (error) return null;

  const headerLogoUrl = opts?.headerLogo?.url ?? "";
  const footerLogoUrl = opts?.footerLogo?.url ?? "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Outfit', sans-serif; background: #030712; color: #e2e8f0; overflow-x: hidden; }
        a { text-decoration: none; color: inherit; }

        :root {
          --cyan:    #00f0ff;
          --violet:  #7c3aed;
          --purple:  #a855f7;
          --rose:    #fb7185;
          --amber:   #fbbf24;
          --dark:    #030712;
          --dark2:   #0d1117;
          --dark3:   #111827;
          --dark4:   #0a0f1a;
          --border:  rgba(255,255,255,0.06);
          --border2: rgba(124,58,237,0.25);
          --muted:   #94a3b8;
          --grad:    linear-gradient(135deg, #7c3aed 0%, #00f0ff 100%);
          --grad2:   linear-gradient(135deg, #fb7185 0%, #7c3aed 50%, #00f0ff 100%);
        }

        /* ── Scroll Reveal ── */
        [data-reveal] { opacity:0; transform:translateY(36px); transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1); }
        [data-reveal="fade-left"]  { transform:translateX(-36px); }
        [data-reveal="fade-right"] { transform:translateX(36px); }
        [data-reveal="scale"]      { transform:scale(0.9); }
        [data-reveal].revealed     { opacity:1!important; transform:none!important; }
        [data-delay="100"]{transition-delay:.1s}[data-delay="150"]{transition-delay:.15s}
        [data-delay="200"]{transition-delay:.2s}[data-delay="300"]{transition-delay:.3s}
        [data-delay="400"]{transition-delay:.4s}[data-delay="500"]{transition-delay:.5s}
        [data-delay="600"]{transition-delay:.6s}

        /* ── Loader ── */
        .ai-loader{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--dark);gap:20px;}
        .ai-loader__ring{width:48px;height:48px;border:2px solid rgba(124,58,237,.2);border-top-color:var(--violet);border-radius:50%;animation:spin .8s linear infinite;}
        .ai-loader__text{font-size:13px;color:var(--muted);letter-spacing:.1em;}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* ══════════════════════════════════════════════════════
           ANNOUNCEMENT BAR
        ══════════════════════════════════════════════════════ */
        .announce-bar{
          background:linear-gradient(90deg,rgba(124,58,237,.15),rgba(0,240,255,.1),rgba(124,58,237,.15));
          border-bottom:1px solid rgba(124,58,237,.2);
          text-align:center;padding:10px 24px;font-size:13px;color:rgba(255,255,255,.75);
          position:relative;z-index:201;letter-spacing:.02em;
        }
        .announce-bar a{color:var(--cyan);font-weight:600;margin-left:8px;}
        .announce-bar a:hover{text-decoration:underline;}
        .announce-bar__dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--cyan);margin-right:10px;animation:pulse-dot 2s ease infinite;vertical-align:middle;}

        /* ══════════════════════════════════════════════════════
           NAVIGATION — improved
        ══════════════════════════════════════════════════════ */
        .ai-nav{
          position:sticky;top:0;left:0;right:0;z-index:200;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 48px;height:72px;
          transition:background .3s,box-shadow .3s,backdrop-filter .3s;
        }
        .ai-nav--scrolled{
          background:rgba(3,7,18,.85);
          backdrop-filter:blur(24px) saturate(180%);
          box-shadow:0 1px 0 var(--border),0 4px 32px rgba(0,0,0,.4);
        }
        /* Logo */
        .ai-nav__logo-wrap{display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .ai-nav__logo{height:36px;object-fit:contain;}
        .ai-nav__logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#fff;letter-spacing:-.5px;}
        /* Links */
        .ai-nav__center{display:flex;align-items:center;gap:4px;list-style:none;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:100px;padding:4px 8px;}
        .ai-nav__link{
          font-size:14px;font-weight:500;color:var(--muted);
          padding:7px 18px;border-radius:100px;
          transition:color .2s,background .2s;white-space:nowrap;
        }
        .ai-nav__link:hover{color:#fff;background:rgba(255,255,255,.07);}
        .ai-nav__link--active{color:#fff;background:rgba(124,58,237,.2);}
        /* Right side */
        .ai-nav__right{display:flex;align-items:center;gap:12px;flex-shrink:0;}
        .ai-nav__ghost{
          background:transparent;color:rgba(255,255,255,.7);
          border:1px solid var(--border);border-radius:8px;
          padding:9px 20px;font-size:14px;font-weight:500;cursor:pointer;
          transition:color .2s,border-color .2s;font-family:inherit;
        }
        .ai-nav__ghost:hover{color:#fff;border-color:rgba(255,255,255,.2);}
        .ai-nav__cta{
          position:relative;overflow:hidden;
          background:var(--grad);color:#fff;border:none;border-radius:8px;
          padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;
          box-shadow:0 0 20px rgba(124,58,237,.3);
          transition:transform .2s,box-shadow .2s;font-family:inherit;
          display:flex;align-items:center;gap:6px;
        }
        .ai-nav__cta:hover{transform:translateY(-1px);box-shadow:0 0 32px rgba(124,58,237,.5);}
        .ai-nav__cta-arrow{font-size:16px;transition:transform .2s;}
        .ai-nav__cta:hover .ai-nav__cta-arrow{transform:translateX(3px);}
        /* Mobile burger */
        .ai-nav__burger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:4px;background:none;border:none;}
        .ai-nav__burger span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:transform .3s,opacity .3s;}
        .ai-nav__burger--open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
        .ai-nav__burger--open span:nth-child(2){opacity:0;}
        .ai-nav__burger--open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}
        /* Mobile menu */
        .ai-nav__mobile{
          position:fixed;top:72px;left:0;right:0;z-index:199;
          background:rgba(3,7,18,.97);backdrop-filter:blur(24px);
          border-bottom:1px solid var(--border);
          padding:24px 24px 32px;
          transform:translateY(-110%);opacity:0;
          transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .35s;
          pointer-events:none;
        }
        .ai-nav__mobile--open{transform:translateY(0);opacity:1;pointer-events:all;}
        .ai-nav__mobile-link{
          display:block;padding:14px 0;font-size:18px;font-weight:600;color:rgba(255,255,255,.7);
          border-bottom:1px solid var(--border);transition:color .2s;
        }
        .ai-nav__mobile-link:last-child{border-bottom:none;}
        .ai-nav__mobile-link:hover{color:#fff;}
        .ai-nav__mobile-cta{
          display:block;margin-top:20px;background:var(--grad);color:#fff;
          border-radius:10px;padding:14px;text-align:center;font-size:16px;font-weight:700;
        }

        /* ── HERO ── */
        .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 100px;overflow:hidden;}
        .hero__bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.25) saturate(1.2);}
        .hero__gradient{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(124,58,237,.3) 0%,transparent 70%),linear-gradient(180deg,transparent 40%,var(--dark) 100%);}
        .hero__grid{position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.04) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,black 0%,transparent 80%);}
        .hero__content{position:relative;z-index:3;max-width:820px;animation:heroIn 1s cubic-bezier(.22,1,.36,1) both;}
        @keyframes heroIn{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
        .hero__badge{display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.35);color:var(--purple);border-radius:100px;padding:7px 18px;font-size:13px;font-weight:500;margin-bottom:28px;animation:heroIn 1s .1s cubic-bezier(.22,1,.36,1) both;}
        .hero__badge-dot{width:7px;height:7px;border-radius:50%;background:var(--purple);animation:pulse-dot 2s ease infinite;}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        .hero__h1{font-family:'Syne',sans-serif;font-size:clamp(42px,7vw,88px);font-weight:800;color:#fff;line-height:1.04;letter-spacing:-3px;margin:0 0 24px;animation:heroIn 1s .2s cubic-bezier(.22,1,.36,1) both;}
        .hero__h1 span{background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hero__sub{font-size:clamp(16px,2vw,20px);color:var(--muted);line-height:1.7;max-width:540px;margin:0 auto 44px;animation:heroIn 1s .3s cubic-bezier(.22,1,.36,1) both;}
        .hero__btns{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;animation:heroIn 1s .4s cubic-bezier(.22,1,.36,1) both;}
        .hero__cta{position:relative;overflow:hidden;background:var(--grad);color:#fff;border:none;border-radius:10px;padding:15px 36px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 0 32px rgba(124,58,237,.4);transition:transform .2s,box-shadow .2s;font-family:inherit;}
        .hero__cta:hover{transform:translateY(-2px);box-shadow:0 0 48px rgba(124,58,237,.6);}
        .hero__demo{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:15px 32px;font-size:16px;font-weight:600;cursor:pointer;transition:background .2s,border-color .2s;backdrop-filter:blur(8px);font-family:inherit;}
        .hero__demo:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);}
        .hero__play{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;}
        .hero__note{margin-top:28px;font-size:13px;color:rgba(255,255,255,.3);animation:heroIn 1s .5s cubic-bezier(.22,1,.36,1) both;}

        /* ── SECTION COMMONS ── */
        .ai-section{padding:100px 48px;max-width:1160px;margin:0 auto;}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--cyan);letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px;}
        .eyebrow::before{content:'';display:block;width:20px;height:1px;background:var(--cyan);}
        .section-title{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:800;color:#fff;letter-spacing:-1.5px;line-height:1.1;margin:0 0 16px;}
        .section-title span{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .section-sub{font-size:17px;color:var(--muted);line-height:1.75;max-width:540px;margin:0 0 56px;}

        /* ── MARQUEE ── */
        .marquee-wrap{display:flex;align-items:center;overflow:hidden;padding:18px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:rgba(124,58,237,.03);}
        .marquee-label{font-size:11px;font-weight:600;color:rgba(255,255,255,.2);letter-spacing:.1em;text-transform:uppercase;padding:0 32px;flex-shrink:0;border-right:1px solid var(--border);white-space:nowrap;}
        .marquee-track{overflow:hidden;flex:1;}
        .marquee-inner{display:flex;align-items:center;width:max-content;animation:marquee-scroll 30s linear infinite;}
        @keyframes marquee-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .marquee-item{display:inline-flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:rgba(255,255,255,.25);padding:0 40px;white-space:nowrap;transition:color .2s;}
        .marquee-item:hover{color:rgba(255,255,255,.6);}
        .marquee-dot{width:4px;height:4px;border-radius:50%;background:var(--violet);flex-shrink:0;}

        /* ── FEATURES ── */
        .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;}
        .feature-card{position:relative;overflow:hidden;background:var(--dark3);border:1px solid var(--border);border-radius:20px;padding:32px;transition:border-color .3s,transform .3s,box-shadow .3s;cursor:default;}
        .feature-card::before{content:'';position:absolute;inset:0;border-radius:20px;background:var(--grad);opacity:0;transition:opacity .3s;mask-image:linear-gradient(135deg,black 0%,transparent 60%);}
        .feature-card:hover{border-color:rgba(124,58,237,.5);transform:translateY(-4px);box-shadow:0 20px 60px rgba(124,58,237,.12);}
        .feature-card:hover::before{opacity:.07;}
        .feature-card__num{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--violet);letter-spacing:.12em;margin-bottom:20px;display:block;}
        .feature-card__icon{font-size:32px;margin-bottom:16px;display:block;filter:drop-shadow(0 0 12px rgba(124,58,237,.5));}
        .feature-card__title{font-size:18px;font-weight:700;color:#fff;letter-spacing:-.4px;margin-bottom:10px;}
        .feature-card__desc{font-size:14px;color:var(--muted);line-height:1.75;}
        .feature-card__line{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--grad);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.22,1,.36,1);}
        .feature-card:hover .feature-card__line{transform:scaleX(1);}

        /* ── STATS BAR ── */
        .stats-bar{background:var(--dark2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:48px;}
        .stats-grid{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:40px;text-align:center;}
        .stat-item__number{font-family:'Syne',sans-serif;font-size:clamp(36px,5vw,56px);font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:8px;}
        .stat-item__label{font-size:14px;color:var(--muted);font-weight:500;letter-spacing:.02em;}

        /* ── HOW IT WORKS ── */
        .process-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0;position:relative;}
        .process-grid::before{content:'';position:absolute;top:36px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(124,58,237,.4),transparent);}
        .process-step{text-align:center;padding:0 24px 0;position:relative;}
        .process-step__bubble{width:72px;height:72px;border-radius:50%;background:var(--dark3);border:1px solid rgba(124,58,237,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--cyan);position:relative;transition:border-color .3s,box-shadow .3s;}
        .process-step__bubble::before{content:'';position:absolute;inset:-1px;border-radius:50%;background:var(--grad);opacity:0;transition:opacity .3s;z-index:-1;}
        .process-step:hover .process-step__bubble{border-color:transparent;box-shadow:0 0 30px rgba(124,58,237,.4);}
        .process-step:hover .process-step__bubble::before{opacity:1;}
        .process-step__title{font-size:16px;font-weight:700;color:#fff;margin-bottom:10px;}
        .process-step__desc{font-size:14px;color:var(--muted);line-height:1.7;}

        /* ── PRICING ── */
        .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;}
        .pricing-card{position:relative;background:var(--dark3);border:1px solid var(--border);border-radius:20px;padding:36px 32px;display:flex;flex-direction:column;gap:24px;transition:transform .3s,box-shadow .3s,border-color .3s;}
        .pricing-card--highlight{border-color:rgba(124,58,237,.5);box-shadow:0 0 60px rgba(124,58,237,.15);}
        .pricing-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(124,58,237,.12);}
        .pricing-card--highlight:hover{box-shadow:0 24px 80px rgba(124,58,237,.25);}
        .pricing-card__popular{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--grad);color:#fff;font-size:11px;font-weight:700;padding:5px 16px;border-radius:100px;letter-spacing:.06em;white-space:nowrap;}
        .pricing-card__name{font-size:14px;font-weight:600;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;}
        .pricing-card__price{display:flex;align-items:baseline;gap:4px;}
        .pricing-card__amount{font-family:'Syne',sans-serif;font-size:clamp(40px,5vw,56px);font-weight:800;color:#fff;line-height:1;}
        .pricing-card__period{font-size:14px;color:var(--muted);}
        .pricing-card__features{list-style:none;display:flex;flex-direction:column;gap:12px;flex:1;}
        .pricing-card__feature{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--muted);}
        .pricing-card__feature::before{content:'✓';color:var(--cyan);font-weight:700;flex-shrink:0;}
        .pricing-card__btn{display:block;text-align:center;padding:13px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .2s,transform .2s;border:none;font-family:inherit;}
        .pricing-card__btn--default{background:var(--dark2);color:#fff;border:1px solid var(--border);}
        .pricing-card__btn--highlight{background:var(--grad);color:#fff;box-shadow:0 0 24px rgba(124,58,237,.4);}
        .pricing-card__btn:hover{opacity:.9;transform:translateY(-1px);}

        /* ── FAQ ── */
        .faq-list{display:flex;flex-direction:column;}
        .faq-item{border-bottom:1px solid var(--border);}
        .faq-item:first-child{border-top:1px solid var(--border);}
        .faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 0;background:none;border:none;color:#fff;font-size:16px;font-weight:600;text-align:left;cursor:pointer;transition:color .2s;font-family:inherit;}
        .faq-item--open .faq-q{color:var(--cyan);}
        .faq-icon{font-size:22px;color:var(--violet);flex-shrink:0;transition:transform .3s;line-height:1;}
        .faq-item--open .faq-icon{transform:rotate(180deg);}
        .faq-a-wrap{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.22,1,.36,1);}
        .faq-item--open .faq-a-wrap{max-height:400px;}
        .faq-a{padding:0 0 20px;font-size:15px;color:var(--muted);line-height:1.8;}

        /* ── TESTIMONIALS ── */
        .testi-wrap{max-width:800px;margin:0 auto;}
        .testi-tabs{display:flex;gap:12px;justify-content:center;margin-bottom:36px;flex-wrap:wrap;}
        .testi-tab{width:52px;height:52px;border-radius:50%;border:2px solid var(--border);background:var(--dark3);cursor:pointer;overflow:hidden;transition:border-color .25s,transform .25s,box-shadow .25s;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .testi-tab:hover{transform:scale(1.08);border-color:var(--violet);}
        .testi-tab--active{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(0,240,255,.18);transform:scale(1.1);}
        .testi-tab-img{width:100%;height:100%;object-fit:cover;}
        .testi-tab-initials{font-size:16px;font-weight:700;color:var(--cyan);}
        .testi-card{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(124,58,237,.08) 0%,rgba(0,240,255,.04) 100%);border:1px solid rgba(124,58,237,.2);border-radius:24px;padding:48px 52px;animation:testi-pop .45s cubic-bezier(.22,1,.36,1) both;}
        @keyframes testi-pop{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
        .testi-card__glow{position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.25) 0%,transparent 70%);pointer-events:none;}
        .testi-quote-icon{margin-bottom:20px;display:block;opacity:.8;}
        .testi-card__text{font-size:19px;color:rgba(255,255,255,.88);line-height:1.8;font-style:italic;letter-spacing:-.2px;margin-bottom:32px;position:relative;z-index:1;}
        .testi-card__author{display:flex;align-items:center;gap:14px;}
        .testi-card__img{width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid rgba(124,58,237,.4);flex-shrink:0;}
        .testi-card__avatar{width:52px;height:52px;border-radius:50%;background:rgba(124,58,237,.2);color:var(--purple);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;}
        .testi-card__name{font-size:15px;font-weight:700;color:#fff;margin-bottom:3px;}
        .testi-card__role{font-size:13px;color:var(--muted);}

        /* ── TEAM ── */
        .team-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;}
        .team-card{background:var(--dark3);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:transform .3s,border-color .3s,box-shadow .3s;}
        .team-card:hover{transform:translateY(-4px);border-color:rgba(124,58,237,.4);box-shadow:0 20px 60px rgba(124,58,237,.1);}
        .team-card__img-wrap{position:relative;height:240px;overflow:hidden;background:var(--dark2);}
        .team-card__img{width:100%;height:100%;object-fit:cover;transition:transform .5s;}
        .team-card:hover .team-card__img{transform:scale(1.05);}
        .team-card__overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(3,7,18,.8) 100%);}
        .team-card__initials{width:80px;height:80px;border-radius:50%;background:rgba(124,58,237,.2);border:1px solid rgba(124,58,237,.3);color:var(--purple);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:auto;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}
        .team-card__body{padding:20px;}
        .team-card__name{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;}
        .team-card__role{font-size:13px;color:var(--cyan);font-weight:500;margin-bottom:10px;}
        .team-card__bio{font-size:13px;color:var(--muted);line-height:1.6;}

        /* ── PORTFOLIO ── */
        .portfolio-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;}
        .portfolio-card{position:relative;border-radius:20px;overflow:hidden;border:1px solid var(--border);background:var(--dark3);transition:transform .3s,box-shadow .3s,border-color .3s;cursor:pointer;}
        .portfolio-card:hover{transform:translateY(-6px);box-shadow:0 30px 80px rgba(124,58,237,.18);border-color:rgba(124,58,237,.4);}
        .portfolio-card__img-wrap{height:220px;overflow:hidden;background:var(--dark2);}
        .portfolio-card__img{width:100%;height:100%;object-fit:cover;transition:transform .5s;}
        .portfolio-card:hover .portfolio-card__img{transform:scale(1.06);}
        .portfolio-card__body{padding:24px;}
        .portfolio-card__tag{display:inline-block;background:rgba(124,58,237,.15);color:var(--purple);font-size:11px;font-weight:600;padding:4px 12px;border-radius:100px;letter-spacing:.06em;margin-bottom:10px;}
        .portfolio-card__title{font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;letter-spacing:-.4px;}
        .portfolio-card__desc{font-size:14px;color:var(--muted);line-height:1.65;margin-bottom:16px;}
        .portfolio-card__link{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--cyan);transition:gap .2s;}
        .portfolio-card:hover .portfolio-card__link{gap:10px;}

        /* ── CTA SECTION ── */
        .cta-section{position:relative;overflow:hidden;text-align:center;padding:100px 48px;background:var(--dark2);}
        .cta-section__glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:300px;background:radial-gradient(ellipse,rgba(124,58,237,.35) 0%,transparent 70%);pointer-events:none;}
        .cta-section__grid{position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.05) 1px,transparent 1px);background-size:50px 50px;mask-image:radial-gradient(ellipse 70% 80% at 50% 50%,black 0%,transparent 80%);}
        .cta-section__content{position:relative;z-index:2;max-width:700px;margin:0 auto;}
        .cta-section__title{font-family:'Syne',sans-serif;font-size:clamp(32px,5vw,56px);font-weight:800;color:#fff;letter-spacing:-2px;line-height:1.08;margin-bottom:20px;}
        .cta-section__sub{font-size:18px;color:var(--muted);margin-bottom:40px;line-height:1.7;}
        .cta-section__btn{display:inline-block;background:var(--grad);color:#fff;border:none;border-radius:12px;padding:16px 44px;font-size:17px;font-weight:700;cursor:pointer;box-shadow:0 0 40px rgba(124,58,237,.5);transition:transform .2s,box-shadow .2s;font-family:inherit;}
        .cta-section__btn:hover{transform:translateY(-3px);box-shadow:0 0 60px rgba(124,58,237,.7);}

        /* ══════════════════════════════════════════════════════
           FOOTER — completely redesigned
        ══════════════════════════════════════════════════════ */
        .ai-footer{
          background:var(--dark4);
          border-top:1px solid var(--border);
          position:relative;overflow:hidden;
        }
        /* top glow */
        .ai-footer::before{
          content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
          width:60%;height:1px;
          background:linear-gradient(90deg,transparent,var(--violet),var(--cyan),var(--violet),transparent);
        }
        /* subtle grid */
        .ai-footer__grid-bg{
          position:absolute;inset:0;
          background-image:linear-gradient(rgba(124,58,237,.03) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(124,58,237,.03) 1px,transparent 1px);
          background-size:48px 48px;
          mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,black 0%,transparent 80%);
          pointer-events:none;
        }

        /* main footer body */
        .ai-footer__body{
          position:relative;z-index:1;
          max-width:1160px;margin:0 auto;
          padding:64px 48px 0;
          display:grid;
          grid-template-columns:1.4fr repeat(3,1fr) 1.2fr;
          gap:48px;
        }

        /* brand column */
        .footer-brand{}
        .footer-brand__logo{height:36px;object-fit:contain;margin-bottom:16px;display:block;}
        .footer-brand__logo-text{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:12px;display:block;letter-spacing:-.5px;}
        .footer-brand__tagline{font-size:13px;font-weight:600;color:var(--cyan);letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px;}
        .footer-brand__desc{font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:24px;}
        /* socials */
        .footer-socials{display:flex;gap:10px;flex-wrap:wrap;}
        .footer-social-btn{
          width:38px;height:38px;border-radius:10px;
          background:rgba(255,255,255,.04);border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;color:var(--muted);
          transition:background .2s,border-color .2s,color .2s,transform .2s;
          cursor:pointer;text-decoration:none;
        }
        .footer-social-btn:hover{background:rgba(124,58,237,.15);border-color:var(--border2);color:#fff;transform:translateY(-2px);}

        /* nav columns */
        .footer-col{}
        .footer-col__title{font-size:12px;font-weight:700;color:#fff;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px;}
        .footer-col__links{list-style:none;display:flex;flex-direction:column;gap:12px;}
        .footer-col__link{font-size:14px;color:var(--muted);transition:color .2s;display:flex;align-items:center;gap:6px;}
        .footer-col__link:hover{color:#fff;}
        .footer-col__link::before{content:'';display:block;width:0;height:1px;background:var(--cyan);transition:width .2s;}
        .footer-col__link:hover::before{width:8px;}

        /* newsletter column */
        .footer-newsletter{}
        .footer-newsletter__title{font-size:12px;font-weight:700;color:#fff;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;}
        .footer-newsletter__text{font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:20px;}
        .nl-form{display:flex;flex-direction:column;gap:10px;}
        .nl-input{
          background:rgba(255,255,255,.04);border:1px solid var(--border);
          border-radius:8px;padding:11px 14px;font-size:14px;color:#fff;
          font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s;
        }
        .nl-input::placeholder{color:rgba(255,255,255,.25);}
        .nl-input:focus{border-color:var(--border2);box-shadow:0 0 0 3px rgba(124,58,237,.12);}
        .nl-btn{
          background:var(--grad);color:#fff;border:none;border-radius:8px;
          padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;
          transition:opacity .2s,transform .2s;box-shadow:0 0 20px rgba(124,58,237,.25);
        }
        .nl-btn:hover{opacity:.9;transform:translateY(-1px);}
        .nl-done{font-size:14px;color:var(--cyan);font-weight:600;padding:12px 0;}

        /* divider */
        .ai-footer__divider{
          position:relative;z-index:1;
          max-width:1160px;margin:0 auto;padding:0 48px;
          margin-top:48px;
        }
        .ai-footer__divider-line{height:1px;background:var(--border);}

        /* bottom bar */
        .ai-footer__bottom{
          position:relative;z-index:1;
          max-width:1160px;margin:0 auto;
          padding:24px 48px 40px;
          display:flex;align-items:center;justify-content:space-between;
          gap:20px;flex-wrap:wrap;
        }
        .ai-footer__copy{font-size:13px;color:rgba(255,255,255,.25);}
        .ai-footer__badges{display:flex;gap:10px;flex-wrap:wrap;}
        .ai-footer__badge{
          font-size:11px;font-weight:600;color:rgba(255,255,255,.35);
          border:1px solid rgba(255,255,255,.08);border-radius:6px;
          padding:4px 12px;letter-spacing:.04em;
        }
        .ai-footer__bottom-links{display:flex;gap:20px;}
        .ai-footer__bottom-link{font-size:13px;color:rgba(255,255,255,.25);transition:color .2s;}
        .ai-footer__bottom-link:hover{color:var(--cyan);}

        /* ── MODAL ── */
        .modal-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(12px);animation:fade-in .2s ease;}
        @keyframes fade-in{from{opacity:0}to{opacity:1}}
        .modal-box{position:relative;width:100%;max-width:900px;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,.3);box-shadow:0 0 80px rgba(124,58,237,.3);animation:modal-pop .3s cubic-bezier(.22,1,.36,1);}
        @keyframes modal-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
        .modal-close{position:absolute;top:-44px;right:0;background:transparent;border:none;color:rgba(255,255,255,.6);font-size:36px;cursor:pointer;line-height:1;transition:color .2s;}
        .modal-close:hover{color:#fff;}
        .modal-iframe-wrap{position:relative;padding-bottom:56.25%;height:0;}
        .modal-iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none;}

        /* ── RESPONSIVE ── */
        @media(max-width:1024px){
          .ai-footer__body{grid-template-columns:1fr 1fr;gap:36px;}
          .footer-brand{grid-column:1/-1;}
        }
        @media(max-width:768px){
          .ai-nav{padding:0 20px;}
          .ai-nav__center,.ai-nav__ghost{display:none;}
          .ai-nav__burger{display:flex;}
          .ai-section{padding:72px 20px;}
          .testi-card{padding:32px 24px;}
          .cta-section{padding:72px 20px;}
          .hero__h1{letter-spacing:-2px;}
          .process-grid::before{display:none;}
          .ai-footer__body{grid-template-columns:1fr;padding:48px 24px 0;}
          .footer-brand{grid-column:auto;}
          .ai-footer__bottom{padding:20px 24px 32px;flex-direction:column;align-items:flex-start;gap:12px;}
          .ai-footer__divider{padding:0 24px;}
        }
      `}</style>

      {videoOpen && <YouTubeModal videoId={DEMO_VIDEO_ID} onClose={() => setVideoOpen(false)} />}

      {/* ════════════
          ANNOUNCEMENT BAR
          ACF Options: header_announcement, header_announcement_url
      ════════════ */}
      {opts?.headerAnnouncement && (
        <div className="announce-bar">
          <span className="announce-bar__dot" />
          {opts.headerAnnouncement}
          {opts.headerAnnouncementUrl && (
            <a href={opts.headerAnnouncementUrl}>Learn more →</a>
          )}
        </div>
      )}

      {/* ════════════
          NAV
      ════════════ */}
      <nav className={`ai-nav${scrolled ? " ai-nav--scrolled" : ""}`}>
        <div className="ai-nav__logo-wrap">
          <a href="/">
            {headerLogoUrl
              ? <img src={headerLogoUrl} alt="Logo" className="ai-nav__logo" />
              : <span className="ai-nav__logo-text">⬡ Site</span>}
          </a>
        </div>

        <ul className="ai-nav__center">
          {opts?.headerMenu.map((item, i) => (
            <li key={i}><a href={item.url} className="ai-nav__link">{item.label}</a></li>
          ))}
        </ul>

        <div className="ai-nav__right">
          <button className="ai-nav__ghost">Sign in</button>
          {opts?.headerButton && (
            <a href={opts.headerButton.url} target={opts.headerButton.target || "_self"}>
              <button className="ai-nav__cta">
                {opts.headerButton.title}
                <span className="ai-nav__cta-arrow">→</span>
              </button>
            </a>
          )}
          <button className={`ai-nav__burger${menuOpen ? " ai-nav__burger--open" : ""}`}
            onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`ai-nav__mobile${menuOpen ? " ai-nav__mobile--open" : ""}`}>
        {opts?.headerMenu.map((item, i) => (
          <a key={i} href={item.url} className="ai-nav__mobile-link" onClick={() => setMenuOpen(false)}>{item.label}</a>
        ))}
        {opts?.headerButton && (
          <a href={opts.headerButton.url} className="ai-nav__mobile-cta">{opts.headerButton.title}</a>
        )}
      </div>

      {/* ════════════  SECTIONS  ════════════ */}
      <main>
        {sections.map((section, index) => {

          if (section.acf_fc_layout === "hero") {
            return (
              <section key={index} className="hero">
                {section._bgUrl && (
                  <div className="hero__bg" style={{ backgroundImage: `url(${section._bgUrl})` }} />
                )}
                <div className="hero__gradient" />
                <div className="hero__grid" />
                <ParticleCanvas />
                <div className="hero__content">
                  <div className="hero__badge">
                    <span className="hero__badge-dot" />
                    🚀 Now in Public Beta
                  </div>
                  <h1 className="hero__h1">
                    {(() => {
                      const words = (section.heading || "").split(" ");
                      const last  = words.pop();
                      return <>{words.join(" ")} <span>{last}</span></>;
                    })()}
                  </h1>
                  <p className="hero__sub">{section.subheading}</p>
                  <div className="hero__btns">
                    {section.cta_url && (
                      <a href={section.cta_url}>
                        <button className="hero__cta">{section.cta_text || "Get Started"}</button>
                      </a>
                    )}
                    <button className="hero__demo" onClick={() => setVideoOpen(true)}>
                      <span className="hero__play">▶</span>Watch Demo
                    </button>
                  </div>
                  <p className="hero__note">No credit card required · 14-day free trial</p>
                </div>
              </section>
            );
          }

          if (section.acf_fc_layout === "features") {
            const marqueeItems: string[] = Array.isArray(section.marequee)
              ? section.marequee.map((m: any) => m.marequee_content).filter(Boolean)
              : [];
            return (
              <div key={index}>
                {marqueeItems.length > 0 && <Marquee items={marqueeItems} />}
                <div style={{ background: "var(--dark)" }}>
                  <div className="ai-section">
                    <div data-reveal="fade-up">
                      <span className="eyebrow">Features</span>
                      <h2 className="section-title">{section.section_title}</h2>
                    </div>
                    <div className="features-grid">
                      {(section.features_list ?? []).map((f: any, i: number) => (
                        <div key={i} className="feature-card" data-reveal="fade-up" data-delay={String(i * 100)}>
                          <span className="feature-card__num">0{i + 1}</span>
                          <span className="feature-card__icon">{f.list?.split(" ")[0]}</span>
                          <h3 className="feature-card__title">{f.list?.replace(/^.\s/, "")}</h3>
                          <p className="feature-card__desc">{f.description}</p>
                          <div className="feature-card__line" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "stats_bar") {
            return (
              <div key={index} className="stats-bar">
                <div className="stats-grid">
                  {(section.stats ?? []).map((s: any, i: number) => (
                    <div key={i} data-reveal="scale" data-delay={String(i * 100)}>
                      <div className="stat-item__number">{s.stat_number}</div>
                      <div className="stat-item__label">{s.stat_label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "how_it_works") {
            return (
              <div key={index} style={{ background: "var(--dark3)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up" style={{ textAlign: "center", marginBottom: 64 }}>
                    <span className="eyebrow" style={{ justifyContent: "center" }}>How It Works</span>
                    <h2 className="section-title" style={{ textAlign: "center", maxWidth: "none" }}>{section.section_title}</h2>
                    {section.section_subtitle && (
                      <p className="section-sub" style={{ margin: "0 auto", textAlign: "center" }}>{section.section_subtitle}</p>
                    )}
                  </div>
                  <div className="process-grid">
                    {(section.steps ?? []).map((step: any, i: number) => (
                      <div key={i} className="process-step" data-reveal="fade-up" data-delay={String(i * 150)}>
                        <div className="process-step__bubble">{step.step_number || `0${i + 1}`}</div>
                        <h3 className="process-step__title">{step.step_title}</h3>
                        <p className="process-step__desc">{step.step_desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "team") {
            return (
              <div key={index} style={{ background: "var(--dark2)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up">
                    <span className="eyebrow">Our Team</span>
                    <h2 className="section-title">{section.section_title}</h2>
                  </div>
                  <div className="team-grid">
                    {(section.team_members ?? []).map((m: any, i: number) => (
                      <div key={i} className="team-card" data-reveal="fade-up" data-delay={String(i * 100)}>
                        <div className="team-card__img-wrap">
                          {m._resolvedImage
                            ? <><img src={m._resolvedImage} alt={m.member_name} className="team-card__img" /><div className="team-card__overlay" /></>
                            : <div className="team-card__initials">{initials(m.member_name || "")}</div>}
                        </div>
                        <div className="team-card__body">
                          <p className="team-card__name">{m.member_name}</p>
                          <p className="team-card__role">{m.member_role}</p>
                          <p className="team-card__bio">{m.member_bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "portfolio") {
            return (
              <div key={index} style={{ background: "var(--dark)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up">
                    <span className="eyebrow">Our Work</span>
                    <h2 className="section-title">{section.section_title}</h2>
                    {section.section_subtitle && <p className="section-sub">{section.section_subtitle}</p>}
                  </div>
                  <div className="portfolio-grid">
                    {(section.portfolio_items ?? []).map((p: any, i: number) => (
                      <div key={i} className="portfolio-card" data-reveal="fade-up" data-delay={String(i * 100)}>
                        <div className="portfolio-card__img-wrap">
                          {p._resolvedImage
                            ? <img src={p._resolvedImage} alt={p.project_title} className="portfolio-card__img" />
                            : <div style={{ height:"100%", background:"linear-gradient(135deg,rgba(124,58,237,.2),rgba(0,240,255,.1))" }} />}
                        </div>
                        <div className="portfolio-card__body">
                          {p.project_category && <span className="portfolio-card__tag">{p.project_category}</span>}
                          <h3 className="portfolio-card__title">{p.project_title}</h3>
                          <p className="portfolio-card__desc">{p.project_desc}</p>
                          {p.project_url && <a href={p.project_url} className="portfolio-card__link">View Project →</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "pricing") {
            return (
              <div key={index} style={{ background: "var(--dark3)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up" style={{ textAlign: "center", marginBottom: 56 }}>
                    <span className="eyebrow" style={{ justifyContent: "center" }}>Pricing</span>
                    <h2 className="section-title" style={{ textAlign: "center", maxWidth: "none" }}>{section.section_title}</h2>
                    {section.section_subtitle && <p className="section-sub" style={{ margin: "0 auto" }}>{section.section_subtitle}</p>}
                  </div>
                  <div className="pricing-grid">
                    {(section.pricing_plans ?? []).map((plan: any, i: number) => {
                      const isHighlight = plan.plan_highlight === true || plan.plan_highlight === "1" || plan.plan_highlight === 1;
                      return (
                        <div key={i} className={`pricing-card${isHighlight ? " pricing-card--highlight" : ""}`} data-reveal="fade-up" data-delay={String(i * 100)}>
                          {isHighlight && <div className="pricing-card__popular">Most Popular</div>}
                          <p className="pricing-card__name">{plan.plan_name}</p>
                          <div className="pricing-card__price">
                            <span className="pricing-card__amount">{plan.plan_price}</span>
                            {plan.plan_period && <span className="pricing-card__period">{plan.plan_period}</span>}
                          </div>
                          <ul className="pricing-card__features">
                            {(plan.plan_features ?? []).map((f: any, j: number) => (
                              <li key={j} className="pricing-card__feature">{f.feature_text}</li>
                            ))}
                          </ul>
                          {plan.plan_cta_url && (
                            <a href={plan.plan_cta_url}>
                              <button className={`pricing-card__btn${isHighlight ? " pricing-card__btn--highlight" : " pricing-card__btn--default"}`}>
                                {plan.plan_cta_label || "Get Started"}
                              </button>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "faq_section") {
            return (
              <div key={index} style={{ background: "var(--dark2)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up">
                    <span className="eyebrow">FAQ</span>
                    <h2 className="section-title">Got <span>questions?</span></h2>
                    <p className="section-sub">Everything you need to know.</p>
                  </div>
                  <div data-reveal="fade-up" data-delay="200">
                    <FaqAccordion items={section.faq_items ?? []} />
                  </div>
                  <p style={{ marginTop:40, fontSize:15, color:"var(--muted)" }} data-reveal="fade-up" data-delay="300">
                    Still have questions?{" "}
                    <a href="#" style={{ color:"var(--cyan)", fontWeight:600 }}>Chat with our team →</a>
                  </p>
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "testimonials") {
            return (
              <div key={index} style={{ background: "var(--dark)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up" style={{ textAlign:"center", marginBottom:8 }}>
                    <span className="eyebrow" style={{ justifyContent:"center" }}>Testimonials</span>
                    <h2 className="section-title" style={{ maxWidth:"none", textAlign:"center" }}>
                      What Our Clients Say About Our <span>AI Blockchain</span> Platform
                    </h2>
                    <p className="section-sub" style={{ margin:"0 auto 48px", textAlign:"center" }}>
                      Don't take our word for it — hear from the teams shipping faster every day.
                    </p>
                  </div>
                  <TestimonialCards testimonials={section.testimonials ?? []} />
                </div>
              </div>
            );
          }

          if (section.acf_fc_layout === "cta_section") {
            const btn = section.cta_button ?? {};
            return (
              <div key={index} className="cta-section">
                <div className="cta-section__glow" />
                <div className="cta-section__grid" />
                <div className="cta-section__content">
                  <div data-reveal="fade-up">
                    <span className="eyebrow" style={{ justifyContent:"center" }}>Get Started</span>
                    <h2 className="cta-section__title">{section.heading}</h2>
                    <p className="cta-section__sub">{section.sub_heading}</p>
                    {btn.url && (
                      <a href={btn.url} target={btn.target || "_self"} rel={btn.target === "_blank" ? "noopener noreferrer" : undefined}>
                        <button className="cta-section__btn">{btn.title || "Get Started"}</button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </main>

      {/* ════════════════════════════════════════════════════
          FOOTER — redesigned
          ACF Options fields:
            footer_logo              — image object {url}
            footer_copy_right        — "© 2025 …"
            footer_tagline           — short tagline under logo
            footer_description       — brand blurb
            footer_social[]          repeater
              social_platform        — "Twitter"
              social_url             — https://…
              social_icon            — emoji or SVG string
            footer_columns[]         repeater
              column_title           — "Company"
              column_links[]         repeater
                link_label           — "About Us"
                link_url             — /about
            footer_newsletter_text   — newsletter pitch copy
            footer_badge_text        — "SOC 2 · GDPR" (shown as badges)
      ════════════════════════════════════════════════════ */}
      <footer className="ai-footer">
        <div className="ai-footer__grid-bg" />

        <div className="ai-footer__body">
          {/* Brand column */}
          <div className="footer-brand">
            {footerLogoUrl
              ? <img src={footerLogoUrl} alt="Logo" className="footer-brand__logo" />
              : <span className="footer-brand__logo-text">⬡ Site</span>}
            {opts?.footerTagline && <span className="footer-brand__tagline">{opts.footerTagline}</span>}
            <p className="footer-brand__desc">
              {opts?.footerDesc || "Building next-generation AI & blockchain infrastructure for the teams of tomorrow."}
            </p>
            <div className="footer-socials">
              {(opts?.footerSocial ?? []).map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="footer-social-btn" title={s.platform}>
                  {s.icon}
                </a>
              ))}
              {/* Fallback icons if no ACF data */}
              {(opts?.footerSocial ?? []).length === 0 && (
                <>
                  <a href="#" className="footer-social-btn" title="Twitter">𝕏</a>
                  <a href="#" className="footer-social-btn" title="LinkedIn">in</a>
                  <a href="#" className="footer-social-btn" title="GitHub">⌥</a>
                  <a href="#" className="footer-social-btn" title="Discord">◈</a>
                </>
              )}
            </div>
          </div>

          {/* Nav columns from ACF */}
          {(opts?.footerColumns ?? []).map((col, ci) => (
            <div key={ci} className="footer-col">
              <p className="footer-col__title">{col.title}</p>
              <ul className="footer-col__links">
                {col.links.map((lnk, li) => (
                  <li key={li}><a href={lnk.url} className="footer-col__link">{lnk.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
          {/* Fallback columns if no ACF data */}
          {(opts?.footerColumns ?? []).length === 0 && (
            <>
              {[
                { title:"Product", links:[["Features","#"],["Pricing","#"],["Changelog","#"],["Roadmap","#"]] },
                { title:"Company", links:[["About","#"],["Blog","#"],["Careers","#"],["Press","#"]] },
                { title:"Legal",   links:[["Privacy","#"],["Terms","#"],["Security","#"],["Cookies","#"]] },
              ].map((col, ci) => (
                <div key={ci} className="footer-col">
                  <p className="footer-col__title">{col.title}</p>
                  <ul className="footer-col__links">
                    {col.links.map(([label, url], li) => (
                      <li key={li}><a href={url} className="footer-col__link">{label}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}

          {/* Newsletter column */}
          <div className="footer-newsletter">
            <p className="footer-newsletter__title">Stay Updated</p>
            <p className="footer-newsletter__text">
              {opts?.footerNewsletter || "Get the latest on AI, blockchain, and platform updates — no spam ever."}
            </p>
            <NewsletterInput placeholder="your@email.com" />
          </div>
        </div>

        <div className="ai-footer__divider"><div className="ai-footer__divider-line" /></div>

        <div className="ai-footer__bottom">
          <p className="ai-footer__copy">
            {opts?.footerCopy || `© ${new Date().getFullYear()} Site Inc. All rights reserved.`}
          </p>
          <div className="ai-footer__badges">
            {opts?.footerBadge
              ? opts.footerBadge.split("·").map((b, i) => (
                  <span key={i} className="ai-footer__badge">{b.trim()}</span>
                ))
              : <>
                  <span className="ai-footer__badge">SOC 2 Certified</span>
                  <span className="ai-footer__badge">GDPR Ready</span>
                  <span className="ai-footer__badge">ISO 27001</span>
                </>
            }
          </div>
          <div className="ai-footer__bottom-links">
            {opts?.headerMenu.slice(0,4).map((item, i) => (
              <a key={i} href={item.url} className="ai-footer__bottom-link">{item.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}