import pathlib
ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
import asyncio,sys,os,json,re,subprocess,time
from playwright.async_api import async_playwright
# kit 1.2.0: confirmările sunt FFF.dialog (nu window.confirm): scriptul acceptă dialogul (ultimul buton)
AUTO_DLG="""new MutationObserver(()=>{const d=document.querySelector('dialog[data-fff-dialog][open]');if(d){const b=d.querySelectorAll('button');if(b.length)b[b.length-1].click()}}).observe(document,{childList:true,subtree:true,attributes:true});"""
IP=sys.argv[1]; PORT=18090; BASE=f'http://{IP}:{PORT}/'
res=[];errs=[]
def ok(n,c,extra=''):
    res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n+(' '+str(extra) if extra and not c else ''),flush=True)
async def mk(browser,name,hold=None):
    ctx=await browser.new_context(viewport={'width':900,'height':640})
    await ctx.add_init_script(f"try{{localStorage.setItem('fsc_name','{name}')}}catch(e){{}}")
    pg=await ctx.new_page()
    await pg.add_init_script(AUTO_DLG)
    pg.on('pageerror',lambda e:errs.append((name,str(e))))
    return pg
async def wf(pg,expr,timeout=10000):
    t0=time.time()
    while (time.time()-t0)*1000<timeout:
        try:
            if await pg.evaluate(expr): return
        except Exception: pass
        await asyncio.sleep(0.15)
    raise TimeoutError(expr[:110])
async def ev(pg,js,arg=None): return await pg.evaluate(js,arg) if arg is not None else await pg.evaluate(js)
async def approve(host):
    await host.wait_for_selector('#appr',state='visible',timeout=20000); await host.click('#apprYes')
async def guest_join(browser,link,name,host):
    g=await mk(browser,name); await g.goto(link)
    await approve(host)
    await g.wait_for_selector('#board.on',timeout=25000); return g
