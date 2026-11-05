(function(){
// App nativa (Capacitor). En la web siempre es false y nada de lo que depende de esto cambia.
const NATIVE=(()=>{try{return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())}catch(e){return false}})();
const nativePlugin=name=>{try{return (window.Capacitor.Plugins||{})[name]||null}catch(e){return null}};
const PUBLIC_APP_URL='https://petfilearca.netlify.app/';
const I={
  syringe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4M17 7l3-3M19 9l-8.5 8.5a2.1 2.1 0 0 1-3 0l-2-2a2.1 2.1 0 0 1 0-3L14 4M9 11l4 4M5 19l-3 3M14 4l6 6"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>',
  pill:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7"/></svg>',
  steth:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v6a5 5 0 0 0 10 0V3M10 14v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/></svg>',
  scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 9h10M7 13h10M7 17h6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  paw:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M8 14c0-2 1.5-4 4-4s4 2 4 4c0 1.5 1.5 2 1.5 3.5S16 21 14.5 21c-1 0-1.5-.5-2.5-.5s-1.5.5-2.5.5C8 21 6.5 19 6.5 17.5S8 15.5 8 14z"/></svg>'
};

/* ---------- textos ---------- */
const S={
es:{
  months:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],
  nav_home:'Inicio',nav_pets:'Mascotas',nav_agenda:'Agenda',nav_help:'Ayuda',add:'Agregar',
  sync_db:'Sincronizado',sync_conn:'Conectando',sync_local:'En este teléfono',
  today:'hoy',tomorrow:'mañana',yesterday:'ayer',inDays:n=>`en ${n} días`,inMonths:n=>`en ${n} meses`,daysAgo:n=>`hace ${n} días`,overdue:'vencida',
  ageDays:n=>n+(n===1?' día':' días'),ageMonths:n=>n+(n===1?' mes':' meses'),ageYears:(y,r)=>y+' años'+(r?` ${r} m`:''),
  empty_t:'El expediente de tus mascotas, en el bolsillo',empty_d:'Vacunas, desparasitaciones, citas, medicamentos y recetas de cada una, con recordatorios de lo que viene.',empty_btn:'Agregar mi primera mascota',how:'¿Cómo funciona?',
  shot_t:'Así se ve un expediente',shot_cap:'Imagen de referencia. Tus mascotas aparecen así cuando les agregás datos.',shot_aria:'Imagen de ejemplo de un expediente completo',
  morning:'Buenos días',afternoon:'Buenas tardes',evening:'Buenas noches',
  st_late:n=>`Tenés ${n} pendiente${n>1?'s':''} vencido${n>1?'s':''}.`,st_week:n=>`${n} cosa${n>1?'s':''} para esta semana.`,st_ok:'Todo al día por ahora.',
  s_late:'Vencidos',s_week:'Esta semana',s_meds:'Tratamientos',my_pets:'Mis mascotas',
  cta_t:'¿Primera vez en PETFILE?',cta_d:'Mirá cómo usar cada sección en Ayuda.',
  next:'Lo próximo',see_agenda:'Ver agenda',b_late:n=>`${n} vencido${n>1?'s':''}`,b_week:n=>`${n} esta semana`,
  pets_d:'Tocá una para ver su expediente.',pets_none:'Todavía no hay mascotas registradas.',
  ag_d:'Refuerzos, desparasitaciones, citas y fines de tratamiento.',ag_empty:'No hay nada pendiente. Cuando registres una vacuna con fecha de refuerzo o agendes una cita, aparece aquí.',ag_ics:'Pasar todo al calendario del teléfono',
  g_late:'Vencidos',g_week:'Próximos 7 días',g_month:'Este mes',g_later:'Más adelante',
  r_boost:'Refuerzo · ',r_desp:'Desparasitar · ',r_end:'Termina · ',done:'Listo',calendar:'Calendario',
  f_age:'Edad',f_weight:'Peso',f_breed:'Raza',f_sex:'Género',pending:'Pendiente',history:'Historial',add_plus:'+ Agregar',all:'Todo',
  rx_t:'Leer receta',rx_d:'Foto de la receta y se guardan los medicamentos con dosis y duración.',rx_btn:'Escanear',
  hist_empty:'Todavía no hay registros. Tocá el botón + para agregar una vacuna, una cita o un medicamento.',
  until:'hasta',fromRx:'desde receta',del_q:'¿Eliminar?',del:'Eliminar',cancel:'Cancelar',edit:'Editar',back:'Volver',editData:'Editar datos',photoOf:n=>'Foto de '+n,
  pick_t:'¿Qué querés agregar?',pick_rx:'Escanear una receta',pick_rx_d:'Se convierte en medicamentos',
  pf_new:'Nueva mascota',pf_edit:n=>'Editar a '+n,pf_addPh:'Agregar foto',pf_chPh:'Cambiar foto',pf_rmPh:'Quitar foto',pf_name:'Nombre',pf_namePh:'Ej. Luna',pf_species:'Especie',pf_sex:'Género',pf_breedPh:'Ej. Zaguate',pf_weight:'Peso (kg)',pf_weightPh:'Ej. 12.5',pf_birth:'Fecha de nacimiento (aproximada)',pf_err:'Escribí el nombre de la mascota.',pf_add:'Agregar mascota',pf_save:'Guardar cambios',pf_del:'Eliminar mascota',pf_delQ:n=>`¿Eliminar a ${n} y todo su historial?`,pf_delNote:'No se puede deshacer.',pf_delYes:'Sí, eliminar',
  ef_edit:l=>'Editar '+l.toLowerCase(),ef_dose:'Dosis',ef_dosePh:'1 tableta',ef_freq:'Frecuencia',ef_freqPh:'cada 12 h',ef_end:'Termina',ef_vet:'Veterinario o clínica',ef_vetPh:'Ej. Dra. Mora',ef_notes:'Notas',ef_notesPh:'Indicaciones, reacciones, lote, resultados…',ef_err:l=>`Completá ${l.toLowerCase()} y la fecha.`,save:'Guardar',
  t_petAdded:'Mascota agregada',t_saved:'Cambios guardados',t_entryAdded:'Agregado al historial',t_entryUpd:'Registro actualizado',t_entryDel:'Registro eliminado',t_done:'Marcado como hecho',t_petDel:n=>n+' se eliminó',t_imgErr:'No se pudo leer esa imagen.',t_cloudErr:'No se pudo guardar en la nube. Quedó en este teléfono.',t_ics:'Abrí el archivo para agregarlo al calendario',t_icsErr:'No se pudo crear el archivo del calendario.',t_rxSaved:n=>n+(n===1?' medicamento guardado':' medicamentos guardados'),
  rx_reading:'Leyendo la receta',rx_wait:'Buscando medicamentos, dosis y duración…',rx_failT:'No se pudo leer',rx_e_perm:'Hace falta permitir que la app use Claude para leer la receta.',rx_e_rate:'Demasiadas lecturas seguidas. Probá de nuevo en un minuto.',rx_e_img:'Esa imagen no se pudo usar. Probá con una foto JPG o PNG.',rx_e_gen:'No se pudo leer la receta. Probá con una foto más nítida y con buena luz.',ok:'Entendido',
  rx_noneT:'No encontré medicamentos',rx_noneD:'La foto no se leyó con claridad o no parece una receta. Probá con la hoja completa, plana y con buena luz.',close:'Cerrar',rx_manual:'Agregar a mano',
  rx_revT:'Revisá antes de guardar',rx_revD:'Compará con la receta original. Después podés editar cada uno.',rx_label:' · receta',rx_start:'Fecha de inicio',rx_noname:'Sin nombre',rx_days:n=>n+' días',rx_by:n=>'Recetado por '+n,rx_discard:'Descartar',rx_save:'Guardar en el historial',rx_lang:'español',
  species:{Perro:'Perro',Gato:'Gato',Conejo:'Conejo',Ave:'Ave',Otro:'Otro'},
  sexes:{'Macho':'Macho','Hembra':'Hembra','Macho castrado':'Macho castrado','Hembra castrada':'Hembra castrada'},
  types:{
    vacuna:{label:'Vacuna',plural:'Vacunas',hint:'Con fecha de refuerzo',titleL:'Vacuna',titlePh:'Ej. Óctuple, Triple felina, Rabia',dateL:'Aplicada',nextL:'Próximo refuerzo'},
    desp:{label:'Desparasitación',plural:'Desparasitación',hint:'Interna o externa',titleL:'Producto',titlePh:'Ej. Bravecto, Drontal',dateL:'Aplicada',nextL:'Próxima dosis'},
    cita:{label:'Cita',plural:'Citas',hint:'Veterinario, grooming',titleL:'Motivo',titlePh:'Ej. Control anual',dateL:'Fecha y hora'},
    med:{label:'Medicamento',plural:'Medicamentos',hint:'Dosis y frecuencia',titleL:'Medicamento',titlePh:'Ej. Amoxicilina 250 mg',dateL:'Inicio'},
    consulta:{label:'Consulta',plural:'Consultas',hint:'Diagnóstico, exámenes',titleL:'Diagnóstico o motivo',titlePh:'Ej. Otitis, examen de sangre',dateL:'Fecha'},
    dieta:{label:'Receta de dieta',plural:'Dietas',hint:'Ingredientes, preparación y porciones',titleL:'Nombre de la receta',titlePh:'Ej. Pollo con arroz y zanahoria',dateL:'Desde',doseL:'Porción',dosePh:'200 g',freqPh:'2 veces al día',ingL:'Ingredientes',ingPh:'Uno por línea. Ej.\n200 g de pechuga de pollo\n100 g de arroz',stepsL:'Preparación',stepsPh:'Cómo se prepara, paso a paso'}},
  help_t:'Ayuda',help_d:'Cómo usar cada parte de PETFILE.',help_basic:'Lo básico en 3 pasos',help_basicD:'1. Agregá tu mascota. 2. Registrá sus vacunas con la fecha de refuerzo. 3. Revisá la Agenda.',tip:'Consejo:',
  sample:{name:'Canela',sub:'Perro · 3 años 4 m',age:'3 años',breed:'Zaguate',sex:'Hembra castrada',r1:'Desparasitar · Drontal',r1d:'28 oct 2026',r2:'Refuerzo · Óctuple',r2d:'7 nov 2026',r2c:'en 7 días',e1:['Medicamento','27 oct 2026','Gotas óticas','4 gotas por oído · cada 12 h · desde receta'],e2:['Consulta','27 oct 2026','Otitis leve oído derecho','Dra. Mora'],e3:['Vacuna','2 jul 2026','Rabia','Próximo refuerzo: 2 jul 2027']},
  help:[
   ['paw','Agregar una mascota','Foto, nombre y datos básicos',['Tocá el botón <span class="kbd">+</span> de la barra de abajo (desde Inicio, Mascotas o Agenda).','Agregá una foto: podés tomarla en ese momento o elegirla de la galería.','Escribí el nombre y tocá la especie y el género. Raza y peso (en kg) son opcionales.','Poné la fecha de nacimiento, aunque sea aproximada. La edad se calcula sola y se actualiza cada mes.','Tocá <b>Agregar mascota</b>. Se abre su expediente.'],'Podés registrar todas las mascotas que tengas. Cada una tiene su propio historial.'],
   ['edit','El expediente de cada mascota','Qué hay en la ficha',['Desde Inicio o Mascotas, tocá la tarjeta de la mascota.','Arriba ves su foto, edad, peso, raza y género.','En <b>Pendiente</b> aparece lo que le toca: refuerzos, citas o tratamientos por terminar.','En <b>Historial</b> está todo lo registrado, del más reciente al más viejo. Usá los filtros (Vacunas, Citas, Medicamentos…) para ver un solo tipo.','El lápiz de arriba a la derecha sirve para cambiar la foto o los datos, y la flecha de la izquierda para volver.'],'Actualizá el peso cada vez que lo pesen en el veterinario; sirve para calcular dosis.'],
   ['syringe','Vacunas y desparasitaciones','Con fecha de refuerzo',['Dentro del expediente tocá <span class="kbd">+</span> y elegí <b>Vacuna</b> o <b>Desparasitación</b>.','Escribí el nombre (ej. Óctuple, Rabia, Bravecto) y la fecha en que se aplicó.','Poné la fecha del <b>próximo refuerzo</b> o próxima dosis que indicó el veterinario. Con esa fecha la app te avisa.','En Notas podés anotar el número de lote o si tuvo alguna reacción.'],'Si no ponés fecha de refuerzo, queda en el historial pero no genera recordatorio.'],
   ['cal','Citas','Veterinario, grooming, controles',['Tocá <span class="kbd">+</span> y elegí <b>Cita</b>.','Escribí el motivo, la fecha y la hora, y la clínica o el veterinario.','La cita aparece en Pendiente y en la Agenda hasta que pase o la marques como lista.'],'Después de la cita, agregá una <b>Consulta</b> con el diagnóstico para que quede en el historial.'],
   ['pill','Medicamentos y consultas','Tratamientos, diagnósticos, exámenes',['<b>Medicamento</b>: nombre, dosis (ej. 1 tableta), frecuencia (ej. cada 12 horas), fecha de inicio y fecha en que termina.','Los tratamientos activos se cuentan en Inicio, y tres días antes de terminar aparecen en la Agenda.','<b>Consulta</b>: para diagnósticos, resultados de exámenes, cirugías o cualquier nota médica.','<b>Receta de dieta</b>: si tu mascota lleva una dieta, guardá los ingredientes, la preparación, la porción y la frecuencia.'],''],
   ['scan','Escanear una receta','La app lee la receta por vos',['En el expediente, tocá <b>Escanear</b> (o <span class="kbd">+</span> y luego <b>Escanear una receta</b>).','Tomá una foto de la receta: la hoja completa, plana y con buena luz.','En unos segundos aparece la lista de medicamentos con dosis, frecuencia y duración.','Revisá cada uno contra la receta, desmarcá lo que no quieras guardar y confirmá la fecha de inicio.','Tocá <b>Guardar en el historial</b>. Cada medicamento queda registrado y lo podés editar.'],'La primera vez se te pide permiso para que la app lea la imagen. Siempre compará con la receta original antes de guardar.'],
   ['cal','Agenda y recordatorios','Que no se te pase nada',['La pestaña <b>Agenda</b> junta lo pendiente de todas tus mascotas: vencidos, próximos 7 días, este mes y más adelante.','Cuando algo ya se hizo, tocá <b>Listo</b> y sale de la lista.','El número rojo sobre Agenda indica cuántas cosas están vencidas.'],'Con Premium, PETFILE te avisa en el celular.'],
   ['steth','Editar o eliminar','Corregir errores',['Para corregir un registro, tocá <b>Editar</b> debajo de él.','Para borrarlo, tocá <b>Eliminar</b> y confirmá.','Para eliminar una mascota completa, entrá a su expediente, tocá el lápiz y abajo <b>Eliminar mascota</b>. Se borra todo su historial y no se puede deshacer.'],''],
   ['shield','Idioma, datos y pantalla de inicio','Configuración',['Arriba a la derecha cambiás el idioma entre <b>ES</b> (español) y <b>EN</b> (inglés).','Al lado ves si los datos están <b>Sincronizados</b> (guardados en tu cuenta) o solo <b>En este teléfono</b>.','En iPhone: abrí la app en Safari, tocá Compartir y luego <b>Agregar a pantalla de inicio</b>.','En Android: abrí la app en Chrome, tocá el menú ⋮ y luego <b>Agregar a la pantalla principal</b>.'],'Así PETFILE queda como un ícono más en tu teléfono.']
  ]
},
en:{
  months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  nav_home:'Home',nav_pets:'Pets',nav_agenda:'Schedule',nav_help:'Help',add:'Add',
  sync_db:'Synced',sync_conn:'Connecting',sync_local:'On this phone',
  today:'today',tomorrow:'tomorrow',yesterday:'yesterday',inDays:n=>`in ${n} days`,inMonths:n=>`in ${n} months`,daysAgo:n=>`${n} days ago`,overdue:'overdue',
  ageDays:n=>n+(n===1?' day':' days'),ageMonths:n=>n+(n===1?' month':' months'),ageYears:(y,r)=>y+' yrs'+(r?` ${r} mo`:''),
  empty_t:"Your pets' health records, in your pocket",empty_d:'Vaccines, deworming, appointments, medications and prescriptions for each pet, with reminders of what comes next.',empty_btn:'Add my first pet',how:'How does it work?',
  shot_t:'What a pet file looks like',shot_cap:'Sample image. Your pets look like this once you add their records.',shot_aria:'Sample image of a complete pet file',
  morning:'Good morning',afternoon:'Good afternoon',evening:'Good evening',
  st_late:n=>`You have ${n} overdue item${n>1?'s':''}.`,st_week:n=>`${n} thing${n>1?'s':''} due this week.`,st_ok:'All caught up for now.',
  s_late:'Overdue',s_week:'This week',s_meds:'Treatments',my_pets:'My pets',
  cta_t:'New to PETFILE?',cta_d:'See how each section works in Help.',
  next:'Coming up',see_agenda:'See schedule',b_late:n=>`${n} overdue`,b_week:n=>`${n} this week`,
  pets_d:'Tap one to open its file.',pets_none:'No pets added yet.',
  ag_d:'Boosters, deworming, appointments and treatment end dates.',ag_empty:'Nothing pending. When you log a vaccine with a booster date or book an appointment, it shows up here.',ag_ics:'Add everything to my phone calendar',
  g_late:'Overdue',g_week:'Next 7 days',g_month:'This month',g_later:'Later',
  r_boost:'Booster · ',r_desp:'Deworming · ',r_end:'Ends · ',done:'Done',calendar:'Calendar',
  f_age:'Age',f_weight:'Weight',f_breed:'Breed',f_sex:'Sex',pending:'To do',history:'History',add_plus:'+ Add',all:'All',
  rx_t:'Read a prescription',rx_d:'Snap the prescription and the medications are saved with dose and duration.',rx_btn:'Scan',
  hist_empty:'No records yet. Tap the + button to add a vaccine, an appointment or a medication.',
  until:'until',fromRx:'from prescription',del_q:'Delete?',del:'Delete',cancel:'Cancel',edit:'Edit',back:'Back',editData:'Edit details',photoOf:n=>'Photo of '+n,
  pick_t:'What do you want to add?',pick_rx:'Scan a prescription',pick_rx_d:'Turns into medications',
  pf_new:'New pet',pf_edit:n=>'Edit '+n,pf_addPh:'Add photo',pf_chPh:'Change photo',pf_rmPh:'Remove photo',pf_name:'Name',pf_namePh:'e.g. Luna',pf_species:'Species',pf_sex:'Sex',pf_breedPh:'e.g. Labrador',pf_weight:'Weight (kg)',pf_weightPh:'e.g. 12.5',pf_birth:'Date of birth (approximate)',pf_err:"Enter the pet's name.",pf_add:'Add pet',pf_save:'Save changes',pf_del:'Delete pet',pf_delQ:n=>`Delete ${n} and all their history?`,pf_delNote:"This can't be undone.",pf_delYes:'Yes, delete',
  ef_edit:l=>'Edit '+l.toLowerCase(),ef_dose:'Dose',ef_dosePh:'1 tablet',ef_freq:'Frequency',ef_freqPh:'every 12 h',ef_end:'Ends',ef_vet:'Vet or clinic',ef_vetPh:'e.g. Dr. Smith',ef_notes:'Notes',ef_notesPh:'Instructions, reactions, batch, results…',ef_err:l=>`Fill in ${l.toLowerCase()} and the date.`,save:'Save',
  t_petAdded:'Pet added',t_saved:'Changes saved',t_entryAdded:'Added to history',t_entryUpd:'Record updated',t_entryDel:'Record deleted',t_done:'Marked as done',t_petDel:n=>n+' was deleted',t_imgErr:"That image couldn't be read.",t_cloudErr:"Couldn't save to the cloud. It's kept on this phone.",t_ics:'Open the file to add it to your calendar',t_icsErr:"Couldn't create the calendar file.",t_rxSaved:n=>n+(n===1?' medication saved':' medications saved'),
  rx_reading:'Reading the prescription',rx_wait:'Looking for medications, doses and duration…',rx_failT:"Couldn't read it",rx_e_perm:'You need to allow the app to use Claude to read the prescription.',rx_e_rate:'Too many scans in a row. Try again in a minute.',rx_e_img:"That image couldn't be used. Try a JPG or PNG photo.",rx_e_gen:"Couldn't read the prescription. Try a sharper photo with good light.",ok:'Got it',
  rx_noneT:'No medications found',rx_noneD:"The photo wasn't clear or doesn't look like a prescription. Try the whole page, flat and well lit.",close:'Close',rx_manual:'Add manually',
  rx_revT:'Check before saving',rx_revD:'Compare with the original prescription. You can edit each one later.',rx_label:' · prescription',rx_start:'Start date',rx_noname:'No name',rx_days:n=>n+' days',rx_by:n=>'Prescribed by '+n,rx_discard:'Discard',rx_save:'Save to history',rx_lang:'English',
  species:{Perro:'Dog',Gato:'Cat',Conejo:'Rabbit',Ave:'Bird',Otro:'Other'},
  sexes:{'Macho':'Male','Hembra':'Female','Macho castrado':'Neutered male','Hembra castrada':'Spayed female'},
  types:{
    vacuna:{label:'Vaccine',plural:'Vaccines',hint:'With booster date',titleL:'Vaccine',titlePh:'e.g. DHPP, FVRCP, Rabies',dateL:'Given on',nextL:'Next booster'},
    desp:{label:'Deworming',plural:'Deworming',hint:'Internal or external',titleL:'Product',titlePh:'e.g. Bravecto, Drontal',dateL:'Given on',nextL:'Next dose'},
    cita:{label:'Appointment',plural:'Appointments',hint:'Vet, grooming',titleL:'Reason',titlePh:'e.g. Annual checkup',dateL:'Date and time'},
    med:{label:'Medication',plural:'Medications',hint:'Dose and frequency',titleL:'Medication',titlePh:'e.g. Amoxicillin 250 mg',dateL:'Start'},
    consulta:{label:'Visit',plural:'Visits',hint:'Diagnosis, tests',titleL:'Diagnosis or reason',titlePh:'e.g. Ear infection, blood test',dateL:'Date'},
    dieta:{label:'Diet recipe',plural:'Diets',hint:'Ingredients, preparation and portions',titleL:'Recipe name',titlePh:'e.g. Chicken with rice and carrot',dateL:'Since',doseL:'Portion',dosePh:'200 g',freqPh:'twice a day',ingL:'Ingredients',ingPh:'One per line. e.g.\n200 g chicken breast\n100 g rice',stepsL:'Preparation',stepsPh:'How to make it, step by step'}},
  help_t:'Help',help_d:'How to use each part of PETFILE.',help_basic:'The basics in 3 steps',help_basicD:"1. Add your pet. 2. Log their vaccines with the booster date. 3. Check the Schedule.",tip:'Tip:',
  sample:{name:'Canela',sub:'Dog · 3 yrs 4 mo',age:'3 yrs',breed:'Mixed breed',sex:'Spayed female',r1:'Deworming · Drontal',r1d:'Oct 28, 2026',r2:'Booster · DHPP',r2d:'Nov 7, 2026',r2c:'in 7 days',e1:['Medication','Oct 27, 2026','Ear drops','4 drops per ear · every 12 h · from prescription'],e2:['Visit','Oct 27, 2026','Mild right ear infection','Dr. Mora'],e3:['Vaccine','Jul 2, 2026','Rabies','Next booster: Jul 2, 2027']},
  help:[
   ['paw','Add a pet','Photo, name and basic details',['Tap the <span class="kbd">+</span> button in the bottom bar (from Home, Pets or Schedule).','Add a photo: take one right then or pick it from your gallery.','Type the name and tap the species and sex. Breed and weight (in kg) are optional.','Enter the date of birth, even if approximate. Age is calculated automatically and updates every month.','Tap <b>Add pet</b>. Their file opens.'],'You can add as many pets as you have. Each one has its own history.'],
   ['edit',"Each pet's file",'What the file shows',['From Home or Pets, tap the pet\'s card.','At the top you see their photo, age, weight, breed and sex.','<b>To do</b> shows what\'s coming: boosters, appointments or treatments about to end.','<b>History</b> has everything you logged, newest first. Use the filters (Vaccines, Appointments, Medications…) to see one type.','The pencil at the top right changes the photo or details, and the arrow at the left takes you back.'],'Update the weight every time they\'re weighed at the vet; it helps calculate doses.'],
   ['syringe','Vaccines and deworming','With booster date',['Inside the file, tap <span class="kbd">+</span> and choose <b>Vaccine</b> or <b>Deworming</b>.','Type the name (e.g. DHPP, Rabies, Bravecto) and the date it was given.','Enter the <b>next booster</b> or next dose date the vet gave you. The app reminds you based on that date.','Use Notes for the batch number or any reaction.'],"Without a booster date it stays in the history but won't create a reminder."],
   ['cal','Appointments','Vet, grooming, checkups',['Tap <span class="kbd">+</span> and choose <b>Appointment</b>.','Enter the reason, date and time, and the clinic or vet.','It shows in To do and in the Schedule until it passes or you mark it done.'],'After the appointment, add a <b>Visit</b> with the diagnosis so it stays in the history.'],
   ['pill','Medications and visits','Treatments, diagnoses, tests',['<b>Medication</b>: name, dose (e.g. 1 tablet), frequency (e.g. every 12 hours), start date and end date.','Active treatments are counted on Home, and three days before they end they show up in the Schedule.','<b>Visit</b>: for diagnoses, test results, surgeries or any medical note.','<b>Diet recipe</b>: if your pet is on a diet, save the ingredients, preparation, portion and frequency.'],''],
   ['scan','Scan a prescription','The app reads it for you',['In the pet file, tap <b>Scan</b> (or <span class="kbd">+</span> and then <b>Scan a prescription</b>).','Take a photo of the prescription: the whole page, flat and well lit.','In a few seconds you get the list of medications with dose, frequency and duration.','Check each one against the prescription, untick anything you don\'t want and confirm the start date.','Tap <b>Save to history</b>. Each medication is logged and you can edit it.'],'The first time, you\'re asked to allow the app to read the image. Always compare with the original before saving.'],
   ['cal','Schedule and reminders','So nothing slips',['The <b>Schedule</b> tab gathers what\'s pending for all your pets: overdue, next 7 days, this month and later.','When something is done, tap <b>Done</b> and it leaves the list.','The red number on Schedule shows how many items are overdue.'],'With Premium, PETFILE alerts you on your phone.'],
   ['steth','Edit or delete','Fix mistakes',['To fix a record, tap <b>Edit</b> under it.','To remove it, tap <b>Delete</b> and confirm.','To delete a whole pet, open their file, tap the pencil and then <b>Delete pet</b> at the bottom. All their history is erased and it can\'t be undone.'],''],
   ['shield','Language, data and home screen','Settings',['At the top right, switch the language between <b>ES</b> (Spanish) and <b>EN</b> (English).','Next to it you can see whether your data is <b>Synced</b> (saved to your account) or only <b>On this phone</b>.','On iPhone: open the app in Safari, tap Share, then <b>Add to Home Screen</b>.','On Android: open the app in Chrome, tap the ⋮ menu, then <b>Add to Home screen</b>.'],'That way PETFILE sits on your phone like any other app icon.']
  ]
}};

