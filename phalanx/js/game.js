'use strict';
/* Phalanx – game: deployment, the march and the run to the beat, arrow volleys, the clash (othismos + pincer),
   the race to the ships, results. Greeks face +z; file 0 is the left end of the line (+x). */
const F=28,SECF=[9,10,9],SX=.95,SZ=1.25,CF=(F-1)/2,TOTAL=192;
const PZ=W.PERSIAN_Z,CONTACT=PZ-1.4;
const secOf=f=>f<9?0:f<19?1:2;
const fileX0=f=>(CF-f)*SX;
const DIFF={story:{perfect:.1,good:.21,stumble:.5,arrows:.5,volley:4.4,center:.88,chaseDefault:'turn',shipBonus:8},
            hoplite:{perfect:.075,good:.15,stumble:1,arrows:1,volley:3.3,center:1,chaseDefault:'chase',shipBonus:0}};
const SPEED={march:2.7,run:6.3,beach:6};
const CREST=[[0x2f5fa8,0x1e1712,0xe9dcc0],[0x1e1712,0xa8321f,0xe9dcc0],[0xa8321f,0x1e1712,0xd8a456]].map(a=>a.map(c=>new THREE.Color(c)));
const BAND=[0xa8321f,0x24354f,0x1e1712,0x2f6a3a].map(c=>new THREE.Color(c));
const TUNIC=[0x6a3a8c,0xc9962a,0x2f5fa8,0xa8321f,0xe4d8b8,0x2f7a6a].map(c=>new THREE.Color(c));
const HEROCREST=new THREE.Color(2.2,2.0,1.7);
const GOLD=new THREE.Color(2.6,1.8,.7),WHITE=new THREE.Color(1,1,1),DIMRIM=new THREE.Color(.55,.5,.45),REDRIM=new THREE.Color(1.8,.42,.3);
// [file, rank] of the named friends
const HERO_SLOTS=[[13,0],[13,1],[14,0],[4,1],[11,0],[16,0],[22,0],[23,0],[26,0],[2,0]];

const G={state:'menu',diff:store.get('diff','hoplite'),c:4,men:[],per:[],spara:[],ax:0,az:0,v:0,drive:0,streak:0,gaitA:0,breath:1,F:F,
 beats:[],t:0,tAct:0,tTotal:0,sel:1,d:[0,0,0],won:[false,false,false],wing:[null,null,null],choice:null,shake:0,stats:null,checkpoint:null,
 volleyT:0,volleyPhase:0,tips:{},paused:false,heroLabels:[],ended:false,camMode:'menu',storyI:0,
 shipsTaken:0,shipsGone:0,cynDone:false,rearT:0,frontTarget:0,routT:0,pincerShown:false};
const D=()=>DIFF[G.diff];

/* ---------------- armies ---------------- */
function wingDepth(c){return Math.floor((TOTAL-10*c)/18);}
function newGreek(f,r,rng){const sec=secOf(f);return{side:0,f,r,sec,x:0,z:0,y:0,yaw:0,alive:true,wounded:false,fall:0,fallSide:rng()<.5?-1:1,
 phase:0,phOff:0,move:0,gait:0,crouch:0,push:0,look:0,spear:0,stab:0,shieldUp:0,trip:0,inPos:true,glow:0,
 linen:rng()<.45,band:BAND[(rng()*4)|0],open:rng()<.3,crest:CREST[sec][(rng()*3)|0],blz:(rng()*16)|0,rimCol:new THREE.Color(1,1,1),
 hero:-1,state:'line',vig:.85+rng()*.3,tx:0,tz:0,shM:null,stabT:0,dead:false,gone:false,lastX:0,lastZ:0};}
function buildGreeks(c){const rng=mulberry(1234+c);const w=wingDepth(c),men=[];let left=TOTAL-10*c-18*w;
 const depth=new Array(F).fill(0);for(let f=0;f<F;f++)depth[f]=secOf(f)===1?c:w;
 for(let i=0;left>0;i++,left--){const f=i%2?F-1-((i/2)|0):(i/2)|0;depth[f]++;}
 for(let f=0;f<F;f++)for(let r=0;r<depth[f];r++)men.push(newGreek(f,r,rng));
 HERO_SLOTS.forEach(([f,r],i)=>{const m=men.find(m=>m.f===f&&m.r===r);if(m){m.hero=i;m.crest=HEROCREST;m.open=true;}});
 return men;}
function buildPersians(){const rng=mulberry(77),per=[];
 for(let f=0;f<F;f++){const sec=secOf(f),depth=sec===1?6:4,arch=sec===1?3:2;
  for(let r=0;r<depth+2;r++)per.push(newPersian(f,r,sec,r>=arch,rng));}
 return per;}
function newPersian(f,r,sec,archer,rng){return{side:1,f,r,sec,x:fileX0(f)+rand(-.12,.12),z:PZ+r*1.25,y:0,yaw:PI,alive:true,fall:0,fallSide:rng()<.5?-1:1,phase:rng()*TAU,phOff:0,move:0,gait:0,
 crouch:r===0?.25:0,push:0,look:0,spear:archer?0:.15,stab:0,draw:0,archer,hat:rng()<.4,tunic:TUNIC[(rng()*6)|0],capCol:rng()<.5?TUNIC[(rng()*6)|0]:WHITE,trous:TUNIC[(rng()*6)|0],
 state:'line',flee:false,tx:0,tz:0,gone:false,stabT:rng(),lastX:0,lastZ:0,elite:sec===1};}
function placeGreeksAtStart(az){G.az=az;G.ax=0;for(const m of G.men){const p=slotOf(m);m.x=p.x+rand(-.08,.08);m.z=p.z+rand(-.08,.08);m.lastX=m.x;m.lastZ=m.z;}}
function slotOf(m){return{x:G.ax+(CF-m.f)*SX,z:G.az-m.r*SZ};}
function setupArmies(){G.men=buildGreeks(G.c);G.per=buildPersians();G.F=F;placeGreeksAtStart(0);
 G.spara=[];for(let f=0;f<F;f++)G.spara.push({x:fileX0(f),z:PZ-.55,yaw:PI,tilt:0,down:false});
 makeLabels();}

/* ---------------- labels for the named friends ---------------- */
function makeLabels(){const box=$('labels');box.innerHTML='';G.heroLabels=[];
 for(let i=0;i<HEROES.length;i++){const e=document.createElement('div');e.className='nm';e.textContent=heroName(i);box.appendChild(e);G.heroLabels.push(e);}}
const _p=new THREE.Vector3();
const placed=[];
function updateLabels(){const show=['march','run','clash','beach','end'].includes(G.state);placed.length=0;
 const bt=$('beat').classList.contains('hidden')?null:$('beat').getBoundingClientRect();
 const order=G.heroLabels.map((e,i)=>{const m=G.men.find(m=>m.hero===i);return{e,i,m,d:m?camera.position.distanceTo(_p.set(m.x,1,m.z)):1e9};}).sort((a,b)=>a.d-b.d);
 for(const{e,m,d}of order){
  if(!show||!m||m.gone||d>(G.state==='clash'?40:30)){e.style.display='none';continue;}_p.set(m.x,(m.y||0)+(m.fall>0?.6:2.2),m.z).project(camera);
  const x=(_p.x*.5+.5)*innerWidth,y=(-_p.y*.5+.5)*innerHeight;
  if(_p.z>1||x<0||x>innerWidth||y<40||y>innerHeight||(bt&&x>bt.left-60&&x<bt.right+60&&y>bt.top-6&&y<bt.bottom+24)||placed.some(([px,py])=>Math.abs(px-x)<90&&Math.abs(py-y)<20)){e.style.display='none';continue;}
  placed.push([x,y]);e.style.display='block';e.style.left=x+'px';e.style.top=y+'px';e.classList.toggle('dead',!m.alive);}}

/* ---------------- UI helpers ---------------- */
function show(id,on=true){$(id).classList.toggle('hidden',!on);}
function big(t,s){const e=$('big');e.innerHTML=t+(s?`<small>${s}</small>`:'');e.classList.remove('go');void e.offsetWidth;e.classList.add('go');}
function toast(t,cls=''){const box=$('toasts');const e=document.createElement('div');e.className='toast '+cls;e.innerHTML=t;box.appendChild(e);
 while(box.children.length>4)box.firstChild.remove();setTimeout(()=>{e.style.opacity=0;setTimeout(()=>e.remove(),500);},3200);}
function tip(key,dur=6){if(G.tips[key])return false;G.tips[key]=1;const e=$('tip');const k=T(key+(IS_TOUCH?'T':'K'));e.innerHTML=k.startsWith(key)?T(key):k;show('tip');
 clearTimeout(tip.h);tip.h=setTimeout(()=>show('tip',false),dur*1000);return true;}
function judge(txt,cls,sub){const e=$('judge');e.className=cls;e.innerHTML=txt+(sub?`<small>${sub}</small>`:'');void e.offsetWidth;e.classList.add('go');}
function setAct(n){$('actT').textContent=T('act'+n);$('objT').textContent=T('obj'+n);}

