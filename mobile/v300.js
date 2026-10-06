'use strict';
(function(){
  const fromUrl=value=>{const pad='='.repeat((4-value.length%4)%4);return Uint8Array.from(atob((value+pad).replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));};
  const params=()=>new URLSearchParams(location.hash.replace(/^#/,''));
  const pendingKey='crp-mobile-pair-pending-300';
  const discordLinkKey='crp-mobile-discord-link-pending-300';
  const hasDiscordIdentity300=()=>[...(state.user?.identities||[]).map(item=>item?.provider),...(state.user?.app_metadata?.providers||[])].some(provider=>String(provider).toLowerCase()==='discord');

  async function discordLogin300(){
    const pair=params().get('pair'); if(pair)sessionStorage.setItem(pendingKey,pair);
    const redirect=`${location.origin}${location.pathname}`;
    location.href=`${SUPABASE}/auth/v1/authorize?provider=discord&redirect_to=${encodeURIComponent(redirect)}`;
  }

  async function linkDiscord300(){
    if(!state.session?.access_token)throw new Error('Bitte zuerst mit E-Mail und Passwort anmelden.');
    if(hasDiscordIdentity300())return;
    const redirect=`${location.origin}${location.pathname}`;
    const result=await api(`/auth/v1/user/identities/authorize?provider=discord&redirect_to=${encodeURIComponent(redirect)}&skip_http_redirect=true`);
    if(!result?.url)throw new Error('Supabase hat keine Discord-Freigabeadresse zurückgegeben.');
    sessionStorage.setItem(discordLinkKey,'1');
    location.href=result.url;
  }

  async function oauthCallback300(){
    const values=params(); const access=values.get('access_token'); const refresh=values.get('refresh_token');
    if(!access||!refresh)return false;
    const expires=Number(values.get('expires_in')||3600);
    history.replaceState({},document.title,location.pathname+location.search);
    await start({access_token:access,refresh_token:refresh,expires_in:expires,expires_at:Math.floor(Date.now()/1000)+expires,token_type:'bearer'});
    return true;
  }

  async function consumePairing300(token){
    if(!token||!state.user?.id)return false;
    const [id,secretText]=String(token).split('.'); if(!id||!secretText)throw new Error('Der Kopplungs-QR-Code ist unvollständig.');
    const rows=await api(`/rest/v1/mobile_key_transfers_300?id=eq.${encodeURIComponent(id)}&select=id,user_id,ciphertext,iv,expires_at,consumed_at`);
    const transfer=rows?.[0]; if(!transfer)throw new Error('Die Kopplung wurde nicht gefunden oder ist bereits abgelaufen.');
    if(String(transfer.user_id)!==String(state.user.id))throw new Error('Diese Kopplung gehört zu einem anderen Konto.');
    if(transfer.consumed_at||new Date(transfer.expires_at)<=new Date())throw new Error('Dieser QR-Code ist bereits benutzt oder abgelaufen.');
    const key=await crypto.subtle.importKey('raw',fromUrl(secretText),{name:'AES-GCM'},false,['decrypt']);
    const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(transfer.iv)},key,unb64(transfer.ciphertext));
    const bundle=JSON.parse(new TextDecoder().decode(clear));
    if(bundle.format!=='conan-rp-keyring-300'||String(bundle.userId)!==String(state.user.id))throw new Error('Die verschlüsselte Kopplung ist ungültig.');
    localStorage.setItem('crp-mobile-keyring-300',JSON.stringify(bundle.keyring));
    state.key=bundle.keyring.identities[bundle.keyring.current||0]||bundle.keyring.identities[0];
    localStorage.setItem('crp-mobile-key',JSON.stringify(state.key));
    await api(`/rest/v1/mobile_key_transfers_300?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{consumed_at:new Date().toISOString()}});
    await api('/rest/v1/mobile_devices_300',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:state.user.id,device_id:localStorage.getItem('crp-device-300')||uid(),device_name:navigator.userAgent.slice(0,120),last_seen_at:new Date().toISOString()}}).catch(()=>{});
    sessionStorage.removeItem(pendingKey); history.replaceState({},document.title,location.pathname+location.search);
    alert('Dieses Handy ist jetzt sicher gekoppelt. Auch alte Nachrichten können mit den vorhandenen Schlüsseln gelesen werden.');
    if(state.page==='security')renderSecurity();
    return true;
  }

  async function registerPush300(){
    if(!state.user)throw new Error('Bitte zuerst anmelden.');
    await subscribePush();
    const registration=await navigator.serviceWorker.ready;
    const subscription=await registration.pushManager.getSubscription();
    if(!subscription)throw new Error('Es wurde kein aktives Push-Abonnement angelegt.');
    const deviceId=localStorage.getItem('crp-device-300')||uid(); localStorage.setItem('crp-device-300',deviceId);
    await api('/rest/v1/mobile_push_subscriptions_300',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:state.user.id,device_id:deviceId,endpoint:subscription.endpoint,subscription:subscription.toJSON(),enabled:true,last_seen_at:new Date().toISOString()}});
    const result=await api('/functions/v1/push-dispatch-300',{method:'POST',body:{action:'self-test'}});
    return result;
  }

  const oldSecurity=renderSecurity;
  renderSecurity=function(){oldSecurity();const page=$('#page');if(!page)return;const discordLinked=hasDiscordIdentity300();page.insertAdjacentHTML('afterbegin',`<section class="card"><small class="muted">KONTO 300.1</small><h2>Discord mit Planer verbinden</h2><p>${discordLinked?'✅ Discord ist mit diesem Planer-Konto verknüpft. Du kannst dich künftig direkt mit Discord anmelden.':'Verbinde dein bereits angemeldetes Planer-Konto einmalig mit Discord. Benutzer-ID, Chats und Schlüssel bleiben dabei erhalten.'}</p>${discordLinked?'':'<button class="discord wide" id="linkDiscordMobile300">Discord mit diesem Konto verknüpfen</button>'}<p id="discordLinkStatus300" class="muted">Deine E-Mail-Adresse wird Discord-Nutzern nicht angezeigt.</p></section><section class="card"><small class="muted">MOBILE 300</small><h2>QR-Kopplung & echter Push</h2><p>Discord-Anmeldung und der komplette Nachrichtenschlüsselbund werden sicher mit deinem Konto verbunden. Deine E-Mail-Adresse bleibt verborgen.</p><button class="primary wide" id="pushTest300">Push aktivieren & testen</button><p id="pushStatus300" class="muted">Der Test zeigt sofort, ob Hintergrundbenachrichtigungen ankommen.</p></section>`);if($('#linkDiscordMobile300'))$('#linkDiscordMobile300').onclick=async()=>{const node=$('#discordLinkStatus300');node.textContent='Discord wird geöffnet …';try{await linkDiscord300();}catch(error){node.textContent=/manual.link/i.test(error.message)?'Der Projektbesitzer muss in Supabase unter Authentication → Settings zuerst Manual Linking aktivieren.':error.message;}};$('#pushTest300').onclick=async()=>{const node=$('#pushStatus300');node.textContent='Push wird eingerichtet …';try{await registerPush300();node.textContent='✅ Test gesendet. Du solltest jetzt eine Handy-Benachrichtigung sehen.';node.classList.add('push-ok-300');}catch(error){node.textContent=error.message;}};};

  $('#discordMobile300')?.addEventListener('click',discordLogin300);
  navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='sync-300')Promise.all([flushOfflineQueue(),flushAppointmentQueue270()]).catch(()=>{});});

  (async()=>{
    const urlPair=params().get('pair'); if(urlPair)sessionStorage.setItem(pendingKey,urlPair);
    try{const completed=await oauthCallback300();if(completed&&sessionStorage.getItem(discordLinkKey)==='1'){sessionStorage.removeItem(discordLinkKey);alert(hasDiscordIdentity300()?'Discord wurde erfolgreich mit deinem vorhandenen Planer-Konto verknüpft.':'Die Anmeldung wurde übernommen, Discord ist aber noch nicht als Identität eingetragen.');}}catch(error){$('#authStatus').textContent=error.message;return;}
    const tryPair=async()=>{const pair=sessionStorage.getItem(pendingKey);if(pair&&state.user)try{await consumePairing300(pair);}catch(error){alert(error.message);}};
    if(state.user)await tryPair();else setTimeout(tryPair,1200);
  })();
})();
