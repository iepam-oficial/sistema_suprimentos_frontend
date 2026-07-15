import { By, until, type WebDriver } from 'selenium-webdriver';

/**
 * Botão de ação "Revisão OK" exibido por convite na tabela do gerente
 * (detalhe da cotação). O badge de status usa o mesmo rótulo, mas é um
 * `<span>`; por isso restringimos ao elemento `<button>`.
 */
const REVIEW_OK_BUTTON_XPATH =
  "//button[contains(normalize-space(.), 'Revisão OK')]";

async function countReviewOkButtons(driver: WebDriver): Promise<number> {
  const buttons = await driver.findElements(By.xpath(REVIEW_OK_BUTTON_XPATH));
  return buttons.length;
}

/**
 * Marca "Revisão OK" em todas as propostas pendentes de revisão na página de
 * detalhe da cotação (deve estar aberta como MANAGER). Clica em um botão por
 * vez e aguarda o recarregamento da tabela (o total de botões diminui) antes
 * de prosseguir, evitando referências obsoletas após o `loadQuote`.
 *
 * @param expectedCount Número esperado de propostas a revisar (também usado
 * como teto de segurança para o laço).
 */
export async function markAllProposalsReviewOk(
  driver: WebDriver,
  expectedCount: number,
): Promise<void> {
  for (let i = 0; i < expectedCount; i += 1) {
    const before = await countReviewOkButtons(driver);
    if (before === 0) {
      break;
    }

    const button = await driver.wait(
      until.elementLocated(By.xpath(REVIEW_OK_BUTTON_XPATH)),
      15000,
    );
    await driver.wait(until.elementIsVisible(button), 10000);
    await button.click();

    await driver.wait(
      async () => (await countReviewOkButtons(driver)) < before,
      15000,
    );
  }
}

/**
 * Botão de ação "Solicitar correção" exibido por convite na tabela do gerente.
 * O mesmo rótulo aparece no cabeçalho e no rodapé do `ProposalCorrectionModal`;
 * por isso, ao submeter, escopamos a busca ao conteúdo do modal.
 */
const REQUEST_CORRECTION_BUTTON_XPATH =
  "//button[contains(normalize-space(.), 'Solicitar correção')]";

/** Conteúdo do modal Chakra (`<section class="chakra-modal__content">`). */
const MODAL_CONTENT_XPATH = "//section[contains(@class, 'chakra-modal__content')]";

/**
 * Solicita correção da primeira proposta pendente de revisão na página de
 * detalhe da cotação (aberta como MANAGER). Abre o `ProposalCorrectionModal`,
 * preenche a mensagem obrigatória, opcionalmente marca a primeira linha do
 * checklist e confirma. Retorna quando o modal fecha (correção persistida e
 * token rotacionado no backend).
 */
export async function requestProposalCorrection(
  driver: WebDriver,
  message: string,
  options?: { flagFirstItem?: boolean },
): Promise<void> {
  const openButton = await driver.wait(
    until.elementLocated(By.xpath(REQUEST_CORRECTION_BUTTON_XPATH)),
    15000,
  );
  await driver.wait(until.elementIsVisible(openButton), 10000);
  await openButton.click();

  const textarea = await driver.wait(
    until.elementLocated(By.xpath(`${MODAL_CONTENT_XPATH}//textarea`)),
    15000,
  );
  await driver.wait(until.elementIsVisible(textarea), 10000);
  await textarea.clear();
  await textarea.sendKeys(message);

  if (options?.flagFirstItem) {
    const checkboxes = await driver.findElements(
      By.xpath(`${MODAL_CONTENT_XPATH}//label[contains(@class, 'chakra-checkbox')]`),
    );
    if (checkboxes.length > 0) {
      await checkboxes[0].click();
    }
  }

  const submitButton = await driver.wait(
    until.elementLocated(
      By.xpath(`${MODAL_CONTENT_XPATH}${REQUEST_CORRECTION_BUTTON_XPATH}`),
    ),
    10000,
  );
  await driver.wait(until.elementIsEnabled(submitButton), 10000);
  await submitButton.click();

  await driver.wait(
    async () => (await driver.findElements(By.xpath(MODAL_CONTENT_XPATH))).length === 0,
    15000,
  );
}