/* ---------------- the beat ---------------- */
// the time the player hears: audio clock minus output latency minus the player's own calibrated offset
G.calib=clamp(store.get('calib',0),-.25,.25);
const hearNow=()=>AUDIO.now()-AUDIO.latency-(AUDIO.virtual!=null?0:G.calib);
AUDIO.onBeat((t,k)=>{G.beats.push({t,k,hit:false,judged:false});if(G.beats.length>12)G.beats.shift();});
function lastBeatJudgeable(){return G.state==='march'||G.state==='run'||G.state==='clash'||G.state==='beach';}
INPUT.onStep=()=>{AUDIO.init();
 if(G.state==='calib'){calibTap();return;}
 if(G.paused||!lastBeatJudgeable()||G.ended)return;
 const tt=hearNow();let best=null,bd=1e9;
 // the nearest beat, including the next one not yet scheduled (a very early tap)
 const cand=G.beats.map(b=>b);if(AUDIO.B.on)cand.push({t:AUDIO.B.next,future:true});
 for(const b of cand){const d=Math.abs(tt-b.t);if(d<bd){bd=d;best=b;}}
 const len=AUDIO.B.len;const off=best?tt-best.t:0;
 const side=off<0?T('early'):T('late');
 if(best&&!best.future&&!best.hit&&bd<=D().good&&bd<len*.45){best.hit=true;best.judged=true;best.off=off;const q=bd<=D().perfect?1:.75;onGoodStep(q);
  judge(q===1?T('perfect'):T('good'),q===1?'jp':'jg',q===1?'':side);BEATUI.tap(off,q===1?'p':'g');}
 else{onBadStep();
  // a second tap on a beat already hit, or a tap far from any beat
  const again=best&&best.hit&&bd<=D().good;judge(T('miss'),'jm',again?'':side);BEATUI.tap(again?D().good*1.6*(off<0?-1:1):off,'m');}
};
function onGoodStep(q){G.streak++;G.stats.hits++;if(q===1)G.stats.perfect++;
 if(G.state==='clash'){G.pushMul=1+.22*q+Math.min(.1,G.streak*.01);for(const m of G.men)if(m.alive&&m.r<2&&m.state==='line')m.stabT=.32*Math.random()*.4;AUDIO.S.push(q);return;}
 G.drive=Math.max(G.drive,q===1?1:.88);
 const sync=cohesion();AUDIO.S.steps(sync,1,G.state!=='march');
 if(G.state!=='march')for(let i=0;i<4;i++){const m=G.men[(Math.random()*G.men.length)|0];if(m.alive&&m.move>.4)FX.dust(m.x,0,m.z,1,{a:.25});}}
function onBadStep(){G.stats.miss++;const wasMoving=G.drive>.35||G.state==='clash';G.streak=0;
 if(G.state==='clash'){G.pushMul=.85;let k=0;for(const m of G.men){if(m.alive&&m.state==='line'&&m.sec===G.sel&&m.r<3&&Math.random()<.15&&k<4){m.trip=.35;k++;}}return;}
 if(wasMoving)stumble(1);}
function stumble(mult){const base=(G.state==='march'?.05:.1)*D().stumble*mult;let n=0;
 for(const m of G.men){if(!m.alive||m.state!=='line')continue;let p=base*(m.wounded?2:1)*(2-m.vig)*(G.breath<.3?2.2:1);if(Math.random()<p){m.trip=rand(.5,.9);m.phOff=rand(1,TAU-1);n++;}}
 if(n){AUDIO.S.stumble();if(n>5&&!G.tips.tipClose)setTimeout(()=>tip('tipClose',7),900);}}
function judgeMissedBeats(){const now=hearNow();
 for(const b of G.beats){if(b.judged||b.t>now-D().good)continue;b.judged=true;
  if(!lastBeatJudgeable())continue;
  // breaking the rhythm while moving trips a few men; stopping on purpose does not
  if(G.state!=='clash'&&G.streak>0&&G.drive>.5){G.streak=0;stumble(.55);G.stats.miss++;}
  else if(G.state==='clash'){G.streak=0;}}}

/* ---------------- formation metrics ---------------- */
function cohesion(){let n=0,ok=0;for(const m of G.men){if(m.state!=='line'||m.r>1)continue;n++;if(m.alive&&m.inPos)ok++;}return n?ok/n:0;}
let FILEMAP=null;
function buildFileMap(){FILEMAP=new Map();for(const m of G.men)if(m.alive&&m.state==='line')FILEMAP.set(m.f*64+m.r,m);}
function rightNeighbour(m){return FILEMAP.get((m.f+1)*64+m.r);}
function protectedMan(m){const n=rightNeighbour(m);return m.inPos&&n&&n.inPos&&n.alive;}

/* ---------------- casualties ---------------- */
function killGreek(m,why){if(!m.alive)return;m.alive=false;m.fall=.001;m.state='fallen';G.stats.lost++;
 if(m.hero>=0)toast(T('fell',heroName(m.hero)),'fall');AUDIO.S.fall();
 // the men behind step forward and close the gap
 for(const o of G.men)if(o.alive&&o.state==='line'&&o.f===m.f&&o.r>m.r)o.r--;}
function woundGreek(m){if(m.wounded){killGreek(m);return;}m.wounded=true;m.trip=1;m.phOff=rand(1,5);if(m.hero>=0)toast(T('wounded',heroName(m.hero)),'fall');}
function killPersian(p){if(!p.alive)return;p.alive=false;p.fall=.001;p.state='fallen';G.stats.pkill++;
 if(p.state==='line')for(const o of G.per)if(o.alive&&o.state==='line'&&o.f===p.f&&o.r>p.r)o.r--;}
function killPersianLine(p){if(!p.alive)return;const wasLine=p.state==='line';p.alive=false;p.fall=.001;p.state='fallen';G.stats.pkill++;
 if(wasLine)for(const o of G.per)if(o.alive&&o.state==='line'&&o.f===p.f&&o.r>p.r)o.r--;}

/* ---------------- arrows landing ---------------- */
let VOL=null;
ARROWS.onLand=a=>{let best=null,bd=.62*.62;
 for(const m of G.men){if(!m.alive)continue;const dx=m.x-a.x,dz=m.z-a.z,d=dx*dx+dz*dz;if(d<bd){bd=d;best=m;}}
 if(!VOL||VOL.id!==a.vid)VOL={id:a.vid,sh:0,gr:0,hit:0};
 if(!best){VOL.gr++;return null;}
 const guarded=best.shieldUp>.6,prot=protectedMan(best);
 const p=(guarded?(prot?.012:.085):.12)*D().arrows;
 if(Math.random()<p){VOL.hit++;G.stats.arrowHits++;if(Math.random()<.5)woundGreek(best);else killGreek(best);return null;}
 if(guarded||Math.random()<.4){VOL.sh++;return{shield:best};}
 VOL.gr++;return null;};
let volleyId=0;
function startVolley(srcs,targetFn,fl=1.8,count=110){G.volleyPhase=1;G.volleyDraw=.95;G.volleySrc=srcs;G.volleyTarget=targetFn;G.volleyT2=fl;G.volleyCount=count;
 for(const p of srcs)p.drawing=true;G.incoming=true;AUDIO.S.draw();show('volley');$('volley').textContent=T('volley');
 if(!tip('tipShield',7)&&G.stats.volleys===3)tip('tipDodge',7);}
function looseVolley(){const srcs=G.volleySrc.filter(p=>p.alive);if(!srcs.length){G.volleyPhase=0;show('volley',false);return;}
 const tg=G.volleyTarget(G.volleyT2);volleyId++;ARROWS.volley(srcs.map(p=>({x:p.x,y:1.6+(p.y||0),z:p.z})),tg.x,tg.z,tg.hw,tg.hd,G.volleyT2,Math.round(G.volleyCount*(IS_TOUCH?.75:1)),volleyId);
 AUDIO.S.loose();G.stats.volleys++;const id=volleyId;
 setTimeout(()=>{show('volley',false);G.incoming=false;if(VOL&&VOL.id===id){AUDIO.S.land(VOL.sh,VOL.gr,VOL.hit);
  if(VOL.hit>=4)toast(T('breach'),'fall');else if(VOL.sh>=14&&VOL.hit<=1)toast(T('shieldsHold'),'good');}},G.volleyT2*1000+250);
 G.volleyPhase=0;for(const p of G.volleySrc)p.drawing=false;}
function formationTarget(fl){const depth=Math.max(...G.men.filter(m=>m.alive&&m.state==='line').map(m=>m.r),3)*SZ;
 // the archers lead the target: they aim where the line will be
 return{x:G.ax+rand(-2,2),z:G.az-depth*.45+G.v*fl*rand(.9,1.05),hw:13.5,hd:Math.max(5,depth*.6)};}

/* ---------------- game flow ---------------- */
function resetStats(){G.stats={hits:0,perfect:0,miss:0,lost:0,pkill:0,arrowHits:0,volleys:0,cohSum:0,cohN:0};}
function toMenu(){G.state='menu';G.ended=false;G.paused=false;AUDIO.setStyle('calm');hideHud();show('menu');show('end',false);show('pause',false);show('deploy',false);
 setupArmies();WORLD.shipsReset();ARROWS.clear();for(const p of G.per){p.state='line';}updateBest();}
