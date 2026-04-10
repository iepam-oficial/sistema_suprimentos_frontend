/**
 * E2E: pedido customizado (Selenium + Chrome).
 *
 * Este ficheiro contém **duas suítes raiz** (`describe` de nível superior):
 * 1. **Um item** — envio com uma linha no modal.
 * 2. **Múltiplos itens** — duas linhas, um único `POST .../custom/many`.
 * Cada suíte abre o seu próprio browser (`beforeAll`/`afterAll` separados).
 *
 * Após o colaborador enviar o pedido, cada suíte faz logout, login como **gerente** e confirma que o(s)
 * item(ns) aparece(m) na área administrativa (`/supply-requests/admin`), via campo de busca.
 *
 * Pré-requisitos:
 * - Google Chrome instalado (o Selenium 4 tenta obter o ChromeDriver automaticamente).
 * - Frontend Next.js rodando (ex.: `npm run dev` na pasta frontend).
 * - Backend acessível pela URL configurada em env do Next (BFF `/api/*` → API real).
 * - Banco com `npm run prisma:seed` (ou seed dev) para existirem usuários e dados de apoio.
 * - URL do app (ex.: `http://localhost:3002`) em `E2E_BASE_URL` se não for a porta padrão 3002.
 *
 * Credenciais padrão (seed dev — ver `iepam_manager_backend/backend/src/seeds/devSeeds.ts`):
 * - Todos os usuários seed compartilham a mesma senha `DEV_SEED_PLAIN_PASSWORD`.
 * - `usuario@example.com` (EMPLOYEE) — usado por omissão para este fluxo.
 * Outros e-mails do mesmo seed (override via `E2E_EMAIL` / `E2E_PASSWORD`):
 * - `admin@example.com`, `gerente@example.com`, `tecnico@example.com`, `suporte@example.com`, `organizador@example.com`
 *
 * Variáveis de ambiente:
 * - `E2E_BASE_URL` — URL base (padrão: `http://localhost:3002`).
 * - `E2E_EMAIL` / `E2E_PASSWORD` — sobrescrevem o usuário padrão do seed (`usuario@example.com`).
 * - `E2E_MANAGER_EMAIL` — e-mail do gerente para o passo “visão admin” (padrão: `gerente@example.com`; mesma senha que `E2E_PASSWORD` / seed).
 * - `E2E_SKIP=1` — ignora a suíte (útil em CI sem stack ou Chrome).
 * - `E2E_HEADLESS=1` — opcional; roda Chrome em modo headless (útil em CI).
 *
 * Execução:
 *   npm run test:e2e
 *
 * Dentro de cada suíte, os `it` rodam em sequência no mesmo navegador dessa suíte.
 */

import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const baseUrl = (process.env.E2E_BASE_URL || 'http://localhost:3002').replace(/\/$/, '');

/** Mesmos valores criados em `devSeeds.ts` (usuário EMPLOYEE). */
const SEED_DEV_DEFAULT_EMAIL = 'usuario@example.com';
const SEED_DEV_DEFAULT_PASSWORD =
    'UUiIIIuUUUUyhdajfjdsjflkdjsçalfjdslçfajdskfaçdjsflakçdsfj';

const email = process.env.E2E_EMAIL || SEED_DEV_DEFAULT_EMAIL;
const password = process.env.E2E_PASSWORD || SEED_DEV_DEFAULT_PASSWORD;

const SEED_MANAGER_EMAIL = 'gerente@example.com';
const managerEmail = process.env.E2E_MANAGER_EMAIL || SEED_MANAGER_EMAIL;

/** Com credenciais padrão do seed, a suíte roda sempre; use `E2E_SKIP=1` para pular. */
const runE2E = process.env.E2E_SKIP !== '1';

/** Alinha-se a `useLogout` / `performLogout`: limpa sessão e abre a página de login. */
async function e2eLogout(driver: WebDriver) {
    await driver.executeAsyncScript(`
    const done = arguments[arguments.length - 1];
    fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .catch(() => {})
      .finally(() => {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('@ti-assistant:')) localStorage.removeItem(k);
          });
          ['filters','searchQuery','selectedUnit','selectedSector','selectedEnvironment','selectedBranch','selectedCategory'].forEach((k) => {
            try { localStorage.removeItem(k); } catch (e) {}
          });
        } catch (e) {}
        try {
          document.cookie.split(';').forEach((part) => {
            const name = part.split('=')[0]?.trim();
            if (name && name.startsWith('@ti-assistant:')) {
              document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
            }
          });
        } catch (e) {}
        done();
      });
  `);
    await driver.get(`${baseUrl}/`);
    await driver.wait(until.elementLocated(By.id('email')), 15000);
}

