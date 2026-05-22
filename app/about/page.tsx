"use client";

import { useEffect, useState } from "react";

/* ══════════════════════════════════════════════════════════════
   API ENDPOINTS
   Page slug / ID for About Us — update the ID (e.g. 22) to match
   your WordPress page.
══════════════════════════════════════════════════════════════ */
const BASE = "http://192.168.1.112/headless";
// const BASE = "https://speller-choking-twisted.ngrok-free.dev/headless";

// const BASE = "https://wordpressvercel123.infinityfreeapp.com/headless/";
const PAGE_API    = `${BASE}/wp-json/wp/v2/pages/209`;          // ← update page ID
const OPTIONS_API = `${BASE}/wp-json/custom/v1/options`;
const MEDIA_API   = (id: number) => `${BASE}/wp-json/wp/v2/media/${id}`;

/* ══════════════════════════════════════════════════════════════
   ACF FIELD MAP — About Us page
   ─────────────────────────────────────────────────────────────
   Flexible Content field name: page_builder
   Layouts:
   ┌─────────────────────────────────────────────────────────────
   │ about_hero
   │   heading            — "We're Building the Future of AI"
   │   subheading         — short intro text
   │   hero_badge         — badge text e.g. "Est. 2021"
   │   background_image   — image ID
   ├─────────────────────────────────────────────────────────────
   │ about_mission
   │   section_title      — "Our Mission"
   │   mission_text       — long paragraph
   │   mission_highlight  — pull-quote / bold statement
   │   mission_image      — image ID
   ├─────────────────────────────────────────────────────────────
   │ about_values
   │   section_title      — "What We Stand For"
   │   section_subtitle   — supporting text
   │   values[]           repeater
   │     value_icon       — emoji or short text
   │     value_title      — "Transparency"
   │     value_desc       — description
   ├─────────────────────────────────────────────────────────────
   │ about_story          (horizontal timeline)
   │   section_title      — "Our Story"
   │   timeline[]         repeater
   │     year             — "2021"
   │     event_title      — "Founded in Ahmedabad"
   │     event_desc       — description
   ├─────────────────────────────────────────────────────────────
   │ about_team           (same as home team layout)
   │   section_title      — heading
   │   team_members[]     repeater
   │     member_name      — full name
   │     member_role      — job title
   │     member_bio       — bio
   │     member_image     — image ID
   ├─────────────────────────────────────────────────────────────
   │ about_stats
   │   stats[]            repeater
   │     stat_number      — "120+"
   │     stat_label       — "Countries"
   │     stat_icon        — emoji
   ├─────────────────────────────────────────────────────────────
   │ about_awards
   │   section_title      — "Recognition & Awards"
   │   awards[]           repeater
   │     award_name       — "Forbes AI 50"
   │     award_year       — "2024"
   │     award_body       — "Forbes"
   │     award_icon       — emoji
   ├─────────────────────────────────────────────────────────────
   │ about_cta
   │   heading            — "Join Us on the Journey"
   │   sub_heading        — supporting copy
   │   cta_button         — link field {title, url, target}
   └─────────────────────────────────────────────────────────────
══════════════════════════════════════════════════════════════ */

interface NavItem { label: string; url: string; }
interface SiteOptions {
  headerLogo:   { url: string } | null;
  headerButton: { title: string; url: string; target: string } | null;
  headerMenu:   NavItem[];
  footerLogo:   { url: string } | null;
  footerCopy:   string;
  footerTagline: string;
  footerDesc:   string;
  footerSocial: { platform: string; url: string; icon: string }[];
  footerColumns:{ title: string; links:{ label: string; url: string }[] }[];
  footerNewsletter: string;
  footerBadge:  string;
}

