/**
 * <StartUI /> – React port of the Unity "StartUI" Timeline (1920x1080 design canvas, scaled to fit its parent).
 *
 * Swap placeholders for your own art:
 *   <StartUI assets={{
 *     cat:{src:catSheet, cols:5, rows:1, frames:5,  fps:12},   // spritesheet
 *     bg: {src:bgSheet,  cols:9, rows:5, frames:45, fps:40},   // spritesheet
 *     skill:{src:skillPng}, item:{src:itemPng}, conf:{src:confPng},
 *     num1:{src:n1}, num2:{src:n2}, command:{src:cmd}, yen:{src:yen} }} />
 * Fonts: declare @font-face for your TTFs, then pass fonts={{ui:'"Flap Jacks", sans-serif', wild:'"CC Wild Words", sans-serif'}}.
 * Menu: after the intro the animation holds on its last frame (loop=false). Up/Down arrows move the selector between `buttons`
 *   (ids from timeline.js: 'skill','item','conf'), `descriptions` sets the DESC text per button, Enter calls onConfirm(index,id).
 * `active={false}` makes the menu ignore the keyboard (use it while another screen is on top). It keeps its state, so it is still on its last frame when you show it again.
 * Imperative API via ref: replay(), play(), pause(), seek(seconds).
 */
import {forwardRef,memo,useCallback,useEffect,useImperativeHandle,useMemo,useRef,useState} from 'react';
import {W,H,DUR,T,TR,ACT,SMOOTH,SHAKE,L,ev,qrot,noise} from './timeline';
import PH,{DEFAULT_ASSETS} from './placeholders';

let uid=0;const NODES=[];
(function walk(l){for(const o of l){o.id=o.id||'n'+(uid++);NODES.push(o);walk(o.k||[])}})(T);
const base=o=>({x:o.x||0,y:o.y||0,r:o.r||0,sx:o.sx??1,sy:o.sy??1,a:1});
const tf=v=>`translate(${v.x}px,${-v.y}px) rotate(${-v.r}deg) scale(${v.sx},${v.sy})`;
const phCache={};const ph=k=>phCache[k]||(phCache[k]=PH[k]());
// Final (end-of-timeline) rectangle of a button, used to place the selector (UIController.Encapsulate).
const finalVal=(id,p,d)=>{let v=d;for(const t of TR)if(t.to.includes(id)&&t.p[p])v=ev(t.p[p],99,SMOOTH.has(p));return v};
const btnRect=id=>{const o=NODES.find(n=>n.id===id),sx=finalVal(id,'sx',o.sx??1),sy=finalVal(id,'sy',o.sy??1);
 return{cx:finalVal(id,'x',o.x||0),cy:finalVal(id,'y',o.y||0),hw:o.w*sx/2,hh:o.h*sy/2}};
const rnd=m=>(Math.random()*2-1)*m,PAD=15;
const NB={position:'absolute',left:'50%',top:'50%',display:'flex',alignItems:'center',justifyContent:'center',whiteSpace:'nowrap',backgroundRepeat:'no-repeat'};

const Node=memo(function Node({o,reg,assets,fonts,blend,desc}){
 const txt=o.id==='desc'?desc:o.txt;
 const a=o.as?assets[o.as]:null;
 const style={...NB,width:o.w,height:o.h,marginLeft:-o.w/2,marginTop:-o.h/2,fontSize:o.fs,color:o.fc,fontFamily:o.ff?fonts[o.ff]:undefined,
  background:o.bg,display:o.hide?'none':'flex',filter:o.dark?'brightness(0)':undefined,transform:tf(base(o))};
 if(a){style.backgroundImage=`url(${a.src||ph(o.as)})`;style.backgroundSize=`${(a.cols||1)*100}% ${(a.rows||1)*100}%`}
 return <div ref={el=>reg(o.id,el)} style={style}>
  {txt&&(!a||!a.src)&&<span style={a?{position:'absolute',transform:'skewX(-12deg)'}:undefined}>{txt}</span>}
  {o.svg&&<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position:'absolute',left:0,top:0}}>
   <polygon ref={el=>reg('pr',el)} fill="rgb(252,0,3)" style={{mixBlendMode:blend.red,display:'none'}}/>
   <polygon ref={el=>reg('pb',el)} fill="rgb(5,255,245)" style={{mixBlendMode:blend.blue,display:'none'}}/></svg>}
  {(o.k||[]).map(k=><Node key={k.id} o={k} reg={reg} assets={assets} fonts={fonts} blend={blend} desc={desc}/>)}
 </div>});