const _svg=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
I.bowl=_svg('<path d="M3 11h18a9 9 0 0 1-6 8.5V21H9v-1.5A9 9 0 0 1 3 11z"/><path d="M9 7c0-1.5 1.5-1.5 1.5-3M14 7c0-1.5 1.5-1.5 1.5-3"/>');
I.camera=_svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>');
I.printer=_svg('<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>');
I.filedown=_svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 12v6M9 15l3 3 3-3"/>');
S.es.types.receta={label:'Receta',plural:'Recetas',hint:'Motivo, fecha y veterinario',titleL:'Motivo',titlePh:'Ej. Otitis, control anual',dateL:'Fecha'};S.en.types.receta={label:'Prescription',plural:'Prescriptions',hint:'Reason, date and vet',titleL:'Reason',titlePh:'E.g. Ear infection, annual checkup',dateL:'Date'};
Object.assign(S.es,{ef_obs:'Observaciones',ph_t:'Fotos de recetas o papeles',ph_d:'Guardá aquí lo que te dio el veterinario: dosis, tratamientos, indicaciones.',ph_add:'Agregar foto',ph_rm:'Quitar foto',ph_view:'Ver foto',ph_max:'Máximo 6 fotos por registro.',ph_up:'Subiendo fotos…',ph_err:'No se pudieron subir las fotos. Revisá la conexión e intentá de nuevo.',ph_att:'Documentos adjuntos',ph_n:n=>n+(n>1?' fotos adjuntas':' foto adjunta'),close:'Cerrar',exp_btn:'Exportar',exp_t:'Exportar historial',exp_print:'Imprimir',exp_printD:'O guardar como PDF desde el menú de impresión',exp_pdf:'Descargar PDF',exp_pdfD:'Un archivo listo para enviar al veterinario',exp_doc:'Historial médico',exp_by:'Creado con PETFILE por Grupo ARCA',exp_gen:'Generado el',exp_page:'Página',exp_ok:'PDF listo',exp_err:'No se pudo crear el PDF. Probá con Imprimir.',prem_export:'Exportar e imprimir el historial es Premium.',ph_free:'La versión gratis permite 5 fotos. Con Premium no hay tope.',prem_photo:'La foto de perfil de tu mascota es Premium.',pf_other:'¿Qué especie es?',pf_otherPh:'Ej. Tortuga, hámster, iguana'});Object.assign(S.en,{ef_obs:'Notes',ph_t:'Photos of prescriptions or papers',ph_d:'Keep what your vet gave you here: doses, treatments, instructions.',ph_add:'Add photo',ph_rm:'Remove photo',ph_view:'View photo',ph_max:'Up to 6 photos per record.',ph_up:'Uploading photos…',ph_err:'Could not upload the photos. Check your connection and try again.',ph_att:'Attached documents',ph_n:n=>n+(n>1?' photos attached':' photo attached'),close:'Close',exp_btn:'Export',exp_t:'Export history',exp_print:'Print',exp_printD:'Or save as PDF from the print menu',exp_pdf:'Download PDF',exp_pdfD:'A file ready to send to your vet',exp_doc:'Medical history',exp_by:'Made with PETFILE by Grupo ARCA',exp_gen:'Generated on',exp_page:'Page',exp_ok:'PDF ready',exp_err:'Could not create the PDF. Try Print instead.',prem_export:'Exporting and printing the history is Premium.',ph_free:'The free version allows 5 photos. Premium has no limit.',prem_photo:"Your pet's profile photo is Premium.",pf_other:'What species is it?',pf_otherPh:'E.g. Turtle, hamster, iguana'});
/* Fotos en registros: apagadas hasta activar Firebase Storage. Para encenderlas: true (ver LEEME.md). */
const RECORD_PHOTOS=false;
const LANGKEY='petfile-lang';
let lang=(()=>{try{const v=localStorage.getItem(LANGKEY);if(v==='es'||v==='en')return v}catch(e){}return (navigator.language||'es').toLowerCase().startsWith('es')?'es':'en'})();
const t=(k,...a)=>{const v=S[lang][k];return typeof v==='function'?v(...a):v};
const TYPE_META={vacuna:{icon:'syringe',color:'--t-vacuna',fields:['title','date','next','vet','notes']},desp:{icon:'shield',color:'--t-desp',fields:['title','date','next','vet','notes']},cita:{icon:'cal',color:'--t-cita',fields:['title','datetime','vet','notes']},med:{icon:'pill',color:'--t-med',fields:['title','dose','freq','date','end','notes']},consulta:{icon:'steth',color:'--t-consulta',fields:['title','date','vet','notes']},receta:{icon:'scan',color:'--t-receta',fields:['title','date','vet','notes']},dieta:{icon:'bowl',color:'--t-dieta',wide:true,fields:['title','ingredients','steps','dose','freq','date','vet','notes']}};
const TT=k=>Object.assign({},TYPE_META[k]||TYPE_META.consulta,S[lang].types[k]||S[lang].types.consulta);
const SPECIES=['Perro','Gato','Conejo','Ave','Otro'],SEXES=['Macho','Hembra','Macho castrado','Hembra castrada'];
const normSex=s=>s==='Hembra esterilizada'?'Hembra castrada':(s||'');
const spL=s=>S[lang].species[s]||s||'';const sxL=s=>S[lang].sexes[normSex(s)]||normSex(s);
let isPremium=()=>true;
const FREE={species:['Perro','Gato','Conejo']};
const premOk=(k,v)=>isPremium()||!FREE[k]||FREE[k].includes(v);
const FREE_PETS=1;
const spOf=p=>p.species==='Otro'&&p.speciesOther?p.speciesOther:spL(p.species);
const petLimit=()=>!isPremium()&&Object.keys(state.pets).length>=FREE_PETS;
const PBADGE=()=>`<span class="pbadge">${t('premium')}</span>`;
const lockBtn=(label,into)=>`<button type="button" class="locked" data-act="premium" data-into="${into}">${esc(label)}${PBADGE()}</button>`;

