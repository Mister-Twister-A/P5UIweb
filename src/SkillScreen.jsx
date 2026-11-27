/**
 * <SkillScreen /> – React port of the Unity "SkillButtonPress" Timeline (1920x1080 design canvas, scaled to fit its parent).
 * Plays once when mounted and holds its last frame. Esc calls onExit().
 *
 * assets = { bg:{src,cols,rows,frames,fps}, command:{src}, yen:{src}, skillcat:{src,cols,rows,frames} }  (same objects StartUI uses, plus skillcat)
 * fonts  = { ui:'"Flap Jacks", sans-serif' }
 *
 * How the Unity pieces map to the DOM:
 *  - Two corrections to the raw Unity data: the star/cat region's edge follows white_line2 once it appears, and the black part
 *    of the white background is limited to the wedge between the two white lines (the rest of the white stays white).
 *  - UnityEngine.UI.Mask rects ("mask", "mask (1)", "mask (2)") are rotated 4756x9069 slabs animated by the timeline.
 *  - MaskProjectionUI / MaskTransformUpdater + UiShader: a graphic is drawn only inside its mask rect (_OutsideDiscard=1),
 *    or tinted by _OutsideColor outside it (_OutsideDiscard=0). _MaskInvert flips inside/outside. Done here with clip-path.
 */
import {useEffect,useRef} from 'react';
import {W,H} from './timeline';
import {SK_DUR,SK_MASK,SK_CURVES as C,SK_ACT,SK_CAT_FRAMES} from './skillTimeline';

/* ---------- curve evaluation (Unity Hermite with the stored in/out slopes) ---------- */
function seg(k,t){const n=k.length-1;if(t<=k[0][0])return[0,0,0];if(t>=k[n][0])return[n,n,1];
 let i=0;while(t>=k[i+1][0])i++;return[i,i+1,(t-k[i][0])/(k[i+1][0]-k[i][0])]}
function hermite(k,t,v,ins,outs){const[i,j,u]=seg(k,t);if(i===j)return k[i][v];
 const dt=k[j][0]-k[i][0],u2=u*u,u3=u2*u;
 return(2*u3-3*u2+1)*k[i][v]+(u3-2*u2+u)*dt*k[i][outs]+(-2*u3+3*u2)*k[j][v]+(u3-u2)*dt*k[j][ins]}
const evF=(k,t)=>hermite(k,t,1,2,3);            // [t,value,inSlope,outSlope]
function evQ(k,t){let z=hermite(k,t,1,3,5),w=hermite(k,t,2,4,6);if(w<0){z=-z;w=-w}return 2*Math.atan2(z,w)*180/Math.PI} // [t,z,w,inZ,inW,outZ,outW] -> degrees ccw

/* ---------- static scene data (from SampleScene.unity) ---------- */
const WB={x:-214,y:-31,w:1170,h:653,sx:1.8113143,sy:2.8076897,r:-29.251};   // white_background / white_background_blackPart
const BASE={
 white:{...WB},bp:{...WB},
 bg:{x:0,y:0,w:1170,h:653,sx:1.66,sy:1.67,r:0},
 cat:{x:-306,y:-128,w:210,h:417,sx:3.415,sy:3.415,r:27.846},cat1n:{x:-306,y:-128,w:210,h:417,sx:3.415,sy:3.415,r:27.846},cat1r:{x:-306,y:-128,w:210,h:417,sx:3.415,sy:3.415,r:27.846},
 cmd:{x:30,y:-251,w:2107,h:747,sx:.3432,sy:.3432,r:14.475},
 l1:{x:469,y:-463,w:100,h:100,sx:.125,sy:16.958,r:-59.959},l2:{x:-34,y:35,w:100,h:100,sx:.125,sy:16.958,r:-22.582},
 desc:{x:338,y:-413,w:200,h:50,sx:1,sy:1,r:0},nosk:{x:326,y:302,w:200,h:50,sx:1.433,sy:1.433,r:0},
 money:{x:-294,y:-384,w:200,h:50,sx:1,sy:1,r:0},yen:{x:-378.9,y:-386.2,w:284,h:384,sx:.33,sy:.33,r:0}};
const CURVE_OF={cat1n:null,cat1r:null};                 // clones share the animation of their source object
const ACT_OF={cat1n:'cat1',cat1r:'cat1'};
const MASKS=['mask','mask1','mask2'];

const NB={position:'absolute',left:'50%',top:'50%',display:'flex',alignItems:'center',justifyContent:'center',whiteSpace:'nowrap',backgroundRepeat:'no-repeat'};
const box=o=>({...NB,width:o.w,height:o.h,marginLeft:-o.w/2,marginTop:-o.h/2});
const tf=v=>`translate(${v.x}px,${-v.y}px) rotate(${-v.r}deg) scale(${v.sx},${v.sy})`;
const WRAP={position:'absolute',left:0,top:0,width:W,height:H};

