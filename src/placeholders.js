// Placeholder sprites (drawn on a canvas). Replaced automatically when you pass a real src via the `assets` prop.
export const DEFAULT_ASSETS={
 cat:{src:null,cols:5,rows:1,frames:5,fps:12},   // catanim.anim
 bg:{src:null,cols:9,rows:5,frames:45,fps:40},   // New Animation2.anim
 num1:{src:null},num2:{src:null},skill:{src:null},item:{src:null},conf:{src:null},command:{src:null},yen:{src:null}};
const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return c.toDataURL()};
export const PH={
 cat:()=>mk(800,160,(g)=>{for(let i=0;i<5;i++){g.save();g.translate(i*160+80,90);g.fillStyle='#f0a040';g.beginPath();g.arc(0,0,48,0,7);g.fill();
  for(const s of[-1,1]){g.beginPath();g.moveTo(s*14,-44);g.lineTo(s*44,-70);g.lineTo(s*46,-22);g.fill()}
  g.fillStyle='#222';g.fillRect(-24,-10,10,14);g.fillRect(14,-10,10,14);g.strokeStyle='#f0a040';g.lineWidth=10;g.beginPath();g.moveTo(40,30);g.quadraticCurveTo(70,10+i*8,60,-20+i*10);g.stroke();g.restore()}}),
 bg:()=>mk(1152,360,(g)=>{for(let i=0;i<45;i++){const x=i%9*128,y=Math.floor(i/9)*72;g.save();g.beginPath();g.rect(x,y,128,72);g.clip();g.fillStyle='#ffd23f';g.fillRect(x,y,128,72);
  g.fillStyle='#ff5d8f';for(let k=-4;k<8;k++){g.save();g.translate(x+k*22+i%9*2.4,y);g.transform(1,0,-.6,1,0,0);g.fillRect(0,0,9,72);g.restore()}
  g.fillStyle='rgba(0,0,0,.18)';for(let a=0;a<6;a++)for(let b=0;b<4;b++){g.beginPath();g.arc(x+a*24+(i*3%12),y+b*20+(i*2%10),3,0,7);g.fill()}g.restore()}}),
 num1:()=>mk(363,498,(g,w,h)=>{g.fillStyle='#b3202a';g.fillRect(0,0,w,h);g.strokeStyle='#000';g.lineWidth=16;g.strokeRect(8,8,w-16,h-16)}),
 num2:()=>mk(361,499,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.strokeStyle='#000';g.lineWidth=16;g.strokeRect(8,8,w-16,h-16)}),
 skill:()=>mk(64,24,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h)}),item:()=>mk(64,24,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h)}),
 conf:()=>mk(64,24,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h)}),command:()=>mk(64,24,(g,w,h)=>{g.fillStyle='#d4141c';g.fillRect(0,0,w,h)}),
 yen:()=>mk(284,384,(g,w,h)=>{g.fillStyle='#ffcc00';g.beginPath();g.arc(w/2,h/2,120,0,7);g.fill();g.fillStyle='#000';g.font='bold 170px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('¥',w/2,h/2+8)})};
export default PH;
