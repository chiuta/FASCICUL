import pathlib
ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
import asyncio,sys,os,json,time,base64
import cv2,numpy as np
from playwright.async_api import async_playwright
APP='file://'+ROOT+'/fascicul.html'; res=[];errs=[]
def ok(n,c,extra=''):
    res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n+(' '+str(extra) if extra and not c else ''),flush=True)
async def wf(pg,expr,timeout=10000):
    t0=time.time()
    while (time.time()-t0)*1000<timeout:
        try:
            if await pg.evaluate(expr): return
        except Exception: pass
        await asyncio.sleep(0.15)
    raise TimeoutError(expr[:110])
async def mk(b,name):
    ctx=await b.new_context(viewport={'width':900,'height':640}); await ctx.add_init_script(f"try{{localStorage.setItem('fsc_name','{name}')}}catch(e){{}}")
    pg=await ctx.new_page(); pg.on('dialog',lambda d:asyncio.ensure_future(d.accept())); pg.on('pageerror',lambda e:errs.append((name,str(e)))); return pg
def decode(dataurl):
    raw=base64.b64decode(dataurl.split(',')[1]); img=cv2.imdecode(np.frombuffer(raw,np.uint8),cv2.IMREAD_GRAYSCALE)
    t=cv2.QRCodeDetectorAruco().detectAndDecode(img)[0]
    return t
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
        host=await mk(b,'H'); await host.goto(APP); await host.click('#goHost')
        await wf(host,"document.querySelector('#codeO').value.startsWith('F')",timeout=15000)
        code=await host.input_value('#codeO')
        qr=await host.evaluate("document.querySelector('#qrO').toDataURL()")
        ok('M1 QR-ul desenat in pagina (codul ecranului) se decodeaza exact',decode(qr)==code)
        ok('M2 fara releu: cutia camerei ascunsa, manual deschis',await host.evaluate("getComputedStyle(document.querySelector('#rvBox')).display==='none'&&document.querySelector('#manualBox').open"))
        g=await mk(b,'Maria'); await g.goto(APP); await g.click('#goGuest'); await g.fill('#offIn',code); await g.click('#offGo')
        await wf(g,"document.querySelector('#codeA').value.startsWith('F')",timeout=15000)
        ans=await g.input_value('#codeA'); qa=await g.evaluate("document.querySelector('#qrA').toDataURL()")
        ok('M3 QR-ul raspunsului telefonului se decodeaza exact',decode(qa)==ans)
        await host.fill('#ansIn',ans); await host.click('#ansGo')
        await g.wait_for_selector('#board.on',timeout=20000); ok('M4 impereche manuala (fara releu) reuseste, fara aprobare',True)
        await wf(host,"window.__fsc.S.links.size===1",timeout=8000)
        # camera live
        await g.click('#bCam')
        await wf(host,"(()=>{const c=document.querySelector('#cams .cam');return !!c&&c.style.display==='block'})()",timeout=15000); ok('N1 camera live apare pe ecran la prima pornire (cursa remediata)',True)
        await wf(host,"(()=>{const v=document.querySelector('#cams .cam video');return v&&v.videoWidth>0})()",timeout=15000); ok('N2 fluxul video are cadre (videoWidth>0)',True)
        await g.click('#bCam'); await wf(host,"document.querySelector('#cams .cam').style.display==='none'",timeout=8000); ok('N3 camera oprita -> ascunsa pe ecran',True)
        await g.click('#bCam'); await wf(host,"document.querySelector('#cams .cam').style.display==='block'",timeout=8000); ok('N4 camera repornita -> reapare',True)
        await g.click('#bFlip'); await asyncio.sleep(1.0); ok('N5 intoarcere camera fara eroare',await g.evaluate("!!window.__fsc.S.camStream"))
        # deconectare de la ecran: fara reconectare
        await host.evaluate("(()=>{const s=[...window.__fsc.S.slots.values()].find(s=>s.open&&s.approved);s.link.send({o:'kick'})})()")
        await g.wait_for_selector('#lost.on',timeout=8000); await asyncio.sleep(2)
        ok('M5 deconectat de ecran: mesaj clar, fara reconectare automata, camera oprita',await g.evaluate("window.__fsc.S.kicked===true&&!window.__fsc.S.camStream&&getComputedStyle(document.querySelector('#lostBtn')).display!=='none'"))
        # cod ostil
        bad=await host.evaluate("""(async()=>{const r=[];for(const c of ['F1'+'A'.repeat(50),'F0'+btoa('x'.repeat(200000)).replace(/[+]/g,'-').replace(/[/]/g,'_').replace(/=+$/,''),'F1'+btoa('zzzz').slice(0,40)]){try{await window.__fsc.unpack(c);r.push('ACCEPTED')}catch(e){r.push('rejected')}}return r})()""")
        ok('M6 coduri malformate / prea mari sunt respinse fara blocaj',all(x=='rejected' for x in bad),bad)
        print('erori:',errs,flush=True); ok('M7 nicio exceptie in pagini',not errs,errs)
        await b.close()
    print(f"\n{sum(res)}/{len(res)} trecute"); sys.exit(0 if all(res) else 1)
asyncio.run(main())
