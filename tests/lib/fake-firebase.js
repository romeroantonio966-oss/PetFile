// Firebase simulado en memoria/localStorage: nunca toca la red.
(function(){
const LS=localStorage;const load=(k,d)=>{try{return JSON.parse(LS.getItem(k))||d}catch(e){return d}};
let db=load('FK_DB',{});let users=load('FK_USERS',{});
const save=()=>{LS.setItem('FK_DB',JSON.stringify(db));LS.setItem('FK_USERS',JSON.stringify(users))};
const subs=new Set();const notify=()=>{[...subs].forEach(f=>{try{f()}catch(e){console.error(e)}})};
window.addEventListener('storage',e=>{if(e.key==='FK_DB'&&!offline){db=load('FK_DB',{});notify()}});
const hyd=v=>{if(Array.isArray(v))return v.map(hyd);if(v&&typeof v==='object'){if('__ts' in v){const ms=v.__ts;return{toDate:()=>new Date(ms),toMillis:()=>ms}}const o={};for(const k in v)o[k]=hyd(v[k]);return o}return v};
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.keys(v).sort().reduce((o,k)=>(o[k]=canon(v[k]),o),{}):v;const eq=(a,b)=>JSON.stringify(canon(a))===JSON.stringify(canon(b));
const FV={serverTimestamp:()=>({__fv:'ts'}),arrayUnion:(...a)=>({__fv:'u',a}),arrayRemove:(...a)=>({__fv:'r',a}),delete:()=>({__fv:'d'})};
const applyV=(cur,v)=>{if(v&&v.__fv==='ts')return{__ts:Date.now()};if(v&&v.__fv==='u'){const o=[...(cur||[])];v.a.forEach(x=>{if(!o.some(y=>eq(x,y)))o.push(x)});return o}if(v&&v.__fv==='r')return(cur||[]).filter(x=>!v.a.some(y=>eq(x,y)));
 if(v&&v.toDate)return{__ts:v.toDate().getTime()};if(v&&typeof v==='object'&&!Array.isArray(v)&&!('__ts' in v)){const o={};for(const k in v)if(!(v[k]&&v[k].__fv==='d'))o[k]=applyV(undefined,v[k]);return o}return v};
const deny=(op,path)=>{if(window.__deny&&window.__deny(op,path)){const e=new Error('denied');e.code='permission-denied';throw e}};
const write=(path,data,mode)=>{deny(mode,path);window.__writes=(window.__writes||[]);window.__writes.push({mode,path});
 if(mode==='delete'){delete db[path];return}
 if(mode==='update'&&!db[path]){const e=new Error('nf');e.code='not-found';throw e}
 const base=mode==='set'?{}:JSON.parse(JSON.stringify(db[path]));
 for(const k in data){const parts=mode==='update'?k.split('.'):[k];let o=base;for(let i=0;i<parts.length-1;i++){o=o[parts[i]]=o[parts[i]]||{}}const l=parts[parts.length-1];if(data[k]&&data[k].__fv==='d')delete o[l];else o[l]=applyV(o[l],data[k])}
 db[path]=base};
const snap=(path)=>({id:path.split('/').pop(),ref:docRef(path),exists:!!db[path],metadata:{hasPendingWrites:false},data:()=>db[path]?hyd(JSON.parse(JSON.stringify(db[path]))):undefined,get:k=>db[path]?hyd(db[path][k]):undefined});
/* Como el servidor: cada lote se aplica completo o no se aplica, sobre los datos más recientes. Sin conexión queda en cola y se ve solo en este dispositivo. */
let offline=false;const queue=[];
const runBatch=ops=>{const bak=JSON.stringify(db);try{ops.forEach(o=>write(...o))}catch(e){db=JSON.parse(bak);throw e}};
const exec=ops=>{if(offline){try{runBatch(ops)}catch(e){return Promise.reject(e)}setTimeout(notify,0);return new Promise((res,rej)=>queue.push({ops,res,rej}))}db=load('FK_DB',{});try{runBatch(ops)}catch(e){return Promise.reject(e)}save();setTimeout(notify,0);return Promise.resolve()};
window.__fkNet=on=>{if(!on){offline=true;return}offline=false;db=load('FK_DB',{});queue.splice(0).forEach(q=>{try{runBatch(q.ops);q.res()}catch(e){q.rej(e)}});save();setTimeout(notify,0)};
function docRef(path){return{path,id:path.split('/').pop(),
 collection:c=>colRef(path+'/'+c),
 get:async()=>{deny('get',path);return snap(path)},
 set:d=>exec([[path,d,'set']]),update:d=>exec([[path,d,'update']]),delete:()=>exec([[path,null,'delete']]),
 onSnapshot:(n,e)=>{let last='#';const f=()=>{try{deny('get',path)}catch(x){e&&e(x);return}const j=JSON.stringify(db[path])||'null';if(j!==last){last=j;n(snap(path))}};subs.add(f);setTimeout(f,0);return()=>subs.delete(f)}}}
function colRef(path){const q=()=>Object.keys(db).filter(k=>k.startsWith(path+'/')&&!k.slice(path.length+1).includes('/'));return{path,doc:i=>docRef(path+'/'+(i||Math.random().toString(36).slice(2))),
 get:async()=>({docs:q().map(snap),empty:!q().length}),where:()=>colRef(path),limit:()=>colRef(path),orderBy:()=>colRef(path),
 onSnapshot:(n,e)=>{let last;const f=()=>{try{deny('get',path)}catch(x){e&&e(x);return}const ks=q();const j=JSON.stringify(ks.map(k=>db[k]));if(j!==last){last=j;n({docs:ks.map(snap),empty:!ks.length,size:ks.length})}};subs.add(f);setTimeout(f,0);return()=>subs.delete(f)}}}
const fs=()=>fsI;const fsI={collection:colRef,batch:()=>{const ops=[];const b={set:(r,d)=>{ops.push([r.path,d,'set']);return b},update:(r,d)=>{ops.push([r.path,d,'update']);return b},delete:r=>{ops.push([r.path,null,'delete']);return b},commit:()=>exec(ops)};return b},enablePersistence:async()=>{},clearPersistence:async()=>{window.__clearedPersistence=true}};fs.FieldValue=FV;
const mkUser=u=>u&&({uid:u.uid,email:u.email,displayName:u.name,emailVerified:false,getIdToken:async()=>'TOKEN-'+u.uid,updateProfile:async o=>{u.name=o.displayName;save()}});
let cur=sessionStorage.getItem('FK_UID');const ls=new Set();const emit=()=>{const u=cur&&Object.values(users).find(x=>x.uid===cur);ls.forEach(f=>f(mkUser(u)||null))};
const err=c=>{const e=new Error(c);e.code='auth/'+c;return e};
const authI={languageCode:null,onAuthStateChanged:f=>{ls.add(f);setTimeout(()=>{const u=cur&&Object.values(users).find(x=>x.uid===cur);f(mkUser(u)||null)},0);return()=>ls.delete(f)},
 signInWithEmailAndPassword:async(e,p)=>{if(window.__netDown)throw err('network-request-failed');if(!/@/.test(e))throw err('invalid-email');const u=users[e];if(!u||u.pw!==p)throw err('invalid-credential');cur=u.uid;sessionStorage.setItem('FK_UID',cur);emit();return{user:mkUser(u)}},
 createUserWithEmailAndPassword:async(e,p)=>{if(!/@.+\./.test(e))throw err('invalid-email');if(users[e])throw err('email-already-in-use');if(p.length<6)throw err('weak-password');const u={uid:'u'+Math.random().toString(36).slice(2,9),email:e,pw:p,name:''};users[e]=u;save();cur=u.uid;sessionStorage.setItem('FK_UID',cur);emit();return{user:mkUser(u)}},
 signOut:async()=>{cur=null;sessionStorage.removeItem('FK_UID');emit()},sendPasswordResetEmail:async e=>{if(!/@/.test(e))throw err('invalid-email');window.__reset=e}};
window.firebase={initializeApp:()=>({}),apps:[1],auth:()=>authI,firestore:fs,storage:()=>({ref:()=>({})})};
window.__fk={get db(){return db},reload:()=>{db=load('FK_DB',{});notify()}};
})();