const state={pets:{},view:{name:'home'},filter:'todo',mode:'local',loading:true,confirmEntry:null,caps:{sample:null,downloads:null,img:null}};
let col=null;const LS='carne-patita-v1';
const $=(s,r=document)=>r.querySelector(s);
/* Solo imágenes en formatos rasterizados: datos propios, vistas previas locales o el bucket de PETFILE. */
const IMG_DATA_RE=/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
const IMG_REMOTE_PREFIX='https://firebasestorage.googleapis.com/v0/b/petfile-15279.firebasestorage.app/o/';
function safeImg(u){
  if(typeof u!=='string')return'';
  if(IMG_DATA_RE.test(u)||u.startsWith(IMG_REMOTE_PREFIX)||u.startsWith('blob:'+location.origin+'/'))return /["'<>\s\\]/.test(u)?'':u;
  return'';
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const todayStr=()=>ymd(new Date());
const addDays=(s,n)=>{const d=new Date(s+'T00:00');d.setDate(d.getDate()+n);return ymd(d)};
const DATE_RE=/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/;
function fmtDate(s){if(typeof s!=='string'||!DATE_RE.test(s))return'';const [d,tm]=s.split('T');const [y,m,dd]=d.split('-');const M=t('months')[+m-1];let o=lang==='en'?`${M} ${+dd}, ${y}`:`${+dd} ${M} ${y}`;if(tm)o+=' · '+tm.slice(0,5);return o}
function dayDiff(s){if(typeof s!=='string'||!DATE_RE.test(s))return null;return Math.round((new Date(s.slice(0,10)+'T00:00')-new Date(todayStr()+'T00:00'))/864e5)}
function rel(n){if(n===0)return t('today');if(n===1)return t('tomorrow');if(n===-1)return t('yesterday');if(n>0)return n<60?t('inDays',n):t('inMonths',Math.round(n/30));return t('daysAgo',-n)}
function ageOf(b){if(typeof b!=='string'||!DATE_RE.test(b))return'—';const s=new Date(b+'T00:00'),n=new Date();let m=(n.getFullYear()-s.getFullYear())*12+n.getMonth()-s.getMonth();if(n.getDate()<s.getDate())m--;if(m<0)return'—';if(m<1)return t('ageDays',Math.floor((n-s)/864e5));if(m<24)return t('ageMonths',m);return t('ageYears',Math.floor(m/12),m%12)}
function toast(msg){document.querySelectorAll('.toast').forEach(x=>x.remove());const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}
const initial=p=>esc((p.name||'?').trim().charAt(0).toUpperCase());
const petsSorted=()=>Object.values(state.pets).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
const avatar=p=>safeImg(p.photo)?`<img class="av" src="${esc(safeImg(p.photo))}" alt="">`:`<div class="av" aria-hidden="true">${initial(p)}</div>`;

/* ---------- configuración (Grupo ARCA) ---------- */
// 1) Configuración de Firebase (Configuración del proyecto → Tus apps → App web).
const FIREBASE_CONFIG={apiKey:"AIzaSyD3pbEsREXAQPUZ1ogYQY66OTeeZVvjc5c",authDomain:"petfile-15279.firebaseapp.com",projectId:"petfile-15279",storageBucket:"petfile-15279.firebasestorage.app",messagingSenderId:"316004028282",appId:"1:316004028282:web:71483962426950a223d0c3"};
// 2) Sin prueba gratis: versión gratis (1 mascota, funciones básicas) o Premium.
const TRIAL_DAYS=0;
// 3) Enlace de compra de Lemon Squeezy (si dice PEGAR, el botón de compra se oculta).
const CHECKOUT_URL="https://grupoarcacr.lemonsqueezy.com/checkout/buy/1cd14fdb-f81f-4600-9ccf-098387e41b77";
const CONTACT_EMAIL="grupoarcacr@gmail.com";
const MAX_FAMILY=6;

Object.assign(S.es,{
  au_inT:'Entrá a tu cuenta',au_upT:'Creá tu cuenta',au_sub:'Gratis para tu mascota. Premium para todas y para tu familia.',au_in:'Entrar',au_up:'Crear cuenta',au_name:'Tu nombre',au_email:'Correo',au_pw:'Contraseña',au_pw2:'Repetí la contraseña',au_pwHint:'Mínimo 6 caracteres',au_show:'Ver',au_hide:'Ocultar',au_forgot:'¿Olvidaste tu contraseña?',
  au_resetT:'Recuperar contraseña',au_resetD:'Te enviamos un enlace a tu correo para crear una contraseña nueva.',au_resetBtn:'Enviar enlace',au_resetSent:'Listo. Revisá tu correo, también la carpeta de spam.',
  au_invited:'<b>Te invitaron a una familia.</b> Creá tu cuenta o entrá, y te unís en el siguiente paso.',
  e_email:'Ese correo no es válido.',e_inuse:'Ya existe una cuenta con ese correo. Entrá con tu contraseña.',e_weak:'La contraseña debe tener al menos 6 caracteres.',e_cred:'Correo o contraseña incorrectos.',e_many:'Demasiados intentos. Esperá unos minutos.',e_net:'Sin conexión. Revisá tu internet.',e_match:'Las contraseñas no coinciden.',e_fill:'Completá todos los campos.',e_gen:'No se pudo completar. Intentá de nuevo.',
  lic_trial:n=>`Premium de prueba · ${n===1?'queda 1 día':`quedan ${n} días`}`,lic_free:'Versión gratis',lic_paidOn:'Premium activo',lic_freeB:'Estás en la versión gratis.',lic_trialB:'Probá todo Premium gratis.',lic_paid:d=>`Licencia activa hasta ${d}`,lic_expT:'La prueba gratis terminó',lic_expD:'Las mascotas y su historial siguen guardados. Activá la licencia para volver a verlos y editarlos.',lic_buy:'Comprar licencia',lic_refresh:'Ya compré, actualizar',lic_contact:'¿Dudas o ya pagaste? Escribinos a',lic_label:'Licencia vencida',lic_noWrite:'La licencia venció. Hay que activarla para guardar cambios.',lic_still:'Todavía no aparece activa. Si ya pagaste, puede tardar un rato en activarse.',lic_ok:'¡Licencia activa! Gracias.',lic_expired:'Vencida',
  ac_t:'Mi cuenta',ac_plan:'Plan de la familia',ac_id:'ID de licencia',ac_idHint:'Envialo junto con tu compra o si necesitás soporte.',ac_copy:'Copiar',ac_copied:'Copiado',ac_logout:'Cerrar sesión',made:'Creado por',loading:'Cargando…',
  t_cloudErr:'No se pudo guardar. Revisá tu conexión.',cfg:'Falta la configuración de Firebase en el archivo (FIREBASE_CONFIG).',
  fam_t:'Mi familia',fam_lockT:'Compartí PETFILE con tu familia',fam_lockD:'Familia es una función Premium. Con la licencia, tu familia usa PETFILE con un solo pago.',fam_lockList:['Hasta 6 personas, cada una con su propia cuenta','Todos ven y editan las mismas mascotas, citas y recetas','Los recordatorios le llegan a cada persona','Solo vos pagás la licencia'],fam_paused:'Las demás personas de tu familia no pueden ver las mascotas hasta que actives Premium.',fam_haveCode:'Me invitaron: tengo un código',fam_cardLocked:'Compartí las mascotas con tu familia.',prem_fam:'Familia es una función Premium.',fam_memberLockT:'Tu familia ya no tiene Premium',fam_d:'Compartí las mascotas y su registro. Cada persona entra con su propia cuenta y solo el administrador paga la licencia.',fam_cardSolo:'Invitá a tu familia para ver y editar juntos el registro de las mascotas.',fam_cardMany:n=>`${n} personas comparten estas mascotas`,
  fam_admin:'Administrador',fam_you:'vos',fam_count:n=>`${n} de ${MAX_FAMILY} personas`,fam_invite:'Invitar a alguien',fam_inviteD:'Compartí este código o el enlace. La otra persona crea su cuenta y se une con él.',fam_code:'Código de invitación',fam_share:'Compartir invitación',fam_copyLink:'Copiar enlace',fam_copyCode:'Copiar código',fam_copiedCode:'Código copiado',fam_newCode:'Cambiar código',fam_newCodeOk:'Código cambiado. El anterior ya no sirve.',
  fam_join:'Unirme a otra familia',fam_joinT:'Unirme a una familia',fam_joinD:'Escribí el código que te compartieron.',fam_codePh:'Ej. K7M2QX',fam_find:'Buscar',fam_of:n=>`Familia de ${n}`,fam_move:n=>n===1?'Tu mascota se va a pasar a esta familia.':`Tus ${n} mascotas se van a pasar a esta familia.`,fam_noPets:'Vas a ver las mascotas de esa familia y podrás agregar y editar registros.',fam_joinBtn:'Unirme',fam_joined:n=>`Ya sos parte de la familia de ${n}`,
  fam_leave:'Salir de la familia',fam_leaveQ:'Las mascotas se quedan con la familia y volvés a tu cuenta personal. ¿Salir?',fam_left:'Saliste de la familia',fam_remove:'Quitar',fam_removeQ:n=>`¿Quitar a ${n}? Va a dejar de ver las mascotas de la familia.`,fam_removedOk:n=>`${n} ya no está en la familia`,fam_removed:'Ya no sos parte de esa familia. Volviste a tu cuenta personal.',
  fam_e_code:'No encontramos ese código. Revisalo e intentá de nuevo.',fam_e_full:'No se pudo unir: esa familia ya tiene 6 personas o no tiene Premium activo. Pedile a quien te invitó que lo revise.',fam_e_owner:'Primero quitá a las otras personas de tu familia para poder unirte a otra.',fam_e_same:'Ya sos parte de esa familia.',
  fam_payer:n=>`La licencia la paga ${n}, el administrador de la familia.`,fam_lockMember:n=>`La licencia de tu familia venció. Pedile a ${n} que la renueve, o salí de la familia para volver a tu cuenta.`,
  ac_key:'¿Ya compraste? Activá tu licencia',ac_keyD:'Pegá el código de licencia que te llegó al correo después de la compra.',ac_keyPh:'Código de licencia',ac_keyBtn:'Activar',ac_keyOk:'¡Listo! Ya tenés Premium.',ac_keyBad:'Ese código no es válido. Revisalo en el correo de la compra.',ac_keyUsed:'Ese código ya se activó en otra cuenta. Escribinos si necesitás ayuda.',ac_keyExp:'Ese código está vencido o fue reembolsado.',ac_keyFail:'No se pudo activar ahora. Intentá de nuevo en unos minutos.',prem_have:'¿Ya compraste? Activá tu código',
  nav_family:'Familia',help_btn:'Ayuda',premium:'Premium',prem_t:'Función Premium',prem_see:'Ver Premium',prem_d:'Un solo pago de ₡5.000, para siempre y para toda tu familia. Desbloqueás:',prem_list:['Mascotas sin límite (la versión gratis permite 1)','Exportar el historial en PDF o imprimirlo','Todas las especies: conejo, ave y otras','Macho castrado y hembra castrada','Fecha de nacimiento con edad automática','Medicamentos y tratamientos','Invitar a tu familia (hasta 6 personas)','Muy pronto: lector de recetas'],prem_pets:'La versión gratis permite 1 mascota.',prem_cal:'Pasar los recordatorios al calendario del teléfono es Premium.',prem_med:'Registrar medicamentos y tratamientos es Premium.',fam_inviteLocked:'Compartir las mascotas con tu familia es parte de Premium.',
  fam_inviteText:(code,link)=>`Te invito a mi familia en PETFILE para llevar juntos el registro de nuestras mascotas.\nCódigo: ${code}\n${link}`,fam_copiedInv:'Invitación copiada'
});
Object.assign(S.en,{
  au_inT:'Sign in',au_upT:'Create your account',au_sub:'Free for your pet. Premium for all of them and your family.',au_in:'Sign in',au_up:'Create account',au_name:'Your name',au_email:'Email',au_pw:'Password',au_pw2:'Repeat password',au_pwHint:'At least 6 characters',au_show:'Show',au_hide:'Hide',au_forgot:'Forgot your password?',
  au_resetT:'Reset password',au_resetD:"We'll email you a link to set a new password.",au_resetBtn:'Send link',au_resetSent:'Done. Check your email, including the spam folder.',
  au_invited:'<b>You were invited to a family.</b> Create your account or sign in, and you\'ll join in the next step.',
  e_email:"That email isn't valid.",e_inuse:'An account with that email already exists. Sign in instead.',e_weak:'The password needs at least 6 characters.',e_cred:'Wrong email or password.',e_many:'Too many attempts. Wait a few minutes.',e_net:'No connection. Check your internet.',e_match:"Passwords don't match.",e_fill:'Fill in all the fields.',e_gen:"Couldn't complete that. Try again.",
  lic_trial:n=>`Premium trial · ${n===1?'1 day left':`${n} days left`}`,lic_free:'Free version',lic_paidOn:'Premium active',lic_freeB:"You're on the free version.",lic_trialB:'Try all of Premium for free.',lic_paid:d=>`License active until ${d}`,lic_expT:'The free trial has ended',lic_expD:'The pets and their history are still saved. Activate the license to see and edit them again.',lic_buy:'Buy license',lic_refresh:'I already paid, refresh',lic_contact:'Questions or already paid? Email us at',lic_label:'License expired',lic_noWrite:'The license expired. It needs to be activated to save changes.',lic_still:"It doesn't show as active yet. If you already paid, it can take a little while.",lic_ok:'License active! Thank you.',lic_expired:'Expired',
  ac_t:'My account',ac_plan:'Family plan',ac_id:'License ID',ac_idHint:'Send it with your purchase or if you need support.',ac_copy:'Copy',ac_copied:'Copied',ac_logout:'Sign out',made:'Made by',loading:'Loading…',
  t_cloudErr:"Couldn't save. Check your connection.",cfg:'Firebase settings are missing in the file (FIREBASE_CONFIG).',
  fam_t:'My family',fam_lockT:'Share PETFILE with your family',fam_lockD:'Family is a Premium feature. With the license, your whole family uses PETFILE for one payment.',fam_lockList:['Up to 6 people, each with their own account','Everyone sees and edits the same pets, appointments and prescriptions','Each person gets the reminders','Only you pay for the license'],fam_paused:"The other people in your family can't see the pets until you activate Premium.",fam_haveCode:'I was invited: I have a code',fam_cardLocked:'Share the pets with your family.',prem_fam:'Family is a Premium feature.',fam_memberLockT:'Your family no longer has Premium',fam_d:'Share the pets and their records. Everyone signs in with their own account and only the admin pays for the license.',fam_cardSolo:'Invite your family to view and edit the pet records together.',fam_cardMany:n=>`${n} people share these pets`,
  fam_admin:'Admin',fam_you:'you',fam_count:n=>`${n} of ${MAX_FAMILY} people`,fam_invite:'Invite someone',fam_inviteD:'Share this code or the link. The other person creates an account and joins with it.',fam_code:'Invite code',fam_share:'Share invite',fam_copyLink:'Copy link',fam_copyCode:'Copy code',fam_copiedCode:'Code copied',fam_newCode:'Change code',fam_newCodeOk:"Code changed. The old one doesn't work anymore.",
  fam_join:'Join another family',fam_joinT:'Join a family',fam_joinD:'Enter the code you were sent.',fam_codePh:'e.g. K7M2QX',fam_find:'Find',fam_of:n=>`${n}'s family`,fam_move:n=>n===1?'Your pet will move to this family.':`Your ${n} pets will move to this family.`,fam_noPets:"You'll see that family's pets and can add and edit records.",fam_joinBtn:'Join',fam_joined:n=>`You're now part of ${n}'s family`,
  fam_leave:'Leave family',fam_leaveQ:'The pets stay with the family and you go back to your personal account. Leave?',fam_left:'You left the family',fam_remove:'Remove',fam_removeQ:n=>`Remove ${n}? They'll stop seeing the family's pets.`,fam_removedOk:n=>`${n} is no longer in the family`,fam_removed:"You're no longer part of that family. You're back on your personal account.",
  fam_e_code:"We couldn't find that code. Check it and try again.",fam_e_full:"Couldn't join: that family already has 6 people or doesn't have Premium active. Ask whoever invited you to check.",fam_e_owner:'First remove the other people from your family to join another one.',fam_e_same:"You're already part of that family.",
  fam_payer:n=>`The license is paid by ${n}, the family admin.`,fam_lockMember:n=>`Your family's license expired. Ask ${n} to renew it, or leave the family to go back to your account.`,
  ac_key:'Already bought it? Activate your license',ac_keyD:'Paste the license code you got by email after your purchase.',ac_keyPh:'License code',ac_keyBtn:'Activate',ac_keyOk:"Done! You have Premium now.",ac_keyBad:"That code isn't valid. Check it in your purchase email.",ac_keyUsed:'That code was already activated on another account. Email us if you need help.',ac_keyExp:'That code has expired or was refunded.',ac_keyFail:"Couldn't activate it right now. Try again in a few minutes.",prem_have:'Already bought it? Activate your code',
  nav_family:'Family',help_btn:'Help',premium:'Premium',prem_t:'Premium feature',prem_see:'See Premium',prem_d:'One payment of ₡5,000, forever and for your whole family. You unlock:',prem_list:['Unlimited pets (the free version allows 1)','Export the history as PDF or print it','Every species: rabbit, bird and more','Neutered male and spayed female','Date of birth with automatic age','Medications and treatments','Invite your family (up to 6 people)','Coming soon: prescription reader'],prem_pets:'The free version allows 1 pet.',prem_cal:'Adding reminders to your phone calendar is Premium.',prem_med:'Logging medications and treatments is Premium.',fam_inviteLocked:'Sharing the pets with your family is part of Premium.',
  fam_inviteText:(code,link)=>`Join my family on PETFILE so we can keep our pets' records together.\nCode: ${code}\n${link}`,fam_copiedInv:'Invite copied'
});
// Ayuda: sin lector de recetas en esta versión; tema de familia; el último tema habla de la cuenta.
S.es.help.splice(5,1);S.en.help.splice(5,1);
S.es.help.splice(S.es.help.length-1,0,['paw','Compartir con tu familia','Varias cuentas, las mismas mascotas',['Abrí la pestaña <b>Familia</b>, en la barra de abajo.','Tocá <b>Compartir invitación</b> y mandale el enlace o el código a la otra persona.','Esa persona crea su cuenta con su correo y entra con el enlace, o en Mi familia toca <b>Unirme a otra familia</b> y escribe el código.','Desde ese momento todos ven y editan las mismas mascotas, y los cambios aparecen al instante en todos los teléfonos.','El administrador puede quitar personas o cambiar el código. Los demás pueden salir cuando quieran.'],`Invitar es parte de Premium. Solo el administrador paga la licencia, y cubre a toda la familia (hasta ${MAX_FAMILY} personas).`]);
S.en.help.splice(S.en.help.length-1,0,['paw','Share with your family','Several accounts, the same pets',['Open the <b>Family</b> tab in the bottom bar.','Tap <b>Share invite</b> and send the link or code to the other person.','They create an account with their email and open the link, or tap <b>Join another family</b> in My family and enter the code.','From then on everyone sees and edits the same pets, and changes show up instantly on every phone.','The admin can remove people or change the code. Everyone else can leave whenever they want.'],`Inviting is part of Premium. Only the admin pays for the license, and it covers the whole family (up to ${MAX_FAMILY} people).`]);
S.es.help[S.es.help.length-1]=['shield','Cuenta, idioma y licencia','Configuración',['Tu información se guarda en la nube: podés entrar desde cualquier teléfono con tu correo y contraseña.','El círculo con tu inicial, arriba a la derecha, abre <b>Mi cuenta</b>: ahí ves tu plan, activás Premium y cerrás sesión.','Al lado cambiás el idioma entre <b>ES</b> (español) y <b>EN</b> (inglés).'],'La versión gratis sirve para 1 mascota con las funciones básicas. Con Premium desbloqueás todo para toda tu familia. Si compraste, activá tu código en Mi cuenta.'];
S.en.help[S.en.help.length-1]=['shield','Account, language and license','Settings',['Your information is saved in the cloud: sign in from any phone with your email and password.','The circle with your initial, at the top right, opens <b>My account</b>: your plan, where you activate Premium, and sign out.','Next to it you switch the language between <b>ES</b> (Spanish) and <b>EN</b> (English).'],'The free version works for 1 pet with the basic features. Premium unlocks everything for your whole family. If you bought it, activate your code in My account.'];

const fb={ready:false,user:null,acct:null,acctRaw:null,fam:null,famId:null,petsCol:null,rawEntries:{},userUnsub:null,famUnsubs:[],authMode:'in',pendingName:'',creating:false,switching:false,ok:!/PEGAR/.test(FIREBASE_CONFIG.apiKey)};
let auth=null,fdb=null;
isPremium=()=>{const s=license().status;return s==='paid'||s==='trial'};
const ARCA_IMG='data:image/jpeg;base64,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';
const arcaBadge=()=>`<div class="arca"><small>${t('made')}</small><img src="${ARCA_IMG}" alt="Grupo ARCA"></div>`;
const FV=()=>firebase.firestore.FieldValue;
const famRef=id=>fdb.collection('families').doc(id);
const userRef=()=>fdb.collection('users').doc(fb.user.uid);
const JOINKEY='petfile-join';
(()=>{try{const c=new URLSearchParams(location.search).get('familia');if(c){sessionStorage.setItem(JOINKEY,c.trim().toUpperCase());history.replaceState(null,'',location.pathname+location.hash)}}catch(e){}})();
const pendingJoin=()=>{try{return sessionStorage.getItem(JOINKEY)||''}catch(e){return''}};
const clearJoin=()=>{try{sessionStorage.removeItem(JOINKEY)}catch(e){}};
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const r=new Uint32Array(6);crypto.getRandomValues(r);return Array.from(r,x=>A[x%A.length]).join('')}
function myName(){return (fb.acct&&fb.acct.name)||(fb.user&&fb.user.displayName)||fb.pendingName||((fb.user&&fb.user.email)||'').split('@')[0]||'?'}
const isFamOwner=()=>!!(fb.fam&&fb.user&&fb.fam.owner===fb.user.uid);
const ownerName=()=>{const f=fb.fam;if(!f)return'';const i=(f.memberInfo||{})[f.owner]||{};return i.name||i.email||'—'};
const inviteLink=code=>(NATIVE?PUBLIC_APP_URL:location.origin+location.pathname)+'?familia='+encodeURIComponent(code);

function license(){
  const f=fb.fam,now=Date.now();
  if(!f)return{status:'trial',days:TRIAL_DAYS,pending:true};
  const ts=f.trialStart&&f.trialStart.toDate?f.trialStart.toDate().getTime():now;
  const paid=f.paidUntil&&f.paidUntil.toDate?f.paidUntil.toDate().getTime():0;
  if(paid>now)return{status:'paid',until:paid};
  const end=ts+TRIAL_DAYS*864e5;
  if(now<end)return{status:'trial',days:Math.max(1,Math.ceil((end-now)/864e5)),end};
  return{status:fb.user&&f.owner&&f.owner!==fb.user.uid?'expired':'free',end};
}
const hasCheckout=()=>!/PEGAR/.test(CHECKOUT_URL);
function checkoutUrl(){try{const u=new URL(CHECKOUT_URL);if(fb.user){u.searchParams.set('checkout[email]',fb.user.email||'');u.searchParams.set('checkout[custom][user_id]',fb.user.uid);if(fb.famId)u.searchParams.set('checkout[custom][family_id]',fb.famId)}return u.toString()}catch(e){return CHECKOUT_URL}}
const canBuy=()=>hasCheckout()&&isFamOwner();
const buyBtn=cls=>NATIVE?(canBuy()?`<button type="button" class="btn ${cls||''}" style="opacity:.55;cursor:default" disabled>${t('prem_soon')}</button>`:''):canBuy()?`<a class="btn ${cls||''}" href="${esc(checkoutUrl())}" target="_blank" rel="noopener">${t('lic_buy')}</a>`:'';
function trialBanner(){
  const L=license();if(L.pending||L.status==='paid'||(NATIVE&&L.status!=='trial'))return'';
  const buy=NATIVE?`<button class="lnk" data-act="premium">${t('prem_see')}</button>`:canBuy()?`<a class="lnk" href="${esc(checkoutUrl())}" target="_blank" rel="noopener">${t('lic_buy')}</a>`:`<button class="lnk" data-act="premium">${t('prem_see')}</button>`;
  return L.status==='trial'?`<div class="trial"><span><b>${t('lic_trial',L.days)}</b><br><span class="muted" style="font-size:13px">${t('lic_trialB')}</span></span>${buy}</div>`
    :`<div class="trial free"><span><b>${t('lic_freeB')}</b></span>${buy}</div>`;
}
function planText(){const L=license();return L.status==='paid'?(new Date(L.until).getFullYear()>=2099?t('lic_paidOn'):t('lic_paid',fmtDate(ymd(new Date(L.until))))):L.status==='trial'?t('lic_trial',L.days):t('lic_free')}
function famMembers(){const f=fb.fam;if(!f)return[];return (f.members||[]).map(id=>Object.assign({id},(f.memberInfo||{})[id]||{})).sort((a,b)=>(a.id===f.owner?-1:b.id===f.owner?1:0))}
function famCard(){
  if(!fb.fam)return'';const m=famMembers();
  if(!isPremium())return `<button class="famcard" data-act="family"><span class="favs"><span class="fav">+</span></span><span style="min-width:0"><b>${t('fam_t')} ${PBADGE()}</b><span>${t('fam_cardLocked')}</span></span></button>`;
  const av=m.slice(0,4).map(x=>`<span class="fav">${esc((x.name||x.email||'?').charAt(0).toUpperCase())}</span>`).join('');
  return `<button class="famcard" data-act="family"><span class="favs">${av}</span><span style="min-width:0"><b>${t('fam_t')}</b><span>${m.length>1?t('fam_cardMany',m.length):t('fam_cardSolo')}</span></span><span class="lnk">${m.length>1?'':t('fam_invite')}</span></button>`;
}

/* almacenamiento con Firebase */
function cloudErr(e){console.warn(e);toast(e&&e.code==='permission-denied'?t('lic_noWrite'):t('t_cloudErr'))}
const plain=x=>JSON.parse(JSON.stringify(x));
const sameVal=(a,b)=>JSON.stringify(a===undefined?null:a)===JSON.stringify(b===undefined?null:b);
/* Mascota nueva: documento completo. Mascota existente: solo los datos que cambiaron; el historial nunca se reescribe aquí. */
function savePet(pet,base){
  if(!base){state.pets[pet.id]=pet;render();if(fb.petsCol)fb.petsCol.doc(pet.id).set(plain(pet)).catch(cloudErr);return}
  const patch={};Object.keys(pet).forEach(k=>{if(k!=='id'&&k!=='entries'&&!sameVal(pet[k],base[k]))patch[k]=pet[k]});
  state.pets[pet.id]=Object.assign({},state.pets[pet.id]||pet,patch);render();
  if(fb.petsCol&&Object.keys(patch).length)fb.petsCol.doc(pet.id).update(plain(patch)).catch(cloudErr);
}
/* Historial: cada cambio quita y agrega solo sus registros, en una operación atómica que Firestore
   combina en el servidor y deja en cola sin conexión. Así dos integrantes nunca se pisan el historial. */
function changeEntries(petId,dropIds,add){
  const raw=fb.rawEntries[petId]||[],gone=x=>x&&dropIds.includes(x.id),remove=raw.filter(gone);add=plain(add);
  fb.rawEntries[petId]=raw.filter(x=>!gone(x)).concat(add);
  const cur=state.pets[petId];if(cur)state.pets[petId]=Object.assign({},cur,{entries:(cur.entries||[]).filter(x=>!gone(x)).concat(add)});
  render();
  if(!fb.petsCol||(!remove.length&&!add.length))return;
  const ref=fb.petsCol.doc(petId),b=fdb.batch();
  if(remove.length)b.update(ref,{entries:FV().arrayRemove(...remove)});
  if(add.length)b.update(ref,{entries:FV().arrayUnion(...add)});
  b.commit().catch(cloudErr);
}
const addEntries=(petId,list)=>changeEntries(petId,[],list);
const deleteEntry=(petId,id)=>changeEntries(petId,[id],[]);
/* Edición: aplica solo lo que esta persona cambió sobre la versión más reciente, para respetar lo que otro integrante haya guardado mientras tanto. */
function saveEntry(petId,base,next){
  const cur=((state.pets[petId]||{}).entries||[]).find(x=>x.id===next.id),out=Object.assign({},cur||base);
  new Set(Object.keys(base).concat(Object.keys(next))).forEach(k=>{if(sameVal(base[k],next[k]))return;if(k in next)out[k]=next[k];else delete out[k]});
  if(cur&&sameVal(cur,out))return;
  changeEntries(petId,[next.id],[out]);
}
function removePet(id){delete fb.rawEntries[id];delete state.pets[id];if(fb.petsCol)fb.petsCol.doc(id).delete().catch(e=>{console.warn(e);toast(t('t_cloudErr'))})}
function stopFamily(){fb.famUnsubs.forEach(u=>{try{u()}catch(e){}});fb.famUnsubs=[];fb.fam=null;fb.famId=null;fb.petsCol=null;fb.rawEntries={};state.pets={}}
function stopAll(){stopFamily();if(fb.userUnsub){try{fb.userUnsub()}catch(e){}fb.userUnsub=null}}

// Crea la familia propia (mismo ID que la cuenta). La prueba usa la fecha de creación de la cuenta.
async function ensureOwnFamily(migrate){
  const uid=fb.user.uid,ref=famRef(uid);
  let snap=null;try{snap=await ref.get()}catch(e){console.warn(e)}
  if(!snap||!snap.exists){
    const code=newCode(),name=myName();const b=fdb.batch();
    b.set(ref,{owner:uid,members:[uid],memberInfo:{[uid]:{name,email:fb.user.email||''}},code,name,trialStart:fb.acctRaw.trialStart});
    b.set(fdb.collection('invites').doc(code),{familyId:uid,ownerName:name});
    await b.commit();
  }
  if(migrate){ // pasar mascotas de la versión anterior (users/{uid}/pets)
    try{const old=await userRef().collection('pets').get();for(const d of old.docs){await ref.collection('pets').doc(d.id).set(d.data())}}catch(e){console.warn('migración',e)}
  }
}
async function backToOwn(notify){
  if(fb.switching||!fb.user)return;fb.switching=true;
  try{await ensureOwnFamily(false);await userRef().update({familyId:fb.user.uid});if(notify)toast(t('fam_removed'))}catch(e){console.warn(e)}
  fb.switching=false;
}
/* Lo que llega de la base puede haberlo escrito otra cuenta: los textos deben ser textos. */
function cleanPet(d){
  const o=Object.assign({},d);
  ['name','species','speciesOther','sex','breed','birth','photo'].forEach(k=>{if(o[k]!=null&&typeof o[k]!=='string')delete o[k]});
  if(typeof o.weight==='number')o.weight=String(o.weight);else if(o.weight!=null&&typeof o.weight!=='string')delete o.weight;
  o.entries=(Array.isArray(o.entries)?o.entries:[]).filter(e=>e&&typeof e==='object'&&!Array.isArray(e)).map(e=>{
    const x=Object.assign({},e);
    ['id','type','title','date','next','end','dose','freq','vet','notes','ingredients','steps'].forEach(k=>{if(x[k]!=null&&typeof x[k]!=='string')delete x[k]});
    if(x.photos!==undefined)x.photos=(Array.isArray(x.photos)?x.photos:[]).filter(f=>f&&typeof f==='object'&&typeof f.url==='string');
    return x});
  /* Dos ediciones del mismo registro sin conexión dejan dos versiones: se muestra la última en llegar al servidor. */
  const last=new Map();o.entries.forEach((e,i)=>{const k=e.id||'#'+i;last.delete(k);last.set(k,e)});o.entries=[...last.values()];
  return o;
}
function listenFamily(fid){
  stopFamily();fb.famId=fid;state.loading=true;render();
  const uid=fb.user.uid;
  fb.famUnsubs.push(famRef(fid).onSnapshot(s=>{
    if(!s.exists){if(fid===uid)ensureOwnFamily(false).catch(e=>console.warn(e));else backToOwn(true);return}
    const d=s.data({serverTimestamps:'estimate'});
    if(!(d.members||[]).includes(uid)){if(fid!==uid)backToOwn(true);return}
    fb.fam=d;render();maybeJoinPending();
  },e=>{console.warn(e);if(fid!==uid)backToOwn(true)}));
  fb.petsCol=famRef(fid).collection('pets');
  fb.famUnsubs.push(fb.petsCol.onSnapshot(snap=>{
    const m={},raw={};snap.docs.forEach(d=>{const x=d.data();raw[d.id]=Array.isArray(x.entries)?x.entries:[];m[d.id]=cleanPet(Object.assign({},x,{id:d.id}))});
    fb.rawEntries=raw;state.pets=m;state.loading=false;render();
  },e=>{console.warn(e);state.loading=false;render()}));
}
function connect(){
  state.caps.downloads={save:async({filename,data})=>{const u=URL.createObjectURL(data);const a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}};
  if(!fb.ok||!window.firebase){fb.ready=true;render();return}
  firebase.initializeApp(FIREBASE_CONFIG);auth=firebase.auth();fdb=firebase.firestore();
  try{fdb.enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
  auth.onAuthStateChanged(u=>{
    stopAll();fb.user=u;fb.acct=null;fb.acctRaw=null;
    if(!u){fb.ready=true;state.loading=false;render();return}
    state.loading=true;fb.ready=true;render();
    const uref=fdb.collection('users').doc(u.uid);
    fb.userUnsub=uref.onSnapshot(snap=>{
      if(!snap.exists){ // cuenta nueva: usuario + familia propia + código, todo junto
        if(fb.creating)return;fb.creating=true;
        const name=fb.pendingName||u.displayName||(u.email||'').split('@')[0],code=newCode(),ts=FV().serverTimestamp();
        const b=fdb.batch();
        b.set(uref,{email:u.email||'',name,lang,trialStart:ts,familyId:u.uid});
        b.set(famRef(u.uid),{owner:u.uid,members:[u.uid],memberInfo:{[u.uid]:{name,email:u.email||''}},code,name,trialStart:ts});
        b.set(fdb.collection('invites').doc(code),{familyId:u.uid,ownerName:name});
        b.commit().catch(e=>{console.warn(e);toast(t('e_gen'))}).finally(()=>{fb.creating=false});
        return;
      }
      fb.acct=snap.data({serverTimestamps:'estimate'});fb.acctRaw=snap.data();
      const fid=fb.acct.familyId;
      if(!fid){ // cuenta de la versión anterior: crear su familia y pasar sus mascotas
        if(fb.creating||snap.metadata.hasPendingWrites)return;fb.creating=true;
        ensureOwnFamily(true).then(()=>uref.update({familyId:u.uid})).catch(e=>{console.warn(e);toast(t('e_gen'))}).finally(()=>{fb.creating=false});
        return;
      }
      if(fid!==fb.famId)listenFamily(fid);else render();
    },e=>{console.warn(e);state.loading=false;render()});
  });
}

/* familia */
async function lookupCode(code){
  const s=await fdb.collection('invites').doc(code).get();
  if(!s.exists)throw{code:'nocode'};return s.data();
}
async function joinFamily(code,inv){
  const uid=fb.user.uid,oldFid=fb.famId,oldIsOwn=oldFid===uid,mine=Object.values(state.pets);
  await famRef(inv.familyId).update({members:FV().arrayUnion(uid),['memberInfo.'+uid]:{name:myName(),email:fb.user.email||''},joinCode:code});
  if(oldIsOwn&&mine.length&&(fb.fam&&(fb.fam.members||[]).length===1)){
    const dest=famRef(inv.familyId).collection('pets');
    for(const p of mine){try{await dest.doc(p.id).set(JSON.parse(JSON.stringify(p)));await famRef(oldFid).collection('pets').doc(p.id).delete().catch(()=>{})}catch(e){console.warn(e)}}
  }
  if(!oldIsOwn){await famRef(oldFid).update({members:FV().arrayRemove(uid),['memberInfo.'+uid]:FV().delete()}).catch(e=>console.warn(e))}
  await userRef().update({familyId:inv.familyId});
}
async function leaveFamily(){
  const uid=fb.user.uid,fid=fb.famId;
  await famRef(fid).update({members:FV().arrayRemove(uid),['memberInfo.'+uid]:FV().delete()});
  await backToOwn(false);
}
async function removeMember(id){await famRef(fb.famId).update({members:FV().arrayRemove(id),['memberInfo.'+id]:FV().delete()})}
async function changeCode(){
  const old=fb.fam.code,code=newCode(),b=fdb.batch();
  b.update(famRef(fb.famId),{code});
  b.set(fdb.collection('invites').doc(code),{familyId:fb.famId,ownerName:myName()});
  if(old)b.delete(fdb.collection('invites').doc(old));
  await b.commit();
}
function maybeJoinPending(){const c=pendingJoin();if(!c||!fb.fam)return;clearJoin();joinSheet(c)}

function familyBody(){
  const f=fb.fam;if(!f)return`<p class="muted" style="text-align:center"><span class="spinner"></span> ${t('loading')}</p>`;
  const uid=fb.user.uid,own=isFamOwner(),m=famMembers(),prem=isPremium();
  if(own&&!prem)return famLocked(m);
  const rows=m.map(x=>`<div class="mrow"><span class="fav">${esc((x.name||x.email||'?').charAt(0).toUpperCase())}</span><div style="min-width:0"><b>${esc(x.name||x.email||'—')}${x.id===uid?` <span class="muted" style="font-weight:500">(${t('fam_you')})</span>`:''}</b><span>${esc(x.email||'')}</span></div>${x.id===f.owner?`<span class="tagsm">${t('fam_admin')}</span>`:own?`<button class="lnk" style="color:var(--warn)" data-act="fam-remove" data-id="${esc(x.id)}">${t('fam_remove')}</button>`:''}</div><div class="mconf" id="mc-${esc(x.id)}"></div>`).join('');
  const invite=!own?`<p class="muted" style="margin:0;font-size:13.5px">${esc(t('fam_payer',ownerName()))}</p>`
    :prem?`<div class="invbox"><b>${t('fam_invite')}</b><span class="muted" style="font-size:13.5px">${t('fam_inviteD')}</span>
      <div class="codebig" id="famcode">${esc(f.code||'')}</div>
      <button class="btn dark block" data-act="fam-share">${t('fam_share')}</button>
      <div style="display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center"><button class="lnk" data-act="fam-copycode">${t('fam_copyCode')}</button><button class="lnk" data-act="fam-copylink">${t('fam_copyLink')}</button><button class="lnk" style="color:var(--muted)" data-act="fam-newcode">${t('fam_newCode')}</button></div></div>`
    :`<div class="invbox"><b>${t('fam_invite')}${PBADGE()}</b><span class="muted" style="font-size:13.5px">${t('fam_inviteLocked')}</span>
      <div class="codebig blur" aria-hidden="true">K7M2QX</div>
      <button class="btn dark block" data-act="premium" data-into="fam-prem">${t('prem_see')}</button><div id="fam-prem" hidden></div></div>`;
  return `<div class="list">${rows}</div><span class="muted" style="font-size:12.5px;margin-top:-12px">${t('fam_count',m.length)}</span>${invite}
  <div id="famfoot" style="display:flex;flex-direction:column;gap:8px">${own?'':`<button class="btn ghost block" style="color:var(--warn)" data-act="fam-leave-ask">${t('fam_leave')}</button>`}<button class="btn ghost block" data-act="fam-join">${t('fam_join')}</button></div>`;
}
function famLocked(m){
  const others=m.filter(x=>x.id!==fb.user.uid);
  const rows=others.map(x=>`<div class="mrow"><span class="fav">${esc((x.name||x.email||'?').charAt(0).toUpperCase())}</span><div style="min-width:0"><b>${esc(x.name||x.email||'—')}</b><span>${esc(x.email||'')}</span></div><button class="lnk" style="color:var(--warn)" data-act="fam-remove" data-id="${esc(x.id)}">${t('fam_remove')}</button></div><div class="mconf" id="mc-${esc(x.id)}"></div>`).join('');
  return `<div class="invbox famlock"><span class="favs" aria-hidden="true"><span class="fav">A</span><span class="fav">M</span><span class="fav">S</span><span class="fav">+</span></span>
  <b style="font-size:18px">${t('fam_lockT')} ${PBADGE()}</b><span class="muted" style="font-size:14px">${t('fam_lockD')}</span>
  <ul>${t('fam_lockList').map(x=>`<li>${x}</li>`).join('')}</ul>
  <button class="btn dark block" data-act="premium" data-why="prem_fam" data-into="fam-prem">${t('prem_see')}</button><div id="fam-prem" hidden></div></div>
  ${others.length?`<p class="muted" style="margin:0;font-size:13.5px">${t('fam_paused')}</p><div class="list">${rows}</div>`:''}
  <div id="famfoot" style="display:flex;flex-direction:column;gap:8px"><button class="btn ghost block" data-act="fam-join">${t('fam_haveCode')}</button></div>`;
}
function familyView(){return `<section class="hello"><h1>${t('fam_t')}</h1><p>${t('fam_d')}</p></section>`+familyBody()}
function familySheet(){closeSheet();if(state.view.name==='familia')render();else go('familia')}
/* Premium */
function premiumBox(why){
  const own=isFamOwner();
  return `<div class="prembox"><b>${t('prem_t')}</b>${why?`<span style="font-weight:700">${t(why)}</span>`:''}<span>${t('prem_d')}</span><ul>${t('prem_list').map(x=>`<li>${x}</li>`).join('')}</ul>
  ${own?(buyBtn('dark block')||`<span class="muted" style="font-size:13px">${t('lic_contact')} <b style="color:var(--ink);user-select:all">${CONTACT_EMAIL}</b></span>`):`<span style="font-size:13px">${esc(t('fam_payer',ownerName()))}</span>`}<button class="lnk" data-act="account" style="align-self:flex-start">${t('prem_have')}</button></div>`;
}
function premiumSheet(why){openSheet(premiumBox(why))}
function keyBox(){return `<form id="keyform" class="keybox" novalidate><b>${t('ac_key')}</b><span class="muted" style="font-size:13px">${t('ac_keyD')}</span>
  <div style="display:flex;gap:8px"><input id="lic-key" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${t('ac_keyPh')}"><button class="btn sm dark" type="submit" id="lic-go">${t('ac_keyBtn')}</button></div><div id="lic-msg" class="err" role="alert" hidden></div></form>`}
async function activateKey(ev){
  ev.preventDefault();const key=$('#lic-key').value.trim(),msg=$('#lic-msg'),go=$('#lic-go');msg.hidden=true;
  if(key.length<8){msg.textContent=t('ac_keyBad');msg.hidden=false;return}
  go.disabled=true;go.innerHTML='<span class="spinner"></span>';
  try{
    const tok=await fb.user.getIdToken();
    const r=await fetch('/.netlify/functions/activate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({key})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw{code:j.error||'fail'};
    closeSheet();toast(t('ac_keyOk'));
  }catch(e){console.warn(e);const c=e&&e.code;msg.textContent=c==='invalid'?t('ac_keyBad'):c==='used'?t('ac_keyUsed'):c==='expired'?t('ac_keyExp'):t('ac_keyFail');msg.hidden=false;go.disabled=false;go.textContent=t('ac_keyBtn')}
}
document.addEventListener('submit',ev=>{if(ev.target&&ev.target.id==='keyform')activateKey(ev)});
function joinSheet(prefill){
  openSheet(`<div><h2>${t('fam_joinT')}</h2><p class="muted" style="margin:4px 0 0">${t('fam_joinD')}</p></div>
  <form id="joinform" class="fields" novalidate><label class="f full">${t('fam_code')}<input id="jn-code" autocapitalize="characters" autocomplete="off" maxlength="6" placeholder="${t('fam_codePh')}" value="${esc(prefill||'')}" style="font-family:var(--f-mono);letter-spacing:.2em;text-transform:uppercase"></label>
  <div id="jn-msg" class="full err" role="alert" hidden></div><button class="btn dark block full" type="submit" id="jn-go">${t('fam_find')}</button></form><div id="jn-res"></div>`);
  const go=async ev=>{ev&&ev.preventDefault();const c=$('#jn-code').value.trim().toUpperCase(),msg=$('#jn-msg');msg.hidden=true;$('#jn-res').innerHTML='';
    if(c.length<6){msg.textContent=t('fam_e_code');msg.hidden=false;return}
    try{const inv=await lookupCode(c);
      if(inv.familyId===fb.famId){msg.textContent=t('fam_e_same');msg.hidden=false;return}
      if(isFamOwner()&&(fb.fam.members||[]).length>1){msg.textContent=t('fam_e_owner');msg.hidden=false;return}
      const n=Object.keys(state.pets).length,moving=fb.famId===fb.user.uid&&n>0;
      $('#jn-res').innerHTML=`<div class="invbox" style="text-align:left"><b style="font-size:17px">${esc(t('fam_of',inv.ownerName||'—'))}</b><span class="muted" style="font-size:14px">${moving?t('fam_move',n):t('fam_noPets')}</span><button class="btn dark block" id="jn-confirm">${t('fam_joinBtn')}</button></div>`;
      $('#jn-confirm').onclick=async()=>{const b=$('#jn-confirm');b.disabled=true;b.innerHTML='<span class="spinner"></span>';
        try{await joinFamily(c,inv);closeSheet();toast(t('fam_joined',inv.ownerName||''));go_home()}catch(e){console.warn(e);b.disabled=false;b.textContent=t('fam_joinBtn');msg.textContent=e&&e.code==='permission-denied'?t('fam_e_full'):t('e_gen');msg.hidden=false}};
    }catch(e){console.warn(e);msg.textContent=e&&e.code==='nocode'?t('fam_e_code'):e&&String(e.code).includes('unavailable')?t('e_net'):t('fam_e_code');msg.hidden=false}};
  $('#joinform').addEventListener('submit',go);if(prefill)go();
}
function go_home(){state.view={name:'home'};try{history.replaceState(null,'',location.pathname)}catch(e){}render()}
async function shareInvite(){
  const code=fb.fam.code,link=inviteLink(code),text=t('fam_inviteText',code,link);
  const NS=NATIVE&&nativePlugin('Share');
  if(NS){try{await NS.share({title:'PETFILE',text,dialogTitle:t('fam_share')});return}catch(e){if(/cancel/i.test((e&&e.message)||''))return;console.warn(e)}}
  if(navigator.share){try{await navigator.share({title:'PETFILE',text});return}catch(e){if(e&&e.name==='AbortError')return}}
  copyText(text,t('fam_copiedInv'));
}
function copyText(v,okMsg){const ok=()=>toast(okMsg||t('ac_copied'));if(navigator.clipboard)navigator.clipboard.writeText(v).then(ok,()=>toast(v));else toast(v)}

/* pantallas de cuenta */
function authView(){
  const up=fb.authMode==='up';
  const pw=(id,ph,ac)=>`<div class="pw"><input id="${id}" type="password" autocomplete="${ac}" placeholder="${ph}"><button type="button" data-act="toggle-pw" data-for="${id}">${t('au_show')}</button></div>`;
  return `<div class="auth"><div class="auth-brand"><span class="mark" aria-hidden="true"></span><span class="word" aria-hidden="true"></span></div>
  <div><h1>${up?t('au_upT'):t('au_inT')}</h1><p class="muted" style="text-align:center;margin:6px 0 0">${t('au_sub')}</p></div>
  ${pendingJoin()?`<div class="trial" style="display:block">${t('au_invited')}</div>`:''}
  <div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" data-act="auth-tab" data-v="in" aria-pressed="${!up}">${t('au_in')}</button><button type="button" data-act="auth-tab" data-v="up" aria-pressed="${up}">${t('au_up')}</button></div>
  <form id="authform" class="fields" novalidate>
    ${up?`<label class="f full">${t('au_name')}<input id="au-name" autocomplete="name"></label>`:''}
    <label class="f full">${t('au_email')}<input id="au-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off"></label>
    <label class="f full">${t('au_pw')}${pw('au-pw',up?t('au_pwHint'):'',up?'new-password':'current-password')}</label>
    ${up?`<label class="f full">${t('au_pw2')}${pw('au-pw2','','new-password')}</label>`:''}
    <div id="au-err" class="full err" role="alert" hidden></div>
    ${up&&typeof consentLine==='function'?consentLine():''}
    <button class="btn dark block full" type="submit" id="au-go">${up?t('au_up'):t('au_in')}</button>
    ${up?'':`<button type="button" class="lnk full" data-act="forgot" style="justify-self:center">${t('au_forgot')}</button>`}
  </form>${NATIVE?'':`<button type="button" class="lnk" data-act="install" style="align-self:center">${t('in_link')}</button>`}${arcaBadge()}</div>`;
}
function authErr(e){const c=(e&&e.code)||'';return c.includes('invalid-email')?t('e_email'):c.includes('email-already')?t('e_inuse'):c.includes('weak-password')?t('e_weak'):(c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found')||c.includes('invalid-login'))?t('e_cred'):c.includes('too-many')?t('e_many'):c.includes('network')?t('e_net'):t('e_gen')}
function bindAuth(){
  const f=$('#authform');if(!f)return;
  f.addEventListener('submit',async ev=>{ev.preventDefault();const up=fb.authMode==='up';const err=$('#au-err');err.hidden=true;
    const email=$('#au-email').value.trim(),pw=$('#au-pw').value,name=up?$('#au-name').value.trim():'';
    const show=m=>{err.textContent=m;err.hidden=false};
    if(!email||!pw||(up&&!name))return show(t('e_fill'));
    if(up&&pw!==$('#au-pw2').value)return show(t('e_match'));
    const go=$('#au-go');go.disabled=true;go.innerHTML='<span class="spinner"></span>';
    try{auth.languageCode=lang;
      if(up){fb.pendingName=name;const c=await auth.createUserWithEmailAndPassword(email,pw);try{await c.user.updateProfile({displayName:name})}catch(e){}}
      else await auth.signInWithEmailAndPassword(email,pw);
    }catch(e){console.warn(e);show(authErr(e));go.disabled=false;go.textContent=up?t('au_up'):t('au_in')}
  });
}
function forgotSheet(){
  const pre=($('#au-email')||{}).value||'';
  openSheet(`<h2>${t('au_resetT')}</h2><p class="muted" style="margin:0">${t('au_resetD')}</p><form id="rsform" class="fields" novalidate><label class="f full">${t('au_email')}<input id="rs-email" type="email" inputmode="email" autocapitalize="off" value="${esc(pre)}"></label><div id="rs-msg" class="full err" role="status" hidden></div><button class="btn dark block full" type="submit">${t('au_resetBtn')}</button></form>`);
  $('#rsform').addEventListener('submit',async ev=>{ev.preventDefault();const m=$('#rs-msg');const e=$('#rs-email').value.trim();if(!e){m.textContent=t('e_fill');m.hidden=false;return}
    try{auth.languageCode=lang;await auth.sendPasswordResetEmail(e);m.style.color='var(--ok)';m.textContent=t('au_resetSent')}catch(x){m.style.color='';m.textContent=authErr(x)}m.hidden=false});
}
function accountSheet(){
  const u=fb.user;if(!u)return;const L=license();const nm=myName();const own=isFamOwner();
  openSheet(`<div style="display:flex;gap:12px;align-items:center"><span class="acct" style="width:48px;height:48px;font-size:20px">${esc(nm.charAt(0).toUpperCase())}</span><div style="min-width:0"><h2>${t('ac_t')}</h2><div class="muted" style="font-size:14px;overflow-wrap:anywhere">${esc(nm)} · ${esc(u.email||'')}</div></div></div>
  <div class="list" style="padding:14px;display:flex;flex-direction:column;gap:6px"><span class="label">${t('ac_plan')}</span><b style="font-size:16px;${L.status==='free'?'color:var(--warn)':''}">${planText()}</b>${L.status!=='paid'?(own?buyBtn('dark block'):`<span class="muted" style="font-size:13.5px">${esc(t('fam_payer',ownerName()))}</span>`):''}</div>
  ${L.status!=='paid'?keyBox():''}
  ${famCard()}
  ${own?`<div style="display:flex;flex-direction:column;gap:6px"><span class="label">${t('ac_id')}</span><div style="display:flex;gap:8px;align-items:center"><div class="idbox" style="flex:1">${esc(fb.famId||u.uid)}</div><button class="btn sm ghost" data-act="copy-uid">${t('ac_copy')}</button></div><span class="muted" style="font-size:12.5px">${t('ac_idHint')}</span></div>`:''}
  ${typeof notifCard==='function'?notifCard():''}${feedbackCard()}<button class="btn ghost block" data-act="logout">${t('ac_logout')}</button>${typeof legalLinks==='function'?legalLinks()+deleteBtn():''}${arcaBadge()}`);
}
function lockView(){
  const own=isFamOwner();
  return `<div class="lock" role="dialog" aria-modal="true" aria-labelledby="lk-t"><div class="card"><span class="tag">${t('lic_label')}</span><h2 id="lk-t">${own?t('lic_expT'):t('fam_memberLockT')}</h2><p class="muted" style="margin:0">${own?t('lic_expD'):esc(t('fam_lockMember',ownerName()))}</p>
  ${own?buyBtn('dark block'):''}<button class="btn ghost block" data-act="refresh-lic">${t('lic_refresh')}</button>
  ${own?'':`<button class="btn ghost block" style="color:var(--warn)" data-act="fam-leave-ask">${t('fam_leave')}</button><div id="famfoot"></div>`}
  <p style="margin:0;font-size:13px" class="muted">${t('lic_contact')} <b style="color:var(--ink);user-select:all">${CONTACT_EMAIL}</b></p>
  <div style="display:flex;justify-content:center;gap:16px"><button class="lnk" data-act="account">${t('ac_t')}</button><button class="lnk" style="color:var(--muted)" data-act="logout">${t('ac_logout')}</button></div>${arcaBadge()}</div></div>`;
}
function render(){
  ntQueue();
  document.documentElement.lang=lang;
  document.querySelectorAll('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===lang));
  const app=$('#app'),acct=$('#acct'),lock=$('#lock');
  if(!fb.ok){document.body.classList.add('signed-out');app.innerHTML=`<div class="empty"><p>${t('cfg')}</p></div>${arcaBadge()}`;return}
  if(!fb.ready){app.innerHTML=`<p class="muted" style="text-align:center;padding-top:40px"><span class="spinner"></span> ${t('loading')}</p>`;return}
  if(!fb.user){document.body.classList.add('signed-out');acct.hidden=true;lock.innerHTML='';app.classList.remove('locked');
    const keep=$('#au-email')?{e:$('#au-email').value}:null;app.innerHTML=authView();if(keep)$('#au-email').value=keep.e;bindAuth();return}
  document.body.classList.remove('signed-out');acct.hidden=false;
  acct.textContent=myName().trim().charAt(0).toUpperCase();acct.setAttribute('aria-label',t('ac_t'));
  renderMain();
  $('#nb-familia').setAttribute('aria-current',state.view.name==='familia'?'page':'false');$('#nb-ayuda').setAttribute('aria-label',t('help_btn'));
  const exp=!!fb.fam&&license().status==='expired';
  if(exp)fb.wasLocked=true;else if(fb.wasLocked&&fb.fam){fb.wasLocked=false;location.reload();return}
  app.classList.toggle('locked',exp);app.setAttribute('aria-hidden',exp?'true':'false');
  if(exp){if(!lock.innerHTML||lock.dataset.l!==lang){lock.innerHTML=lockView();lock.dataset.l=lang}}else lock.innerHTML='';
}
const WRITE_ACTS=new Set(['fab','new-pet','edit-pet','new-entry','edit-entry','ask-del','del-entry','done','pick-rx']);
document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
  if(WRITE_ACTS.has(a)&&fb.user&&fb.fam&&license().status==='expired'){ev.stopImmediatePropagation();toast(t('lic_noWrite'));return}
  const stop=()=>ev.stopImmediatePropagation();
  if(fb.user&&fb.fam&&!isPremium()){
    if((a==='new-pet'||(a==='fab'&&state.view.name!=='pet'))&&petLimit()){stop();closeSheet();premiumSheet('prem_pets');return}
    
  }
  switch(a){
    case'account':stop();accountSheet();break;
    case'logout':stop();closeSheet();ntClearNative();auth&&auth.signOut();try{history.replaceState(null,'',location.pathname)}catch(e){}state.view={name:'home'};break;
    case'auth-tab':stop();fb.authMode=el.dataset.v;render();break;
    case'forgot':stop();forgotSheet();break;
    case'toggle-pw':{stop();const i=$('#'+el.dataset.for);if(i){const s=i.type==='password';i.type=s?'text':'password';el.textContent=s?t('au_hide'):t('au_show')}break}
    case'copy-uid':stop();copyText(fb.famId||'',t('ac_copied'));break;
    case'refresh-lic':{stop();if(!fb.famId)break;el.disabled=true;el.innerHTML='<span class="spinner"></span>';
      famRef(fb.famId).get({source:'server'}).then(s=>{fb.fam=s.data({serverTimestamps:'estimate'});$('#lock').innerHTML='';render();toast(license().status==='expired'?t('lic_still'):t('lic_ok'))}).catch(()=>{toast(t('e_net'));$('#lock').innerHTML='';render()});break}
    case'family':stop();familySheet();break;
    case'familia':stop();closeSheet();go('familia');break;
    case'premium':{stop();const box=el.dataset.into&&$('#'+el.dataset.into);if(box){box.innerHTML=premiumBox(el.dataset.why);box.hidden=false;box.scrollIntoView({block:'nearest',behavior:'smooth'})}else premiumSheet(el.dataset.why);break}
    case'fam-share':stop();shareInvite();break;
    case'fam-copycode':stop();copyText(fb.fam.code,t('fam_copiedCode'));break;
    case'fam-copylink':stop();copyText(inviteLink(fb.fam.code),t('fam_copiedInv'));break;
    case'fam-newcode':stop();changeCode().then(()=>{toast(t('fam_newCodeOk'));setTimeout(familySheet,300)}).catch(e=>{console.warn(e);toast(t('e_gen'))});break;
    case'fam-join':stop();joinSheet('');break;
    case'fam-leave-ask':{stop();const box=$('#famfoot');if(box)box.innerHTML=`<div class="confirm"><span style="font-size:14px">${t('fam_leaveQ')}</span><div style="display:flex;gap:8px"><button class="btn sm danger" data-act="fam-leave">${t('fam_leave')}</button><button class="btn sm ghost" data-act="close">${t('cancel')}</button></div></div>`;break}
    case'fam-leave':stop();el.disabled=true;leaveFamily().then(()=>{closeSheet();$('#lock').innerHTML='';toast(t('fam_left'));go_home()}).catch(e=>{console.warn(e);toast(t('e_gen'))});break;
    case'fam-remove':{stop();const id=el.dataset.id,info=(fb.fam.memberInfo||{})[id]||{},n=info.name||info.email||'';const box=$('#mc-'+CSS.escape(id));if(box)box.innerHTML=`<div class="confirm" style="margin:0 12px 12px"><span style="font-size:14px">${esc(t('fam_removeQ',n))}</span><div style="display:flex;gap:8px"><button class="btn sm danger" data-act="fam-remove-yes" data-id="${esc(id)}">${t('fam_remove')}</button><button class="btn sm ghost" data-act="family">${t('cancel')}</button></div></div>`;break}
    case'fam-remove-yes':{stop();const id=el.dataset.id,info=(fb.fam.memberInfo||{})[id]||{};removeMember(id).then(()=>{toast(t('fam_removedOk',info.name||info.email||''));setTimeout(familySheet,300)}).catch(e=>{console.warn(e);toast(t('e_gen'))});break}
  }
},true);

/* ---------- instalar en la pantalla de inicio ---------- */
Object.assign(S.es,{
  in_bannerT:'Instalá PETFILE en tu teléfono',in_bannerD:'Queda como una app más, con su ícono y sin la barra del navegador.',in_see:'Ver cómo',in_later:'Ahora no',
  in_t:'Instalar como app',in_d:'Elegí tu teléfono y seguí los pasos. Toma menos de un minuto.',in_now:'Instalar ahora',in_done:'Cuando termines, buscá el ícono de PETFILE en tu pantalla de inicio y abrila desde ahí.',
  in_link:'¿Cómo instalarla en mi teléfono?',in_card:'Guía paso a paso para iPhone, Samsung y otros Android.',in_installed:'PETFILE ya está instalada en este teléfono.',
  in_wa:'<b>¿La abriste desde WhatsApp, Instagram o Facebook?</b> Primero tocá el menú de esa pantalla (⋮ o •••) y elegí <b>Abrir en el navegador</b>. Desde ahí sí se puede instalar.',
  in_os:{
    ios:['iPhone / iPad',['Abrí el enlace de PETFILE en <b>Safari</b>.','Tocá el botón <b>Compartir</b>: el cuadrado con una flecha hacia arriba. En iPhone está abajo; en iPad, arriba a la derecha. Si no lo ves, tocá <b>•••</b> y luego <b>Compartir</b>.','Bajá en la lista y tocá <b>Agregar a pantalla de inicio</b>.','Revisá que el nombre diga PETFILE y tocá <b>Agregar</b>.']],
    samsung:['Samsung',['Abrí el enlace de PETFILE en <b>Samsung Internet</b>, el navegador de Samsung.','Tocá el menú <b>☰</b> (tres rayas), abajo a la derecha.','Tocá <b>Agregar página a</b> y luego <b>Pantalla de inicio</b>. Si arriba en la barra aparece un ícono de descarga, también podés tocarlo y elegir <b>Instalar</b>.','Confirmá con <b>Agregar</b>.']],
    android:['Android (Chrome)',['Abrí el enlace de PETFILE en <b>Chrome</b>. Sirve también en Samsung si usás Chrome.','Tocá el menú <b>⋮</b> (tres puntos), arriba a la derecha.','Tocá <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.','Confirmá con <b>Instalar</b>.']]
  }
});
Object.assign(S.en,{
  in_bannerT:'Install PETFILE on your phone',in_bannerD:'It works like any other app, with its own icon and no browser bar.',in_see:'Show me',in_later:'Not now',
  in_t:'Install as an app',in_d:'Pick your phone and follow the steps. It takes less than a minute.',in_now:'Install now',in_done:'When you finish, find the PETFILE icon on your home screen and open it from there.',
  in_link:'How do I install it on my phone?',in_card:'Step-by-step guide for iPhone, Samsung and other Android phones.',in_installed:'PETFILE is already installed on this phone.',
  in_wa:'<b>Did you open it from WhatsApp, Instagram or Facebook?</b> First tap that screen\'s menu (⋮ or •••) and choose <b>Open in browser</b>. You can install it from there.',
  in_os:{
    ios:['iPhone / iPad',['Open the PETFILE link in <b>Safari</b>.','Tap the <b>Share</b> button: the square with an arrow pointing up. On iPhone it\'s at the bottom; on iPad, at the top right. If you don\'t see it, tap <b>•••</b> and then <b>Share</b>.','Scroll down the list and tap <b>Add to Home Screen</b>.','Check that the name says PETFILE and tap <b>Add</b>.']],
    samsung:['Samsung',['Open the PETFILE link in <b>Samsung Internet</b>, Samsung\'s browser.','Tap the <b>☰</b> menu (three lines) at the bottom right.','Tap <b>Add page to</b> and then <b>Home screen</b>. If a download icon shows up in the address bar, you can also tap it and choose <b>Install</b>.','Confirm with <b>Add</b>.']],
    android:['Android (Chrome)',['Open the PETFILE link in <b>Chrome</b>. This also works on Samsung phones using Chrome.','Tap the <b>⋮</b> menu (three dots) at the top right.','Tap <b>Install app</b> or <b>Add to Home screen</b>.','Confirm with <b>Install</b>.']]
  }
});
// El último tema de Ayuda ya no repite los pasos de instalación: remite a la guía.
[S.es,S.en].forEach((L,i)=>{const it=L.help[L.help.length-1];it[3]=it[3].filter(x=>!/iPhone|Android/.test(x));it[3].push(i===0?'Para instalarla como app, abrí la guía <b>Instalar como app</b> más abajo.':'To install it as an app, open the <b>Install as an app</b> guide below.')});

const inst={prompt:null,os:(()=>{const u=navigator.userAgent;if(/iPhone|iPad|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return'ios';if(/SamsungBrowser/.test(u))return'samsung';return'android'})(),tab:null};
const isStandalone=()=>{try{return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
if(NATIVE)[S.es,S.en].forEach(L=>L.help.forEach(h=>{h[3]=h[3].filter(x=>!/instal/i.test(x))}));
const INSTKEY='petfile-install-dismissed';
const installDismissed=()=>{try{return localStorage.getItem(INSTKEY)==='1'}catch(e){return false}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();inst.prompt=e;if($('#layer').innerHTML.includes('in-sheet'))installSheet()});
window.addEventListener('appinstalled',()=>{inst.prompt=null;closeSheet();toast(t('in_installed'))});
if(!NATIVE&&'serviceWorker' in navigator&&location.protocol==='https:'){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}
const DL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3M10 18h4"/></svg>';
function installBanner(){
  if(NATIVE||isStandalone()||installDismissed())return'';
  return `<div class="install"><span class="ticon" style="--tc:var(--accent)">${DL}</span><div style="min-width:0"><b>${t('in_bannerT')}</b><span>${t('in_bannerD')}</span><div class="ia"><button class="btn sm dark" data-act="install">${t('in_see')}</button><button class="lnk" style="color:var(--muted)" data-act="install-dismiss">${t('in_later')}</button></div></div></div>`;
}
const installCard=()=>NATIVE?'':`<button class="helpcta" data-act="install" style="margin-top:4px"><span class="ticon" style="--tc:var(--accent)">${DL}</span><span><b>${t('in_t')}</b>${t('in_card')}</span></button>`;
function installSheet(){
  const os=inst.tab||inst.os;const O=t('in_os');
  const steps=O[os][1];
  openSheet(`<div class="in-sheet" style="display:flex;flex-direction:column;gap:14px"><div><h2>${t('in_t')}</h2><p class="muted" style="margin:4px 0 0">${isStandalone()?t('in_installed'):t('in_d')}</p></div>
  ${inst.prompt&&os!=='ios'?`<button class="btn dark block" data-act="install-now">${DL.replace('<svg','<svg width="20" height="20"')}${t('in_now')}</button>`:''}
  <div class="seg" style="grid-template-columns:repeat(3,1fr)">${Object.keys(O).map(k=>`<button type="button" data-act="install-tab" data-v="${k}" aria-pressed="${k===os}">${O[k][0]}</button>`).join('')}</div>
  <ol class="steps" style="padding:0">${steps.map(x=>`<li><span>${x}</span></li>`).join('')}</ol>
  <p class="tip" style="margin:0">${t('in_wa')}</p>
  <p class="muted" style="margin:0;font-size:13.5px">${t('in_done')}</p></div>`);
}
document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
  if(a==='install'){ev.stopImmediatePropagation();inst.tab=null;installSheet()}
  else if(a==='install-tab'){ev.stopImmediatePropagation();inst.tab=el.dataset.v;installSheet()}
  else if(a==='install-now'){ev.stopImmediatePropagation();const p=inst.prompt;if(!p)return;p.prompt();p.userChoice.finally(()=>{inst.prompt=null})}
  else if(a==='install-dismiss'){ev.stopImmediatePropagation();try{localStorage.setItem(INSTKEY,'1')}catch(e){}render()}
},true);

/* ---------- sugerencias (llegan por correo a Grupo ARCA) ---------- */
const FEEDBACK_EMAIL="grupoarcacr@gmail.com";
// Envío con FormSubmit (gratis, sin servidor). La primera vez llega un correo de activación a FEEDBACK_EMAIL.
const FEEDBACK_ENDPOINT="https://formsubmit.co/ajax/"+FEEDBACK_EMAIL;
const FB_TYPES=['mejora','problema','resena'];
const FB_TYPE_ES={mejora:'Mejora',problema:'Problema',resena:'Reseña'}; // el asunto siempre va en español
Object.assign(S.es,{
  fb_t:'Sugerencias',fb_d:'Contanos qué mejorarías, qué no funciona o qué te parece PETFILE. Leemos todo, y lo que más se repite es lo primero que hacemos.',
  fb_card:'¿Qué le mejorarías a PETFILE? Contanos.',fb_type:'¿Qué querés contarnos?',fb_types:{mejora:'Idea de mejora',problema:'Algo no funciona',resena:'Mi opinión'},
  fb_stars:'¿Cuántas estrellas le das? (opcional)',fb_msg:'Tu mensaje',fb_ph:{mejora:'Ej. Me gustaría poder anotar la comida de cada mascota.',problema:'Ej. Al guardar una cita con hora, no aparece en la agenda.',resena:'Ej. Me encanta tener todo en un solo lugar.'},
  fb_send:'Enviar',fb_sent:'¡Gracias! Recibimos tu sugerencia.',fb_err:n=>`No se pudo enviar. Revisá tu conexión, o escribinos a ${n}`,fb_empty:'Escribí tu mensaje antes de enviar.',fb_wait:'Ya enviaste una sugerencia hace un momento. Esperá un minuto para enviar otra.',fb_left:n=>`${n} caracteres disponibles`
});
Object.assign(S.en,{
  fb_t:'Feedback',fb_d:"Tell us what you'd improve, what isn't working or what you think of PETFILE. We read everything, and what comes up most is what we build first.",
  fb_card:"What would you improve in PETFILE? Tell us.",fb_type:'What do you want to tell us?',fb_types:{mejora:'Improvement idea',problema:"Something isn't working",resena:'My opinion'},
  fb_stars:'How many stars would you give it? (optional)',fb_msg:'Your message',fb_ph:{mejora:"e.g. I'd like to log what each pet eats.",problema:"e.g. When I save an appointment with a time, it doesn't show in the schedule.",resena:'e.g. I love having everything in one place.'},
  fb_send:'Send',fb_sent:'Thank you! We got your feedback.',fb_err:n=>`Couldn't send it. Check your connection, or email us at ${n}`,fb_empty:'Write your message before sending.',fb_wait:'You just sent feedback. Wait a minute to send another one.',fb_left:n=>`${n} characters left`
});
const FB_MAX=500;
const fbDraft={type:'mejora',stars:0};
const STAR='<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>';
const feedbackCard=()=>`<button class="helpcta" data-act="feedback"><span class="ticon" style="--tc:var(--accent)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg></span><span><b>${t('fb_t')}</b>${t('fb_card')}</span></button>`;
function feedbackSheet(){
  const ty=fbDraft.type,T=t('fb_types');
  openSheet(`<div><h2>${t('fb_t')}</h2><p class="muted" style="margin:4px 0 0;font-size:14px">${t('fb_d')}</p></div>
  <form id="fbform" class="fields" novalidate>
    <div class="f full"><span class="label" style="text-transform:none;letter-spacing:0;font-size:13px">${t('fb_type')}</span><div class="seg" id="fb-types" style="grid-template-columns:repeat(3,1fr)">${FB_TYPES.map(k=>`<button type="button" data-act="fb-type" data-v="${k}" aria-pressed="${k===ty}">${T[k]}</button>`).join('')}</div></div>
    <div class="f full"><span class="label" style="text-transform:none;letter-spacing:0;font-size:13px">${t('fb_stars')}</span><div class="stars" role="radiogroup">${[1,2,3,4,5].map(n=>`<button type="button" role="radio" data-act="fb-star" data-v="${n}" aria-checked="${n===fbDraft.stars}" aria-label="${n}" class="${n<=fbDraft.stars?'on':''}">${STAR}</button>`).join('')}</div></div>
    <label class="f full">${t('fb_msg')}<textarea id="fb-msg" maxlength="${FB_MAX}" placeholder="${esc(t('fb_ph')[ty])}" style="min-height:120px">${esc(fbDraft.text||'')}</textarea><span class="muted" id="fb-left" style="font-weight:500;font-size:12px">${t('fb_left',FB_MAX-(fbDraft.text||'').length)}</span></label>
    <input type="text" id="fb-hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
    <div id="fb-err" class="full err" role="alert" hidden></div>
    <button class="btn dark block full" type="submit" id="fb-go">${t('fb_send')}</button>
  </form>`);
  const ta=$('#fb-msg');ta.addEventListener('input',()=>{fbDraft.text=ta.value;$('#fb-left').textContent=t('fb_left',FB_MAX-ta.value.length)});
  $('#fbform').addEventListener('submit',sendFeedback);
}
async function sendFeedback(ev){
  ev.preventDefault();const err=$('#fb-err'),go=$('#fb-go');err.hidden=true;
  const text=$('#fb-msg').value.trim();if($('#fb-hp').value)return;
  if(!text){err.textContent=t('fb_empty');err.hidden=false;return}
  let last=0;try{last=+localStorage.getItem('petfile-fb-last')||0}catch(e){}
  if(Date.now()-last<60000){err.textContent=t('fb_wait');err.hidden=false;return}
  const tipo=FB_TYPE_ES[fbDraft.type],u=fb.user||{},name=(typeof myName==='function'?myName():'')||'—';
  const stars=fbDraft.stars?'★'.repeat(fbDraft.stars)+'☆'.repeat(5-fbDraft.stars):'';
  const fecha=new Date().toLocaleDateString('es-CR',{day:'numeric',month:'short',year:'numeric'});
  const message=`${tipo}${stars?' · '+stars:''}\n\n${text}\n\n— ${name} · ${lang.toUpperCase()} · ${fecha}`;
  go.disabled=true;go.innerHTML='<span class="spinner"></span>';
  try{
    const r=await fetch(FEEDBACK_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({_subject:`PETFILE - Sugerencias · ${tipo}`,_template:'basic',_captcha:'false',name,email:u.email||'',message})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||String(j.success)==='false'&&!/activ/i.test(j.message||''))throw new Error(j.message||r.status);
    try{localStorage.setItem('petfile-fb-last',String(Date.now()))}catch(e){}
    fbDraft.text='';fbDraft.stars=0;closeSheet();toast(t('fb_sent'));
  }catch(e){console.warn(e);err.textContent=t('fb_err',FEEDBACK_EMAIL);err.hidden=false;go.disabled=false;go.textContent=t('fb_send')}
}
document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
  if(a==='feedback'){ev.stopImmediatePropagation();feedbackSheet()}
  else if(a==='fb-type'){ev.stopImmediatePropagation();fbDraft.type=el.dataset.v;document.querySelectorAll('#fb-types button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===fbDraft.type));const ta=$('#fb-msg');if(ta)ta.placeholder=t('fb_ph')[fbDraft.type]}
  else if(a==='fb-star'){ev.stopImmediatePropagation();const n=+el.dataset.v;fbDraft.stars=fbDraft.stars===n?0:n;document.querySelectorAll('.stars button').forEach(b=>{const v=+b.dataset.v;b.classList.toggle('on',v<=fbDraft.stars);b.setAttribute('aria-checked',v===fbDraft.stars)})}
},true);

/* ---------- recetas con foto y notificaciones (Premium) ---------- */
const VAPID_PUBLIC="BGIa1D38q4A-mle4ubKlSc9A1d2RhETRFZyfrmA9mvRADgdIZnHb1PG3i8Q6o-4MfviRKPF0IrHwApiD40SYlwk";
Object.assign(S.es,{
  rc_t:'Recetas',rc_add:'+ Agregar',rc_lockT:'Guardá las recetas del veterinario',rc_lockD:'Tomale foto a cada receta y tenela siempre a mano en la ficha de tu mascota.',rc_empty:'Todavía no hay recetas. Tomale foto a la próxima receta del veterinario y queda guardada aquí.',
  rc_new:'Nueva receta',rc_date:'Fecha',rc_photo:'Foto de la receta',rc_take:'Tomar o elegir foto',rc_change:'Cambiar foto',rc_title:'Motivo',rc_titlePh:'Ej. Otitis, control anual',rc_def:'Receta',rc_errPhoto:'Agregá la foto de la receta.',rc_saving:'Guardando…',rc_saved:'Receta guardada',rc_del:'Eliminar receta',rc_delQ:'¿Eliminar esta receta? No se puede deshacer.',rc_deleted:'Receta eliminada',rc_big:'Tocá y mantené la imagen para guardarla o compartirla.',rc_loadErr:'No se pudo cargar la imagen.',
  pick_rc:'Foto de una receta',pick_rc_d:'Queda guardada en la ficha',
  nt_t:'Notificaciones',nt_d:'Te avisamos en el celular cada mañana lo que toca hoy y mañana, y una hora antes de cada cita.',nt_on:'Activar notificaciones',nt_off:'Desactivar',nt_onOk:'Notificaciones activadas en este teléfono',nt_offOk:'Notificaciones desactivadas',nt_active:'Activas en este teléfono',nt_denied:'Las notificaciones están bloqueadas. Activalas en los ajustes del teléfono para PETFILE.',nt_install:'Para recibir notificaciones en iPhone, primero instalá PETFILE en la pantalla de inicio y abrila desde el ícono.',nt_unsup:'Este navegador no permite notificaciones. Probá con Chrome en Android o instalando la app en iPhone.',nt_err:'No se pudo activar. Intentá de nuevo.',nt_test:'¡Listo! Así se van a ver los avisos de PETFILE.',nt_howInstall:'Cómo instalarla',
  prem_rc:'Guardar recetas con foto es Premium.',prem_nt:'Las notificaciones en el celular son Premium.'
});
Object.assign(S.en,{
  rc_t:'Prescriptions',rc_add:'+ Add',rc_lockT:"Keep your vet's prescriptions",rc_lockD:"Snap each prescription and keep it handy in your pet's file.",rc_empty:"No prescriptions yet. Snap the next one from your vet and it's saved here.",
  rc_new:'New prescription',rc_date:'Date',rc_photo:'Prescription photo',rc_take:'Take or choose photo',rc_change:'Change photo',rc_title:'Reason',rc_titlePh:'e.g. Ear infection, annual checkup',rc_def:'Prescription',rc_errPhoto:'Add the prescription photo.',rc_saving:'Saving…',rc_saved:'Prescription saved',rc_del:'Delete prescription',rc_delQ:"Delete this prescription? This can't be undone.",rc_deleted:'Prescription deleted',rc_big:'Touch and hold the image to save or share it.',rc_loadErr:"Couldn't load the image.",
  pick_rc:'Prescription photo',pick_rc_d:'Saved in the pet file',
  nt_t:'Notifications',nt_d:"Every morning we tell you what's due today and tomorrow, and remind you an hour before each appointment.",nt_on:'Turn on notifications',nt_off:'Turn off',nt_onOk:'Notifications on for this phone',nt_offOk:'Notifications off',nt_active:'On for this phone',nt_denied:"Notifications are blocked. Turn them on for PETFILE in your phone's settings.",nt_install:'To get notifications on iPhone, first add PETFILE to your Home Screen and open it from the icon.',nt_unsup:"This browser doesn't support notifications. Try Chrome on Android or install the app on iPhone.",nt_err:"Couldn't turn them on. Try again.",nt_test:"Done! This is how PETFILE reminders will look.",nt_howInstall:'How to install',
  prem_rc:'Saving prescription photos is Premium.',prem_nt:'Phone notifications are Premium.'
});
// Lista Premium actualizada
S.es.prem_list=['Mascotas sin límite (la versión gratis permite 1)','Foto de perfil de cada mascota','Más especies, además de perro, gato y conejo','Exportar el historial en PDF o imprimirlo','Notificaciones en el celular','Invitar a tu familia (hasta 6 personas)'];
S.en.prem_list=['Unlimited pets (the free version allows 1)','Profile photo for each pet','More species besides dog, cat and rabbit','Export the history as PDF or print it','Phone notifications','Invite your family (up to 6 people)'];
// App de pruebas: oferta prevista de Premium, sin compras desde la app. La web conserva sus textos.
if(NATIVE){
  Object.assign(S.es,{prem_d:'Disfrutá de PETFILE Premium por solo ₡1.500 mensuales para vos y toda tu familia. Desbloqueás:',prem_soon:'Disponible pronto',fam_lockD:'Familia es una función Premium. Disfrutá de PETFILE Premium por solo ₡1.500 mensuales para vos y toda tu familia.'});
  Object.assign(S.en,{prem_d:'Enjoy PETFILE Premium for only ₡1,500 a month for you and your whole family. You unlock:',prem_soon:'Available soon',fam_lockD:'Family is a Premium feature. Enjoy PETFILE Premium for only ₡1,500 a month for you and your whole family.'});
}
// Ayuda: recetas y notificaciones
{const i=S.es.help.findIndex(h=>h[1]==='Agenda y recordatorios');
 S.es.help.splice(i,0,['scan','Recetas','Siempre a mano',['En la ficha de la mascota, tocá el botón <span class="kbd">+</span> y elegí <b>Receta</b>.','Escribí el motivo, la fecha, el veterinario y las indicaciones.','Tocá <b>Guardar</b> y queda en el historial.'],'']);
 S.es.help.splice(i+2,0,['cal','Notificaciones en el celular','Que te avise solo',['En iPhone, primero instalá PETFILE en la pantalla de inicio y abrila desde el ícono. En Android funciona desde Chrome.','Entrá a <b>Agenda</b> o a <b>Mi cuenta</b> y tocá <b>Activar notificaciones</b>. Aceptá el permiso que pide el teléfono.','Cada mañana te llega lo que toca hoy y mañana, y una hora antes de cada cita.','Se activan en cada teléfono por separado: cada persona de la familia las activa en el suyo.'],'Las notificaciones son parte de Premium.']);}
{const i=S.en.help.findIndex(h=>h[1]==='Schedule and reminders');
 S.en.help.splice(i,0,['scan','Prescriptions','Always at hand',["In the pet's file, tap the <span class=\"kbd\">+</span> button and choose <b>Prescription</b>.",'Enter the reason, date, vet and instructions.','Tap <b>Save</b> and it stays in the history.'],'']);
 S.en.help.splice(i+2,0,['cal','Phone notifications','Reminders that come to you',['On iPhone, first add PETFILE to your Home Screen and open it from the icon. On Android it works from Chrome.','Go to <b>Schedule</b> or <b>My account</b> and tap <b>Turn on notifications</b>. Accept the permission your phone asks for.',"Every morning you get what's due today and tomorrow, and a reminder an hour before each appointment.",'They are turned on per phone: each family member turns them on on their own phone.'],'Notifications are part of Premium.']);}

/* recetas: datos */
state.recetas={};
const _listenFamily=listenFamily;
listenFamily=function(fid){
  _listenFamily(fid);state.recetas={};
  fb.famUnsubs.push(famRef(fid).collection('recetas').onSnapshot(snap=>{const m={};snap.docs.forEach(d=>{m[d.id]=Object.assign({},d.data(),{id:d.id})});state.recetas=m;render()},e=>console.warn(e)));
};
const recetasOf=pid=>Object.values(state.recetas).filter(r=>r.petId===pid).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
function recetasSection(p){
  const list=recetasOf(p.id),prem=isPremium();
  let s=`<section class="sec"><div class="sec-h"><h2>${t('rc_t')}</h2>${prem?`<button class="lnk" data-act="rc-new" data-pet="${esc(p.id)}">${t('rc_add')}</button>`:''}</div>`;
  if(!prem&&!list.length)return s+`<button class="rclock" data-act="premium" data-why="prem_rc"><span class="ticon" style="--tc:var(--accent)">${I.scan}</span><span><b>${t('rc_lockT')}${PBADGE()}</b>${t('rc_lockD')}</span></button></section>`;
  if(!list.length)return s+`<button class="rclock" data-act="rc-new" data-pet="${esc(p.id)}"><span class="ticon" style="--tc:var(--accent)">${I.scan}</span><span><b>${t('rc_lockT')}</b>${t('rc_empty')}</span></button></section>`;
  return s+`<div class="rcgrid">${list.map(r=>`<button class="rcitem" data-act="rc-view" data-id="${esc(r.id)}"><img src="${esc(safeImg(r.thumb))}" alt=""><span><b>${esc(r.title||t('rc_def'))}</b><small>${fmtDate(r.date)}</small></span></button>`).join('')}${prem?'':`<button class="rcitem rcadd" data-act="premium" data-why="prem_rc"><b>+</b>${PBADGE()}</button>`}</div></section>`;
}
function compressImage(file,max,q){return new Promise((res,rej)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',q))};img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('img'))};img.src=url})}
async function fitImage(file){let max=1600,q=.72,d=await compressImage(file,max,q);while(d.length>850000&&max>700){max-=250;q=Math.max(.5,q-.06);d=await compressImage(file,max,q)}return d}
let rcDraft=null;
function recetaForm(p){
  rcDraft={file:null,preview:null};
  openSheet(`<div><div class="label">${esc(p.name)}</div><h2>${t('rc_new')}</h2></div><form id="rcform" class="fields" novalidate>
   <div class="full rcpick"><div id="rc-prev" class="rcprev">${I.scan}</div><label class="btn sm soft" for="rc-file" id="rc-lbl">${t('rc_take')}</label><input id="rc-file" type="file" accept="image/*" hidden></div>
   <label class="f full">${t('rc_title')}<input id="rc-title" placeholder="${t('rc_titlePh')}" autocomplete="off"></label>
   <label class="f">${t('rc_date')}<input id="rc-date" type="date" value="${todayStr()}"></label>
   <label class="f">${t('ef_vet')}<input id="rc-vet" placeholder="${t('ef_vetPh')}"></label>
   <label class="f full">${t('ef_notes')}<textarea id="rc-notes"></textarea></label>
   <div id="rc-err" class="full err" hidden></div><button class="btn dark block full" type="submit" id="rc-go">${t('save')}</button></form>`);
  $('#rc-file').addEventListener('change',async ev=>{const f=ev.target.files[0];if(!f)return;rcDraft.file=f;try{const th=await compressImage(f,360,.7);$('#rc-prev').innerHTML=`<img src="${esc(safeImg(th))}" alt="">`;$('#rc-lbl').textContent=t('rc_change')}catch(e){toast(t('t_imgErr'))}});
  $('#rcform').addEventListener('submit',async ev=>{ev.preventDefault();const err=$('#rc-err');err.hidden=true;
    if(!rcDraft.file){err.textContent=t('rc_errPhoto');err.hidden=false;return}
    const go=$('#rc-go');go.disabled=true;go.innerHTML=`<span class="spinner"></span> ${t('rc_saving')}`;
    try{const img=await fitImage(rcDraft.file),thumb=await compressImage(rcDraft.file,320,.7);
      const ref=famRef(fb.famId).collection('recetas').doc();
      await famRef(fb.famId).collection('recetasImg').doc(ref.id).set({img,petId:p.id});
      await ref.set({petId:p.id,title:$('#rc-title').value.trim()||t('rc_def'),date:$('#rc-date').value||todayStr(),vet:$('#rc-vet').value.trim(),notes:$('#rc-notes').value.trim(),thumb,createdAt:Date.now()});
      closeSheet();toast(t('rc_saved'));
    }catch(e){console.warn(e);err.textContent=e&&e.code==='permission-denied'?t('lic_noWrite'):t('t_cloudErr');err.hidden=false;go.disabled=false;go.textContent=t('save')}});
}
async function recetaView(id){
  const r=state.recetas[id];if(!r)return;const p=state.pets[r.petId]||{};
  openSheet(`<div><div class="label">${esc(p.name||'')}</div><h2>${esc(r.title||t('rc_def'))}</h2><p class="muted" style="margin:4px 0 0;font-size:14px">${esc([fmtDate(r.date),r.vet].filter(Boolean).join(' · '))}</p></div>
   <div class="rcbig" id="rc-big"><img src="${esc(safeImg(r.thumb))}" alt="" style="filter:blur(4px)"></div><p class="muted" style="margin:0;font-size:12.5px;text-align:center">${t('rc_big')}</p>
   ${r.notes?`<p style="margin:0;white-space:pre-wrap">${esc(r.notes)}</p>`:''}
   <div id="rc-delbox"><button class="btn ghost block" style="color:var(--warn)" data-act="rc-ask-del" data-id="${esc(id)}">${t('rc_del')}</button></div>`);
  try{const s=await famRef(fb.famId).collection('recetasImg').doc(id).get();const box=$('#rc-big');if(box&&s.exists)box.innerHTML=`<img src="${esc(safeImg(s.data().img))}" alt="${esc(r.title||'')}">`}catch(e){console.warn(e);const box=$('#rc-big');if(box)box.insertAdjacentHTML('beforeend',`<p class="err">${t('rc_loadErr')}</p>`)}
}
async function recetaDelete(id){try{await famRef(fb.famId).collection('recetas').doc(id).delete();await famRef(fb.famId).collection('recetasImg').doc(id).delete();closeSheet();toast(t('rc_deleted'))}catch(e){console.warn(e);toast(t('t_cloudErr'))}}
const recetaPickerBtn=p=>isPremium()?`<button class="wide" data-act="rc-new" data-pet="${esc(p.id)}"><span class="ticon">${I.scan}</span><span>${t('pick_rc')}<small>${t('pick_rc_d')}</small></span></button>`
  :`<button class="wide lockedt" data-act="premium" data-into="tp-prem" data-why="prem_rc"><span class="ticon">${I.scan}</span><span>${t('pick_rc')}${PBADGE()}<small>${t('pick_rc_d')}</small></span></button>`;

/* notificaciones */
const nt={state:'checking'};
const isIOS=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function b64u(s){const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))}
const subId=sub=>btoa(sub.endpoint).replace(/[^A-Za-z0-9]/g,'').slice(-60);
async function ntCheck(){
  if(NATIVE)return ntCheckNative();
  try{
    if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){nt.state=isIOS()&&!isStandalone()?'install':'unsup';return}
    if(Notification.permission==='denied'){nt.state='denied';return}
    const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();
    nt.state=sub&&Notification.permission==='granted'?'on':'off';
    if(sub&&fb.user)userRef().collection('push').doc(subId(sub)).set({sub:JSON.parse(JSON.stringify(sub)),tz:Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Costa_Rica',lang,updatedAt:Date.now()},{merge:true}).catch(()=>{});
  }catch(e){nt.state='unsup'}
}
function notifCard(compact){
  if(!fb.user||nt.state==='checking')return'';
  if(compact&&nt.state==='on')return'';
  const prem=isPremium();
  let body,act='';
  if(nt.state==='on'){body=`<span class="ntok">● ${t('nt_active')}</span>`;act=`<button class="btn sm ghost" data-act="nt-off">${t('nt_off')}</button>`}
  else if(nt.state==='install'){body=`<span class="muted" style="font-size:13px">${t('nt_install')}</span>`;act=`<button class="btn sm ghost" data-act="install">${t('nt_howInstall')}</button>`}
  else if(nt.state==='denied'){body=`<span class="muted" style="font-size:13px">${t('nt_denied')}</span>`}
  else if(nt.state==='unsup'){body=`<span class="muted" style="font-size:13px">${t('nt_unsup')}</span>`}
  else {body=`<span class="muted" style="font-size:13px">${t('nt_d')}</span>`;act=prem?`<button class="btn sm dark" data-act="nt-on">${t('nt_on')}</button>`:`<button class="btn sm dark" data-act="premium" data-why="prem_nt">${t('nt_on')}${PBADGE()}</button>`}
  return `<div class="ntcard"><span class="ticon" style="--tc:var(--accent)">${I.cal}</span><div style="min-width:0;display:flex;flex-direction:column;gap:4px"><b>${t('nt_t')}</b>${body}${act?`<div>${act}</div>`:''}</div></div>`;
}
async function ntOn(btn){
  if(NATIVE)return ntOnNative(btn);
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner"></span>'}
  try{
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){nt.state=perm==='denied'?'denied':'off';render();refreshSheet();return}
    const reg=await navigator.serviceWorker.ready;
    const sub=(await reg.pushManager.getSubscription())||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID_PUBLIC)});
    await userRef().collection('push').doc(subId(sub)).set({sub:JSON.parse(JSON.stringify(sub)),tz:Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Costa_Rica',lang,createdAt:Date.now()});
    nt.state='on';toast(t('nt_onOk'));
    try{reg.showNotification('PETFILE',{body:t('nt_test'),icon:'icon-192.png',badge:'icon-192.png',tag:'petfile-test'})}catch(e){}
  }catch(e){console.warn(e);toast(t('nt_err'))}
  render();refreshSheet();
}
async function ntOff(){
  if(NATIVE)return ntOffNative();
  try{const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();if(sub){await userRef().collection('push').doc(subId(sub)).delete().catch(()=>{});await sub.unsubscribe()}nt.state='off';toast(t('nt_offOk'))}catch(e){console.warn(e)}
  render();refreshSheet();
}
function refreshSheet(){const s=$('#layer .sheet');if(s&&s.querySelector('.ntcard'))accountSheet()}
/* Notificaciones locales de la app nativa: mismos avisos que send-reminders (resumen a las 7:00 y una hora antes de cada cita) */
const NT_PREF='petfile-local-nt';
const NT_MAX=60,NT_DAYS=60,NT_HOUR=7;
const NT_TXT={
  es:{today:'Hoy',tomorrow:'Mañana',overdue:n=>`${n} vencido${n>1?'s':''}`,more:n=>`y ${n} más`,booster:'Refuerzo',deworm:'Desparasitar',ends:'Termina',appt:h=>`Cita a las ${h}`,title:'PETFILE · Tus mascotas'},
  en:{today:'Today',tomorrow:'Tomorrow',overdue:n=>`${n} overdue`,more:n=>`and ${n} more`,booster:'Booster',deworm:'Deworming',ends:'Ends',appt:h=>`Appointment at ${h}`,title:'PETFILE · Your pets'}
};
if(NATIVE){
  [S.es,S.en].forEach(L=>L.help.forEach(h=>{h[3]=h[3].filter(x=>!/instal/i.test(x))}));
  S.es.nt_d='Te avisamos en este teléfono cada mañana lo que toca hoy y mañana, y una hora antes de cada cita. Si otra persona de la familia cambia algo, el aviso se actualiza cuando abrís la app.';
  S.en.nt_d="We notify you on this phone every morning about what's due today and tomorrow, and an hour before each appointment. If someone else in your family changes something, the reminder updates when you open the app.";
}
const ntPref=()=>{try{return localStorage.getItem(NT_PREF)}catch(e){return null}};
const ntSetPref=v=>{try{v?localStorage.setItem(NT_PREF,v):localStorage.removeItem(NT_PREF)}catch(e){}};
function ntDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function ntPlan(pets,L,nowMs){
  const rem=[];
  for(const p of pets)for(const e of p.entries||[]){
    if(!e||e.done)continue;
    if((e.type==='vacuna'||e.type==='desp')&&typeof e.next==='string')rem.push({when:e.next,text:`${e.type==='vacuna'?L.booster:L.deworm} · ${e.title} (${p.name})`});
    else if(e.type==='cita'&&typeof e.date==='string')rem.push({when:e.date,text:`${e.title} (${p.name})`,cita:true});
    else if(e.type==='med'&&typeof e.end==='string')rem.push({when:e.end,text:`${L.ends} · ${e.title} (${p.name})`});
  }
  const out=[],now=new Date(nowMs);
  for(let i=0;i<=NT_DAYS;i++){
    const at=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,NT_HOUR,0,0);
    if(at.getTime()<=nowMs)continue;
    const day=ntDay(at),tomorrow=ntDay(new Date(at.getFullYear(),at.getMonth(),at.getDate()+1)),limit=ntDay(new Date(at.getFullYear(),at.getMonth(),at.getDate()-60));
    const hoy=rem.filter(r=>r.when.slice(0,10)===day),man=rem.filter(r=>r.when.slice(0,10)===tomorrow);
    if(!hoy.length&&!man.length)continue;
    const venc=rem.filter(r=>{const w=r.when.slice(0,10);return w<day&&w>=limit}).length;
    const lines=[...hoy.map(r=>`${L.today}: ${r.text}`),...man.map(r=>`${L.tomorrow}: ${r.text}`)];
    let body=lines.slice(0,3).join('\n');
    if(lines.length>3)body+=`\n${L.more(lines.length-3)}`;
    if(venc)body+=`\n${L.overdue(venc)}`;
    out.push({at:at.getTime(),title:L.title,body});
  }
  for(const r of rem){
    const m=r.cita&&/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(r.when);if(!m)continue;
    const at=new Date(+m[1],+m[2]-1,+m[3],+m[4]-1,+m[5]).getTime();
    if(at>nowMs&&at<=nowMs+NT_DAYS*864e5)out.push({at,title:L.appt(r.when.slice(11,16)),body:r.text});
  }
  return out.sort((a,b)=>a.at-b.at).slice(0,NT_MAX);
}
async function ntCheckNative(){
  const LN=nativePlugin('LocalNotifications');
  if(!LN){nt.state='unsup';return}
  try{
    const p=await LN.checkPermissions();
    nt.state=p.display==='denied'?'denied':(p.display==='granted'&&fb.user&&ntPref()===fb.user.uid?'on':'off');
  }catch(e){console.warn(e);nt.state='unsup'}
}
async function ntApply(plan){
  const LN=nativePlugin('LocalNotifications');if(!LN)return;
  const pend=await LN.getPending();
  if(pend.notifications.length)await LN.cancel({notifications:pend.notifications.map(n=>({id:n.id}))});
  if(plan.length)await LN.schedule({notifications:plan.map((n,i)=>({id:i+1,title:n.title,body:n.body,largeBody:n.body,schedule:{at:new Date(n.at),allowWhileIdle:true}}))});
}
let ntTimer=null,ntSig=null;
function ntQueue(){if(!NATIVE)return;clearTimeout(ntTimer);ntTimer=setTimeout(()=>{ntSync().catch(e=>console.warn(e))},1200)}
async function ntSync(){
  if(!fb.user||state.loading)return;
  const prev=nt.state;await ntCheckNative();
  if(nt.state!==prev){render();refreshSheet()}
  if(license().pending)return;
  const plan=nt.state==='on'&&isPremium()?ntPlan(Object.values(state.pets),NT_TXT[lang==='en'?'en':'es'],Date.now()):[];
  const sig=JSON.stringify(plan);if(sig===ntSig)return;
  await ntApply(plan);ntSig=sig;
}
async function ntOnNative(btn){
  const LN=nativePlugin('LocalNotifications');
  if(!LN||!fb.user){toast(t('nt_err'));return}
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner"></span>'}
  try{
    const p=await LN.requestPermissions();
    if(p.display!=='granted'){nt.state=p.display==='denied'?'denied':'off';render();refreshSheet();return}
    ntSetPref(fb.user.uid);nt.state='on';ntSig=null;toast(t('nt_onOk'));
    await ntSync();
    await LN.schedule({notifications:[{id:1000,title:'PETFILE',body:t('nt_test'),schedule:{at:new Date(Date.now()+1500),allowWhileIdle:true}}]});
  }catch(e){console.warn(e);toast(t('nt_err'))}
  render();refreshSheet();
}
async function ntOffNative(){
  try{ntSetPref(null);nt.state='off';ntSig=null;await ntApply([]);toast(t('nt_offOk'))}catch(e){console.warn(e)}
  render();refreshSheet();
}
function ntClearNative(){if(!NATIVE)return;ntSig=null;ntApply([]).catch(e=>console.warn(e))}
if(NATIVE){
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)ntQueue()});
  const LN=nativePlugin('LocalNotifications');
  if(LN)try{LN.addListener('localNotificationActionPerformed',()=>{if(fb.user)go('agenda')})}catch(e){console.warn(e)}
}
setTimeout(()=>{ntCheck().then(()=>render())},1500);

