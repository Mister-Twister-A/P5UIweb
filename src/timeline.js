// Timeline data extracted from StartUI.playable + SampleScene.unity (Unity canvas units: y up, rotation counter-clockwise).
export const W=1920,H=1080,DUR=29/60;
export const MASK_ROT=-30;   // end angle of the background mask wipe in degrees (original Unity value: -55). Counter-clockwise positive.
const T=[
{id:'shake',w:W,h:H,k:[
 {id:'mask',w:100,h:100,r:335,sx:47.56,sy:90.69,hide:1},
 {id:'red',w:W,h:H,sx:2.1492,sy:2.1492,bg:'rgba(255,0,0,.67)'},
 {id:'bgc',w:W,h:H,clip:1,k:[{id:'bgimg',w:1170,h:653,sx:1.66,sy:1.67,as:'bg'}]},
 {id:'start',w:100,h:100,k:[
  {x:598,y:-69.5,r:-5.9,w:363,h:498,sx:.551,sy:.551,as:'num1',k:[{x:3,y:204,w:200,h:50,txt:'1',fs:572,fc:'#fff',ff:'wild'}]},
  {x:776,y:-85,r:-12.8,w:361,h:499,sx:.5839,sy:.5839,as:'num2',k:[{x:12,y:164,r:-5.8,w:200,h:50,sx:1.86,sy:1.258,txt:'2',fs:440,fc:'#000',ff:'wild'}]},
  {x:608.5,y:377.3,r:12.5,w:W,h:H,sx:.3087,sy:.117,bg:'#fff'},
  {x:608.5,y:377.3,r:12.5,w:W,h:H,sx:.3033,sy:.1074,bg:'#000',k:[{x:119,y:195,w:200,h:50,sy:3,txt:'Dont Look At Me',fs:248,fc:'#fff',ff:'wild'}]},
  {x:746,y:306,r:1.6,w:W,h:H,sx:.2004,sy:.1135,bg:'#000'},
  {x:746,y:306,r:1.6,w:W,h:H,sx:.1969,sy:.1074,bg:'#fff',k:[{x:119,y:195,w:200,h:50,sx:1.4234,sy:3,txt:'LIkE ThAT',fs:248,fc:'#000',ff:'wild'}]}]},
 {id:'catB',x:292,y:-3,w:166,h:166,sx:7.554,sy:7.554,as:'cat',dark:1},
 {id:'catc',w:W,h:H,clip:1,k:[{id:'cat',x:292,y:-3,w:166,h:166,sx:7.554,sy:7.554,as:'cat'}]},
 {id:'command',x:270,y:-290,r:345.525,w:2107,h:747,sx:.3432,sy:.3432,as:'command',txt:'COMMAND',fs:420,fc:'#fff',ff:'wild'}]},
{id:'money',x:-294,y:-384,w:200,h:50,txt:'143,461 ',fs:55,fc:'#fff',ff:'ui'},
{id:'yen',x:-378.9,y:-386.2,w:284,h:384,sx:.32987,sy:.32987,as:'yen'},
{id:'sel',w:W,h:H,svg:1},
{id:'skill',x:76,y:226,w:517,h:184,sx:.6073,sy:.6073,as:'skill',txt:'SKILL',fs:120,fc:'#fff',ff:'wild'},
{id:'item',x:10,y:152,w:417,h:145,sx:.6073,sy:.6073,as:'item',txt:'ITEM',fs:100,fc:'#fff',ff:'wild'},
{id:'conf',x:-97,y:59,w:1024,h:185,sx:.6073,sy:.6073,as:'conf',txt:'CONFIDANT',fs:120,fc:'#fff',ff:'wild'},
{id:'desc',x:338,y:-413,w:200,h:50,txt:'Use a skill',fs:36,fc:'#fff',ff:'ui'}];
/* ===== timeline data (from StartUI.playable + recorded clips). Keys are [time, value]. Linear unless prop in SMOOTH ===== */
const A=1/3,B=A+.1;                                   // 0.333s / 0.433s
const SMOOTH=new Set(['sx','sy','r']);                    // Hermite, zero tangents (tangentMode 0)
const TR=[
 {to:['mask'],p:{x:[[.1,2918],[.3,2756]],y:[[.1,49],[.3,64]],r:[[.1,30],[.3,-30]]}}, // mask wipe: position + rotation in degrees
 {to:['catB','cat'],p:{x:[[.1,793],[.3,292]],y:[[.1,-288],[.3,-3]]}},
 {to:['money'],p:{x:[[A,-224],[B,-294]],a:[[A,0],[B,1]]}},
 {to:['yen'],p:{sx:[[A,.301],[B,.33]],sy:[[A,.301],[B,.33]],a:[[A,0],[B,1]]}},
 {to:['desc'],p:{x:[[A,387],[B,338]],a:[[A,0],[B,1]]}},
 {to:['command'],p:{x:[[0,270]],y:[[0,-290]],r:[[0,345.525]]}},
 {to:['skill'],p:{x:[[A,56],[B,76]],y:[[A,241],[B,226]]}},
 {to:['item'],p:{x:[[A,62],[B,10]],y:[[A,140],[B,152]]}},
 {to:['conf'],p:{x:[[A,-149],[B,-97]],y:[[A,59]]}}];
const ACT={money:[[A,9]],yen:[[A,9]],desc:[[A,9]],command:[[A,9]],skill:[[A,9]],item:[[A,9]],conf:[[A,9]],red_sel:[[B,9]],blue_sel:[[B,9]]};
const SHAKE={start:A,dur:.3,mag:15,freq:40};          // Signal Emitter @0.333 -> UIShake

export const L=(a,b,u)=>a+(b-a)*u,ss=u=>u*u*(3-2*u);
/** Evaluate a [[time,value],...] curve (linear, or smoothstep when sm=true), holding the end keys. */
export function ev(c,t,sm){const n=c.length-1;if(t<=c[0][0])return c[0][1];if(t>=c[n][0])return c[n][1];
 for(let i=0;i<n;i++)if(t<c[i+1][0]){const u=(t-c[i][0])/(c[i+1][0]-c[i][0]);return L(c[i][1],c[i+1][1],sm?ss(u):u)}}
/** Unity quaternion curve (z,w Hermite components) -> z rotation in degrees, shortest path. */
export function qrot(q,tl){const dt=q.t[1]-q.t[0],u=Math.min(1,Math.max(0,(tl-q.t[0])/dt)),u2=u*u,u3=u2*u;
 const h=c=>(2*u3-3*u2+1)*c[0]+(u3-2*u2+u)*dt*c[2]+(-2*u3+3*u2)*c[1]+(u3-u2)*dt*c[3];
 let z=h(q.z),w=h(q.w);if(w<0){z=-z;w=-w}return 2*Math.atan2(z,w)*180/Math.PI}
export const noise=(s,x)=>(Math.sin(x+s*12.9)+Math.sin(x*2.37+s*4.1)*.5+Math.sin(x*5.1+s*7.7)*.25)/1.75;
export {T,A,B,SMOOTH,TR,ACT,SHAKE};