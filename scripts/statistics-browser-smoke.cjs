// Frontend smoke test: every backend response is simulated; no real account is used.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.STATISTICS_BASE_URL || 'http://127.0.0.1:4200';
(async () => {
 const browser = await chromium.launch({executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
 const page = await browser.newPage({viewport: {width:1440,height:1000}});
 const errors=[]; page.on('pageerror', e => errors.push(e.message));
 const selections = [
  ['Total córners (N1)','Más de','8.5',2], ['Total córners (N2)','Menos de','10.5',2],
  ['Ganador del partido (N3)','1','',5], ['Ambos equipos marcan','Sí','',1],
  ['Ambos equipos marcan','No','',1], ['Total goles','Más de','2.5',1],
  ['Tarjetas','Más de','1.5',3], ['Tiros a puerta','Más de','4.5',4],
  ['Total goles primer tiempo','Más de','0.5',1], ['Total goles segundo tiempo','Más de','0.5',1],
  ['Equipo con más córners','A','',2]
 ];
 const row={dateEvent:'2026-10-20',idHomeTeam:'b',strHomeTeam:'B',idAwayTeam:'a',strAwayTeam:'A',intHomeScore:0,intAwayScore:2,cornerKicksHome:4,cornerKicksAway:5,totalCardsHome:1,totalCardsAway:2,shotsonGoalHome:2,shotsonGoalAway:3};
 await page.route('**/*', async route=> {
  const url=new URL(route.request().url());
  if(url.origin === new URL(baseUrl).origin) return route.continue();
  if(url.hostname==='fonts.googleapis.com') return route.fulfill({status:200,contentType:'text/css',body:''});
  if(url.hostname!=='bettics-backend.onrender.com') return route.abort();
  let data={resStatus:'ok',resResult:[]};
  if(url.pathname==='/api/recomendaciones/getCriterio') data.resResult=selections.map(([market,option,value],i)=>({_id:{cuotaCombinada:1.5},detalle:[{liga:'Liga',equipoLocal:'A',equipoVisitante:'B',idHomeTeam:'a',idAwayTeam:'b',mercadoApuesta:market,opcionApuesta:option,valorOpcionApuesta:value,fechaJuego:'2026-10-23',cuotaSimple:'1.50'}]}));
  if(url.pathname.endsWith('getMaestros')) data={resStatus:'ok',strLeague:['Liga']};
  if(url.pathname.endsWith('getTemporadas')) data={strSeason:['2026']};
  if(url.pathname.endsWith('getEquipos')) data={strHomeTeam:[{_id:{idHomeTeam:'a',strHomeTeam:'A'}}],strAwayTeam:[{_id:{idAwayTeam:'b',strAwayTeam:'B'}}]};
  if(url.pathname==='/api/eventosLiga/getCriterio') data={resStatus:'ok',partidosLosDosEquipos:[row],ultimos6Home:[row,{...row,intHomeScore:null,cornerKicksAway:null}],ultimos6Away:[row],soloLocal:[],soloVisita:[]};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.addInitScript(()=>{
  const token=btoa(JSON.stringify({alg:'none'}))+'.'+btoa(JSON.stringify({exp:2000000000}))+'.simulation';
  localStorage.setItem('usuarioConectado',JSON.stringify({_id:'simulation',nombres:'Prueba',apellidos:'Local',token}));
  sessionStorage.setItem('recommendation-filters',JSON.stringify({period:'all'}));
 });
 await page.goto(baseUrl + '/cuenta/recomendacion');
 await page.locator('.recommendation').first().waitFor();
 await page.waitForLoadState('networkidle');
 await page.evaluate(() => document.fonts.ready);
 const layout=await page.locator('.cards').first().evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length, boxes:[...el.querySelectorAll('.recommendation')].slice(0,3).map(x=>({x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y}))}));
 assert.equal(layout.columns,3); assert.equal(new Set(layout.boxes.map(x=>x.y)).size,1);
 const actions=await page.locator('.selection').first().evaluate(el=>({action:el.querySelector('.selection-actions').getBoundingClientRect().x,title:el.querySelector('h4').getBoundingClientRect().x}));
 assert(actions.action>actions.title);
 await page.locator('.selection-actions button').first().click();
 await page.locator('.swal2-popup').waitFor({state:'visible'});
 assert((await page.locator('.swal2-html-container').textContent()).includes('córners'));
 await page.getByRole('button',{name:'Entendido',exact:true}).click();
 await page.locator('.swal2-popup').waitFor({state:'hidden'});
 await page.screenshot({path:'/tmp/bettics-recommendations-desktop.png',fullPage:true});
 for(let i=0;i<selections.length;i++){
  if(i) {await page.goto(baseUrl + '/cuenta/recomendacion');await page.locator('.recommendation').first().waitFor();}
  await page.locator('.selection-actions a[title="Ver Estadísticas"]').nth(i).click();
  await page.locator('.stats-matchup').waitFor();
  const [market,option,value,tab]=selections[i];
  await page.waitForFunction(tab=>{const btn=[...document.querySelectorAll('.titleTab')].find(b=>b.classList.contains('active'));return btn && btn.textContent.trim()===['','Goles','Corners','Tarjetas','Tiros a Puerta','1X2'][tab]},tab);
  if(i===0||i===1){
   assert.equal(await page.locator('#corners select').filter({visible:true}).first().evaluate(el=>el.selectedOptions[0].textContent.trim()), value);
   assert((await page.locator('#corners').textContent()).includes('1/1 · 100 %'));
   assert.equal(await page.locator('#stats-direction').inputValue(),i === 0 ? 'mas' : 'menos');
   if(i === 0){
    await page.locator('#stats-direction').selectOption('menos');
    assert((await page.locator('#corners').textContent()).includes('0/1 · 0 %'));
    await page.locator('#stats-direction').selectOption('mas');
    assert((await page.locator('#corners').textContent()).includes('1/1 · 100 %'));
   }
  }
  if(i===2){assert((await page.locator('section[aria-label="Análisis específico del partido completo"]').textContent()).includes('derrota de B'));}
  if(i===3||i===4){assert.equal(await page.locator('#analysis-result').inputValue(),i===3?'si':'no');}
  if(i===8||i===9){
   assert((await page.locator('[role=status]').last().textContent()).includes('No hay datos disponibles'));
   assert.equal(await page.locator('.tab-pane.active .filtro-aplicado').count(),0);
  }
  if(i===10) assert.equal(await page.locator('#analysis-mode').inputValue(),'comparison');
  console.log('PASS navigation:', market, option, value);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS desktop 3 columns, right-side actions, help popup; all API responses simulated.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
