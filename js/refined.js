/* Visual upgrade. All drawing retains the original feet origin and gameplay hitboxes. */
'use strict';
Object.assign(CE.C,{line:'#40564e',sky:'#b9d5d5',sky2:'#d8e5dc',grass:'#a7bd88',grass2:'#8ba678',road:'#e6dcc1',road2:'#cec3a6',water:'#9ec4c6',water2:'#7faeb6',wall:'#d2c5a8',wall2:'#b2a387',roof:'#a77965',orange:'#b78a52',yellow:'#e4c67d',skin:'#ead0af',hair:'#51463b',jeans:'#526a75'});
CE.drawPerson = function(ctx,x,y,color,opts,isHero){
 const o=opts||{}, t=o.walk||0, bob=Math.abs(Math.sin(t))*1.1, step=Math.sin(t)*4;
 ctx.save();ctx.translate(x,y);ctx.scale((o.scale||1)*(o.dir===-1?-1:1),o.scale||1);
 CE.shadow(ctx,0,0,13,3.5,.15);
 function limb(x1,y1,x2,y2,w,col){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
 limb(-4,-23,-5+step,-4,6,'#435963');limb(4,-23,5-step,-4,6,'#617783');
 CE.card(ctx,-9+step,-5,9,5,2,'#384744',0);CE.card(ctx,1-step,-5,9,5,2,'#384744',0);
 if(isHero){CE.card(ctx,-13,-43-bob,9,21,4,'#526f62',0);limb(-11,-39-bob,-13,-24-bob,2,'#a6b295');}
 const coat=ctx.createLinearGradient(-10,0,11,0);coat.addColorStop(0,color);coat.addColorStop(1,isHero?'#d3b47c':color);
 CE.card(ctx,-9,-43-bob,18,24,5,coat,0);
 ctx.fillStyle='#eee7d5';ctx.beginPath();ctx.moveTo(-5,-44-bob);ctx.lineTo(0,-35-bob);ctx.lineTo(5,-44-bob);ctx.fill();
 limb(0,-34-bob,0,-21-bob,1,'#8e784f');for(let yy=-31;yy<-20;yy+=5)CE.circle(ctx,3,yy-bob,.9,'#f4e3b2',0);
 limb(-8,-39-bob,-11-step*.45,-25-bob,5,color);limb(8,-39-bob,11+step*.45,-25-bob,5,color);
 CE.circle(ctx,-11-step*.45,-24-bob,2.4,CE.C.skin,0);CE.circle(ctx,11+step*.45,-24-bob,2.4,CE.C.skin,0);
 CE.card(ctx,-3,-49-bob,6,9,2,'#d0ad8b',0);
 // Fine hair silhouette and smaller head, with restrained facial features.
 CE.ellipse(ctx,0,-53-bob,9.8,12,o.hairColor||'#51463e',0);
 const skin=ctx.createLinearGradient(-8,-60,9,-46);skin.addColorStop(0,'#f2ddc0');skin.addColorStop(1,'#d8b495');
 CE.ellipse(ctx,1,-52-bob,7.7,9,skin,0);
 ctx.fillStyle=o.hairColor||'#51463e';ctx.beginPath();ctx.moveTo(-9,-54-bob);ctx.quadraticCurveTo(-11,-69-bob,4,-64-bob);ctx.quadraticCurveTo(13,-63-bob,9,-54-bob);ctx.lineTo(3,-59-bob);ctx.quadraticCurveTo(-2,-54-bob,-9,-54-bob);ctx.fill();
 limb(-6,-62-bob,1,-64-bob,1,'#89715a');
 CE.circle(ctx,-2,-52-bob,1,'#3e4941',0);CE.circle(ctx,5,-52-bob,1,'#3e4941',0);
 limb(2,-51-bob,3,-48-bob,.7,'#b69178');limb(0,-46-bob,3,-46-bob,.8,'#a77e69');
 if(isHero){ctx.fillStyle='#718f7c';ctx.beginPath();ctx.moveTo(-6,-43-bob);ctx.lineTo(6,-43-bob);ctx.lineTo(4,-39-bob);ctx.lineTo(-4,-40-bob);ctx.fill();CE.card(ctx,3,-41-bob,4,11,1,'#829d87',0);}
 ctx.restore();
};
CE.drawHero=(ctx,x,y,o)=>CE.drawPerson(ctx,x,y,'#ae8656',o,true);
CE.drawNPC=(ctx,x,y,col,o)=>CE.drawPerson(ctx,x,y,col,o,false);
CE.drawTree=function(ctx,x,y,s,t){
 ctx.save();ctx.translate(x,y);ctx.scale(s||1,s||1);CE.shadow(ctx,5,1,22,6,.12);
 CE.card(ctx,-4,-46,8,46,2,'#86775c',0);
 ctx.strokeStyle='#86775c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(-14,-43);ctx.moveTo(0,-29);ctx.lineTo(14,-48);ctx.stroke();
 [[-13,-44,17,'#63856c'],[12,-49,20,'#769775'],[0,-65,22,'#87a37b'],[-7,-71,15,'#a4b88b']].forEach(a=>CE.circle(ctx,a[0],a[1],a[2],a[3],0));
 for(let i=0;i<9;i++){const a=i*2.4;CE.ellipse(ctx,Math.cos(a)*15,-58+Math.sin(a)*16,3,1.5,'#c4d2a155',0);}
 ctx.restore();
};
// Cache terrain details once per map and palette; animation frames only blit a bitmap.
const originalBase=CE.TileMap.prototype.drawBase;
CE.TileMap.prototype.drawBase=function(ctx,p,t){
 const key=JSON.stringify(p||{});
 if(!this._art||this._artKey!==key){
  const c=document.createElement('canvas');c.width=this.pw;c.height=this.ph;const g=c.getContext('2d');originalBase.call(this,g,p,t);
  const rng=CE.seeded(810);
  for(let r=0;r<this.h;r++)for(let col=0;col<this.w;col++){
   const ch=this.at(col,r),x=col*this.tw,y=r*this.th;
   if(ch==='.'||ch===','){
    if(ch==='.'){g.strokeStyle='#96896d18';g.lineWidth=.7;g.strokeRect(x+1,y+1,this.tw-2,this.th-2);g.fillStyle='#ffffff25';g.fillRect(x+3,y+3,this.tw-6,1);}
    else for(let n=0;n<6;n++){const xx=x+4+rng()*(this.tw-8),yy=y+6+rng()*(this.th-10);g.strokeStyle='#527b5a55';g.beginPath();g.moveTo(xx-2,yy);g.lineTo(xx,yy-4);g.lineTo(xx+2,yy);g.stroke();if(n%3===0)CE.circle(g,xx,yy-4,1.7,['#eddfba','#d9b9a9'][n%2],0);}
   }
   if(ch==='w'){g.strokeStyle='#edf5df66';g.lineWidth=1;g.beginPath();g.moveTo(x+6,y+12);g.quadraticCurveTo(x+16,y+9,x+28,y+12);g.stroke();}
  }
  this._art=c;this._artKey=key;
 }
 ctx.drawImage(this._art,0,0);
};
CE.TileMap.prototype.drawWalls=function(ctx,color,top){
 for(let r=0;r<this.h;r++)for(let c=0;c<this.w;c++){
  if(this.at(c,r)!=='#')continue;
  const x=c*this.tw,y=r*this.th,w=this.tw,h=this.th;
  CE.card(ctx,x+1,y+2,w-2,h-3,3,color||CE.C.wall,0);
  ctx.fillStyle='#655b4620';ctx.fillRect(x+1,y+h-7,w-2,5);
  ctx.fillStyle=top||'#f3ead055';ctx.fillRect(x+2,y+2,w-4,4);
  ctx.strokeStyle='#8d806540';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x+2,y+h/2);ctx.lineTo(x+w-2,y+h/2);ctx.moveTo(x+w*.35,y+7);ctx.lineTo(x+w*.35,y+h/2);ctx.moveTo(x+w*.7,y+h/2);ctx.lineTo(x+w*.7,y+h-8);ctx.stroke();
  // Ivy and flowers stay inside solid cells, leaving all walkable space untouched.
  if((r*13+c*7)%11===0){for(let k=0;k<4;k++)CE.ellipse(ctx,x+7+k*5,y+9+(k%2)*4,4,2.2,['#78926b','#92a77b'][k%2],0);CE.circle(ctx,x+14,y+8,2,'#e1c6aa',0);}
 }
};
// Swept substeps prevent a large frame delta from crossing a thin obstacle.
const originalMove=CE.TileMap.prototype.moveActor;
CE.TileMap.prototype.moveActor=function(a,dx,dy){
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/Math.min(this.tw/4,this.th/4,a.r||12)));
 let hit=false;for(let i=0;i<steps;i++)hit=originalMove.call(this,a,dx/steps,dy/steps)||hit;return hit;
};
// Lighter contour and material lighting for the existing ten scene renderers.
const baseCard=CE.card;
CE.card=function(ctx,x,y,w,h,r,fill,lw){
 const material=fill;
 baseCard(ctx,x,y,w,h,Math.min(r===undefined?7:r,8),material,lw===0?0:Math.min(lw||1.5,1.7));
 if(typeof fill==='string'&&/^#[0-9a-f]{6}$/i.test(fill)&&w>20&&h>15){ctx.save();ctx.strokeStyle='#ffffff35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+6,y+3);ctx.lineTo(x+w-6,y+3);ctx.stroke();ctx.restore();}
};
