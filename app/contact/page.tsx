"use client";

import { useEffect, useState } from "react";

/* ══════════════════════════════════════════════════════════════
   API ENDPOINTS
   Update page ID (e.g. 25) to match your WordPress Contact page
══════════════════════════════════════════════════════════════ */
// const BASE = "http://192.168.1.112/headless";
const BASE = "https://speller-choking-twisted.ngrok-free.dev/headless";
const PAGE_API = `${BASE}/wp-json/wp/v2/pages/251`;          // ← update page ID
const OPTIONS_API = `${BASE}/wp-json/custom/v1/options`;

/* ══════════════════════════════════════════════════════════════
   ACF FIELD MAP — Contact Us page
   ─────────────────────────────────────────────────────────────
   Flexible Content field name: page_builder
   Layouts:
   ┌─────────────────────────────────────────────────────────────
   │ contact_hero
   │   heading           — "Let's Start a Conversation"
   │   subheading        — supporting text
   │   hero_badge        — badge text e.g. "24hr Response"
   ├─────────────────────────────────────────────────────────────
   │ contact_info
   │   section_title     — "Get in Touch"
   │   section_subtitle  — supporting copy
   │   contact_cards[]   repeater
   │     card_icon       — emoji
   │     card_title      — "Email Us"
   │     card_value      — "hello@site.com"
   │     card_link       — "mailto:hello@site.com"
   │     card_note       — "Response within 24 hrs"
   ├─────────────────────────────────────────────────────────────
   │ contact_form
   │   form_title        — "Send Us a Message"
   │   form_subtitle     — small helper text
   │   (form fields are rendered as static HTML/React inputs;
   │    wire submission to your WP REST form handler or CF7)
   ├─────────────────────────────────────────────────────────────
   │ contact_offices
   │   section_title     — "Our Offices"
   │   offices[]         repeater
   │     office_city     — "Ahmedabad"
   │     office_country  — "India"
   │     office_address  — "123 SG Highway, Bodakdev"
   │     office_phone    — "+91 79 1234 5678"
   │     office_email    — "india@site.com"
   │     office_flag     — emoji flag e.g. "🇮🇳"
   ├─────────────────────────────────────────────────────────────
   │ contact_faq
   │   section_title     — "Quick Answers"
   │   faq_items[]       repeater
   │     faq_title       — question
   │     faq_content     — answer
   └─────────────────────────────────────────────────────────────
══════════════════════════════════════════════════════════════ */

interface NavItem { label: string; url: string; }
interface SiteOptions {
    headerLogo: { url: string } | null;
    headerButton: { title: string; url: string; target: string } | null;
    headerMenu: NavItem[];
    footerLogo: { url: string } | null;
    footerCopy: string;
    footerTagline: string;
    footerDesc: string;
    footerSocial: { platform: string; url: string; icon: string }[];
    footerColumns: { title: string; links: { label: string; url: string }[] }[];
    footerNewsletter: string;
    footerBadge: string;
}

function parseMenuHtml(html: string): NavItem[] {
    if (!html) return [];
    const m = [...html.matchAll(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
    return m.map((x) => ({ url: x[1], label: x[2].replace(/<[^>]+>/g, "").trim() }));
}

function useReveal(deps: any[] = []) {
    useEffect(() => {
        const els = document.querySelectorAll("[data-reveal]");
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add("revealed"); io.unobserve(e.target); }
            }),
            { threshold: 0.1 }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, deps);
}

