'use strict';
/* Phalanx – core: helpers, renderer, dawn light, sky, post-processing (bloom + grade), input.
   Bloom/grade (POST), cloud noise and patchMat follow the reference pipeline of iron-line/index.html. */
const PI=Math.PI,TAU=PI*2;
const $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const damp=(a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const IS_TOUCH=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const store={get(k,d){try{const v=localStorage.getItem('phalanx.'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem('phalanx.'+k,JSON.stringify(v));}catch(e){}}};

/* ---------------- renderer, scene, dawn light ---------------- */
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,IS_TOUCH?1.5:2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('scene').appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,2600);
// the sun rises over the sea (east = +z), a little to the right of the Greek line (right = -x)
const SUN=new THREE.Vector3(-.62,.27,.74).normalize();
const SUNCOL=new THREE.Color(0xffc489);
const FOGC=new THREE.Color(0xd6b394);
scene.fog=new THREE.Fog(FOGC,200,1300);
const hemi=new THREE.HemisphereLight(0xc4d6f2,0xa08050,1.4);scene.add(hemi);
const sun=new THREE.DirectionalLight(SUNCOL,2.7);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-46,right:46,top:46,bottom:-46,near:1,far:260});
sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun);scene.add(sun.target);
// soft bounce from behind the camera so the backs of the soldiers are not black
const fill=new THREE.DirectionalLight(0xffd7b0,.55);fill.position.set(.35,.6,-1);scene.add(fill);
function sunFollow(x,z){sun.target.position.set(x,0,z);sun.position.set(x+SUN.x*120,SUN.y*120,z+SUN.z*120);
sun.target.updateMatrixWorld();}

/* ---------------- shared uniforms, cloud noise, material patch (cloud shadows + wind) ---------------- */
const U={time:{value:0},cloud:{value:null}};
U.cloud.value=(()=>{const S=128,R=mulberry(17),g=new Float32Array(32*32);for(let i=0;i<g.length;i++)g[i]=R();
 const sm=t=>t*t*(3-2*t),at=(a,b,p)=>g[((a%p+p)%p)+((b%p+p)%p)*32];
 const n=(x,y,p)=>{const xi=Math.floor(x),yi=Math.floor(y),u=sm(x-xi),v=sm(y-yi);return lerp(lerp(at(xi,yi,p),at(xi+1,yi,p),u),lerp(at(xi,yi+1,p),at(xi+1,yi+1,p),u),v);};
 const d=new Uint8Array(S*S*4);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){let v=0,a=.55,f=4;for(let o=0;o<4;o++){v+=n(x/S*f,y/S*f,f)*a;a*=.5;f*=2;}const k=(y*S+x)*4;d[k]=d[k+1]=d[k+2]=clamp(v*255,0,255);d[k+3]=255;}
 const t=new THREE.DataTexture(d,S,S,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;})();
const COVER={value:.35};
function patchMat(mat,o={}){
 const prev=mat.onBeforeCompile;
 mat.onBeforeCompile=(sh,r)=>{if(o.pre)o.pre(sh);sh.uniforms.uTime=U.time;sh.uniforms.uCloud=U.cloud;sh.uniforms.uCover=COVER;
  sh.vertexShader='uniform float uTime;varying vec3 vWP;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
${o.wind?`{vec4 ip=vec4(0.,0.,0.,1.);
#ifdef USE_INSTANCING
ip=instanceMatrix*ip;
#endif
float hh=max(0.,position.y-${o.base.toFixed(2)});float w=(sin(uTime*1.3+ip.x*.37+ip.z*.29)+.35*sin(uTime*3.1+ip.x*1.7))*${o.wind.toFixed(4)}*hh*hh;transformed.x+=w;transformed.z+=w*.55;}`:''}`)
   .replace('#include <project_vertex>',`#include <project_vertex>
{vec4 wp=vec4(transformed,1.);
#ifdef USE_INSTANCING
wp=instanceMatrix*wp;
#endif
vWP=(modelMatrix*wp).xyz;}`);
  sh.fragmentShader='uniform float uTime;uniform float uCover;uniform sampler2D uCloud;varying vec3 vWP;\n'+sh.fragmentShader.replace('#include <aomap_fragment>',`{float cl=texture2D(uCloud,vWP.xz*.0045+vec2(uTime*.009,uTime*.004)).r;
reflectedLight.directDiffuse*=1.-smoothstep(.6-uCover*.25,.8-uCover*.25,cl)*.4;}
#include <aomap_fragment>`);
  if(o.post)o.post(sh);};
 mat.customProgramCacheKey=()=>'pm'+(o.key||'')+(o.wind||0)+'_'+(o.base||0);return mat;}