const StartUI=forwardRef(function StartUI({assets:over={},fonts:fo={},blend:bl={},autoPlay=true,loop=false,speed=1,hotkey='e',endHold=1.5,onEnd,style,
  buttons=['skill','item','conf'],descriptions=['Use a skill','Use an item','Equip gear'],onSelect,onConfirm,active=true},ref){
 const assets=useMemo(()=>{const m={...DEFAULT_ASSETS};for(const k in over)m[k]={...m[k],...over[k]};return m},[over]);
 const fonts={ui:'sans-serif',wild:'sans-serif',...fo},blend={red:'normal',blue:'plus-lighter',...bl};
 const [cur,setCur]=useState(0);
 const E=useRef({}),st=useRef({t:0,at:0,playing:autoPlay,seed:Math.random()*100,sel:{},cur:0}),box=useRef(null),stage=useRef(null);
 const live=useRef({});live.current={assets,speed,loop,endHold,onEnd,buttons,onSelect,onConfirm,active};
 const reg=useCallback((id,el)=>{if(el)E.current[id]=el;else delete E.current[id]},[]);

 const resetSel=useCallback(()=>{const {cx,cy,hw,hh}=btnRect(live.current.buttons[st.current.cur]),c=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([a,b])=>[cx+a*hw,cy+b*hh]);
  for(const k of['red','blue'])st.current.sel[k]=c.map(p=>{const b=[p[0]+rnd(PAD),p[1]+rnd(PAD)];return{b,f:b,t:[b[0]+rnd(PAD),b[1]+rnd(PAD)],t0:performance.now()/1e3}})},[]);
 const replay=useCallback(()=>{Object.assign(st.current,{t:0,at:0,playing:true,seed:Math.random()*100});resetSel()},[resetSel]);
 useImperativeHandle(ref,()=>({replay,play:()=>{st.current.playing=true},pause:()=>{st.current.playing=false},seek:t=>{st.current.playing=false;st.current.t=t}}),[replay]);

 useEffect(()=>{
  resetSel();let raf,last=performance.now();
  const selPts=(k,now)=>st.current.sel[k].map(q=>{let u=(now-q.t0)/.2;if(u>=1){q.f=q.t;q.t=[q.b[0]+rnd(PAD),q.b[1]+rnd(PAD)];q.t0=now;u=0}
   return(W/2+L(q.f[0],q.t[0],u))+','+(H/2-L(q.f[1],q.t[1],u))}).join(' ');
  const draw=now=>{const s=st.current,tl=Math.min(s.t,DUR),V={};
   for(const o of NODES)V[o.id]=base(o);
   for(const t of TR)for(const id of t.to){for(const p in t.p)V[id][p]=ev(t.p[p],tl,SMOOTH.has(p));if(t.q)V[id].r=qrot(t.q,tl)}
   const sh=s.t-SHAKE.start;if(sh>=0&&sh<SHAKE.dur){const f=1-sh/SHAKE.dur;V.shake.x=noise(s.seed,sh*SHAKE.freq)*SHAKE.mag*f;V.shake.y=noise(s.seed+50,sh*SHAKE.freq)*SHAKE.mag*f}
   const m=V.mask,hw=50*m.sx,hh=50*m.sy,th=m.r*Math.PI/180,co=Math.cos(th),si=Math.sin(th);
   const poly='polygon('+[[-1,-1],[-1,1],[1,1],[1,-1]].map(([a,b])=>{const x=a*hw,y=b*hh;return(W/2+m.x+x*co-y*si)+'px '+(H/2-(m.y+x*si+y*co))+'px'}).join(',')+')';
   for(const o of NODES){const e=E.current[o.id];if(!e)continue;const v=V[o.id];e.style.transform=tf(v);e.style.opacity=v.a;
    if(o.clip)e.style.clipPath=poly;
    const r=ACT[o.id];if(r&&!o.hide)e.style.visibility=r.some(([a,b])=>tl>=a&&tl<b)?'visible':'hidden';
    const a=o.as&&live.current.assets[o.as];
    if(a&&a.frames>1){const f=a.loop===false?Math.min(a.frames-1,Math.floor(st.current.at*a.fps)):Math.floor(now*a.fps)%a.frames,c=a.cols||1,rw=a.rows||1;
     e.style.backgroundPosition=(c>1?(f%c)/(c-1)*100:0)+'% '+(rw>1?Math.floor(f/c)/(rw-1)*100:0)+'%'}}
   const sv=ACT.red_sel[0][0]<=tl,pr=E.current.pr,pb=E.current.pb;
   if(pr&&pb){pr.style.display=pb.style.display=sv?'':'none';if(sv){pr.setAttribute('points',selPts('red',now));pb.setAttribute('points',selPts('blue',now))}}};
  const tick=n=>{const dt=Math.min(.05,(n-last)/1e3);last=n;const s=st.current,p=live.current;
   if(s.playing){s.t+=dt*p.speed;s.at+=dt*p.speed;if(s.t>=p.endHold+DUR){if(p.loop)replay();else{s.t=DUR;s.playing=false;p.onEnd&&p.onEnd()}}}
   draw(n/1e3);raf=requestAnimationFrame(tick)};
  raf=requestAnimationFrame(tick);
  const ro=new ResizeObserver(()=>{if(stage.current&&box.current)stage.current.style.transform=`scale(${box.current.clientWidth/W})`});
  ro.observe(box.current);
  const key=e=>{const k=e.key,s=st.current,p=live.current;
   if(!p.active)return;                                 // another screen (e.g. SkillScreen) is on top
   if(hotkey&&k.toLowerCase()===hotkey){replay();return}
   if(s.t<DUR)return;                                   // menu is live once the intro has finished
   const n=p.buttons.length;
   if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();s.cur=(s.cur+(k==='ArrowDown'?1:n-1))%n;resetSel();setCur(s.cur);p.onSelect&&p.onSelect(s.cur,p.buttons[s.cur])}
   if(k==='Enter')p.onConfirm&&p.onConfirm(s.cur,p.buttons[s.cur])};
  addEventListener('keydown',key);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',key)}
 },[hotkey,replay,resetSel]);

 return <div ref={box} style={{position:'relative',width:'100%',aspectRatio:`${W}/${H}`,overflow:'hidden',...style}}>
  <div ref={stage} style={{position:'absolute',left:0,top:0,width:W,height:H,transformOrigin:'0 0',background:'#1b1b22',overflow:'hidden'}}>
   {T.map(o=><Node key={o.id} o={o} reg={reg} assets={assets} fonts={fonts} blend={blend} desc={descriptions[cur]}/>)}
  </div></div>});
export default StartUI;