function value(id,tl){const b=BASE[id]||{x:0,y:0,sx:1,sy:1,r:0},c=C[CURVE_OF[id]===undefined?id:CURVE_OF[id]]||{};
 const v={x:b.x,y:b.y,r:b.r,sx:b.sx,sy:b.sy,a:1};
 if(c.x)v.x=evF(c.x,tl);if(c.y)v.y=evF(c.y,tl);if(c.a)v.a=evF(c.a,tl);
 if(c.q)v.r=evQ(c.q,tl);else if(c.r)v.r=evF(c.r,tl);
 return v}
function maskPts(m){const hw=50*SK_MASK.sx,hh=50*SK_MASK.sy,th=m.r*Math.PI/180,co=Math.cos(th),si=Math.sin(th);
 return[[-1,-1],[-1,1],[1,1],[1,-1]].map(([a,b])=>{const x=a*hw,y=b*hh;return[W/2+m.x+x*co-y*si,H/2-(m.y+x*si+y*co)]})}
const inside=p=>'polygon('+p.map(q=>q[0].toFixed(1)+'px '+q[1].toFixed(1)+'px').join(',')+')';
const outside=p=>'path(evenodd,"M-200 -200H2200V1300H-200Z M'+p.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L')+'Z")';
// (1) The star/cat region's edge (mask slab) locks onto white_line2 once it is created: the slab is rotated like the line and
//     placed so its right edge lies exactly on it; it blends over the 1/60 s before the line appears.
const F0=0.4167,F1=0.4333,ss=u=>u*u*(3-2*u);
function followLine(m,l2,tl){const w=ss(Math.min(1,Math.max(0,(tl-F0)/(F1-F0))));if(w<=0)return m;
 const r=l2.r*Math.PI/180,hw=50*SK_MASK.sx,tx=l2.x-Math.cos(r)*hw,ty=l2.y-Math.sin(r)*hw;
 let ro=m.r;ro+=Math.round((l2.r-ro)/180)*180;               // a slab looks the same after 180 degrees: take the nearest equivalent angle
 return{x:m.x+(tx-m.x)*w,y:m.y+(ty-m.y)*w,r:ro+(l2.r-ro)*w}}
// (2) Black only between the two white lines: the wedge {left of white_line} ∩ {right of white_line2}, clipped to a big box.
function wedge(l1,l2){let P=[[-4000,-4000],[4000,-4000],[4000,4000],[-4000,4000]];
 for(const[nx,ny,c]of[[-Math.cos(l1.r*Math.PI/180),-Math.sin(l1.r*Math.PI/180),l1],[Math.cos(l2.r*Math.PI/180),Math.sin(l2.r*Math.PI/180),l2]]){
  const d=p=>nx*(p[0]-c.x)+ny*(p[1]-c.y),Q=[];
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],da=d(a),db=d(b);
   if(da>=0)Q.push(a);if((da>=0)!==(db>=0)){const u=da/(da-db);Q.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u])}}
  P=Q;if(!P.length)break}
 return P.map(([x,y])=>[W/2+x,H/2-y])}
const active=(id,tl)=>{const r=SK_ACT[ACT_OF[id]||id];return!r||r.some(([a,b])=>tl>=a&&tl<b)};
function catFrame(tl){let f=0;for(const[t,i]of SK_CAT_FRAMES){if(tl>=t)f=i;else break}return f}
const sheetPos=(f,c,r)=>(c>1?(f%c)/(c-1)*100:0)+'% '+(r>1?Math.floor(f/c)/(r-1)*100:0)+'%';

