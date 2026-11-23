'use strict';
/* Phalanx – soldiers as instanced "statuettes".
   Each body part (torso, head, thigh, shin, arm, spear, shield…) is ONE InstancedMesh shared by every soldier:
   a few draw calls for hundreds of animated men (the part system of Wild Fields 1648, MIT, adapted).
   Vertex attributes: color, metal (bronze shine), tint (zones that take the instance colour: crests, tunics, shield rims). */
const _m=new THREE.Matrix4(),_m2=new THREE.Matrix4(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3(),_s1=new THREE.Vector3(1,1,1),_e=new THREE.Euler(),_c=new THREE.Color();
const C={skin:0xd7a47a,skinD:0xb98258,bronze:0xc99a4e,bronzeD:0x8a6230,linen:0xeee2c6,leather:0x7a4e2c,wood:0x8f6438,dark:0x2a1e18,hair:0x2a1a10,iron:0x9aa0a6,white:0xf4efe4,wicker:0xb88d4e,red:0xa8321f,black:0x1e1712,beard:0x231710};
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const cyl=(a,b,h,s=10,open=false)=>new THREE.CylinderGeometry(a,b,h,s,1,open);
const sph=(r,w=12,h=9)=>new THREE.SphereGeometry(r,w,h);
const cone=(r,h,s=10)=>new THREE.ConeGeometry(r,h,s);
const cap=(r,l,s=10)=>new THREE.CapsuleGeometry(r,l,3,s);
const lathe=(pts,s=14)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(Math.max(r,1e-4),y)),s);
const torus=(r,t,a=6,b=20,arc=TAU)=>new THREE.TorusGeometry(r,t,a,b,arc);
// part: geometry, colour, transform, metal 0..1, tint 0..1
function P(g,c,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1,o={}){return{g,c,metal:o.metal??(c===C.bronze||c===C.bronzeD?1:c===C.iron?.8:0),tint:o.tint??0,
 m:new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz))};}
const TINT={tint:1};
function merge(parts,shade){let n=0;const L=[];
 for(const p of parts){const g=p.g.index?p.g.toNonIndexed():p.g.clone();g.applyMatrix4(p.m);L.push([g,new THREE.Color(p.c),p.metal,p.tint]);n+=g.attributes.position.count;}
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3),met=new Float32Array(n),tin=new Float32Array(n),uv=new Float32Array(n*2);let o=0;
 for(const[g,c,mt,tn]of L){const k=g.attributes.position.count,pa=g.attributes.position.array;pos.set(pa,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  for(let i=0;i<k;i++){const tri=((o+i)/3)|0,j=1+((Math.imul(tri+1,2654435761)>>>0)%1000/1000-.5)*.05,b=j*(shade?shade(pa[i*3],pa[i*3+1],pa[i*3+2]):1);
   col[(o+i)*3]=c.r*b;col[(o+i)*3+1]=c.g*b;col[(o+i)*3+2]=c.b*b;met[o+i]=mt;tin[o+i]=tn;}o+=k;g.dispose();}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));
 out.setAttribute('color',new THREE.BufferAttribute(col,3));out.setAttribute('metal',new THREE.BufferAttribute(met,1));out.setAttribute('tint',new THREE.BufferAttribute(tin,1));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 out.computeBoundingSphere();out.boundingSphere.radius+=3;return out;}
// one PBR material: per-vertex metal (bronze shines with the dawn sky), per-vertex tint mixes in the instance colour
function partMat(o={}){const m=new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.72,metalness:0,envMapIntensity:.85},o));
 return patchMat(m,{key:'part'+(o.map?'M':''),pre:sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float metal;attribute float tint;varying float vMetal;')
   .replace('#include <color_vertex>',`vColor=vec3(1.);
#ifdef USE_COLOR
vColor*=color;
#endif
#ifdef USE_INSTANCING_COLOR
vColor*=mix(vec3(1.),instanceColor.xyz,tint);
#endif
vMetal=metal;`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vMetal;')
   .replace('#include <roughnessmap_fragment>','float roughnessFactor=mix(roughness,.3,vMetal);')
   .replace('#include <metalnessmap_fragment>','float metalnessFactor=vMetal*.9;');}});}

