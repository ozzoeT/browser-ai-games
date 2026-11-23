'use strict';
/* Phalanx – the plain of Marathon at dawn: hills behind the Greeks, the Great Marsh on the left (north),
   the Persian camp and the ships drawn up on the beach, the sea shining under the rising sun. */
const W={PERSIAN_Z:300,BEACH_Z:352,SHORE_Z:392,SHIP_STERN:374};
function terrainH(x,z){
 let h=.35*(Math.sin(x*.05+Math.sin(z*.03)*2)*.5+Math.sin(z*.041+x*.021)*.5)+.15*Math.sin(x*.13+z*.11);
 const b=Math.max(0,-40-z);h+=Math.pow(b/90,1.5)*20*(1+.35*Math.sin(x*.021+1));
 const sx=Math.max(0,Math.abs(x)-175);h+=Math.pow(sx/80,1.35)*26*(.7+.3*Math.sin(z*.013+x*.01));
 // Kynosoura headland on the left, running into the sea
 const kx=(x-300)/70;h=Math.max(h,32*Math.exp(-kx*kx)*smooth(clamp((z-60)/300,0,1))*(1-smooth(clamp((z-900)/200,0,1)))-2);
 // the Great Marsh (left): low and wet
 const mx=clamp((x-105)/30,0,1)*clamp((265-x)/30,0,1)*clamp((z-150)/40,0,1)*clamp((385-z)/20,0,1);h=lerp(h,-.25,mx*.9);
 // beach and sea floor
 const beach=smooth(clamp((z-W.BEACH_Z)/34,0,1));h=lerp(h,.25-(z-W.BEACH_Z)*.022,beach*(1-clamp((x-150)/40,0,1)));
 if(z>W.SHORE_Z&&x<200)h=Math.min(h,-.5-(z-W.SHORE_Z)*.06);
 return h;}
