setTimeout(()=>{console.log("WATCHDOG TIMEOUT");process.exit(2)},60000).unref();
const {spawn}=require('child_process'),net=require('net'),http=require('http');
const PORT=18080;let ok=0,bad=0;
const t=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++};
const req=(o,body)=>new Promise(r=>{const q=http.request(Object.assign({host:'127.0.0.1',port:PORT,agent:false},o),res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>r({s:res.statusCode,h:res.headers,b}))});q.on('error',e=>r({err:e.code}));if(body)q.write(body);q.end()});
const raw=s=>new Promise(r=>{const c=net.connect(PORT,'127.0.0.1',()=>c.write(s));let b='';c.on('data',d=>b+=d);c.on('close',()=>r(b));c.on('error',()=>r('ERR'));setTimeout(()=>{c.destroy();r(b)},800)});
(async()=>{
 const p=spawn('node',['fascicul-releu.js'],{env:Object.assign({},process.env,{PORT}),cwd:require('path').join(__dirname,'..')});
 let log='';p.stdout.on('data',d=>log+=d);p.stderr.on('data',d=>log+=d);
 await new Promise(r=>setTimeout(r,700));
 t('health',(await req({path:'/fsc-health'})).b==='fascicul-relay');
 const crash=await raw('GET //[ HTTP/1.1\r\nHost: x\r\n\r\n'); t('malformed URL no crash (400)',/400/.test(crash));
 t('still alive after malformed',(await req({path:'/fsc-health'})).s===200);
 t('serves app',/<title>FASCICUL/.test((await req({path:'/'})).b));
 t('app has nosniff',(await req({path:'/'})).h['x-content-type-options']==='nosniff');
 t('bad topic 404',(await req({path:'/ab'})).s===404);
 t('foreign https origin 403',(await req({path:'/fsc-health',headers:{Origin:'https://evil.example'}})).s===403);
 t('LAN origin ok',(await req({path:'/fsc-health',headers:{Origin:'http://192.168.43.2:8080'}})).s===200);
 t('null (file) origin ok',(await req({path:'/fsc-health',headers:{Origin:'null'}})).s===200);
 const big=await req({method:'POST',path:'/roomabcdef',headers:{'Content-Type':'text/plain'}},'x'.repeat(40000)); t('413 on big body',big.s===413||big.err==='ECONNRESET');
 // SSE + stamped ip
 const got=await new Promise(res=>{const q=http.get({host:'127.0.0.1',port:PORT,agent:false,path:'/roomabcdef/sse'},r=>{let b='';r.on('data',c=>{b+=c;if(b.includes('"event":"message"')){q.destroy();res(b)}});setTimeout(()=>req({method:'POST',path:'/roomabcdef'},'hello'),200);setTimeout(()=>{q.destroy();res(b)},2500)});q.on('error',()=>{})});
 t('SSE delivers message',/"message":"hello"/.test(got)); t('SSE message carries sender ip',/"ip":"127\.0\.0\.1"/.test(got));
 // subscriber cap
 const socks=[];for(let i=0;i<70;i++){socks.push(http.get({host:'127.0.0.1',port:PORT,agent:false,path:'/capt'+(i%10)+'abcdef/sse'},r=>{}).on('error',()=>{}))}
 await new Promise(r=>setTimeout(r,1200));
 const x=await req({path:'/capzzzabcdef/sse'}).catch(()=>({}));
 t('SSE cap -> 503 or 429',x.s===503||x.s===429);
 socks.forEach(s=>s.destroy());
 // rate limit
 let lim=false;for(let i=0;i<150&&!lim;i++){const r=await req({method:'POST',path:'/ratetestabc'},'x');if(r.s===429)lim=true}
 t('rate limit triggers 429',lim);
 t('relay process still alive',p.exitCode===null);
 p.kill();console.log(`\n${ok} passed, ${bad} failed`);if(bad)console.log(log);process.exit(bad?1:0);
})();