document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;const stop=()=>ev.stopImmediatePropagation();
  switch(a){
    case'rc-new':{stop();const p=state.pets[el.dataset.pet]||state.pets[state.view.id];if(!p)break;if(!isPremium()){premiumSheet('prem_rc');break}closeSheet();recetaForm(p);break}
    case'rc-view':stop();recetaView(el.dataset.id);break;
    case'rc-ask-del':stop();$('#rc-delbox').innerHTML=`<div class="confirm"><span style="font-size:14px">${t('rc_delQ')}</span><div style="display:flex;gap:8px"><button class="btn sm danger" data-act="rc-del" data-id="${el.dataset.id}">${t('del')}</button><button class="btn sm ghost" data-act="close">${t('cancel')}</button></div></div>`;break;
    case'rc-del':stop();recetaDelete(el.dataset.id);break;
    case'nt-on':stop();ntOn(el);break;
    case'nt-off':stop();ntOff();break;
  }
},true);

/* ---------- términos, privacidad y eliminar cuenta ---------- */
Object.assign(S.es,{
  lg_terms:'Términos de uso',lg_priv:'Política de privacidad',
  lg_consent:(a,b)=>`Al crear tu cuenta aceptás los ${a} y la ${b}.`,
  lg_vet:'PETFILE es un registro y no reemplaza la atención de tu veterinario.',
  dl_btn:'Eliminar mi cuenta',dl_t:'¿Eliminar tu cuenta?',
  dl_owner:'Se borran tu cuenta y tus datos. Si hay más personas en tu familia, las mascotas quedan con ellas y la siguiente persona pasa a ser la administradora. Si estás solo, se borran también todas las mascotas, recetas y registros.',
  dl_member:'Se borran tu cuenta y tus datos y salís de la familia. Las mascotas compartidas quedan con la familia.',
  dl_sub:'<b>Importante:</b> si pagaste Premium, la licencia se pierde al eliminar la cuenta y no se reembolsa después del plazo de reembolso.',
  dl_type:'Para confirmar, escribí ELIMINAR',dl_word:'ELIMINAR',dl_go:'Eliminar para siempre',dl_cancel:'Cancelar',
  dl_err:'No se pudo eliminar la cuenta. Intentá de nuevo en un momento.',dl_done:'Tu cuenta fue eliminada.'
});
Object.assign(S.en,{
  lg_terms:'Terms of use',lg_priv:'Privacy policy',
  lg_consent:(a,b)=>`By creating an account you accept the ${a} and the ${b}.`,
  lg_vet:"PETFILE is a record and doesn't replace your vet's care.",
  dl_btn:'Delete my account',dl_t:'Delete your account?',
  dl_owner:'Your account and personal data will be deleted. If there are other people in your family, the pets stay with them and the next person becomes the admin. If you are alone, all pets, prescriptions and records are deleted too.',
  dl_member:'Your account and personal data will be deleted and you will leave the family. Shared pets stay with the family.',
  dl_sub:"<b>Important:</b> if you paid for Premium, the license is lost when you delete the account and isn't refunded after the refund period.",
  dl_type:'To confirm, type DELETE',dl_word:'DELETE',dl_go:'Delete forever',dl_cancel:'Cancel',
  dl_err:"Couldn't delete the account. Try again in a moment.",dl_done:'Your account was deleted.'
});
const LG_URL=p=>p+'.html'+(lang==='en'?'#en':'');
const lgA=(p,k)=>`<a href="${LG_URL(p)}" target="_blank" rel="noopener">${t(k)}</a>`;
const consentLine=()=>`<p class="muted full lgline">${t('lg_consent',lgA('terminos','lg_terms'),lgA('privacidad','lg_priv'))}</p>`;
const legalLinks=()=>`<p class="muted lgline">${lgA('terminos','lg_terms')} · ${lgA('privacidad','lg_priv')}<br>${t('lg_vet')}</p>`;
const deleteBtn=()=>`<button class="lnk" data-act="del-acct" style="align-self:center;color:var(--warn)">${t('dl_btn')}</button>`;
function deleteSheet(){
  const own=typeof isFamOwner==='function'&&isFamOwner();
  openSheet(`<h2>${t('dl_t')}</h2><p class="muted" style="margin:0">${own?t('dl_owner'):t('dl_member')}</p>
  <p class="tip" style="margin:0">${t('dl_sub')}</p>
  <label class="f full">${t('dl_type')}<input id="dl-word" autocomplete="off" autocapitalize="characters"></label>
  <div id="dl-err" class="err" role="alert" hidden></div>
  <button class="btn block" id="dl-go" data-act="del-acct-go" disabled style="background:var(--warn);color:var(--warn-ink)">${t('dl_go')}</button>
  <button class="btn ghost block" data-act="close">${t('dl_cancel')}</button>`);
  const i=$('#dl-word');i.addEventListener('input',()=>{$('#dl-go').disabled=i.value.trim().toUpperCase()!==t('dl_word')});
}
async function deleteAccount(){
  const go=$('#dl-go'),err=$('#dl-err');if(!go||go.disabled)return;err.hidden=true;
  go.disabled=true;go.innerHTML='<span class="spinner"></span>';
  try{
    const tok=await fb.user.getIdToken(true);
    try{if('serviceWorker' in navigator&&navigator.serviceWorker.controller){const reg=await navigator.serviceWorker.getRegistration();const sub=reg&&await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe()}}catch(e){}
    const r=await fetch('/.netlify/functions/delete-account',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:'{}'});
    const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||r.status);
    try{['petfile-fb-last','petfile-install-dismissed'].forEach(k=>localStorage.removeItem(k))}catch(e){}
    ntClearNative();ntSetPref(null);closeSheet();try{await auth.signOut()}catch(e){}
    try{await firebase.firestore().clearPersistence()}catch(e){}
    state.view={name:'home'};toast(t('dl_done'));
  }catch(e){console.warn(e);err.textContent=t('dl_err');err.hidden=false;go.disabled=false;go.textContent=t('dl_go')}
}
document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
  if(a==='del-acct'){ev.stopImmediatePropagation();deleteSheet()}
  else if(a==='del-acct-go'){ev.stopImmediatePropagation();deleteAccount()}
},true);

