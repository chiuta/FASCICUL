import pathlib
ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
import asyncio,sys,os,subprocess,time
from playwright.async_api import async_playwright
# kit 1.2.0: confirmările sunt FFF.dialog (nu window.confirm): scriptul acceptă dialogul (ultimul buton)
AUTO_DLG="""new MutationObserver(()=>{const d=document.querySelector('dialog[data-fff-dialog][open]');if(d){const b=d.querySelectorAll('button');if(b.length)b[b.length-1].click()}}).observe(document,{childList:true,subtree:true,attributes:true});"""
IP=sys.argv[1];PORT=18091;BASE=f'http://{IP}:{PORT}/'
async def run(patch):
    relay=subprocess.Popen(['node','fascicul-releu.js'],cwd=ROOT,env=dict(os.environ,PORT=str(PORT)),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); await asyncio.sleep(0.8)
    async with async_playwright() as p:
        b=await p.chromium.launch()
        async def mk():
            ctx=await b.new_context()
            if patch:
                async def h(route):
                    r=await route.fetch(); body=await r.text()
                    assert "function fixMdns(sdp,ip){" in body
                    body=body.replace("function fixMdns(sdp,ip){","function fixMdns(sdp,ip){if(typeof sdp==='string')return sdp;",1)
                    await route.fulfill(status=200,headers={'content-type':'text/html; charset=utf-8'},body=body)
                await ctx.route(BASE,h)
            pg=await ctx.new_page(); await pg.add_init_script(AUTO_DLG); return pg
        host=await mk(); await host.goto(BASE); await host.click('#goHost')
        for _ in range(60):
            if len(await host.input_value('#rvUrl'))>10: break
            await asyncio.sleep(0.2)
        link=await host.input_value('#rvUrl'); g=await mk(); await g.goto(link)
        t0=time.time(); connected=False
        while time.time()-t0<28:
            try:
                if await host.is_visible('#appr'): await host.click('#apprYes')
                if await g.evaluate("document.querySelector('#board').classList.contains('on')"): connected=True;break
            except Exception: pass
            await asyncio.sleep(0.4)
        await b.close()
    relay.terminate(); return connected,round(time.time()-t0,1)
async def main():
    print('FARA corectia IP (mDNS .local ramane):',await run(True),flush=True)
    print('CU corectia IP:',await run(False),flush=True)
asyncio.run(main())