async def main():
    relay=subprocess.Popen(['node','fascicul-releu.js'],cwd=ROOT,env=dict(os.environ,PORT=str(PORT)),stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    await asyncio.sleep(0.8)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
        host=await mk(b,'Ecran-host'); await host.goto(BASE)
        await wf(host, "window.__fsc.S.relay!==''",timeout=8000); ok('A1 releu detectat de pagina servita de releu',True)
        await host.click('#goHost'); await wf(host, "document.querySelector('#rvUrl').value.length>10",timeout=8000)
        link=await host.input_value('#rvUrl'); ok('A2 QR/link camera = adresa releului + #r=',link.startswith(BASE+'#r=') and 'fsc' in link,link)
        ok('A3 cod camera afisat',len(await host.inner_text('#rvCode'))>=8)
        g1=await guest_join(b,link,'Ana',host)
        await wf(host, "window.__fsc.S.links.size===1",timeout=10000); ok('A4 telefon conectat dupa aprobare (mDNS activ, cu corectia IP)',True)
        sdp=await ev(host,"(async()=>{const s=[...window.__fsc.S.slots.values()][0];const o=await window.__fsc.unpack(s.code);return o.s})()")
        print('   (oferta contine .local:',bool(re.search(r'\.local ',sdp)),')',flush=True)
        ok('A5 nume afisat pe ecran',await ev(host,"[...window.__fsc.S.slots.values()].find(s=>s.approved&&s.open).name")=='Ana')
        # ---- functional ----
        await g1.click('.tb[data-t=note]'); bx=await g1.locator('#cv').bounding_box()
        await g1.mouse.click(bx['x']+bx['width']/2,bx['y']+bx['height']/2); await g1.fill('#dlgT','Salut de la Ana'); await g1.click('#dlgOk')
        await wf(host, "[...window.__fsc.S.objs.values()].some(o=>o.t==='Salut de la Ana'&&o.a==='Ana')",timeout=8000); ok('B1 nota telefon -> ecran (autor=Ana)',True)
        await host.click('#invClose'); await host.click('.tb[data-t=pen]'); hb=await host.locator('#cv').bounding_box()
        await host.mouse.move(hb['x']+150,hb['y']+150); await host.mouse.down(); await host.mouse.move(hb['x']+400,hb['y']+260,steps=10); await host.mouse.up()
        await wf(g1, "[...window.__fsc.S.objs.values()].some(o=>o.k==='s'&&o.p.length>6)",timeout=8000); ok('B2 desen ecran -> telefon',True)
        await g1.evaluate("""async()=>{const c=document.createElement('canvas');c.width=300;c.height=200;const x=c.getContext('2d');x.fillStyle='#e33';x.fillRect(0,0,300,200);const b=await new Promise(r=>c.toBlob(r,'image/png'));await window.__fsc.addImageFile(new File([b],'t.png',{type:'image/png'}))}""")
        await wf(host, "[...window.__fsc.S.objs.values()].some(o=>o.k==='i'&&o._img)",timeout=10000); ok('B3 imagine PNG telefon -> ecran (decodata)',True)
        # laser keepalive
        await g1.click('.tb[data-t=laser]'); gb=await g1.locator('#cv').bounding_box()
        await g1.mouse.move(gb['x']+200,gb['y']+200); await g1.mouse.down(); await asyncio.sleep(2.4)
        alive=await ev(host,"[...window.__fsc.S.lasers.values()].length"); await g1.mouse.up(); ok('B4 laserul ramane vizibil cu degetul pe loc (2.4 s)',alive>=1,alive)
        # tema + blocare
        await host.click('#bTheme'); await wf(g1, "window.__fsc.S.theme==='light'",timeout=5000); ok('B5 tema alba sincronizata',True)
        await host.click('#bLock'); await wf(g1, "window.__fsc.S.locked===true",timeout=5000)
        before=await ev(g1,"window.__fsc.S.objs.size")
        await g1.evaluate("window.__fsc.S.locked=false;window.__fsc.S.tool='pen'") # simuleaza client desincronizat care desenează
        await g1.mouse.move(gb['x']+300,gb['y']+300); await g1.mouse.down(); await g1.mouse.move(gb['x']+420,gb['y']+330,steps=5); await g1.mouse.up()
        await asyncio.sleep(1.5)
        n_host=await ev(host,"window.__fsc.S.objs.size"); n_g=await ev(g1,"window.__fsc.S.objs.size")
        ok('B6 mod blocat: obiectul respins e retras la telefon (resync), stari identice',n_host==n_g,(n_host,n_g))
        await host.click('#bLock')
        # ---- sesiune ----
        async with host.expect_download() as d: await host.click('#bSave')
        dl=await d.value; path=__import__('tempfile').mkdtemp()+'/sess.json'; await dl.save_as(path)
        j=json.load(open(path)); ok('B7 sesiune salvata (JSON valid, cu imagine)',j['fascicul']==1 and any(o['k']=='i' and o.get('d','').startswith('data:image') for o in j['objs']))
        await host.evaluate("window.__fsc.S.objs.clear()"); await host.set_input_files('#fj',path)
        await wf(host, "window.__fsc.S.objs.size>=3",timeout=8000)
        await wf(g1, "window.__fsc.S.objs.size>=3",timeout=8000); ok('B8 sesiune incarcata si retransmisa telefoanelor',True)
        # ---- ostil ----
        g2=await guest_join(b,link,'ecran',host)       # nume rezervat
        await wf(host, "window.__fsc.S.links.size===2",timeout=10000)
        nm=await ev(host,"[...window.__fsc.S.slots.values()].map(s=>s.name)"); ok('C1 nume rezervat "Ecran" refuzat',all(x.lower()!='ecran' for x in nm),nm)
        await g2.evaluate("""()=>{const L=window.__fsc.S.link;
          L.send({o:'add',ob:{id:'x1',k:'s',c:'#fff',w:-5,p:[100,100]}});
          L.send({o:'upd',id:'x1',f:{w:-5}});
          L.send({o:'add',ob:{id:'n1',k:'n',x:1e12,y:-1e12,w:-100,t:'<img src=x onerror=alert(1)>',c:'red',a:'Ecran'}});
          L.send({o:'laser',id:'victima',x:5,y:5});
          L.send({o:'neg',s:'v=0\\r\\nm=video 9 X\\r\\nm=video 9 X\\r\\nm=audio 9 X\\r\\nm=video 9 X\\r\\n'});
          L.send({o:'add',ob:{id:'g2img',k:'i',x:10,y:10,w:100,h:80,n:3}});
          L.send({o:'imgc',id:'g2img',i:0,s:'data:image/png;base64,iVBORw0KGgo'});}""")
        await asyncio.sleep(1.2)
        st=await ev(host,"""(()=>{const S=window.__fsc.S;const x1=S.objs.get('x1'),n1=S.objs.get('n1');return{x1w:x1&&x1.w,n1:n1&&{x:n1.x,y:n1.y,w:n1.w,a:n1.a,c:n1.c},lasers:[...S.lasers.keys()],cams:document.querySelectorAll('#cams .cam').length}})()""")
        ok('C2 trazul cu grosime negativa e limitat (>=1)',st['x1w'] is not None and st['x1w']>=1,st)
        ok('C3 nota: coordonate/latime limitate, autor = numele real, culoare invalida -> alb',st['n1'] and -3000<=st['n1']['x']<=5000 and -3000<=st['n1']['y']<=5000 and 200<=st['n1']['w']<=800 and st['n1']['a']!='Ecran' and st['n1']['c']=='#ffffff',st)
        ok('C4 laser: id fortat la slot (nu "victima")','victima' not in st['lasers'],st['lasers'])
        ok('C5 negociere cu multe m-lines respinsa',st['cams']==0)
        # imagine in zbor: g3 intra dupa primul chunk
        g3=await guest_join(b,link,'Dan',host)
        await wf(g3, "window.__fsc.S.objs.has('g2img')",timeout=8000); ok('C6 telefon intrat in timpul unui transfer primeste imaginea in curs',True)
        # g1 (alt participant) incearca sa corupa chunk-ul altcuiva
        await g1.evaluate("window.__fsc.S.link.send({o:'imgc',id:'g2img',i:1,s:'XXXX'})"); await asyncio.sleep(0.6)
        got=await ev(host,"window.__fsc.S.pend.get('g2img').got"); ok('C7 chunk de la un NON-proprietar ignorat',got==1,got)
        # proprietarul termina
        await g2.evaluate("""()=>{const L=window.__fsc.S.link;const c=document.createElement('canvas');c.width=8;c.height=8;c.getContext('2d').fillRect(0,0,8,8);const d=c.toDataURL('image/png');const a=d.slice(0,Math.floor(d.length/2)),b2=d.slice(Math.floor(d.length/2));
          // inlocuieste continutul: chunk0 deja trimis e fals; trimitem un obiect nou complet cu 3 bucati
          L.send({o:'add',ob:{id:'g2ok',k:'i',x:50,y:50,w:80,h:80,n:3}});
          const t=Math.floor(d.length/3);L.send({o:'imgc',id:'g2ok',i:0,s:d.slice(0,t)});setTimeout(()=>{L.send({o:'imgc',id:'g2ok',i:1,s:d.slice(t,2*t)});L.send({o:'imgc',id:'g2ok',i:2,s:d.slice(2*t)})},300)}""")
        await wf(host, "(()=>{const o=window.__fsc.S.objs.get('g2ok');return o&&o._img})()",timeout=8000)
        await wf(g3, "(()=>{const o=window.__fsc.S.objs.get('g2ok');return o&&o._img})()",timeout=8000); ok('C8 imagine in zbor se completeaza pe ecran si la telefonul intrat pe parcurs',True)
        # deconectare la jumatate: g2img ramas incomplet -> sters cand g2 pleaca
        await g2.evaluate("window.__fsc.S.kicked=true;window.__fsc.S.link.send({o:'bye'})"); await asyncio.sleep(1.2)
        gone=await ev(host,"!window.__fsc.S.objs.has('g2img')&&!window.__fsc.S.pend.has('g2img')"); ok('C9 imagine incompleta a celui plecat e eliminata',gone)
        # inundatie
        await g1.evaluate("()=>{const L=window.__fsc.S.link;for(let i=0;i<8000;i++)L.send({o:'laser',id:'f'+i,x:i%100,y:i%100});L.send({o:'x',z:'y'.repeat(100000)})}")
        t0=time.time(); r=await ev(host,"1+1"); dt=time.time()-t0; ok('C10 inundatie cu 8000 mesaje + mesaj de 100 KB: ecranul ramane receptiv',r==2 and dt<1.5,dt)
        nl=await ev(host,"window.__fsc.S.lasers.size"); ok('C11 numarul de lasere limitat',nl<=61,nl)
        # randare ok dupa tot
        await host.screenshot(path=__import__('tempfile').mkdtemp()+'/host_after.png')
        # ---- reconectare ----
        names0=await ev(host,"[...window.__fsc.S.slots.values()].filter(s=>s.approved&&s.open).map(s=>s.name).sort()")
        print('   conectati inainte:',names0,flush=True)
        ok('C12 participantul care inunda a fost deconectat de protectie (Ana nu mai e)', 'Ana' not in names0, names0)
        await g1.wait_for_selector('#lost.on',timeout=8000); ok('D1 pierdere detectata, ecran de reconectare',True)
        await approve(host)
        await g1.wait_for_selector('#lost.on',state='hidden',timeout=30000); ok('D2 reconectare automata dupa pierdere (reaproba)',True)
        await wf(g1,"window.__fsc.S.objs.size>=3",timeout=8000); ok('D3 starea tablei refacuta dupa reconectare',True)
        await asyncio.sleep(1); names1=await ev(host,"[...window.__fsc.S.slots.values()].filter(s=>s.approved&&s.open).map(s=>s.name).sort()")
        ok('D4 fara dubluri pe ecran dupa reconectare',names1==['Ana','Dan'],names1)
        # respingere: gazda refuza, telefonul NU se reconecteaza
        g4=await mk(b,'Intrus'); await g4.goto(link)
        await host.wait_for_selector('#appr',state='visible',timeout=20000); await host.click('#apprNo')
        await g4.wait_for_selector('#lost.on',timeout=10000); await asyncio.sleep(9)
        vis=await g4.evaluate("getComputedStyle(document.querySelector('#lostBtn')).display!=='none'&&window.__fsc.S.kicked===true"); ok('D6 telefon respins: fara reconectare automata, buton de reincarcare',vis)
        names2=await ev(host,"[...window.__fsc.S.slots.values()].filter(s=>s.approved&&s.open).map(s=>s.name).sort()"); ok('D7 telefonul respins nu apare printre cei conectati','Intrus' not in names2,names2)
        # heartbeat: g3 nu mai trimite nimic
        await g3.evaluate("window.__fsc.S.link.send=function(){}")
        t0=time.time()
        await wf(host, "![...window.__fsc.S.slots.values()].some(s=>s.name==='Dan')",timeout=35000); ok('D5 telefon mut (fara ping) eliminat in ~20 s',True,round(time.time()-t0,1)); print('   timp:',round(time.time()-t0,1),flush=True)
        print('erori de pagina:',errs,flush=True); ok('E1 nicio exceptie in pagini',len(errs)==0,errs)
        await b.close()
    relay.terminate()
    print(f"\n{sum(res)}/{len(res)} trecute"); sys.exit(0 if all(res) else 1)
asyncio.run(main())