/* ---------------- Greek hoplite parts (local frame: feet at y=0, facing +z, left = +x) ---------------- */
const HIP=.94,THIGH=.44,SHIN=.44;
function shadeBody(x,y,z){return .82+.18*clamp((y+.1)/.6,0,1);}
function gTorso(linen){
 const prof=[[0,-.06],[.16,-.06],[.175,0],[.17,.1],[.19,.24],[.225,.38],[.235,.46],[.2,.52],[.12,.56],[0,.565]];
 const P2=[];
 if(!linen){P2.push(P(lathe(prof,16),C.bronze,0,0,0,0,0,0,1,1,.74));
  // muscle cuirass: pectorals, belly lines, rim
  P2.push(P(sph(.085,12,8),C.bronze,.075,.39,.135,0,0,0,1,.7,.5),P(sph(.085,12,8),C.bronze,-.075,.39,.135,0,0,0,1,.7,.5));
  for(let i=0;i<3;i++)P2.push(P(box(.12,.012,.02),C.bronzeD,0,.14+i*.065,.14-i*.004));
  P2.push(P(torus(.177,.013,6,24),C.bronzeD,0,-.03,0,PI/2,0,0,1,.74,1));
 }else{P2.push(P(lathe(prof,16),C.linen,0,0,0,0,0,0,1,1,.74));
  P2.push(P(torus(.19,.022,6,24),C.red,0,.12,0,PI/2,0,0,1,.74,1,TINT),P(torus(.2,.016,6,24),C.red,0,.03,0,PI/2,0,0,1,.74,1,TINT));
  // shoulder flaps and bronze scales on the belly
  P2.push(P(box(.15,.025,.26),C.linen,.12,.545,0,0,0,-.25),P(box(.15,.025,.26),C.linen,-.12,.545,0,0,0,.25));
  for(let i=0;i<5;i++)P2.push(P(box(.05,.05,.01),C.bronze,-.1+i*.05,.24,.155));
 }
 // pteruges: linen strips around the hips
 for(let i=0;i<16;i++){const a=i/16*TAU,r=.175;P2.push(P(box(.062,.2,.016),i%2?C.linen:0xd8c9a6,Math.sin(a)*r,-.16,Math.cos(a)*r*.78,-.12*Math.cos(a),a,0,1,1,1,{tint:i%4===0?1:0}));}
 P2.push(P(cyl(.06,.07,.12,10),C.skin,0,.6,0));
 return merge(P2,shadeBody);}
function gHead(open){const h=[],R=.118,cy=0;
 h.push(P(sph(R*.92,14,10),C.skin,0,cy,.01,0,0,0,1,1.08,1));
 if(open){ // Chalcidian helmet: face visible
  h.push(P(sph(.016,8,6),C.dark,.038,cy+.02,.098),P(sph(.016,8,6),C.dark,-.038,cy+.02,.098),P(cone(.017,.05,6),C.skinD,0,cy-.005,.115,PI/2),
   P(sph(.075,12,8),C.beard,0,cy-.075,.045,0,0,0,1,1,.9),P(box(.06,.012,.02),C.beard,0,cy-.03,.1));
  h.push(P(sph(R*1.08,16,10),C.bronze,0,cy+.03,-.008,0,0,0,1,1,1.06),P(box(.03,.12,.09),C.bronze,.1,cy-.04,.04,0,0,.12),P(box(.03,.12,.09),C.bronze,-.1,cy-.04,.04,0,0,-.12),
   P(box(.2,.025,.03),C.bronzeD,0,cy+.075,.1));
  h.push(P(sph(R*1.02,14,8),C.bronze,0,cy+.05,-.05,0,0,0,1,.9,1));
 }else{ // Corinthian helmet: closed, with eye slits and a nose guard
  h.push(P(sph(R*1.12,18,12),C.bronze,0,cy+.015,0,0,0,0,1,1.12,1.08),P(cyl(R*1.08,R*1.28,.09,18,true),C.bronze,0,cy-.11,-.01,0,0,0,1,1,1.05),
   P(box(.07,.034,.03),C.dark,.045,cy+.015,.122),P(box(.07,.034,.03),C.dark,-.045,cy+.015,.122),
   P(box(.03,.08,.03),C.bronze,0,cy-.03,.128),P(box(.04,.1,.03),C.dark,0,cy-.1,.118),P(sph(.05,10,6),C.beard,0,cy-.15,.07,0,0,0,1,.8,.8));
  h.push(P(torus(.1,.008,6,20,PI),C.bronzeD,0,cy+.06,.0,0,PI/2,0,1,1.2,1),P(torus(.03,.006,5,10),C.bronzeD,.09,cy+.04,.08,0,1.2,0));
 }
 // crest on a stilt: horse hair, tinted per section
 h.push(P(box(.02,.06,.05),C.bronzeD,0,cy+.15,0),P(torus(.15,.05,6,18,PI),C.red,0,cy+.1,-.03,0,PI/2,0,1,1.2,.5,TINT),P(sph(.13,12,8),C.red,0,cy+.17,-.03,0,0,0,.24,.62,1.15,TINT),
  P(box(.035,.1,.3),C.red,0,cy+.05,-.2,.75,0,0,1,1,1,TINT));
 return merge(h);}
