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

// --- Planos detallados con dimensiones calculadas ---
function abrirPlano(id){
  var m = document.getElementById(id);
  m.classList.add('open');
  m.querySelector('.close-lb').focus();
}
function cerrarPlano(e, id){
  document.getElementById(id).classList.remove('open');
}
document.addEventListener('keydown', function(e){
  if(e.key==='Escape'){
    document.querySelectorAll('.lightbox.open').forEach(function(m){ m.classList.remove('open'); });
  }
});


// --- Tratamiento terciario: catálogo ---
var TECNOLOGIAS = [
  {id:'hcfs',  sigla:'HC-FS',  nombre:'Humedal de flujo superficial',       img:'tt-hcfs.jpg',  prof:0.6, cero:false,
   desc:'El agua fluye horizontalmente sobre la superficie del suelo, desde la entrada hasta la descarga, pasando entre las hojas y tallos de plantas acuáticas enraizadas en el fondo.'},
  {id:'hcfss', sigla:'HC-FSS', nombre:'Humedal de flujo subsuperficial',    img:'tt-hcfss.jpg', prof:0.6, cero:false,
   desc:'El agua fluye horizontalmente por debajo de la superficie, a través de un lecho de grava o piedra plantado con vegetación como enea, bananito rojo, heliconias o pasto vetiver.'},
  {id:'fia',   sigla:'FIA',    nombre:'Filtro intermitente de arena',       img:'tt-fia.jpg',   prof:1.0, cero:false,
   desc:'El biol se dosifica de forma intermitente sobre un lecho de arena (con grava de soporte). El agua percola por el medio filtrante y se recoge en el desagüe del fondo.'},
  {id:'fv',    sigla:'FV',     nombre:'Filtro verde',                       img:'tt-fv.jpg',    prof:0.7, cero:false,
   desc:'Filtro de flujo vertical descendente: el agua se distribuye sobre el lecho, percola entre arenas y gravas, y se evacúa por el fondo para que el lecho vuelva a oxigenarse. Se recomienda pasto vetiver.'},
  {id:'fvdz',  sigla:'FV-DZ',  nombre:'Filtro verde de descarga cero',      img:'tt-fvdz.jpg',  prof:0.7, cero:true,
   desc:'Aprovecha el sistema suelo–vegetación–microorganismos para remover contaminantes. Si el efluente se recoge y se recircula sobre el filtro, se logra un sistema sin vertimiento.'},
  {id:'fvefa', sigla:'FV-EFA', nombre:'Filtro verde evaporativo ascendente', img:'tt-fvefa.jpg', prof:1.0, cero:true,
   desc:'El agua entra por una cámara anaerobia en el fondo y asciende por las capas de grava y arena hasta el suelo, donde se elimina por evapotranspiración. Bien diseñado, no produce efluente.'}
];
var ttSeleccion = null;
var RESUMEN = {};

// Selección de la alternativa desde la tabla
document.addEventListener('change', function(e){
  if(e.target && e.target.name==='tt_sel'){ ttSeleccion = e.target.value; calculateAll(); }
});

function abrirTerciario(id){
  var t = TECNOLOGIAS.filter(function(x){ return x.id===id; })[0];
  document.getElementById('fichaTTTitulo').textContent = t.nombre+' ('+t.sigla+')';
  var img = document.getElementById('fichaTTImg');
  img.src = t.img; img.alt = 'Ilustración del '+t.nombre.toLowerCase();
  document.getElementById('fichaTTDesc').textContent = t.desc;
  document.getElementById('fichaTTDim').innerHTML =
    '<tr><th scope="row">Área superficial</th><td><b>'+fmt(t.A,1)+'</b> m²</td></tr>'+
    '<tr><th scope="row">Largo</th><td><b>'+fmt(t.L,2)+'</b> m</td></tr>'+
    '<tr><th scope="row">Ancho</th><td><b>'+fmt(t.B,2)+'</b> m</td></tr>'+
    '<tr><th scope="row">Profundidad total</th><td><b>'+fmt(t.prof,1)+'</b> m</td></tr>';
  var btn = document.getElementById('fichaTTElegir');
  var elegida = (ttSeleccion===id);
  btn.classList.toggle('activo', elegida);
  document.getElementById('fichaTTElegirTxt').textContent = elegida ? 'Alternativa seleccionada' : 'Seleccionar esta alternativa';
  btn.onclick = function(){ ttSeleccion = id; calculateAll(); abrirTerciario(id); };
  abrirPlano('fichaTerciario');
}

