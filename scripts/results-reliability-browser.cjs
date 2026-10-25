// All API data in this browser test is synthetic. Bundesliga aggregates reproduce
// the independently verified v70 reference; fixture games are NOT real recommendations.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHandler}=require('../../bettics_backend/app/controllers/backtest-results');
const base=process.env.RESULTS_BASE_URL||'http://127.0.0.1:4305';
const league='Germany Bundesliga';
const predictions=[],matches=new Map();let seq=1000;
function add(liga,season,market,segment,odds,win,day=18){
 const id=String(++seq),date=`2026-${season==='2025/2026'?'05':'10'}-${String(day).padStart(2,'0')}`;
 const goals=market==='GOLES_OVER_25',under=market==='CORNERS_UNDER_105';
 predictions.push({match_id:id,fecha_partido:date,liga,temporada:season,mercado:market,periodo:'FT',seleccion:under?'UNDER':'OVER',linea:goals?2.5:under?10.5:8.5,segmento:segment,cuota:odds,version_politica:'DEMO_LOCAL',tipo_evaluacion:'OOT'});
 matches.set(id,[{dateEvent:date,strLeague:liga,strHomeTeam:'Local de prueba '+id,strAwayTeam:'Visitante de prueba',intHomeScore:win?2:0,intAwayScore:win?1:0,cornerKicksHome:4,cornerKicksAway:under?(win?5:7):(win?5:4),status:'complete'}]);
}
[...Array(15).fill(1.35),1.28,1.43,1.43].forEach((odd,i)=>add(league,'2026/2027','CORNERS_OVER_85','N1',odd,i<16,1+i));
[...Array(10).fill(1.42),1.39,1.36].forEach((odd,i)=>add(league,'2026/2027','CORNERS_OVER_85','N2',odd,i<11,1+i));
for(let i=0;i<6;i++)add(league,'2025/2026','CORNERS_OVER_85','N1',1.4,true,1);
for(let i=0;i<28;i++)add('Peru Primera Division','2026','CORNERS_UNDER_105',i%2?'N1':'N2',1.6,i%3!==0,20);
for(let i=0;i<4;i++)add(league,'2026/2027','GOLES_OVER_25','N3',1.5,i%2===0,18);
const handler=createHandler(async()=>({predictions,matches,source:'fixture',statusConfigured:true,drawRule:'pending'}));
const selections=[
 {liga:league,mercadoApuesta:'Total corners (N1)',opcionApuesta:'Más de',valorOpcionApuesta:'8.5'},
 {liga:league,mercadoApuesta:'Total corners (N2)',opcionApuesta:'Más de',valorOpcionApuesta:'8.5'},
 {liga:league,mercadoApuesta:'Ambos equipos marcan (N1)',opcionApuesta:'Sí',valorOpcionApuesta:''}
].map((row,i)=>({...row,equipoLocal:'Local de prueba '+(i+1),equipoVisitante:'Visitante de prueba',cuotaSimple:'1.40',fechaJuego:'2026-10-25'}));
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});page.setDefaultTimeout(20000);const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/backtest/resultados'){
   requests.push(Object.fromEntries(url.searchParams));let body,status=200;
   await handler({query:Object.fromEntries(url.searchParams)},{set(){return this},status(s){status=s;return this},json(b){body=b;return this}});
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  }
  if(url.origin===base)return route.continue();
  if(url.hostname==='bettics-backend.onrender.com'){
   if(url.pathname.startsWith('/api/resultados/'))throw Error('Legacy Results API should not be called');
   const body=url.pathname==='/api/recomendaciones/getCriterio'?{resStatus:'ok',resResult:selections.map(d=>({_id:{cuotaCombinada:1.4},detalle:[d]}))}:{resStatus:'ok',resResult:[],strLeague:[],strFecha:[]};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  }
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({status:200,contentType:'text/css',body:''});
  return route.abort();
 });
 await page.addInitScript(()=>{
  const token=btoa('{}')+'.'+btoa(JSON.stringify({exp:2000000000}))+'.test';
  localStorage.setItem('usuarioConectado',JSON.stringify({_id:'fixture',nombres:'Prueba',apellidos:'Local',token}));
  sessionStorage.setItem('recommendation-filters',JSON.stringify({period:'all'}));
 });
 const settled=()=>page.waitForFunction(()=>{const el=document.querySelector('fuse-splash-screen');return !el||Number(getComputedStyle(el).opacity)===0;});
 await page.goto(base+'/cuenta/recomendacion',{waitUntil:'domcontentloaded'});
 await page.locator('.recommendation').first().waitFor();await settled();await page.evaluate(()=>document.fonts.ready);
 const dimensions=()=>page.locator('.recommendation').evaluateAll(els=>els.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
 const current=await dimensions();
 const old=await page.addStyleTag({content:'.reliability-action{display:none!important}.selection-actions{gap:8px!important}.selection-actions a,.selection-actions button{height:auto!important;min-height:36px!important;padding:6px!important}'});
 const previous=await dimensions();await old.evaluate(el=>el.remove());
 previous.forEach((r,i)=>{assert(Math.abs(r.width-current[i].width)<.6);assert(Math.abs(r.height-current[i].height)<.6,`Card height changed: ${r.height} -> ${current[i].height}`)});
 const layout=await page.locator('.cards').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);assert.equal(layout,3);
 const actions=await page.locator('.selection-actions').first().locator('a,button').evaluateAll(els=>els.map(el=>({title:el.title,box:el.getBoundingClientRect().toJSON(),text:getComputedStyle(el.querySelector('span')).display})));
 assert.deepEqual(actions.map(a=>a.title),['Ver Estadísticas','Fiabilidad','¿Qué significa?']);
 assert(actions.every(a=>a.text==='none'));assert.equal(new Set(actions.map(a=>a.box.x)).size,1);assert(actions[0].box.y<actions[1].box.y&&actions[1].box.y<actions[2].box.y);
 await page.evaluate(()=>{const note=document.createElement('p');note.textContent='CAPTURA DE VALIDACIÓN · DATOS DE PRUEBA';note.style.cssText='font:700 12px Arial;color:#805d00';document.querySelector('.intro').appendChild(note)});
 fs.mkdirSync('docs/screenshots/results-ux',{recursive:true});
 await page.screenshot({path:'docs/screenshots/results-ux/recommendations-desktop.png'});
 await page.locator('.recommendation').first().screenshot({path:'docs/screenshots/results-ux/recommendation-card.png'});
 await page.locator('.selection-actions .reliability-action').first().click();
 await page.waitForFunction(()=>document.querySelector('.kpis strong')?.textContent==='18');await settled();
 let url=new URL(page.url());assert.equal(url.pathname,'/cuenta/resultados');
 for(const [key,val]of Object.entries({liga:league,mercado:'CORNERS_OVER_85',segmento:'N1',temporada:'2026/2027'}))assert.equal(url.searchParams.get(key),val);
 assert((await page.locator('.kpis article').nth(1).textContent()).includes('19.61'));
 assert.equal(await page.locator('.filters label').filter({hasText:'Liga'}).locator('select').inputValue(),league);
 assert.equal(await page.locator('.filters label').filter({hasText:'Segmento'}).locator('select').inputValue(),'N1');
 assert.equal(await page.getByRole('button',{name:'Resultados actuales',exact:true}).count(),0);
 const last=requests.at(-1);assert.equal(last.segmento,'N1');assert.equal(last.temporada,'2026/2027');
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.kpis strong')?.textContent==='18');await settled();
 assert.equal(new URL(page.url()).searchParams.get('segmento'),'N1');assert((await page.locator('.reliability-context').textContent()).includes('N1'));
 await page.goto(base+'/cuenta/recomendacion',{waitUntil:'domcontentloaded'});await page.locator('.reliability-action').nth(1).waitFor();await settled();await page.locator('.reliability-action').nth(1).click();
 await page.waitForFunction(()=>document.querySelector('.kpis strong')?.textContent==='12');await settled();assert((await page.locator('.kpis article').nth(1).textContent()).includes('29.92'));
 await page.locator('.filters label').filter({hasText:'Segmento'}).locator('select').selectOption('');
 await page.waitForFunction(()=>document.querySelector('.kpis strong')?.textContent==='30');await settled();assert((await page.locator('.kpis article').nth(1).textContent()).includes('23.73'));
 await page.locator('.badge').evaluate(el=>el.textContent='Datos de prueba · Validación local');
 const columns=await page.locator('.ranking-table thead th').allTextContents();assert(columns[2].includes('ROI'));assert(columns[3].includes('Aprobados'));
 await page.screenshot({path:'docs/screenshots/results-ux/results-desktop.png',fullPage:true});
 for(const field of ['Mercado','Liga','ROI','Aprobados']){
  const button=page.locator('.ranking-table thead').getByRole('button',{name:new RegExp('^'+field)});
  await button.click();const dir=new URL(page.url()).searchParams.get('direccion');await button.click();assert.notEqual(new URL(page.url()).searchParams.get('direccion'),dir);
 }
 await page.getByRole('button',{name:'Comparar segmentos',exact:true}).click();assert.equal(await page.locator('.ranking-table tbody tr').count(),2);
 await page.locator('.ranking-table thead').getByRole('button',{name:/^Aprobados/}).click();
 if(new URL(page.url()).searchParams.get('direccion')!=='asc')await page.locator('.ranking-table thead').getByRole('button',{name:/^Aprobados/}).click();
 assert((await page.locator('.ranking-table tbody tr').first().textContent()).includes('N2'));
 await page.locator('.ranking-table thead').getByRole('button',{name:/^Aprobados/}).click();assert((await page.locator('.ranking-table tbody tr').first().textContent()).includes('N1'));
 await page.getByRole('button',{name:'Evolución y detalle',exact:true}).click();await page.locator('.detail-table').waitFor();
 assert.equal(await page.locator('.detail-table tbody tr').count(),25);assert((await page.locator('.detail-table').textContent()).includes('Córners:'));
 assert(await page.locator('#backtest-detail').evaluate(el=>el.compareDocumentPosition(document.getElementById('backtest-curve'))&Node.DOCUMENT_POSITION_FOLLOWING));
 await page.getByRole('button',{name:'Siguiente',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.pagination')?.textContent.includes('Página 2'));await settled();assert.equal(await page.locator('.detail-table tbody tr').count(),5);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('.detail-table').waitFor();assert.equal(new URL(page.url()).searchParams.get('pagina'),'2');await settled();
 await page.locator('.badge').evaluate(el=>el.textContent='Datos de prueba · Validación local');await page.screenshot({path:'docs/screenshots/results-ux/results-detail.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/screenshots/results-ux/results-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(base+'/cuenta/recomendacion',{waitUntil:'domcontentloaded'});await page.locator('.reliability-action').first().waitFor();await settled();
 assert.equal(await page.locator('.cards').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
 await page.locator('.reliability-action').nth(2).click();await page.locator('.context-warning').waitFor();await settled();assert.equal(await page.locator('.kpis').count(),0);assert((await page.locator('.context-warning').textContent()).includes('mercado equivalente'));
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('.context-warning').waitFor();assert.equal(await page.locator('.kpis').count(),0);
 assert(requests.every(r=>!('direccion'in r)&&!('vista'in r)&&!('origen'in r)&&!('orden'in r)));
 assert.deepEqual(errors,[]);
 console.log('PASS: 3 unchanged desktop cards; vertical Statistics/Reliability/Help icons; N1/N2/all-segment reference; persistent URL, latest season per league, sorting, first-position paginated detail, real-score labels, mobile and unsupported context. API responses simulated.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