function hideHud(){['hud','beat','touch','choice','tip','volley','bPause','secs','align'].forEach(i=>show(i,false));}
function updateBest(){const b=store.get('best',0);$('bestT').textContent=b?T('best','🌿'.repeat(b)):'';}
const STORY=[{h:'story1h',p:'story1',cam:[[60,26,320],[0,0,388]]},{h:'story2h',p:'story2',cam:[[28,9,-30],[0,1.5,-2]]},{h:'story3h',p:'story3',cam:[[5.5,1.9,7],[0,1.25,0]]},{h:'story4h',p:'story4',cam:[[0,70,-70],[0,0,170]]}];
function startStory(){AUDIO.init();show('menu',false);G.state='story';G.storyI=0;showStory();}
function showStory(){const s=STORY[G.storyI];$('storyN').textContent=(G.storyI+1)+' / '+STORY.length;$('storyH').textContent=T(s.h);$('storyP').textContent=T(s.p);show('story');AUDIO.S.ui();}
function nextStory(){G.storyI++;if(G.storyI>=STORY.length){show('story',false);startDeploy();}else showStory();}
function startDeploy(){G.state='deploy';show('story',false);show('deploy');updateDeploy();AUDIO.setStyle('calm');}
function updateDeploy(){const c=G.c,w=wingDepth(c);$('dC').textContent=c;$('dL').textContent=w;$('dR').textContent=w;
 document.querySelectorAll('.pre').forEach(b=>b.classList.toggle('on',+b.dataset.c===c));
 $('depNote').textContent=T(c<=3?'note3':c<=5?'note4':c<=8?'note6':'note9');setupArmies();}
function startBattle(){show('deploy',false);store.set('lastC',G.c);resetStats();G.tTotal=0;G.ended=false;G.won=[false,false,false];G.wing=[null,null,null];G.d=[0,0,0];
 G.shipsTaken=0;G.shipsGone=0;G.cynDone=false;G.breath=1;G.streak=0;G.drive=0;G.v=0;G.gaitA=0;G.tips={};G.pincerShown=false;
 setupArmies();WORLD.shipsReset();ARROWS.clear();G.checkpoint=null;
 show('hud');show('beat');show('bPause');show('align');if(IS_TOUCH)show('touch');show('breathM');
 $('tShield').textContent=T('gShield');$('tClose').textContent=T('gHold');
 G.state='march';G.tAct=0;setAct(1);AUDIO.setStyle('march',84);$('beatTxt').textContent=T('gMarch');
 big(T('act1'));setTimeout(()=>tip('tipBeat',8),1400);G.camMode='line';}
function startRun(){G.state='run';G.tAct=0;setAct(2);AUDIO.setStyle('run',124);$('beatTxt').textContent=T('gRun');big(T('runCall'),T('runSub'));AUDIO.S.warcry();tip('tipRun',6);G.volleyT=2.5;}
function startClash(){G.state='clash';G.tAct=0;setAct(3);AUDIO.setStyle('clash',100);$('beatTxt').textContent=T('gPush');big(T('clashCall'),T('clashSub'));AUDIO.S.clash();AUDIO.S.warcry();
 G.shake=1;G.v=0;G.sel=1;G.pushMul=1;G.d=[0,0,0];G.wingReady=[false,false,false];G.tClash0=G.tTotal;G.routT=0;G.centerWarn=0;show('align',false);show('secs');show('breathM',false);G.volleyPhase=0;show('volley',false);
 for(const p of G.per)p.drawing=false;
 for(let f=0;f<F;f++){const sp=G.spara[f];FX.splinters(sp.x,1,sp.z,4);if(f%2)FX.sparks(sp.x,1.3,sp.z-.4,6);}
 for(const m of G.men){if(m.state==='line')m.spear=1;}
 // checkpoint for "retry the clash"
 G.checkpoint={men:G.men.map(m=>({...m,shM:null,rimCol:m.rimCol.clone()})),per:G.per.map(p=>({...p})),spara:G.spara.map(s=>({...s})),ax:G.ax,az:G.az,stats:{...G.stats},tTotal:G.tTotal,breath:G.breath};
 document.querySelectorAll('.sec').forEach((e,i)=>{e.querySelector('.sn').textContent=T(['secLs','secCs','secRs'][i]);e.className='sec';});
 setTimeout(()=>{if(G.state==='clash'){tip('tipClash',9);setTimeout(()=>{if(G.state==='clash')toast(T('tipCenter'));},5000);}},1800);}
function retryClash(){const c=G.checkpoint;if(!c)return;show('end',false);G.men=c.men.map(m=>({...m,rimCol:m.rimCol.clone()}));G.per=c.per.map(p=>({...p}));G.spara=c.spara.map(s=>({...s}));
 G.ax=c.ax;G.az=c.az;G.stats={...c.stats};G.tTotal=c.tTotal;G.breath=c.breath;G.ended=false;G.won=[false,false,false];G.wing=[null,null,null];G.choice=null;show('choice',false);
 G.shipsTaken=0;G.shipsGone=0;G.cynDone=false;WORLD.shipsReset();ARROWS.clear();makeLabels();
 show('hud');show('beat');show('bPause');if(IS_TOUCH)show('touch');G.tips.tipClash=0;startClash();}

/* ---------------- per-frame: march & run ---------------- */
function updateLineMove(dt){
 const run=G.state!=='march';const gs=G.state==='beach'?SPEED.beach:run?SPEED.run:SPEED.march;
 G.drive=Math.max(0,G.drive-dt/(AUDIO.B.len*3));
 const shield=INPUT.shield&&G.state!=='march',close=INPUT.close;
 let target=gs*smooth(clamp(G.drive*1.15,0,1))*(shield?.55:1)*(close?.42:1)*(G.streak>=6?1.1:1)*(G.breath<.15?.8:1);
 G.v=damp(G.v,target,3.5,dt);
 G.gaitA=damp(G.gaitA,run?1:0,1.5,dt);
 G.az+=G.v*dt;
 // drift to the right (each man seeks his neighbour's shield) — worse with shields raised
 const drift=G.v>.6?(shield?.55:.14)*(G.state==='beach'?.5:1):0;
 G.ax-=drift*dt;const side=G.state==='beach'?4.4:2.6;if(INPUT.left)G.ax+=side*dt;if(INPUT.right)G.ax-=side*dt;G.ax=clamp(G.ax,-40,40);
 if(G.state==='beach'){G.ax=clamp(G.ax,-62,62);G.az=Math.min(G.az,W.SHIP_STERN-2.2);}
 // breath
 if(run&&G.v>3)G.breath=Math.max(0,G.breath-dt/(shield?70:48));else G.breath=Math.min(1,G.breath+dt/(close?9:16));
 $('brB').style.width=(G.breath*100)+'%';
 // men follow their slots
 buildFileMap();
 for(const m of G.men){if(!m.alive||m.state!=='line')continue;
  const s=slotOf(m);m.trip=Math.max(0,m.trip-dt);
  let maxV=G.v*1.06+(close?2.3:.45);if(m.trip>0)maxV=G.v*.3;if(m.wounded)maxV*=.9;if(G.breath<.3)maxV*=.92;
  let vx=(s.x-m.x)*2.4,vz=(s.z-m.z)*2.4+G.v;const L=Math.hypot(vx,vz);if(L>maxV){vx*=maxV/L;vz*=maxV/L;}
  m.x+=vx*dt;m.z+=vz*dt;const d=Math.hypot(s.x-m.x,s.z-m.z);m.inPos=d<.7&&m.trip<=0;
  m.shieldUp=damp(m.shieldUp,shield?1:0,8,dt);
  m.spear=damp(m.spear,(G.state==='run'&&G.az>PZ-45)||G.state==='beach'?1:0,3,dt);
  m.phOff=m.inPos?damp(m.phOff,0,1.5,dt):m.phOff;
 }
 const coh=cohesion();G.stats.cohSum+=coh*dt;G.stats.cohN+=dt;$('cohB').style.width=(coh*100)+'%';
 let lag=0;for(const m of G.men)if(m.alive&&m.state==='line'&&slotOf(m).z-m.z>4)lag++;
 if(lag>8&&!G.lagToast){toast(T('stragglers'));G.lagToast=1;setTimeout(()=>G.lagToast=0,8000);tip('tipClose',7);}
 // alignment bar
 const off=G.ax/(F*SX);$('alignG').style.left=(30-off*40)+'%';
}
function updateMarch(dt){updateLineMove(dt);
 if(G.tAct>9&&G.stats.hits>5)tip('tipStop',6);if(G.tAct>17)tip('tipSteer',8);
 if(G.az>=60)startRun();}
function updateRun(dt){updateLineMove(dt);
 // volleys
 const dist=PZ-G.az;
 if(dist<200&&dist>14){G.volleyT-=dt;if(G.volleyPhase===0&&G.volleyT<=0){G.volleyT=D().volley*rand(.85,1.15);
   const srcs=G.per.filter(p=>p.alive&&p.archer&&p.state==='line');startVolley(srcs,formationTarget,1.8,G.diff==='story'?80:110);}}
 if(G.volleyPhase===1){G.volleyDraw-=dt;if(G.volleyDraw<=0)looseVolley();}
 if(G.az>=CONTACT-.2)startClash();}

