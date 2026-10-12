import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
gsap.config({ nullTargetWarn: false })

const $ = (s, root = document) => root.querySelector(s)
const $$ = (s, root = document) => [...root.querySelectorAll(s)]
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

// smooth scroll, driven by gsap's ticker so ScrollTrigger stays in sync
let lenis = null
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  if (import.meta.env.DEV) window.__lenis = lenis
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else target.scrollIntoView ? target.scrollIntoView() : window.scrollTo(0, 0)
}

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')
    const target = id === '#top' ? 0 : $(id)
    if (target === null) return
    e.preventDefault()
    closeMenu()
    scrollToTarget(target)
    history.replaceState(null, '', id === '#top' ? location.pathname : id)
  })
})

// header tucks away on the way down, comes back on the way up
const header = $('#site-header')
let lastY = window.scrollY
window.addEventListener(
  'scroll',
  () => {
    const y = window.scrollY
    const hide = y > lastY && y > 160
    header.classList.toggle('-translate-y-full', hide)
    lastY = y
  },
  { passive: true },
)

gsap.to('#progress', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
})

// mobile menu
const menu = $('#menu')
const openBtn = $('#menu-open')
let menuOpen = false
let menuTl = null

function openMenu() {
  if (!menu || menuOpen) return
  menuOpen = true
  lenis?.stop()
  menu.setAttribute('aria-hidden', 'false')
  openBtn.setAttribute('aria-expanded', 'true')
  menuTl?.kill()
  menuTl = gsap
    .timeline()
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
    .fromTo('[data-menu-link]', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.05, ease: 'expo.out' }, 0.45)
}

function closeMenu() {
  if (!menu || !menuOpen) return
  menuOpen = false
  lenis?.start()
  menu.setAttribute('aria-hidden', 'true')
  openBtn.setAttribute('aria-expanded', 'false')
  menuTl?.kill()
  menuTl = gsap
    .timeline()
    .to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.7, ease: 'expo.inOut' })
    .set(menu, { visibility: 'hidden' })
}

openBtn?.addEventListener('click', openMenu)
$('#menu-close')?.addEventListener('click', closeMenu)
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu())

$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()))

// the load-in itself is css (see main.css), this only adds the scroll behaviour
function intro() {
  heroStage()
  if (reduceMotion || !$('[data-hero-parallax]')) return

  gsap.to('[data-hero-parallax]', {
    yPercent: 8,
    ease: 'none',
    scrollTrigger: { trigger: '[data-hero-frame]', start: 'top 60%', end: 'bottom top', scrub: true },
  })
}

// hero photo opens out from grid line B to the full width of the screen
function heroStage() {
  const stage = $('[data-hero-stage]')
  const measure = $('[data-hero-measure]')
  if (!stage || !measure) return

  const inset = () => {
    const r = measure.getBoundingClientRect()
    return { l: r.left, r: document.documentElement.clientWidth - r.right }
  }
  const apply = () => {
    const { l, r } = inset()
    gsap.set(stage, { '--l': `${l}px`, '--r': `${r}px` })
  }

  if (reduceMotion) {
    apply()
    window.addEventListener('resize', apply)
    return
  }

  gsap.fromTo(
    stage,
    { '--l': () => `${inset().l}px`, '--r': () => `${inset().r}px` },
    {
      '--l': '0px',
      '--r': '0px',
      ease: 'none',
      scrollTrigger: {
        trigger: stage,
        start: 0,
        end: 'top 12%',
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    },
  )
}

// section rules draw across as they come into view, tied to scroll position
function rules() {
  $$('[data-rule-line]').forEach((line) => {
    gsap.from(line, {
      scaleX: 0,
      ease: 'none',
      scrollTrigger: { trigger: line, start: 'top 95%', end: 'top 60%', scrub: 0.6 },
    })
  })
}

// images open out from a cropped frame while scrolling
function reveals() {
  $$('[data-reveal]').forEach((frame) => {
    const st = { trigger: frame, start: 'top 95%', end: 'center 55%', scrub: 0.8 }
    gsap.fromTo(frame, { clipPath: 'inset(12% 9% 12% 9%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: st })
    const img = $('[data-reveal-img]', frame)
    if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: st })
  })

  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
  })
}

