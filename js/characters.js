/* Character presentation only. Feet origin, dimensions, collision and game rules are unchanged. */
'use strict';
CE.portraitKeys=['narr','you','chief','cat','aunt','lib','clock','bot','worker','painter','eng','light'];
const portraitImage=new Image();
const portraitReady=new Promise(resolve=>{portraitImage.onload=()=>resolve(true);portraitImage.onerror=()=>resolve(false);portraitImage.src='assets/portraits.png';});
CE.artReady=Promise.all([CE.artReady,portraitReady]);
CE.renderPortrait=function(key){const el=document.getElementById('dlgAvatar');let i=CE.portraitKeys.indexOf(key);if(i<0)i=0;const ch=CE.chars[CE.portraitKeys[i]];el.textContent='';el.classList.add('character-portrait');el.setAttribute('role','img');el.setAttribute('aria-label',ch.n+'的角色肖像');el.style.backgroundColor='#16283c';if(portraitImage.naturalWidth){el.style.backgroundImage='url("assets/portraits.png")';el.style.backgroundSize='400% 300%';el.style.backgroundPosition=((i%4)/3*100)+'% '+(Math.floor(i/4)/2*100)+'%';}else{el.style.backgroundImage='none';el.textContent=ch.n;} };
// Cached eight-frame walk cycle. Drawing coordinates remain anchored at the feet.
const girlFrames=[];
function girlFrame(n){
 if(girlFrames[n])return girlFrames[n];
 const a=document.createElement('canvas');a.width=48;a.height=80;
 const c=a.getContext('2d');c.translate(24,73);
 const phase=n/8*Math.PI*2,step=Math.round(Math.sin(phase)*2),sway=Math.round(Math.sin(phase)),bob=Math.abs(step)===2?1:0;
 const p=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 const shape=(points,col)=>{c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 // Footprint and alternating short boots.
 p(-11,0,23,2,'#10203655');
 p(-6,-18,5,14+step,'#e1bc9c');p(2,-18,5,14-step,'#f3d5b4');
 p(-6,-12+step,5,7,'#eee5d1');p(2,-12-step,5,7,'#eee5d1');
 p(-7,-7+step,6,7,'#584344');p(2,-7-step,6,7,'#584344');
 p(-8,-2+step,8,2,'#302d3c');p(2,-2-step,9,2,'#302d3c');
 p(-6,-6+step,2,3,'#b58a65');p(3,-6-step,2,3,'#b58a65');
 c.translate(0,-bob);
 // Layered chestnut hair: stepped silhouette and warm reflected light.
 shape([[-8,-60],[-5,-64],[5,-64],[9,-61],[10,-52],[9,-45],[11+sway,-34],[7+sway,-31],[-8+sway,-33],[-10,-42],[-10,-55]],'#342c3d');
 shape([[-7,-60],[-3,-62],[5,-62],[8,-58],[7,-48],[9+sway,-35],[5+sway,-34],[-6+sway,-35],[-8,-46]],'#684547');
 p(-7,-56,2,13,'#97604f');p(-6+sway,-42,2,7,'#97604f');p(6,-53,2,13,'#4a3440');
 // Cream blouse and fitted bodice, distinct from the hair.
 p(-3,-46,6,5,'#dcaa8c');
 shape([[-4,-44],[-8,-42],[-10,-36],[-7,-32],[7,-32],[10,-36],[8,-42],[4,-44]],'#e9dec3');
 p(-7,-40,3,7,'#fff0d3');p(5,-40,3,7,'#fff0d3');
 p(-10,-35+step,4,9,'#d8ac92');p(7,-35-step,4,9,'#edc7a5');
 p(-10,-36+step,4,3,'#fcf0d8');p(7,-36-step,4,3,'#fcf0d8');
 // High-waist teal dress, subtle folds and ivory hem.
 shape([[-6,-40],[-3,-39],[3,-39],[6,-40],[6,-30],[10+sway,-19],[8+sway,-17],[-8+sway,-17],[-10+sway,-19],[-6,-30]],'#254753');
 shape([[-4,-39],[4,-39],[4,-30],[8+sway,-20],[6+sway,-18],[-7+sway,-18],[-8+sway,-20],[-4,-30]],'#478780');
 p(-5,-41,2,9,'#36706e');p(4,-41,2,9,'#36706e');
 shape([[-3,-29],[-1,-29],[-2+sway,-20],[-5+sway,-20]],'#75ada0');
 shape([[2,-29],[4,-29],[6+sway,-20],[3+sway,-20]],'#326764');
 p(-7+sway,-19,14,1,'#b0cbb1');p(-5,-31,11,2,'#d4b476');p(0,-31,2,2,'#fff0bd');
 // Small side satchel, kept clear of the face and silhouette.
 for(let i=0;i<9;i++)p(-5+i,-42+i,2,2,'#9e7355');
 p(6,-30,6,8,'#543e3d');p(7,-30,5,6,'#b88459');p(7,-30,5,2,'#dab483');p(9,-27,1,2,'#f6df9b');
 // Soft face, shaped fringe and tiny rather than oversized eyes.
 shape([[-6,-57],[-3,-60],[4,-60],[7,-56],[6,-49],[3,-46],[-2,-46],[-6,-49]],'#e5b797');
 p(-4,-56,9,6,'#f3cfad');p(-2,-50,6,3,'#f3cfad');
 shape([[-8,-57],[-6,-61],[-2,-63],[4,-62],[7,-59],[7,-55],[4,-56],[1,-59],[-2,-56],[-6,-54],[-6,-49],[-8,-51]],'#684547');
 p(-4,-61,7,1,'#ae795e');p(-6,-59,4,1,'#95614e');p(-7,-56,2,5,'#885545');
 p(-3,-53,2,2,'#393544');p(3,-53,2,2,'#393544');p(-3,-53,1,1,'#fff6da');p(3,-53,1,1,'#fff6da');
 p(-5,-50,2,1,'#d99187');p(5,-50,1,1,'#d99187');p(0,-48,2,1,'#bb7d75');
 // Ivory ribbon at the temple and collar, a recognizable small-scale accent.
 p(7,-57,3,2,'#f6e9c8');p(8,-59,3,2,'#e5d5b2');p(9,-55,2,5,'#ead9b5');
 p(-3,-44,3,2,'#fff4dd');p(2,-44,3,2,'#fff4dd');p(0,-43,2,3,'#bb795c');
 return girlFrames[n]=a;
}
CE.drawHero=function(c,x,y,opts){const o=opts||{},frame=Math.floor((((o.walk||0)%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2)*8)%8;const s=o.scale||1;c.save();c.translate(Math.round(x),Math.round(y));c.scale((o.dir===-1?-1:1)*s,s);c.imageSmoothingEnabled=false;c.drawImage(girlFrame(frame),-24,-73);c.restore();};
// More detailed tabby sprite, keeping the existing foot anchor and animation signature.
CE.drawCat=function(c,x,y,color,t){c.save();c.translate(Math.round(x),Math.round(y));const bob=Math.sin((t||0)*2)>0?0:1;function p(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y-bob,w,h);}p(-14,0,28,3,'#11243655');p(-10,-17,23,16,'#c58c54');p(-9,-5,7,6,'#f0d2a2');p(6,-5,6,6,'#f0d2a2');p(13,-16,5,8,'#a46d43');p(16,-24,4,10,'#d2a064');p(-12,-32,24,21,'#dda76d');p(-12,-40,7,11,'#b37b50');p(5,-40,7,11,'#b37b50');p(-10,-37,3,6,'#e6b2a0');p(7,-37,3,6,'#e6b2a0');p(-3,-32,3,6,'#90643f');p(-8,-30,3,3,'#a27042');p(6,-30,3,3,'#a27042');p(-7,-25,5,3,'#9bbd86');p(3,-25,5,3,'#9bbd86');p(-5,-25,1,3,'#263633');p(5,-25,1,3,'#263633');p(-5,-21,12,8,'#efe0bd');p(0,-21,3,2,'#b1807b');p(-9,-14,19,3,'#355f67');p(0,-12,3,3,'#e1bd73');p(-16,-20,9,1,'#d6c7a5');p(9,-20,9,1,'#d6c7a5');c.restore();};
