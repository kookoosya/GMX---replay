// Shared entitlements helper (site + extension)
// Keeps plan logic out of UI.
(function(){
  function isPro(user){
    return !!user && String(user.sub_status||'') === 'active';
  }
  function planName(user){
    return isPro(user) ? 'pro' : 'free';
  }
  function getPlan(config, user){
    const p = planName(user);
    return (config && config.plans && config.plans[p]) || (config && config[p]) || null;
  }
  window.GMXEntitlements = { isPro, planName, getPlan };
})();