/* ---------------- per-frame: the clash ---------------- */
const RW=[1,.9,.7,.55,.4,.35,.3,.25,.25,.25,.22,.2,.2,.2];
function dOf(f){const s=secOf(f),d=G.d;let v=d[s];
 if(f===8||f===9)v=lerp(d[0],d[1],f===8?.33:.67);if(f===18||f===19)v=lerp(d[1],d[2],f===18?.33:.67);return v;}
function clashSlot(m){const sec=m.sec;
 if(G.wing[sec]==='turn'&&sec!==1){const zf=CONTACT+G.d[1]+1.25,left=sec===0;
  const edge=left?fileX0(9)+.95:fileX0(18)-.95;const i=left?8-m.f:m.f-19;
  return{x:edge+(left?1:-1)*(m.r*SZ),z:zf-.6+i*SX,yaw:left?-PI/2:PI/2};}
 return{x:G.ax+(CF-m.f)*SX,z:CONTACT+dOf(m.f)-m.r*SZ,yaw:0};}
function perSlot(p){const zf=CONTACT+dOf(p.f)+1.25;return{x:fileX0(p.f),z:zf+p.r*1.25};}
function sectionStrength(){const Gs=[0,0,0],Ps=[0,0,0],Pn=[0,0,0];
 for(const m of G.men){if(!m.alive||m.state!=='line')continue;if(G.wing[m.sec]&&m.sec!==1)continue;Gs[m.sec]+=(RW[m.r]||.2)*(m.inPos?1:.55);}
 for(const p of G.per){if(!p.alive||p.state!=='line')continue;Ps[p.sec]+=(RW[p.r]||.2)*(p.archer?.5:1);Pn[p.sec]++;}
 const off=Math.abs(G.ax)>3?1:0;
 for(let s=0;s<3;s++){Gs[s]*=(G.sel===s?1.25:1)*G.pushMul;Ps[s]*=s===1?1.35*D().center:1;}
 // a Greek line shifted sideways is outflanked on one wing
 if(off){Ps[G.ax>0?2:0]*=1.25;}
 let flank=0;for(const s of[0,2])if(G.wing[s]==='turn'&&G.wingReady[s])flank++;
 Ps[1]*=Math.pow(.62,flank);
 return{Gs,Ps,Pn,flank};}
function updateClash(dt){
 buildFileMap();G.pushMul=damp(G.pushMul,1,1.2,dt);
 if(INPUT.leftTap){G.sel=Math.max(0,G.sel-1);INPUT.leftTap=0;}if(INPUT.rightTap){G.sel=Math.min(2,G.sel+1);INPUT.rightTap=0;}
 const S=sectionStrength();G.wingReady=G.wingReady||[false,false,false];
 for(let s=0;s<3;s++){if(G.won[s]&&s!==1)continue;const g=S.Gs[s],p=S.Ps[s];if(p<=.01)continue;
  const bal=(g-p)/(g+p);G.d[s]=clamp(G.d[s]+1.4*bal*dt,-16,8);
  // casualties on both sides
  const rg=.5*(p/(g+p))*dt*(s===1?1:.8),rp=(1.25*(g/(g+p))+(s===1?.55*S.flank:0))*dt;
  if(Math.random()<rg){const c=G.men.filter(m=>m.alive&&m.state==='line'&&m.sec===s&&!(G.wing[s]&&s!==1)&&m.r===0);if(c.length)killGreek(c[(Math.random()*c.length)|0]);}
  if(Math.random()<rp){const c=G.per.filter(q=>q.alive&&q.state==='line'&&q.sec===s&&q.r===0);if(c.length){const q=c[(Math.random()*c.length)|0];killPersianLine(q);FX.sparks(q.x,1.3,q.z-.5,5);}}
  // knock down the wicker wall where the Greeks push through
  for(let f=0;f<F;f++)if(secOf(f)===s&&!G.spara[f].down&&(G.d[s]>1.2||Math.random()<dt*.05)){G.spara[f].down=true;FX.splinters(G.spara[f].x,.8,G.spara[f].z,6);}
 }
 // wings that win
 for(const s of[0,2]){if(G.won[s])continue;const alive=G.per.filter(p=>p.alive&&p.state==='line'&&p.sec===s).length,tot=s===1?80:54;
  if(alive<tot*.42||G.d[s]>7){G.won[s]=true;routSection(s);AUDIO.S.cheer();openChoice(s);}}
 // the pincer
 for(const s of[0,2])if(G.wing[s]==='turn'&&!G.wingReady[s]){const ms=G.men.filter(m=>m.alive&&m.state==='line'&&m.sec===s);const ok=ms.filter(m=>m.inPos).length;if(ok>ms.length*.6){G.wingReady[s]=true;AUDIO.S.warcry();}}
 if(S.flank>0&&!G.pincerShown){G.pincerShown=true;big(T('pincer'));}
 // center: rout or break
 const cAlive=G.per.filter(p=>p.alive&&p.state==='line'&&p.sec===1).length;
 if(cAlive<80*.4||(S.flank===2&&(G.routT+=dt)>5)||G.d[1]>6){generalRout();return;}
 if(G.d[1]<-7&&!G.centerWarn){G.centerWarn=1;toast(T('centerBend'),'fall');setTimeout(()=>G.centerWarn=0,7000);}
 const gAlive=G.men.filter(m=>m.alive).length;
 if(G.d[1]<=-12||gAlive<TOTAL*.25){defeat(gAlive<TOTAL*.25?'defSub2':'defSub');return;}
 // men take their clash slots
 for(const m of G.men){if(!m.alive)continue;m.trip=Math.max(0,m.trip-dt);
  if(m.state==='line'){const s=clashSlot(m);const sp=m.trip>0?.6:(G.wing[m.sec]==='turn'?4:2.2);moveTo(m,s.x,s.z,sp,dt);m.yaw=damp(m.yaw,s.yaw,4,dt);m.inPos=Math.hypot(s.x-m.x,s.z-m.z)<.8;
   m.spear=1;m.shieldUp=damp(m.shieldUp,0,6,dt);m.push=damp(m.push,m.r<3&&m.inPos?.6+.4*(G.pushMul-1):0,6,dt);m.stabT-=dt;
   const fighting=m.r===0&&(m.sec===1||!G.wing[m.sec]||G.wingReady[m.sec]);m.stab=fighting&&m.stabT>-.25&&m.stabT<0?Math.sin(-m.stabT/.25*PI):0;
   if(fighting&&m.stabT<-1.4-Math.random()*2)m.stabT=Math.random()*.2;}
  else if(m.state==='chase')chaseMove(m,dt);}
 for(const p of G.per){if(!p.alive)continue;
  if(p.state==='line'){const s=perSlot(p);let tx=s.x,yaw=PI;
   if(p.sec===1&&G.wing[0]==='turn'&&G.wingReady[0]&&p.f<=10)yaw=PI/2;if(p.sec===1&&G.wing[2]==='turn'&&G.wingReady[2]&&p.f>=17)yaw=-PI/2;
   moveTo(p,tx,s.z,2.4,dt);p.yaw=damp(p.yaw,yaw,4,dt);p.push=p.r<3?.5:0;p.spear=p.archer?0:1;p.stabT-=dt;p.stab=p.r===0&&p.stabT<0&&p.stabT>-.3?Math.sin(-p.stabT/.3*PI):0;if(p.stabT<-1.5-Math.random()*2)p.stabT=Math.random()*.3;}
  else fleeMove(p,dt);}
 // combat sounds and sparks
 G.fightAcc=(G.fightAcc||0)+dt*9;while(G.fightAcc>1){G.fightAcc--;AUDIO.S.fight(.7);if(Math.random()<.35){const f=(Math.random()*F)|0;FX.sparks(fileX0(f)+G.ax*.0,1.4,CONTACT+dOf(f)+.6,4);}}
 if(Math.random()<dt*3){const f=(Math.random()*F)|0;FX.dust(fileX0(f),0,CONTACT+dOf(f)+.5,2,{a:.2});}
 // HUD
 document.querySelectorAll('.sec').forEach((e,i)=>{const b=S.Gs[i]/(S.Gs[i]+S.Ps[i]+1e-3);e.querySelector('i').style.left=(G.won[i]&&i!==1?100:clamp(50+G.d[i]*3.2,3,97))+'%';
  e.classList.toggle('on',G.sel===i);e.classList.toggle('won',G.won[i]&&i!==1);e.classList.toggle('bad',i===1&&G.d[1]<-6);});
 const coh=cohesion();$('cohB').style.width=(coh*100)+'%';G.stats.cohSum+=coh*dt;G.stats.cohN+=dt;
 // choice timer
 if(G.choice){G.choice.t-=dt;$('choiceBar').firstChild.style.width=(G.choice.t/G.choice.T*100)+'%';if(G.choice.t<=0)decide(D().chaseDefault);}
}
function moveTo(o,x,z,sp,dt){const dx=x-o.x,dz=z-o.z,L=Math.hypot(dx,dz);if(L<1e-3)return;const k=Math.min(L,Math.min(sp,L*3)*dt);o.x+=dx/L*k;o.z+=dz/L*k;}
function routSection(s){for(const p of G.per)if(p.alive&&p.state==='line'&&p.sec===s){p.state='flee';p.flee=true;p.fleeD=rand(.2,1.2);p.tx=rand(-56,56);}
 for(let f=0;f<F;f++)if(secOf(f)===s)G.spara[f].down=true;}