/* ---------------- sky: dawn gradient, sun, clouds lit from below ---------------- */
const skyU={uTime:U.time,uCloud:U.cloud,uCover:COVER,sunDir:{value:SUN},sunCol:{value:new THREE.Color(1,.72,.45)},
 top:{value:new THREE.Color(0x4f78b8)},hor:{value:new THREE.Color(0xf2c9a4)},horSun:{value:new THREE.Color(0xffa45c)}};
const SKY_FS=`uniform vec3 top,hor,horSun,sunCol,sunDir;uniform float uTime,uCover;uniform sampler2D uCloud;varying vec3 vD;
void main(){vec3 d=normalize(vD);float y=max(d.y,0.);float s=max(dot(d,sunDir),0.);
 vec3 h=mix(hor,horSun,pow(s,3.)*.9);vec3 c=mix(h,top,pow(y,.5));
 c=mix(c,hor*.85,smoothstep(0.,-.08,d.y));
 vec2 uv=d.xz/(d.y+.12)*.28+vec2(uTime*.003,uTime*.0012);float n=texture2D(uCloud,uv).r*.7+texture2D(uCloud,uv*2.3+.3).r*.3;
 float cl=smoothstep(.6-uCover*.3,.84-uCover*.3,n)*smoothstep(.0,.12,d.y)*(1.-smoothstep(.55,.9,d.y));
 vec3 cc=mix(vec3(.86,.62,.6),vec3(1.,.86,.72),smoothstep(.45,.9,n))+sunCol*pow(s,8.)*1.1;c=mix(c,cc,cl*.8);
 c+=sunCol*(smoothstep(.9990,.9994,s)*6.*(1.-cl*.8)+pow(s,60.)*.6+pow(s,7.)*.16);
 gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`;
const sky=new THREE.Mesh(new THREE.SphereGeometry(1800,40,20),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:SKY_FS}));
sky.renderOrder=-10;scene.add(sky);
// sky -> image based lighting for the bronze (helmets, shields, greaves)
(()=>{const pm=new THREE.PMREMGenerator(renderer);const es=new THREE.Scene();
 const m=new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:SKY_FS.replace('c=mix(c,hor*.85,smoothstep(0.,-.08,d.y));','c=mix(c,vec3(.42,.33,.22),smoothstep(0.,-.1,d.y));')}));es.add(m);
 scene.environment=pm.fromScene(es,.02).texture;})();

