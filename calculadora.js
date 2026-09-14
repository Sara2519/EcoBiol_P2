function num(id){ var v=parseFloat(document.getElementById(id).value); return isNaN(v)?0:v; }
function fmt(v,d){ if(d===undefined) d=2; if(!isFinite(v)) return '—'; return v.toLocaleString('es-CO',{minimumFractionDigits:0,maximumFractionDigits:d}); }
function row(k,v,unit){ return '<tr><td class="k">'+k+'</td><td class="v">'+v+(unit?' '+unit:'')+'</td></tr>'; }
function setTable(id, html){ document.getElementById(id).innerHTML = html; }

function openLightbox(src, alt){
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-img').alt = alt||'';
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(e){
  if(e) e.stopPropagation();
  document.getElementById('lightbox').classList.remove('open');
}

function escenario(){ return document.getElementById('escCS').checked ? 'CS' : 'SS'; }

// --- Navegación por pasos a pantalla completa ---
var ALL_STEPS = ['sec-escenario','sec-poblacion','sec-caudal','sec-recepcion','sec-biodigestor','sec-biol','sec-destino','sec-lechos','sec-marquesina','sec-compost'];
var currentStepId = ALL_STEPS[0];

function visibleSteps(){
  return ALL_STEPS.filter(function(id){ return !(id==='sec-marquesina' && escenario()!=='CS'); });
}

function renderSteps(){
  var vis = visibleSteps();
  if(vis.indexOf(currentStepId) === -1){ currentStepId = 'sec-compost'; }
  ALL_STEPS.forEach(function(id){
    document.getElementById(id).classList.toggle('active', id===currentStepId);
  });
  var idx = vis.indexOf(currentStepId);
  document.getElementById('stepCounter').textContent = 'Paso '+(idx+1)+' de '+vis.length;
  document.getElementById('btnPrev').disabled = (idx===0);
  document.getElementById('btnNext').textContent = (idx===vis.length-1) ? 'Finalizar ✓' : 'Siguiente →';
  document.getElementById('btnNext').disabled = (idx===vis.length-1);
  document.querySelectorAll('.flow-dot').forEach(function(dot){
    var id = dot.getAttribute('data-step');
    dot.style.display = (vis.indexOf(id)!==-1) ? '' : 'none';
    dot.classList.toggle('current', id===currentStepId);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}
function goToStep(id){ currentStepId = id; renderSteps(); }
function nextStep(){
  var vis = visibleSteps(), idx = vis.indexOf(currentStepId);
  if(idx < vis.length-1){ currentStepId = vis[idx+1]; renderSteps(); }
}
function prevStep(){
  var vis = visibleSteps(), idx = vis.indexOf(currentStepId);
  if(idx > 0){ currentStepId = vis[idx-1]; renderSteps(); }
}

document.querySelectorAll('input[name=escenario]').forEach(function(r){
  r.addEventListener('change', function(){
    document.getElementById('cardCS').classList.toggle('selected', escenario()==='CS');
    document.getElementById('cardSS').classList.toggle('selected', escenario()==='SS');
    calculateAll();
    renderSteps();
  });
});

function calculateAll(){
  var esc = escenario();

  // --- 2. Población -> CE ---
  var ce_raw = num('n_hv')*1.38 + num('n_hg')*1.08 + num('n_hl')*2.93 + num('n_mr')*1.48
          + num('n_ll')*0.34 + num('n_p')*0.55 + num('n_l')*0.88 + num('n_c')*1.00;
  var ce = Math.round(ce_raw);
  document.getElementById('out_ce').textContent = fmt(ce,0)+' CE';

  // --- 3. Caudal de diseño ---
  var M_exc = num('p_mexc'), rho = num('p_rho');
  var Q_A_lavCE = num('p_qalav')/1000; // L/CE.d -> m3/CE.d
  var redLav = num('p_redlav')/100;
  var E_S = num('p_es_sep')/100;
  var fsol = num('p_fsol')/100;
  var Q_A_lav = ce * Q_A_lavCE;
  var Q_exc = ce * M_exc / rho;
  var Q; // caudal total de diseño
  var qcaudRows = '';
  if(esc==='SS'){
    Q = Q_exc + Q_A_lav;
    qcaudRows += row('Caudal de excretas (Q_exc)', fmt(Q_exc,3), 'm³/d');
    qcaudRows += row('Caudal de agua de lavado (Q_A.lav)', fmt(Q_A_lav,3), 'm³/d');
    qcaudRows += row('Caudal de diseño (Q_SS)', fmt(Q,3), 'm³/d');
  } else {
    var Q_exc_liq = ce*M_exc/rho*(1-fsol);
    var Q_exc_sol = ce*M_exc/rho*fsol;
    var Q_exc_CS = Q_exc_liq + Q_exc_sol*(1-E_S);
    Q = Q_exc_CS + (1-redLav)*Q_A_lav;
    qcaudRows += row('Caudal de excretas líquidas', fmt(Q_exc_liq,3), 'm³/d');
    qcaudRows += row('Caudal de excretas sólidas', fmt(Q_exc_sol,3), 'm³/d');
    qcaudRows += row('Caudal de excretas CS', fmt(Q_exc_CS,3), 'm³/d');
    qcaudRows += row('Caudal de agua de lavado (Q_A.lav)', fmt(Q_A_lav,3), 'm³/d');
    qcaudRows += row('Caudal de diseño (Q_CS)', fmt(Q,3), 'm³/d');
  }
  setTable('tbl_caudal', qcaudRows);

  // --- 4. Tanque de recepción ---
  var TRH = num('p_trh');
  var SST = esc==='CS' ? num('p_sst_cs') : num('p_sst_ss');
  var E_SST = num('p_esst')/100;
  var t_a = num('p_ta');
  var rho_lodo = num('p_rho_lodo');
  var Cs_lodo = num('p_cs_lodo')/100;
  var ang = num('p_ang') * Math.PI/180;
  var B_base = num('p_bbase');
  var H_BL_r = 0.20, H_N = 0.20;

  var V_TR_objetivo = Q*TRH;
  var L_TR = Math.cbrt(15*V_TR_objetivo);
  var B_TR = L_TR/3;
  var H_TR = L_TR/5; if(H_TR < 1) H_TR = 1; // profundidad mínima adoptada
  var V_TR = L_TR*B_TR*H_TR; // volumen realmente construido con la profundidad adoptada
  var H_T_TR = H_TR + H_BL_r + H_N;
  var M_s = Q*E_SST*SST;
  var V_tolva = (t_a*M_s)/(rho_lodo*Cs_lodo);
  var H_tolva = Math.max(0,(B_TR - B_base)/2) * Math.tan(ang);

  setTable('tbl_recepcion',
    row('Volumen del tanque', fmt(V_TR,2), 'm³') +
    row('Largo', fmt(L_TR,2), 'm') +
    row('Ancho', fmt(B_TR,2), 'm') +
    row('Profundidad útil', fmt(H_TR,2), 'm') +
    row('Profundidad total', fmt(H_T_TR,2), 'm') +
    row('Carga de lodos (M_s)', fmt(M_s,2), 'kg SST/d') +
    row('Volumen de la tolva', fmt(V_tolva,3), 'm³') +
    row('Altura de la tolva', fmt(H_tolva,2), 'm')
  );

  // --- 5. Lechos de secado ---
  var t_S = num('p_ts'), t_L = num('p_tl'), q_s = num('p_qs');
  var h_lecho = num('p_hlecho'), h_BL_lecho = num('p_hbl_lecho');
  var Hi_lecho = num('p_hi_lecho')/100, Hf_lecho = num('p_hf_lecho')/100;

  var M_LH = Cs_lodo>0 ? M_s/Cs_lodo : 0;
  var Q_LH = rho_lodo>0 ? M_LH/rho_lodo : 0;
  var t_C = t_S + t_L;
  var V_L = Q_LH*t_C;
  var M_s_anio = M_s*365;
  var A_LS = q_s>0 ? M_s_anio/q_s : 0;
  var L_LS = Math.sqrt(2*A_LS);
  var B_LS = L_LS/2;
  var h_lodo = A_LS>0 ? V_L/A_LS : 0;
  var h_T_lecho = h_lodo + h_lecho + h_BL_lecho;
  var M_LD_L = (1-Hf_lecho)>0 ? M_LH*(1-Hi_lecho)/(1-Hf_lecho) : 0;

  setTable('tbl_lechos',
    row('Caudal de lodo húmedo', fmt(Q_LH,3), 'm³/d') +
    row('Área superficial', fmt(A_LS,2), 'm²') +
    row('Largo', fmt(L_LS,2), 'm') +
    row('Ancho', fmt(B_LS,2), 'm') +
    row('Altura de la capa de lodo', fmt(h_lodo,2), 'm') +
    row('Altura total', fmt(h_T_lecho,2), 'm') +
    row('Flujo de lodo deshidratado', fmt(M_LD_L,2), 'kg/d')
  );

  // --- 6. Marquesina (solo CS) ---
  var M_LD_M = 0;
  if(esc==='CS'){
    var T_CD = num('p_tcd'), h_PS = num('p_hps');
    var Hi_mq = num('p_hi_mq')/100, Hf_mq = num('p_hf_mq')/100;
    var rho_i = num('p_rhoi');
    var M_exc_s = (ce*M_exc*fsol)*E_S;
    var Q_exc_s = rho_i>0 ? M_exc_s/rho_i : 0;
    var V_acum = Q_exc_s*T_CD;
    var A_MS = h_PS>0 ? V_acum/h_PS : 0;
    var L_MS = Math.sqrt(2*A_MS);
    var B_MS = L_MS/2;
    M_LD_M = (1-Hf_mq)>0 ? M_exc_s*(1-Hi_mq)/(1-Hf_mq) : 0;

    setTable('tbl_marquesina',
      row('Masa de excretas separadas', fmt(M_exc_s,2), 'kg/d') +
      row('Caudal de excretas separadas', fmt(Q_exc_s,3), 'm³/d') +
      row('Volumen acumulado', fmt(V_acum,2), 'm³') +
      row('Área superficial', fmt(A_MS,2), 'm²') +
      row('Largo', fmt(L_MS,2), 'm') +
      row('Ancho', fmt(B_MS,2), 'm') +
      row('Flujo de lodo deshidratado', fmt(M_LD_M,2), 'kg/d')
    );
  } else {
    setTable('tbl_marquesina', '<tr><td class="k">No aplica en el escenario SS.</td><td></td></tr>');
  }

  // --- 7. Compostaje ---
  var rho_f = num('p_rhof'), rho_P = num('p_rhop'), rel = num('p_rel_cn');
  var h_P = num('p_hp'), B_max = num('p_bmax'), t_ll = num('p_tll'), t_cc = num('p_tcc');

  var M_D = M_LD_L + M_LD_M;
  var V_D = rho_f>0 ? M_D/rho_f : 0;
  var V_pasto = rho_P>0 ? M_D*rel/rho_P : 0;
  var V_pila_d = V_D + V_pasto;
  var V_pila = V_pila_d*t_ll;
  var A_P = h_P>0 ? V_pila/h_P : 0;
  var B_P = Math.min(Math.sqrt(A_P/2), B_max);
  var L_P = B_P>0 ? A_P/B_P : 0;
  var N_pilas = t_ll>0 ? t_cc/t_ll : 0;
  var A_compost = A_P*N_pilas;

  setTable('tbl_compost',
    row('Masa de lodo a compostar (M_D)', fmt(M_D,2), 'kg/d') +
    row('Volumen diario de porcinaza deshidratada', fmt(V_D,3), 'm³/d') +
    row('Volumen diario de pasto picado', fmt(V_pasto,3), 'm³/d') +
    row('Volumen de la pila', fmt(V_pila,2), 'm³') +
    row('Área superficial de una pila', fmt(A_P,2), 'm²') +
    row('Ancho de la pila', fmt(B_P,2), 'm') +
    row('Largo de la pila', fmt(L_P,2), 'm') +
    row('Número de pilas', fmt(N_pilas,1), '') +
    row('Área total requerida', fmt(A_compost,2), 'm²')
  );

  // --- 8. Biodigestor ---
  var TRH_bio = num('p_trh_bio'), F_g = num('p_fg');
  var B_inf = num('p_binf'), B_sup = num('p_bsup'), h_z = num('p_hz'), L_R = num('p_lr');

  var Q_B = Q - Q_LH;
  var V_B = Q_B*TRH_bio*F_g;
  var A_zanja = (B_inf+B_sup)/2*h_z;
  var L_B = A_zanja>0 ? V_B/A_zanja : 0;
  var N_B = L_R>0 ? Math.ceil(L_B/L_R) : 0;

  setTable('tbl_biodigestor',
    row('Caudal de alimentación (Q_B)', fmt(Q_B,3), 'm³/d') +
    row('Volumen del biodigestor', fmt(V_B,2), 'm³') +
    row('Área transversal de la zanja', fmt(A_zanja,2), 'm²') +
    row('Longitud total', fmt(L_B,2), 'm') +
    row('Número de biodigestores de '+fmt(L_R,0)+' m', fmt(N_B,0), '')
  );

  // --- 9. Tanque de biol ---
  var t_A_biol = num('p_ta_biol'), h_BL_biol = num('p_hbl_biol'), h_TB = num('p_htb');
  var V_TB = Q_B*t_A_biol;
  var A_TB = h_TB>0 ? V_TB/h_TB : 0;
  var L_TB = Math.sqrt(2*A_TB);
  var B_TB = L_TB/2;
  var H_T_TB = h_TB + h_BL_biol;

  setTable('tbl_biol',
    row('Volumen del tanque de biol', fmt(V_TB,2), 'm³') +
    row('Área superficial', fmt(A_TB,2), 'm²') +
    row('Largo', fmt(L_TB,2), 'm') +
    row('Ancho', fmt(B_TB,2), 'm') +
    row('Altura total', fmt(H_T_TB,2), 'm')
  );

  // --- 10. Destino del biol ---
  var cultivo = document.getElementById('cultivo').value;
  var crops = {
    estrella: {label:'Pasto estrella', T_FN:500, N_R:10},
    boton: {label:'Botón de oro', T_FN:520, N_R:6},
    elefante: {label:'Pasto elefante', T_FN:570, N_R:6}
  };
  var c = crops[cultivo];
  var N_conc = esc==='CS' ? num('conc_n_cs') : num('conc_n_ss');
  var A_R_anio = (Q_B*365*N_conc)/c.T_FN; // ha/año
  var F_R = 365/c.N_R;
  var A_R_dia = (A_R_anio*10000)/F_R; // m2/d
  var L_agua = A_R_dia>0 ? (Q_B/A_R_dia)*1000 : 0; // mm

  setTable('tbl_aplicacion',
    row('Caudal de biol (Q_B)', fmt(Q_B,3), 'm³/d') +
    row('Área de aplicación anual — '+c.label, fmt(A_R_anio,2), 'ha/año') +
    row('Frecuencia de riego', fmt(F_R,1), 'd') +
    row('Área de aplicación diaria', fmt(A_R_dia,1), 'm²/d') +
    row('Lámina de agua por aplicación', fmt(L_agua,2), 'mm')
  );

  var haDisp = num('ha_disp');
  var veredicto = document.getElementById('veredicto_biol');
  var terciario = document.getElementById('bloque_terciario');
  veredicto.style.display = 'block';
  if(haDisp >= A_R_anio && A_R_anio>0){
    veredicto.textContent = 'Con '+fmt(haDisp,1)+' ha disponibles alcanzas para aplicar el biol sobre '+c.label+' (se requieren '+fmt(A_R_anio,2)+' ha/año). No necesitas tratamiento terciario.';
    terciario.style.display = 'none';
  } else {
    veredicto.textContent = 'El área disponible ('+fmt(haDisp,1)+' ha) no alcanza para aplicar todo el biol sobre '+c.label+' (se requieren '+fmt(A_R_anio,2)+' ha/año). Revisa las alternativas de tratamiento terciario a continuación.';
    terciario.style.display = 'block';

    // 6 tecnologías de tratamiento terciario
    var techs = [];

    // HC-FS
    (function(){
      var Co = esc==='CS'?897:931, Ce = esc==='CS'?269:279;
      var k20=0.678, theta=1.06, T=25, d=0.55, p=0.75;
      var kT = 0.75*k20*Math.pow(theta,(T-20));
      var A = (Q_B*(Math.log(Co)-Math.log(Ce)))/(kT*d*p);
      var B = Math.sqrt(A/4), L = B*4;
      techs.push({nombre:'Humedal flujo superficial (HC-FS)', A:A, B:B, L:L});
    })();
    // HC-FSS
    (function(){
      var Co = esc==='CS'?897:931, Ce = esc==='CS'?269:279;
      var k20=1.104, theta=1.06, T=25, d=0.45, p=0.38;
      var kT = 0.75*k20*Math.pow(theta,(T-20));
      var A = (Q_B*(Math.log(Co)-Math.log(Ce)))/(kT*d*p);
      var B = Math.sqrt(A/4), L = B*4;
      techs.push({nombre:'Humedal flujo subsuperficial (HC-FSS)', A:A, B:B, L:L});
    })();
    // FIA
    (function(){
      var Lw = 0.45;
      var A = Q_B/Lw;
      var B = Math.sqrt(A/4), L = B*4;
      techs.push({nombre:'Filtro intermitente de arena (FIA)', A:A, B:B, L:L});
    })();
    // FV
    (function(){
      var m=2, b=1;
      var A = m*Math.pow(3.7*ce, b);
      var B = Math.sqrt(A/4), L = B*4;
      techs.push({nombre:'Filtro verde (FV)', A:A, B:B, L:L});
    })();
    // FV-DZ
    (function(){
      var T_RE = 21.98;
      var A = (Q_B*1000)/T_RE;
      var B = Math.sqrt(A/4), L = B*4;
      techs.push({nombre:'Filtro verde descarga cero (FV-DZ)', A:A, B:B, L:L});
    })();
    // FV-EFA
    (function(){
      var Ki=0.5, T_RE=21.98, P=6.23;
      var A = (Ki*Q_B*1000)/(T_RE-P);
      var B = Math.sqrt(A/4), L = B*4;
      techs.push({nombre:'Filtro verde evaporativo asc. (FV-EFA)', A:A, B:B, L:L});
    })();

    var minA = Math.min.apply(null, techs.map(function(t){return t.A;}));
    var html = '<tr><th>Tecnología</th><th>Área (m²)</th><th>Ancho (m)</th><th>Largo (m)</th></tr>';
    techs.forEach(function(t){
      html += '<tr class="'+(t.A===minA?'best':'')+'"><td>'+t.nombre+'</td><td class="num">'+fmt(t.A,1)+'</td><td class="num">'+fmt(t.B,2)+'</td><td class="num">'+fmt(t.L,2)+'</td></tr>';
    });
    document.getElementById('tbl_terciario').innerHTML = html;
  }
}

document.querySelectorAll('input, select').forEach(function(el){
  el.addEventListener('input', calculateAll);
  el.addEventListener('change', calculateAll);
});

calculateAll();
renderSteps();
