// Lossless synchronous block compression keeps the existing storage API atomic.
// SS-LZ4-v1: UTF-8 JSON -> bounded LZ4 block -> base64, with byte length + CRC32.
// No external library, asynchronous storage, secondary production key or log pruning.
export const SAVE_ENCODING='ss-lz4-base64-v1';
export const MAX_SAVE_BYTES=64*1024*1024;
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(bytes){let crc=0xffffffff;for(let i=0;i<bytes.length;i++)crc=crcTable[(crc^bytes[i])&255]^(crc>>>8);return ((crc^0xffffffff)>>>0).toString(16).padStart(8,'0');}
export function compressBlock(input){
 const n=input.length;if(n>MAX_SAVE_BYTES)throw Error('Save exceeds supported size');
 const out=new Uint8Array(n+Math.ceil(n/255)+32),table=new Int32Array(65536);table.fill(-1);let at=0,anchor=0,i=0;
 const hash=p=>Math.imul((input[p]|input[p+1]<<8|input[p+2]<<16|input[p+3]<<24),0x9e3779b1)>>>16;
 const extra=n=>{while(n>=255){out[at++]=255;n-=255;}out[at++]=n;};
 while(i+12<=n){
  const h=hash(i),ref=table[h];table[h]=i;
  if(ref<0||i-ref>65535||input[ref]!==input[i]||input[ref+1]!==input[i+1]||input[ref+2]!==input[i+2]||input[ref+3]!==input[i+3]){i++;continue;}
  let length=4;while(i+length<n-5&&input[ref+length]===input[i+length])length++;
  const literals=i-anchor,match=length-4;out[at++]=(Math.min(15,literals)<<4)|Math.min(15,match);
  if(literals>=15)extra(literals-15);out.set(input.subarray(anchor,i),at);at+=literals;
  const distance=i-ref;out[at++]=distance&255;out[at++]=distance>>>8;if(match>=15)extra(match-15);
  i+=length;anchor=i;if(i>=2&&i+2<n)table[hash(i-2)]=i-2;
 }
 const literals=n-anchor;out[at++]=Math.min(15,literals)<<4;if(literals>=15)extra(literals-15);out.set(input.subarray(anchor),at);at+=literals;
 return out.slice(0,at);
}
export function decompressBlock(input,size){
 if(!Number.isSafeInteger(size)||size<0||size>MAX_SAVE_BYTES)throw Error('Invalid decoded size');
 const out=new Uint8Array(size);let i=0,at=0;
 const length=n=>{if(n===15){let byte;do{if(i>=input.length)throw Error('Truncated length');byte=input[i++];n+=byte;if(n>size)throw Error('Decoded length overflow');}while(byte===255);}return n;};
 while(i<input.length){
  const token=input[i++],literals=length(token>>>4);if(i+literals>input.length||at+literals>size)throw Error('Invalid literals');out.set(input.subarray(i,i+literals),at);i+=literals;at+=literals;
  if(i===input.length)break;if(i+2>input.length)throw Error('Truncated offset');const distance=input[i++]|input[i++]<<8;
  if(!distance||distance>at)throw Error('Invalid match offset');const match=length(token&15)+4;if(at+match>size)throw Error('Decoded match overflow');
  for(let end=at+match;at<end;at++)out[at]=out[at-distance];
 }
 if(at!==size)throw Error('Decoded size mismatch');return out;
}
const toBase64=bytes=>{if(typeof bytes.toBase64==='function')return bytes.toBase64();let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);};
const fromBase64=text=>{if(typeof text!=='string'||text.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw Error('Invalid base64');if(typeof Uint8Array.fromBase64==='function')return Uint8Array.fromBase64(text);const binary=atob(text),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;};
export function encodeSave(value){const bytes=new TextEncoder().encode(JSON.stringify(value));return JSON.stringify({saveVersion:value.saveVersion,storageEncoding:SAVE_ENCODING,byteLength:bytes.length,crc32:crc32(bytes),payload:toBase64(compressBlock(bytes))});}
export function decodeSave(raw){
 const outer=JSON.parse(raw);if(!outer||outer.storageEncoding===undefined)return outer;
 try{
  if(outer.storageEncoding!==SAVE_ENCODING||typeof outer.crc32!=='string'||!/^[a-f0-9]{8}$/.test(outer.crc32))throw Error('Unsupported save encoding');
  const bytes=decompressBlock(fromBase64(outer.payload),outer.byteLength);if(crc32(bytes)!==outer.crc32)throw Error('Save checksum mismatch');
  const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(value?.saveVersion!==outer.saveVersion)throw Error('Save header mismatch');return value;
 }catch(error){error.packedSave=true;throw error;}
}
