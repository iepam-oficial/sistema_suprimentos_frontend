# Frontend UI Style Guide

**Status:** Target canônico (obrigatório)  
**Audience:** Agentes e desenvolvedores ao **criar ou editar UI**  
**Surfaces:** app autenticado web, portal de fornecedor, mobile (web responsivo e app nativo quando no workspace)

---

## 1. Autoridade

- Este documento é o **target canônico**. Ao criar ou editar UI, **siga-o**.
- Desvio só com **decisão explícita** no chat, spec ou ADR — não por conveniência ou “como a página vizinha está hoje”.
- Este guia é a **fonte do target** para a feature futura de alinhar estilos das páginas. Esta feature **não** migra páginas legadas; código novo/editado deve seguir o target mesmo se o resto da tela ainda estiver desalinhado.
- Se uma mudança alterar shell, tokens ou padrão de família canônico, **atualize este arquivo na mesma mudança**. Se o path deste guia mudar, atualize a Cursor rule que o aponta na mesma mudança.

---

## 2. Stack

| Camada | Tecnologia | Onde |
| ------ | ---------- | ---- |
| UI principal | Chakra UI + `useColorMode` / `useColorModeValue` | Maioria das rotas `(dashboard)`, portal, procurement |
| Support desk | Tailwind (`slate-*`) + componentes em `components/support-desk` | Chamados / support tickets |
| Charts | Recharts | Dashboards e reports |
| Ícones | lucide-react (preferência) | Novas UIs |
| Fundo global | Body com ilustração fixa + `gray.50` / `gray.800` | `src/app/providers.tsx` — justifica painéis glass |

Não introduza um terceiro design system. Não misture Chakra-glass e Tailwind-slate **na mesma tela**.

---

## 3. Page shell

Escolha o shell pela **família** da tela (seção 7+), não por hábito.

| Shell | Quando | Referência |
| ----- | ------ | ---------- |
| `ViewportPageShell` | Viewport full-height, coluna flex, overflow controlado (portal; listagens densas no target) | `src/components/layout/ViewportPageShell.tsx` |
| `GlassPanel` (+ `GlassScrollArea`) | Painel glass dentro do viewport | `src/components/layout/GlassPanel.tsx` |
| `SupportDeskPageShell` | Fluxos de support desk | `src/components/support-desk/SupportDeskPageShell.tsx` |
| `VStack` + bg sólido | Dashboards operacionais/financeiros | `app/(dashboard)/dashboard/page.tsx` |
| Settings glass folgado | Área de configurações | `app/(dashboard)/settings/layout.tsx` |

**Target operacional:** preferir o kit `src/components/layout/` (`useGlassTokens`, `GlassPanel`, `ViewportPageShell`) em vez de copiar `rgba`/`backdropFilter` inline.

---

## 4. Componentes de página

### Cards / KPI

- **Dashboard sólido:** borda `1px`, `borderRadius="md"`, bg opaco `white` / `gray.800`, padding compacto (`px={3}` `py={2.5}`). Label uppercase `xs` semibold; valor `xl`/`2xl` bold; accent `blue.700` / `blue.300`.
- **Refs:** `features/manager-ops/components/ManagerOpsKpiCards.tsx`, `features/executive-finance/components/ExecutiveKpiCards.tsx`.
- **Glass:** painéis via `GlassPanel` / tokens — não cards opacos “sólidos” dentro de listagem glass sem motivo.

### Tabelas

- Listagens densas: header sticky quando couber; preferir `StickyDataTable` no portal/glass.
- Evitar tabelas com padding de marketing; densidade operacional.

### Drawers / filtros

- Drawers laterais para filtros e ações rápidas (padrão inventory / admin), não modais gigantes para o fluxo frequente.

### Empty states / alerts

- Chakra `Alert` com `borderRadius="md"` em dashboards; mensagens curtas.
- Empty: texto secundário (`gray.500` / `gray.400`) + ação clara quando existir.

### Action bars

- Portal: `PortalActionBar` no kit layout.
- Support: ações no `headerRight` do `SupportDeskPageShell`.

---

## 5. Tipografia

| Uso | Target |
| --- | ------ |
| Título de página (dashboard / listagens densas) | Chakra `Heading` `size="md"`, `fontWeight="bold"`, `letterSpacing="tight"` |
| Subtítulo | `Text` `fontSize="sm"`, cor secundária |
| Título support desk | `h1` Tailwind `text-xl`/`md:text-2xl` `font-semibold` slate |
| Label de KPI | `xs`, uppercase, `letterSpacing="wide"`, semibold |
| Corpo | Não competir com o título; um job por seção |

Não inventar tipografia “marketing” (hero, display serif) em telas autenticadas de operação.

---

## 6. Cores / tokens

### Glass (`useGlassTokens`) — source of truth

Arquivo: `src/components/layout/useGlassTokens.ts`

