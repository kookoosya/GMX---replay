GMXReply · Phase 5

Done in this patch:
- cleaned the referral copy so the UI no longer claims +10 daily inserts per 20 referrals
- referral explainer now reflects the approved unlock model
- promoter details now shows fixed free daily (70) and current unlocks instead of old bonus math
- invited users list now understands status / notCountedReason when present
- safe i18n stopgap: referral-specific strings were normalized to one truthful English copy across locales

Next order:
1) backend unlock fields + admin unlock-credit codes
2) unlock gating in site + extension
3) Supabase source-of-truth switch + migration checks
4) Render env + deploy smoke