function generalRout(){for(const p of G.per)if(p.alive&&p.state==='line'){p.state='flee';p.flee=true;p.fleeD=rand(0,.8);p.tx=rand(-56,56);}
 AUDIO.S.cheer();big(T('rout'),T('routSub'));AUDIO.S.horn();G.choice=null;show('choice',false);setTimeout(startBeach,2600);G.state='routing';G.tAct=0;}
function fleeMove(p,dt){if(p.state!=='flee')return;p.fleeD-=dt;if(p.fleeD>0){p.yaw=damp(p.yaw,0,6,dt);return;}
 const sh=WORLD.ships.filter(s=>s.state==='beached'||s.state==='launch');let tx=p.tx,tz=W.SHIP_STERN+2;
 if(!p.ship||p.ship.state==='gone'||p.ship.captured){p.ship=sh.length?sh[(Math.abs(p.f*7+p.r*3))%sh.length]:null;}
 if(p.ship){tx=p.ship.g.position.x+((p.f%5)-2)*.6;tz=p.ship.g.position.z+1;}
 const dx=tx-p.x,dz=tz-p.z,L=Math.hypot(dx,dz);const sp=5.2;p.yaw=damp(p.yaw,Math.atan2(dx,dz),5,dt);
 if(L>1.2){p.x+=dx/L*sp*dt;p.z+=dz/L*sp*dt;}else{p.gone=true;p.alive=false;p.state='gone';}}
function chaseMove(m,dt){const tx=m.tx,tz=W.SHIP_STERN-6-m.r*.8;const dx=tx-m.x,dz=tz-m.z,L=Math.hypot(dx,dz);m.yaw=damp(m.yaw,Math.atan2(dx,dz),4,dt);
 if(L>.4){const sp=5.6;m.x+=dx/L*Math.min(sp,L*2)*dt;m.z+=dz/L*Math.min(sp,L*2)*dt;}m.spear=1;m.push=0;}
function openChoice(s){G.choice={s,t:D().chaseDefault==='turn'?10:8,T:D().chaseDefault==='turn'?10:8};
 $('choiceT').textContent=T('wingWon',T(s===0?'wingL':'wingR'));$('chChase').innerHTML=T('chase');$('chTurn').innerHTML=T('turn');show('choice');}
function decide(k){if(!G.choice)return;const s=G.choice.s;G.choice=null;show('choice',false);G.wing[s]=k;AUDIO.S.ui();
 const wn=T(s===0?'wingL':'wingR');
 if(k==='turn'){toast(T('turned',wn),'good');}
 else{toast(T('chased',wn));for(const m of G.men)if(m.alive&&m.state==='line'&&m.sec===s){m.state='chase';m.tx=rand(-50,50);}}
 if(G.sel===s)G.sel=1;}

/* ---------------- per-frame: the ships ---------------- */
function startBeach(){G.state='beach';G.tAct=0;setAct(4);AUDIO.setStyle('beach',124);$('beatTxt').textContent=T('gRun');show('secs',false);show('align',false);show('breathM');
 // re-form the line with every man still in the battle line
 const ms=G.men.filter(m=>m.alive&&(m.state==='line'));const n=ms.length;const nf=clamp(Math.round(Math.sqrt(n*2.4)),8,26);G.F=nf;
 const cx=ms.reduce((a,m)=>a+m.x,0)/Math.max(1,n),fz=Math.max(...ms.map(m=>m.z));
 ms.sort((a,b)=>b.x-a.x);const depth=Math.ceil(n/nf);
 for(let f=0;f<nf;f++){const grp=ms.slice(f*depth,(f+1)*depth).sort((a,b)=>b.z-a.z);grp.forEach((m,r)=>{m.f=f;m.r=r;m.yaw=0;m.sec=1;});}
 G.ax=cx;G.az=fz;G.v=0;G.drive=0;G.breath=Math.max(G.breath,.6);
 // the ships started loading when the clash began: a slow battle means fewer ships to catch
 const order=[42,50,58,66,75,85,97].sort(()=>Math.random()-.5);WORLD.ships.forEach((s,i)=>{s.launchAt=order[i]+D().shipBonus;s.counted=false;});
 // men who chased are already on the beach: they seize a ship at once
 const chasers=G.men.filter(m=>m.alive&&m.state==='chase');
 if(chasers.length>6){const s=WORLD.ships.reduce((a,b)=>Math.abs(b.x-chasers[0].x)<Math.abs(a.x-chasers[0].x)?b:a);captureShip(s,chasers.slice(0,6),true);}
 G.rearT=6;G.volleyT=5;tip('tipShips',7);
 FILEMAP=null;}
function slotOfBeach(m){return{x:G.ax+((G.F-1)/2-m.f)*SX,z:G.az-m.r*SZ};}
function captureShip(s,boarders,silent){s.captured=true;s.state='captured';G.shipsTaken++;AUDIO.S.cheer();AUDIO.S.fanfare();
 if(!G.cynDone){G.cynDone=true;const cy=G.men.find(m=>m.hero===7&&m.alive);toast(cy?T('cyn'):T('shipTaken'),'good');}else toast(T('shipTaken'),'good');
 boarders.forEach((m,i)=>{m.state='board';m.ship=s;m.bi=i;});
 for(let i=0;i<10;i++)FX.glint(s.g.position.x+rand(-2,2),2.5+rand(0,2),s.g.position.z+rand(0,10),.6);}
function updateBeach(dt){
 // the line (reuse the run logic with a different slot function)
 const saveSlot=slotOf;slotOf=slotOfBeach;updateLineMove(dt);slotOf=saveSlot;
 // ships put to sea
 for(const s of WORLD.ships){if(s.state==='beached'&&G.tTotal-G.tClash0>s.launchAt){s.state='launch';s.t=0;AUDIO.S.ship();}
  if(s.state==='launch'&&s.g.position.z>s.z0+18&&!s.counted){s.counted=true;G.shipsGone++;toast(T('shipGone'));}
  if((s.state==='beached'||(s.state==='launch'&&s.g.position.z<s.z0+5))&&!s.captured){const dx=s.g.position.x-G.ax,dz=s.g.position.z-G.az;
   if(Math.abs(dx)<7&&dz<6.5){const front=G.men.filter(m=>m.alive&&m.state==='line'&&m.r===0).sort((a,b)=>Math.abs(a.x-s.g.position.x)-Math.abs(b.x-s.g.position.x)).slice(0,6);
    if(s.state==='launch'){s.state='captured';s.g.position.z=s.z0+Math.min(4,s.g.position.z-s.z0);}captureShip(s,front);}}}
 // boarders climb on deck
 for(const m of G.men){if(!m.alive)continue;if(m.state==='board'){const s=m.ship,tx=s.g.position.x+((m.bi%2)?.6:-.6),tz=s.g.position.z+2+m.bi*1.6;moveTo(m,tx,tz,4,dt);
   const onDeck=m.z>s.g.position.z+.5;m.y=damp(m.y||0,onDeck?s.deckY-.2:0,5,dt);m.yaw=damp(m.yaw,0,4,dt);m.inPos=true;m.spear=damp(m.spear,0,3,dt);}
  else if(m.state==='chase')chaseMove(m,dt);}
 // the rest of the Persians run to the ships; some turn and fight
 G.rearT-=dt;if(G.rearT<=0&&G.tAct<55){G.rearT=rand(6,9);const pool=G.per.filter(p=>p.alive&&p.state==='flee'&&p.fleeD<=0);
  if(pool.length>=4){pool.sort((a,b)=>Math.abs(a.x-G.ax)-Math.abs(b.x-G.ax));const n=Math.min(pool.length,6+((Math.random()*4)|0));
   for(let i=0;i<n;i++){const p=pool[i];p.state='rear';p.flee=false;p.archer=false;p.rearT=0;}toast(T('rear'));AUDIO.S.horn();}}
 for(const p of G.per){if(!p.alive)continue;if(p.state==='flee')fleeMove(p,dt);else if(p.state==='rear')rearMove(p,dt);}
 // volleys from the ships still on the beach
 const live=WORLD.ships.filter(s=>s.state==='beached');
 if(live.length){G.volleyT-=dt;if(G.volleyPhase===0&&G.volleyT<=0){G.volleyT=D().volley*1.7*rand(.85,1.15);
  const srcs=[];for(const s of live)for(let i=0;i<6;i++)srcs.push({x:s.g.position.x+rand(-1,1),y:1.6,z:s.g.position.z+4+i*2,alive:true});startVolley(srcs,formationTarget,1.6,G.diff==='story'?40:60);}}
 if(G.volleyPhase===1){G.volleyDraw-=dt;if(G.volleyDraw<=0)looseVolley();}
 const left=WORLD.ships.filter(s=>s.state==='beached'||(s.state==='launch'&&!s.counted)).length;
 $('objT').textContent=T('obj4')+`  ⛵ ${G.shipsTaken}/7`;
 if(left===0&&G.tAct>3&&G.state==='beach'){G.state='ending';setTimeout(()=>victory(),1500);}
 if(G.men.filter(m=>m.alive).length<TOTAL*.2)defeat('defSub2');}
