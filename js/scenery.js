/* Rich pixel environments: cached material layers, unchanged collision geometry. */
'use strict';
CE.art={};
CE.artReady=Promise.all(['world','environments','materials'].map(name=>new Promise(resolve=>{const img=new Image();img.onload=()=>{CE.art[name]=img;resolve();};img.onerror=()=>{console.warn('Artwork unavailable:',name);resolve();};img.src='assets/'+name+'.png';}))).then(()=>{
 if(CE.art.world)document.getElementById('mapArea').style.backgroundImage="url('assets/world.png')";
});
const sceneryCache={};
CE.scenery=function(c,index,w=960,h=600){const img=CE.art.environments;if(!img){c.fillStyle='#23394c';c.fillRect(0,0,w,h);return;}const key=index+':'+w+':'+h;if(!sceneryCache[key]){const a=document.createElement('canvas');a.width=w;a.height=h;const g=a.getContext('2d');g.imageSmoothingEnabled=false;const sw=img.naturalWidth/2,sh=img.naturalHeight/2;g.drawImage(img,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,0,0,w,h);sceneryCache[key]=a;}c.drawImage(sceneryCache[key],0,0);};
const materialCache={};
function materialTile(index,size){const key=index+':'+size;if(materialCache[key])return materialCache[key];const img=CE.art.materials;if(!img)return null;const a=document.createElement('canvas');a.width=size;a.height=size;const g=a.getContext('2d'),sw=img.naturalWidth/2,sh=img.naturalHeight/2;g.imageSmoothingEnabled=false;g.drawImage(img,index%2*sw,Math.floor(index/2)*sh,sw,sh,0,0,size,size);return materialCache[key]=a;}
function lamp(g,x,y){g.save();const light=g.createRadialGradient(x,y,0,x,y,56);light.addColorStop(0,'#ffce7852');light.addColorStop(.4,'#ffbc5b1a');light.addColorStop(1,'#ffbc5b00');g.fillStyle=light;g.fillRect(x-56,y-56,112,112);g.fillStyle='#162838';g.fillRect(x-2,y+7,4,14);g.fillRect(x-7,y-7,14,16);g.fillStyle='#d4b47d';g.fillRect(x-6,y-8,12,2);g.fillStyle='#ffe8aa';g.fillRect(x-4,y-4,8,10);g.fillStyle='#a87845';g.fillRect(x,y-4,1,10);g.fillRect(x-4,y+2,8,1);g.restore();}
const simpleBase=CE.TileMap.prototype.drawBase,simpleWalls=CE.TileMap.prototype.drawWalls;
CE.TileMap.prototype.buildScenery=function(){
 if(this._richBase||!CE.art.materials)return;
 const base=document.createElement('canvas'),wall=document.createElement('canvas');base.width=wall.width=this.pw;base.height=wall.height=this.ph;const b=base.getContext('2d'),g=wall.getContext('2d');b.imageSmoothingEnabled=g.imageSmoothingEnabled=false;
 const theme=this.artTheme||'station',station=theme==='station'||theme==='metro';
 b.fillStyle=b.createPattern(materialTile(0,220),'repeat');b.fillRect(0,0,this.pw,this.ph);
 if(station){b.fillStyle=b.createPattern(materialTile(1,160),'repeat');b.fillRect(40,40,this.pw-80,16);b.fillRect(40,this.ph-56,this.pw-80,16);}
 b.fillStyle=theme==='metro'?'#08152a55':'#081a3020';b.fillRect(0,0,this.pw,this.ph);
 const stone=g.createPattern(materialTile(2,160),'repeat'),leaves=g.createPattern(materialTile(3,120),'repeat');
 for(let r=0;r<this.h;r++)for(let k=0;k<this.w;k++){
 const ch=this.at(k,r),x=k*this.tw,y=r*this.th,w=this.tw,h=this.th;
 if(ch==='#'){
  // Shadows are painted on the ground, never used as collision geometry.
  b.fillStyle='#07162c44';b.fillRect(x+5,y+8,w,h);
  g.fillStyle=stone;g.fillRect(x,y,w,h);
  g.fillStyle='#142238aa';g.fillRect(x,y+h-7,w,7);
  g.fillStyle='#b0a999';g.fillRect(x,y,w,2);g.fillStyle='#fff0c22a';g.fillRect(x+2,y+3,w-4,2);
  if(theme==='oldtown'||theme==='garden'){
   g.fillStyle=leaves;g.fillRect(x+3,y+5,w-6,h-14);
   g.fillStyle='#d2bd8c';g.fillRect(x,y+h-9,w,2);
  }else if((r*3+k)%5===0 && r>0 && r<this.h-1){
   g.fillStyle='#162a3c';g.fillRect(x+10,y+6,w-20,h-16);g.fillStyle='#74959c';g.fillRect(x+12,y+8,w-24,h-20);g.fillStyle='#d5bd86';g.fillRect(x+w/2,y+8,2,h-20);g.fillRect(x+12,y+h/2,w-24,2);
  }
  if((r*13+k*7)%9===0){lamp(b,x+w/2,y+h/2);lamp(g,x+w/2,y+h/2);}
  // Ornate plinths stay fully inside the wall footprint.
  if((r+k)%7===0){g.fillStyle='#d1c3a2';g.fillRect(x+2,y+3,4,h-8);g.fillStyle='#877f71';g.fillRect(x+6,y+3,2,h-8);}
 }else if(ch===','){b.fillStyle=leaves;b.fillRect(x,y,w,h);}
 }
 // Border lighting adds atmosphere without masking collectibles or routes.
 const v=b.createRadialGradient(this.pw/2,this.ph/2,160,this.pw/2,this.ph/2,this.pw*.7);v.addColorStop(0,'#07162c00');v.addColorStop(1,'#07162c66');b.fillStyle=v;b.fillRect(0,0,this.pw,this.ph);
 this._richBase=base;this._richWall=wall;
};
CE.TileMap.prototype.drawBase=function(c,p,t){this.buildScenery();if(this._richBase)c.drawImage(this._richBase,0,0);else simpleBase.call(this,c,p,t);};
CE.TileMap.prototype.drawWalls=function(c,p,t){this.buildScenery();if(this._richWall)c.drawImage(this._richWall,0,0);else simpleWalls.call(this,c,p,t);};
// Wood slats, metal supports and warm edges replace plain bench rectangles.
CE.drawBench=function(c,x,y,w=60){c.save();c.translate(x,y);c.fillStyle='#0b203744';c.fillRect(-3,-1,w+8,7);c.fillStyle='#233446';c.fillRect(5,-24,4,27);c.fillRect(w-9,-24,4,27);for(let j=0;j<3;j++){c.fillStyle=j===0?'#c69a66':'#966c49';c.fillRect(0,-28+j*6,w,4);c.fillStyle='#dfb981';c.fillRect(1,-28+j*6,w-2,1);}c.fillStyle='#b1875b';c.fillRect(-2,-10,w+4,7);c.fillStyle='#dfb981';c.fillRect(-2,-10,w+4,1);c.fillStyle='#38495c';c.fillRect(6,-3,4,8);c.fillRect(w-10,-3,4,8);c.restore();};
const pixelCard=CE.card;
CE.card=function(c,x,y,w,h,r,fill,lw){pixelCard(c,x,y,w,h,r,fill,lw);if(w>65&&h>35&&lw!==0){c.save();c.strokeStyle='#bca575';c.lineWidth=1;c.strokeRect(x+4,y+4,w-8,h-8);c.fillStyle='#e6cb91';for(const xx of [x+6,x+w-9])for(const yy of [y+6,y+h-9])c.fillRect(xx,yy,3,3);c.restore();}};
