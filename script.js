/* Shared motion setup: GSAP, ScrollTrigger, SplitText and Lenis smooth scroll.
   Content is visible by default. If a library fails to load or the visitor prefers
   reduced motion, nothing is hidden and the page works like Style 1. */
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const allowMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = hasGSAP && allowMotion;
let pageContext;
const pageCleanups = [];

if (motion) {
  gsap.registerPlugin(...[ScrollTrigger, window.SplitText, window.Draggable].filter(Boolean));
  if (typeof window.Lenis !== 'undefined') {
    window.lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.documentElement.classList.add('has-motion');
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* Split text into masked lines, words or chars. Returns the pieces, or the element itself without SplitText. */
function splitText(target, type) {
  if (!target) return [];
  if (!window.SplitText) return [target];
  const result = new SplitText(target, { type, mask: type.split(',')[0] });
  return result[type.split(',').pop()];
}

/* Hide targets now, then bring each group in as it scrolls into view. */
function revealBatch(targets, from, to, start) {
  targets = gsap.utils.toArray(targets);
  if (!targets.length) return;
  gsap.set(targets, from);
  ScrollTrigger.batch(targets, {
    start: start || 'top 88%',
    once: true,
    onEnter: batch => gsap.to(batch, Object.assign({ overwrite: true }, to))
  });
}

/* Count every number inside an element up from zero, then restore the exact original text. */
function countUp(element, trigger) {
  const original = element.textContent;
  const numbers = original.match(/\d+(\.\d+)?/g);
  if (!numbers) return;
  const state = { p: 0 };
  gsap.to(state, {
    p: 1, duration: 1.4, ease: 'power3.out',
    scrollTrigger: { trigger: trigger || element, start: 'top 85%', once: true },
    onUpdate: () => {
      let i = 0;
      element.textContent = original.replace(/\d+(\.\d+)?/g, match => {
        const decimals = (numbers[i++].split('.')[1] || '').length;
        const value = (parseFloat(match) * state.p).toFixed(decimals);
        return /^0\d/.test(match) ? value.padStart(match.length, '0') : value;
      });
    },
    onComplete: () => { element.textContent = original; }
  });
  pageCleanups.push(() => { element.textContent = original; });
}

window.onPageShown = page => {
  if (!motion || !window.animatePage) return;
  if (pageContext) pageContext.revert();
  pageCleanups.splice(0).forEach(cleanup => cleanup());
  pageContext = gsap.context(() => {
    page.querySelectorAll('img').forEach(img => {
      if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    });
    window.animatePage(page);
  });
  ScrollTrigger.refresh();
};

/* Style 4 · Dark Motion: hero video shrinks into a card, card rows scroll sideways on wide screens,
   the statement fills in line by line, specification numbers count up. */
if (motion) {
  ScrollTrigger.create({ start: 40, end: 'max', toggleClass: { targets: '.site-header', className: 'is-solid' } });
}

window.animatePage = page => {
  const hero = page.querySelector('.hero');
  const copy = hero.querySelector('.hero-copy');
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from(splitText(hero.querySelector('h1'), 'lines,chars'), { yPercent: 110, duration: 1, stagger: 0.018 })
    .from(copy.querySelectorAll('.eyebrow, p, .actions'), { y: 30, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.3)
    .from(hero.querySelector('.hero-media'), { scale: 0.85, autoAlpha: 0, duration: 1.4 }, 0.2);

  const stage = hero.querySelector('.video-stage');
  if (stage) {
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=75%', scrub: true, pin: true } })
      .fromTo(stage, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(9% 5% 9% 5% round 36px)', ease: 'none' }, 0)
      .to(copy, { y: -140, autoAlpha: 0, ease: 'none' }, 0);
  }

  const statement = page.querySelector('[data-k=statement] blockquote');
  if (statement) {
    const lines = splitText(statement, 'lines');
    lines.forEach(line => line.classList.add('fill-line'));
    gsap.to(lines, { backgroundPosition: '0% 0', ease: 'none', stagger: 0.5, scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 40%', scrub: true } });
  }

  page.querySelectorAll('.section-title h2').forEach(title => {
    gsap.from(splitText(title, 'lines,chars'), { yPercent: 110, duration: 0.9, stagger: 0.012, ease: 'power4.out', scrollTrigger: { trigger: title, start: 'top 85%', once: true } });
  });

  const media = gsap.matchMedia();
  media.add('(min-width: 851px)', () => {
    page.querySelectorAll('.grid').forEach(grid => {
      if (grid.children.length < 4) return;
      grid.classList.add('is-track');
      const section = grid.closest('.section');
      const distance = () => {
        const inset = parseFloat(getComputedStyle(section).paddingLeft);
        return Math.max(0, grid.scrollWidth - (section.clientWidth - inset * 2));
      };
      gsap.to(grid, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: grid, pin: true, start: 'center center', end: () => '+=' + distance(), scrub: 0.6, invalidateOnRefresh: true }
      });
      return () => grid.classList.remove('is-track');
    });
    return () => page.querySelectorAll('.grid.is-track').forEach(grid => grid.classList.remove('is-track'));
  });
  pageCleanups.push(() => media.revert());

  revealBatch(page.querySelectorAll('.grid:not(.is-track) > *, .split, .section > .placeholder, .empty-state, .long-copy, .presence-intro'),
    { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' });

  page.querySelectorAll('.locations').forEach(list => {
    gsap.fromTo(list.children, { backgroundSize: '0% 2px, 100% 1px' }, { backgroundSize: '100% 2px, 100% 1px', duration: 1.2, stagger: 0.15, ease: 'power3.inOut', scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
  });
  page.querySelectorAll('tbody td').forEach(cell => countUp(cell));

  const photo = page.querySelector('[data-k=our-robots] .home-photo');
  if (photo) gsap.fromTo(photo, { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true } });

  const contact = document.getElementById('contact');
  gsap.from(contact, { y: 120, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: contact, start: 'top 95%', once: true } });
};

/* BOTENS core: page navigation, mobile menu, contact email and video playback (same behaviour as Style 1). */
const pageNames = { home: 'Home', about: 'About Us', robots: 'Our Robots', delivery: 'Smart Delivery', aiot: 'AIoT Technology' };
const banner = document.getElementById('banner-video');
const videoButton = document.getElementById('video-toggle');
const menuButton = document.getElementById('menu-toggle');
const navigation = document.getElementById('primary-nav');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let videoPausedByUser = false;

function scrollToContact(smooth) {
  const contact = document.getElementById('contact');
  if (window.lenis) window.lenis.scrollTo(contact, { offset: -headerOffset(), immediate: !smooth });
  else contact.scrollIntoView({ behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto' });
}
function headerOffset() {
  const header = document.querySelector('.site-header');
  return header ? header.offsetHeight + 16 : 0;
}
function syncVideoButton() {
  const playing = !banner.paused;
  videoButton.textContent = playing ? 'Pause video' : 'Play video';
  videoButton.setAttribute('aria-label', playing ? 'Pause banner video' : 'Play banner video');
}
function updateVideo() {
  const homeVisible = !document.getElementById('page-home').hidden;
  if (!homeVisible || reducedMotion.matches || videoPausedByUser) banner.pause();
  else banner.play().catch(syncVideoButton);
}
function showPage() {
  let page = location.hash.slice(1) || 'home';
  if (page === 'contact') {
    scrollToContact(false);
    return;
  }
  if (!pageNames[page]) page = 'home';
  document.querySelectorAll('.page').forEach(element => { element.hidden = element.id !== 'page-' + page; });
  document.querySelectorAll('nav a').forEach(link => {
    if (link.hash === '#' + page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('details').forEach(element => { element.open = false; });
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.title = pageNames[page] + ' | BOTENS Robotics';
  document.body.dataset.page = page;
  window.scrollTo(0, 0);
  if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
  updateVideo();
  if (window.onPageShown) window.onPageShown(document.getElementById('page-' + page));
}
menuButton.addEventListener('click', () => {
  navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', navigation.classList.contains('open'));
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href="#contact"]');
  if (!link) return;
  event.preventDefault();
  if (link.dataset.dragged) return;
  scrollToContact(true);
  document.querySelector('#contact input').focus({ preventScroll: true });
});
document.getElementById('contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(event.target);
  const body = 'Name: ' + fields.get('name') + '\nEmail: ' + fields.get('email') + '\nCompany: ' + fields.get('company') + '\n\nBrief Description:\n' + fields.get('description');
  location.href = 'mailto:marketing@botens.onmicrosoft.com?subject=' + encodeURIComponent('BOTENS website enquiry') + '&body=' + encodeURIComponent(body);
  document.getElementById('form-status').textContent = 'Email draft requested. Review and send it in your email app. If it does not open, email marketing@botens.onmicrosoft.com.';
});
videoButton.addEventListener('click', () => {
  if (banner.paused) { videoPausedByUser = false; banner.play().catch(syncVideoButton); }
  else { videoPausedByUser = true; banner.pause(); }
});
banner.addEventListener('play', syncVideoButton);
banner.addEventListener('pause', syncVideoButton);
banner.addEventListener('error', () => { videoButton.textContent = 'Video unavailable'; videoButton.disabled = true; });
reducedMotion.addEventListener('change', updateVideo);
window.addEventListener('hashchange', showPage);
showPage();