function rearMove(p,dt){let best=null,bd=1e9;for(const m of G.men){if(!m.alive||m.state!=='line')continue;const d=(m.x-p.x)**2+(m.z-p.z)**2;if(d<bd){bd=d;best=m;}}
 if(!best){p.state='flee';return;}const dx=best.x-p.x,dz=best.z-p.z,L=Math.sqrt(bd);p.yaw=damp(p.yaw,Math.atan2(dx,dz),6,dt);p.spear=1;p.gait=1;
 if(L>1.05){const sp=4.8;p.x+=dx/L*sp*dt;p.z+=dz/L*sp*dt;p.rearT=0;}
 else{p.rearT+=dt;p.stab=Math.sin(p.rearT*6)*.5+.5;best.stabT=-.1;
  if(p.rearT>.55){p.rearT=0;const wall=protectedMan(best)||(best.inPos&&best.shieldUp<.5);
   if(wall||Math.random()<.5){killPersianLine(p);FX.sparks(p.x,1.3,p.z,6);if(wall&&Math.random()<.3)toast(T('repelled'),'good');}
   else{killGreek(best);FX.sparks(best.x,1.3,best.z,6);if(Math.random()<.3)toast(T('breached'),'fall');}}}}

/* ---------------- end ---------------- */
function finish(win,subKey){G.ended=true;G.state='end';G.choice=null;show('choice',false);AUDIO.setStyle('calm');hideHud();show('touch',false);
 const home=G.men.filter(m=>m.alive).length,coh=G.stats.cohN?G.stats.cohSum/G.stats.cohN:0;
 $('endH').textContent=win?T('victory'):T('defeat');$('endSub').textContent=win?T('vicSub'):T(subKey);
 const score=(home/TOTAL)*2+(G.shipsTaken/7)*1.4+coh*1.6;const laurels=win?(score>3.6?3:score>2.6?2:1):0;
 $('laurel').textContent=win?'🌿'.repeat(laurels):'';if(win&&laurels>store.get('best',0))store.set('best',laurels);
 const mm=Math.floor(G.tTotal/60),ss=String(Math.floor(G.tTotal%60)).padStart(2,'0');
 $('endRows').innerHTML=`<div><b>${home}/${TOTAL}</b>${T('rHome')}</div><div><b>${G.shipsTaken}/7</b>${T('rShips')}</div><div><b>${Math.round(coh*100)}%</b>${T('rCoh')}</div><div><b>${mm}:${ss}</b>${T('rTime')}</div>`;
 const fallen=G.men.filter(m=>m.hero>=0&&!m.alive).map(m=>heroName(m.hero));
 $('fallen').textContent=fallen.length?T('fallenH')+fallen.join(', ')+'.':T('noneFallen');
 $('endHist').textContent=T('hist');show('bRetryClash',!!G.checkpoint&&!win);
 setTimeout(()=>show('end'),win?1800:2200);
 if(win){AUDIO.S.victory();const r=G.men.find(m=>m.alive&&m.state==='line'&&m.hero<0&&m.r>1);if(r){r.state='runner';r.noSpear=true;}}else AUDIO.S.defeat();
 updateBest();}
function victory(){if(G.ended)return;finish(true);}
function defeat(k){if(G.ended)return;
 // the broken center runs away
 for(const m of G.men)if(m.alive&&m.state==='line'){m.state='rout';m.flee=true;}
 finish(false,k);}

/* ---------------- animation of every soldier ---------------- */
const stepPhase=()=>PI*((hearNow()-AUDIO.B.next)/AUDIO.B.len+AUDIO.B.count);
function animate(dt){
 const sp=stepPhase();
 for(const m of G.men){
  const vx=(m.x-m.lastX)/Math.max(dt,1e-3),vz=(m.z-m.lastZ)/Math.max(dt,1e-3);m.lastX=m.x;m.lastZ=m.z;const spd=Math.hypot(vx,vz);
  if(m.state==='runner'){m.z-=6.5*dt;m.x=damp(m.x,G.ax,1,dt);m.yaw=damp(m.yaw,PI,4,dt);m.shieldUp=0;m.spear=0;if(m.z<G.az-160)m.gone=true;}
  if(m.state==='rout'&&m.alive){m.z-=4.5*dt;m.yaw=damp(m.yaw,PI,5,dt);m.shieldUp=0;m.spear=0;}
  if(m.fall>0&&m.fall<1)m.fall=Math.min(1,m.fall+dt*1.6);
  const run=m.state==='line'?G.gaitA:1;m.gait=damp(m.gait,spd>3.2?1:run*clamp(spd/3,0,1),4,dt);
  m.move=damp(m.move,clamp(spd/(m.gait>.5?5.5:2.4),0,1),8,dt);
  if(m.state==='line'&&m.inPos&&G.state!=='clash')m.phase=sp+m.phOff;else m.phase+=dt*spd*(m.gait>.5?1.25:2.1);
  m.crouch=damp(m.crouch,G.state==='clash'&&m.state==='line'?.15:0,4,dt);
  if(G.state!=='clash')m.push=damp(m.push,0,4,dt);
  if(m.state!=='line'||G.state!=='clash')m.stab=m.state==='line'&&G.state==='beach'&&m.stabT>-.25&&m.stabT<0?Math.sin(-m.stabT/.25*PI):0;
  if(m.stabT!==undefined&&G.state==='beach')m.stabT-=dt;
  // the shield rim: gold when protected by the neighbour, red when the man is out of his place
  if(m.alive&&m.state==='line'&&['march','run','clash','beach'].includes(G.state)){const pr=FILEMAP?protectedMan(m):m.inPos;m.glow=damp(m.glow,pr?1:0,6,dt);
   m.rimCol.copy(DIMRIM).lerp(GOLD,m.glow);if(!m.inPos)m.rimCol.copy(REDRIM);}
  else m.rimCol.copy(DIMRIM);
 }
 for(const p of G.per){const vx=(p.x-p.lastX)/Math.max(dt,1e-3),vz=(p.z-p.lastZ)/Math.max(dt,1e-3);p.lastX=p.x;p.lastZ=p.z;const spd=Math.hypot(vx,vz);
  if(p.fall>0&&p.fall<1)p.fall=Math.min(1,p.fall+dt*1.6);
  p.gait=damp(p.gait,spd>3?1:0,4,dt);p.move=damp(p.move,clamp(spd/(p.gait>.5?5:2.2),0,1),8,dt);p.phase+=dt*Math.max(spd,.0)*(p.gait>.5?1.25:2.1);
  p.draw=damp(p.draw,p.drawing?1:0,p.drawing?3:12,dt);p.crouch=damp(p.crouch,p.state==='line'&&p.r===0&&G.state!=='clash'?.25:0,4,dt);
  if(p.state==='flee'||p.state==='gone'){p.push=0;p.stab=0;p.crouch=0;}}
}
// red rings on the ground where a man is missing from the front ranks
const gapIM=(()=>{const g=new THREE.RingGeometry(.2,.34,20).rotateX(-PI/2);const m=new THREE.MeshBasicMaterial({color:0xff4a2a,transparent:true,opacity:.8,depthWrite:false});
 const im=new THREE.InstancedMesh(g,m,160);im.frustumCulled=false;im.count=0;im.renderOrder=3;scene.add(im);return im;})();
const _gm=new THREE.Matrix4();
function curSlot(m){return G.state==='clash'?clashSlot(m):G.state==='beach'?slotOfBeach(m):slotOf(m);}
function drawGaps(){let n=0;if(['march','run','clash','beach'].includes(G.state)&&!G.ended){
 for(const m of G.men){if(!m.alive||m.state!=='line'||m.r>1||m.inPos)continue;const s=curSlot(m);const k=1+.15*Math.sin(tAll*8+m.f);_gm.makeScale(k,1,k);_gm.setPosition(s.x,terrainH(s.x,s.z)+.06,s.z);gapIM.setMatrixAt(n++,_gm);if(n>=160)break;}}
 gapIM.count=n;gapIM.instanceMatrix.needsUpdate=true;}
function drawArmies(){drawGaps();ARMY.begin();
 for(const m of G.men){if(m.gone)continue;ARMY.drawGreek(m);}
 for(const p of G.per){if(p.gone)continue;ARMY.drawPersian(p);}
 for(const s of G.spara){s.tilt=damp(s.tilt,s.down?-PI/2+.08:0,6,1/60);ARMY.drawSpara(s.x,s.down?s.z-.4:s.z,s.yaw,s.tilt*-1);}
 ARMY.end();}

