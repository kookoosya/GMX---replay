  // ----- Redeem code -----
  const redeemBtn = $("btnRedeem");
  if (redeemBtn) redeemBtn.onclick = async ()=>{
    if (!requireConnected("Home")) return;
    const h = getHandle();
    if (!h){ tab("home"); return; }
    const code = $("redeemCode").value.trim();
    if (!code){
      $("connectMsg").innerHTML = `<span class="warn">Paste a code first.</span>`;
      return;
    }
    try{
      const j = await api("/api/billing/redeem", "POST", { handle: h, code });
      $("connectMsg").innerHTML = `<span class="ok">Activated.</span>`;
      renderWalletStatus(j.sub);
      await refreshUsage();
    }catch(e){
      $("connectMsg").innerHTML = `<span class="bad">${e.message || "redeem_failed"}</span>`;
    }
  };