/* ── CONTACT FORM COMPONENT ── */
function ContactForm({ title, subtitle }: { title: string; subtitle: string }) {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [topic, setTopic] = useState("General");
    const topics = ["General", "Sales", "Support", "Partnership", "Press"];

    const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async () => {
        if (!form.name || !form.email || !form.message) return;
        setBusy(true);
        // Replace with your WP REST / CF7 endpoint
        await new Promise(r => setTimeout(r, 1200));
        setSent(true);
        setBusy(false);
    };

    if (sent) return (
        <div className="form-success">
            <div className="form-success__icon">✓</div>
            <h3 className="form-success__title">Message Sent!</h3>
            <p className="form-success__sub">We'll get back to you within 24 hours.</p>
        </div>
    );

    return (
        <div className="cf-form">
            {title && <h3 className="cf-form__title">{title}</h3>}
            {subtitle && <p className="cf-form__sub">{subtitle}</p>}

            {/* Topic pills */}
            <div className="cf-topics">
                {topics.map(t => (
                    <button key={t} onClick={() => setTopic(t)}
                        className={`cf-topic-pill${t === topic ? " cf-topic-pill--active" : ""}`}>{t}</button>
                ))}
            </div>

            <div className="cf-row">
                <div className="cf-field">
                    <label className="cf-label">Your Name *</label>
                    <input className="cf-input" name="name" value={form.name} onChange={handle} placeholder="John Doe" />
                </div>
                <div className="cf-field">
                    <label className="cf-label">Email Address *</label>
                    <input className="cf-input" name="email" type="email" value={form.email} onChange={handle} placeholder="john@company.com" />
                </div>
            </div>
            <div className="cf-field">
                <label className="cf-label">Subject</label>
                <input className="cf-input" name="subject" value={form.subject} onChange={handle} placeholder="How can we help?" />
            </div>
            <div className="cf-field">
                <label className="cf-label">Message *</label>
                <textarea className="cf-textarea" name="message" value={form.message} onChange={handle}
                    placeholder="Tell us more about your project or question…" rows={5} />
            </div>
            <button className={`cf-submit${busy ? " cf-submit--busy" : ""}`} onClick={submit} disabled={busy}>
                {busy ? <><span className="cf-submit__spinner" />Sending…</> : <>Send Message →</>}
            </button>
        </div>
    );
}

/* ── FAQ ACCORDION ── */
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