/* ---------------- camera ---------------- */
const camP=new THREE.Vector3(0,20,-40),camL=new THREE.Vector3(0,0,20),_cp=new THREE.Vector3(),_cl=new THREE.Vector3();
function lineCenter(){let x=0,z=0,n=0,minz=1e9;for(const m of G.men){if(!m.alive||m.state!=='line')continue;x+=m.x;z+=m.z;n++;if(m.z<minz)minz=m.z;}return n?{x:x/n,z:z/n,back:minz}:{x:G.ax,z:G.az,back:G.az-8};}
function updateCamera(dt,t){
 const st=G.state;let k=2.2;const asp=camera.aspect,port=asp<1;
 if(st==='menu'||st==='calib'){const a=t*.05;_cp.set(Math.sin(a)*34,9+Math.sin(t*.13)*2,-30+Math.cos(a)*12);_cl.set(0,2,18);k=1.2;}
 else if(st==='story'){const s=STORY[G.storyI].cam;_cp.set(...s[0]);_cl.set(...s[1]);_cp.x+=Math.sin(t*.2)*2;k=1.4;}
 else if(st==='deploy'){_cp.set(0,port?44:24,port?-44:-34);_cl.set(0,0,port?-22:-15);k=2;}
 else if(st==='march'||st==='run'||st==='beach'||st==='ending'){const c=lineCenter();const back=port?19:10.5,h=port?13:6.6;
  _cp.set(lerp(c.x,G.ax,.6),h+(st==='beach'?2:0),c.back-back);_cl.set(G.ax,1.2,G.az+12+G.v*1.2);k=2.5;}
 else if(st==='clash'||st==='routing'){_cp.set(G.ax*.5,port?34:16,CONTACT+G.d[1]*.5-(port?28:17));_cl.set(G.ax*.5,0,CONTACT+G.d[1]*.5+3.5);k=1.6;}
 else if(st==='end'){const c=lineCenter();const a=t*.08;_cp.set(c.x+Math.sin(a)*22,7,c.z-14+Math.cos(a)*6);_cl.set(c.x,1.5,c.z+6);k=.8;}
 camP.x=damp(camP.x,_cp.x,k,dt);camP.y=damp(camP.y,_cp.y,k,dt);camP.z=damp(camP.z,_cp.z,k,dt);camL.x=damp(camL.x,_cl.x,k*1.3,dt);camL.y=damp(camL.y,_cl.y,k*1.3,dt);camL.z=damp(camL.z,_cl.z,k*1.3,dt);
 camera.position.copy(camP);
 if(G.shake>0&&!REDUCED){const s=G.shake*G.shake*.5;camera.position.x+=rand(-s,s);camera.position.y+=rand(-s,s);G.shake=Math.max(0,G.shake-dt*1.5);}
 camera.lookAt(camL);
 const fov=st==='run'||st==='beach'?52+G.v*.9:52;camera.fov=damp(camera.fov,fov,2,dt);camera.updateProjectionMatrix();
 sunFollow(camL.x,camL.z-4);sky.position.copy(camera.position);}

/* ---------------- beat indicator ----------------
   A white ring closes on the gold target circle and touches it exactly on the drum beat, then keeps going inward
   and fades. Its radius is a linear clock: r = target - (time from the beat) * k, so the gold bands drawn around
   the target are the real "perfect" and "good" windows. A tap leaves a mark where the ring was: outside the
   target = early, inside = late. The drum in the middle thumps on every beat. */
const BEATUI=(()=>{
 const cv=$('beatCv'),cx=cv.getContext('2d'),S=168,C=S/2,R={drum:22,target:44,max:78};
 let dpr=0,marks=[],lastCount=-1,thump=0;
 function fit(){const d=Math.min(2,devicePixelRatio||1);if(d===dpr)return;dpr=d;cv.width=S*d;cv.height=S*d;}
 // pixels per second of timing error: the ring covers ~0.9 beat from the edge to the target,
 // but never so fast that the "good" band would sink into the drum
 const K=()=>Math.min((R.max-R.target)/(AUDIO.B.len*.9),(R.target-R.drum-4)/D().good);
 const rOf=dt=>R.target-dt*K();
 function ring(r,w,col,a){if(r<=0||a<=0)return;cx.globalAlpha=a;cx.strokeStyle=col;cx.lineWidth=w;cx.beginPath();cx.arc(C,C,r,0,TAU);cx.stroke();}
 function band(r0,r1,col,a){r0=Math.max(r0,R.drum+1);if(r1<=r0)return;cx.globalAlpha=a;cx.fillStyle=col;cx.beginPath();cx.arc(C,C,r1,0,TAU);cx.arc(C,C,r0,0,TAU,true);cx.fill();}
 function tap(off,kind){marks.push({r:clamp(rOf(off),R.drum+3,R.max),kind,t:0});if(marks.length>6)marks.shift();thump=Math.max(thump,kind==='m'?.3:.6);}
 function draw(dt){fit();cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,S,S);
  const B=AUDIO.B,now=hearNow(),k=K(),g=D().good,p=D().perfect;
  // soft backdrop so the rings read over grass and sky
  const bg=cx.createRadialGradient(C,C,R.drum,C,C,R.max+6);bg.addColorStop(0,'rgba(20,12,8,.55)');bg.addColorStop(1,'rgba(20,12,8,0)');
  cx.globalAlpha=1;cx.fillStyle=bg;cx.beginPath();cx.arc(C,C,R.max+6,0,TAU);cx.fill();
  // the timing windows: wide pale band = good, narrow gold band = perfect, thin line = the beat itself
  band(R.target-g*k,R.target+g*k,'#f4e7cc',.2);
  ring(R.target+g*k,1,'#f4e7cc',.45);ring(R.target-g*k,1,'#f4e7cc',.45);
  band(R.target-p*k,R.target+p*k,'#f0b84c',.5);
  ring(R.target,2,'#ffd57a',.95);
  // the beats: those already scheduled + the next ones from the clock
  const list=G.beats.slice();if(B.on)for(let i=0;i<2;i++)list.push({t:B.next+i*B.len,hit:false,judged:false});
  let inZone=false;
  for(const b of list){const d=now-b.t;if(b.hit)continue;
   const r=R.target-d*k;if(r>R.max+2||d>g+.25)continue;
   const z=Math.abs(d)<=g;if(z)inZone=true;
   if(d>g){ // missed: the ring goes on into the drum, red, fading
    ring(r,3,'#ff6a4a',clamp(1-(d-g)/.25,0,1)*.6);continue;}
   const fadeIn=clamp((R.max+2-r)/14,0,1);
   ring(r,z?4:3,z?'#ffe27a':'#ffffff',fadeIn*(z?1:.9));}
  // the drum: thumps on every beat (the moment you should hear it)
  const x=(now-B.next)/B.len+B.count;const cnt=Math.floor(x+1e-6);
  if(B.on&&cnt!==lastCount){if(lastCount>=0&&cnt>lastCount)thump=1;lastCount=cnt;}
  thump=Math.max(0,thump-dt*5.5);
  const dr=R.drum*(1+.16*thump*thump),gl=cx.createRadialGradient(C-dr*.25,C-dr*.3,1,C,C,dr);
  gl.addColorStop(0,'#fff0c4');gl.addColorStop(.45,inZone?'#ffd060':'#f0b84c');gl.addColorStop(1,'#a8701e');
  cx.globalAlpha=1;cx.fillStyle=gl;cx.beginPath();cx.arc(C,C,dr,0,TAU);cx.fill();
  cx.lineWidth=2;cx.strokeStyle='#1c1410';cx.stroke();cx.globalAlpha=.5;cx.beginPath();cx.arc(C,C,dr*.58,0,TAU);cx.stroke();
  if(thump>0){cx.globalAlpha=thump*.55;cx.fillStyle='#fff6dc';cx.beginPath();cx.arc(C,C,dr,0,TAU);cx.fill();}
  // tap marks: they stay where the ring was when you tapped
  for(const m of marks){m.t+=dt;const a=clamp(1-m.t/.6,0,1);if(a<=0)continue;
   const col=m.kind==='p'?'#ffe27a':m.kind==='g'?'#bfe7a0':'#ff8a70';
   ring(m.r+m.t*10,3.5,col,a);ring(m.r,1.5,'#ffffff',a*.6);}
  marks=marks.filter(m=>m.t<.6);
  cx.globalAlpha=1;}
 return{draw,tap,reset(){marks=[];lastCount=-1;thump=0;}};})();
function updateBeatUI(dt){if($('beat').classList.contains('hidden'))return;BEATUI.draw(dt);}

/* ---------------- calibration: tap along with the drum, store the mean offset ---------------- */
const CAL={taps:[],prev:null};
function startCalib(){AUDIO.init();CAL.taps=[];CAL.prev=G.state;G.state='calib';show('menu',false);show('calib');
 $('calibN').textContent=T('calibN',0);$('calibR').textContent=T('calibCur',Math.round(G.calib*1000));
 G.beats.length=0;AUDIO.setStyle('march',90);}