async function e2eLogin(driver: WebDriver, mail: string, pass: string) {
    await driver.findElement(By.id('email')).clear();
    await driver.findElement(By.id('email')).sendKeys(mail);
    await driver.findElement(By.id('password')).clear();
    await driver.findElement(By.id('password')).sendKeys(pass);
    await driver.findElement(By.css('button[type="submit"]')).click();
    // EMPLOYEE/TECHNICIAN → `/supply-requests`; ADMIN/MANAGER → `/dashboard` (ver `app/page.tsx`).
    await driver.wait(
        async () => {
            const u = await driver.getCurrentUrl();
            return u.includes('/supply-requests') || u.includes('/dashboard');
        },
        45000
    );
}

/**
 * Campo de busca da aba Suprimentos em `/supply-requests/admin` (várias abas usam o mesmo placeholder).
 * A página admin mostra só um `Spinner` até `Promise.all(fetch…)` terminar — não há inputs antes disso.
 * Input Chakra controlado: define `value` e dispara eventos.
 */
async function adminSearchSupplies(driver: WebDriver, query: string) {
    // Tabs podem ser `button` ou outro nó com `role="tab"` (Chakra).
    const supTab = await driver.wait(
        until.elementLocated(By.xpath("//*[@role='tab' and contains(., 'Suprimentos')]")),
        30000
    );
    await supTab.click();

    let searchInput: WebElement | undefined;
    await driver.wait(
        async () => {
            const inputs = await driver.findElements(By.css('input[placeholder="Digite para buscar..."]'));
            for (const el of inputs) {
                if (await el.isDisplayed()) {
                    searchInput = el;
                    return true;
                }
            }
            return false;
        },
        60000,
        'Campo de busca visível após carregar /supply-requests/admin (spinner inicial sem inputs).'
    );
    if (!searchInput) {
        throw new Error('Campo de busca da aba Suprimentos não visível em /supply-requests/admin');
    }
    await driver.executeScript(
        `
    const el = arguments[0];
    const v = arguments[1];
    const proto = window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) {
      desc.set.call(el, v);
    } else {
      el.value = v;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    `,
        searchInput,
        query
    );
}

async function waitForBodyContains(driver: WebDriver, substring: string, timeout = 60000) {
    await driver.wait(
        async () => {
            const text = (await driver.executeScript(
                `return document.body ? document.body.innerText : '';`
            )) as string;
            return text.includes(substring);
        },
        timeout,
        `Texto esperado na página do gerente: ${substring.slice(0, 80)}…`
    );
}

/**
 * Amanhã no calendário local `YYYY-MM-DD` (evita bug de `toISOString()` em UTC:
 * em fusos como America/Sao_Paulo o dia pode virar e gerar data inválida no backend).
 */
function tomorrowLocalISODate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * `<input type="date">` controlado pelo React: `sendKeys` pode gerar valor incorreto.
 * Usa o setter nativo de `value` e dispara `input` / `change`.
 */
async function setReactControlledDateInput(driver: WebDriver, inputEl: WebElement, isoDate: string) {
    await driver.executeScript(
        `
    const el = arguments[0];
    const v = arguments[1];
    const proto = window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) {
      desc.set.call(el, v);
    } else {
      el.value = v;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    `,
        inputEl,
        isoDate
    );
}

/** `<select>` nativo (Chakra): dispara change para o React registrar o valor. */
async function selectNativeOptionByIndex(driver: WebDriver, selectEl: WebElement, index: number) {
    await driver.executeScript(
        `
    const el = arguments[0];
    const i = arguments[1];
    el.selectedIndex = i;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    `,
        selectEl,
        index
    );
}