function gThigh(){return merge([P(cap(.072,THIGH-.1,10),C.skin,0,-THIGH/2,0),P(sph(.07,10,8),C.skin,0,-THIGH+.02,.01)],(x,y)=>.86+.14*clamp(1+y/THIGH,0,1));}
function gShin(){return merge([P(lathe([[.05,-SHIN+.04],[.06,-SHIN+.12],[.075,-.22],[.066,-.06],[.06,0]],12),C.bronze,0,0,0,0,0,0,1,1,.85),
 P(cap(.046,.05,8),C.leather,0,-SHIN+.01,.05,PI/2,0,0,1,1,1.25),P(box(.08,.02,.2),C.leather,0,-SHIN-.015,.04)],(x,y)=>.84+.16*clamp(1+y/SHIN,0,1));}
function gArm(persian){return merge(persian?[P(cap(.062,.44,10),C.red,0,-.25,0,0,0,0,1,1,1,TINT),P(sph(.05,10,8),C.skin,0,-.54,0)]
 :[P(cap(.058,.42,10),C.skin,0,-.25,0),P(cyl(.052,.05,.07,10),C.leather,0,-.44,0),P(sph(.05,10,8),C.skin,0,-.53,0)]);}
// spear along +z, grip at origin
function gSpear(len,back,head){return merge([P(cyl(.019,.022,len,8),C.wood,0,0,len/2-back,PI/2),P(lathe([[0,0],[.028,.06],[.04,.16],[.016,head],[0,head+.04]],6),C.iron,0,0,len-back,PI/2),
 P(cone(.02,.2,6),C.bronze,0,0,-back-.08,-PI/2),P(cyl(.024,.024,.12,8),C.leather,0,0,0,PI/2)]);}
// hoplon/aspis: face (textured, +z) and rim (tinted: glows gold when the man is protected)
const SH_R=.46;
function gShieldFace(){const g=lathe([[SH_R-.035,0],[SH_R-.05,.012],[.38,.04],[.26,.072],[.12,.093],[0,.1]],28);g.rotateX(PI/2);
 const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)/(SH_R*2)*1.04,.5+p.getY(i)/(SH_R*2)*1.04);
 return merge([P(g,0xffffff)]);}
function gShieldRim(){return merge([P(torus(SH_R-.02,.035,8,40),C.bronze,0,0,0,0,0,0,1,1,.7,TINT),
 P(lathe([[0,-.09],[.25,-.08],[SH_R-.06,-.05],[SH_R-.02,0]],24),C.wood,0,0,0,PI/2),P(box(.05,.26,.04),C.leather,0,0,-.11),P(torus(.06,.012,6,12),C.bronzeD,0,0,-.1)]);}

/* ---------------- Persian parts ---------------- */
function pTorso(archer){const prof=[[0,-.5],[.3,-.5],[.25,-.3],[.2,-.06],[.18,.1],[.2,.26],[.22,.4],[.225,.47],[.18,.52],[.1,.555],[0,.56]];
 const p=[P(lathe(prof,16),C.red,0,0,0,0,0,0,1,1,.74,TINT)];
 // rosette trim, belt, collar
 p.push(P(torus(.2,.02,6,24),C.linen,0,.02,0,PI/2,0,0,1,.74,1),P(cyl(.29,.3,.05,16,true),0xe8c46a,0,-.47,0,0,0,0,1,1,.74),P(torus(.1,.025,6,16),0xe8c46a,0,.54,0,PI/2));
 for(let i=0;i<5;i++)P2r(p,i);
 if(archer){p.push(P(cyl(.06,.05,.6,10),C.leather,-.12,.25,-.17,.25,0,.35),P(cone(.1,.12,6),0xe8d6a0,-.21,.6,-.25,.25,0,.35));}
 p.push(P(cyl(.055,.065,.12,10),C.skin,0,.6,0));
 return merge(p,shadeBody);
 function P2r(arr,i){arr.push(P(sph(.022,6,4),0xe8c46a,-.1+i*.05,.32,.16,0,0,0,1,1,.4));}}