/* ── NEWSLETTER ── */
function NewsletterInput({ placeholder }: { placeholder: string }) {
    const [val, setVal] = useState("");
    const [done, setDone] = useState(false);
    return done
        ? <p className="nl-done">✓ You're on the list!</p>
        : (
            <div className="nl-form">
                <input className="nl-input" type="email" value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} />
                <button className="nl-btn" onClick={() => val.includes("@") && setDone(true)}>Subscribe</button>
            </div>
        );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ContactPage() {
    const [sections, setSections] = useState<any[]>([]);
    const [opts, setOpts] = useState<SiteOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                    ? optsJson.footer_columns.map((col: any) => ({ title: col.column_title ?? "", links: Array.isArray(col.column_links) ? col.column_links.map((l: any) => ({ label: l.link_label ?? "", url: l.link_url ?? "#" })) : [] }))
                    : [];
                const footerSocial = Array.isArray(optsJson?.footer_social)
                    ? optsJson.footer_social.map((s: any) => ({ platform: s.social_platform ?? "", url: s.social_url ?? "#", icon: s.social_icon ?? "🔗" }))
                    : [];
                setOpts({
                    headerLogo: optsJson?.header_logo ?? null, headerButton: optsJson?.header_button ?? null,
                    headerMenu: parseMenuHtml(optsJson?.header_menu ?? ""),
                    footerLogo: optsJson?.footer_logo ?? null, footerCopy: optsJson?.footer_copy_right ?? "",
                    footerTagline: optsJson?.footer_tagline ?? "", footerDesc: optsJson?.footer_description ?? "",
                    footerSocial, footerColumns, footerNewsletter: optsJson?.footer_newsletter_text ?? "",
                    footerBadge: optsJson?.footer_badge_text ?? "",
                });
                setSections(pageJson?.acf?.page_builder_contact ?? []);
            } catch (err) { console.error(err); setError("Failed to load page."); }
            finally { setLoading(false); }
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
    if (error) return <div className="ai-loader"><span style={{ color: "#f87171" }}>{error}</span></div>;

    const headerLogoUrl = opts?.headerLogo?.url ?? "";
    const footerLogoUrl = opts?.footerLogo?.url ?? "";

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body { font-family:'Outfit',sans-serif; background:#030712; color:#e2e8f0; overflow-x:hidden; }
        a { text-decoration:none; color:inherit; }
        :root {
          --cyan:#00f0ff; --violet:#7c3aed; --purple:#a855f7; --rose:#fb7185; --amber:#fbbf24;
          --dark:#030712; --dark2:#0d1117; --dark3:#111827; --dark4:#0a0f1a;
          --border:rgba(255,255,255,0.06); --border2:rgba(124,58,237,0.25); --muted:#94a3b8;
          --grad:linear-gradient(135deg,#7c3aed 0%,#00f0ff 100%);
          --grad2:linear-gradient(135deg,#fb7185 0%,#7c3aed 50%,#00f0ff 100%);
        }
        [data-reveal]{opacity:0;transform:translateY(36px);transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1);}
        [data-reveal="fade-left"]{transform:translateX(-36px);}
        [data-reveal="fade-right"]{transform:translateX(36px);}
        [data-reveal="scale"]{transform:scale(0.9);}
        [data-reveal].revealed{opacity:1!important;transform:none!important;}
        [data-delay="100"]{transition-delay:.1s}[data-delay="200"]{transition-delay:.2s}[data-delay="300"]{transition-delay:.3s}[data-delay="400"]{transition-delay:.4s}
        .ai-loader{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--dark);gap:20px;}
        .ai-loader__ring{width:48px;height:48px;border:2px solid rgba(124,58,237,.2);border-top-color:var(--violet);border-radius:50%;animation:spin .8s linear infinite;}
        .ai-loader__text{font-size:13px;color:var(--muted);letter-spacing:.1em;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}

        /* NAV */
        .ai-nav{position:sticky;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:72px;transition:background .3s,box-shadow .3s;}
        .ai-nav--scrolled{background:rgba(3,7,18,.85);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 1px 0 var(--border),0 4px 32px rgba(0,0,0,.4);}
        .ai-nav__logo-wrap{display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .ai-nav__logo{height:36px;object-fit:contain;}
        .ai-nav__logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:#fff;letter-spacing:-.5px;}
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

        /* COMMONS */
        .ai-section{padding:100px 48px;max-width:1160px;margin:0 auto;}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--cyan);letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px;}
        .eyebrow::before{content:'';display:block;width:20px;height:1px;background:var(--cyan);}
        .section-title{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:800;color:#fff;letter-spacing:-1.5px;line-height:1.1;margin:0 0 16px;}
        .section-title span{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .section-sub{font-size:17px;color:var(--muted);line-height:1.75;max-width:540px;margin:0 0 56px;}

        /* ══════════════════════════════════════════
           CONTACT HERO
        ══════════════════════════════════════════ */
        .contact-hero{
          position:relative;min-height:52vh;display:flex;align-items:center;justify-content:center;
          text-align:center;padding:140px 48px 100px;overflow:hidden;
          background:var(--dark);
        }
        .contact-hero__glow{position:absolute;top:0;left:50%;transform:translateX(-50%);width:80%;height:400px;background:radial-gradient(ellipse 60% 60% at 50% 0%,rgba(124,58,237,.3) 0%,transparent 70%);pointer-events:none;}
        .contact-hero__grid{position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.04) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 70% 70% at 50% 30%,black 0%,transparent 80%);}
        .contact-hero__content{position:relative;z-index:2;max-width:700px;animation:heroIn 1s cubic-bezier(.22,1,.36,1) both;}
        @keyframes heroIn{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
        .contact-hero__badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.25);color:var(--cyan);border-radius:100px;padding:7px 18px;font-size:13px;font-weight:500;margin-bottom:24px;}
        .contact-hero__badge-dot{width:6px;height:6px;border-radius:50%;background:var(--cyan);animation:pulse-dot 2s ease infinite;}
        .contact-hero__h1{font-family:'Syne',sans-serif;font-size:clamp(38px,6vw,72px);font-weight:800;color:#fff;line-height:1.06;letter-spacing:-2.5px;margin:0 0 20px;}
        .contact-hero__h1 span{background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .contact-hero__sub{font-size:18px;color:var(--muted);line-height:1.75;}

        /* ══════════════════════════════════════════
           CONTACT INFO CARDS
        ══════════════════════════════════════════ */
        .contact-info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;}
        .contact-card{
          background:var(--dark3);border:1px solid var(--border);border-radius:20px;padding:28px;
          transition:transform .3s,border-color .3s,box-shadow .3s;position:relative;overflow:hidden;
        }
        .contact-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.22,1,.36,1);}
        .contact-card:hover{transform:translateY(-4px);border-color:rgba(124,58,237,.3);box-shadow:0 20px 60px rgba(124,58,237,.1);}
        .contact-card:hover::before{transform:scaleX(1);}
        .contact-card__icon{font-size:32px;margin-bottom:16px;display:block;filter:drop-shadow(0 0 10px rgba(124,58,237,.5));}
        .contact-card__title{font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;}
        .contact-card__value{font-size:18px;font-weight:700;color:#fff;margin-bottom:6px;letter-spacing:-.3px;}
        .contact-card__link{font-size:18px;font-weight:700;color:var(--cyan);display:block;margin-bottom:6px;letter-spacing:-.3px;transition:color .2s;}
        .contact-card__link:hover{color:#fff;}
        .contact-card__note{font-size:13px;color:var(--muted);}

        /* ══════════════════════════════════════════
           CONTACT FORM + SIDEBAR
        ══════════════════════════════════════════ */
        .contact-main{display:grid;grid-template-columns:1fr 380px;gap:48px;align-items:start;}
        /* Form */
        .cf-form{background:var(--dark3);border:1px solid var(--border);border-radius:24px;padding:40px;}
        .cf-form__title{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#fff;letter-spacing:-.5px;margin-bottom:6px;}
        .cf-form__sub{font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.7;}
        /* Topics */
        .cf-topics{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px;}
        .cf-topic-pill{background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--muted);border-radius:100px;padding:6px 16px;font-size:13px;font-weight:500;cursor:pointer;transition:background .2s,border-color .2s,color .2s;font-family:inherit;}
        .cf-topic-pill:hover{background:rgba(124,58,237,.1);border-color:var(--border2);color:#fff;}
        .cf-topic-pill--active{background:rgba(124,58,237,.2);border-color:var(--border2);color:#fff;}
        /* Fields */
        .cf-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
        .cf-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
        .cf-field:last-child{margin-bottom:24px;}
        .cf-label{font-size:13px;font-weight:600;color:rgba(255,255,255,.6);letter-spacing:.04em;}
        .cf-input,.cf-textarea{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:12px 16px;font-size:15px;color:#fff;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s;width:100%;}
        .cf-input::placeholder,.cf-textarea::placeholder{color:rgba(255,255,255,.2);}
        .cf-input:focus,.cf-textarea:focus{border-color:rgba(124,58,237,.5);box-shadow:0 0 0 3px rgba(124,58,237,.1);}
        .cf-textarea{resize:vertical;min-height:140px;}
        .cf-submit{width:100%;background:var(--grad);color:#fff;border:none;border-radius:10px;padding:15px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 0 32px rgba(124,58,237,.3);transition:transform .2s,box-shadow .2s,opacity .2s;display:flex;align-items:center;justify-content:center;gap:10px;}
        .cf-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 48px rgba(124,58,237,.5);}
        .cf-submit--busy{opacity:.7;}
        .cf-submit__spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
        /* Success */
        .form-success{background:var(--dark3);border:1px solid rgba(0,240,255,.2);border-radius:24px;padding:64px 40px;text-align:center;}
        .form-success__icon{width:72px;height:72px;border-radius:50%;background:rgba(0,240,255,.1);border:2px solid var(--cyan);color:var(--cyan);font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;}
        .form-success__title{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#fff;margin-bottom:10px;}
        .form-success__sub{font-size:16px;color:var(--muted);}
        /* Sidebar */
        .contact-sidebar{display:flex;flex-direction:column;gap:24px;}
        .sidebar-card{background:var(--dark3);border:1px solid var(--border);border-radius:20px;padding:28px;}
        .sidebar-card__title{font-size:14px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px;}
        .sidebar-card__body{font-size:14px;color:var(--muted);line-height:1.8;}
        .sidebar-card__body strong{color:#fff;font-weight:600;}
        .sidebar-social{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;}
        .sidebar-social-btn{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--muted);transition:background .2s,border-color .2s,color .2s,transform .2s;text-decoration:none;}
        .sidebar-social-btn:hover{background:rgba(124,58,237,.15);border-color:var(--border2);color:#fff;transform:translateY(-2px);}
        /* Status badge */
        .status-badge{display:flex;align-items:center;gap:10px;background:rgba(0,240,255,.06);border:1px solid rgba(0,240,255,.15);border-radius:12px;padding:12px 16px;margin-bottom:16px;}
        .status-badge__dot{width:8px;height:8px;border-radius:50%;background:var(--cyan);flex-shrink:0;animation:pulse-dot 2s ease infinite;}
        .status-badge__text{font-size:13px;color:var(--cyan);font-weight:500;}

        /* ══════════════════════════════════════════
           OFFICES
        ══════════════════════════════════════════ */
        .offices-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;}
        .office-card{
          background:var(--dark3);border:1px solid var(--border);border-radius:20px;padding:32px;
          transition:transform .3s,border-color .3s,box-shadow .3s;
        }
        .office-card:hover{transform:translateY(-4px);border-color:var(--border2);box-shadow:0 20px 60px rgba(124,58,237,.1);}
        .office-flag{font-size:36px;margin-bottom:16px;display:block;}
        .office-city{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;letter-spacing:-.5px;margin-bottom:2px;}
        .office-country{font-size:13px;font-weight:600;color:var(--cyan);letter-spacing:.08em;text-transform:uppercase;margin-bottom:20px;}
        .office-details{display:flex;flex-direction:column;gap:10px;}
        .office-detail{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted);line-height:1.6;}
        .office-detail-icon{color:var(--violet);flex-shrink:0;margin-top:2px;font-size:13px;}

        /* FAQ */
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

        /* FOOTER */
        .ai-footer{background:var(--dark4);border-top:1px solid var(--border);position:relative;overflow:hidden;}
        .ai-footer::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,var(--violet),var(--cyan),var(--violet),transparent);}
        .ai-footer__grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(124,58,237,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.03) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,black 0%,transparent 80%);pointer-events:none;}
        .ai-footer__body{position:relative;z-index:1;max-width:1160px;margin:0 auto;padding:64px 48px 0;display:grid;grid-template-columns:1.4fr repeat(3,1fr) 1.2fr;gap:48px;}
        .footer-brand__logo{height:36px;object-fit:contain;margin-bottom:16px;display:block;}
        .footer-brand__logo-text{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:12px;display:block;letter-spacing:-.5px;}
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
        .nl-btn{background:var(--grad);color:#fff;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .2s;}
        .nl-btn:hover{opacity:.9;}
        .nl-done{font-size:14px;color:var(--cyan);font-weight:600;padding:12px 0;}
        .ai-footer__divider{position:relative;z-index:1;max-width:1160px;margin:0 auto;padding:0 48px;margin-top:48px;}
        .ai-footer__divider-line{height:1px;background:var(--border);}
        .ai-footer__bottom{position:relative;z-index:1;max-width:1160px;margin:0 auto;padding:24px 48px 40px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
        .ai-footer__copy{font-size:13px;color:rgba(255,255,255,.25);}
        .ai-footer__badges{display:flex;gap:10px;}
        .ai-footer__badge{font-size:11px;font-weight:600;color:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:4px 12px;}
        .ai-footer__bottom-links{display:flex;gap:20px;}
        .ai-footer__bottom-link{font-size:13px;color:rgba(255,255,255,.25);transition:color .2s;}
        .ai-footer__bottom-link:hover{color:var(--cyan);}

        @media(max-width:1024px){
          .contact-main{grid-template-columns:1fr;}
          .contact-sidebar{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
          .ai-footer__body{grid-template-columns:1fr 1fr;gap:36px;}
          .footer-brand{grid-column:1/-1;}
        }
        @media(max-width:768px){
          .ai-nav{padding:0 20px;} .ai-nav__center,.ai-nav__ghost{display:none;} .ai-nav__burger{display:flex;}
          .ai-section{padding:72px 20px;} .contact-hero{padding:120px 24px 80px;}
          .cf-row{grid-template-columns:1fr;} .contact-sidebar{grid-template-columns:1fr;}
          .ai-footer__body{grid-template-columns:1fr;padding:48px 24px 0;}
          .footer-brand{grid-column:auto;} .ai-footer__bottom{padding:20px 24px 32px;flex-direction:column;align-items:flex-start;}
          .ai-footer__divider{padding:0 24px;}
        }
      `}</style>

            {/* NAV */}
            <nav className={`ai-nav${scrolled ? " ai-nav--scrolled" : ""}`}>
                <div className="ai-nav__logo-wrap">
                    <a href="/">{headerLogoUrl ? <img src={headerLogoUrl} alt="Logo" className="ai-nav__logo" /> : <span className="ai-nav__logo-text">⬡ Site</span>}</a>
                </div>
                <ul className="ai-nav__center">
                    {opts?.headerMenu.map((item, i) => <li key={i}><a href={item.url} className="ai-nav__link">{item.label}</a></li>)}
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
                {opts?.headerMenu.map((item, i) => <a key={i} href={item.url} className="ai-nav__mobile-link" onClick={() => setMenuOpen(false)}>{item.label}</a>)}
                {opts?.headerButton && <a href={opts.headerButton.url} className="ai-nav__mobile-cta">{opts.headerButton.title}</a>}
            </div>

            <main>
                {sections.map((section, index) => {

                    /* ── CONTACT HERO ── */
                    if (section.acf_fc_layout === "contact_hero") {
                        return (
                            <section key={index} className="contact-hero">
                                <div className="contact-hero__glow" />
                                <div className="contact-hero__grid" />
                                <div className="contact-hero__content">
                                    {section.hero_badge && (
                                        <div className="contact-hero__badge">
                                            <span className="contact-hero__badge-dot" />{section.hero_badge}
                                        </div>
                                    )}
                                    <h1 className="contact-hero__h1">
                                        {(() => { const w = (section.heading || "Let's Talk").split(" "); const l = w.pop(); return <>{w.join(" ")} <span>{l}</span></>; })()}
                                    </h1>
                                    <p className="contact-hero__sub">{section.subheading}</p>
                                </div>
                            </section>
                        );
                    }

                    /* ── CONTACT INFO ── */
                    if (section.acf_fc_layout === "contact_info") {
                        return (
                            <div key={index} style={{ background: "var(--dark2)" }}>
                                <div className="ai-section">
                                    <div data-reveal="fade-up" style={{ marginBottom: 48 }}>
                                        <span className="eyebrow">Contact</span>
                                        <h2 className="section-title">{section.section_title}</h2>
                                        {section.section_subtitle && <p className="section-sub">{section.section_subtitle}</p>}
                                    </div>
                                    <div className="contact-info-grid">
                                        {(section.contact_cards ?? []).map((card: any, i: number) => (
                                            <div key={i} className="contact-card" data-reveal="fade-up" data-delay={String(i * 100)}>
                                                {card.card_icon && <span className="contact-card__icon">{card.card_icon}</span>}
                                                <p className="contact-card__title">{card.card_title}</p>
                                                {card.card_link
                                                    ? <a href={card.card_link} className="contact-card__link">{card.card_value}</a>
                                                    : <p className="contact-card__value">{card.card_value}</p>}
                                                {card.card_note && <p className="contact-card__note">{card.card_note}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    /* ── CONTACT FORM ── */
                    if (section.acf_fc_layout === "contact_form") {
                        return (
                            <div key={index} style={{ background: "var(--dark)" }}>
                                <div className="ai-section">
                                    <div className="contact-main">
                                        <div data-reveal="fade-left">
                                            <ContactForm title={section.form_title} subtitle={section.form_subtitle} />
                                        </div>
                                        <div className="contact-sidebar" data-reveal="fade-right">
                                            {/* Online status */}
                                            <div className="sidebar-card">
                                                <p className="sidebar-card__title">Status</p>
                                                <div className="status-badge">
                                                    <div className="status-badge__dot" />
                                                    <span className="status-badge__text">All systems operational</span>
                                                </div>
                                                <p className="sidebar-card__body">
                                                    Average response time: <strong>under 2 hours</strong><br />
                                                    Support hours: <strong>Mon–Fri, 9–6 IST</strong>
                                                </p>
                                            </div>
                                            {/* Social */}
                                            <div className="sidebar-card">
                                                <p className="sidebar-card__title">Find us online</p>
                                                <p className="sidebar-card__body" style={{ marginBottom: 0 }}>Reach us directly on social.</p>
                                                <div className="sidebar-social">
                                                    <a href="#" className="sidebar-social-btn" title="Twitter">𝕏</a>
                                                    <a href="#" className="sidebar-social-btn" title="LinkedIn">in</a>
                                                    <a href="#" className="sidebar-social-btn" title="GitHub">⌥</a>
                                                    <a href="#" className="sidebar-social-btn" title="Discord">◈</a>
                                                </div>
                                            </div>
                                            {/* Quick links */}
                                            <div className="sidebar-card">
                                                <p className="sidebar-card__title">Quick Help</p>
                                                <div className="sidebar-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                    {[["📖 Documentation", "#"], ["💬 Live Chat", "#"], ["🎫 Submit Ticket", "#"], ["📞 Book a Call", "#"]].map(([label, url]) => (
                                                        <a key={label} href={url} style={{ color: "var(--cyan)", fontWeight: 600, fontSize: 14 }}>{label}</a>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    /* ── OFFICES ── */
                    if (section.acf_fc_layout === "contact_offices") {
                        return (
                            <div key={index} style={{ background: "var(--dark3)" }}>
                                <div className="ai-section">
                                    <div data-reveal="fade-up" style={{ marginBottom: 48 }}>
                                        <span className="eyebrow">Offices</span>
                                        <h2 className="section-title">{section.section_title}</h2>
                                    </div>
                                    <div className="offices-grid">
                                        {(section.offices ?? []).map((o: any, i: number) => (
                                            <div key={i} className="office-card" data-reveal="fade-up" data-delay={String(i * 100)}>
                                                {o.office_flag && <span className="office-flag">{o.office_flag}</span>}
                                                <div className="office-city">{o.office_city}</div>
                                                <div className="office-country">{o.office_country}</div>
                                                <div className="office-details">
                                                    {o.office_address && <div className="office-detail"><span className="office-detail-icon">📍</span><span>{o.office_address}</span></div>}
                                                    {o.office_phone && <div className="office-detail"><span className="office-detail-icon">📞</span><span>{o.office_phone}</span></div>}
                                                    {o.office_email && <div className="office-detail"><span className="office-detail-icon">✉️</span><a href={`mailto:${o.office_email}`} style={{ color: "var(--cyan)" }}>{o.office_email}</a></div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    /* ── CONTACT FAQ ── */
                    if (section.acf_fc_layout === "contact_faq") {
                        return (
                            <div key={index} style={{ background: "var(--dark2)" }}>
                                <div className="ai-section">
                                    <div data-reveal="fade-up">
                                        <span className="eyebrow">FAQ</span>
                                        <h2 className="section-title">{section.section_title || <>Quick <span>Answers</span></>}</h2>
                                    </div>
                                    <div data-reveal="fade-up" data-delay="200">
                                        <FaqAccordion items={section.faq_items ?? []} />
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
                    {(opts?.footerColumns ?? []).length > 0
                        ? opts!.footerColumns.map((col, ci) => (
                            <div key={ci} className="footer-col">
                                <p className="footer-col__title">{col.title}</p>
                                <ul className="footer-col__links">{col.links.map((lnk, li) => <li key={li}><a href={lnk.url} className="footer-col__link">{lnk.label}</a></li>)}</ul>
                            </div>
                        ))
                        : [{ title: "Product", links: [["Features", "#"], ["Pricing", "#"]] },
                        { title: "Company", links: [["About", "#"], ["Blog", "#"]] },
                        { title: "Legal", links: [["Privacy", "#"], ["Terms", "#"]] }].map((col, ci) => (
                            <div key={ci} className="footer-col">
                                <p className="footer-col__title">{col.title}</p>
                                <ul className="footer-col__links">{col.links.map(([l, u], li) => <li key={li}><a href={u} className="footer-col__link">{l}</a></li>)}</ul>
                            </div>
                        ))
                    }
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
                        {opts?.footerBadge ? opts.footerBadge.split("·").map((b, i) => <span key={i} className="ai-footer__badge">{b.trim()}</span>) : <><span className="ai-footer__badge">SOC 2</span><span className="ai-footer__badge">GDPR</span></>}
                    </div>
                    <div className="ai-footer__bottom-links">
                        {opts?.headerMenu.slice(0, 4).map((item, i) => <a key={i} href={item.url} className="ai-footer__bottom-link">{item.label}</a>)}
                    </div>
                </div>
            </footer>
        </>
    );
}