// --- Resumen final con el plano general ---
function etiqueta(id, l1, l2){
  var g = document.getElementById(id);
  if(!g) return;
  g.style.display = l1 ? '' : 'none';
  if(!l1) return;
  var t = g.querySelector('text'), r = g.querySelector('rect');
  var x = t.getAttribute('x');
  t.innerHTML = '';
  [l1, l2].forEach(function(linea, k){
    if(!linea) return;
    var ts = document.createElementNS('http://www.w3.org/2000/svg','tspan');
    ts.setAttribute('x', x); if(k>0) ts.setAttribute('dy', '20');
    if(k>0) ts.setAttribute('class','l2');
    ts.textContent = linea; t.appendChild(ts);
  });
  var bb = t.getBBox(), pad = 7;
  r.setAttribute('x', bb.x - pad); r.setAttribute('y', bb.y - 4);
  r.setAttribute('width', bb.width + pad*2); r.setAttribute('height', bb.height + 8);
}
function abrirResumen(){
  calculateAll();
  var R = RESUMEN, cs = (R.esc==='CS');
  document.getElementById('resumenEsc').textContent = cs ? 'Con separación (CS)' : 'Sin separación (SS)';
  document.getElementById('resumenCE').textContent = fmt(R.ce,0)+' CE';
  document.getElementById('resumenQ').textContent = fmt(R.Q,3)+' m³/d';
  document.getElementById('planoResumenCS').style.display = cs ? '' : 'none';
  document.getElementById('planoResumenSS').style.display = cs ? 'none' : '';
  abrirPlano('resumen');

  var x = function(L,B){ return fmt(L,2)+' × '+fmt(B,2)+' m'; };
  var bdTxt = R.bd.varios ? 'V '+fmt(R.bd.V,1)+' m³ · '+fmt(R.bd.N,0)+' × '+fmt(R.bd.LR,0)+' m' : 'V '+fmt(R.bd.V,1)+' m³ · L '+fmt(R.bd.L,2)+' m';
  var ttTxt = R.tt ? R.tt.sigla+' · A '+fmt(R.tt.A,1)+' m² · '+x(R.tt.L,R.tt.B) : 'No requerido';
  var apTxt = R.ap.cultivo+' · '+fmt(R.ap.A,2)+' ha/año';
  var pre = cs ? 'rc_' : 'rs_';
  etiqueta(pre+'tr', 'V '+fmt(R.tr.V,2)+' m³', x(R.tr.L,R.tr.B));
  etiqueta(pre+'ls', 'A '+fmt(R.ls.A,1)+' m²', x(R.ls.L,R.ls.B));
  if(R.bd.varios){ etiqueta(pre+'bd', 'V '+fmt(R.bd.V,1)+' m³', fmt(R.bd.N,0)+' biodigestores de '+fmt(R.bd.LR,0)+' m'); }
  else { etiqueta(pre+'bd', 'V '+fmt(R.bd.V,1)+' m³', 'Largo '+fmt(R.bd.L,2)+' m · zanja '+fmt(R.bd.Bsup,1)+' m'); }
  etiqueta(pre+'tb', 'V '+fmt(R.tb.V,2)+' m³', x(R.tb.L,R.tb.B));
  etiqueta(pre+'tt', R.tt ? R.tt.sigla+' · A '+fmt(R.tt.A,1)+' m² · '+x(R.tt.L,R.tt.B) : 'No requerido');
  etiqueta(pre+'ap', R.ap.cultivo+' · '+fmt(R.ap.A,2)+' ha/año');
  if(cs){
    etiqueta('rc_ms', 'A '+fmt(R.ms.A,1)+' m² · '+x(R.ms.L,R.ms.B));
    etiqueta('rc_cp', fmt(R.cp.N,0)+' pilas de '+x(R.cp.L,R.cp.B), 'Área total '+fmt(R.cp.At,1)+' m²');
  }

  // Tabla resumen
  function f(nombre, cod, V, A, L, B, extra){
    return '<tr><th scope="row">'+nombre+' <small>'+cod+'</small></th>'
      +'<td>'+(V===null?'—':fmt(V,2))+'</td><td>'+(A===null?'—':fmt(A,2))+'</td>'
      +'<td>'+(L===null?'—':fmt(L,2))+'</td><td>'+(B===null?'—':fmt(B,2))+'</td><td>'+(extra||'')+'</td></tr>';
  }
  var filas = '';
  filas += f('Tanque de recepción','TR-01', R.tr.V, R.tr.L*R.tr.B, R.tr.L, R.tr.B, 'Profundidad total '+fmt(R.tr.H,2)+' m · tolva '+fmt(R.tr.Ht,2)+' m');
  filas += f('Biodigestor','BD-01', R.bd.V, null, R.bd.varios?R.bd.LR:R.bd.L, R.bd.Bsup, R.bd.varios ? fmt(R.bd.N,0)+' biodigestores de '+fmt(R.bd.LR,0)+' m (largo total '+fmt(R.bd.L,1)+' m)' : 'Un biodigestor · zanja de '+fmt(R.bd.h,2)+' m de profundidad');
  filas += f('Tanque de biol','TB-01', R.tb.V, R.tb.L*R.tb.B, R.tb.L, R.tb.B, 'Altura total '+fmt(R.tb.H,2)+' m');
  filas += f('Aplicación del biol','AP-01', null, null, null, null, R.ap.cultivo+' · '+fmt(R.ap.A,2)+' ha/año'+(R.ap.alcanza?'':' (área disponible insuficiente)'));
  if(R.tt){ filas += f('Tratamiento terciario','TT-01', null, R.tt.A, R.tt.L, R.tt.B, R.tt.nombre+' ('+R.tt.sigla+') · trata '+fmt(R.qtt,3)+' m³/d de biol excedente'); }
  filas += f('Lechos de secado','LS-01', null, R.ls.A, R.ls.L, R.ls.B, 'Altura total '+fmt(R.ls.H,2)+' m');
  if(R.ms){ filas += f('Marquesina de secado','MS-01', null, R.ms.A, R.ms.L, R.ms.B, ''); }
  filas += f('Compostaje','CP-01', R.cp.V, R.cp.At, R.cp.L, R.cp.B, fmt(R.cp.N,0)+' pilas · volumen, largo y ancho de cada pila; área total del compostaje');
  document.getElementById('tbl_resumen').innerHTML = filas;
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
  // Insignias "Paso N" según los pasos visibles (en SS la marquesina se oculta)
  vis.forEach(function(id, k){
    var badge = document.querySelector('#'+id+' .paso-badge');
    if(badge){ badge.textContent = 'Paso '+(k+1); }
  });
  document.getElementById('stepCounter').textContent = 'Paso '+(idx+1)+' de '+vis.length;
  document.getElementById('btnPrev').disabled = (idx===0);
  document.getElementById('btnNext').textContent = (idx===vis.length-1) ? 'Finalizar ✓' : 'Siguiente →';
  document.getElementById('btnNext').disabled = false;
  document.querySelectorAll('.flow-dot').forEach(function(dot){
    var id = dot.getAttribute('data-step');
    var pos = vis.indexOf(id);
    dot.parentElement.style.display = (pos!==-1) ? '' : 'none';
    dot.querySelector('.num').textContent = pos + 1; // renumera si se oculta la marquesina
    dot.classList.toggle('current', id===currentStepId);
    dot.classList.toggle('done', pos!==-1 && pos < idx);
    if(id===currentStepId){ dot.setAttribute('aria-current','step'); } else { dot.removeAttribute('aria-current'); }
  });
  var actual = document.querySelector('.flow-dot.current');
  var stepper = document.querySelector('.stepper');
  if(actual && stepper && stepper.scrollWidth > stepper.clientWidth){
    // en celular, desplaza la línea de pasos para que el paso actual quede visible
    var li = actual.parentElement;
    stepper.scrollTo({left: li.offsetLeft - (stepper.clientWidth - li.offsetWidth)/2, behavior:'smooth'});
  }
  window.scrollTo({top:0, behavior:'smooth'});
}
function goToStep(id){ currentStepId = id; renderSteps(); }
function nextStep(){
  var vis = visibleSteps(), idx = vis.indexOf(currentStepId);
  if(idx < vis.length-1){ currentStepId = vis[idx+1]; renderSteps(); }
  else { abrirResumen(); }
}
function prevStep(){
  var vis = visibleSteps(), idx = vis.indexOf(currentStepId);
  if(idx > 0){ currentStepId = vis[idx-1]; renderSteps(); }
}