function pHead(type){const h=[],cy=0;
 h.push(P(sph(.11,14,10),C.skin,0,cy,.01,0,0,0,1,1.08,1),P(sph(.014,8,6),C.dark,.036,cy+.02,.095),P(sph(.014,8,6),C.dark,-.036,cy+.02,.095),P(cone(.017,.05,6),C.skinD,0,cy-.005,.11,PI/2));
 // curly black beard
 h.push(P(sph(.085,12,8),C.beard,0,cy-.075,.04,0,0,0,1,1.2,.9));for(let i=0;i<4;i++)h.push(P(sph(.03,6,5),C.beard,-.05+i*.033,cy-.15,.065));
 if(type===0){ // soft cap with flaps covering chin and neck (tinted)
  h.push(P(sph(.13,14,10),C.linen,0,cy+.04,-.01,0,0,0,1,1.05,1.05,TINT),P(cone(.07,.12,10),C.linen,0,cy+.18,-.03,-.35,0,0,1,1,1,TINT),
   P(box(.05,.16,.1),C.linen,.105,cy-.07,-.01,0,0,.08,1,1,1,TINT),P(box(.05,.16,.1),C.linen,-.105,cy-.07,-.01,0,0,-.08,1,1,1,TINT));
 }else{ // fillet / wreath over black hair
  h.push(P(sph(.12,14,10),C.hair,0,cy+.03,-.02,0,0,0,1,1,1.04),P(torus(.115,.018,6,20),C.linen,0,cy+.06,-.01,PI/2+.15,0,0,1,1,1,TINT));
  for(let i=0;i<5;i++)h.push(P(sph(.03,6,5),C.hair,-.06+i*.03,cy-.06,-.1));}
 return merge(h);}
function pThigh(){return merge([P(cap(.08,THIGH-.1,10),C.red,0,-THIGH/2,0,0,0,0,1,1,1,TINT)]);}
function pShin(){return merge([P(cap(.068,SHIN-.14,10),C.red,0,-SHIN/2+.02,0,0,0,0,1,1,1,TINT),P(cap(.05,.1,8),0x5a3a20,0,-SHIN+.02,.05,PI/2,0,0,1,1,1.1),P(box(.09,.02,.21),0x3a2414,0,-SHIN-.015,.04)]);}
// bow along local y, grip at origin
function gBow(){const pts=[];for(let i=0;i<=16;i++){const t=i/16*2-1;pts.push(new THREE.Vector3(0,t*.62,-Math.pow(Math.abs(t),1.6)*.16+.12*(1-t*t)*0));}
 const curve=new THREE.CatmullRomCurve3(pts);return merge([P(new THREE.TubeGeometry(curve,20,.014,5,false),0x5a3218),P(cyl(.003,.003,1.22,3),C.white,0,0,-.16),P(cyl(.022,.022,.12,8),C.leather)]);}
// spara: big wicker shield planted in the ground, face +z, bottom at y=0 locally
function gSpara(){return merge([P(box(.86,1.42,.05),0xffffff,0,.71,0),P(box(.9,.05,.08),C.leather,0,1.42,0),P(box(.9,.05,.08),C.leather,0,0,0),P(box(.05,1.45,.08),C.leather,.44,.71,0),P(box(.05,1.45,.08),C.leather,-.44,.71,0)]);}

