export const KEY = 'nousu-data-v1';
export const groups = ['Perusliikkeet', 'Extra 1', 'Extra 2'];
const rows = [
 ['Ylätalja',4,10,12,50,''],
 ['Olkavarren kierto',3,12,12,0,''],
 ['Rintaprässi',4,8,10,30,''],
 ['Selän ojennus',3,10,12,15,''],
 ['Jalkaprässi',4,10,12,160,''],
 ['Pohkeet',3,15,15,15,''],
 ['Maastaveto',4,10,10,60,''],
 ['Pystypunnerrus',4,8,10,17.5,''],
 ['Alatalja',4,10,12,40,''],
 ['Polven ojennus',4,10,12,65,''],
 ['Polven koukistus',3,10,12,50,''],
 ['Reiden loitonnus',3,10,12,65,''],
 ['Vatsarutistus',3,15,15,45,''],
 ['Yläsoutu alataljassa',3,10,12,22.5,'',1],
 ['Face-pull ylätaljassa',3,10,12,20,'',1],
 ['Ojentajat ylätalja',3,10,12,17.5,'',1],
 ['Vinopenkki käsip. 45°',4,10,12,14,'',2],
 ['Hauis käsip.',3,10,12,14,'',2],
 ['Peck-deck',3,10,12,40,'',2]
];
export const seed = () => ({ version:1, exercises:rows.map(([name,sets,min,max,weight,note,group=0],i)=>({id:`ex-${i}`,name,sets,min,max,weight,note,group:groups[group],step:weight>=100?5:2.5})), sessions:[], draft:null });
export const uid = () => crypto.randomUUID();
export const localDate = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function latest(sessions,id) { return sessions.flatMap(s=>s.exercises.filter(e=>e.id===id && e.sets.some(x=>x.done)).map(e=>({...e,date:s.date,savedAt:s.savedAt}))).sort((a,b)=>b.date.localeCompare(a.date)||(b.savedAt||'').localeCompare(a.savedAt||''))[0]; }
export function suggest(exercise,previous) {
 if(!previous) return {weight:exercise.weight,text:exercise.weight ? `Aloita ${exercise.weight.toLocaleString('fi-FI')} kg:lla ja hae ${exercise.min}–${exercise.max} hallittua toistoa.` : 'Käytä tuttua vastusta ja tee hallitut tavoitetoistot.',kind:'start'};
 const sets=previous.sets.filter(s=>s.done);
 const weight=Math.max(...sets.map(s=>s.weight));
 if(sets.length>=exercise.sets && sets.every(s=>s.reps>=exercise.max && s.weight===weight) && previous.effort==='easy') {
  if(weight===0) return {weight:0,text:'Tavoite täyttyi kevyesti. Voit kokeilla hieman vahvempaa nauhaa ja palata toistoalueen alkuun.',kind:'increase'};
  return {weight:weight+exercise.step,text:`Kokeile ${ (weight+exercise.step).toLocaleString('fi-FI')} kg ja aloita ${exercise.min} toistosta. Palaa edelliseen painoon, jos tekniikka kärsii.`,kind:'increase'};
 }
 if(previous.effort==='hard' || sets.some(s=>s.reps<exercise.min)) return {weight,text:'Pidä paino ennallaan. Hae ensin tavoitetoistot hyvällä tekniikalla; tarvittaessa kevennä.',kind:'hold'};
 return {weight,text:`Pidä vastus ja lisää seuraavalla kerralla yksi toisto sarjaan, kun se tuntuu hallitulta. Korota vasta kaikkien ${exercise.sets} sarjan saavutettua ${exercise.max} toistoa ja jäädessä varaa.`,kind:'reps'};
}
export function makeDraft(exercises,sessions) { return {id:uid(),date:localDate(),note:'',exercises:exercises.map(e=>{const previous=latest(sessions,e.id);const recommendation=suggest(e,previous);return {...e,note:previous?previous.note:e.note,effort:'normal',sets:Array.from({length:e.sets},()=>({weight:recommendation.weight,reps:e.min,done:false}))};})}; }
export function moveExercise(exercises,id,destination,group=null) {
 const selected=group===null?exercises:exercises.filter(e=>e.group===group);
 const from=selected.findIndex(e=>e.id===id);
 if(from<0 || selected.length<2) return exercises;
 const remaining=selected.filter(e=>e.id!==id);
 let to;
 if(destination==='first') to=0;
 else if(destination==='last') to=remaining.length;
 else if(destination.startsWith('after:')) {
  const target=remaining.findIndex(e=>e.id===destination.slice(6));
  if(target<0) return exercises;
  to=target+1;
 } else return exercises;
 remaining.splice(to,0,selected[from]);
 if(group===null) return remaining;
 let index=0;
 return exercises.map(e=>e.group===group?remaining[index++]:e);
}
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const text=(s,max)=>typeof s==='string'&&s.length<=max;
const validSet=s=>s&&finite(s.weight,0,2000)&&finite(s.reps,1,100)&&Number.isInteger(s.reps)&&typeof s.done==='boolean';
function validExercise(e,session=false) { return e&&text(e.id,100)&&text(e.name,100)&&e.name.trim()&&groups.includes(e.group)&&finite(e.min,1,100)&&finite(e.max,e.min,100)&&Number.isInteger(e.min)&&Number.isInteger(e.max)&&finite(e.weight,0,2000)&&finite(e.step,.25,100)&&text(e.note,500)&&(session?Array.isArray(e.sets)&&e.sets.length<=50&&e.sets.every(validSet)&&['easy','normal','hard'].includes(e.effort):Number.isInteger(e.sets)&&finite(e.sets,1,12)); }
function validSession(s) { return s&&text(s.id,100)&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&!Number.isNaN(Date.parse(s.date))&&text(s.note,3000)&&Array.isArray(s.exercises)&&s.exercises.length<=200&&s.exercises.every(e=>validExercise(e,true))&&new Set(s.exercises.map(e=>e.id)).size===s.exercises.length; }
export function validate(data) {
 if(!data||data.version!==1||!Array.isArray(data.exercises)||data.exercises.length>200||!data.exercises.every(e=>validExercise(e))||new Set(data.exercises.map(e=>e.id)).size!==data.exercises.length||!Array.isArray(data.sessions)||data.sessions.length>10000||!data.sessions.every(validSession)||(data.draft!==null&&!validSession(data.draft))) throw new Error('Varmuuskopion sisältö tai versio ei kelpaa.');
 return data;
}
