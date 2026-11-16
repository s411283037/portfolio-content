const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
const links = document.querySelector<HTMLElement>('.nav-links');

toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  links?.classList.toggle('is-open', !open);
});

links?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  toggle?.setAttribute('aria-expanded', 'false');
  links.classList.remove('is-open');
}));

const sections = [...document.querySelectorAll<HTMLElement>('main section[id]')];
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const current = (link as HTMLElement).dataset.nav === visible.target.id;
      link.classList.toggle('is-current', current);
      if (current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-35% 0px -55%', threshold: [0, .2, .6] });
  sections.forEach((section) => navObserver.observe(section));

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));
} else {
  document.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'));
}