/* ---------------- textures: shield blazons atlas, wicker ---------------- */
const BLZ=(()=>{const N=4,S=256,cv=document.createElement('canvas');cv.width=cv.height=N*S;const x=cv.getContext('2d');
 const fields=['#a8321f','#1e1712','#e9dcc0','#b4762c','#24354f','#a8321f','#1e1712','#e9dcc0','#6a2a18','#1e1712','#b4762c','#a8321f','#e9dcc0','#24354f','#1e1712','#a8321f'];
 const figs=['owl','gorgon','bull','scorpion','pegasus','lion','trident','eye','boar','snake','crab','tripod','owl','star','horse','dolphin'];
 for(let i=0;i<N*N;i++){const ox=(i%N)*S,oy=Math.floor(i/N)*S,cx=ox+S/2,cy=oy+S/2;const f=fields[i];x.fillStyle=f;x.fillRect(ox,oy,S,S);
  // bronze ring band + painted rim
  x.strokeStyle='#c99a4e';x.lineWidth=12;x.beginPath();x.arc(cx,cy,S*.47,0,TAU);x.stroke();
  const dark=f==='#e9dcc0'||f==='#b4762c',ink=dark?'#1e1712':(f==='#1e1712'?'#d8a456':'#1e1712'),ink2=dark?'#a8321f':'#e9dcc0';
  x.save();x.translate(cx,cy);x.fillStyle=ink;x.strokeStyle=ink;x.lineWidth=7;x.lineCap='round';drawFig(x,figs[i],ink,ink2);x.restore();
  // weathering
  for(let k=0;k<60;k++){x.fillStyle=`rgba(0,0,0,${Math.random()*.08})`;x.fillRect(ox+Math.random()*S,oy+Math.random()*S,2+Math.random()*6,2+Math.random()*6);}}
 function drawFig(x,f,a,b){x.beginPath();
  if(f==='owl'){x.ellipse(0,10,38,52,0,0,TAU);x.fill();x.fillStyle=b;x.beginPath();x.arc(-15,-8,13,0,TAU);x.arc(15,-8,13,0,TAU);x.fill();x.fillStyle=a;x.beginPath();x.arc(-15,-8,5,0,TAU);x.arc(15,-8,5,0,TAU);x.fill();
   x.beginPath();x.moveTo(-30,-38);x.lineTo(-20,-56);x.lineTo(-8,-40);x.moveTo(30,-38);x.lineTo(20,-56);x.lineTo(8,-40);x.stroke();}
  else if(f==='gorgon'){x.arc(0,0,46,0,TAU);x.fill();x.fillStyle=b;x.beginPath();x.arc(-16,-10,9,0,TAU);x.arc(16,-10,9,0,TAU);x.fill();x.fillRect(-22,18,44,8);
   for(let i=0;i<10;i++){const g=i/10*TAU;x.beginPath();x.moveTo(Math.cos(g)*44,Math.sin(g)*44);x.quadraticCurveTo(Math.cos(g+.3)*70,Math.sin(g+.3)*70,Math.cos(g)*82,Math.sin(g)*82);x.stroke();}}
  else if(f==='bull'){x.ellipse(0,15,30,42,0,0,TAU);x.fill();x.beginPath();x.moveTo(-28,-12);x.quadraticCurveTo(-70,-30,-52,-70);x.moveTo(28,-12);x.quadraticCurveTo(70,-30,52,-70);x.lineWidth=12;x.stroke();}
  else if(f==='scorpion'){x.ellipse(0,20,18,34,0,0,TAU);x.fill();x.lineWidth=9;x.beginPath();x.moveTo(0,-10);x.quadraticCurveTo(0,-60,30,-62);x.lineTo(24,-48);x.stroke();
   for(let i=0;i<3;i++){x.beginPath();x.moveTo(-14,10+i*14);x.lineTo(-44,i*18);x.moveTo(14,10+i*14);x.lineTo(44,i*18);x.stroke();}
   x.beginPath();x.arc(-36,52,14,0,TAU);x.arc(36,52,14,0,TAU);x.fill();}
  else if(f==='pegasus'||f==='horse'){x.ellipse(0,10,50,24,0,0,TAU);x.fill();x.beginPath();x.moveTo(36,0);x.lineTo(58,-48);x.lineTo(76,-40);x.lineTo(50,10);x.fill();
   x.lineWidth=8;for(const k of[-30,-12,14,32]){x.beginPath();x.moveTo(k,24);x.lineTo(k+(k<0?-8:8),70);x.stroke();}
   if(f==='pegasus'){x.beginPath();x.moveTo(-10,-10);x.quadraticCurveTo(-40,-80,-70,-60);x.quadraticCurveTo(-40,-40,-30,-8);x.fill();}}
  else if(f==='lion'){x.arc(0,0,30,0,TAU);x.fill();for(let i=0;i<14;i++){const g=i/14*TAU;x.beginPath();x.moveTo(Math.cos(g)*28,Math.sin(g)*28);x.lineTo(Math.cos(g)*58,Math.sin(g)*58);x.lineWidth=10;x.stroke();}
   x.fillStyle=b;x.beginPath();x.arc(-10,-6,5,0,TAU);x.arc(10,-6,5,0,TAU);x.fill();}
  else if(f==='trident'){x.lineWidth=10;x.beginPath();x.moveTo(0,80);x.lineTo(0,-70);x.moveTo(-34,-70);x.quadraticCurveTo(-34,-20,0,-20);x.quadraticCurveTo(34,-20,34,-70);x.stroke();}
  else if(f==='eye'){x.ellipse(0,0,70,30,0,0,TAU);x.fill();x.fillStyle=b;x.beginPath();x.arc(0,0,22,0,TAU);x.fill();x.fillStyle=a;x.beginPath();x.arc(0,0,10,0,TAU);x.fill();}
  else if(f==='boar'){x.ellipse(0,0,60,30,0,0,TAU);x.fill();x.lineWidth=8;for(const k of[-36,-16,16,36]){x.beginPath();x.moveTo(k,20);x.lineTo(k,56);x.stroke();}x.beginPath();x.moveTo(-40,-24);for(let i=0;i<8;i++)x.lineTo(-40+i*10,-24-(i%2?14:0));x.stroke();}
  else if(f==='snake'){x.lineWidth=12;x.beginPath();x.moveTo(-60,60);x.bezierCurveTo(-60,0,60,40,40,-20);x.bezierCurveTo(30,-60,-20,-40,-10,-70);x.stroke();x.beginPath();x.arc(-10,-72,12,0,TAU);x.fill();}
  else if(f==='crab'){x.ellipse(0,0,40,28,0,0,TAU);x.fill();x.lineWidth=8;for(let i=0;i<3;i++){x.beginPath();x.moveTo(-30,i*12);x.lineTo(-64,10+i*18);x.moveTo(30,i*12);x.lineTo(64,10+i*18);x.stroke();}
   x.beginPath();x.arc(-46,-44,14,0,TAU);x.arc(46,-44,14,0,TAU);x.fill();}
  else if(f==='tripod'){x.lineWidth=9;x.beginPath();x.arc(0,-30,36,0,PI);x.fill();x.beginPath();x.moveTo(-30,-20);x.lineTo(-44,70);x.moveTo(0,-4);x.lineTo(0,70);x.moveTo(30,-20);x.lineTo(44,70);x.stroke();
   x.beginPath();x.arc(-24,-56,10,0,TAU);x.arc(24,-56,10,0,TAU);x.lineWidth=6;x.stroke();}
  else if(f==='star'){for(let i=0;i<16;i++){const g=i/16*TAU;x.beginPath();x.moveTo(0,0);x.lineTo(Math.cos(g)*76,Math.sin(g)*76);x.lineWidth=i%2?5:10;x.stroke();}x.beginPath();x.arc(0,0,16,0,TAU);x.fill();}
  else if(f==='dolphin'){x.beginPath();x.moveTo(-70,20);x.quadraticCurveTo(-20,-60,50,-10);x.quadraticCurveTo(70,0,76,12);x.quadraticCurveTo(40,6,30,20);x.quadraticCurveTo(-10,10,-50,30);x.fill();
   x.beginPath();x.moveTo(-70,20);x.lineTo(-90,0);x.lineTo(-86,40);x.fill();}
 }
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.generateMipmaps=true;return{tex:t,N};})();
const WICKER=(()=>{const cv=document.createElement('canvas');cv.width=128;cv.height=256;const x=cv.getContext('2d');x.fillStyle='#a87a40';x.fillRect(0,0,128,256);
 for(let y=0;y<256;y+=8)for(let k=0;k<128;k+=16){x.fillStyle=((y/8+k/16)%2)?'#c6985a':'#8e6230';x.fillRect(k,y,16,7);}
 for(let k=0;k<128;k+=16){x.fillStyle='#5a3a1a';x.fillRect(k,0,2,256);}
 x.fillStyle='#7a2a18';x.fillRect(0,40,128,10);x.fillRect(0,206,128,10);
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;})();