(runE2E ? describe : describe.skip)('E2E: requisição customizada (Selenium)', () => {
    let driver: WebDriver;
    /** Referência ao conteúdo do modal (para `stalenessOf` após enviar). */
    let modalRoot: WebElement;
    /** Nome enviado no modal — reutilizado na verificação na área do gerente. */
    let submittedCustomItemName: string;
    /** Marcador numérico (mesmo padrão da suíte multi-item) para a busca no admin. */
    let singleItemMarker: number;

    beforeAll(async () => {
        const options = new chrome.Options();
        if (process.env.E2E_HEADLESS === '1') {
            options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
        }
        options.addArguments('--window-size=1400,900');
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    });

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    describe('1. Autenticação', () => {
        it('deve carregar a home e exibir o formulário de login (e-mail, senha, Entrar)', async () => {
            await driver.get(`${baseUrl}/`);

            await driver.wait(until.elementLocated(By.id('email')), 15000);
            await driver.wait(until.elementLocated(By.id('password')), 15000);

            const emailInput = await driver.findElement(By.id('email'));
            const passwordInput = await driver.findElement(By.id('password'));
            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

            expect(await emailInput.isDisplayed()).toBe(true);
            expect(await passwordInput.isDisplayed()).toBe(true);
            expect(await submitBtn.isDisplayed()).toBe(true);
            expect(await submitBtn.getText()).toMatch(/Entrar/i);
        });

        it('deve enviar credenciais do seed e redirecionar para /supply-requests (localStorage preenchido)', async () => {
            await driver.findElement(By.id('email')).clear();
            await driver.findElement(By.id('email')).sendKeys(email);
            await driver.findElement(By.id('password')).clear();
            await driver.findElement(By.id('password')).sendKeys(password);
            await driver.findElement(By.css('button[type="submit"]')).click();

            await driver.wait(until.urlContains('/supply-requests'), 45000);

            const url = await driver.getCurrentUrl();
            expect(url).toContain('/supply-requests');
        });
    });

    describe('2. Página Requisições — aba Catálogo', () => {
        it('deve selecionar a aba "Catálogo" para exibir o fluxo de catálogo e o botão de pedido customizado', async () => {
            const catalogTab = await driver.wait(
                until.elementLocated(By.xpath("//button[@role='tab' and contains(., 'Catálogo')]")),
                15000
            );
            await driver.wait(until.elementIsVisible(catalogTab), 10000);
            await catalogTab.click();

            const openBtn = await driver.wait(
                until.elementLocated(By.css('[data-testid="custom-request-open-button"]')),
                30000
            );
            await driver.wait(until.elementIsVisible(openBtn), 10000);
            expect(await openBtn.isDisplayed()).toBe(true);
        });

        it('deve abrir o modal ao clicar em "Pedido customizado" (data-testid custom-request-open-button)', async () => {
            const openBtn = await driver.findElement(By.css('[data-testid="custom-request-open-button"]'));
            await openBtn.click();

            modalRoot = await driver.wait(
                until.elementLocated(By.css('[data-testid="custom-request-modal"]')),
                15000
            );
            await driver.wait(until.elementIsVisible(modalRoot), 15000);

            expect(await modalRoot.isDisplayed()).toBe(true);
        });
    });

    describe('3. Modal — carregamento e dados assíncronos', () => {
        it('deve exibir o campo de data limite de entrega visível e interativo', async () => {
            await driver.wait(
                until.elementLocated(By.css('[data-testid="custom-request-delivery-deadline"]')),
                20000
            );
            const deadlineEl = await driver.findElement(
                By.css('[data-testid="custom-request-delivery-deadline"]')
            );
            await driver.wait(until.elementIsVisible(deadlineEl), 10000);

            expect(await deadlineEl.isDisplayed()).toBe(true);
            expect(await deadlineEl.getAttribute('type')).toBe('date');
        });

        it('deve popular o select de destino com pelo menos um local (API /api/locales/user-location)', async () => {
            await driver.wait(
                async () => {
                    const found = await driver.findElements(By.css('[data-testid="custom-request-destination"]'));
                    if (found.length === 0) return false;
                    const opts = await found[0].findElements(By.css('option'));
                    return opts.length >= 2;
                },
                45000,
                'Aguardar opções de destino (locais do usuário / seed).'
            );

            const destEl = await driver.findElement(By.css('[data-testid="custom-request-destination"]'));
            const options = await destEl.findElements(By.css('option'));
            expect(options.length).toBeGreaterThanOrEqual(2);
        });

        it('deve popular o select de unidade do item (API /api/unit-of-measures)', async () => {
            await driver.wait(
                async () => {
                    const opts = await driver.findElements(
                        By.css('[data-testid="custom-request-item-unit-0"] option')
                    );
                    return opts.length >= 2;
                },
                20000,
                'Aguardar unidades de medida no modal.'
            );

            const unitEl = await driver.findElement(By.css('[data-testid="custom-request-item-unit-0"]'));
            const unitOptions = await unitEl.findElements(By.css('option'));
            expect(unitOptions.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('4. Modal — preenchimento e envio', () => {
        it('deve preencher data limite, destino, nome do item e unidade da primeira linha', async () => {
            const deadlineInput = await driver.findElement(
                By.css('[data-testid="custom-request-delivery-deadline"]')
            );
            await setReactControlledDateInput(driver, deadlineInput, tomorrowLocalISODate());

            const destEl = await driver.findElement(By.css('[data-testid="custom-request-destination"]'));
            await selectNativeOptionByIndex(driver, destEl, 1);

            const unitEl = await driver.findElement(By.css('[data-testid="custom-request-item-unit-0"]'));
            await selectNativeOptionByIndex(driver, unitEl, 1);

            const nameInput = await driver.findElement(By.css('[data-testid="custom-request-item-name-0"]'));
            await nameInput.clear();
            singleItemMarker = Date.now();
            submittedCustomItemName = `E2E item ${singleItemMarker}`;
            await nameInput.sendKeys(submittedCustomItemName);

            expect(await deadlineInput.getAttribute('value')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(await nameInput.getAttribute('value')).toMatch(/E2E item/);
        });

        it('deve submeter o formulário e fechar o modal após sucesso', async () => {
            const submitBtn = await driver.findElement(By.css('[data-testid="custom-request-submit"]'));
            await driver.wait(until.elementIsEnabled(submitBtn), 5000);
            expect(await submitBtn.isEnabled()).toBe(true);

            await submitBtn.click();

            // Chakra costuma esconder o modal (display/aria-hidden) sem remover o nó do DOM;
            // `stalenessOf` só ocorre se o elemento for desmontado — por isso usamos visibilidade ou stale.
            await driver.wait(
                async () => {
                    try {
                        return !(await modalRoot.isDisplayed());
                    } catch {
                        return true;
                    }
                },
                60000,
                'Modal deveria fechar após envio (verifique API /custom-supply-requests/many e credenciais).'
            );
        });
    });

    describe('5. Visão do gerente (/supply-requests/admin)', () => {
        it('deve mostrar o pedido na lista após login do gerente e busca', async () => {
            await e2eLogout(driver);
            await e2eLogin(driver, managerEmail, password);

            await driver.get(`${baseUrl}/supply-requests/admin`);
            await driver.wait(until.urlContains('/supply-requests/admin'), 15000);
            expect(await driver.getCurrentUrl()).not.toContain('unauthorized');

            // Mesmo token pesquisável que na suíte de múltiplos itens (substring única no `item_name`).
            await adminSearchSupplies(driver, String(singleItemMarker));
            await waitForBodyContains(driver, submittedCustomItemName, 60000);
        });
    });
});

(runE2E ? describe : describe.skip)('E2E: pedido customizado com múltiplos itens (Selenium)', () => {
    let driver: WebDriver;
    let modalRoot: WebElement;
    /** Marcador comum às duas linhas (um registo por item no backend). */
    let batchId: number;

    beforeAll(async () => {
        const options = new chrome.Options();
        if (process.env.E2E_HEADLESS === '1') {
            options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
        }
        options.addArguments('--window-size=1400,900');
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    });

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    describe('1. Autenticação', () => {
        it('deve carregar a home e exibir o formulário de login', async () => {
            await driver.get(`${baseUrl}/`);
            await driver.wait(until.elementLocated(By.id('email')), 15000);
            await driver.wait(until.elementLocated(By.id('password')), 15000);
            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
            expect(await submitBtn.getText()).toMatch(/Entrar/i);
        });

        it('deve autenticar e ir para /supply-requests', async () => {
            await driver.findElement(By.id('email')).clear();
            await driver.findElement(By.id('email')).sendKeys(email);
            await driver.findElement(By.id('password')).clear();
            await driver.findElement(By.id('password')).sendKeys(password);
            await driver.findElement(By.css('button[type="submit"]')).click();
            await driver.wait(until.urlContains('/supply-requests'), 45000);
            expect(await driver.getCurrentUrl()).toContain('/supply-requests');
        });
    });

    describe('2. Catálogo e abertura do modal', () => {
        it('deve ativar a aba Catálogo e abrir o modal', async () => {
            const catalogTab = await driver.wait(
                until.elementLocated(By.xpath("//button[@role='tab' and contains(., 'Catálogo')]")),
                15000
            );
            await catalogTab.click();

            const openBtn = await driver.wait(
                until.elementLocated(By.css('[data-testid="custom-request-open-button"]')),
                30000
            );
            await openBtn.click();

            modalRoot = await driver.wait(
                until.elementLocated(By.css('[data-testid="custom-request-modal"]')),
                15000
            );
            await driver.wait(until.elementIsVisible(modalRoot), 15000);
        });
    });

    describe('3. Modal — carregamento inicial', () => {
        it('deve ter data limite, destino e unidades na primeira linha', async () => {
            await driver.wait(
                until.elementLocated(By.css('[data-testid="custom-request-delivery-deadline"]')),
                20000
            );
            await driver.wait(
                async () => {
                    const found = await driver.findElements(By.css('[data-testid="custom-request-destination"]'));
                    if (found.length === 0) return false;
                    const opts = await found[0].findElements(By.css('option'));
                    return opts.length >= 2;
                },
                45000,
                'Destino (locais).'
            );
            await driver.wait(
                async () => {
                    const opts = await driver.findElements(
                        By.css('[data-testid="custom-request-item-unit-0"] option')
                    );
                    return opts.length >= 2;
                },
                20000,
                'Unidades linha 0.'
            );
        });
    });

    describe('4. Modal — segunda linha (Adicionar item)', () => {
        it('deve exibir a segunda linha só após completar o item atual; o anterior colapsa', async () => {
            batchId = Date.now();
            const deadlineInput = await driver.findElement(
                By.css('[data-testid="custom-request-delivery-deadline"]')
            );
            await setReactControlledDateInput(driver, deadlineInput, tomorrowLocalISODate());

            const destEl = await driver.findElement(By.css('[data-testid="custom-request-destination"]'));
            await selectNativeOptionByIndex(driver, destEl, 1);

            const unit0 = await driver.findElement(By.css('[data-testid="custom-request-item-unit-0"]'));
            await selectNativeOptionByIndex(driver, unit0, 1);
            const name0 = await driver.findElement(By.css('[data-testid="custom-request-item-name-0"]'));
            await name0.clear();
            await name0.sendKeys(`E2E lote A ${batchId}`);

            const addBtn = await driver.findElement(By.css('[data-testid="custom-request-add-line"]'));
            await driver.wait(until.elementIsEnabled(addBtn), 15000);
            expect(await addBtn.isEnabled()).toBe(true);
            await addBtn.click();

            await driver.wait(
                until.elementLocated(By.css('[data-testid="custom-request-item-name-1"]')),
                15000
            );
            const name1 = await driver.findElement(By.css('[data-testid="custom-request-item-name-1"]'));
            expect(await name1.isDisplayed()).toBe(true);

            const summary0 = await driver.findElement(
                By.css('[data-testid="custom-request-item-summary-0"]')
            );
            expect(await summary0.getText()).toContain(`E2E lote A ${batchId}`);
        });

        it('deve carregar opções de unidade na segunda linha', async () => {
            await driver.wait(
                async () => {
                    const opts = await driver.findElements(
                        By.css('[data-testid="custom-request-item-unit-1"] option')
                    );
                    return opts.length >= 2;
                },
                20000,
                'Unidades linha 1.'
            );
        });
    });

    describe('5. Modal — preenchimento de duas linhas e envio', () => {
        it('deve preencher o segundo item (o primeiro já está na lista colapsada)', async () => {
            const unit1 = await driver.findElement(By.css('[data-testid="custom-request-item-unit-1"]'));
            await selectNativeOptionByIndex(driver, unit1, 1);
            const name1 = await driver.findElement(By.css('[data-testid="custom-request-item-name-1"]'));
            await name1.clear();
            await name1.sendKeys(`E2E lote B ${batchId}`);

            expect(await name1.getAttribute('value')).toContain('E2E lote B');
        });

        it('deve enviar o lote e fechar o modal', async () => {
            const submitBtn = await driver.findElement(By.css('[data-testid="custom-request-submit"]'));
            await driver.wait(until.elementIsEnabled(submitBtn), 5000);
            await submitBtn.click();

            await driver.wait(
                async () => {
                    try {
                        return !(await modalRoot.isDisplayed());
                    } catch {
                        return true;
                    }
                },
                60000,
                'Modal deveria fechar após envio em lote (POST /custom-supply-requests/many).'
            );
        });
    });

    describe('6. Visão do gerente (/supply-requests/admin)', () => {
        it('deve mostrar ambos os itens na lista após login do gerente e busca pelo marcador', async () => {
            await e2eLogout(driver);
            await e2eLogin(driver, managerEmail, password);

            await driver.get(`${baseUrl}/supply-requests/admin`);
            await driver.wait(until.urlContains('/supply-requests/admin'), 15000);
            expect(await driver.getCurrentUrl()).not.toContain('unauthorized');

            const token = String(batchId);
            await adminSearchSupplies(driver, token);

            const labelA = `E2E lote A ${batchId}`;
            const labelB = `E2E lote B ${batchId}`;
            await waitForBodyContains(driver, labelA, 60000);
            await waitForBodyContains(driver, labelB, 60000);
        });
    });
});
