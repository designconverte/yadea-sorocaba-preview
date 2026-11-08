/* ==========================================================================
   YADEA · moldes de HTML (card, selos, FAQ, detalhe do modelo)
   --------------------------------------------------------------------------
   O MESMO molde serve aos dois lados:
   · o navegador: o app.js desenha a vitrine e o FAQ a partir do catalogo.js,
     como sempre (o dado novo aparece sem build);
   · o build: tools/gerar-seo.js grava esse HTML dentro do index.html, para
     quem lê a página SEM rodar JavaScript (ChatGPT, Claude, Perplexity, Bing
     no primeiro passe). Sem isto, a página crua não tinha nenhum modelo,
     preço ou pergunta do FAQ.

   Só funções puras: leem window.YADEA_* na hora da chamada e não tocam no
   DOM. Mudou um molde aqui → rodar `node tools/gerar-seo.js`.
   ========================================================================== */

window.YADEA_RENDER = (() => {
  'use strict';

  const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/;

  const ICONE_WHATS = '<svg aria-hidden="true"><use href="#i-whats"></use></svg>';

  // Nome para análise: com fabricante quando a loja informa.
  const nomeCompleto = (m) => [m.fabricante, m.nome].filter(Boolean).join(' ');
  const categoriasDe = (m) => m.categorias || (m.categoria ? [m.categoria] : []);

  /** Monta o link do WhatsApp com a mensagem já preenchida.
      Formato api.whatsapp.com/send (o destino final do wa.me), NÃO wa.me: em
      Campinas a conversão de WhatsApp do Google Ads (no GTM de lá) dispara em
      clique de link cuja URL contém "api.whatsapp"; o container de Sorocaba
      deve seguir a mesma regra (README, pendências). */
  function linkWhats(chave, trocas = {}) {
    const cfg = window.YADEA_CONFIG;
    let texto = cfg.mensagens[chave] || cfg.mensagens.geral;
    for (const [k, v] of Object.entries(trocas)) {
      texto = texto.replaceAll(`{${k}}`, v);
    }
    const prefixo = cfg.prefixoMensagem;
    if (prefixo && !texto.toLowerCase().startsWith(prefixo.toLowerCase())) texto = `${prefixo}. ${texto}`;
    const numero = chave === 'assistencia' ? (cfg.assistencia?.e164 || cfg.whatsapp.e164) : cfg.whatsapp.e164;
    return `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(texto)}`;
  }

  /* Ordem da vitrine: YADEA_ORDEM primeiro, o resto na ordem do catálogo. */
  function ordenados() {
    const todos = window.YADEA_MODELOS || [];
    const prioridade = window.YADEA_ORDEM || [];
    if (!prioridade.length) return todos;
    const posicao = new Map(prioridade.map((id, i) => [id, i]));
    return todos
      .map((m, i) => ({ m, i }))
      .sort((a, b) => {
        const pa = posicao.has(a.m.id) ? posicao.get(a.m.id) : Infinity;
        const pb = posicao.has(b.m.id) ? posicao.get(b.m.id) : Infinity;
        return pa - pb || a.i - b.i;
      })
      .map((x) => x.m);
  }

  function selos(m, classe = '') {
    const c = m.classificacao ? window.YADEA_CLASSIFICACOES[m.classificacao] : null;
    if (!c) return '';
    return `<ul class="selos ${classe}" aria-label="Classificação legal">${c.selos.map((s) => `
      <li class="selo selo--${s.tom}">${escapar(s.t)}</li>`).join('')}</ul>`;
  }

  /* No máximo três números, sempre nesta ordem, só os que a loja informa. */
  const ORDEM_NUMEROS = [
    ['velocidade', 'Velocidade'],
    ['potencia', 'Potência'],
    ['autonomia', 'Autonomia'],
  ];
  const numerico = (v) => v && typeof v === 'object' && v.valor != null && v.unidade;
  // "1.000 W", "7.000 W" (styleguide: números com separador pt-BR).
  const milhar = (v) => (typeof v === 'number' ? v.toLocaleString('pt-BR') : v);

  function numeros(m, classe = '') {
    const s = m.specs;
    const disponiveis = s ? ORDEM_NUMEROS.filter(([campo]) => numerico(s[campo])) : [];
    if (!disponiveis.length) return '';
    return `
        <dl class="specs ${classe}">
          ${disponiveis.map(([campo, rotulo]) => `
            <div class="spec">
              <dt>${rotulo}</dt>
              <dd><b>${escapar(milhar(s[campo].valor))}</b><span>${escapar(s[campo].unidade)}</span></dd>
            </div>`).join('')}
        </dl>`;
  }

  /* Preço como a loja escreve: "R$ 6.900" (sem centavos); parcela sempre com
     centavos ("R$ 553,00", real.format). */
  const realInteiro = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
  const dinheiro = (v) => (Number.isInteger(v) ? realInteiro : real).format(v);

  /* Preço que vale AGORA, num formato só para o card, o modal, o JSON-LD, o
     llms.txt e a medição. `promo` só vale com a campanha ligada
     (YADEA_CAMPANHA.ativa): desligada, volta o preço cheio sem mexer em
     modelo nenhum. A parcela vem da loja como valor da parcela (21x de
     R$ 441,28); o objeto antigo com `total` continua aceito. */
  /* Campanha (YADEA_CAMPANHA): vale com `ativa` e até o fim do dia `ate`, no
     horário de Brasília (UTC−3; o Brasil não tem horário de verão desde
     2019). Sem `ate`, vale enquanto `ativa`. O <head> da home faz a mesma
     conta com o fim que o build grava (fimDaCampanha). */
  function fimDaCampanha(campanha = window.YADEA_CAMPANHA) {
    if (!campanha?.ativa) return null;
    if (!campanha.ate) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(campanha.ate)) throw new Error(`YADEA_CAMPANHA.ate inválida: "${campanha.ate}" (use AAAA-MM-DD)`);
    return `${campanha.ate}T23:59:59.999-03:00`;
  }
  function campanhaVigente(agora = Date.now()) {
    const fim = fimDaCampanha();
    if (fim === null) return false;
    return fim === '' || agora <= Date.parse(fim);
  }
  function precoDe(m) {
    const p = m?.preco;
    if (!p?.valor) return null;
    const campanha = window.YADEA_CAMPANHA;
    const emPromo = Boolean(campanhaVigente() && p.promo && p.promo < p.valor);
    const parc = p.parcelas && typeof p.parcelas === 'object' ? p.parcelas : null;
    return {
      valor: emPromo ? p.promo : p.valor,
      de: emPromo ? p.valor : null,
      campanha: emPromo ? campanha.nome : null,
      ate: emPromo ? campanha.ate || null : null,
      parcelas: parc ? {
        vezes: parc.vezes,
        valor: parc.parcela ?? parc.total / parc.vezes,
        juros: Boolean(parc.juros),
        cartoes: parc.cartoes || null,
      } : null,
    };
  }

  /* Uma linha só para a parcela, em tom mais discreto que o preço: "ou 21x
     de R$ 441,28 no cartão" (+ bandeiras, quando a loja restringe). Com
     juros, a linha não fala neles; sem juros, diz "sem juros". */
  function parcelas(p) {
    if (!p) return '';
    const juros = p.juros ? '' : ' sem juros';
    const cartao = p.cartoes ? ` no cartão ${escapar(p.cartoes)}` : ' no cartão';
    return `<span class="preco__parcelas">ou ${p.vezes}x de ${real.format(p.valor)}${juros}${cartao}</span>`;
  }

  /* Preço aprovado pela loja (06/11/2026). Na campanha: selo, preço novo e
     o antigo riscado ao lado. O "antes"/"por" ocultos fazem o leitor de tela
     ler a oferta na ordem certa. Sem preço no catálogo, sem bloco. */
  function preco(m, classe = '') {
    const p = precoDe(m);
    if (!p) return '';
    const aVista = window.YADEA_PAGAMENTO?.aVista;
    const rotulo = aVista ? `À vista no ${escapar(aVista)}` : 'À vista';
    const selo = p.campanha ? `<span class="preco__selo">${escapar(p.campanha)}</span>` : '';
    const de = p.de
      ? ` <s class="preco__de"><span class="u-visually-hidden">antes </span>${dinheiro(p.de)}</s>`
      : '';
    return `
        <p class="preco ${classe}">
          <span class="preco__topo">${selo}<span class="preco__rotulo">${rotulo}</span></span>
          <span class="preco__linha"><span class="preco__valor">${p.de ? '<span class="u-visually-hidden">por </span>' : ''}${dinheiro(p.valor)}</span>${de}</span>
          ${parcelas(p.parcelas)}
        </p>`;
  }

  /* Linha de cima do nome. No modal: "Aima · Scooter elétrica". No card só
     cabe uma informação sem quebrar linha (e desalinhar os nomes da fileira):
     a marca, ou o tipo quando a loja não informa a marca. */
  const eyebrow = (m) => [m.fabricante, m.descritivo].filter(Boolean).join(' · ');
  const eyebrowCurto = (m) => m.fabricante || m.descritivo || '';

  /* Palco do card: o tom vem do catálogo (styleguide, "Palco na cor do
     modelo"). Hex validado antes de entrar no atributo style. */
  const palcoDe = (m) => (HEX_VALIDO.test(m.palco || '') ? m.palco : '#ECEAE7');

  /* Card do styleguide (seção 07): palco com a foto e os selos legais →
     tags em laranja → nome → 3 números → Comprar + "+ Detalhes".
     Nos botões, o texto oculto fica DENTRO do rótulo: solto, virava um item
     a mais do flex e ganhava o gap, descentralizando o botão.
     Regra do projeto: nenhum comentário dentro do HTML gerado. */
  function card(m) {
    const bloco = numeros(m) || `
        <p class="card__pendente"><strong>Ficha técnica sob consulta</strong>
          Velocidade, potência e autonomia confirmadas pelo WhatsApp.</p>`;
    const tags = (m.tags || []).join(' · ');
    return `
        <li data-anima>
          <article class="card" data-id="${escapar(m.id)}">
            <div class="card__midia" style="--palco:${palcoDe(m)}">
              <button class="card__foto${m.recorte === false ? ' card__foto--chapada' : ''}" type="button" data-detalhes="${escapar(m.id)}"
                      aria-label="Ver detalhes da ${escapar(m.nome)}">
                <img src="${escapar(m.foto)}" alt="${escapar(m.alt)}" loading="lazy" decoding="async" width="736" height="616">
              </button>
              ${selos(m, 'card__selos')}
            </div>
            <div class="card__corpo">
              <div class="card__cabeca">
                ${tags ? `<p class="card__tags">${escapar(tags)}</p>` : ''}
                <h3 class="card__nome">${escapar(m.nome)}</h3>
              </div>
              ${bloco}
              ${preco(m, 'card__preco')}
              <div class="card__acoes">
                <a class="btn btn--primario btn--card" href="${linkWhats('modelo', { modelo: m.nome })}" target="_blank" rel="noopener">${ICONE_WHATS}<span>Comprar<span class="u-visually-hidden"> a ${escapar(m.nome)} pelo WhatsApp</span></span></a>
                <a class="btn btn--contorno btn--card" href="${urlModelo(m)}" data-detalhes="${escapar(m.id)}"><span>+ Detalhes<span class="u-visually-hidden"> da ${escapar(m.nome)}</span></span></a>
              </div>
            </div>
          </article>
        </li>`;
  }

  /* Acordeão (FAQ e guia local). A primeira pergunta já vem aberta.
     `prefixo` separa os ids das duas listas da página; a partir de
     `visiveis`, o item nasce oculto e abre em "Ver todas as dúvidas" — mas
     continua no HTML, para o Google e as IAs. */
  function faq(lista, prefixo = 'faq', visiveis = Infinity) {
    return (lista || []).map((f, i) => `
      <div class="faq__item${i === 0 ? ' is-aberto' : ''}"${i >= visiveis ? ' data-faq-extra hidden' : ''}>
        <h3 class="faq__pergunta">
          <button class="faq__botao" type="button" aria-expanded="${i === 0}" aria-controls="${prefixo}-r${i}" id="${prefixo}-q${i}">
            <span>${escapar(f.q)}</span>
            <span class="faq__sinal" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="faq__resposta" id="${prefixo}-r${i}" role="region" aria-labelledby="${prefixo}-q${i}">
          <div><p>${escapar(f.a)}</p></div>
        </div>
      </div>
    `).join('');
  }

  /* ── Detalhe do modelo (modal da home E página do modelo) ─────────────── */

  /* Caminho de imagem do próprio site, para entrar em `url()` dentro de um
     atributo style: qualquer outra coisa é descartada, não remendada. */
  const IMAGEM_LOCAL = /^assets\/img\/[a-z0-9/_-]+\.webp$/;

  const temFoto = (c) => Array.isArray(c?.galeria) && c.galeria.length > 0;

  /* Bolinha que não troca a foto parece quebrada (pedido do cliente,
     27/10/2026). Cor sem foto sai do seletor e vai por extenso para a
     ficha (ver ficha). O catálogo continua com todas: chegando a foto, a
     bolinha volta sozinha. */
  const paletaDe = (m) => (m.cores || []).filter(temFoto);

  /* A cor troca as fotos do VEÍCULO INTEIRO. As de detalhe ficam sempre. */
  function fotosDaCor(m, paleta, corAtiva) {
    const daCor = paleta[corAtiva]?.galeria;
    if (!daCor) return m.galeria || [];
    return [...daCor, ...(m.galeria || []).filter((f) => f.detalhe)];
  }

  /* Foto de estúdio: cabe inteira sobre a cor da própria borda, e a sobra do
     quadro some. Foto de ambiente: cabe inteira sobre uma cópia desfocada de
     si mesma, para não boiar numa faixa de cor chapada.
     URL ABSOLUTA (`base` = document.baseURI): `url()` dentro de variável CSS
     é resolvida a partir da folha que a usa (assets/css/), não da página.
     Relativa, dava 404. Sem `base` (build), a cópia desfocada fica para o
     navegador, que redesenha a galeria ao carregar. */
  function slide(f, k, total, base) {
    const fundo = HEX_VALIDO.test(f.fundo || '') ? f.fundo : '#F6F5F3';
    const ambiente = !f.estudio && IMAGEM_LOCAL.test(f.src);
    const estilo = ambiente && base
      ? `--fundo:${fundo};--foto:url('${new URL(f.src, base).href}')`
      : `--fundo:${fundo}`;
    return `
        <div class="modal__slide${ambiente ? ' is-ambiente' : ''}" role="group" aria-roledescription="slide"
             aria-label="${k + 1} de ${total}" style="${escapar(estilo)}">
          <img src="${escapar(f.src)}" alt="${escapar(f.alt)}" draggable="false" decoding="async"
               ${f.w ? `width="${Number(f.w)}" height="${Number(f.h)}"` : ''}${k > 0 ? ' loading="lazy"' : ''}>
        </div>`;
  }

  const slides = (fotos, base) => fotos.map((f, k) => slide(f, k, fotos.length, base)).join('');

  const miniaturas = (fotos, i) => fotos.map((f, k) => `
        <button class="modal__mini" type="button" data-foto="${k}" aria-current="${k === i}"
                aria-label="Ver foto ${k + 1} de ${fotos.length}">
          <img src="${escapar(f.mini || f.src)}" alt="" loading="lazy" decoding="async" width="180" height="127">
        </button>
      `).join('');

  /* "Preta, Laranja e Verde". */
  function nomesPorExtenso(nomes) {
    try {
      return new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(nomes);
    } catch (e) {
      return nomes.join(', ');
    }
  }

  function ficha(m, paleta) {
    const classe = m.classificacao ? window.YADEA_CLASSIFICACOES[m.classificacao] : null;
    const nomes = (m.cores || []).map((c) => c.nome);
    // Alguma cor ficou fora do seletor: a lista completa vai por extenso.
    const coresNoTexto = nomes.length > paleta.length ? nomesPorExtenso(nomes) : null;
    const specs = {
      ...(m.specs || {}),
      ...(classe ? { classificacao: classe.ficha } : {}),
      ...(coresNoTexto ? { cores: coresNoTexto } : {}),
    };
    /* Campo sem dado simplesmente não aparece: dez linhas de "não
       informado" comunicam ausência, não especificação. */
    return window.YADEA_FICHA_ORDEM
      .filter(([chave]) => specs[chave] != null)
      .map(([chave, rotulo]) => {
        const bruto = specs[chave];
        const valor = typeof bruto === 'object' ? `${milhar(bruto.valor)} ${bruto.unidade}` : bruto;
        // Número com condição carrega a condição NA MESMA LINHA.
        const nota = typeof bruto === 'object' && bruto.nota
          ? `<small class="ficha__nota">${escapar(bruto.nota)}</small>`
          : '';
        return `<div><dt>${rotulo}</dt><dd>${escapar(valor)}${nota}</dd></div>`;
      }).join('');
  }

  const equipamentos = (m) => (m.equipamentos || []).map((item) => `<li>${escapar(item)}</li>`).join('');

  /**
   * Fundo da bolinha, em ordem de precedência: bicolor → imagem → hex.
   * SEGURANÇA: o valor entra numa declaração CSS dentro de um atributo
   * style, então hex passa pela regex e imagem só se for caminho do próprio
   * site (IMAGEM_LOCAL). O resto é descartado e cai no hex.
   */
  const parDeHex = (v) => Array.isArray(v) && v.length === 2 && v.every((h) => HEX_VALIDO.test(h));

  function fundoDoSwatch(c) {
    if (parDeHex(c.bicolor)) return `background:linear-gradient(135deg, ${c.bicolor[0]} 50%, ${c.bicolor[1]} 50%)`;
    if (c.imagem && IMAGEM_LOCAL.test(c.imagem)) return `background:url('${c.imagem}') center/cover no-repeat`;
    return `background:${HEX_VALIDO.test(c.hex || '') ? c.hex : 'transparent'}`;
  }

  const swatches = (paleta, corAtiva) => paleta.map((c, i) => `
        <button class="modal__swatch" type="button" data-cor="${i}"
                aria-pressed="${i === corAtiva}" aria-label="Cor ${escapar(c.nome)}"
                title="${escapar(c.nome)}">
          <i style="${fundoDoSwatch(c)}" aria-hidden="true"></i>
        </button>
      `).join('');

  /* Página do modelo: o MESMO endereço do WordPress (/modelos-de-motos/<slug>/),
     para cada modelo herdar o histórico que já tem no Google. `slug` no
     catálogo só quando o do WP era outro (Liberty → liberty-a500). Relativo:
     vale na raiz do domínio e na prévia (subpasta), e as páginas de modelo
     usam <base href="../../">. */
  const urlModelo = (m) => `modelos-de-motos/${m.slug || m.id}/`;

  return {
    escapar, real, dinheiro, ICONE_WHATS, nomeCompleto, categoriasDe, linkWhats,
    ordenados, selos, numeros, fimDaCampanha, campanhaVigente, precoDe, parcelas, preco, eyebrow, eyebrowCurto, card, faq, palcoDe, milhar,
    HEX_VALIDO, IMAGEM_LOCAL, paletaDe, fotosDaCor, slides, miniaturas, ficha,
    equipamentos, swatches, urlModelo,
  };
})();