/* recordatorios */
function reminders(pets){
  const out=[];
  pets.forEach(p=>(p.entries||[]).forEach(e=>{
    if(e.done)return;let when=null,label='';
    if((e.type==='vacuna'||e.type==='desp')&&e.next){when=e.next;label=(e.type==='vacuna'?t('r_boost'):t('r_desp'))+e.title}
    else if(e.type==='cita'&&e.date){when=e.date;label=e.title}
    else if(e.type==='med'&&e.end){const n=dayDiff(e.end);if(n>=0&&n<=3){when=e.end;label=t('r_end')+e.title}}
    if(!when)return;const n=dayDiff(when);if(n<-60)return;out.push({pet:p,entry:e,when,label,n});
  }));
  return out.sort((a,b)=>a.when.localeCompare(b.when));
}
const chip=n=>`<span class="chip ${n<0?'late':n<=3?'soon':''}">${n<0?t('overdue'):rel(n)}</span>`;
function remRow(r,showPet){
  return `<div class="rem">${avatar(r.pet)}<div style="min-width:0"><div class="t">${esc(r.label)}</div><div class="s">${showPet?esc(r.pet.name)+' · ':''}${fmtDate(r.when)}${r.n<0?' · '+rel(r.n):''}</div></div>
  <div class="side">${chip(r.n)}<div class="mini"><button data-act="done" data-pet="${esc(r.pet.id)}" data-e="${esc(r.entry.id)}">${t('done')}</button></div></div></div>`;
}