/* ---------------- post: HDR -> bright pass -> 4-level blur -> grade ---------------- */
const POST=(()=>{
 const low=/fx=low/.test(location.search)||(IS_TOUCH&&Math.min(innerWidth,innerHeight)<560);
 if(low||!renderer.capabilities.isWebGL2)return null;
 const rt=ms=>new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:!!ms,samples:ms?4:0});
 const main=rt(true),LV=4,bA=[],bB=[];for(let i=0;i<LV;i++){bA.push(rt());bB.push(rt());}
 const qs=new THREE.Scene(),qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));quad.frustumCulled=false;qs.add(quad);
 const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const SM=(u,fs)=>new THREE.ShaderMaterial({uniforms:u,vertexShader:VS,fragmentShader:fs,depthTest:false,depthWrite:false});
 const bright=SM({t:{value:null},th:{value:1.12},knee:{value:.3}},`uniform sampler2D t;uniform float th,knee;varying vec2 vUv;
void main(){vec3 c=texture2D(t,vUv).rgb;float l=max(c.r,max(c.g,c.b));float s=clamp(l-th+knee,0.,2.*knee);s=s*s/(4.*knee+1e-4);gl_FragColor=vec4(c*max(s,l-th)/max(l,1e-4),1.);}`);
 const blur=SM({t:{value:null},dir:{value:new THREE.Vector2()}},`uniform sampler2D t;uniform vec2 dir;varying vec2 vUv;
void main(){vec3 c=texture2D(t,vUv).rgb*.227;c+=(texture2D(t,vUv+dir*1.385).rgb+texture2D(t,vUv-dir*1.385).rgb)*.316;c+=(texture2D(t,vUv+dir*3.231).rgb+texture2D(t,vUv-dir*3.231).rgb)*.070;gl_FragColor=vec4(c,1.);}`);
 const comp=SM({t:{value:main.texture},b0:{value:bA[0].texture},b1:{value:bA[1].texture},b2:{value:bA[2].texture},b3:{value:bA[3].texture},px:{value:new THREE.Vector2()},
  bloom:{value:.5},expo:{value:1.0},sat:{value:1.07},vig:{value:.34},warm:{value:new THREE.Vector3(1.035,1.,.955)},sharp:{value:.2},flash:{value:0}},
  `uniform sampler2D t,b0,b1,b2,b3;uniform vec2 px;uniform float bloom,expo,sat,vig,sharp,flash;uniform vec3 warm;varying vec2 vUv;
vec3 shoulder(vec3 c){vec3 x=max(c-.78,0.);return min(c,.78)+.22*(1.-exp(-x/.22));}
void main(){vec3 c=texture2D(t,vUv).rgb;
 vec3 nb=(texture2D(t,vUv+vec2(px.x,0.)).rgb+texture2D(t,vUv-vec2(px.x,0.)).rgb+texture2D(t,vUv+vec2(0.,px.y)).rgb+texture2D(t,vUv-vec2(0.,px.y)).rgb)*.25;
 c=max(c+(c-nb)*sharp,0.);
 vec3 b=texture2D(b0,vUv).rgb*.9+texture2D(b1,vUv).rgb*.75+texture2D(b2,vUv).rgb*.6+texture2D(b3,vUv).rgb*.5;
 c=(c+b*bloom)*expo*warm;float l=dot(c,vec3(.2126,.7152,.0722));c=max(mix(vec3(l),c,sat),0.);
 c=shoulder(c);vec2 d=vUv-.5;c*=1.-dot(d,d)*vig*1.8;c=mix(c,vec3(1.,.93,.8),flash);
 gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`);
 const pass=(m,target)=>{quad.material=m;renderer.setRenderTarget(target);renderer.render(qs,qc);};
 const size=new THREE.Vector2();
 function resize(){renderer.getDrawingBufferSize(size);main.setSize(size.x,size.y);let w=size.x>>1,h=size.y>>1;
  for(let i=0;i<LV;i++){bA[i].setSize(Math.max(1,w),Math.max(1,h));bB[i].setSize(Math.max(1,w),Math.max(1,h));w>>=1;h>>=1;}comp.uniforms.px.value.set(1/size.x,1/size.y);}
 resize();
 function render(){renderer.setRenderTarget(main);renderer.render(scene,camera);
  bright.uniforms.t.value=main.texture;pass(bright,bA[0]);
  for(let i=0;i<LV;i++){if(i>0){blur.uniforms.t.value=bA[i-1].texture;blur.uniforms.dir.value.set(0,0);pass(blur,bA[i]);}
   const w=bA[i].width,h=bA[i].height;blur.uniforms.t.value=bA[i].texture;blur.uniforms.dir.value.set(1/w,0);pass(blur,bB[i]);
   blur.uniforms.t.value=bB[i].texture;blur.uniforms.dir.value.set(0,1/h);pass(blur,bA[i]);}
  pass(comp,null);}
 return{render,resize,comp};})();
if(!POST){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(POST)POST.resize();});

/* ---------------- input ---------------- */
const KEY={};
const INPUT={step:0,left:false,right:false,shield:false,close:false,steerT:0,onStep:null,onKey:null};
const isStepKey=c=>c==='Space'||c==='Enter'||c==='KeyJ'||c==='KeyK';
addEventListener('keydown',e=>{if(e.repeat){if(isStepKey(e.code))e.preventDefault();return;}KEY[e.code]=true;
 if(isStepKey(e.code)){e.preventDefault();INPUT.onStep&&INPUT.onStep();}
 INPUT.onKey&&INPUT.onKey(e.code);});
addEventListener('keyup',e=>{KEY[e.code]=false;});
addEventListener('blur',()=>{for(const k in KEY)KEY[k]=false;});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button>0)return;INPUT.onStep&&INPUT.onStep();});
function holdBtn(el,prop){const on=e=>{e.preventDefault();e.stopPropagation();INPUT[prop]=true;el.classList.add('on');},off=e=>{INPUT[prop]=false;el.classList.remove('on');};
 el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('pointerleave',off);}
holdBtn($('tL'),'tl');holdBtn($('tR'),'tr');holdBtn($('tShield'),'tshield');holdBtn($('tClose'),'tclose');
function readInput(){
 INPUT.left=!!(KEY.KeyA||KEY.ArrowLeft||INPUT.tl);INPUT.right=!!(KEY.KeyD||KEY.ArrowRight||INPUT.tr);
 INPUT.shield=!!(KEY.KeyW||KEY.ArrowUp||KEY.ShiftLeft||KEY.ShiftRight||INPUT.tshield);INPUT.close=!!(KEY.KeyS||KEY.ArrowDown||INPUT.tclose);}