function calibTap(){if(!AUDIO.B.on)return;const tt=AUDIO.now()-AUDIO.latency;let bd=1e9,off=0;
 const cand=G.beats.map(b=>b.t);cand.push(AUDIO.B.next);for(const t of cand){const d=tt-t;if(Math.abs(d)<Math.abs(bd)){bd=d;off=d;}}
 if(Math.abs(off)>AUDIO.B.len*.4)return;CAL.taps.push(off);const n=CAL.taps.length;$('calibN').textContent=T('calibN',Math.min(12,n));
 const e=$('calibDrum');e.classList.add('on');setTimeout(()=>e.classList.remove('on'),90);
 if(n>=12){const v=CAL.taps.slice(2).sort((a,b)=>a-b);const med=(v[4]+v[5])/2; // median of the last 10
  G.calib=clamp(med,-.25,.25);store.set('calib',G.calib);const ms=Math.round(G.calib*1000);
  $('calibR').textContent=Math.abs(ms)<10?T('calibNone'):T('calibR',(ms>0?'+':'')+ms);CAL.taps=[];AUDIO.setStyle('calm');}}
function endCalib(){show('calib',false);AUDIO.setStyle('calm');toMenu();}

/* ---------------- main loop ---------------- */
let last=performance.now(),tAll=0;
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,(now-last)/1000);last=now;if(G.paused||SIM.on)dt=0;
 readInput();step(dt);
 drawArmies();updateCamera(Math.max(dt,1/120),tAll);updateBeatUI(Math.min(.05,(now-(frame.prev||now))/1000));frame.prev=now;updateLabels();
 if(POST){POST.comp.uniforms.flash.value=Math.max(0,POST.comp.uniforms.flash.value-dt*2);POST.render();}else renderer.render(scene,camera);
}
function step(dt){tAll+=dt;U.time.value=tAll;
 if(!G.paused&&dt>0){
  if(['march','run','clash','beach','routing'].includes(G.state)){G.tAct+=dt;G.tTotal+=dt;judgeMissedBeats();
   const alive=G.men.reduce((n,m)=>n+(m.alive?1:0),0);if(alive!==G.aliveShown){G.aliveShown=alive;$('menN').textContent=alive;$('menOf').textContent='/'+TOTAL;}}
  if(G.state==='march')updateMarch(dt);else if(G.state==='run')updateRun(dt);else if(G.state==='clash')updateClash(dt);else if(G.state==='beach')updateBeach(dt);
  else if(G.state==='routing'){for(const p of G.per)if(p.alive&&p.state==='flee')fleeMove(p,dt);for(const m of G.men){if(m.alive&&m.state==='line'){m.push=damp(m.push,0,3,dt);}else if(m.alive&&m.state==='chase')chaseMove(m,dt);}}
  else if(G.state==='end'||G.state==='ending'){for(const p of G.per)if(p.alive&&p.state==='flee')fleeMove(p,dt);for(const m of G.men)if(m.alive&&m.state==='board'){m.yaw=damp(m.yaw,0,3,dt);}}
  animate(dt);
  // men running raise dust
  if(G.v>3){G.dustAcc=(G.dustAcc||0)+dt*G.v*2.2;while(G.dustAcc>1){G.dustAcc--;const m=G.men[(Math.random()*G.men.length)|0];if(m.alive&&m.state==='line'&&m.move>.5)FX.dust(m.x,0,m.z-.2,1,{vz:G.v*.3});}}
  WORLD.update(dt,tAll);ARROWS.update(dt);FX.update(dt);
  // ambience
  const zc=camera.position.z;AUDIO.ambience(1,clamp((zc-150)/200,0,1),G.state==='clash'?1:G.state==='run'?.4:.15);
 }
}
// test hook: run the simulation in virtual time (no rendering), with an optional beat bot
const SIM={on:false};

/* ---------------- wiring ---------------- */
INPUT.onKey=code=>{
 if(code==='Escape'||code==='KeyP'){if(['march','run','clash','beach'].includes(G.state))togglePause();}
 if(G.state==='clash'&&!G.paused){if(code==='KeyA'||code==='ArrowLeft')INPUT.leftTap=1;if(code==='KeyD'||code==='ArrowRight')INPUT.rightTap=1;
  if(G.choice){if(code==='KeyQ')decide('chase');if(code==='KeyE')decide('turn');}}
 if(G.state==='story'&&isStepKey(code))nextStory();};
$('tL').addEventListener('pointerdown',()=>{if(G.state==='clash')INPUT.leftTap=1;});$('tR').addEventListener('pointerdown',()=>{if(G.state==='clash')INPUT.rightTap=1;});
function togglePause(){G.paused=!G.paused;show('pause',G.paused);if(G.paused){G.pausedStyle=[AUDIO.B.style,AUDIO.B.bpm];AUDIO.setStyle('none');}else{const[s,b]=G.pausedStyle;AUDIO.B.on=false;AUDIO.setStyle(s,b);}}
$('bPlay').onclick=()=>{AUDIO.init();AUDIO.S.ui();if(store.get('seen',false)){show('menu',false);startDeploy();}else{store.set('seen',true);startStory();}};
$('bHow').onclick=()=>{AUDIO.S.ui();const K=IS_TOUCH?'T':'K';$('howGrid').innerHTML=[1,2,3,4].map(i=>`<div class="howc"><b>${T('how'+i+'h')}</b>${STR[LANG]['how'+i+K]?T('how'+i+K):T('how'+i)}</div>`).join('');show('how');};
$('bHowOk').onclick=()=>show('how',false);
$('calib').addEventListener('pointerdown',e=>{if(!e.target.closest('button'))calibTap();});
$('bCalib').onclick=()=>{AUDIO.S.ui();startCalib();};$('bCalibOk').onclick=()=>{AUDIO.S.ui();endCalib();};
$('bCalibReset').onclick=()=>{G.calib=0;store.set('calib',0);CAL.taps=[];$('calibN').textContent=T('calibN',0);$('calibR').textContent=T('calibCur',0);AUDIO.setStyle('march',90);};
$('bNext').onclick=nextStory;$('bSkip').onclick=()=>{show('story',false);startDeploy();};
$('cMinus').onclick=()=>{G.c=Math.max(3,G.c-1);AUDIO.S.ui();updateDeploy();};$('cPlus').onclick=()=>{G.c=Math.min(10,G.c+1);AUDIO.S.ui();updateDeploy();};
document.querySelectorAll('.pre').forEach(b=>b.onclick=()=>{G.c=+b.dataset.c;AUDIO.S.ui();updateDeploy();});
$('bDeploy').onclick=()=>{AUDIO.S.ui();startBattle();};
$('bResume').onclick=togglePause;$('bQuit').onclick=()=>{G.paused=false;show('pause',false);toMenu();};
$('bPause').onclick=togglePause;
$('bAgain').onclick=()=>{show('end',false);startDeploy();};$('bMenu').onclick=()=>toMenu();$('bRetryClash').onclick=retryClash;
$('chChase').onclick=e=>{e.stopPropagation();decide('chase');};$('chTurn').onclick=e=>{e.stopPropagation();decide('turn');};
$('bMute').onclick=()=>{AUDIO.init();AUDIO.setMute(!AUDIO.muted);$('bMute').textContent=AUDIO.muted?'🔇':'🔊';};$('bMute').textContent=AUDIO.muted?'🔇':'🔊';
function segInit(id,val,cb){const el=$(id);el.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.v===val);b.onclick=()=>{el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));cb(b.dataset.v);AUDIO.S.ui();};});}
segInit('segDiff',G.diff,v=>{G.diff=v;store.set('diff',v);});
segInit('segLang',LANG,v=>{setLang(v);makeLabels();updateBest();});
['hud','choice','touch','corner'].forEach(id=>$(id).addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.stopPropagation();}));
// a tap on the HUD area that is not a button still counts as a step
G.c=store.get('lastC',4);
applyLang();resetStats();toMenu();
requestAnimationFrame(t=>{last=t;frame(t);setTimeout(()=>{$('loading').style.opacity=0;setTimeout(()=>$('loading').remove(),700);},300);});
// test hook
window.__phalanx={G,AUDIO,step:()=>INPUT.onStep(),decide,startClash,startBeach,startRun,victory,
 sim(sec,o={}){SIM.on=true;if(AUDIO.virtual==null)AUDIO.virtual=AUDIO.now();const dt=1/30;let n=Math.round(sec/dt);
  while(n--){AUDIO.virtual+=dt;AUDIO.tick();INPUT.shield=!!o.shield&&(G.volleyPhase>0||G.incoming)||!!o.shieldAlways;INPUT.close=!!o.close;INPUT.left=INPUT.right=false;
   if(o.steer&&G.state!=='clash'){const tx=o.steer();if(G.ax<tx-.5)INPUT.left=true;else if(G.ax>tx+.5)INPUT.right=true;}
   if(o.bot)for(const b of G.beats)if(!b.hit&&Math.abs(AUDIO.virtual-b.t)<dt*.6&&Math.random()<(o.acc??1)){INPUT.onStep();break;}
   const keep=readInput;step(dt);if(o.until&&o.until())break;}
  SIM.on=false;},
 render(){drawArmies();updateCamera(1/30,tAll);for(let i=0;i<40;i++)updateCamera(1/30,tAll);updateLabels();if(POST)POST.render();else renderer.render(scene,camera);}};