// Muestra la información de tecnologías de separación solo en el escenario CS
function actualizarBloqueSeparacion(){
  document.getElementById('bloqueSeparacion').style.display = escenario()==='CS' ? '' : 'none';
}

document.querySelectorAll('input[name=escenario]').forEach(function(r){
  r.addEventListener('change', function(){
    document.getElementById('cardCS').classList.toggle('selected', escenario()==='CS');
    document.getElementById('cardSS').classList.toggle('selected', escenario()==='SS');
    actualizarBloqueSeparacion();
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
  // Filas de la tabla de caudales (nombres en lenguaje sencillo)
  function filaCaudal(nombre, valor, nota, clase){
    return '<tr'+(clase?' class="'+clase+'"':'')+'><th scope="row">'+nombre+(nota?'<small>'+nota+'</small>':'')+'</th>'
         + '<td>'+fmt(valor,3)+' m³/d</td></tr>';
  }
  var qcaudRows = '';
  var cajaCaudal = document.getElementById('caudalResultados');
  if(esc==='SS'){
    Q = Q_exc + Q_A_lav;
    qcaudRows += filaCaudal('Caudal de excretas totales', Q_exc, 'Líquidas + sólidas');
    qcaudRows += filaCaudal('Caudal de agua de lavado', Q_A_lav);
    qcaudRows += filaCaudal('Caudal de diseño', Q, 'Total diario que llega al tratamiento', 'total');
    cajaCaudal.className = 'caudal-resultados ss';
    document.getElementById('caudalEscNombre').textContent = 'Sin separación (SS)';
    document.getElementById('caudalEscTexto').textContent = 'La porcinaza ingresa directamente al tratamiento sin realizar una separación inicial de los sólidos.';
  } else {
    var Q_exc_liq = ce*M_exc/rho*(1-fsol);
    var Q_exc_sol = ce*M_exc/rho*fsol;
    var Q_exc_CS = Q_exc_liq + Q_exc_sol*(1-E_S);
    var Q_A_lav_CS = (1-redLav)*Q_A_lav;
    Q = Q_exc_CS + Q_A_lav_CS;
    qcaudRows += filaCaudal('Caudal de excretas líquidas', Q_exc_liq);
    qcaudRows += filaCaudal('Caudal de excretas sólidas', Q_exc_sol);
    qcaudRows += filaCaudal('Excretas que continúan después de la separación', Q_exc_CS, 'Excretas líquidas + parte de los sólidos que no retiene el separador', 'destacada');
    qcaudRows += filaCaudal('Caudal de agua de lavado', Q_A_lav_CS, 'Ajustado: con separación se usa '+fmt(redLav*100,0)+' % menos agua');
    qcaudRows += filaCaudal('Caudal de diseño', Q, 'Total diario que llega al tratamiento', 'total');
    cajaCaudal.className = 'caudal-resultados cs';
    document.getElementById('caudalEscNombre').textContent = 'Con separación (CS)';
    document.getElementById('caudalEscTexto').textContent = 'La porcinaza pasa primero por un sistema de separación sólido-líquido. Una parte de los sólidos es retirada y la fracción restante continúa hacia el tratamiento.';
    document.getElementById('solidosRetirados').textContent = '(aproximadamente '+fmt(Q_exc_sol*E_S,3)+' m³/d)';
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

  function filaDim(nombre, valor, unidad, nota){
    return '<tr><th scope="row">'+nombre+(nota?'<small>'+nota+'</small>':'')+'</th><td><b>'+fmt(valor,2)+'</b> '+unidad+'</td></tr>';
  }
  setTable('tbl_recepcion',
    filaDim('Volumen del tanque', V_TR, 'm³') +
    filaDim('Largo', L_TR, 'm') +
    filaDim('Ancho', B_TR, 'm') +
    filaDim('Profundidad útil', H_TR, 'm', H_TR===1 && L_TR/5<1 ? 'Se adopta la profundidad mínima de 1 m' : '') +
    filaDim('Altura de la tolva', H_tolva, 'm') +
    filaDim('Profundidad total', H_T_TR, 'm', 'Profundidad útil + borde libre y natas (0,4 m)')
  );
  // Cotas en el plano detallado
  var cotas = {pl_largo:L_TR, pl_ancho:B_TR, pl_util:H_TR, pl_tolva:H_tolva, pl_vol:V_TR, pl_util2:H_TR, pl_total:H_T_TR};
  Object.keys(cotas).forEach(function(id){ document.getElementById(id).textContent = fmt(cotas[id],2); });

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
    filaDim('Área superficial total', A_LS, 'm²') +
    filaDim('Largo', L_LS, 'm') +
    filaDim('Ancho', B_LS, 'm') +
    filaDim('Altura de la capa de lodo', h_lodo, 'm') +
    filaDim('Altura total', h_T_lecho, 'm', 'Capa de lodo + medio filtrante ('+fmt(h_lecho,2)+' m) + borde libre ('+fmt(h_BL_lecho,2)+' m)')
  );
  var cotasLS = {pll_ancho:B_LS, pll_largo:L_LS, pll_bl:h_BL_lecho, pll_lodo:h_lodo, pll_area:A_LS, pll_medio:h_lecho, pll_total:h_T_lecho};
  Object.keys(cotasLS).forEach(function(id){ document.getElementById(id).textContent = fmt(cotasLS[id],2); });

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
      filaDim('Área superficial total', A_MS, 'm²') +
      filaDim('Largo', L_MS, 'm') +
      filaDim('Ancho', B_MS, 'm')
    );
    var cotasMQ = {plm_ancho1:B_MS, plm_ancho2:B_MS, plm_largo:L_MS, plm_capa:h_PS, plm_area:A_MS};
    Object.keys(cotasMQ).forEach(function(id){ document.getElementById(id).textContent = fmt(cotasMQ[id],2); });
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
  var N_pilas = t_ll>0 ? Math.ceil(t_cc/t_ll - 1e-9) : 0; // número entero de pilas
  var A_compost = A_P*N_pilas;

  setTable('tbl_compost',
    filaDim('Volumen de la pila', V_pila, 'm³') +
    filaDim('Área superficial de la pila', A_P, 'm²') +
    filaDim('Ancho de la pila', B_P, 'm') +
    filaDim('Largo de la pila', L_P, 'm') +
    '<tr><th scope="row">Número de pilas</th><td><b>'+fmt(N_pilas,0)+'</b></td></tr>' +
    filaDim('Área total requerida', A_compost, 'm²')
  );
  function ponerTodos(clase, valor){ document.querySelectorAll('.'+clase).forEach(function(el){ el.textContent = fmt(valor,2); }); }
  ponerTodos('plc_ancho', B_P); ponerTodos('plc_largo', L_P); ponerTodos('plc_alto', h_P);
  document.getElementById('plc_num').textContent = fmt(N_pilas,0);
  document.getElementById('plc_area').textContent = fmt(A_compost,2);

  // --- 8. Biodigestor ---
  var TRH_bio = num('p_trh_bio'), F_g = num('p_fg');
  var B_inf = num('p_binf'), B_sup = num('p_bsup'), h_z = num('p_hz'), L_R = num('p_lr');

  var Q_B = Q - Q_LH;
  var V_B = Q_B*TRH_bio*F_g;
  var A_zanja = (B_inf+B_sup)/2*h_z;
  var L_B = A_zanja>0 ? V_B/A_zanja : 0;
  var N_B = L_R>0 ? Math.ceil(L_B/L_R) : 0;

  // Número de biodigestores: solo se muestra cuando el largo calculado se acerca
  // (90 % o más) o supera el largo comercial de un biodigestor.
  var UMBRAL_LARGO = 0.9;
  var variosBio = L_R>0 && L_B >= UMBRAL_LARGO*L_R;
  var filasBio =
    filaDim('Volumen del biodigestor', V_B, 'm³') +
    filaDim('Ancho de zanja inferior', B_inf, 'm') +
    filaDim('Ancho de zanja superior', B_sup, 'm') +
    filaDim('Profundidad de la zanja', h_z, 'm');
  var notaBio = document.getElementById('notaBiodigestor');
  if(variosBio){
    filasBio += filaDim('Largo total calculado', L_B, 'm');
    filasBio += '<tr class="fila-destacada"><th scope="row">N.° de biodigestores de '+fmt(L_R,0)+' m</th><td><b>'+fmt(N_B,0)+'</b> '+(N_B===1?'unidad':'unidades')+'</td></tr>';
    notaBio.textContent = 'El largo calculado se acerca o supera el largo comercial de '+fmt(L_R,0)+' m, por eso se recomienda instalar '+fmt(N_B,0)+(N_B===1?' biodigestor':' biodigestores')+' de '+fmt(L_R,0)+' m.';
    notaBio.style.display = '';
    document.getElementById('plb_largo').textContent = 'Largo: '+fmt(L_R,0)+' m (cada uno)';
    document.getElementById('plb_num').textContent = 'Biodigestores de '+fmt(L_R,0)+' m: '+fmt(N_B,0);
  } else {
    filasBio += filaDim('Largo', L_B, 'm');
    notaBio.style.display = 'none';
    document.getElementById('plb_largo').textContent = 'Largo: '+fmt(L_B,2)+' m';
    document.getElementById('plb_num').textContent = 'Un solo biodigestor';
  }
  setTable('tbl_biodigestor', filasBio);
  var cotasBio = {plb_bsup:B_sup, plb_binf:B_inf, plb_hz:h_z, plb_vol:V_B};
  Object.keys(cotasBio).forEach(function(id){ document.getElementById(id).textContent = fmt(cotasBio[id],2); });

  // --- 9. Tanque de biol ---
  var t_A_biol = num('p_ta_biol'), h_BL_biol = num('p_hbl_biol'), h_TB = num('p_htb');
  var V_TB = Q_B*t_A_biol;
  var A_TB = h_TB>0 ? V_TB/h_TB : 0;
  var L_TB = Math.sqrt(2*A_TB);
  var B_TB = L_TB/2;
  var H_T_TB = h_TB + h_BL_biol;

  setTable('tbl_biol',
    filaDim('Volumen del tanque de biol', V_TB, 'm³') +
    filaDim('Largo', L_TB, 'm') +
    filaDim('Ancho', B_TB, 'm') +
    filaDim('Altura útil', h_TB, 'm') +
    filaDim('Altura total', H_T_TB, 'm', 'Altura útil + borde libre ('+fmt(h_BL_biol,2)+' m)')
  );
  var cotasTB = {pltb_ancho:B_TB, pltb_largo:L_TB, pltb_total:H_T_TB, pltb_util:h_TB, pltb_bl:h_BL_biol, pltb_vol:V_TB};
  Object.keys(cotasTB).forEach(function(id){ document.getElementById(id).textContent = fmt(cotasTB[id],2); });

  // --- 10. Destino del biol ---
  // Campos que dependen del escenario (CS / SS) y del cultivo "otro"
  document.querySelectorAll('.solo-cs').forEach(function(el){ el.hidden = (esc!=='CS'); });
  document.querySelectorAll('.solo-ss').forEach(function(el){ el.hidden = (esc!=='SS'); });
  var cultivo = document.getElementById('cultivo').value;
  document.querySelectorAll('.solo-otro').forEach(function(el){ el.hidden = (cultivo!=='otro'); });

  var crops = {
    estrella: {label:'Pasto estrella', T_FN:500, N_R:10},
    boton:    {label:'Botón de oro',   T_FN:520, N_R:6},
    elefante: {label:'Pasto elefante', T_FN:570, N_R:6}
  };
  var c, F_R;
  if(cultivo==='otro'){
    var frecOtro = num('otro_frec');
    c = {label:'Otro cultivo', T_FN:num('otro_tfn')};
    F_R = frecOtro;                       // días entre aspersiones
    c.N_R = frecOtro>0 ? 365/frecOtro : 0;
  } else {
    c = crops[cultivo];
    F_R = 365/c.N_R;
  }
  document.getElementById('ayudaCultivo').textContent = (cultivo==='otro')
    ? 'Ingresa los datos de tu cultivo.'
    : 'Tasa de fijación: '+fmt(c.T_FN,0)+' kg N/ha·año · aspersión cada '+fmt(F_R,1)+' días';

  var N_conc = esc==='CS' ? num('conc_n_cs') : num('conc_n_ss');
  var A_R_anio = c.T_FN>0 ? (Q_B*365*N_conc)/c.T_FN : 0;   // ha/año
  var A_R_dia = F_R>0 ? (A_R_anio*10000)/F_R : 0;          // m²/d
  var L_agua = A_R_dia>0 ? (Q_B/A_R_dia)*1000 : 0;         // mm

  function filaAp(nombre, valor, d, unidad){
    return '<tr><th scope="row">'+nombre+'</th><td><b>'+fmt(valor,d)+'</b> '+unidad+'</td></tr>';
  }
  setTable('tbl_aplicacion',
    filaAp('Área de aplicación anual', A_R_anio, 2, 'ha/año') +
    filaAp('Frecuencia de riego', F_R, 1, 'd') +
    filaAp('Área de aplicación diaria', A_R_dia, 1, 'm²/d') +
    filaAp('Lámina de agua por aplicación', L_agua, 2, 'mm')
  );

  // --- Tratamiento terciario: 6 tecnologías ---
  // Solo se trata el excedente de biol que no se alcanza a asperjar en el área disponible
  var haDisp = num('ha_disp');
  var fracExc = A_R_anio>0 ? Math.min(1, Math.max(0, 1 - haDisp/A_R_anio)) : 1;
  var Q_TT = Q_B*fracExc;        // m³/d que van a tratamiento terciario
  var ce_TT = ce*fracExc;        // CE equivalentes al excedente (para el filtro verde)
  var T = num('t_temp');
  var Co = esc==='CS' ? num('t_co_cs') : num('t_co_ss');
  var Ce = esc==='CS' ? num('t_ce_cs') : num('t_ce_ss');
  function humedal(k20, theta, d, p){
    var kT = 0.75*k20*Math.pow(theta,(T-20));
    return (kT*d*p>0 && Co>0 && Ce>0) ? (Q_TT*(Math.log(Co)-Math.log(Ce)))/(kT*d*p) : 0;
  }
  var tefa = num('t_efa_tre') - num('t_efa_p');
  var areas = {
    hcfs:  humedal(num('t_fs_k20'),  num('t_fs_theta'),  num('t_fs_d'),  num('t_fs_p')),
    hcfss: humedal(num('t_fss_k20'), num('t_fss_theta'), num('t_fss_d'), num('t_fss_p')),
    fia:   num('t_fia_lw')>0 ? Q_TT/num('t_fia_lw') : 0,
    fv:    num('t_fv_m')*Math.pow(3.7*ce_TT, num('t_fv_b')),
    fvdz:  num('t_dz_tre')>0 ? (Q_TT*1000)/num('t_dz_tre') : 0,
    fvefa: tefa>0 ? (num('t_efa_ki')*Q_TT*1000)/tefa : 0
  };
  TECNOLOGIAS.forEach(function(t){
    t.A = areas[t.id]; t.B = Math.sqrt(t.A/4); t.L = t.B*4;
  });
  var minA = Math.min.apply(null, TECNOLOGIAS.map(function(t){ return t.A; }));
  if(!ttSeleccion){ ttSeleccion = TECNOLOGIAS.filter(function(t){ return t.A===minA; })[0].id; }

  var html = '';
  TECNOLOGIAS.forEach(function(t){
    var sel = (t.id===ttSeleccion);
    html += '<tr class="'+(sel?'sel':'')+'">'
      + '<td><input type="radio" name="tt_sel" value="'+t.id+'" id="tt_'+t.id+'"'+(sel?' checked':'')+'></td>'
      + '<td><label for="tt_'+t.id+'">'+t.nombre+' ('+t.sigla+')</label>'
      + (t.A===minA?' <span class="etiqueta etiqueta--area">Menor área</span>':'')
      + (t.cero?' <span class="etiqueta etiqueta--cero">Descarga cero</span>':'')+'</td>'
      + '<td class="num">'+fmt(t.A,1)+'</td><td class="num">'+fmt(t.B,2)+'</td><td class="num">'+fmt(t.L,2)+'</td>'
      + '<td><button type="button" class="btn-ver" onclick="abrirTerciario(\''+t.id+'\')">Ver</button></td></tr>';
  });
  document.getElementById('tbl_terciario').innerHTML = html;

  // --- Veredicto ---
  var alcanza = (haDisp >= A_R_anio && A_R_anio>0);
  var veredicto = document.getElementById('veredicto_biol');
  var ttSel = TECNOLOGIAS.filter(function(t){ return t.id===ttSeleccion; })[0];
  if(alcanza){
    veredicto.className = 'veredicto veredicto--ok';
    veredicto.innerHTML = '<span class="veredicto__ico" aria-hidden="true">✓</span><p>Con <b>'+fmt(haDisp,2)+' ha</b> disponibles alcanzas para aplicar el biol sobre <b>'+c.label+'</b> (se requieren '+fmt(A_R_anio,2)+' ha/año). No necesitas tratamiento terciario.</p>';
  } else {
    veredicto.className = 'veredicto veredicto--alerta';
    veredicto.innerHTML = '<span class="veredicto__ico" aria-hidden="true">!</span><p>El área disponible ('+fmt(haDisp,2)+' ha) no alcanza para aplicar todo el biol sobre <b>'+c.label+'. Se requieren '+fmt(A_R_anio,2)+' ha/año.</b><br>Revisa las alternativas de tratamiento terciario.</p>';
  }
  document.getElementById('bloque_terciario').hidden = alcanza;
  document.getElementById('caudalTerciario').innerHTML = 'Caudal de biol que va a tratamiento terciario: <b>'+fmt(Q_TT,3)+' m³/d</b>'
    + (haDisp>0 ? ' (excedente que no se alcanza a asperjar en las '+fmt(haDisp,2)+' ha disponibles; se asperjan '+fmt(Q_B-Q_TT,3)+' m³/d).' : ' (no hay área disponible para asperjar).');

  // --- Datos para el resumen final ---
  RESUMEN = {
    esc: esc, ce: ce, Q: Q,
    tr:  {V:V_TR, L:L_TR, B:B_TR, H:H_T_TR, Ht:H_tolva},
    bd:  {V:V_B, L:L_B, N:N_B, varios:variosBio, LR:L_R, Binf:B_inf, Bsup:B_sup, h:h_z},
    tb:  {V:V_TB, L:L_TB, B:B_TB, H:H_T_TB},
    ls:  {A:A_LS, L:L_LS, B:B_LS, H:h_T_lecho},
    ms:  esc==='CS' ? {A:A_MS, L:L_MS, B:B_MS} : null,
    cp:  {V:V_pila, A:A_P, L:L_P, B:B_P, N:N_pilas, At:A_compost},
    ap:  {cultivo:c.label, A:A_R_anio, ha:haDisp, alcanza:alcanza},
    tt:  alcanza ? null : ttSel, qtt: Q_TT
  };
}

document.querySelectorAll('input, select').forEach(function(el){
  el.addEventListener('input', calculateAll);
  el.addEventListener('change', calculateAll);
});

actualizarBloqueSeparacion();
calculateAll();
renderSteps();