/* vistas */
function renderMain(){
  const v=state.view;
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));
  document.querySelectorAll('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===lang));
  $('#fab').setAttribute('aria-label',t('add'));
  const late=reminders(petsSorted()).filter(r=>r.n<0).length;
  $('#nb-home').setAttribute('aria-current',v.name==='home'?'page':'false');
  $('#nb-agenda').setAttribute('aria-current',v.name==='agenda'?'page':'false');
  $('#nb-mascotas').setAttribute('aria-current',v.name==='mascotas'||v.name==='pet'?'page':'false');
  $('#nb-ayuda').setAttribute('aria-current',v.name==='ayuda'?'page':'false');
  $('#nb-agenda').querySelector('.dot')?.remove();if(late)$('#nb-agenda').insertAdjacentHTML('beforeend',`<span class="dot">${late}</span>`);
  const app=$('#app');
  if(v.name==='pet'){if(state.pets[v.id]){app.innerHTML=petView(state.pets[v.id]);return}if(!state.loading)state.view={name:'home'}}
  const n=state.view.name;app.innerHTML=n==='agenda'?agendaView():n==='ayuda'?helpView():n==='familia'&&typeof familyView==='function'?familyView():n==='mascotas'?petsView():homeView();
}
function sampleShot(){
  const X=t('sample');
  const ent=(ic,c,a)=>`<div class="entry" style="--tc:var(${c});padding:10px;gap:10px;grid-template-columns:30px 1fr;border-radius:14px"><span class="ticon" style="width:30px;height:30px;border-radius:9px">${I[ic]}</span><div class="body"><div class="head"><span class="ty" style="font-size:9.5px">${a[0]}</span><span class="d" style="font-size:10px">${a[1]}</span></div><div class="tt" style="font-size:13.5px">${a[2]}</div><div class="meta" style="font-size:11.5px">${a[3]}</div></div></div>`;
  const rem=(l,s,c,cl)=>`<div class="rem" style="padding:9px 10px;grid-template-columns:30px 1fr auto;gap:9px"><div class="av" style="width:30px;height:30px;border-radius:9px;font-size:13px">C</div><div><div class="t" style="font-size:12.5px">${l}</div><div class="s" style="font-size:11px">${s}</div></div><span class="chip ${cl}" style="font-size:10px">${c}</span></div>`;
  return `<figure class="shot" aria-label="${t('shot_aria')}"><div class="shot-in" aria-hidden="true">
  <div class="shot-hero"><span class="mark"></span><div class="cap"><b>${X.name}</b><span>${X.sub}</span></div></div>
  <div class="facts" style="gap:6px;grid-template-columns:repeat(4,1fr)">${[[t('f_age'),X.age],[t('f_weight'),'14.2 kg'],[t('f_breed'),X.breed],[t('f_sex'),X.sex]].map(([a,b])=>`<div class="fact" style="padding:7px;border-radius:11px"><span class="label" style="font-size:8.5px">${a}</span><span class="v" style="font-size:11.5px">${b}</span></div>`).join('')}</div>
  <div class="label" style="margin-top:2px">${t('pending')}</div>
  <div class="list" style="border-radius:14px">${rem(X.r1,X.r1d,t('overdue'),'late')}${rem(X.r2,X.r2d,X.r2c,'')}</div>
  <div class="label" style="margin-top:2px">${t('history')}</div>
  ${ent('pill','--t-med',X.e1)}${ent('steth','--t-consulta',X.e2)}${ent('syringe','--t-vacuna',X.e3)}
  </div><figcaption>${t('shot_cap')}</figcaption></figure>`;
}
function homeView(){
  const pets=petsSorted();
  if(!pets.length)return state.loading?'':`${trialBanner()}${installBanner()}<div class="empty"><span class="mark" aria-hidden="true"></span><h1 style="font-size:26px">${t('empty_t')}</h1><p>${t('empty_d')}</p><div class="row"><button class="btn dark" data-act="new-pet">${t('empty_btn')}</button><button class="btn ghost" data-act="fam-join">${t('fam_joinT')}</button><button class="lnk" data-act="ayuda" style="margin-top:4px">${t('how')}</button></div></div><section class="sec"><div class="sec-h"><h2>${t('shot_t')}</h2></div>${sampleShot()}</section>`;
  const rem=reminders(pets);const late=rem.filter(r=>r.n<0).length,week=rem.filter(r=>r.n>=0&&r.n<=7).length;
  const meds=pets.reduce((a,p)=>a+(p.entries||[]).filter(e=>e.type==='med'&&!e.done&&(!e.end||dayDiff(e.end)>=0)).length,0);
  const h=new Date().getHours();const hi=h<12?t('morning'):h<19?t('afternoon'):t('evening');
  let s=`<section class="hello"><h1>${hi}</h1><p>${late?t('st_late',late):week?t('st_week',week):t('st_ok')}</p></section>
  ${trialBanner()}${installBanner()}<div class="stats"><button class="stat ${late?'alert':''}" data-act="agenda"><b>${late}</b><span>${t('s_late')}</span></button><button class="stat" data-act="agenda"><b>${week}</b><span>${t('s_week')}</span></button><div class="stat"><b>${meds}</b><span>${t('s_meds')}</span></div></div>
  <section class="sec"><div class="sec-h"><h2>${t('my_pets')}</h2><span class="muted" style="font-size:13px">${pets.length}</span></div><div class="pets">${pets.map(petCard).join('')}<button class="pcard add" data-act="new-pet"><b>+</b>${t('add')}${petLimit()?PBADGE():''}</button></div></section>${famCard()}`;
  if(pets.length<=1)s+=`<button class="helpcta" data-act="ayuda"><span class="ticon" style="--tc:var(--accent)">${I.scan}</span><span><b>${t('cta_t')}</b>${t('cta_d')}</span></button>`;
  if(rem.length)s+=`<section class="sec"><div class="sec-h"><h2>${t('next')}</h2><button class="lnk" data-act="agenda">${t('see_agenda')}</button></div><div class="list">${rem.slice(0,4).map(r=>remRow(r,true)).join('')}</div></section>`;
  return s;
}
function petCard(p){
  const r=reminders([p]);const late=r.filter(x=>x.n<0).length,soon=r.filter(x=>x.n>=0&&x.n<=7).length;
  const badge=late?`<span class="badge">${t('b_late',late)}</span>`:soon?`<span class="badge">${t('b_week',soon)}</span>`:'';
  return `<button class="pcard" data-act="open" data-pet="${esc(p.id)}">${safeImg(p.photo)?`<img src="${esc(safeImg(p.photo))}" alt="">`:`<span class="ini">${initial(p)}</span>`}${badge}<span class="cap"><span class="n">${esc(p.name)}</span><span class="m">${esc([p.breed||spOf(p),ageOf(p.birth)].filter(x=>x&&x!=='—').join(' · '))}</span></span></button>`;
}
function petsView(){
  const pets=petsSorted();
  return `<section class="hello"><h1>${t('nav_pets')}</h1><p>${pets.length?t('pets_d'):t('pets_none')}</p></section><div class="pets">${pets.map(petCard).join('')}<button class="pcard add" data-act="new-pet"><b>+</b>${t('add')}${petLimit()?PBADGE():''}</button></div>`;
}
function helpView(){
  const chev='<svg class="chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  let s=`<section class="hello"><h1>${t('help_t')}</h1><p>${t('help_d')}</p></section>
  ${feedbackCard()}<div class="help-intro"><span class="mark" aria-hidden="true"></span><div><b style="font-family:var(--f-display);font-size:18px">${t('help_basic')}</b><p>${t('help_basicD')}</p></div></div>`;
  s+=t('help').map(([ic,ti,sub,steps,tip],i)=>`<details class="acc" ${i===0?'open':''}><summary><span class="ticon">${I[ic]}</span><span>${ti}<small>${sub}</small></span>${chev}</summary><ol class="steps">${steps.map(x=>`<li><span>${x}</span></li>`).join('')}</ol>${tip?`<p class="tip"><b>${t('tip')}</b> ${tip}</p>`:''}</details>`).join('');
  return s+installCard()+`<section class="sec"><div class="sec-h"><h2>${t('shot_t')}</h2></div>${sampleShot()}</section>`+legalLinks()+arcaBadge();
}
function agendaView(){
  const rem=reminders(petsSorted());
  let s=`<section class="hello"><h1>${t('nav_agenda')}</h1><p>${t('ag_d')}</p></section>`+(typeof notifCard==='function'?notifCard(true):'');
  if(!rem.length)return s+`<div class="empty"><p>${t('ag_empty')}</p></div>`;
  [[t('g_late'),r=>r.n<0],[t('g_week'),r=>r.n>=0&&r.n<=7],[t('g_month'),r=>r.n>7&&r.n<=31],[t('g_later'),r=>r.n>31]].forEach(([ti,f])=>{const g=rem.filter(f);if(g.length)s+=`<section class="sec"><div class="group-t">${ti}</div><div class="list">${g.map(r=>remRow(r,true)).join('')}</div></section>`});
  return s;
}
const legacyRc=p=>recetasOf(p.id).map(r=>({id:'rc_'+r.id,type:'receta',title:r.title||t('rc_def'),date:r.date,vet:r.vet,notes:r.notes,rc:r}));
function petView(p){
  const entries=(p.entries||[]).concat(legacyRc(p)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const counts={};entries.forEach(e=>counts[e.type]=(counts[e.type]||0)+1);
  const list=state.filter==='todo'?entries:entries.filter(e=>e.type===state.filter);
  const rem=reminders([p]);
  let s=`<section class="hero">${safeImg(p.photo)?`<img src="${esc(safeImg(p.photo))}" alt="${esc(t('photoOf',p.name))}">`:`<span class="ini">${initial(p)}</span>`}
  <button class="round l" data-act="home" aria-label="${t('back')}">${I.back}</button><button class="round r" data-act="edit-pet" data-pet="${esc(p.id)}" aria-label="${t('editData')}">${I.edit}</button>
  <button class="camera" ${isPremium()?`data-act="edit-pet" data-pet="${esc(p.id)}"`:`data-act="premium" data-why="prem_photo"`} aria-label="${p.photo?t('pf_chPh'):t('pf_addPh')}">${I.camera}</button><div class="cap"><h1>${esc(p.name)}</h1><div class="sub">${esc(spOf(p))}</div></div></section>
  <div class="facts"><div class="fact"><span class="label">${t('f_age')}</span><span class="v">${ageOf(p.birth)}</span></div><div class="fact"><span class="label">${t('f_weight')}</span><span class="v">${p.weight?esc(p.weight)+' kg':'—'}</span></div><div class="fact"><span class="label">${t('f_breed')}</span><span class="v">${esc(p.breed||'—')}</span></div><div class="fact"><span class="label">${t('f_sex')}</span><span class="v">${esc(sxL(p.sex)||'—')}</span></div></div>`;
  if(rem.length)s+=`<section class="sec"><div class="sec-h"><h2>${t('pending')}</h2></div><div class="list">${rem.map(r=>remRow(r,false)).join('')}</div></section>`;
  if(state.caps.sample&&state.caps.img)s+=`<div class="reader"><div><b>${t('rx_t')}</b><p>${t('rx_d')}</p></div><label class="btn sm" for="rxfile">${I.scan.replace('<svg','<svg width="18" height="18"')}${t('rx_btn')}</label><input id="rxfile" type="file" accept="image/*" hidden></div>`;
  s+=`<section class="sec"><div class="sec-h"><h2>${t('history')}</h2><div class="hist-acts">${entries.length?`<button class="lnk" data-act="export" data-pet="${esc(p.id)}">${t('exp_btn')}${isPremium()?'':PBADGE()}</button>`:''}<button class="lnk" data-act="fab">${t('add_plus')}</button></div></div>`;
  if(entries.length)s+=`<div class="tabs" role="group">${[['todo',t('all'),entries.length]].concat(Object.keys(TYPE_META).filter(k=>counts[k]).map(k=>[k,TT(k).plural,counts[k]])).map(([k,l,c])=>`<button class="tab" data-act="filter" data-f="${k}" aria-pressed="${state.filter===k}">${l} ${c}</button>`).join('')}</div>`;
  s+=list.length?`<div class="timeline">${list.map(e=>entryCard(p,e)).join('')}</div>`:`<div class="empty"><p>${t('hist_empty')}</p></div>`;
  return s+`</section>`;
}
function entryCard(p,e){
  if(e.rc)return `<article class="entry" style="--tc:var(--t-receta)"><span class="ticon">${I.scan}</span><div class="body"><div class="head"><span class="ty">${TT('receta').label}</span><span class="d">${fmtDate(e.date)}</span></div><div class="tt">${esc(e.title)}</div>${e.vet?`<div class="meta">${esc(e.vet)}</div>`:''}${e.notes?`<div class="notes">${esc(e.notes)}</div>`:''}<div class="thumbs"><button type="button" data-act="rc-view" data-id="${esc(e.rc.id)}" aria-label="${t('ph_view')}"><img src="${esc(safeImg(e.rc.thumb))}" alt=""></button></div><div class="acts"><button class="t" data-act="rc-view" data-id="${esc(e.rc.id)}">${t('ph_view')}</button></div></div></article>`;
  const ty=TT(e.type);const bits=[];
  if(e.dose)bits.push((ty.doseL?ty.doseL+': ':'')+e.dose);if(e.freq)bits.push(e.freq);
  if(e.type==='med'&&e.end)bits.push(t('until')+' '+fmtDate(e.end));
  if(e.next)bits.push((ty.nextL||'')+': '+fmtDate(e.next)+(e.done?' ✓':''));
  if(e.vet)bits.push(e.vet);if(e.fromRx)bits.push(t('fromRx'));
  const conf=state.confirmEntry===e.id;
  return `<article class="entry" style="--tc:var(${ty.color})"><span class="ticon">${I[ty.icon]}</span><div class="body"><div class="head"><span class="ty">${ty.label}</span><span class="d">${fmtDate(e.date)}</span></div><div class="tt">${esc(e.title)}</div>${bits.length?`<div class="meta">${esc(bits.join(' · '))}</div>`:''}${e.ingredients?`<div class="notes"><b>${ty.ingL}</b>\n${esc(e.ingredients)}</div>`:''}${e.steps?`<div class="notes"><b>${ty.stepsL}</b>\n${esc(e.steps)}</div>`:''}${e.notes?`<div class="notes">${esc(e.notes)}</div>`:''}${(e.photos||[]).length?`<div class="thumbs">${e.photos.map((x,i)=>`<button type="button" data-act="view-ph" data-pet="${esc(p.id)}" data-e="${esc(e.id)}" data-i="${i}" aria-label="${t('ph_view')}"><img src="${esc(safeImg(x.url))}" alt="" loading="lazy">${i===0&&e.photos.length>1?`<span class="more">+${e.photos.length-1}</span>`:''}</button>`).join('')}</div>`:''}
  <div class="acts">${conf?`<span style="font-size:13px;font-weight:700">${t('del_q')}</span><button class="btn sm danger" data-act="del-entry" data-pet="${esc(p.id)}" data-e="${esc(e.id)}">${t('del')}</button><button class="btn sm ghost" data-act="cancel-del">${t('cancel')}</button>`:`<button class="t" data-act="edit-entry" data-pet="${esc(p.id)}" data-e="${esc(e.id)}">${t('edit')}</button><button class="t red" data-act="ask-del" data-e="${esc(e.id)}">${t('del')}</button>`}</div></div></article>`;
}

/* hojas */

/* fotos de registros: Firebase Storage */
async function uploadPhotos(p,list){const out=[];for(const x of list){if(!x.blob){out.push({url:x.url,path:x.path});continue}
  const path=`families/${fb.famId}/pets/${p.id}/${uid('f')}.jpg`,ref=firebase.storage().ref(path);await ref.put(x.blob,{contentType:'image/jpeg',cacheControl:'private,max-age=31536000'});out.push({url:await ref.getDownloadURL(),path})}return out}
function removePhotos(list){(list||[]).forEach(x=>{if(x&&x.path)firebase.storage().ref(x.path).delete().catch(e=>console.warn(e))})}
/* exportar historial (Premium) */
async function legacyFull(p){const m={};await Promise.all(recetasOf(p.id).map(async r=>{try{const d=await famRef(fb.famId).collection('recetasImg').doc(r.id).get();m[r.id]=d.exists?d.data().img:r.thumb}catch(e){m[r.id]=r.thumb}}));return m}
function expRows(p,full){full=full||{};return (p.entries||[]).concat(legacyRc(p)).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(e=>{const ty=TT(e.type),bits=[];if(e.dose)bits.push((ty.doseL?ty.doseL+': ':'')+e.dose);if(e.freq)bits.push(e.freq);if(e.type==='med'&&e.end)bits.push(t('until')+' '+fmtDate(e.end));if(e.next)bits.push((ty.nextL||'')+': '+fmtDate(e.next));if(e.vet)bits.push(e.vet);return{date:fmtDate(e.date),type:ty.label,color:ty.color,title:e.title||'',meta:bits.join('  |  '),notes:[e.ingredients&&ty.ingL+':\n'+e.ingredients,e.steps&&ty.stepsL+':\n'+e.steps,e.notes].filter(Boolean).join('\n'),photos:(e.rc?[full[e.rc.id]||e.rc.thumb]:(e.photos||[]).map(x=>x.url)).map(safeImg).filter(Boolean)}})}
function expSub(p){return [spOf(p),p.breed,ageOf(p.birth)!=='—'?ageOf(p.birth):'',p.weight?p.weight+' kg':'',sxL(p.sex)].filter(Boolean).join(' · ')}
function exportSheet(p){const b=(a,ic,c,x,d)=>`<button type="button" data-act="${a}" data-pet="${esc(p.id)}" style="--tc:var(${c})"><span class="ticon">${I[ic]}</span><span>${x}<small>${d}</small></span></button>`;
  openSheet(`<div><div class="label">${esc(p.name)}</div><h2>${t('exp_t')}</h2></div><div class="types">${b('exp-print','printer','--t-cita',t('exp_print'),t('exp_printD'))}${b('exp-pdf','filedown','--t-vacuna',t('exp_pdf'),t('exp_pdfD'))}</div>`)}
async function printHistory(p){let d=$('#printdoc');if(!d){d=document.createElement('div');d.id='printdoc';document.body.appendChild(d)}
  const rows=expRows(p,await legacyFull(p));d.innerHTML=`<div class="pd-h">${safeImg(p.photo)?`<img src="${esc(safeImg(p.photo))}" alt="">`:''}<div><small>${t('exp_doc')}</small><b>${esc(p.name)}</b><small>${esc(expSub(p))}</small></div></div>${rows.map(r=>`<div class="pd-r"><div class="d">${esc(r.date)}</div><div><div class="y" style="color:var(${r.color})">${esc(r.type)}</div><div class="tt">${esc(r.title)}</div>${r.meta?`<div class="m">${esc(r.meta)}</div>`:''}${r.notes?`<div style="white-space:pre-wrap">${esc(r.notes)}</div>`:''}${r.photos.length?`<div class="has">${t('ph_n',r.photos.length)}</div>`:''}</div></div>`).join('')}<p class="pd-f">${t('exp_by')} · ${t('exp_gen')} ${fmtDate(todayStr())}</p>${rows.flatMap(r=>r.photos.map(x=>`<div class="pd-att"><b>${esc(r.type)}: ${esc(r.title)}</b><div class="m">${esc(r.date)}</div><img src="${esc(x)}" alt=""></div>`)).join('')}`;
  await Promise.all([...d.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));window.print()}
function loadJsPdf(){return window.jspdf?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function circlePng(src){return new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=320;const x=c.getContext('2d'),m=Math.min(i.naturalWidth||320,i.naturalHeight||320);x.beginPath();x.arc(160,160,160,0,7);x.clip();if(/^data:image\/svg/.test(src))x.drawImage(i,0,0,320,320);else x.drawImage(i,(i.naturalWidth-m)/2,(i.naturalHeight-m)/2,m,m,0,0,320,320);ok(c.toDataURL('image/png'))}catch(e){ok(null)}};i.onerror=()=>ok(null);i.src=src})}
/* /fs es un proxy de Netlify hacia Firebase Storage (mismo dominio, sin bloqueo CORS). */
async function photoJpeg(url){if(!String(url).startsWith(IMG_REMOTE_PREFIX))throw new Error('foto');const r=await fetch(url.replace('https://firebasestorage.googleapis.com','/fs'));if(!r.ok)throw new Error('foto '+r.status);const u=URL.createObjectURL(await r.blob());try{return await new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.naturalWidth||900;c.height=i.naturalHeight||1200;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(i,0,0,c.width,c.height);ok({d:c.toDataURL('image/jpeg',.85),w:c.width,h:c.height})};i.onerror=no;i.src=u})}finally{URL.revokeObjectURL(u)}}
async function downloadPdf(p){toast('PDF…');try{await loadJsPdf();const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'letter'}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=16;
  const rgb=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const cs=getComputedStyle(document.documentElement);
  doc.setFillColor(31,79,255);doc.rect(0,0,W,42,'F');const png=await circlePng(safeImg(p.photo));let tx=M;if(png){doc.setFillColor(234,224,205);doc.circle(M+13,21,14,'F');doc.addImage(png,'PNG',M,8,26,26);tx=M+33}
  doc.setTextColor(234,224,205);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(t('exp_doc'),tx,14);doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(23);doc.text(p.name||'',tx,24);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(doc.splitTextToSize(expSub(p),W-tx-M)[0]||'',tx,31);
  let y=52;const X=M+30,CW=W-X-M;const line=(s,sz,st,c,yy)=>{doc.setFont('helvetica',st);doc.setFontSize(sz);doc.setTextColor(...c);doc.text(s,X,yy)};
  const INK=[61,35,24],MUT=[107,85,70],rows=expRows(p,await legacyFull(p));
  rows.forEach(r=>{doc.setFont('helvetica','normal');doc.setFontSize(9.5);const m=r.meta?doc.splitTextToSize(r.meta,CW):[],n=r.notes?doc.splitTextToSize(r.notes,CW):[];if(r.photos.length)n.push('['+t('ph_n',r.photos.length)+']');const h=12+m.length*4.4+n.length*4.4+5;if(y+h>H-18){doc.addPage();y=18}
    doc.setFontSize(9.5);doc.setTextColor(...MUT);doc.text(r.date.split(' · ')[0],M,y+3);
    line(r.type,9,'bold',rgb(cs.getPropertyValue(r.color).trim()),y+3);line(doc.splitTextToSize(r.title,CW)[0],12.5,'bold',INK,y+9);let yy=y+14;
    m.forEach(l=>{line(l,9.5,'normal',MUT,yy);yy+=4.4});n.forEach(l=>{if(yy>H-18){doc.addPage();yy=18}line(l,9.5,'normal',INK,yy);yy+=4.4});
    y=yy+1;doc.setDrawColor(217,204,181);doc.setLineWidth(.25);doc.line(M,y,W-M,y);y+=5});
  for(const r of rows)for(const x of r.photos){const a=await photoJpeg(x);doc.addPage();doc.setFont('helvetica','bold');doc.setFontSize(12.5);doc.setTextColor(...INK);doc.text(doc.splitTextToSize(r.type+': '+r.title,W-2*M)[0],M,18);doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...MUT);doc.text(t('ph_att')+'  |  '+r.date,M,23.5);const mw=W-2*M,mh=H-28-18,k=Math.min(mw/a.w,mh/a.h);doc.addImage(a.d,'JPEG',M,28,a.w*k,a.h*k)}
  const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...MUT);doc.text(t('exp_by')+'  |  '+t('exp_gen')+' '+fmtDate(todayStr()),M,H-9);doc.text(t('exp_page')+' '+i+'/'+pages,W-M,H-9,{align:'right'})}
  const name='historial-'+(p.name||'mascota').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-')+'.pdf';
  await state.caps.downloads.save({filename:name,data:doc.output('blob')});toast(t('exp_ok'))}catch(e){console.warn(e);toast(t('exp_err'))}}
function openSheet(html){$('#layer').innerHTML=`<div class="scrim" data-act="close-scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;document.body.style.overflow='hidden'}
function closeSheet(){$('#layer').innerHTML='';document.body.style.overflow=''}
function typePicker(p){
  const rx=state.caps.sample&&state.caps.img;
  openSheet(`<div><div class="label">${esc(p.name)}</div><h2>${t('pick_t')}</h2></div><div class="types">${rx?`<button class="wide" data-act="pick-rx"><span class="ticon">${I.scan}</span><span>${t('pick_rx')}<small>${t('pick_rx_d')}</small></span></button>`:''}${Object.keys(TYPE_META).map(k=>{const ty=TT(k),lk=false;return `<button data-act="${lk?'premium':'new-entry'}" data-type="${k}"${lk?' data-into="tp-prem" data-why="prem_med" class="lockedt"':''} style="--tc:var(${ty.color})${ty.wide?';grid-column:1/-1':''}"><span class="ticon">${I[ty.icon]}</span><span>${ty.label}${lk?PBADGE():''}<small>${ty.hint}</small></span></button>`}).join('')}<div id="tp-prem" hidden style="grid-column:1/-1"></div></div>`);
}
let draftPhoto=null,draftSex='',draftSpecies='Perro';
function petForm(p){
  p=p||{};draftPhoto=p.photo||null;draftSex=normSex(p.sex);draftSpecies=p.species||'Perro';const isNew=!p.id;
  const ph=()=>safeImg(draftPhoto)?`<img class="ph" src="${esc(safeImg(draftPhoto))}" alt="">`:`<div class="ph"><span class="mark"></span></div>`;
  const lab=x=>`<span class="label" style="text-transform:none;letter-spacing:0;font-size:13px">${x}</span>`;
  openSheet(`<h2>${isNew?t('pf_new'):esc(t('pf_edit',p.name))}</h2><form id="petform" class="fields" novalidate>
  <div class="full photo-pick"><div id="pp">${ph()}</div><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start">${isPremium()?`<label class="btn sm soft" for="petphoto">${draftPhoto?t('pf_chPh'):t('pf_addPh')}</label>`:`<button type="button" class="btn sm soft" data-act="premium" data-into="pf-prem">${draftPhoto?t('pf_chPh'):t('pf_addPh')}${PBADGE()}</button>`}<input id="petphoto" type="file" accept="image/*" hidden><button type="button" class="lnk" data-act="rm-photo" id="rmph" ${draftPhoto?'':'hidden'} style="color:var(--muted);font-size:13px">${t('pf_rmPh')}</button></div></div>
  <label class="f full">${t('pf_name')}<input id="pf-name" value="${esc(p.name||'')}" placeholder="${t('pf_namePh')}" autocomplete="off"></label>
  <div class="f full">${lab(t('pf_species'))}<div class="seg" id="seg-sp">${SPECIES.map(s=>premOk('species',s)||draftSpecies===s?`<button type="button" data-act="pick-sp" data-v="${s}" aria-pressed="${draftSpecies===s}">${spL(s)}</button>`:lockBtn(spL(s),'pf-prem')).join('')}</div></div>
  <label class="f full" id="pf-other-w" ${draftSpecies==='Otro'?'':'hidden'}>${t('pf_other')}<input id="pf-other" maxlength="40" value="${esc(p.speciesOther||'')}" placeholder="${t('pf_otherPh')}" autocomplete="off"></label>
  <div class="f full">${lab(t('pf_sex'))}<div class="seg" id="seg-sex" style="grid-template-columns:1fr 1fr">${SEXES.map(s=>`<button type="button" data-act="pick-sex" data-v="${s}" aria-pressed="${draftSex===s}">${sxL(s)}</button>`).join('')}</div></div>
  <label class="f">${t('f_breed')}<input id="pf-breed" value="${esc(p.breed||'')}" placeholder="${t('pf_breedPh')}"></label>
  <label class="f">${t('pf_weight')}<input id="pf-weight" inputmode="decimal" value="${esc(p.weight||'')}" placeholder="${t('pf_weightPh')}"></label>
  <label class="f full">${t('pf_birth')}<input id="pf-birth" type="date" max="${todayStr()}" value="${esc(p.birth||'')}"></label>
  <div id="pf-prem" class="full" hidden></div>
  <div id="pf-err" class="full err" hidden>${t('pf_err')}</div>
  <button class="btn dark block full" type="submit">${isNew?t('pf_add'):t('pf_save')}</button>
  ${isNew?'':`<div class="full" id="delpet">${delPetBtn(p)}</div>`}</form>`);
  $('#petphoto').addEventListener('change',async ev=>{const f=ev.target.files[0];if(!f)return;try{draftPhoto=await resizeImage(f,560,true);$('#pp').innerHTML=ph();$('#rmph').hidden=false}catch(e){toast(t('t_imgErr'))}});
  $('#petform').addEventListener('submit',ev=>{ev.preventDefault();const name=$('#pf-name').value.trim();if(!name){$('#pf-err').hidden=false;$('#pf-name').focus();return}
    const pet=Object.assign({},p,{id:p.id||uid('m'),name,species:draftSpecies,speciesOther:draftSpecies==='Otro'?$('#pf-other').value.trim():'',sex:draftSex,breed:$('#pf-breed').value.trim(),weight:$('#pf-weight').value.trim().replace(',','.'),birth:$('#pf-birth').value,photo:draftPhoto||null,entries:p.entries||[],createdAt:p.createdAt||Date.now()});
    closeSheet();savePet(pet,isNew?null:p);if(isNew)go('pet',pet.id);toast(isNew?t('t_petAdded'):t('t_saved'))});
}
const delPetBtn=p=>`<button type="button" class="btn ghost block" style="color:var(--warn)" data-act="ask-del-pet" data-pet="${esc(p.id)}">${t('pf_del')}</button>`;
function entryForm(p,type,e){
  e=e||{};const ty=TT(type);const isNew=!e.id;const F=ty.fields;const v=k=>esc(e[k]||'');
  let fx=`<label class="f full">${ty.titleL}<input id="ef-title" value="${v('title')}" placeholder="${ty.titlePh}" autocomplete="off"></label>`;
  if(F.includes('datetime'))fx+=`<label class="f full">${ty.dateL}<input id="ef-date" type="datetime-local" value="${v('date')}"></label>`;
  if(F.includes('ingredients'))fx+=`<label class="f full">${ty.ingL}<textarea id="ef-ingredients" placeholder="${ty.ingPh}">${v('ingredients')}</textarea></label>`;
  if(F.includes('steps'))fx+=`<label class="f full">${ty.stepsL}<textarea id="ef-steps" placeholder="${ty.stepsPh}">${v('steps')}</textarea></label>`;
  if(F.includes('dose'))fx+=`<label class="f">${ty.doseL||t('ef_dose')}<input id="ef-dose" value="${v('dose')}" placeholder="${ty.dosePh||t('ef_dosePh')}"></label>`;
  if(F.includes('freq'))fx+=`<label class="f">${t('ef_freq')}<input id="ef-freq" value="${v('freq')}" placeholder="${ty.freqPh||t('ef_freqPh')}"></label>`;
  if(F.includes('date'))fx+=`<label class="f full">${ty.dateL}<input id="ef-date" type="date" value="${esc(e.date||todayStr())}"></label>`;
  if(F.includes('next'))fx+=`<label class="f full">${ty.nextL}<input id="ef-next" type="date" value="${v('next')}"></label>`;
  if(F.includes('end'))fx+=`<label class="f full">${t('ef_end')}<input id="ef-end" type="date" value="${v('end')}"></label>`;
  if(F.includes('vet'))fx+=`<label class="f full">${t('ef_vet')}<input id="ef-vet" value="${v('vet')}" placeholder="${t('ef_vetPh')}"></label>`;
  let draftPh=(e.photos||[]).map(x=>Object.assign({},x));
  fx+=`<label class="f full">${t('ef_obs')}<textarea id="ef-notes" placeholder="${t('ef_notesPh')}">${v('notes')}</textarea></label>`;
  if(RECORD_PHOTOS)fx+=`<div class="f full"><span class="label" style="font-size:13px;color:var(--ink)">${t('ph_t')}</span><span class="ph-hint">${t('ph_d')}</span><div class="ph-grid" id="ef-ph"></div><input id="ef-file" type="file" accept="image/*" multiple hidden></div>`;
  openSheet(`<div style="display:flex;gap:12px;align-items:center;--tc:var(${ty.color})"><span class="ticon">${I[ty.icon]}</span><div><div class="label">${esc(p.name)}</div><h2>${isNew?ty.label:t('ef_edit',ty.label)}</h2></div></div><form id="entform" class="fields" novalidate>${fx}
  <div id="ef-err" class="full err" hidden>${t('ef_err',ty.titleL)}</div><button class="btn dark block full" type="submit">${t('save')}</button></form>`);
  if(RECORD_PHOTOS){const drawPh=()=>{$('#ef-ph').innerHTML=draftPh.map((x,i)=>`<div class="ph-t"><img src="${esc(safeImg(x.url||x.preview))}" alt=""><button type="button" class="ph-x" data-i="${i}" aria-label="${t('ph_rm')}">×</button></div>`).join('')+(draftPh.length<6?`<label class="ph-add" for="ef-file">${I.camera}${t('ph_add')}</label>`:'')};drawPh();
  $('#ef-ph').addEventListener('click',ev=>{const b=ev.target.closest('.ph-x');if(b){draftPh.splice(+b.dataset.i,1);drawPh()}});
  $('#ef-file').addEventListener('change',async ev=>{const fs=[...ev.target.files];ev.target.value='';let room=6-draftPh.length;if(fs.length>room)toast(t('ph_max'));if(!isPremium()){const used=Object.values(state.pets).reduce((a,x)=>a+(x.entries||[]).reduce((b,y)=>b+(y.photos||[]).length,0),0)-(e.photos||[]).length+draftPh.length,left=Math.max(0,5-used);if(fs.length>left)toast(t('ph_free'));room=Math.min(room,left)}for(const f of fs.slice(0,room)){try{const blob=await resizeImage(f,1400,false,true);draftPh.push({blob,preview:URL.createObjectURL(blob)});drawPh()}catch(er){toast(t('t_imgErr'))}}});}
  $('#entform').addEventListener('submit',async ev=>{ev.preventDefault();const g=id=>{const el=$('#'+id);return el?el.value.trim():''};
    const title=g('ef-title'),date=g('ef-date');if(!title||!date){$('#ef-err').hidden=false;return}
    const ne=Object.assign({},e,{id:e.id||uid('r'),type,title,date,next:g('ef-next'),end:g('ef-end'),dose:g('ef-dose'),freq:g('ef-freq'),vet:g('ef-vet'),notes:g('ef-notes'),ingredients:g('ef-ingredients'),steps:g('ef-steps')});
    let finalPh;const go=$('#entform button[type=submit]');try{go.disabled=true;go.classList.add('ph-busy');if(draftPh.some(x=>x.blob))go.textContent=t('ph_up');finalPh=await uploadPhotos(p,draftPh)}catch(er){console.warn(er);go.disabled=false;go.classList.remove('ph-busy');go.textContent=t('save');toast(t('ph_err'));return}
    const keep=new Set(finalPh.map(x=>x.path));removePhotos((e.photos||[]).filter(x=>!keep.has(x.path)));if(finalPh.length)ne.photos=finalPh;else delete ne.photos;
    if(e.next!==ne.next||e.date!==ne.date)ne.done=false;Object.keys(ne).forEach(k=>{if(ne[k]===''||ne[k]===undefined)delete ne[k]});
    closeSheet();if(isNew)addEntries(p.id,[ne]);else saveEntry(p.id,e,ne);toast(isNew?t('t_entryAdded'):t('t_entryUpd'))});
}

/* imágenes */
function resizeImage(file,max,square,asBlob){return new Promise((res,rej)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight,sx=0,sy=0,sw=w,sh=h;
  if(square){const s=Math.min(w,h);sx=(w-s)/2;sy=(h-s)/2;sw=sh=s;w=h=Math.min(max,s)}else{const k=Math.min(1,max/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k)}
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,w,h);URL.revokeObjectURL(url);
  if(asBlob)c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/jpeg',.85);else res(c.toDataURL('image/jpeg',.8))};img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('img'))};img.src=url})}

/* lector de recetas */
let rxResult=null;
async function readRx(p,file){
  openSheet(`<div class="label">${esc(p.name)}</div><h2>${t('rx_reading')}</h2><p class="muted" style="margin:0"><span class="spinner"></span>&nbsp; ${t('rx_wait')}</p>`);
  try{
    const blob=await resizeImage(file,1600,false,true);
    const prompt=`This image is a veterinary prescription (it may be handwritten, in any language) for a pet named "${p.name}" (${p.species||'pet'}). Today is ${todayStr()}.
Extract every prescribed medication. Reply ONLY with JSON in this shape:
{"legible":true|false,"veterinario":"vet or clinic name if shown, else empty","fecha":"YYYY-MM-DD if shown, else empty","medicamentos":[{"nombre":"name and strength","dosis":"amount per dose","frecuencia":"e.g. every 12 hours","duracion_dias":number or null,"indicaciones":"other short instructions"}]}
Write the text values in ${t('rx_lang')}. If something is not clearly legible, leave it empty instead of guessing. If the image is not a prescription, "legible":false and an empty list.`;
    const r=await state.caps.sample.json(prompt,{images:[blob],cache:false});
    rxResult=r&&Array.isArray(r.medicamentos)?r:{medicamentos:[]};showRx(p);
  }catch(e){
    const msg=e&&e.code==='not_granted'?t('rx_e_perm'):e&&e.code==='rate_limited'?t('rx_e_rate'):e&&e.code==='image_rejected'?t('rx_e_img'):t('rx_e_gen');
    openSheet(`<h2>${t('rx_failT')}</h2><p style="margin:0">${msg}</p><button class="btn dark block" data-act="close">${t('ok')}</button>`);
  }
}
function showRx(p){
  const r=rxResult,meds=r.medicamentos||[];
  if(!meds.length){openSheet(`<h2>${t('rx_noneT')}</h2><p style="margin:0" class="muted">${t('rx_noneD')}</p><div class="foot"><button class="btn ghost" data-act="close">${t('close')}</button><div class="r"><button class="btn dark" data-act="new-entry" data-type="med">${t('rx_manual')}</button></div></div>`);return}
  const start=r.fecha&&/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)?r.fecha:todayStr();
  openSheet(`<div><div class="label">${esc(p.name)}${t('rx_label')}</div><h2>${t('rx_revT')}</h2><p class="muted" style="margin:4px 0 0;font-size:14px">${t('rx_revD')}</p></div>
  <label class="f">${t('rx_start')}<input id="rx-start" type="date" value="${start}"></label>
  <div style="display:flex;flex-direction:column;gap:8px">${meds.map((m,i)=>`<label class="rx-item"><input type="checkbox" id="rx-${i}" checked><div style="min-width:0"><div style="font-weight:700">${esc(m.nombre||t('rx_noname'))}</div><div class="muted" style="font-size:13px">${esc([m.dosis,m.frecuencia,m.duracion_dias?t('rx_days',m.duracion_dias):''].filter(Boolean).join(' · '))}</div>${m.indicaciones?`<div style="font-size:13px">${esc(m.indicaciones)}</div>`:''}</div></label>`).join('')}</div>
  ${r.veterinario?`<p class="muted" style="margin:0;font-size:13px">${esc(t('rx_by',r.veterinario))}</p>`:''}
  <div class="foot"><button class="btn ghost" data-act="close">${t('rx_discard')}</button><div class="r"><button class="btn dark" data-act="save-rx" data-pet="${esc(p.id)}">${t('rx_save')}</button></div></div>`);
}
function saveRx(p){
  const start=$('#rx-start').value||todayStr();const add=[];
  (rxResult.medicamentos||[]).forEach((m,i)=>{if(!$('#rx-'+i).checked)return;const e={id:uid('r'),type:'med',title:m.nombre||'—',date:start,fromRx:true};
    if(m.duracion_dias)e.end=addDays(start,Math.max(0,Math.round(m.duracion_dias)-1));if(m.dosis)e.dose=m.dosis;if(m.frecuencia)e.freq=m.frecuencia;if(rxResult.veterinario)e.vet=rxResult.veterinario;if(m.indicaciones)e.notes=m.indicaciones;add.push(e)});
  closeSheet();if(!add.length)return;state.filter='todo';addEntries(p.id,add);toast(t('t_rxSaved',add.length));
}

/* navegación */
const VIEWS=['agenda','mascotas','ayuda','familia'];
function go(name,id){state.view={name,id};state.filter='todo';state.confirmEntry=null;const h=name==='pet'?'mascota-'+id:VIEWS.includes(name)?name:'';try{history.replaceState(null,'',h?'#'+h:location.pathname+location.search)}catch(e){location.hash=h}render();window.scrollTo(0,0)}
function fromHash(){const h=location.hash.slice(1);state.view=h.startsWith('mascota-')?{name:'pet',id:h.slice(8)}:VIEWS.includes(h)?{name:h}:{name:'home'};render()}
window.addEventListener('hashchange',fromHash);

document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
  const p=state.pets[el.dataset.pet]||(state.view.name==='pet'?state.pets[state.view.id]:null);
  if(a==='close-scrim'){if(ev.target===el)closeSheet();return}
  switch(a){
    case'lang':lang=el.dataset.v;try{localStorage.setItem(LANGKEY,lang)}catch(e){}if($('#layer').innerHTML)closeSheet();render();break;
    case'close':closeSheet();break;
    case'home':closeSheet();go('home');break;
    case'agenda':go('agenda');break;
    case'mascotas':go('mascotas');break;
    case'ayuda':go('ayuda');break;
    case'open':go('pet',el.dataset.pet);break;
    case'fab':if(state.view.name==='pet'&&p)typePicker(p);else petForm();break;
    case'view-ph':{const ee=(p.entries||[]).find(x=>x.id===el.dataset.e);if(ee){$('#layer').innerHTML=`<div class="viewer" role="dialog" aria-modal="true"><div class="track">${ee.photos.map(x=>`<div class="slide"><img src="${esc(safeImg(x.url))}" alt=""></div>`).join('')}</div><button class="btn vclose" data-act="close">${t('close')}</button></div>`;document.body.style.overflow='hidden';const sl=document.querySelectorAll('.viewer .slide')[+el.dataset.i];if(sl)sl.scrollIntoView({inline:'center',block:'nearest'})}break}
    case'export':if(!isPremium()){premiumSheet('prem_export');break}exportSheet(p);break;
    case'exp-print':closeSheet();if(isPremium())printHistory(p);break;
    case'exp-pdf':closeSheet();if(isPremium())downloadPdf(p);break;
    case'new-pet':petForm();break;
    case'edit-pet':petForm(p);break;
    case'pick-sp':draftSpecies=el.dataset.v;if($('#pf-other-w'))$('#pf-other-w').hidden=draftSpecies!=='Otro';document.querySelectorAll('#seg-sp button').forEach(b=>b.setAttribute('aria-pressed',b===el));break;
    case'pick-sex':draftSex=draftSex===el.dataset.v?'':el.dataset.v;document.querySelectorAll('#seg-sex button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===draftSex));break;
    case'rm-photo':draftPhoto=null;$('#pp').innerHTML='<div class="ph"><span class="mark"></span></div>';el.hidden=true;break;
    case'ask-del-pet':$('#delpet').innerHTML=`<div class="confirm"><b>${esc(t('pf_delQ',p.name))}</b><span style="font-size:14px">${t('pf_delNote')}</span><div style="display:flex;gap:8px"><button type="button" class="btn sm danger" data-act="del-pet" data-pet="${esc(p.id)}">${t('pf_delYes')}</button><button type="button" class="btn sm ghost" data-act="cancel-del-pet" data-pet="${esc(p.id)}">${t('cancel')}</button></div></div>`;break;
    case'cancel-del-pet':$('#delpet').innerHTML=delPetBtn(p);break;
    case'del-pet':{const n=p.name;closeSheet();(p.entries||[]).forEach(x=>removePhotos(x.photos));removePet(p.id);go('home');toast(t('t_petDel',n));break}
    case'new-entry':closeSheet();entryForm(p,el.dataset.type);break;
    case'pick-rx':closeSheet();{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=()=>{if(inp.files[0])readRx(p,inp.files[0])};inp.click()}break;
    case'edit-entry':{const e=(p.entries||[]).find(x=>x.id===el.dataset.e);if(e)entryForm(p,e.type,e);break}
    case'ask-del':state.confirmEntry=el.dataset.e;render();break;
    case'cancel-del':state.confirmEntry=null;render();break;
    case'del-entry':state.confirmEntry=null;removePhotos(((p.entries||[]).find(x=>x.id===el.dataset.e)||{}).photos);deleteEntry(p.id,el.dataset.e);toast(t('t_entryDel'));break;
    case'filter':state.filter=el.dataset.f;state.confirmEntry=null;render();break;
    case'done':{const x=(p.entries||[]).find(y=>y.id===el.dataset.e);if(x)saveEntry(p.id,x,Object.assign({},x,{done:true}))}toast(t('t_done'));break;
    case'save-rx':saveRx(p);break;
  }
});
document.addEventListener('change',ev=>{if(ev.target.id==='rxfile'){const f=ev.target.files[0];const p=state.pets[state.view.id];if(f&&p)readRx(p,f);ev.target.value=''}});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&$('#layer').innerHTML)closeSheet()});
fromHash();connect();
})();
