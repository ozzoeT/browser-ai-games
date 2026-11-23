'use strict';
/* Phalanx – sound: the beat clock (everything in the game steps to it), aulos + drum music,
   voices (paean, war cry), feet, arrows, bronze. All synthesized with Web Audio. */
const AUDIO=(()=>{
 let ac=null,master,musicG,sfxG,verb,verbG,noiseBuf,ambG,seaG,windG,crowdG;
 let muted=store.get('mute',false);
 const B={bpm:84,len:60/84,next:0,count:0,style:'none',on:false,listeners:[]};
 // Dorian on D: degrees in semitones from tonic
 const TON=146.83;const SC=[0,2,3,5,7,9,10,12,14,15,17];
 const MEL={march:[4,3,2,1,2,3,4,0, 4,5,4,3,2,1,0,0],run:[7,6,4,6,7,8,7,4, 7,6,4,3,4,2,1,0],clash:[4,4,7,4,3,2,3,0, 4,4,7,8,7,4,2,0],beach:[7,8,9,8,7,4,7,4, 9,8,7,6,7,4,2,0]};
 const now=()=>API.virtual!=null?API.virtual:ac?ac.currentTime:performance.now()/1000;
 function init(){
  if(ac){if(ac.state==='suspended')ac.resume();return;}
  try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ac=null;return;}
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(ac.destination);
  master=ac.createGain();master.gain.value=muted?0:.9;master.connect(comp);
  musicG=ac.createGain();musicG.gain.value=.5;musicG.connect(master);
  sfxG=ac.createGain();sfxG.gain.value=.85;sfxG.connect(master);
  // synthetic hall reverb
  verb=ac.createConvolver();const L=ac.sampleRate*2.2,ir=ac.createBuffer(2,L,ac.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3.2);}
  verb.buffer=ir;verbG=ac.createGain();verbG.gain.value=.28;verb.connect(verbG);verbG.connect(master);
  noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);{const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  // ambience: wind, sea, distant crowd
  const amb=(f,q,type)=>{const s=ac.createBufferSource();s.buffer=noiseBuf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(master);s.start();return g;};
  windG=amb(380,.6,'bandpass');seaG=amb(520,.3,'lowpass');crowdG=amb(620,1.4,'bandpass');
  if(B.on)B.next=now()+.35;
 }
 function setMute(m){muted=m;store.set('mute',m);if(master)master.gain.setTargetAtTime(m?0:.9,ac.currentTime,.05);}
 // ---------- helpers ----------
 function env(g,t,a,peak,d,sus=0,rel=.1,hold=0){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);
  if(sus>0){g.gain.setTargetAtTime(peak*sus,t+a,d/3);g.gain.setTargetAtTime(0,t+a+hold,rel/3);}else g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
 function noise(t,dur,f,q,type,vol,dest=sfxG,rev=0){if(!ac)return;const s=ac.createBufferSource();s.buffer=noiseBuf;s.playbackRate.value=.8+Math.random()*.4;
  const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();s.connect(fl);fl.connect(g);g.connect(dest);if(rev){const r=ac.createGain();r.gain.value=rev;g.connect(r);r.connect(verb);}
  env(g,t,.003,vol,dur);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);return fl;}
 function tone(t,f,dur,vol,type='sine',dest=sfxG,f2=0,rev=0){if(!ac)return;const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  const g=ac.createGain();o.connect(g);g.connect(dest);if(rev){const r=ac.createGain();r.gain.value=rev;g.connect(r);r.connect(verb);}env(g,t,.004,vol,dur);o.start(t);o.stop(t+dur+.05);}
 // ---------- instruments ----------
 function drum(t,acc){tone(t,acc?105:92,.42,acc?.75:.5,'sine',musicG,acc?44:50,.25);noise(t,.09,acc?520:420,.8,'lowpass',acc?.5:.32,musicG,.2);
  if(acc)noise(t,.05,2400,1.2,'bandpass',.12,musicG,.3);}
 function tick2(t){noise(t,.03,3200,2,'bandpass',.06,musicG);} // small off-beat click (stick on the rim)
 function aulos(t,f,dur,vol=.12){if(!ac)return;const g=ac.createGain(),fl=ac.createBiquadFilter(),fl2=ac.createBiquadFilter();fl.type='bandpass';fl.frequency.value=1150;fl.Q.value=.9;fl2.type='lowpass';fl2.frequency.value=3200;
  const lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=5.6;lg.gain.value=f*.006;lfo.connect(lg);
  for(const[ty,dt,v]of[['sawtooth',1,.6],['square',1.004,.4]]){const o=ac.createOscillator();o.type=ty;o.frequency.setValueAtTime(f*dt*.985,t);o.frequency.linearRampToValueAtTime(f*dt,t+.05);lg.connect(o.frequency);
   const og=ac.createGain();og.gain.value=v;o.connect(og);og.connect(fl);o.start(t);o.stop(t+dur+.2);}
  fl.connect(fl2);fl2.connect(g);g.connect(musicG);const r=ac.createGain();r.gain.value=.5;g.connect(r);r.connect(verb);
  lfo.start(t);lfo.stop(t+dur+.2);env(g,t,.035,vol,dur,.8,.12,dur*.85);}
 function voice(t,f,dur,vol=.05,glide=0,vowel='a'){if(!ac)return;const F=vowel==='e'?[530,1840,2480]:vowel==='o'?[500,860,2450]:[730,1150,2600];
  const o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f,t);if(glide)o.frequency.linearRampToValueAtTime(f*glide,t+dur*.7);
  const lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=4.5+Math.random()*2;lg.gain.value=f*.012;lfo.connect(lg);lg.connect(o.frequency);
  const g=ac.createGain();F.forEach((ff,i)=>{const b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=ff;b.Q.value=7;const bg=ac.createGain();bg.gain.value=[1,.55,.25][i];o.connect(b);b.connect(bg);bg.connect(g);});
  g.connect(musicG);const r=ac.createGain();r.gain.value=.8;g.connect(r);r.connect(verb);env(g,t,.09,vol,dur,.85,.25,dur*.8);o.start(t);lfo.start(t);o.stop(t+dur+.4);lfo.stop(t+dur+.4);}
 function choir(t,root,dur,vol=.05,vowel='a',glide=0){for(let i=0;i<5;i++){const f=root*[1,1,1.5,2,1.498][i]*(1+(Math.random()-.5)*.012);voice(t+Math.random()*.04,f,dur,vol,glide,vowel);}}
 function clank(t,vol=.25,base=1){if(!ac)return;for(const p of[1,1.47,2.09,2.76,3.51]){tone(t,base*780*p*(1+(Math.random()-.5)*.06),.12+Math.random()*.18,vol/p,'sine',sfxG,0,.25);}noise(t,.04,3000,1,'highpass',vol*.5);}
 // ---------- beat clock ----------
 function setStyle(style,bpm){B.style=style;if(bpm){B.bpm=bpm;B.len=60/bpm;}
  if(style==='none'||style==='calm'){B.on=false;return;}
  if(!B.on){B.on=true;B.next=now()+.35;B.count=0;}}
 function tick(){if(!B.on)return;const t=now();
  while(B.next<t+.12){const bt=B.next,k=B.count;playBeat(bt,k);B.listeners.forEach(f=>f(bt,k));B.count++;B.next+=B.len;}}
 function playBeat(t,k){const st=B.style,bar=k%4;
  drum(t,bar===0);
  if(st==='run'||st==='beach')tick2(t+B.len*.5);
  if(st==='clash'&&bar===2)drum(t+B.len*.5,false);
  const mel=MEL[st]||MEL.march,deg=mel[k%mel.length],oct=st==='march'?1:2;
  const f=TON*Math.pow(2,SC[deg]/12)*oct*.5*(st==='march'?2:1);
  aulos(t,f,B.len*.9,st==='march'?.1:.12);
  if(k%8===0)aulos(t,TON*.5,B.len*7.8,.045); // the drone pipe
  if(st==='clash'&&bar===0)choir(t,TON*.75*(k%16<8?1:1.122),B.len*1.7,.032,'o');
 }
 // ---------- sfx ----------
 const S={
  steps(sync,n=1,run=false){if(!ac)return;const t=now();const v=run?.5:.38;
   if(sync>.75){noise(t,.13,run?900:650,.7,'lowpass',v*1.2);noise(t,.06,1800,1,'bandpass',v*.25);clank(t+.01,.035,1.3);}
   else{const k=3+Math.round((1-sync)*5);for(let i=0;i<k;i++)noise(t+Math.random()*.3,.07,600+Math.random()*400,.7,'lowpass',v*.45);}},
  stumble(){if(!ac)return;const t=now();noise(t,.12,500,.6,'lowpass',.3);clank(t+.05,.06,.9);},
  draw(){if(!ac)return;const t=now();for(let i=0;i<8;i++)noise(t+i*.05,.25,1400+i*90,6,'bandpass',.025);},
  loose(){if(!ac)return;const t=now();for(let i=0;i<14;i++){const tt=t+Math.random()*.18;tone(tt,170+Math.random()*60,.06,.06,'triangle',sfxG,90);noise(tt,.02,2600,1,'bandpass',.04);}
   const s=ac.createBufferSource();s.buffer=noiseBuf;const fl=ac.createBiquadFilter();fl.type='bandpass';fl.Q.value=1.4;fl.frequency.setValueAtTime(2600,t+.1);fl.frequency.exponentialRampToValueAtTime(700,t+1.7);
   const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.14,t+.6);g.gain.linearRampToValueAtTime(.22,t+1.5);g.gain.linearRampToValueAtTime(0,t+1.85);s.connect(fl);fl.connect(g);g.connect(sfxG);s.start(t);s.stop(t+1.9);},
  land(shieldHits,groundHits,bodyHits){if(!ac)return;const t=now();
   for(let i=0;i<Math.min(26,shieldHits);i++){const tt=t+Math.random()*.32;noise(tt,.035,1100+Math.random()*500,2.5,'bandpass',.13);tone(tt,260+Math.random()*80,.05,.05,'triangle');}
   for(let i=0;i<Math.min(18,groundHits);i++)noise(t+Math.random()*.35,.03,2200,1.5,'bandpass',.05);
   for(let i=0;i<Math.min(6,bodyHits);i++)noise(t+Math.random()*.3,.1,380,.8,'lowpass',.2);},
  fall(){if(!ac)return;const t=now()+.15;noise(t,.18,300,.7,'lowpass',.32);clank(t+.08,.05,.8);},
  warcry(){if(!ac)return;const t=now();choir(t,140,1.2,.07,'e',1.55);choir(t+.05,110,1.3,.06,'e',1.7);noise(t,1.2,800,.5,'bandpass',.12,sfxG,.4);},
  clash(){if(!ac)return;const t=now();tone(t,70,.7,.9,'sine',sfxG,32,.4);noise(t,.5,900,.5,'lowpass',.8,sfxG,.5);for(let i=0;i<14;i++)clank(t+Math.random()*.4,.18,.8+Math.random()*.6);
   for(let i=0;i<10;i++)noise(t+Math.random()*.3,.08,1500,2,'bandpass',.18);},
  fight(intensity){if(!ac)return;const t=now();if(Math.random()<.55)clank(t,.05+.1*intensity,.7+Math.random()*.8);else noise(t,.05,1200+Math.random()*900,2,'bandpass',.08*intensity+.03);},
  push(q){if(!ac)return;const t=now();noise(t,.16,420,.7,'lowpass',.35+.25*q);if(q>.8)voice(t,120,.25,.03,0,'o');},
  cheer(){if(!ac)return;const t=now();choir(t,165,1.4,.06,'a',1.25);choir(t+.3,220,1.1,.05,'e',1.1);for(let i=0;i<4;i++)clank(t+i*.12,.06,1.4);},
  fanfare(){if(!ac)return;const t=now();[0,2,4,7,4,7,9,7].forEach((d,i)=>aulos(t+i*.16,TON*2*Math.pow(2,SC[d]/12),.18,.12));},
  horn(){if(!ac)return;const t=now();for(const f of[98,147])tone(t,f,1.6,.12,'sawtooth',sfxG,f*1.02,.6);},
  ship(){if(!ac)return;const t=now();noise(t,1.6,260,.5,'lowpass',.3,sfxG,.3);for(let i=0;i<6;i++)noise(t+.3+i*.22,.3,700,.8,'lowpass',.12);},
  ui(){if(!ac)return;tone(now(),660,.06,.06,'triangle');},
  defeat(){if(!ac)return;const t=now();[4,3,2,1,0].forEach((d,i)=>aulos(t+i*.42,TON*Math.pow(2,SC[d]/12),.45,.1));},
  victory(){if(!ac)return;const t=now();[0,4,7,4,7,9,10,7,9,7,4,7].forEach((d,i)=>aulos(t+i*.24,TON*2*Math.pow(2,SC[d]/12)*.5,.3,.12));choir(t,TON*.75,2.8,.045,'a');choir(t+1.4,TON,1.8,.04,'o');}
 };
 function ambience(wind,sea,crowd){if(!ac)return;const t=ac.currentTime;windG.gain.setTargetAtTime(wind*.05,t,.8);seaG.gain.setTargetAtTime(sea*.12,t,.8);crowdG.gain.setTargetAtTime(crowd*.05,t,.4);}
 setInterval(tick,25);
 const API={virtual:null,init,now,B,tick,get latency(){return API.virtual!=null?0:ac?(ac.outputLatency||0)+(ac.baseLatency||0):0;},setStyle,S,setMute,get muted(){return muted;},ambience,onBeat:f=>B.listeners.push(f),get ok(){return !!ac;}};
 return API;
})();
