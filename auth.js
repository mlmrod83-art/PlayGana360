import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $ = id => document.getElementById(id);
const cfg = window.PLAYGANA_CONFIG || {};
const configured = /^https:\/\/[^/]+\.supabase\.co$/.test(cfg.supabaseUrl || '') && cfg.supabasePublishableKey && !cfg.supabasePublishableKey.includes('REEMPLAZAR');
const status = (msg, error = false) => { $('authStatus').textContent = msg; $('authStatus').classList.toggle('error', error); };
if (!configured) {
  status('Pendiente: edita config.js con la URL y la clave pública de Supabase. Los juegos gratuitos siguen disponibles.');
  for (const id of ['authRegister','authLogin','authReset']) $(id).disabled = true;
} else {
  const supabase = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
  let currentUser = null;
  const redirectTo = 'https://mlmrod83-art.github.io/PlayGana360/';
  const render = user => {
    currentUser = user;
    $('authGuest').hidden = !!user;
    $('authMember').hidden = !user;
    $('authUserEmail').textContent = user?.email || '';
    if (!user) $('authRecovery').hidden = true;
    status(user ? 'Sesión iniciada correctamente. Tu acceso VIP todavía no está activado.' : 'Inicia sesión o crea una cuenta para guardar tu identidad.');
  };
  const action = async fn => {
    for (const id of ['authRegister','authLogin','authReset','authLogout','authUpdatePassword']) $(id).disabled = true;
    try { await fn(); } catch(e) { status(e.message || 'Ocurrió un error.', true); }
    finally { for (const id of ['authRegister','authLogin','authReset','authLogout','authUpdatePassword']) $(id).disabled = false; }
  };
  const credentials = () => {
    const email = $('authEmail').value.trim(); const password = $('authPassword').value;
    if (!email || !email.includes('@')) throw new Error('Escribe un correo electrónico válido.');
    if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    return {email,password};
  };
  $('authRegister').onclick = () => action(async()=>{
    const {email,password} = credentials();
    const {data,error} = await supabase.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
    if(error) throw error;
    status(data.session ? 'Cuenta creada y sesión iniciada.' : 'Revisa tu correo y confirma tu cuenta antes de iniciar sesión.');
  });
  $('authLogin').onclick = () => action(async()=>{
    const {email,password} = credentials();
    const {error} = await supabase.auth.signInWithPassword({email,password});
    if(error) throw error;
    status('Sesión iniciada.');
  });
  $('authReset').onclick = () => action(async()=>{
    const email = $('authEmail').value.trim();
    if(!email.includes('@')) throw new Error('Escribe primero tu correo electrónico.');
    const {error} = await supabase.auth.resetPasswordForEmail(email,{redirectTo});
    if(error) throw error;
    status('Si existe una cuenta para ese correo, recibirás instrucciones para recuperar tu contraseña.');
  });
  $('authLogout').onclick = () => action(async()=>{
    const {error} = await supabase.auth.signOut(); if(error) throw error;
  });
  $('authUpdatePassword').onclick = () => action(async()=>{
    const password = $('authNewPassword').value;
    if(password.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    const {error} = await supabase.auth.updateUser({password}); if(error) throw error;
    $('authRecovery').hidden = true; $('authNewPassword').value=''; status('Contraseña actualizada.');
  });
  supabase.auth.onAuthStateChange((event,session)=>{
    render(session?.user || null);
    if(event === 'PASSWORD_RECOVERY') { $('authRecovery').hidden = false; status('Introduce tu nueva contraseña para completar la recuperación.'); }
  });
  const {data,error} = await supabase.auth.getSession();
  if(error) status(error.message,true); else render(data.session?.user || null);
}