/* ---------------- the crowd renderer ---------------- */
function IM(geo,mat,n,shadow=true){const m=new THREE.InstancedMesh(geo,mat,n);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.count=0;m.castShadow=shadow;m.receiveShadow=true;m.frustumCulled=false;
 m.setColorAt(0,_c.set(1,1,1));m.instanceColor.setUsage(THREE.DynamicDrawUsage);scene.add(m);return m;}
const ARMY=(()=>{
 const MAXG=240,MAXP=420,MAX=MAXG+MAXP+40;
 const mat=partMat();
 const faceMat=partMat({map:BLZ.tex,roughness:.6});
 faceMat.onBeforeCompile=((ob)=>(sh,r)=>{ob(sh,r);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aBlz;')
  .replace('#include <uv_vertex>',`#include <uv_vertex>
{float c=mod(aBlz,${BLZ.N}.),r=floor(aBlz/${BLZ.N}.);vMapUv=(vec2(c,${BLZ.N-1}.-r)+uv)/${BLZ.N}.;}`);})(faceMat.onBeforeCompile);
 faceMat.customProgramCacheKey=()=>'face';
 const wickerMat=partMat({map:WICKER,roughness:.9});wickerMat.customProgramCacheKey=()=>'wick';
 const P_={
  gTorsoB:IM(gTorso(false),mat,MAXG),gTorsoL:IM(gTorso(true),mat,MAXG),gHeadC:IM(gHead(false),mat,MAXG),gHeadO:IM(gHead(true),mat,MAXG),
  gThigh:IM(gThigh(),mat,MAXG*2),gShin:IM(gShin(),mat,MAXG*2),gArm:IM(gArm(false),mat,MAXG*2),gSpear:IM(gSpear(2.5,1.0,.3),mat,MAXG),
  gFace:IM(gShieldFace(),faceMat,MAXG),gRim:IM(gShieldRim(),mat,MAXG),
  pTorso:IM(pTorso(false),mat,MAXP),pTorsoA:IM(pTorso(true),mat,MAXP),pHead0:IM(pHead(0),mat,MAXP),pHead1:IM(pHead(1),mat,MAXP),
  pThigh:IM(pThigh(),mat,MAXP*2),pShin:IM(pShin(),mat,MAXP*2),pArm:IM(gArm(true),mat,MAXP*2),pSpear:IM(gSpear(1.9,.7,.22),mat,MAXP),pBow:IM(gBow(),mat,MAXP),
  pSpara:IM(gSpara(),wickerMat,MAXP)};
 const blz=new THREE.InstancedBufferAttribute(new Float32Array(MAXG),1);blz.setUsage(THREE.DynamicDrawUsage);P_.gFace.geometry.setAttribute('aBlz',blz);
 const cnt={};
 function begin(){for(const k in P_)cnt[k]=0;}
 function put(k,m,col){const im=P_[k],i=cnt[k]++;if(i>=im.instanceMatrix.count)return -1;im.setMatrixAt(i,m);if(col)im.setColorAt(i,col);else im.setColorAt(i,_c.setRGB(1,1,1));return i;}
 function end(){for(const k in P_){const im=P_[k];im.count=cnt[k];im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;}blz.needsUpdate=true;}
 // ---------- pose + draw one soldier ----------
 const R=new THREE.Matrix4(),TM=new THREE.Matrix4(),A=new THREE.Matrix4(),HM=new THREE.Matrix4(),Lm=new THREE.Matrix4();
 const vS=new THREE.Vector3(),vH=new THREE.Vector3(),vD=new THREE.Vector3(),DOWN=new THREE.Vector3(0,-1,0),FWD=new THREE.Vector3(0,0,1);
 const colTmp=new THREE.Color(),colTmp2=new THREE.Color();
 function mk(m,x,y,z,rx,ry,rz){_e.set(rx,ry,rz);_q.setFromEuler(_e);_v.set(x,y,z);return m.compose(_v,_q,_s1);}
 function armTo(parent,sx,sy,sz,hx,hy,hz,out){vS.set(sx,sy,sz);vD.set(hx-sx,hy-sy,hz-sz).normalize();_q.setFromUnitVectors(DOWN,vD);out.compose(vS,_q,_s1);return out.premultiply(parent);}
 // pose: walk/run phase, lean, gestures. s: soldier object (see game.js)
 function drawGreek(s){
  const t=s.anim;
  // root: position, yaw, falling backwards
  R.makeRotationY(s.yaw);R.setPosition(s.x,s.y||0,s.z);
  if(s.fall>0){const f=smooth(Math.min(1,s.fall));_e.set(-PI/2*f*.96,0,f*.25*s.fallSide);A.makeRotationFromEuler(_e);A.setPosition(0,f*.12,0);R.multiply(A);}
  const run=s.gait,ph=s.phase,sw=Math.sin(ph),cw=Math.cos(ph);
  const ampT=lerp(.42,.75,run)*s.move,knee=lerp(.35,1.25,run)*s.move;
  const bob=Math.abs(cw)*lerp(.025,.07,run)*s.move-s.crouch*.12;
  const lean=lerp(.04,.22,run)*s.move+s.crouch*.25+s.push*.35;
  // torso
  mk(TM,0,HIP+bob,0,lean,sw*.08*s.move,0);TM.premultiply(R);
  put(s.linen?'gTorsoL':'gTorsoB',TM,s.linen?s.band:null);
  // head (counter-lean so he looks ahead)
  mk(A,0,.68,.02,-lean*.6-s.look,0,0);A.premultiply(TM);put(s.open?'gHeadO':'gHeadC',A,s.crest);
  // legs
  for(let side=0;side<2;side++){const sg=side?-1:1,a=sw*sg*ampT-s.crouch*.5-s.push*.35*(side?1.4:.6),k=Math.max(0,-Math.sin(ph+sg*.0+(side?PI:0)+1.2))*knee+s.crouch*.9+s.push*.4;
   mk(A,sg*.1,HIP+bob,0,-a,0,0);A.premultiply(R);if(s.fall>0)A.multiply(mk(Lm,0,0,0,-.3*s.fall,0,0));put('gThigh',A);
   mk(Lm,0,-THIGH,0,k,0,0);Lm.premultiply(A);put('gShin',Lm);}
  // spear: upright (march), lowered overhand (charge, push), stab
  const sp=s.spear; // 0 upright, 1 overhand level
  const stab=s.stab;
  vH.set(lerp(-.27,-.22,sp),lerp(.08,.62,sp),lerp(.2,.02-.0+stab*.38,sp));
  vD.set(0,lerp(1,-.06,sp),lerp(.08,1,sp)).normalize();
  const sx=-.21,sy=.47;
  // clamp hand to arm reach
  {const dx=vH.x-sx,dy=vH.y-sy,dz=vH.z;const L=Math.hypot(dx,dy,dz);if(L>.56){const k=.56/L;vH.set(sx+dx*k,sy+dy*k,dz*k);}}
  armTo(TM,sx,sy,0,vH.x,vH.y,vH.z,A);put('gArm',A);
  _q.setFromUnitVectors(FWD,vD);HM.compose(vH,_q,_s1).premultiply(TM);if(!s.noSpear)put('gSpear',HM);
  // shield: front-left, raised above the head when arrows come, pressed forward when pushing
  const up=s.shieldUp;
  const shx=lerp(.13,.05,up),shy=lerp(.12,.62,up)+s.push*.05,shz=lerp(.34,.32,up)+s.push*.08;
  mk(A,shx,shy,shz,lerp(-.06,-.95,up),lerp(.22,.05,up)-s.push*.12,0);A.premultiply(TM);
  s.shM?s.shM.copy(A):s.shM=A.clone();
  const fi=put('gFace',A);if(fi>=0)blz.array[fi]=s.blz;
  put('gRim',A,s.rimCol);
  // left arm to the shield grip
  _v2.set(0,0,-.08).applyMatrix4(mk(Lm,shx,shy,shz,lerp(-.06,-.95,up),lerp(.22,.05,up),0));
  armTo(TM,.21,.47,0,_v2.x,_v2.y,_v2.z,A);put('gArm',A);
 }
 function drawPersian(s){
  R.makeRotationY(s.yaw);R.setPosition(s.x,s.y||0,s.z);
  if(s.fall>0){const f=smooth(Math.min(1,s.fall));_e.set(-PI/2*f*.96,0,f*.25*s.fallSide);A.makeRotationFromEuler(_e);A.setPosition(0,f*.12,0);R.multiply(A);}
  const run=s.gait,ph=s.phase,sw=Math.sin(ph),cw=Math.cos(ph);
  const ampT=lerp(.42,.8,run)*s.move,knee=lerp(.35,1.3,run)*s.move;
  const bob=Math.abs(cw)*lerp(.025,.07,run)*s.move-s.crouch*.1;
  const lean=lerp(.04,.25,run)*s.move+s.crouch*.2+s.push*.3;
  mk(TM,0,HIP+bob,0,lean,sw*.08*s.move,0);TM.premultiply(R);
  put(s.archer?'pTorsoA':'pTorso',TM,s.tunic);
  mk(A,0,.68,.02,-lean*.6-s.look,0,0);A.premultiply(TM);put(s.hat?'pHead1':'pHead0',A,s.capCol);
  for(let side=0;side<2;side++){const sg=side?-1:1,a=sw*sg*ampT-s.crouch*.4-s.push*.3*(side?1.4:.6),k=Math.max(0,-Math.sin(ph+(side?PI:0)+1.2))*knee+s.crouch*.8+s.push*.4;
   mk(A,sg*.1,HIP+bob,0,-a,0,0);A.premultiply(R);put('pThigh',A,s.trous);mk(Lm,0,-THIGH,0,k,0,0);Lm.premultiply(A);put('pShin',Lm,s.trous);}
  if(s.archer&&!s.flee){ // bow in the left hand; draw = right hand to the cheek
   const dr=s.draw,aim=lerp(.2,.75,dr);
   vH.set(.12,lerp(.15,.5,dr),lerp(.3,.5,dr));
   armTo(TM,.21,.47,0,vH.x,vH.y,vH.z,A);put('pArm',A,s.tunic);
   _e.set(-aim,0,0);_q.setFromEuler(_e);HM.compose(vH,_q,_s1).premultiply(TM);put('pBow',HM);
   armTo(TM,-.21,.47,0,lerp(-.25,-.05,dr),lerp(.1,.55,dr),lerp(.15,.12,dr),A);put('pArm',A,s.tunic);
  }else{
   const sp=s.spear,stab=s.stab;
   vH.set(-.25,lerp(.1,.45,sp),lerp(.2,.1+stab*.35,sp));vD.set(0,lerp(1,-.05,sp),lerp(.1,1,sp)).normalize();
   armTo(TM,-.21,.47,0,vH.x,vH.y,vH.z,A);put('pArm',A,s.tunic);
   _q.setFromUnitVectors(FWD,vD);HM.compose(vH,_q,_s1).premultiply(TM);if(!s.flee)put('pSpear',HM);
   armTo(TM,.21,.47,0,.18,.12,.3,A);put('pArm',A,s.tunic);
  }
 }
 // planted wicker shields of the front rank (spara wall)
 function drawSpara(x,z,yaw,tilt){mk(A,x,0,z,tilt,yaw,0);put('pSpara',A);}
 return{begin,end,drawGreek,drawPersian,drawSpara,P:P_};
})();
