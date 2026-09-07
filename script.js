// ---------- always start at the top ----------
// Browsers restore the previous scroll position on refresh, which lands you
// wherever you last were — usually the footer. The head has already switched
// restoration to manual; this catches any restore that still slips through.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Once the visitor scrolls of their own accord, stop resetting — otherwise the
// late re-asserts below would yank them back to the top mid-scroll.
let userMoved = false;
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev =>
    window.addEventListener(ev, () => { userMoved = true; }, { passive: true, once: true })
);

function toTop() {
    if (userMoved) return;
    // jump, never smooth-scroll: html has scroll-behavior:smooth for anchors
    try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
        window.scrollTo(0, 0);
    }
}

// A hash means the visitor asked for a section, so leave that alone.
if (!window.location.hash) {
    toTop();

    // Restores can land after DOM ready, after load, and again once late
    // resources (web fonts) settle the layout — so re-assert through that
    // window rather than once.
    document.addEventListener('DOMContentLoaded', toTop);
    window.addEventListener('load', () => {
        toTop();
        requestAnimationFrame(toTop);
        setTimeout(toTop, 60);
        setTimeout(toTop, 250);
    }, { once: true });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(toTop).catch(() => { });
    }

    // returning via back/forward cache replays the old scroll position too
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) toTop();
    });
}

// ---------- theme toggle (dark by default, remembers your choice) ----------
const root = document.documentElement;
const themeBtn = document.getElementById('theme-btn');

let stored = null;
try {
    stored = localStorage.getItem('theme');
} catch (e) {
    /* private browsing — fall back to the default */
}
if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);

function labelTheme() {
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
labelTheme();

themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    labelTheme();
    try {
        localStorage.setItem('theme', next);
    } catch (e) {
        /* nothing to do — the toggle still works for this visit */
    }
});

// ---------- mobile menu ----------
const btn = document.querySelector('.menu-btn');
const nav = document.getElementById('nav');
btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
});
// close the menu after tapping a link
nav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', false);
    })
);

// ---------- reveal sections as they scroll into view ----------
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (!entry.isIntersecting) return;
            // slight stagger so grouped cards don't all pop at once
            setTimeout(() => entry.target.classList.add('in'), i * 70);
            io.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
} else {
    reveals.forEach(el => el.classList.add('in'));
}

// ---------- current year in the footer ----------
document.getElementById('year').textContent = new Date().getFullYear();