function parseMenuHtml(html: string): NavItem[] {
  if (!html) return [];
  const m = [...html.matchAll(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  return m.map((x) => ({ url: x[1], label: x[2].replace(/<[^>]+>/g, "").trim() }));
}

async function resolveMediaUrl(id: number | null | undefined): Promise<string> {
  if (!id) return "";
  try { const r = await fetch(MEDIA_API(id)); const j = await r.json(); return j?.source_url ?? ""; }
  catch { return ""; }
}

function initials(name: string) {
  return (name || "").split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

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
   NEWSLETTER INPUT
══════════════════════════════════════════════════════════════ */
function NewsletterInput({ placeholder }: { placeholder: string }) {
  const [val, setVal] = useState("");
  const [done, setDone] = useState(false);
  return done
    ? <p className="nl-done">✓ You're on the list!</p>
    : (
      <div className="nl-form">
        <input className="nl-input" type="email" value={val}
          onChange={e => setVal(e.target.value)} placeholder={placeholder} />
        <button className="nl-btn" onClick={() => val.includes("@") && setDone(true)}>Subscribe</button>
      </div>
    );
}

export default function AboutPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [opts,     setOpts]     = useState<SiteOptions | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

        const footerColumns = Array.isArray(optsJson?.footer_columns)
          ? optsJson.footer_columns.map((col: any) => ({
              title: col.column_title ?? "",
              links: Array.isArray(col.column_links)
                ? col.column_links.map((l: any) => ({ label: l.link_label ?? "", url: l.link_url ?? "#" }))
                : [],
            }))
          : [];

        const footerSocial = Array.isArray(optsJson?.footer_social)
          ? optsJson.footer_social.map((s: any) => ({
              platform: s.social_platform ?? "",
              url:      s.social_url      ?? "#",
              icon:     s.social_icon     ?? "🔗",
            }))
          : [];

        setOpts({
          headerLogo:       optsJson?.header_logo     ?? null,
          headerButton:     optsJson?.header_button   ?? null,
          headerMenu:       parseMenuHtml(optsJson?.header_menu ?? ""),
          footerLogo:       optsJson?.footer_logo     ?? null,
          footerCopy:       optsJson?.footer_copy_right ?? "",
          footerTagline:    optsJson?.footer_tagline  ?? "",
          footerDesc:       optsJson?.footer_description ?? "",
          footerSocial,
          footerColumns,
          footerNewsletter: optsJson?.footer_newsletter_text ?? "",
          footerBadge:      optsJson?.footer_badge_text ?? "",
        });

          const raw: any[] = pageJson?.acf?.page_builder ?? [];
        const resolved = await Promise.all(raw.map(async (s) => {
          if (s.acf_fc_layout === "about_hero" && s.background_image)
            return { ...s, _bgUrl: await resolveMediaUrl(s.background_image) };
          if (s.acf_fc_layout === "about_mission" && s.mission_image)
            return { ...s, _missionImg: await resolveMediaUrl(s.mission_image) };
          if (s.acf_fc_layout === "about_team" && Array.isArray(s.team_members))
            return { ...s, team_members: await Promise.all(s.team_members.map(async (m: any) => ({ ...m, _resolvedImage: await resolveMediaUrl(m.member_image) }))) };
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
  if (error) return (
    <div className="ai-loader"><span style={{ color:"#f87171" }}>{error}</span></div>
  );

  const headerLogoUrl = opts?.headerLogo?.url ?? "";
  const footerLogoUrl = opts?.footerLogo?.url ?? "";

  return (
    <>
      <div className="global-ai-bg">

        <div className="noise-layer" />

        <div className="gradient-orb orb-a" />
        <div className="gradient-orb orb-b" />
        <div className="gradient-orb orb-c" />

        <div className="grid-floor" />

        <div className="mesh-lines mesh-1" />
        <div className="mesh-lines mesh-2" />

        {[...Array(70)].map((_, i) => (
          <span
            key={i}
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}

      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body { font-family:'Outfit',sans-serif; background:#030712; color:#e2e8f0; overflow-x:hidden; }
        a { text-decoration:none; color:inherit; }
        :root {
          --cyan:#00f0ff; --violet:#7c3aed; --purple:#a855f7; --rose:#fb7185; --amber:#fbbf24;
          --dark:#030712; --dark2:#0d1117; --dark3:#111827; --dark4:#0a0f1a;
          --border:rgba(255,255,255,0.06); --border2:rgba(124,58,237,0.25);
          --muted:#94a3b8; --grad:linear-gradient(135deg,#7c3aed 0%,#00f0ff 100%);
          --grad2:linear-gradient(135deg,#fb7185 0%,#7c3aed 50%,#00f0ff 100%);
        }
        /* Reveal */
        [data-reveal]{opacity:0;transform:translateY(36px);transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1);}
        [data-reveal="fade-left"]{transform:translateX(-36px);}
        [data-reveal="fade-right"]{transform:translateX(36px);}
        [data-reveal="scale"]{transform:scale(0.9);}
        [data-reveal].revealed{opacity:1!important;transform:none!important;}
        [data-delay="100"]{transition-delay:.1s}[data-delay="200"]{transition-delay:.2s}
        [data-delay="300"]{transition-delay:.3s}[data-delay="400"]{transition-delay:.4s}
        [data-delay="500"]{transition-delay:.5s}[data-delay="600"]{transition-delay:.6s}
        /* Loader */
        .ai-loader{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--dark);gap:20px;}
        .ai-loader__ring{width:48px;height:48px;border:2px solid rgba(124,58,237,.2);border-top-color:var(--violet);border-radius:50%;animation:spin .8s linear infinite;}
        .ai-loader__text{font-size:13px;color:var(--muted);letter-spacing:.1em;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        /* ── NAV (identical to HomePage) ── */
        .ai-nav{position:sticky;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:72px;transition:background .3s,box-shadow .3s;}
        .ai-nav--scrolled{background:rgba(3,7,18,.85);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 1px 0 var(--border),0 4px 32px rgba(0,0,0,.4);}
        .ai-nav__logo-wrap{display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .ai-nav__logo{height:36px;object-fit:contain;}
        .ai-nav__logo-text{font-family:'Syne',sans-serif;font-weight:700;font-size:22px;color:#fff;letter-spacing:-.5px;}
        .ai-nav__center{display:flex;align-items:center;gap:4px;list-style:none;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:100px;padding:4px 8px;}
        .ai-nav__link{font-size:14px;font-weight:500;color:var(--muted);padding:7px 18px;border-radius:100px;transition:color .2s,background .2s;white-space:nowrap;}
        .ai-nav__link:hover{color:#fff;background:rgba(255,255,255,.07);}
        .ai-nav__right{display:flex;align-items:center;gap:12px;flex-shrink:0;}
        .ai-nav__ghost{background:transparent;color:rgba(255,255,255,.7);border:1px solid var(--border);border-radius:8px;padding:9px 20px;font-size:14px;font-weight:500;cursor:pointer;transition:color .2s,border-color .2s;font-family:inherit;}
        .ai-nav__ghost:hover{color:#fff;border-color:rgba(255,255,255,.2);}
        .ai-nav__cta{position:relative;overflow:hidden;background:var(--grad);color:#fff;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 0 20px rgba(124,58,237,.3);transition:transform .2s,box-shadow .2s;font-family:inherit;display:flex;align-items:center;gap:6px;}
        .ai-nav__cta:hover{transform:translateY(-1px);box-shadow:0 0 32px rgba(124,58,237,.5);}
        .ai-nav__cta-arrow{font-size:16px;transition:transform .2s;}
        .ai-nav__cta:hover .ai-nav__cta-arrow{transform:translateX(3px);}
        .ai-nav__burger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:4px;background:none;border:none;}
        .ai-nav__burger span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:transform .3s,opacity .3s;}
        .ai-nav__burger--open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
        .ai-nav__burger--open span:nth-child(2){opacity:0;}
        .ai-nav__burger--open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}
        .ai-nav__mobile{position:fixed;top:72px;left:0;right:0;z-index:199;background:rgba(3,7,18,.97);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:24px 24px 32px;transform:translateY(-110%);opacity:0;transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .35s;pointer-events:none;}
        .ai-nav__mobile--open{transform:translateY(0);opacity:1;pointer-events:all;}
        .ai-nav__mobile-link{display:block;padding:14px 0;font-size:18px;font-weight:600;color:rgba(255,255,255,.7);border-bottom:1px solid var(--border);transition:color .2s;}
        .ai-nav__mobile-link:last-child{border-bottom:none;}
        .ai-nav__mobile-link:hover{color:#fff;}
        .ai-nav__mobile-cta{display:block;margin-top:20px;background:var(--grad);color:#fff;border-radius:10px;padding:14px;text-align:center;font-size:16px;font-weight:700;}
        /* ── SECTION COMMONS ── */
        .ai-section{padding:100px 48px;max-width:1160px;margin:0 auto;}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--cyan);letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px;}
        .eyebrow::before{content:'';display:block;width:20px;height:1px;background:var(--cyan);}
        .section-title{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:700;color:#fff;letter-spacing:-1.5px;line-height:1.1;margin:0 0 16px;}
        .section-title span{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .section-sub{font-size:17px;color:var(--muted);line-height:1.75;max-width:540px;margin:0 0 56px;}

        /* ══════════════════════════════════════════
           ABOUT HERO
        ══════════════════════════════════════════ */
        .about-hero{
          position:relative;min-height:70vh;display:flex;align-items:center;
          padding:140px 48px 100px;overflow:hidden;
        }
        .about-hero__bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.2) saturate(1.3);}
        .about-hero__overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(124,58,237,.3) 0%,rgba(0,240,255,.1) 50%,transparent 100%);}
        .about-hero__grid{position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.05) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 100% 80% at 30% 50%,black 0%,transparent 80%);}
        .about-hero__content{position:relative;z-index:2;max-width:760px;animation:heroIn 1s cubic-bezier(.22,1,.36,1) both;}
        @keyframes heroIn{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
        .about-hero__badge{display:inline-flex;align-items:center;gap:8px;background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.3);color:var(--rose);border-radius:100px;padding:7px 18px;font-size:13px;font-weight:700;margin-bottom:24px;}
        .about-hero__h1{font-family:'Syne',sans-serif;font-size:clamp(40px,6vw,76px);font-weight:700;color:#fff;line-height:1.06;letter-spacing:-2.5px;margin:0 0 20px;}
        .about-hero__h1 span{background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .about-hero__sub{font-size:18px;color:var(--muted);line-height:1.75;max-width:520px;}
        /* scroll indicator */
        .about-hero__scroll{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase;}
        .about-hero__scroll-bar{width:1px;height:48px;background:linear-gradient(180deg,rgba(255,255,255,.3),transparent);animation:scroll-drop 2s ease infinite;}
        @keyframes scroll-drop{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}

        /* ══════════════════════════════════════════
           ABOUT MISSION
        ══════════════════════════════════════════ */
        .mission-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
        .mission-text-col{}
        .mission-body{font-size:16px;color:var(--muted);line-height:1.9;margin-bottom:32px;}
        .mission-highlight{
          border-left:3px solid var(--cyan);padding:20px 28px;
          background:rgba(0,240,255,.04);border-radius:0 12px 12px 0;
          font-size:20px;font-weight:600;color:#fff;line-height:1.5;font-style:italic;
          letter-spacing:-.3px;
        }
        .mission-img-col{position:relative;}
        .mission-img{width:100%;border-radius:20px;object-fit:cover;height:420px;display:block;}
        .mission-img-placeholder{width:100%;height:420px;border-radius:20px;background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(0,240,255,.1));border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:64px;}
        .mission-img-badge{
          position:absolute;bottom:-20px;right:-20px;
          background:var(--dark3);border:1px solid var(--border2);border-radius:16px;
          padding:20px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);
        }
        .mission-img-badge__num{font-family:'Syne',sans-serif;font-size:36px;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;}
        .mission-img-badge__label{font-size:12px;color:var(--muted);margin-top:4px;}

        /* ══════════════════════════════════════════
           VALUES
        ══════════════════════════════════════════ */
        .values-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;}
        .value-card{
          background:var(--dark3);border:1px solid var(--border);border-radius:20px;padding:32px;
          transition:transform .3s,border-color .3s,box-shadow .3s;position:relative;overflow:hidden;
        }
        .value-card::after{content:'';position:absolute;inset:0;border-radius:20px;background:var(--grad);opacity:0;transition:opacity .3s;mask-image:radial-gradient(circle at 0% 0%,black 0%,transparent 60%);}
        .value-card:hover{transform:translateY(-4px);border-color:rgba(124,58,237,.4);box-shadow:0 20px 60px rgba(124,58,237,.1);}
        .value-card:hover::after{opacity:.06;}
        .value-icon{font-size:40px;margin-bottom:16px;display:block;filter:drop-shadow(0 0 12px rgba(124,58,237,.5));}
        .value-title{font-size:30px;font-weight:700;color:#fff;margin-bottom:10px;letter-spacing:-.4px;}
        .value-desc{font-size:15px;color:var(--muted);line-height:1.75;}

        /* ══════════════════════════════════════════
           STORY TIMELINE
        ══════════════════════════════════════════ */
        .timeline-wrap{position:relative;}
        .timeline-track{
          position:absolute;top:28px;left:0;right:0;height:2px;
          background:linear-gradient(90deg,var(--violet),var(--cyan));
          border-radius:2px;
        }
        .timeline-items{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0;position:relative;}
        .timeline-item{text-align:center;padding:0 12px;position:relative;}
        .timeline-dot{
          width:56px;height:56px;border-radius:50%;
          background:var(--dark3);border:2px solid var(--violet);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;
          color:var(--cyan);transition:border-color .3s,box-shadow .3s,background .3s;
          position:relative;z-index:1;
        }
        .timeline-item:hover .timeline-dot{background:rgba(124,58,237,.2);box-shadow:0 0 24px rgba(124,58,237,.4);}
        .timeline-event-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;}
        .timeline-event-desc{font-size:13px;color:var(--muted);line-height:1.6;}

        /* ══════════════════════════════════════════
           TEAM (same as home)
        ══════════════════════════════════════════ */
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

        /* ══════════════════════════════════════════
           ABOUT STATS (icon variant)
        ══════════════════════════════════════════ */
        .about-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;}
        .about-stat-card{
          background:var(--dark3);border:1px solid var(--border);border-radius:20px;padding:32px 24px;text-align:center;
          transition:transform .3s,border-color .3s;
        }
        .about-stat-card:hover{transform:translateY(-4px);border-color:var(--border2);}
        .about-stat-card__icon{font-size:32px;margin-bottom:12px;display:block;filter:drop-shadow(0 0 10px rgba(124,58,237,.5));}
        .about-stat-card__num{font-family:'Syne',sans-serif;font-size:40px;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:6px;}
        .about-stat-card__label{font-size:13px;color:var(--muted);font-weight:500;}

        /* ══════════════════════════════════════════
           AWARDS
        ══════════════════════════════════════════ */
        .awards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;}
        .award-card{
          background:var(--dark3);border:1px solid var(--border);border-radius:16px;padding:28px 24px;
          display:flex;flex-direction:column;gap:12px;
          transition:transform .3s,border-color .3s,box-shadow .3s;
        }
        .award-card:hover{transform:translateY(-3px);border-color:rgba(251,191,36,.3);box-shadow:0 16px 48px rgba(251,191,36,.06);}
        .award-icon{font-size:32px;filter:drop-shadow(0 0 8px rgba(251,191,36,.5));}
        .award-name{font-size:16px;font-weight:700;color:#fff;letter-spacing:-.3px;}
        .award-meta{font-size:13px;color:var(--muted);}
        .award-year{display:inline-block;background:rgba(251,191,36,.1);color:var(--amber);font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.06em;}

        /* ══════════════════════════════════════════
           ABOUT CTA
        ══════════════════════════════════════════ */
        .about-cta{position:relative;overflow:hidden;text-align:center;padding:100px 48px;background:var(--dark2);}
       .about-cta__glow{
  position:absolute;
  inset:0;
  background-size:cover;
  background-position:center;
  background-repeat:no-repeat;
  opacity:.18;
  z-index:0;
}
        .about-cta__content{position:relative;z-index:2;max-width:640px;margin:0 auto;}
        .about-cta__title{font-family:'Syne',sans-serif;font-size:clamp(30px,5vw,52px);font-weight:700;color:#fff;letter-spacing:-2px;line-height:1.1;margin-bottom:16px;}
        .about-cta__sub{font-size:17px;color:var(--muted);margin-bottom:36px;line-height:1.75;}
        .about-cta__btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
        .about-cta__btn-primary{background:var(--grad);color:#fff;border:none;border-radius:10px;padding:14px 36px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 0 32px rgba(124,58,237,.4);transition:transform .2s,box-shadow .2s;font-family:inherit;}
        .about-cta__btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 48px rgba(124,58,237,.6);}
        .about-cta__btn-secondary{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s,border-color .2s;font-family:inherit;}
        .about-cta__btn-secondary:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.25);}

        /* ══════════════════════════════════════════
           FOOTER (same as HomePage)
        ══════════════════════════════════════════ */
        .ai-footer{background:var(--dark4);border-top:1px solid var(--border);position:relative;overflow:hidden;}
        .ai-footer::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,var(--violet),var(--cyan),var(--violet),transparent);}
        .ai-footer__grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.03) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,black 0%,transparent 80%);pointer-events:none;}
        .ai-footer__body{position:relative;z-index:1;max-width:1160px;margin:0 auto;padding:64px 48px 0;display:grid;grid-template-columns:1.4fr repeat(3,1fr) 1.2fr;gap:48px;}
        .footer-brand__logo{height:36px;object-fit:contain;margin-bottom:16px;display:block;}
        .footer-brand__logo-text{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:12px;display:block;letter-spacing:-.5px;}
        .footer-brand__tagline{font-size:13px;font-weight:600;color:var(--cyan);letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px;display:block;}
        .footer-brand__desc{font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:24px;}
        .footer-socials{display:flex;gap:10px;flex-wrap:wrap;}
        .footer-social-btn{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--muted);transition:background .2s,border-color .2s,color .2s,transform .2s;cursor:pointer;text-decoration:none;}
        .footer-social-btn:hover{background:rgba(124,58,237,.15);border-color:var(--border2);color:#fff;transform:translateY(-2px);}
        .footer-col__title{font-size:12px;font-weight:700;color:#fff;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px;}
        .footer-col__links{list-style:none;display:flex;flex-direction:column;gap:12px;}
        .footer-col__link{font-size:14px;color:var(--muted);transition:color .2s;display:flex;align-items:center;gap:6px;}
        .footer-col__link:hover{color:#fff;}
        .footer-col__link::before{content:'';display:block;width:0;height:1px;background:var(--cyan);transition:width .2s;}
        .footer-col__link:hover::before{width:8px;}
        .footer-newsletter__title{font-size:12px;font-weight:700;color:#fff;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;}
        .footer-newsletter__text{font-size:14px;color:var(--muted);line-height:1.7;margin-bottom:20px;}
        .nl-form{display:flex;flex-direction:column;gap:10px;}
        .nl-input{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:11px 14px;font-size:14px;color:#fff;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s;}
        .nl-input::placeholder{color:rgba(255,255,255,.25);}
        .nl-input:focus{border-color:var(--border2);box-shadow:0 0 0 3px rgba(124,58,237,.12);}
        .nl-btn{background:var(--grad);color:#fff;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .2s,transform .2s;box-shadow:0 0 20px rgba(124,58,237,.25);}
        .nl-btn:hover{opacity:.9;transform:translateY(-1px);}
        .nl-done{font-size:14px;color:var(--cyan);font-weight:600;padding:12px 0;}
        .ai-footer__divider{position:relative;z-index:1;max-width:1160px;margin:0 auto;padding:0 48px;margin-top:48px;}
        .ai-footer__divider-line{height:1px;background:var(--border);}
        .ai-footer__bottom{position:relative;z-index:1;max-width:1160px;margin:0 auto;padding:24px 48px 40px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
        .ai-footer__copy{font-size:13px;color:rgba(255,255,255,.25);}
        .ai-footer__badges{display:flex;gap:10px;flex-wrap:wrap;}
        .ai-footer__badge{font-size:11px;font-weight:600;color:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:4px 12px;letter-spacing:.04em;}
        .ai-footer__bottom-links{display:flex;gap:20px;}
        .ai-footer__bottom-link{font-size:13px;color:rgba(255,255,255,.25);transition:color .2s;}
        .ai-footer__bottom-link:hover{color:var(--cyan);}


         /* ═══════════════════════════════════════
   GLOBAL AI CINEMATIC SYSTEM
═══════════════════════════════════════ */

.global-ai-bg{
  position:fixed;
  inset:0;

  overflow:hidden;

  pointer-events:none;

  z-index:0;

  background:
    radial-gradient(circle at top left,
    rgba(124,58,237,.18),
    transparent 30%),

    radial-gradient(circle at bottom right,
    rgba(0,240,255,.12),
    transparent 35%),

    #030712;
}

/* NOISE */

.noise-layer{
  position:absolute;
  inset:0;

  opacity:.035;

  background-image:url("https://grainy-gradients.vercel.app/noise.svg");

  mix-blend-mode:soft-light;
}

/* GLOW ORBS */

.gradient-orb{
  position:absolute;
  border-radius:50%;

  filter:blur(140px);

  opacity:.18;
}

.orb-a{
  width:600px;
  height:600px;

  background:#7c3aed;

  top:-10%;
  left:-5%;

  animation:orbFloatA 18s ease-in-out infinite;
}

.orb-b{
  width:500px;
  height:500px;

  background:#00f0ff;

  right:-5%;
  top:30%;

  animation:orbFloatB 20s ease-in-out infinite;
}

.orb-c{
  width:400px;
  height:400px;

  background:#fb7185;

  left:40%;
  bottom:-10%;

  opacity:.08;

  animation:orbFloatC 24s ease-in-out infinite;
}

/* GRID */

.grid-floor{
  position:absolute;

  inset:-20%;

  background-image:
    linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);

  background-size:90px 90px;

  transform:
    perspective(1200px)
    rotateX(78deg)
    scale(2);

  opacity:.25;

  animation:gridDrift 20s linear infinite;
}

/* MESH */

.mesh-lines{
  position:absolute;

  width:140%;
  height:1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(0,240,255,.5),
      transparent
    );

  filter:blur(.5px);

  opacity:.4;
}

.mesh-1{
  top:30%;

  transform:rotate(-12deg);

  animation:meshMove 10s linear infinite;
}

.mesh-2{
  top:65%;

  transform:rotate(8deg);

  animation:meshMoveReverse 14s linear infinite;
}

/* PARTICLES */

.floating-particle{
  position:absolute;

  width:3px;
  height:3px;

  border-radius:50%;

  background:#00f0ff;

  box-shadow:
    0 0 10px rgba(0,240,255,.8),
    0 0 20px rgba(0,240,255,.4);

  opacity:.5;

  animation:particleFloat 8s ease-in-out infinite;
}

/* GLASS EFFECT FOR SECTIONS */

.about-hero,
.ai-section,
.about-cta,
.ai-footer{
  position:relative;
  z-index:2;
}

/* OPTIONAL PREMIUM GLASS */

.value-card,
.team-card,
.about-stat-card,
.award-card{
  backdrop-filter:blur(20px);

  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.04),
      rgba(255,255,255,.015)
    );

  border:1px solid rgba(255,255,255,.08);

  box-shadow:
    0 10px 40px rgba(0,0,0,.3),
    inset 0 1px 0 rgba(255,255,255,.03);
}

/* ANIMATIONS */

@keyframes orbFloatA{
  0%,100%{
    transform:
      translate(0,0)
      scale(1);
  }

  50%{
    transform:
      translate(80px,40px)
      scale(1.1);
  }
}

@keyframes orbFloatB{
  0%,100%{
    transform:
      translate(0,0)
      scale(1);
  }

  50%{
    transform:
      translate(-60px,-50px)
      scale(1.15);
  }
}

@keyframes orbFloatC{
  0%,100%{
    transform:
      translate(0,0);
  }

  50%{
    transform:
      translate(0,-80px);
  }
}

@keyframes gridDrift{
  from{
    transform:
      perspective(1200px)
      rotateX(78deg)
      translateY(0)
      scale(2);
  }

  to{
    transform:
      perspective(1200px)
      rotateX(78deg)
      translateY(120px)
      scale(2);
  }
}

@keyframes meshMove{
  from{
    transform:
      translateX(-20%)
      rotate(-12deg);
  }

  to{
    transform:
      translateX(20%)
      rotate(-12deg);
  }
}

@keyframes meshMoveReverse{
  from{
    transform:
      translateX(20%)
      rotate(8deg);
  }

  to{
    transform:
      translateX(-20%)
      rotate(8deg);
  }
}

@keyframes particleFloat{
  0%,100%{
    transform:
      translateY(0)
      scale(.6);

    opacity:.2;
  }

  50%{
    transform:
      translateY(-40px)
      scale(1.6);

    opacity:1;
  }
}


        @media(max-width:1024px){
          .ai-footer__body{grid-template-columns:1fr 1fr;gap:36px;}
          .footer-brand{grid-column:1/-1;}
          .mission-grid{grid-template-columns:1fr;gap:48px;}
          .mission-img-col{order:-1;}
        }
        @media(max-width:768px){
          .ai-nav{padding:0 20px;}
          .ai-nav__center,.ai-nav__ghost{display:none;}
          .ai-nav__burger{display:flex;}
          .ai-section{padding:72px 20px;}
          .about-hero{padding:120px 24px 80px;}
          .about-hero__h1{letter-spacing:-2px;}
          .about-cta{padding:72px 20px;}
          .ai-footer__body{grid-template-columns:1fr;padding:48px 24px 0;}
          .footer-brand{grid-column:auto;}
          .ai-footer__bottom{padding:20px 24px 32px;flex-direction:column;align-items:flex-start;gap:12px;}
          .ai-footer__divider{padding:0 24px;}
          .timeline-track{display:none;}
          .timeline-items{grid-template-columns:1fr;}
          .timeline-item{text-align:left;display:flex;gap:16px;align-items:flex-start;}
          .timeline-dot{flex-shrink:0;margin:0;}
        }
      `}</style>

      {/* NAV */}
      <nav className={`ai-nav${scrolled ? " ai-nav--scrolled" : ""}`}>
        <div className="ai-nav__logo-wrap">
          <a href="/">
            {headerLogoUrl ? <img src={headerLogoUrl} alt="Logo" className="ai-nav__logo" /> : <span className="ai-nav__logo-text">⬡ Site</span>}
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
              <button className="ai-nav__cta">{opts.headerButton.title}<span className="ai-nav__cta-arrow">→</span></button>
            </a>
          )}
          <button className={`ai-nav__burger${menuOpen ? " ai-nav__burger--open" : ""}`}
            onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`ai-nav__mobile${menuOpen ? " ai-nav__mobile--open" : ""}`}>
        {opts?.headerMenu.map((item, i) => (
          <a key={i} href={item.url} className="ai-nav__mobile-link" onClick={() => setMenuOpen(false)}>{item.label}</a>
        ))}
        {opts?.headerButton && <a href={opts.headerButton.url} className="ai-nav__mobile-cta">{opts.headerButton.title}</a>}
      </div>

      <main>
        {sections.map((section, index) => {

          /* ── ABOUT HERO ── */
          if (section.acf_fc_layout === "about_hero") {
            return (
              <section key={index} className="about-hero">
                {section._bgUrl && <div className="about-hero__bg" style={{ backgroundImage:`url(${section._bgUrl})` }} />}
                <div className="about-hero__overlay" />
                <div className="about-hero__grid" />
                <div className="about-hero__content">
                  {section.hero_badge && (
                    <div className="about-hero__badge">✦ {section.hero_badge}</div>
                  )}
                  <h1 className="about-hero__h1">
                    {(() => {
                      const words = (section.heading || "About Our").split(" ");
                      const last  = words.pop();
                      return <>{words.join(" ")} <span>{last}</span></>;
                    })()}
                  </h1>
                  <p className="about-hero__sub">{section.subheading}</p>
                </div>
                <div className="about-hero__scroll">
                  <div className="about-hero__scroll-bar" />
                  Scroll
                </div>
              </section>
            );
          }

          /* ── ABOUT MISSION ── */
          if (section.acf_fc_layout === "about_mission") {
            return (
              <div key={index} style={{ background:"var(--dark)" }}>
                <div className="ai-section">
                  <div className="mission-grid">
                    <div className="mission-text-col" data-reveal="fade-left">
                      <span className="eyebrow">Mission</span>
                      <h2 className="section-title">{section.section_title}</h2>
                      <p className="mission-body">{section.mission_text}</p>
                      {section.mission_highlight && (
                        <blockquote className="mission-highlight">"{section.mission_highlight}"</blockquote>
                      )}
                    </div>
                    <div className="mission-img-col" data-reveal="fade-right">
                      {section._missionImg
                        ? <img src={section._missionImg} alt="Mission" className="mission-img" />
                        : <div className="mission-img-placeholder">🌐</div>}
                      <div className="mission-img-badge">
                        <div className="mission-img-badge__num">4+</div>
                        <div className="mission-img-badge__label">Years of Innovation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          /* ── ABOUT VALUES ── */
          if (section.acf_fc_layout === "about_values") {
            return (
              <div key={index} style={{ background:"var(--dark3)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up" style={{ textAlign:"center", marginBottom:56 }}>
                    <span className="eyebrow" style={{ justifyContent:"center" }}>Values</span>
                    <h2 className="section-title" style={{ textAlign:"center", maxWidth:"none" }}>{section.section_title}</h2>
                    {section.section_subtitle && <p className="section-sub" style={{ margin:"0 auto" }}>{section.section_subtitle}</p>}
                  </div>
                  <div className="values-grid">
                    {(section.values ?? []).map((v: any, i: number) => (
                      <div key={i} className="value-card" data-reveal="fade-up" data-delay={String(i * 100)}>
                        <span className="value-icon">{v.value_icon}</span>
                        <h3 className="value-title">{v.value_title}</h3>
                        <p className="value-desc">{v.value_desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          /* ── ABOUT STORY (TIMELINE) ── */
          if (section.acf_fc_layout === "about_story") {
            return (
              <div key={index} style={{ background:"var(--dark2)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up" style={{ textAlign:"center", marginBottom:72 }}>
                    <span className="eyebrow" style={{ justifyContent:"center" }}>Story</span>
                    <h2 className="section-title" style={{ textAlign:"center", maxWidth:"none" }}>{section.section_title}</h2>
                  </div>
                  <div className="timeline-wrap" data-reveal="fade-up" data-delay="200">
                    <div className="timeline-track" />
                    <div className="timeline-items">
                      {(section.timeline ?? []).map((ev: any, i: number) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-dot">{ev.year}</div>
                          <h4 className="timeline-event-title">{ev.event_title}</h4>
                          <p className="timeline-event-desc">{ev.event_desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          /* ── ABOUT TEAM ── */
          if (section.acf_fc_layout === "about_team") {
            return (
              <div key={index} style={{ background:"var(--dark)" }}>
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

          /* ── ABOUT STATS ── */
          if (section.acf_fc_layout === "about_stats") {
            return (
              <div key={index} style={{ background:"var(--dark3)" }}>
                <div className="ai-section">
                  <div className="about-stats-grid">
                    {(section.stats ?? []).map((s: any, i: number) => (
                      <div key={i} className="about-stat-card" data-reveal="scale" data-delay={String(i * 100)}>
                        {s.stat_icon && <span className="about-stat-card__icon">{s.stat_icon}</span>}
                        <div className="about-stat-card__num">{s.stat_number}</div>
                        <div className="about-stat-card__label">{s.stat_label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          /* ── ABOUT AWARDS ── */
          if (section.acf_fc_layout === "about_awards") {
            return (
              <div key={index} style={{ background:"var(--dark2)" }}>
                <div className="ai-section">
                  <div data-reveal="fade-up" style={{ marginBottom:48 }}>
                    <span className="eyebrow">Recognition</span>
                    <h2 className="section-title">{section.section_title}</h2>
                  </div>
                  <div className="awards-grid">
                    {(section.awards ?? []).map((a: any, i: number) => (
                      <div key={i} className="award-card" data-reveal="fade-up" data-delay={String(i * 100)}>
                        {a.award_icon && <div className="award-icon">{a.award_icon}</div>}
                        <div>
                          <div className="award-name">{a.award_name}</div>
                          <div className="award-meta">{a.award_body}</div>
                        </div>
                        {a.award_year && <span className="award-year">{a.award_year}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          /* ── ABOUT CTA ── */
          if (section.acf_fc_layout === "about_cta") {
            const btn = section.cta_button ?? {};
            return (
              <div key={index} className="about-cta">
                <div
                  className="about-cta__glow"
                  style={{
                    backgroundImage: `url("http://192.168.1.112/headless/wp-content/uploads/2026/05/blockchain-network-powered-by-ai-photo-scaled.jpg")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />

                <div className="about-cta__content">
                  <div data-reveal="fade-up">

                    <span
                      className="eyebrow"
                      style={{ justifyContent: "center" }}
                    >
                      Join Us
                    </span>

                    <h2 className="about-cta__title">
                      {section.heading}
                    </h2>

                    <p className="about-cta__sub">
                      {section.sub_heading}
                    </p>

                    <div className="about-cta__btns">

                      {btn.url && (
                        <a href={btn.url} target={btn.target || "_self"}>
                          <button className="about-cta__btn-primary">
                            {btn.title || "Get Started"}
                          </button>
                        </a>
                      )}

                      <a href="/contact">
                        <button className="about-cta__btn-secondary">
                          Contact Us
                        </button>
                      </a>

                    </div>

                  </div>
                </div>

              </div>
            );
          }

          return null;
        })}
      </main>

      {/* FOOTER */}
      <footer className="ai-footer">
        <div className="ai-footer__grid-bg" />
        <div className="ai-footer__body">
          <div className="footer-brand">
            {footerLogoUrl ? <img src={footerLogoUrl} alt="Logo" className="footer-brand__logo" /> : <span className="footer-brand__logo-text">⬡ Site</span>}
            {opts?.footerTagline && <span className="footer-brand__tagline">{opts.footerTagline}</span>}
            <p className="footer-brand__desc">{opts?.footerDesc || "Building next-generation AI & blockchain infrastructure."}</p>
            <div className="footer-socials">
              {(opts?.footerSocial ?? []).length > 0
                ? opts!.footerSocial.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title={s.platform}>{s.icon}</a>)
                : <><a href="#" className="footer-social-btn">𝕏</a><a href="#" className="footer-social-btn">in</a><a href="#" className="footer-social-btn">⌥</a></>}
            </div>
          </div>
          {(opts?.footerColumns ?? []).map((col, ci) => (
            <div key={ci} className="footer-col">
              <p className="footer-col__title">{col.title}</p>
              <ul className="footer-col__links">
                {col.links.map((lnk, li) => <li key={li}><a href={lnk.url} className="footer-col__link">{lnk.label}</a></li>)}
              </ul>
            </div>
          ))}
          {(opts?.footerColumns ?? []).length === 0 && (
            [{ title:"Product", links:[["Features","#"],["Pricing","#"],["Changelog","#"]] },
             { title:"Company", links:[["About","#"],["Blog","#"],["Careers","#"]] },
             { title:"Legal",   links:[["Privacy","#"],["Terms","#"],["Security","#"]] }].map((col, ci) => (
              <div key={ci} className="footer-col">
                <p className="footer-col__title">{col.title}</p>
                <ul className="footer-col__links">{col.links.map(([l,u],li)=><li key={li}><a href={u} className="footer-col__link">{l}</a></li>)}</ul>
              </div>
            ))
          )}
          <div className="footer-newsletter">
            <p className="footer-newsletter__title">Stay Updated</p>
            <p className="footer-newsletter__text">{opts?.footerNewsletter || "Get updates straight to your inbox."}</p>
            <NewsletterInput placeholder="your@email.com" />
          </div>
        </div>
        <div className="ai-footer__divider"><div className="ai-footer__divider-line" /></div>
        <div className="ai-footer__bottom">
          <p className="ai-footer__copy">{opts?.footerCopy || `© ${new Date().getFullYear()} Site Inc. All rights reserved.`}</p>
          <div className="ai-footer__badges">
            {opts?.footerBadge ? opts.footerBadge.split("·").map((b,i)=><span key={i} className="ai-footer__badge">{b.trim()}</span>) : <><span className="ai-footer__badge">SOC 2</span><span className="ai-footer__badge">GDPR</span></>}
          </div>
          <div className="ai-footer__bottom-links">
            {opts?.headerMenu.slice(0,4).map((item,i)=><a key={i} href={item.url} className="ai-footer__bottom-link">{item.label}</a>)}
          </div>
        </div>
      </footer>
    </>
  );
}