'use strict';
/* Phalanx – particles (dust, sparks, motes in the sun), arrows (flying, stuck in shields and ground), target marks. */
const FX=(()=>{
 const soft=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  for(let i=0;i<6;i++){const gx=32+(Math.random()-.5)*16,gy=32+(Math.random()-.5)*16,r=14+Math.random()*14;const g=x.createRadialGradient(gx,gy,0,gx,gy,r);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}
  const t=new THREE.CanvasTexture(c);return t;})();
 function system(N,additive){
  const geo=new THREE.BufferGeometry();const pos=new Float32Array(N*3),col=new Float32Array(N*4),sz=new Float32Array(N),rot=new Float32Array(N);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('pcol',new THREE.BufferAttribute(col,4).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('psize',new THREE.BufferAttribute(sz,1).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('prot',new THREE.BufferAttribute(rot,1).setUsage(THREE.DynamicDrawUsage));
  const mat=new THREE.ShaderMaterial({uniforms:{map:{value:soft},scale:{value:innerHeight*.6},boost:{value:additive?2.2:1}},transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:`attribute vec4 pcol;attribute float psize,prot;varying vec4 vC;varying float vR;uniform float scale;
void main(){vC=pcol;vR=prot;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=psize*scale/max(-mv.z,.1);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`uniform sampler2D map;uniform float boost;varying vec4 vC;varying float vR;
void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=mat2(c,-s,s,c)*p;float a;
 ${additive?'vec2 q=abs(p*2.);float st=max(0.,1.-q.x*6.)*max(0.,1.-q.y)+max(0.,1.-q.y*6.)*max(0.,1.-q.x);a=max(max(0.,1.-length(p)*2.)*.7,st);':'a=texture2D(map,p+.5).a;'}
 gl_FragColor=vec4(vC.rgb*boost,vC.a*a);
#include <colorspace_fragment>
}`});
  const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;pts.renderOrder=5;scene.add(pts);
  const P=[];for(let i=0;i<N;i++)P.push({life:0,max:1,x:0,y:-999,z:0,vx:0,vy:0,vz:0,s0:1,s1:1,r:1,g:1,b:1,a:1,rot:0,spin:0,grav:0,drag:1});
  let head=0;
  function emit(o){const p=P[head];head=(head+1)%N;Object.assign(p,o);p.life=0;return p;}
  function update(dt){for(let i=0;i<N;i++){const p=P[i];if(p.life>=p.max){pos[i*3+1]=-999;col[i*4+3]=0;continue;}
   p.life+=dt;const k=p.life/p.max;p.vy-=p.grav*dt;const d=Math.pow(p.drag,dt);p.vx*=d;p.vy*=d;p.vz*=d;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.spin*dt;
   pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;col[i*4]=p.r;col[i*4+1]=p.g;col[i*4+2]=p.b;col[i*4+3]=p.a*Math.min(1,k*6)*(1-k)*(1-k*.3);sz[i]=lerp(p.s0,p.s1,Math.sqrt(k));rot[i]=p.rot;}
   geo.attributes.position.needsUpdate=geo.attributes.pcol.needsUpdate=geo.attributes.psize.needsUpdate=geo.attributes.prot.needsUpdate=true;}
  return{emit,update,mat};}
 const LOW=IS_TOUCH;
 const dustS=system(LOW?700:1400,false),sparkS=system(LOW?240:480,true),moteS=system(LOW?120:240,true);
 addEventListener('resize',()=>{for(const s of[dustS,sparkS,moteS])s.mat.uniforms.scale.value=innerHeight*.6;});
 function dust(x,y,z,n=1,o={}){for(let i=0;i<n;i++){const sh=.85+Math.random()*.25;dustS.emit({max:o.life||rand(1.2,2.2),x:x+rand(-.3,.3),y:y+rand(0,.2),z:z+rand(-.3,.3),vx:(o.vx||0)+rand(-.5,.5),vy:rand(.2,.9)*(o.up||1),vz:(o.vz||0)+rand(-.5,.5),
  s0:o.s0||.5,s1:o.s1||rand(1.6,2.6),r:.78*sh,g:.64*sh,b:.46*sh,a:o.a||.32,rot:rand(0,TAU),spin:rand(-.6,.6),grav:-.05,drag:.6});}}
 function sparks(x,y,z,n=8){for(let i=0;i<n;i++)sparkS.emit({max:rand(.25,.55),x,y,z,vx:rand(-3,3),vy:rand(.5,4),vz:rand(-3,3),s0:.16,s1:.04,r:1,g:rand(.7,.9),b:.4,a:1,rot:rand(0,TAU),spin:0,grav:9,drag:.3});}
 function splinters(x,y,z,n=6){for(let i=0;i<n;i++)dustS.emit({max:rand(.5,.9),x,y,z,vx:rand(-2,2),vy:rand(1,3),vz:rand(-2,2),s0:.12,s1:.08,r:.55,g:.4,b:.22,a:.9,rot:rand(0,TAU),spin:rand(-8,8),grav:9,drag:.5});}
 function glint(x,y,z,s=.5){sparkS.emit({max:.35,x,y,z,vx:0,vy:0,vz:0,s0:s,s1:s*.3,r:1,g:.9,b:.6,a:1,rot:rand(0,TAU),spin:2,grav:0,drag:1});}
 let moteAcc=0;
 function update(dt){
  moteAcc+=dt*(LOW?14:28);while(moteAcc>=1){moteAcc--;const a=rand(0,TAU),r=rand(2,26);moteS.emit({max:rand(3,6),x:camera.position.x+Math.cos(a)*r,y:camera.position.y+rand(-6,3),z:camera.position.z+Math.sin(a)*r+8,
   vx:rand(-.2,.2),vy:rand(-.05,.12),vz:rand(-.2,.2),s0:.05,s1:.08,r:1,g:.8,b:.55,a:.45,rot:0,spin:0,grav:0,drag:1});}
  dustS.update(dt);sparkS.update(dt);moteS.update(dt);}
 return{dust,sparks,splinters,glint,update};
})();

const ARROWS=(()=>{
 const g=merge([P(cyl(.014,.014,.9,4),0x6a4a2a,0,0,0,PI/2),P(cone(.03,.1,4),C.iron,0,0,.5,PI/2),P(box(.003,.07,.16),0xf4ece0,0,0,-.38),P(box(.07,.003,.16),0xc8321f,0,0,-.38)]);
 const N=IS_TOUCH?700:1300;
 const im=new THREE.InstancedMesh(g,partMat(),N);im.frustumCulled=false;im.castShadow=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.count=0;scene.add(im);
 const A=[];let head=0;
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),F=new THREE.Vector3(0,0,1),one=new THREE.Vector3(1,1,1);
 const marks=[];const markMat=new THREE.MeshBasicMaterial({color:0xff5030,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 for(let i=0;i<4;i++){const mm=new THREE.Mesh(new THREE.RingGeometry(.86,1,48).rotateX(-PI/2),markMat.clone());mm.visible=false;mm.renderOrder=2;scene.add(mm);marks.push({m:mm,t:0,T:1});}
 let onLand=null;
 function spawn(o){let a=A.length<N?(A.push({}),A[A.length-1]):A[head=(head+1)%N];Object.assign(a,{state:'fly',t:0,x:o.x,y:o.y,z:o.z,vx:o.vx,vy:o.vy,vz:o.vz,T:o.T,stuck:null,life:0,lm:null,vid:o.vid});return a;}
 // sources: [{x,y,z}], target centre, half sizes, flight time
 function volley(src,tx,tz,hw,hd,T,count,vid){
  for(let i=0;i<count;i++){const s=src[(Math.random()*src.length)|0];const x0=s.x+rand(-.3,.3),y0=1.6,z0=s.z;
   const u=Math.sqrt(Math.random()),a=rand(0,TAU),px=tx+Math.cos(a)*u*hw,pz=tz+Math.sin(a)*u*hd,tt=T*rand(.94,1.06);
   const vy=(terrainH(px,pz)+.2-y0+.5*9.8*tt*tt)/tt;spawn({x:x0,y:y0,z:z0,vx:(px-x0)/tt,vy,vz:(pz-z0)/tt,T:tt,vid});}
  const mk=marks.find(k=>!k.m.visible)||marks[0];mk.m.visible=true;mk.t=0;mk.T=T;mk.m.position.set(tx,terrainH(tx,tz)+.08,tz);mk.m.scale.set(hw,1,hd);}
 function stickShield(a,sold){a.state='shield';a.sold=sold;a.life=0;
  // arrow in the shield's frame
  const inv=new THREE.Matrix4().copy(sold.shM).invert();v.set(a.vx,a.vy,a.vz).normalize();q.setFromUnitVectors(F,v);
  const wm=new THREE.Matrix4().compose(new THREE.Vector3(a.x,a.y,a.z),q,one);a.lm=inv.multiply(wm);
  // push it onto the face of the shield
  const e=a.lm.elements;const lz=e[14];e[12]=clamp(e[12],-.36,.36);e[13]=clamp(e[13],-.36,.36);e[14]=Math.max(lz,.1)+.05;}
 function update(dt){let n=0;
  for(const mk of marks){if(!mk.m.visible)continue;mk.t+=dt;const k=mk.t/mk.T;mk.m.material.opacity=k<1?.22+.18*Math.sin(mk.t*14)*k:0;if(k>=1)mk.m.visible=false;}
  for(const a of A){if(!a.state)continue;
   if(a.state==='fly'){a.t+=dt;a.vy-=9.8*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt;
    if(a.t>=a.T||a.y<=terrainH(a.x,a.z)+.1){a.y=Math.max(a.y,terrainH(a.x,a.z)+.1);const r=onLand?onLand(a):null;
     if(r&&r.shield&&r.shield.shM)stickShield(a,r.shield);else{a.state='ground';a.life=0;a.y=terrainH(a.x,a.z)+.25;a.vy=Math.min(a.vy,-2);}}
    if(a.state==='fly'){v.set(a.vx,a.vy,a.vz).normalize();q.setFromUnitVectors(F,v);m.compose(v.set(a.x,a.y,a.z),q,one);im.setMatrixAt(n++,m);}}
   if(a.state==='ground'){a.life+=dt;if(a.life>14){a.state=null;continue;}v.set(a.vx,a.vy,a.vz).normalize();q.setFromUnitVectors(F,v);m.compose(v.set(a.x,a.y,a.z),q,one);im.setMatrixAt(n++,m);}
   if(a.state==='shield'){a.life+=dt;const s=a.sold;if(a.life>18||!s||!s.shM||(s.fall>0&&a.life>6)){a.state=null;continue;}m.multiplyMatrices(s.shM,a.lm);im.setMatrixAt(n++,m);}
   if(n>=N)break;}
  im.count=n;im.instanceMatrix.needsUpdate=true;}
 function clear(){for(const a of A)a.state=null;for(const mk of marks)mk.m.visible=false;}
 return{volley,update,clear,set onLand(f){onLand=f;}};
})();
