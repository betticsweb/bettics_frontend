// Synthetic fixtures only; every remote API is intercepted. No MongoDB or real account.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {settle}=require('../../bettics_backend/app/services/backtest/results');
const {createHandler}=require('../../bettics_backend/app/controllers/backtest-results');
const base=process.env.BACKTEST_BASE_URL || 'http://127.0.0.1:4300';
const predictions=[],matches=new Map();
const markets=[['CORNERS_OVER_85','OVER',8.5],['CORNERS_UNDER_105','UNDER',10.5],['GOLES_OVER_25','OVER',2.5],['CORNERS_LOCAL_GANA','HOME',null]];
for(let i=0;i<100;i++){
 const [mercado,seleccion,linea]=markets[i%4], id=String(1000+i), date=`2025-${String(1+Math.floor(i/25)).padStart(2,'0')}-${String(1+i%25).padStart(2,'0')}`;
 const liga=['Finland Veikkausliiga','Germany Bundesliga','Peru Primera Division'][i%3];
 predictions.push({match_id:id,fecha_partido:date,liga,temporada:'2025',mercado,periodo:'FT',seleccion,linea,segmento:['N1','N2','N3'][i%3],cuota:1.35+i%6*.15,version_politica:'DEMO_LOCAL_V1',tipo_evaluacion:'OOT'});
 if(i%9!==0)matches.set(id,[{strLeague:liga,dateEvent:date,strHomeTeam:'Equipo local',strAwayTeam:'Equipo visitante',cornerKicksHome:i%5+3,cornerKicksAway:i%4+2,intHomeScore:i%3,intAwayScore:1,__status:i%11===0?undefined:'FT'}]);
}
const handler=createHandler(async()=>({predictions,matches,source:'eventosLigaProb',statusConfigured:true}));
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));let apiCalls=0;const apiOrigins=new Set();
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/backtest/resultados' && (url.origin===base || url.hostname==='apianabet.herokuapp.com')){
   apiOrigins.add(url.origin);
   apiCalls++;let body,status=200;
   await handler({query:Object.fromEntries(url.searchParams)}, {status(s){status=s;return this},set(){return this},json(b){body=b;return this}});
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  }
  if(url.origin===base)return route.continue();
  if(url.hostname==='bettics-backend.onrender.com') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({resStatus:'ok',resResult:[],strLeague:[],strFecha:[]})});
  if(url.hostname==='fonts.googleapis.com')return route.fulfill({status:200,contentType:'text/css',body:''});
  return route.abort();
 });
 await page.addInitScript(()=>{const token=btoa(JSON.stringify({alg:'none'}))+'.'+btoa(JSON.stringify({exp:2000000000}))+'.simulation';localStorage.setItem('usuarioConectado',JSON.stringify({_id:'simulation',nombres:'Prueba',apellidos:'Local',token}));});
 await page.goto(base+'/cuenta/resultados',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>getComputedStyle(document.body).margin==='0px');await page.getByRole('button',{name:'Backtest histórico',exact:true}).click();
 await page.locator('.kpis strong').first().waitFor();console.log('Loaded summary');
 assert.equal(await page.locator('.kpis strong').first().textContent(),'100');
 assert((await page.locator('.notice').first().textContent()).includes('retrospectiva'));
 await page.locator('.badge').evaluate(el=>el.textContent='Datos simulados · Validación local');
 await page.waitForFunction(()=>{const el=document.querySelector('fuse-splash-screen');return !el || Number(getComputedStyle(el).opacity)===0;});
 await page.screenshot({path:'docs/screenshots/backtest-desktop.png',fullPage:true});
 const labels=page.locator('.filters label');
 await labels.filter({hasText:'Mercado'}).locator('select').selectOption('GOLES_OVER_25');
 await page.waitForFunction(()=>document.querySelector('.kpis strong')?.textContent==='25');
 assert.equal(await labels.filter({hasText:'Segmento'}).locator('option').filter({hasText:'N4'}).count(),0);
 await labels.filter({hasText:'Mercado'}).locator('select').selectOption('');await page.waitForFunction(()=>document.querySelector('.kpis strong')?.textContent==='100');
 await page.getByRole('button',{name:'Comparar segmentos',exact:true}).click();assert(await page.locator('tbody tr').count()>0);
 await page.getByRole('button',{name:'Evolución y detalle',exact:true}).click();await page.locator('svg polyline').waitFor();
 assert.equal(await page.locator('.panel').last().locator('tbody tr').count(),25);
 assert((await page.locator('.panel').last().textContent()).includes('pendiente'));
 await page.waitForFunction(()=>{const el=document.querySelector('fuse-splash-screen');return !el || Number(getComputedStyle(el).opacity)===0;});
 await page.screenshot({path:'docs/screenshots/backtest-evolution.png',fullPage:true});
 await page.getByRole('button',{name:'Siguiente',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.pagination')?.textContent.includes('Página 2'));
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>{const el=document.querySelector('fuse-splash-screen');return !el || Number(getComputedStyle(el).opacity)===0;});await page.screenshot({path:'docs/screenshots/backtest-mobile.png',fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.getByRole('button',{name:'Resultados actuales',exact:true}).click();assert.equal(await page.locator('app-backtest').count(),0);
 assert.deepEqual([...apiOrigins],[base]);assert(apiCalls>=4);assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: summary, market filters, permitted segments, comparison, evolution, pagination, pending outcomes, mobile layout and legacy view. All API data simulated.');
})().catch(e=>{console.error(e);process.exit(1)});
