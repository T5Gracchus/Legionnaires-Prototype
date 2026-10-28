// Deterministic extraction, resizing and PNG packing only. All artwork is
// generated with the built-in image tool; this script never draws new artwork.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE||'C:/Users/TSGra/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=fileURLToPath(new URL('../assets/battle/',import.meta.url));
const exists=async path=>{try{await access(path);return true;}catch{return false;}};
const unitIds=['centurion','shield','sword','legionnaire','aer','bound','murr','krag','spear','sling','brute','healer','hexer','commander'];
const manifest={version:'0.9.0',units:{},props:{},textures:{},unitCanvas:{width:128,height:160,foot:[64,144]},propCanvas:{width:256,height:256,base:[128,224]},processing:'High-alpha bounds locate frames; source alpha is retained. Nearest-neighbor resize and palette PNG packing. Original atlases retained.'};
await mkdir(join(root,'units'),{recursive:true});await mkdir(join(root,'props'),{recursive:true});
function bounds(data,w,h,area,threshold=170){
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=area.top;y<area.top+area.height;y++)for(let x=area.left;x<area.left+area.width;x++)if(data[(y*w+x)*4+3]>=threshold){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)throw new Error('No opaque sprite pixels found');
  x0=Math.max(area.left,x0-3);y0=Math.max(area.top,y0-3);x1=Math.min(area.left+area.width-1,x1+3);y1=Math.min(area.top+area.height-1,y1+3);
  return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};
}
function rowBands(data,w,h){
  const runs=[],density=[];let start=null,last=-1;
  for(let y=0;y<h;y++){
    let count=0;for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=170)count++;
    density.push(count);
    if(count>1){if(start===null)start=y;last=y;}
    if(start!==null&&(y-last>12||y===h-1)){if(last-start>20)runs.push({top:start,height:last-start+1});start=null;}
  }
  if(runs.length!==3){
    // Wing tips can leave only a narrow gutter between the first two rows.
    // Locate the lowest-density horizontal seam near each nominal row boundary.
    const seam=(center,radius)=>{
      let best=Math.round(center),score=Infinity;
      for(let y=Math.floor(center-radius);y<=center+radius;y++){
        const value=density.slice(Math.max(0,y-2),y+3).reduce((a,b)=>a+b,0)+Math.abs(y-center)*.001;
        if(value<score){score=value;best=y;}
      }return best;
    };
    const a=seam(h/3,h*.10),b=seam(h*2/3,h*.10);
    return [{top:0,height:a},{top:a,height:b-a},{top:b,height:h-b}];
  }
  return runs;
}
async function place(source,box,dest,canvas,maxSize,anchor){
  const fitted=await sharp(source).extract(box).resize({width:maxSize[0],height:maxSize[1],fit:'inside',kernel:'nearest'}).toBuffer();
  const info=await sharp(fitted).metadata(),left=Math.round(anchor[0]-info.width/2),top=Math.round(anchor[1]-info.height);
  if(left<0||top<0)throw new Error('Invalid sprite anchor');
  await sharp({create:{width:canvas[0],height:canvas[1],channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:fitted,left,top}]).png({palette:true,colours:128,dither:0}).toFile(dest);
}
for(const id of unitIds){
  const source=join(root,'sources',`${id}-atlas.png`);if(!await exists(source)){console.log('Pending unit:',id);continue;}
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const rows=rowBands(data,info.width,info.height),frames={};
  for(const [i,direction] of ['se','sw','ne','nw','fallen'].entries()){
    const row=rows[i<4?Math.floor(i/2):2],col=i%2;
    const area={left:i===4?0:col*Math.floor(info.width/2),top:row.top,width:i===4?info.width:Math.floor(info.width/2),height:row.height};
    const box=bounds(data,info.width,info.height,area),filename=`${id}-${direction}.png`;
    await place(source,box,join(root,'units',filename),[128,160],direction==='fallen'?[116,78]:[id==='krag'||id==='brute'?120:112,136],[64,144]);
    frames[direction]={file:`units/${filename}`,sourceBox:box};
  }
  manifest.units[id]={source:`sources/${id}-atlas.png`,sourceSize:[info.width,info.height],frames};console.log('Packed unit:',id,JSON.stringify(rows));
}
for(const id of ['tree','rubble','wagon','casualty','extraction','relay','salvage','captive','enforcer','control-spire','ferry-beacon','generator','escort-cart','archive','sluice','barricade','barricade-broken']){
  const source=join(root,'sources',`${id}-prop.png`),working=join(root,'props',`${id}.png`);
  if(!await exists(source)&&await exists(working))await copyFile(working,source);
  if(!await exists(source)){console.log('Pending prop:',id);continue;}
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true}),box=bounds(data,info.width,info.height,{left:0,top:0,width:info.width,height:info.height});
  const output=id==='enforcer'?join(root,'enforcer.png'):working;
  await place(source,box,output,id==='enforcer'?[256,320]:[256,256],id==='enforcer'?[236,278]:[232,216],id==='enforcer'?[128,288]:[128,224]);
  manifest.props[id]={source:`sources/${id}-prop.png`,file:id==='enforcer'?'enforcer.png':`props/${id}.png`,sourceBox:box};
}
for(const id of ['reedwater-ground','basalt-ground','spores-ground','water']){
  const working=join(root,'terrain',`${id}.png`),source=join(root,'sources',`${id}-texture.png`);
  if(!await exists(source)&&await exists(working))await copyFile(working,source);
  if(!await exists(source)){console.log('Pending texture:',id);continue;}
  const output=await sharp(source).resize(256,256,{kernel:'nearest'}).png({palette:true,colours:128,dither:0}).toBuffer();await writeFile(working,output);
  manifest.textures[id]={source:`sources/${id}-texture.png`,file:`terrain/${id}.png`,size:[256,256]};
}
await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Packed ${Object.keys(manifest.units).length} archetypes, ${Object.keys(manifest.props).length} props, ${Object.keys(manifest.textures).length} textures.`);
