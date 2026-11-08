/* ==========================================================================
   YADEA SOROCABA · configuração da unidade
   --------------------------------------------------------------------------
   ÚNICO lugar onde moram os dados desta loja. O HTML, o app.js e o build
   (tools/gerar-seo.js) leem daqui. Para criar outra unidade (Itapetininga),
   este é o primeiro arquivo a trocar — ver README, "Nova unidade".

   Fonte: yadeasorocaba.com.br (WordPress atual), coletado em 07/11/2026.
   O site foi copiado do de Campinas (workspace yadea-campinas), com a mesma
   campanha (Black November até 30/11).
   ========================================================================== */

window.YADEA_CONFIG = {
  /* Identidade desta unidade. `id` entra no nome do repositório e no carimbo
     dos arquivos gerados; `cidade` aparece em títulos, textos e no JSON-LD. */
  unidade: {
    id: 'sorocaba',
    cidade: 'Sorocaba',
    uf: 'SP',
    regiao: 'Sorocaba e região',
  },

  /* Endereço público do site. Canonical, og:image, sitemap e JSON-LD saem
     daqui. A prévia (GitHub Pages) troca o host, mas mantém o canonical. */
  site: {
    url: 'https://yadeasorocaba.com.br/',
    dominio: 'yadeasorocaba.com.br',
    // Página institucional (o WordPress de Sorocaba não tem; gerada pelo build).
    paginaConcessionaria: 'concessionaria-yadea-sorocaba/',
  },

  marca: {
    nome: 'YADEA Sorocaba',
    nomeLoja: 'YADEA Sorocaba',
    // Como aparece no rodapé do site atual.
    razaoSocial: 'Lopes Comercio de Motos Elétricas Sorocaba LTDA',
    cnpj: '65.440.467/0001-06',
    /* Logos da assinatura local (styleguide: "nunca redesenhar nem recriar
       em texto"). SVGs do próprio site atual (wp-content/uploads/2026/03:
       Group-353 = negativo, Group-354 = positivo). */
    logoNegativo: 'assets/img/brand/logo-sorocaba-negativo.svg',
    logoPositivo: 'assets/img/brand/logo-sorocaba-positivo.svg',
  },

  /* Vendas e assistência usam o mesmo número no site atual (o link de
     assistência de lá está quebrado, mas aponta para o mesmo número).
     `numero` é só para exibição; `e164` é o que entra no link do WhatsApp
     (api.whatsapp.com/send: ver render.js). */
  whatsapp: {
    numero: '(15) 99773-4474',
    e164: '5515997734474',
  },
  assistencia: {
    numero: '(15) 99773-4474',
    e164: '5515997734474',
  },
  telefone: '+55 15 99773-4474',

  endereco: {
    logradouro: 'R. Avelino Argento, 139',
    complemento: '',
    bairro: 'Jardim Paulistano',
    cidade: 'Sorocaba',
    uf: 'SP',
    cep: '18040-670',
    get completo() {
      return `${this.logradouro} · ${this.bairro}, ${this.cidade} - ${this.uf} · ${this.cep}`;
    },
    // Usado no link "traçar rota" e no mapa.
    get busca() {
      return `YADEA Sorocaba, ${this.logradouro}, ${this.bairro}, ${this.cidade} - ${this.uf}, ${this.cep}`;
    },
  },

  /* Horários do site atual (um só, no bloco da Central de Vendas). Enquanto
     `confirmado` for false, o rodapé mostra "consulte pelo WhatsApp" em vez
     de um horário que pode estar errado. `assistencia` vazio = mostra o de
     vendas (a confirmar com a loja: README, pendências). `json` alimenta o
     openingHoursSpecification do JSON-LD. */
  horarios: {
    confirmado: true,
    vendas: 'Dias úteis: 9h às 18h · Sáb. e feriados: 9h às 13h',
    assistencia: '',
    json: [
      { dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], abre: '09:00', fecha: '18:00' },
      { dias: ['Saturday'], abre: '09:00', fecha: '13:00' },
    ],
  },

  /* O site atual não tem link de rede social. Preenchido, o ícone aparece no
     header, no menu e no rodapé; vazio, some (nada de link para "#"). */
  redes: {
    instagram: '',
    instagramUsuario: '',
  },

  /* ── Comunicado de segurança ──────────────────────────────────────────
     Aviso discreto de "único site oficial" + lista de domínios não
     reconhecidos. Nenhum domínio falso relatado: fica DESLIGADO. Para ligar,
     ver README, "Comunicado de segurança". */
  alertaSeguranca: {
    ativo: false,
    versao: '2026-11-07',
    siteOficial: 'yadeasorocaba.com.br',
    dominiosNaoReconhecidos: [],
    atrasoMs: 2500,
    reexibirAposDias: 7,
  },

  /* Mensagens pré-preenchidas. Regra do styleguide: toda mensagem começa com
     "Olá! Vim pelo site…" — é como a equipe reconhece o lead que veio do
     site. `prefixoMensagem` garante isso até para mensagem nova escrita sem
     ele (render.js). `{modelo}`, `{cor}` e `{categoria}` são trocados no clique. */
  prefixoMensagem: 'Olá! Vim pelo site',
  mensagens: {
    geral: 'Olá! Vim pelo site e gostaria de saber mais sobre os modelos e condições especiais da YADEA Sorocaba.',
    modelo: 'Olá! Vim pelo site e gostaria de saber mais sobre o modelo {modelo}.',
    modeloCor: 'Olá! Vim pelo site e gostaria de saber mais sobre o modelo {modelo} na cor {cor}.',
    testRideGeral: 'Olá! Vim pelo site e gostaria de agendar um test ride na YADEA Sorocaba.',
    testRideModelo: 'Olá! Vim pelo site e gostaria de agendar um test ride do modelo {modelo}.',
    testRideModeloCor: 'Olá! Vim pelo site e gostaria de agendar um test ride do modelo {modelo} na cor {cor}.',
    assistencia: 'Olá! Vim pelo site e gostaria de falar com a assistência técnica da YADEA Sorocaba.',
    categoria: 'Olá! Vim pelo site e gostaria de ver as opções de {categoria} da YADEA Sorocaba.',
    orientacao: 'Olá! Vim pelo site e gostaria de uma orientação para escolher o modelo ideal para o meu trajeto.',
    confirmarOficial: 'Olá! Vim pelo site e quero confirmar se estou falando com o atendimento oficial da YADEA Sorocaba.',
    // Botão do hero da campanha (Black November, até a data do catalogo.js).
    black: 'Olá! Vim pelo site e quero aproveitar a Black November YADEA (Owin / DT3).',
  },
};