const WORLD=(()=>{
 const rng=mulberry(490);
 // ---------- ground ----------
 const G=new THREE.PlaneGeometry(2200,2200,260,260);G.rotateX(-PI/2);G.translate(0,0,250);
 {const p=G.attributes.position,col=new Float32Array(p.count*3);
  const dry=new THREE.Color(0xcfb26a),dry2=new THREE.Color(0xb89a52),green=new THREE.Color(0x8c8f48),scrub=new THREE.Color(0x6b7040),rock=new THREE.Color(0x8c8272),
   sand=new THREE.Color(0xe2cb9a),wet=new THREE.Color(0xb59f78),marsh=new THREE.Color(0x56603a),c=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=terrainH(x,z);p.setY(i,h);
   const n=.5+.5*Math.sin(x*.031+Math.sin(z*.023)*3)*Math.cos(z*.027+x*.011),n2=.5+.5*Math.sin(x*.21+z*.17);
   c.copy(dry).lerp(dry2,n2*.6).lerp(green,n*.55);
   if(h>3)c.lerp(scrub,clamp((h-3)/10,0,1)*.8);
   if(h>14)c.lerp(rock,clamp((h-14)/20,0,.6)*n2);
   const mx=clamp((x-110)/25,0,1)*clamp((260-x)/25,0,1)*clamp((z-155)/30,0,1)*clamp((380-z)/15,0,1);c.lerp(marsh,mx*.85);
   const sb=smooth(clamp((z-W.BEACH_Z+6)/22,0,1))*(1-clamp((x-150)/40,0,1));c.lerp(sand,sb);
   if(z>W.SHORE_Z-8)c.lerp(wet,smooth(clamp((z-W.SHORE_Z+8)/7,0,1))*(1-clamp((x-150)/40,0,1)));
   col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  G.setAttribute('color',new THREE.BufferAttribute(col,3));G.computeVertexNormals();}
 const ground=new THREE.Mesh(G,patchMat(new THREE.MeshLambertMaterial({vertexColors:true}),{key:'gr'}));ground.receiveShadow=true;scene.add(ground);
 // ---------- sea ----------
 const seaU={uTime:U.time,sunDir:{value:SUN},sunCol:{value:new THREE.Color(1.4,1.,.62)},hor:skyU.hor,top:skyU.top,fogC:{value:FOGC},fogN:{value:200},fogF:{value:1500},
  deep:{value:new THREE.Color(0x1d4a66)},shal:{value:new THREE.Color(0x4f9a9a)}};
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(2600,1600,1,1).rotateX(-PI/2).translate(0,0,W.SHORE_Z-10+800),new THREE.ShaderMaterial({uniforms:seaU,transparent:true,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uTime,fogN,fogF;uniform vec3 sunDir,sunCol,hor,top,fogC,deep,shal;varying vec3 vW;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 p=vW.xz;float t=uTime;vec2 g=vec2(0.);
 vec2 d1=normalize(vec2(.3,1.)),d2=normalize(vec2(-.7,.6)),d3=normalize(vec2(.9,.2)),d4=normalize(vec2(-.2,-1.));
 g+=d1*cos(dot(d1,p)*.21+t*1.1)*.06;g+=d2*cos(dot(d2,p)*.37+t*1.7)*.045;g+=d3*cos(dot(d3,p)*.83+t*2.3)*.03;g+=d4*cos(dot(d4,p)*1.7+t*3.1)*.02;
 g+=vec2(hs(floor(p*1.3)+floor(t*2.))-.5,hs(floor(p*1.3)+3.1+floor(t*2.))-.5)*.035;
 vec3 n=normalize(vec3(-g.x,1.,-g.y));vec3 V=normalize(cameraPosition-vW);float dist=length(cameraPosition-vW);
 n=normalize(mix(n,vec3(0.,1.,0.),smoothstep(200.,900.,dist)*.7));
 float fr=.04+.96*pow(1.-max(dot(n,V),0.),5.);
 vec3 base=mix(shal,deep,smoothstep(${W.SHORE_Z}.,${W.SHORE_Z+70}.,vW.z));
 vec3 R=reflect(-V,n);float sd=max(dot(R,sunDir),0.);
 vec3 sk=mix(hor,top,pow(clamp(R.y,0.,1.),.5))+sunCol*pow(sd,8.)*.5;
 vec3 c=mix(base,sk,clamp(fr*1.1,0.,1.));
 c+=sunCol*(pow(sd,420.)*14.+pow(sd,60.)*.5);
 float sh=1.-smoothstep(${W.SHORE_Z-1}.,${W.SHORE_Z+7}.,vW.z+sin(vW.x*.13+t*.7)*1.5);
 float foam=sh*smoothstep(.55,1.,.5+.5*sin((vW.z-${W.SHORE_Z}.)*1.1-t*1.9+sin(vW.x*.27)*1.5));
 c=mix(c,vec3(1.,.95,.88)*1.05,clamp(foam,0.,1.)*.75);
 c=mix(c,fogC,smoothstep(fogN,fogF,dist)*.8);
 float a=smoothstep(${W.SHORE_Z-5}.,${W.SHORE_Z+1}.,vW.z)*.85+.15;
 gl_FragColor=vec4(c,a);
#include <colorspace_fragment>
}`}));sea.renderOrder=1;scene.add(sea);
 // marsh pools reflect the sky
 const poolMat=new THREE.MeshStandardMaterial({color:0x3a5a5a,roughness:.08,metalness:.1,envMapIntensity:1.2,transparent:true,opacity:.85});
 for(let i=0;i<9;i++){const r=6+rng()*14,m=new THREE.Mesh(new THREE.CircleGeometry(r,20).rotateX(-PI/2),poolMat);m.scale.z=.6+rng()*.6;m.position.set(130+rng()*120,-.08,170+rng()*200);scene.add(m);}
 // ---------- far mountains (Pentelikon behind, Euboea across the sea) ----------
 const mtMat=new THREE.MeshLambertMaterial({color:0x7a7e9c,flatShading:true});
 function mountain(x,z,r,h,c){const g=new THREE.ConeGeometry(r,h,9,4);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<h/2-1){p.setX(i,p.getX(i)*(1+rng()*.25));p.setZ(i,p.getZ(i)*(1+rng()*.25));p.setY(i,y+rng()*h*.06);}}
  g.computeVertexNormals();const m=new THREE.Mesh(g,c||mtMat);m.position.set(x,h/2-6,z);m.scale.z=.6;scene.add(m);}
 mountain(-60,-620,380,220);mountain(260,-520,300,170);mountain(-380,-420,260,150);mountain(-560,120,260,160);
 const eub=new THREE.MeshLambertMaterial({color:0xa79aa8,flatShading:true,fog:true});
 mountain(-200,1550,520,90,eub);mountain(300,1650,600,110,eub);mountain(800,1450,400,70,eub);
 // ---------- vegetation ----------
 const vegMat=patchMat(new THREE.MeshLambertMaterial({vertexColors:true}),{key:'veg'});
 const windMat=patchMat(new THREE.MeshLambertMaterial({vertexColors:true}),{wind:.012,base:1.2,key:'treew'});
 const grassMat=patchMat(new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),{wind:.5,base:0,key:'grass'});
 function oliveTrunk(){return merge([P(cyl(.16,.3,1.8,7),0x6a5a48,0,.9,0,.15,0,.1),P(cyl(.1,.14,1.2,6),0x6a5a48,.3,2.,.1,.2,0,-.6),P(cyl(.09,.12,1.1,6),0x6a5a48,-.3,2.,0,.1,0,.7)]);}
 function oliveTop(){const p=[];for(let i=0;i<7;i++){const a=i/7*TAU;p.push(P(new THREE.IcosahedronGeometry(1,1),i%2?0x7f8c5e:0x6d7a50,Math.cos(a)*1.3,2.6+rng()*.7,Math.sin(a)*1.1,0,0,0,1.3,.8,1.2));}
  p.push(P(new THREE.IcosahedronGeometry(1.3,1),0x86926a,0,3.2,0,0,0,0,1.2,.8,1.2));return merge(p,(x,y)=>.72+.28*clamp((y-2)/1.8,0,1));}
 function cypress(){return merge([P(cyl(.12,.16,1,6),0x4a3a2a,0,.5,0),P(cone(1,7,8),0x3c4a2c,0,4.3,0),P(cone(.75,3,8),0x46553a,0,7.2,0)],(x,y)=>.7+.3*y/8.5);}
 function pine(){return merge([P(cyl(.14,.22,5,6),0x6a4a30,0,2.5,0,0,0,.08),P(sph(2.6,10,6),0x4f6236,.3,5.5,0,0,0,0,1,.4,1),P(sph(1.8,9,5),0x5d7040,.6,6.1,.4,0,0,0,1,.4,1)]);}
 function scatter(geo,mat,n,ok,sc,shadow=true){const im=new THREE.InstancedMesh(geo,mat,n);im.castShadow=shadow;im.receiveShadow=true;const m=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();let k=0,tries=0;
  while(k<n&&tries<n*40){tries++;const x=(rng()*2-1)*420,z=-160+rng()*560;if(!ok(x,z))continue;const s=sc[0]+rng()*(sc[1]-sc[0]);q.setFromAxisAngle(_v.set(0,1,0),rng()*TAU);
   m.compose(_v.set(x,terrainH(x,z)-.05,z),q,_v2.set(s,s*(.85+rng()*.3),s));im.setMatrixAt(k,m);c.setHSL(.12+rng()*.06,.25,.45+rng()*.15);im.setColorAt(k,c.set(1,1,1).multiplyScalar(.85+rng()*.3));k++;}
  im.count=k;scene.add(im);return im;}
 const clear=(x,z)=>Math.abs(x)>62||z<-34;
 const land=(x,z)=>terrainH(x,z)>-.1&&z<W.BEACH_Z-6;
 const okTree=(x,z)=>clear(x,z)&&land(x,z)&&!(x>105&&x<265&&z>150&&z<385);
 const otT=oliveTrunk(),otC=oliveTop();
 const N_OL=170;const ot1=scatter(otT,vegMat,N_OL,okTree,[.8,1.3]);
 // canopy needs the same matrices as the trunks
 {const im=new THREE.InstancedMesh(otC,windMat,N_OL);im.castShadow=true;im.receiveShadow=true;const m=new THREE.Matrix4();for(let i=0;i<ot1.count;i++){ot1.getMatrixAt(i,m);im.setMatrixAt(i,m);}im.count=ot1.count;scene.add(im);}
 scatter(cypress(),vegMat,60,(x,z)=>okTree(x,z)&&(z<40||Math.abs(x)>110),[.8,1.3]);
 scatter(pine(),windMat,40,(x,z)=>clear(x,z)&&z>250&&z<W.BEACH_Z+8&&terrainH(x,z)>0&&Math.abs(x)>75,[.9,1.3]);
 // grass tufts and thistles, all over the plain (waving)
 function tuft(){const p=[];for(let i=0;i<5;i++){const a=i/5*TAU+rng(),g=new THREE.ConeGeometry(.05,.55+rng()*.3,3,1,true);p.push(P(g,i%2?0xc4a860:0x9a9a50,Math.cos(a)*.12,.3,Math.sin(a)*.12,Math.cos(a)*.35,0,Math.sin(a)*.35));}return merge(p,(x,y)=>.6+.6*y);}
 const tuftG=tuft();
 {const n=IS_TOUCH?3500:7000;const im=new THREE.InstancedMesh(tuftG,grassMat,n);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();let k=0;
  while(k<n){const x=(rng()*2-1)*170,z=-50+rng()*410;if(terrainH(x,z)<0||z>W.BEACH_Z+4)continue;const s=.7+rng()*.8;q.setFromAxisAngle(_v.set(0,1,0),rng()*TAU);m.compose(_v.set(x,terrainH(x,z),z),q,_v2.set(s,s,s));im.setMatrixAt(k,m);
   im.setColorAt(k,c.setRGB(.8+rng()*.4,.8+rng()*.35,.75+rng()*.3));k++;}scene.add(im);}
 // reeds in the marsh
 {const rg=merge([0,1,2,3,4,5].map(i=>P(cyl(.015,.025,1.8+i*.15,3,true),i%2?0x7a8a4a:0x8f8a52,Math.cos(i)*.2,.9,Math.sin(i)*.2,Math.cos(i*2)*.1,0,Math.sin(i*2)*.1)));
  const n=1500,im=new THREE.InstancedMesh(rg,patchMat(new THREE.MeshLambertMaterial({vertexColors:true}),{wind:.05,base:0,key:'reed'}),n);const m=new THREE.Matrix4();let k=0;
  while(k<n){const x=110+rng()*150,z=155+rng()*228;if(Math.abs(terrainH(x,z)+.2)>.3)continue;const s=.8+rng()*.6;m.makeScale(s,s,s);m.setPosition(x,terrainH(x,z),z);im.setMatrixAt(k++,m);}scene.add(im);}
 // rocks
 {const rk=merge([P(new THREE.IcosahedronGeometry(1,0),0x8c857a)]);scatter(rk,patchMat(new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}),{key:'rock'}),160,(x,z)=>clear(x,z)&&terrainH(x,z)>-.1,[.3,1.4]);}
 // ---------- Persian camp: tents and standards ----------
 const tentCols=[0xc9a24a,0x8a3a6a,0xe4d8b8,0x3a5a9a,0xa8321f];
 function tent(c){return merge([P(cyl(2.2,2.4,2.2,10),c,0,1.1,0),P(cone(2.6,2.2,10),0xe4d8b8,0,3.3,0),P(cyl(.06,.06,1.2,4),0x6a4a2a,0,4.6,0),...[0,1,2,3,4].map(i=>P(box(.25,2.2,.05),0xe4d8b8,Math.cos(i*1.25)*2.31,1.1,Math.sin(i*1.25)*2.31,0,-i*1.25+PI/2,0,1,1,1))],(x,y)=>.8+.2*y/4);}
 const tentG=tentCols.map(tent);
 for(let i=0;i<46;i++){const side=i%2?1:-1,x=side*(70+rng()*80),z=W.BEACH_Z-28+rng()*34;if(terrainH(x,z)<0)continue;const m=new THREE.Mesh(tentG[i%5],vegMat);m.position.set(x,terrainH(x,z),z);m.rotation.y=rng()*TAU;m.scale.setScalar(.8+rng()*.5);m.castShadow=m.receiveShadow=true;scene.add(m);}
 // ---------- ships ----------
 function hullGeo(L,Wd,Hd,col1,col2){const N=26,pos=[],colA=[],idx=[],c1=new THREE.Color(col1),c2=new THREE.Color(col2),cb=new THREE.Color(0x9a3a1e),cw=new THREE.Color(0xf0e6d0),cd=new THREE.Color(0x14100c);
  const sec=[];for(let i=0;i<=N;i++){const t=i/N,w=Wd*Math.pow(Math.sin(PI*clamp(t*.94+.03,0,1)),.6),top=Hd+Math.pow(1-t,6)*3.6+Math.pow(t,8)*1.2,z=t*L-(t<.08?0:0);
   const yb=.1+Math.pow(Math.abs(t-.5)*2,3)*.9;const y0=t<.05?top-1:0;
   sec.push([[-w,top],[-w*.92,top*.6],[-w*.55,yb+.3],[0,yb],[w*.55,yb+.3],[w*.92,top*.6],[w,top]].map(([x,y])=>[x,Math.max(y,y0),z]));}
  const R=7;for(let i=0;i<=N;i++)for(let j=0;j<R;j++){const p=sec[i][j];pos.push(p[0],p[1],p[2]);const t=i/N,yy=p[1];
   let c=c1;if(j===1||j===5)c=yy>Hd*.5?cb:c1;if((j===0||j===6))c=c2;if(t>.9&&(j===1||j===5))c=cw;colA.push(c.r,c.g,c.b);}
  for(let i=0;i<N;i++)for(let j=0;j<R-1;j++){const a=i*R+j,b=(i+1)*R+j;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colA,3));g.setIndex(idx);g.computeVertexNormals();
  const ng=g.toNonIndexed();ng.computeVertexNormals();
  // deck, ram, eyes, mast, furled sail, steering oars
  const deckC=0x7a5a38,parts=[P(box(Wd*1.6,.12,L*.84),deckC,0,Hd-.25,L*.5),P(cone(.35,1.8,8),C.bronze,0,.5,L+.6,PI/2),P(cyl(.5,.5,.07,12),cw.getHex(),Wd*.62,Hd*.75,L*.9,0,0,PI/2-.3),P(cyl(.5,.5,.07,12),cw.getHex(),-Wd*.62,Hd*.75,L*.9,0,0,-PI/2+.3),
   P(cyl(.24,.24,.09,10),cd.getHex(),Wd*.66,Hd*.76,L*.905,0,0,PI/2-.3),P(cyl(.24,.24,.09,10),cd.getHex(),-Wd*.66,Hd*.76,L*.905,0,0,-PI/2+.3),
   P(cyl(.12,.15,9,6),0x6a4a2a,0,Hd+4.3,L*.55),P(cyl(.2,.2,7,8),0xe8dcc0,0,Hd+8.4,L*.55,0,0,PI/2),P(box(.12,.12,7),0x6a4a2a,0,Hd+8.5,L*.55,0,PI/2,0)];
  const merged=merge([{g:ng,c:0xffffff,metal:0,tint:0,m:new THREE.Matrix4()},...parts]);
  // the hull's own vertex colours survive: merge() multiplied them by white
  const cc=merged.attributes.color.array,src=ng.attributes.color.array;for(let i=0;i<src.length;i++)cc[i]=src[i]*(cc[i]);
  return merged;}
 function oarBank(L,Wd,Hd,side){const p=[];for(let i=0;i<14;i++){p.push(P(box(.08,.08,4.2),0x8a6a40,side*(Wd+1.6),Hd*.55-.6,L*.2+i*L*.045,0,side*1.25,side*.35));}return merge(p);}
 const shipMat=patchMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0,envMapIntensity:.5}),{key:'ship'});
 const SL=26,SWd=2.4,SH=2.5;const hullG=hullGeo(SL,SWd,SH,0x1d1712,0x6a3a1e),hullG2=hullGeo(SL,SWd,SH,0x2a1d14,0x2a4a6a),oarL=oarBank(SL,SWd,SH,1),oarR=oarBank(SL,SWd,SH,-1);
 const ships=[];
 const SHIP_X=[-54,-36,-18,0,18,36,54];
 for(let i=0;i<7;i++){const g=new THREE.Group();const h=new THREE.Mesh(i%2?hullG:hullG2,shipMat);h.castShadow=h.receiveShadow=true;g.add(h);
  const oL=new THREE.Mesh(oarL,shipMat),oR=new THREE.Mesh(oarR,shipMat);oL.visible=oR.visible=false;g.add(oL,oR);
  const x=SHIP_X[i]+(rng()-.5)*4;g.position.set(x,.15,W.SHIP_STERN+rng()*3);g.rotation.y=(rng()-.5)*.12;scene.add(g);
  ships.push({g,oL,oR,x,z0:g.position.z,state:'beached',t:0,launchAt:0,captured:false,deckY:SH});}
 // the rest of the fleet, already at sea
 const fleet=[];for(let i=0;i<22;i++){const g=new THREE.Group();const h=new THREE.Mesh(i%2?hullG:hullG2,shipMat);g.add(h);const oL=new THREE.Mesh(oarL,shipMat),oR=new THREE.Mesh(oarR,shipMat);g.add(oL,oR);
  g.position.set(-260+rng()*480,-.55,W.SHORE_Z+60+rng()*420);g.rotation.y=PI*.1+(rng()-.5)*.8;scene.add(g);fleet.push({g,oL,oR,ph:rng()*TAU,sp:1.5+rng()*1.5});}
 function shipsReset(){for(const s of ships){s.g.position.set(s.x,.15,s.z0);s.g.rotation.set(0,s.g.rotation.y,0);s.state='beached';s.t=0;s.captured=false;s.oL.visible=s.oR.visible=false;}}
 function update(dt,t){
  for(const f of fleet){f.g.position.x+=Math.sin(f.g.rotation.y)*f.sp*dt;f.g.position.z+=Math.cos(f.g.rotation.y)*f.sp*dt;f.g.rotation.z=Math.sin(t*.8+f.ph)*.03;f.g.position.y=-.55+Math.sin(t*1.1+f.ph)*.08;
   const r=Math.sin(t*2.2+f.ph)*.25;f.oL.rotation.y=r;f.oR.rotation.y=-r;}
  for(const s of ships){if(s.state==='launch'){s.t+=dt;const v=Math.min(4,1+s.t*.6);s.g.position.z+=v*dt;const z=s.g.position.z;s.g.position.y=lerp(.15,-.55,smooth(clamp((z-s.z0-4)/18,0,1)));
    s.oL.visible=s.oR.visible=true;const r=Math.sin(t*2.6)*.3;s.oL.rotation.y=r;s.oR.rotation.y=-r;s.g.rotation.z=Math.sin(t*1.1+s.x)*.025;if(z>s.z0+120)s.state='gone';}}
 }
 // gulls over the sea
 const gullG=merge([P(box(.9,.03,.2),0xf4f0e8,.45,0,0,0,0,.25),P(box(.9,.03,.2),0xf4f0e8,-.45,0,0,0,0,-.25),P(sph(.12,6,4),0xf4f0e8,0,0,0,0,0,0,1,.8,2)]);
 const gulls=new THREE.InstancedMesh(gullG,vegMat,24);gulls.frustumCulled=false;scene.add(gulls);const gd=[];for(let i=0;i<24;i++)gd.push({x:-150+rng()*300,z:W.SHORE_Z-30+rng()*120,y:10+rng()*18,r:8+rng()*20,ph:rng()*TAU,sp:.2+rng()*.3});
 function updateGulls(t){const m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3();gd.forEach((g,i)=>{const a=g.ph+t*g.sp;q.setFromAxisAngle(_v.set(0,1,0),a+PI/2);const fl=1+Math.sin(t*7+i)*.35;sc.set(fl,1,1);
  m.compose(_v.set(g.x+Math.cos(a)*g.r,g.y+Math.sin(t*.7+i),g.z+Math.sin(a)*g.r),q,sc);gulls.setMatrixAt(i,m);});gulls.instanceMatrix.needsUpdate=true;}
 return{ships,SHIP_X,shipsReset,update(dt,t){update(dt,t);updateGulls(t);}};
})();