function process() {
  const list = $('[data-process]')
  if (!list) return
  gsap.from('[data-process-fill]', {
    scaleY: 0,
    ease: 'none',
    scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 60%', scrub: 0.6 },
  })
  $$('[data-step]', list).forEach((step) => {
    ScrollTrigger.create({ trigger: step, start: 'top 68%', toggleClass: { targets: step, className: 'is-on' } })
  })
}

// services: the list scrolls, the drawing on the left swaps in sync
function services() {
  const items = $$('[data-svc]')
  const slides = $$('[data-svc-slide]')
  if (!items.length || !slides.length) return

  const name = $('#svc-name')
  const count = $('#svc-count')
  let current = 0

  function show(i) {
    if (i === current) return
    const dir = i > current ? 1 : -1
    const next = slides[i]
    const prev = slides[current]

    slides.forEach((s) => gsap.set(s, { zIndex: s === next ? 2 : s === prev ? 1 : 0 }))
    gsap.fromTo(
      next,
      { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', overwrite: true },
    )
    gsap.fromTo($('img', next), { scale: 1.18, yPercent: 6 * dir }, { scale: 1, yPercent: 0, duration: 1.6, ease: 'expo.out', overwrite: true })
    gsap.to($('img', prev), { yPercent: -8 * dir, duration: 1.1, ease: 'expo.inOut', overwrite: true })

    items.forEach((it, j) => it.classList.toggle('is-active', j === i))
    name.textContent = $('h3', items[i]).textContent
    count.textContent = String(i + 1).padStart(2, '0')
    current = i
  }

  const mm = gsap.matchMedia()
  mm.add('(min-width: 1024px)', () => {
    items.forEach((item, i) => {
      ScrollTrigger.create({
        trigger: item,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && show(i),
      })
    })
    gsap.from('[data-svc-rail]', {
      scaleY: 0,
      ease: 'none',
      scrollTrigger: { trigger: items[0].parentElement, start: 'top 55%', end: 'bottom 55%', scrub: 0.4 },
    })
  })
}

// youtube loads only when asked for
function videos() {
  $$('[data-yt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const frame = document.createElement('iframe')
      frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1`
      frame.title = btn.dataset.title || 'Anon Homes project film'
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      frame.allowFullscreen = true
      frame.className = 'absolute inset-0 size-full'
      const holder = document.createElement('div')
      holder.className = 'relative aspect-video w-full bg-ink'
      holder.appendChild(frame)
      btn.replaceWith(holder)
    })
  })
}

function rating() {
  const el = $('[data-count]')
  if (!el || reduceMotion) return
  const target = parseFloat(el.dataset.count)
  const fill = $('[data-stars-fill]')
  const state = { v: 0 }
  el.textContent = '0.0'
  gsap.set(fill, { width: '0%' })
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(state, {
        v: target,
        duration: 1.8,
        ease: 'expo.out',
        onUpdate: () => (el.textContent = state.v.toFixed(1)),
      })
      gsap.to(fill, { width: `${(target / 5) * 100}%`, duration: 1.8, ease: 'expo.out' })
    },
  })
}

// themed listbox standing in for a native select
function selects() {
  $$('[data-select]').forEach((root) => {
    const trigger = $('[data-select-trigger]', root)
    const list = $('[data-select-list]', root)
    const input = $('input[type="hidden"]', root)
    const label = $('[data-select-value]', root)
    const options = $$('[role="option"]', list)
    let open = false
    let active = 0
    let tl = null
    let typed = ''
    let typedTimer = null

    options.forEach((opt, i) => (opt.id ||= `${list.id}-opt-${i}`))

    function setActive(i) {
      active = (i + options.length) % options.length
      options.forEach((opt, j) => opt.classList.toggle('is-active', j === active))
      list.setAttribute('aria-activedescendant', options[active].id)
    }

    function choose(i) {
      options.forEach((opt, j) => opt.setAttribute('aria-selected', String(j === i)))
      input.value = options[i].dataset.value
      label.textContent = $('.flex-1', options[i]).textContent
    }

    function show() {
      if (open) return
      open = true
      const selected = options.findIndex((o) => o.getAttribute('aria-selected') === 'true')
      setActive(Math.max(selected, 0))

      // open upwards when the panel would run off the bottom of the screen
      list.classList.remove('is-up')
      const below = innerHeight - trigger.getBoundingClientRect().bottom
      list.classList.toggle('is-up', below < list.offsetHeight + 24 && trigger.getBoundingClientRect().top > below)
      const from = list.classList.contains('is-up') ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)'

      trigger.setAttribute('aria-expanded', 'true')
      tl?.kill()
      // visible right away, otherwise the focus call below is ignored
      gsap.set(list, { visibility: 'visible' })
      tl = gsap
        .timeline()
        .fromTo(list, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduceMotion ? 0 : 0.6, ease: 'expo.out' })
        .fromTo(options, { y: -8 }, { y: 0, duration: reduceMotion ? 0 : 0.6, stagger: 0.03, ease: 'expo.out' }, 0)
      list.focus({ preventScroll: true })
    }

    function hide(refocus = true) {
      if (!open) return
      open = false
      trigger.setAttribute('aria-expanded', 'false')
      const to = list.classList.contains('is-up') ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)'
      tl?.kill()
      tl = gsap
        .timeline()
        .to(list, { clipPath: to, duration: reduceMotion ? 0 : 0.4, ease: 'expo.inOut' })
        .set(list, { visibility: 'hidden' })
      if (refocus) trigger.focus({ preventScroll: true })
    }

    trigger.addEventListener('click', () => (open ? hide() : show()))
    trigger.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        show()
      }
    })

    list.addEventListener('keydown', (e) => {
      const keys = {
        ArrowDown: () => setActive(active + 1),
        ArrowUp: () => setActive(active - 1),
        Home: () => setActive(0),
        End: () => setActive(options.length - 1),
        Enter: () => (choose(active), hide()),
        ' ': () => (choose(active), hide()),
        Escape: () => hide(),
      }
      if (keys[e.key]) {
        e.preventDefault()
        e.stopPropagation()
        keys[e.key]()
        return
      }
      if (e.key === 'Tab') return hide(false)

      // jump to an option by typing its first letters
      if (e.key.length === 1) {
        typed += e.key.toLowerCase()
        clearTimeout(typedTimer)
        typedTimer = setTimeout(() => (typed = ''), 600)
        const hit = options.findIndex((o) => $('.flex-1', o).textContent.toLowerCase().startsWith(typed))
        if (hit > -1) setActive(hit)
      }
    })

    options.forEach((opt, i) => {
      opt.addEventListener('mousemove', () => active !== i && setActive(i))
      opt.addEventListener('click', () => {
        choose(i)
        hide()
      })
    })

    document.addEventListener('pointerdown', (e) => open && !root.contains(e.target) && hide(false))
  })
}

// enquiry goes out as a prefilled WhatsApp message
function enquiry() {
  const form = $('#enquiry')
  if (!form) return
  const error = $('#enquiry-error')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form))
    const missing = !data.name.trim() || !data.phone.trim() || !data.message.trim()
    error.classList.toggle('hidden', !missing)
    if (missing) return

    const lines = [
      'Hello Anon Homes,',
      '',
      `Name: ${data.name.trim()}`,
      `Phone: ${data.phone.trim()}`,
      data.service ? `Service: ${data.service}` : null,
      '',
      data.message.trim(),
    ].filter((l) => l !== null)

    window.open(`https://wa.me/918086000373?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener')
  })
}

// underline the nav link for whichever section is mid-screen
function navState() {
  const links = $$('#site-header nav a[href^="#"]')
  links.forEach((link) => {
    const section = $(link.getAttribute('href'))
    if (!section) return
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => link.setAttribute('aria-current', self.isActive ? 'true' : 'false'),
    })
  })
}

// article page: numbers in the margin light up as you read
function article() {
  $$('[data-article-step]').forEach((step) => {
    ScrollTrigger.create({ trigger: step, start: 'top 65%', toggleClass: { targets: step, className: 'is-on' } })
  })
}

// above-the-fold and input handlers first
intro()
videos()
selects()
enquiry()

// everything below the fold gets its own task so none of it blocks input for long
const later = [navState, process, services, article]
if (!reduceMotion) later.push(rules, reveals, rating)
later.forEach((fn) => setTimeout(fn, 0))

window.addEventListener('load', () => ScrollTrigger.refresh())
