/* ==========================================================================
   YADEA · movimento
   Vocabulário curto, reusado na página inteira (styleguide, seção 10):
   · entrada: sobe 16 px + fade, 500 ms, cubic-bezier(.2,.7,.2,1), UMA vez;
   · título do hero: linhas saindo de uma máscara;
   · assinatura: a barra laranja sob o título "carrega" uma vez, como uma
     bateria — o elétrico dito sem palavra;
   · contadores (números do Sobre e do destaque);
   · o ÚNICO momento marcante: o destaque da Keeness, que gruda na tela no
     desktop enquanto a foto se aproxima e os números sobem com a rolagem;
   · profundidade leve no hero e no Sobre, só no desktop.
   Este arquivo só SE DECLARA. Quem dá a partida é o app.js, depois de montar
   vitrine, FAQ e depoimentos. Sem GSAP ou com movimento reduzido, tudo vira
   no-op e nada fica escondido (ver a classe `sem-anima` no <head>).
   ========================================================================== */

(() => {
  'use strict';

  const raiz = document.documentElement;
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.gsap || !window.ScrollTrigger || semMovimento) {
    raiz.classList.add('sem-anima');
    window.YADEA_MOTION = {
      iniciar: () => {},
      revelar: () => {},
      travarScroll: () => {},
      recalcular: () => {},
      rolarPara: (alvo, deslocamento = 0) => {
        if (alvo) window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY + deslocamento });
      },
    };
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const EASE = 'power3.out'; // o mais próximo de cubic-bezier(.2,.7,.2,1)
  const ENTRADA = { duracao: 0.5, deslocamento: 16 };
  const desktopFino = '(min-width: 1025px) and (pointer: fine)';

  /* ── Scroll suave (só desktop com ponteiro fino) ──────────────────────── */

  let lenis = null;

  /* Overlays têm rolagem própria: com modal ou menu aberto o Lenis sai do
     caminho, senão a roda dentro do painel não faz nada. */
  function travarScroll(travado) {
    if (!lenis) return;
    if (travado) lenis.stop();
    else lenis.start();
  }

  const alturaHeader = () => parseFloat(getComputedStyle(raiz).getPropertyValue('--yd-header')) || 80;

  function scrollSuave() {
    if (!window.Lenis || !matchMedia(desktopFino).matches) return;

    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
    gsap.ticker.lagSmoothing(0);

    // Âncoras pedem ao Lenis, senão o scroll nativo briga com ele.
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (id.length < 2 || id.startsWith('#modelo/')) return;
      const alvo = document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      lenis.scrollTo(alvo, { offset: -(alturaHeader() + 16), duration: 1 });
    });
  }

  /* ── Entradas ─────────────────────────────────────────────────────────── */

  function revelar(escopo = document) {
    const alvos = Array.from(escopo.querySelectorAll('[data-anima]'))
      .filter((el) => !el.dataset.animaPronto);
    alvos.forEach((el) => { el.dataset.animaPronto = '1'; });

    // Vizinhos que entram juntos ganham stagger; o resto entra sozinho.
    const grupos = new Map();
    alvos.forEach((el) => {
      const pai = el.parentElement;
      if (!grupos.has(pai)) grupos.set(pai, []);
      grupos.get(pai).push(el);
    });

    grupos.forEach((itens) => {
      gsap.fromTo(itens, { opacity: 0, y: ENTRADA.deslocamento }, {
        opacity: 1,
        y: 0,
        duration: ENTRADA.duracao,
        ease: EASE,
        stagger: itens.length > 1 ? 0.07 : 0,
        clearProps: 'transform',
        scrollTrigger: { trigger: itens[0], start: 'top 90%', once: true },
      });
    });
  }

  /* ── Hero ─────────────────────────────────────────────────────────────── */

  function hero() {
    // Página do modelo não tem hero: sem isto o GSAP avisa "target not found".
    // Com o hero da campanha no ar, o de sempre está escondido (o motor embutido no index anima o outro).
    if (!document.querySelector('.hero') || document.documentElement.classList.contains('em-campanha')) return;
    const titulo = document.querySelector('[data-anima-linhas]');
    if (titulo) {
      /* Cada linha (separada por <br>) vira uma máscara. O <span> do
         destaque sobrevive à divisão porque o split é por <br>, nunca dentro
         de tag. */
      const quebras = titulo.innerHTML.split(/<br\s*\/?>/i);
      /* Celular: a 1ª linha ("Líder global") continua sozinha; o resto vira
         UMA máscara de texto corrido, que quebra onde couber (pedido do
         cliente, 06/11/2026: três linhas quebradas à mão pesavam). */
      const linhas = matchMedia('(max-width: 760px)').matches && quebras.length > 2
        ? [quebras[0], quebras.slice(1).map((l) => l.trim()).join(' ')]
        : quebras;
      titulo.innerHTML = linhas
        .map((l) => `<span class="hero__linha"><span>${l.trim()}</span></span>`)
        .join('');
      titulo.dataset.animaPronto = '1';
      gsap.set(titulo, { opacity: 1 });

      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(titulo.querySelectorAll('.hero__linha > span'), {
        yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.09,
      });

      const carga = document.querySelector('.hero__carga');
      if (carga) tl.fromTo(carga, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.5');
    }

    // O resto do hero entra em cascata curta, sem esperar scroll.
    const restante = Array.from(document.querySelectorAll('.hero [data-anima]')).filter((el) => el !== titulo);
    restante.forEach((el) => { el.dataset.animaPronto = '1'; });
    gsap.fromTo(restante, { opacity: 0, y: ENTRADA.deslocamento }, {
      opacity: 1, y: 0, duration: 0.6, ease: EASE, stagger: 0.08, delay: 0.55, clearProps: 'transform',
    });

    /* Ao sair do hero, a mídia se afasta um pouco e escurece: a página
       "entra" na loja. Só desktop: no celular é rolagem que pesa e não conta
       nada. */
    gsap.matchMedia().add(desktopFino, () => {
      gsap.to('.hero__midia', {
        scale: 1.08, yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero__conteudo', {
        yPercent: -12, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ── Contadores da faixa de prova ─────────────────────────────────────── */

  const formatarNumero = (el, v) => (el.dataset.ano !== undefined ? String(Math.round(v)) : Math.round(v).toLocaleString('pt-BR'));

  function contadores() {
    const pinado = matchMedia(desktopFino).matches;
    document.querySelectorAll('[data-contador]').forEach((el) => {
      // No desktop, os números do destaque sobem COM a rolagem (destaque()).
      if (pinado && el.closest('.destaque')) return;
      const alvo = Number(el.dataset.contador);
      if (!Number.isFinite(alvo)) return;
      const estado = { valor: 0 };
      const formatar = (v) => formatarNumero(el, v);
      // Ano (data-ano) sobe dos últimos 19: contar de zero até 2019 é ruído.
      if (el.dataset.ano !== undefined) estado.valor = alvo - 19;
      el.textContent = formatar(estado.valor);
      gsap.to(estado, {
        valor: alvo,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = formatar(estado.valor); },
        scrollTrigger: { trigger: el, start: 'top bottom', once: true },
      });
    });
  }

  /* ── Profundidade no Sobre (desktop) ─────────────────────────────────── */

  function profundidade() {
    gsap.matchMedia().add(desktopFino, () => {
      if (document.querySelector('.sobre__fundo')) {
        gsap.fromTo('.sobre__fundo img', { yPercent: -6, scale: 1.08 }, {
          yPercent: 6, scale: 1.08, ease: 'none',
          scrollTrigger: { trigger: '.sobre', start: 'top bottom', end: 'bottom top', scrub: true },
        });
      }
      if (document.querySelector('.porque__foto')) {
        gsap.fromTo('.porque__foto img', { yPercent: -5, scale: 1.1 }, {
          yPercent: 5, scale: 1.1, ease: 'none',
          scrollTrigger: { trigger: '.porque', start: 'top bottom', end: 'bottom top', scrub: true },
        });
      }
    });
  }

  /* ── Destaque da Keeness: o momento marcante (só desktop) ───────────────
     A seção gruda na tela por ~uma altura de tela. Enquanto isso a foto sai
     do close para o enquadramento inteiro, o véu escuro recua e os três
     números sobem junto com a rolagem. Celular: sem pin (rolagem presa no
     toque é armadilha) — entra como as outras seções e os números contam
     ao aparecer. Sem GSAP: a seção é estática e completa. */
  function destaque() {
    const secao = document.querySelector('.destaque');
    if (!secao) return;
    gsap.matchMedia().add(desktopFino, () => {
      const numeros = Array.from(secao.querySelectorAll('[data-contador]'));
      const estados = numeros.map(() => ({ valor: 0 }));
      numeros.forEach((el) => { el.textContent = '0'; });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: secao,
          start: 'top top',
          end: '+=110%',
          pin: '.destaque__palco',
          scrub: 0.6,
          anticipatePin: 1,
        },
      });
      tl.fromTo('.destaque__fundo img', { scale: 1.22, xPercent: 4 }, { scale: 1, xPercent: 0, duration: 1 }, 0)
        // Não abaixo de 0,8: o eyebrow e o texto continuam sobre fundo escuro.
        .fromTo('.destaque__veu', { opacity: 1 }, { opacity: 0.8, duration: 0.7 }, 0)
        .fromTo('.destaque__carga', { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, 0.1);
      numeros.forEach((el, i) => {
        tl.to(estados[i], {
          valor: Number(el.dataset.contador),
          duration: 0.6,
          onUpdate: () => { el.textContent = formatarNumero(el, estados[i].valor); },
        }, 0.15 + i * 0.08);
      });
      // Sem isso, um resize no meio do pin deixa o número no meio do caminho.
      return () => numeros.forEach((el) => { el.textContent = formatarNumero(el, Number(el.dataset.contador)); });
    });
  }

  /* ── Seção atual no menu ──────────────────────────────────────────────── */

  function menuAtivo() {
    document.querySelectorAll('.header__link').forEach((link) => {
      const secao = document.querySelector(link.getAttribute('href'));
      if (!secao) return;
      ScrollTrigger.create({
        trigger: secao,
        start: 'top 40%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        },
      });
    });
  }

  /* Qualquer coisa que mude a ALTURA da página invalida as posições do
     ScrollTrigger. Filtrar a vitrine muda a altura em milhares de pixels. */
  const recalcular = () => ScrollTrigger.refresh();

  /* Rolagem que respeita o Lenis (com ele ativo, scrollTo nativo dá solavanco). */
  function rolarPara(alvo, deslocamento = 0) {
    if (!alvo) return;
    if (lenis) {
      lenis.scrollTo(alvo, { offset: deslocamento, duration: 0.8 });
      return;
    }
    window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY + deslocamento, behavior: 'smooth' });
  }

  let iniciado = false;
  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    raiz.classList.add('motion-ok');

    hero();
    scrollSuave();
    contadores();
    profundidade();
    destaque();
    menuAtivo();
    revelar();

    // Fonte chegando depois muda altura de bloco e desalinha os gatilhos.
    document.fonts?.ready.then(recalcular);
    addEventListener('load', () => {
      recalcular();
      /* Rede de segurança: [data-anima] que entrou no DOM sem passar por
         revelar() ficaria invisível. Conteúdo faltando é pior que sem animação. */
      setTimeout(() => {
        const orfaos = document.querySelectorAll('[data-anima]:not([data-anima-pronto])');
        if (orfaos.length) gsap.set(orfaos, { opacity: 1, y: 0, clearProps: 'transform' });
      }, 1200);
    });
  }

  window.YADEA_MOTION = { iniciar, revelar, travarScroll, recalcular, rolarPara };

  // Se o app.js já terminou (ordem de carga inesperada), parte agora.
  if (window.YADEA_APP_PRONTO) iniciar();
})();