| Token | Light | Dark |
| ----- | ----- | ---- |
| `panelBg` / `inputBg` | `rgba(255, 255, 255, 0.5)` | `rgba(45, 55, 72, 0.5)` |
| `borderColor` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.1)` |
| `borderColorHover` | `rgba(0, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.2)` |
| `theadBg` | `rgba(255, 255, 255, 0.95)` | `rgba(45, 55, 72, 0.95)` |
| `mutedColor` | `gray.600` | `gray.300` |
| `headingColor` | `gray.800` | `white` |

Blur canônico do painel: `backdropFilter="blur(12px)"` (via `GlassPanel`, não espalhar literals).

### Dashboard sólido

| Token | Light | Dark |
| ----- | ----- | ---- |
| Page bg | `gray.50` | `gray.900` |
| Card bg | `white` | `gray.800` |
| Card border | `gray.200` | `gray.700` |
| Texto | `gray.800` / `gray.900` | `white` |
| Secundário | `gray.500` | `gray.400` |
| Accent KPI | `blue.700` | `blue.300` |

**Sem** `backdropFilter` nesta família.

### Support desk (Tailwind)

| Uso | Classes |
| --- | ------- |
| Page | `bg-slate-50` / `dark:bg-slate-900` |
| Header | `bg-white` / `dark:bg-slate-800`, `border-slate-200` / `dark:border-slate-700`, `shadow-sm` |
| Título | `text-slate-800` / `dark:text-slate-100` |
| Cards / forms | Preferir helpers em `components/support-desk` (ex. `formClasses`) |

---

## 7. Família: operacional glass

**Quando usar:** listagens e fluxos operacionais densos (suprimentos, inventário, admin de solicitações, procurement shells alinhados).

**Target:**

- `ViewportPageShell` + `GlassPanel` / `GlassScrollArea` + `useGlassTokens`
- Densidade alta: `p={2}`, `spacing={2}`, `borderRadius="md"`
- Fundo transparente no shell para o body ilustrado aparecer

**Referências:**

- Kit: `src/components/layout/*`
- Densidade as-is (migrar mentalmente para o kit): `app/(dashboard)/supplies/page.tsx`, `inventory/page.tsx`, `supply-requests/admin/components/AdminTabShell.tsx`
- Procurement: `features/procurement/components/purchase-request/PurchaseRequestPageShell.tsx`

---

## 8. Família: dashboard sólido

**Quando usar:** `/dashboard` (manager-ops) e `/dashboard/financeiro` (executive finance) — visão KPI + gráficos + painéis, não listagem CRUD full-height.

**Target:**

- Página `VStack` com bg `gray.50` / `gray.900`, padding compacto
- Cards opacos com borda; **sem glass/blur**
- Gráficos Recharts; tipografia de KPI da seção 4–5

**Referências:**

- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/dashboard/financeiro/page.tsx`
- `features/manager-ops/components/*`
- `features/executive-finance/components/*`

---

## 9. Família: support desk

**Quando usar:** filas e fluxos de chamados / support tickets.

**Target:**

- Sempre `SupportDeskPageShell`
- Tailwind slate; não Chakra glass nesta superfície
- Header sticky com título + `headerRight` para ações

**Referências:**

- `src/components/support-desk/SupportDeskPageShell.tsx`
- `app/(dashboard)/support-tickets/*` (views que consomem o shell)

---

## 10. Família: settings

**Quando usar:** rotas sob `app/(dashboard)/settings/**`.

**Target:**

- Glass **mais folgado** que o operacional: `p={6}`, `borderRadius="lg"`, `spacing={4}`
- Mesmos tokens rgba/blur do glass, mas ritmo visual de formulário/config, não tabela densa
- Evitar reaplicar blur/rgba nos filhos se o layout já envolve glass

**Referências:**

- `app/(dashboard)/settings/layout.tsx`
- Views responsivas: `settings/components/MobileSettings.tsx` (alinhar tokens ao layout, sem duplicar mundos)

---

## 11. Portal de fornecedor

**Quando usar:** `app/portal/**` (pedido/cotação por token).

**Target:**

- Família glass com kit layout: `ViewportPageShell` → `GlassPanel` → `GlassScrollArea` / `StickyDataTable` / `PortalActionBar`
- Não usar `SupportDeskPageShell` nem dashboard sólido

**Referências:**

- `app/portal/layout.tsx`
- `app/portal/pedido/[token]/page.tsx`
- `app/portal/cotacao/[token]/page.tsx`

---

## 12. Mobile

**Superfícies cobertas:**

1. **Web responsivo** — breakpoints Chakra / Tailwind nas páginas existentes (`MobileSupplies`, `MobileSettings`, `MobileNewQuote`, etc.). Seguir a **mesma família** da feature (glass, settings, support), só adaptando layout — não criar família “mobile web” separada.
2. **App nativo (Expo/RN)** — quando o repositório mobile estiver no workspace, aplicar os mesmos princípios de família e hierarquia; não inventar um terceiro design system. Se o app não estiver neste checkout, documente tokens RN na mudança que os introduzir e atualize esta seção.

---

## 13. Não faça

- **`Container maxW="container.xl"` + padding solto** como shell de página autenticada (foge do viewport / famílias).
- **`backdropFilter` / `rgba(...)` inline** fora de `useGlassTokens` / `GlassPanel` (duplicação e drift).
- **Misturar** Chakra-glass e Tailwind-slate na mesma tela.
- **Dashboard com glass/blur** ou support desk com `GlassPanel`.
- **Glass aninhado redundante** (layout já glass + filho com o mesmo blur de novo sem necessidade).
- **Copiar estilo legado vizinho** quando conflitar com este target — preferir o guia; migração em massa é feature separada.
- **Always-apply / embutir este guia inteiro** na Cursor rule — a rule só aponta; este arquivo é a fonte.

---

## Manutenção rápida

| Mudança | Ação |
| ------- | ---- |
| Novo padrão de shell/token/família | Atualizar seções 3–12 aqui |
| Path deste arquivo | Atualizar `.cursor/rules/frontend-ui-guide.mdc` |
| Só bugfix / copy | Não precisa tocar o guia |