export default function SkillScreen({assets={},fonts={},onExit,onEnd,speed=1,style}){
 const boxRef=useRef(null),stage=useRef(null),E=useRef({}),live=useRef({});live.current={assets,onExit,onEnd,speed};
 const reg=id=>el=>{if(el)E.current[id]=el;else delete E.current[id]};
 useEffect(()=>{
  let raf,last=performance.now(),t=0,ended=false;
  const draw=now=>{const tl=Math.min(t,SK_DUR),as=live.current.assets,V={};
   const m={};for(const k of MASKS)m[k]=value(k,tl);
   m.mask=followLine(m.mask,value('l2',tl),tl);
   const P={mask:maskPts(m.mask),mask1:maskPts(m.mask1),mask2:maskPts(m.mask2)};
   const set=(id,css)=>{const e=E.current[id];if(e)Object.assign(e.style,css)};
   // clip wrappers (the clip-path lives on an untransformed full-canvas wrapper so it is in canvas pixels)
   {const wp=wedge(value('l1',tl),value('l2',tl));set('w_bp',{clipPath:wp.length>2?inside(wp):'polygon(0 0,0 0,0 0)'})}   // black part: only between the two white lines
   set('w_bg',{clipPath:inside(P.mask)});            // Background: mask, discard outside
   set('w_cat',{clipPath:inside(P.mask)});           // SKILL_cat: mask, discard outside
   set('w_c1n',{clipPath:outside(P.mask1)});         // SKILL_cat (1): mask (1) inverted -> normal outside the rect...
   set('w_c1r',{clipPath:inside(P.mask1)});          // ...and multiplied by _OutsideColor (red) inside it
   for(const id of Object.keys(BASE)){const e=E.current[id];if(!e)continue;const v=value(id,tl);
    e.style.transform=tf(v);e.style.opacity=v.a;
    e.style.visibility=active(id,tl)?'visible':'hidden'}
   for(const w of['w_bp','w_cat','w_c1n','w_c1r']){const e=E.current[w];if(e)e.style.visibility=active(w==='w_bp'?'bp':w==='w_cat'?'cat':'cat1',tl)?'visible':'hidden'}
   const bg=as.bg;if(bg&&bg.frames>1&&E.current.bg){const f=Math.floor(now*bg.fps)%bg.frames;E.current.bg.style.backgroundPosition=sheetPos(f,bg.cols||1,bg.rows||1)}
   const sc=as.skillcat;if(sc){const f=catFrame(tl),p=sheetPos(f,sc.cols,sc.rows);for(const id of['cat','cat1n','cat1r'])if(E.current[id])E.current[id].style.backgroundPosition=p}};
  const tick=n=>{const dt=Math.min(.05,(n-last)/1e3);last=n;
   if(t<SK_DUR){t+=dt*live.current.speed;if(t>=SK_DUR&&!ended){ended=true;live.current.onEnd&&live.current.onEnd()}}
   draw(n/1e3);raf=requestAnimationFrame(tick)};
  raf=requestAnimationFrame(tick);
  const ro=new ResizeObserver(()=>{if(stage.current&&boxRef.current)stage.current.style.transform=`scale(${boxRef.current.clientWidth/W})`});
  ro.observe(boxRef.current);
  const key=e=>{if(e.key==='Escape'){e.preventDefault();live.current.onExit&&live.current.onExit()}};
  addEventListener('keydown',key);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',key)}
 },[]);

 const sheet=a=>a&&a.src?{backgroundImage:`url(${a.src})`,backgroundSize:`${(a.cols||1)*100}% ${(a.rows||1)*100}%`}:{};
 const txt=(id,text,fs)=><div ref={reg(id)} style={{...box(BASE[id]),fontSize:fs,color:'#fff',fontFamily:fonts.ui,transform:tf({...BASE[id],a:1})}}>{text}</div>;
 const img=(id,a)=><div ref={reg(id)} style={{...box(BASE[id]),...sheet(a)}}/>;
 const cat=(id)=><div ref={reg(id)} style={{...box(BASE[id]),...sheet(assets.skillcat)}}/>;
 return <div ref={boxRef} style={{position:'relative',width:'100%',aspectRatio:`${W}/${H}`,overflow:'hidden',...style}}>
  <svg width="0" height="0" style={{position:'absolute'}}><filter id="skOutsideRed" colorInterpolationFilters="sRGB">
   <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter></svg>
  <div ref={stage} style={{...WRAP,transformOrigin:'0 0',background:'#1b1b22',overflow:'hidden'}}>
   {/* Shake_holder content, in hierarchy order */}
   <div style={{...box({w:W,h:H}),transform:'scale(2.1492)',background:'rgba(255,0,0,.67)'}}/>
   <div ref={reg('white')} style={{...box(BASE.white),background:'#fff'}}/>
   <div ref={reg('w_bp')} style={WRAP}><div ref={reg('bp')} style={{...box(BASE.bp),background:'#000'}}/></div>
   <div ref={reg('w_bg')} style={WRAP}>{img('bg',assets.bg)}</div>
   <div ref={reg('w_cat')} style={WRAP}>{cat('cat')}</div>
   <div ref={reg('w_c1n')} style={WRAP}>{cat('cat1n')}</div>
   <div ref={reg('w_c1r')} style={{...WRAP,filter:'url(#skOutsideRed)'}}>{cat('cat1r')}</div>
   {img('cmd',assets.command)}
   {/* Canvas-level objects */}
   <div ref={reg('l1')} style={{...box(BASE.l1),background:'#fff'}}/>
   <div ref={reg('l2')} style={{...box(BASE.l2),background:'#fff'}}/>
   {txt('desc','Use a skill',36)}
   {txt('nosk','- No Skills To Use -',36)}
   {txt('money','143,461 ',55)}
   {img('yen',assets.yen)}
  </div></div>}