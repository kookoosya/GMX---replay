// ----- Wallet / Billing -----
  let BILLING = { receiver:"", plans:[], solUsd:0, rpcPublic:"" };
  let selectedCurrency = "SOL"; // SOL | USDC | USDT
  let selectedPlanKey = "";
  let selectedPlan = null;

  if (!window.__GMXWalletHelpersFactory) throw new Error("GMX wallethelpers factory missing");
  const __gmxWh = window.__GMXWalletHelpersFactory();
  const WS_CHAIN = __gmxWh.WS_CHAIN;
  const LS_WALLET_CHOICE = K.WALLET_CHOICE;
  const b58encode = __gmxWh.b58encode;
  const shortPk = __gmxWh.shortPk;
  const walletNameKey = __gmxWh.walletNameKey;
  const safeIconSrc = __gmxWh.safeIconSrc;
  const defaultWalletIcon = __gmxWh.defaultWalletIcon;
  const listWalletChoices = () => __gmxWh.listWalletChoices();
  const getRpcUrl = () => __gmxWh.getRpcUrl(BILLING);
  const rpcCandidates = () => __gmxWh.rpcCandidates(BILLING);
  const shouldRetryRpc = (err) => __gmxWh.shouldRetryRpc(err);
  const planPricePrimary = __gmxWh.planPricePrimary;
  const planPriceSecondary = __gmxWh.planPriceSecondary;

  const WALLET = {
    connected: false,
    kind: null,            // "standard" | "legacy"
    name: "",
    icon: "",
    wallet: null,          // Wallet Standard wallet object
    account: null,         // Wallet Standard account
    provider: null,        // legacy injected provider
    publicKey: null        // solanaWeb3.PublicKey
  };

  async function walletSignMessageBytes(messageBytes){
    return __gmxWh.signMessageBytes(WALLET, messageBytes);
  }

  async function bindWalletToIntent(intent){
    const intentId = String(intent?.id || intent?.intentId || "").trim();
    const bindMessage = String(intent?.bindMessage || "").trim();
    const payer = String(WALLET.publicKey?.toString?.() || "").trim();
    if (!intentId || !bindMessage || !payer) throw new Error("wallet_bind_required");
    const nonceSig = await walletSignMessageBytes(new TextEncoder().encode(bindMessage));
    return api("/api/billing/bind", "POST", { intentId, wallet: payer, nonceSig });
  }

  function addIntentMemoInstruction(tx, intentId, web3){
    __gmxWh.addIntentMemoInstruction(tx, intentId, web3);
  }

  if (!window.__GMXWalletPayFactory) throw new Error("GMX walletpay factory missing");
  const __gmxWalletPay = window.__GMXWalletPayFactory({
    api,
    getBilling: () => BILLING,
    getSelectedCurrency: () => selectedCurrency,
    getWallet: () => WALLET,
    wsChain: WS_CHAIN,
    b58encode,
    addIntentMemoInstruction,
    getRpcUrl,
    rpcCandidates,
    shouldRetryRpc,
  });

  const buildPaymentTx = (intent) => __gmxWalletPay.buildPaymentTx(intent);
  const walletSendTransaction = (tx, connection) => __gmxWalletPay.walletSendTransaction(tx, connection);
  const verifyIntentWithRetry = (intentId, sig, payer) => __gmxWalletPay.verifyIntentWithRetry(intentId, sig, payer);

  if (!window.__GMXWalletUiFactory) throw new Error("GMX walletui factory missing");
  const __gmxWalletUi = window.__GMXWalletUiFactory({
    $,
    escapeHtml,
    api,
    modals: __gmxModals,
    toast,
    trackEvent,
    abVariant,
    friendlyUiErrorMessage,
    setPayState,
    openPaySuccess,
    getHandle,
    refreshUsage,
    walletChoiceKey: LS_WALLET_CHOICE,
    wsChain: WS_CHAIN,
    listWalletChoices,
    walletNameKey,
    safeIconSrc,
    defaultWalletIcon,
    shortPk,
    planPricePrimary,
    planPriceSecondary,
    getBilling: () => BILLING,
    setBilling: (v) => { BILLING = v; },
    getSelectedCurrency: () => selectedCurrency,
    setSelectedCurrency: (v) => { selectedCurrency = v; },
    getSelectedPlanKey: () => selectedPlanKey,
    setSelectedPlanKey: (v) => { selectedPlanKey = v; },
    getSelectedPlan: () => selectedPlan,
    setSelectedPlan: (v) => { selectedPlan = v; },
    getWallet: () => WALLET,
    bindWalletToIntent,
    buildPaymentTx,
    walletSendTransaction,
    verifyIntentWithRetry,
  });

  const setWalletUi = () => __gmxWalletUi.setWalletUi();
  const loadPlans = () => __gmxWalletUi.loadPlans();
  const loadBillingProof = () => __gmxWalletUi.loadBillingProof();
  const loadActivity = () => __gmxWalletUi.loadActivity();
  const renderWalletStatus = (sub) => __gmxWalletUi.renderWalletStatus(sub);
  const bindWalletTab = () => __gmxWalletUi.bindWalletTab();

