import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,suggest,makeDraft,validate,latest,moveExercise} from '../model.js';
test('all 19 original exercises and groups survive validation',()=>{const data=seed();assert.equal(data.exercises.length,19);assert.deepEqual([13,3,3],['Perusliikkeet','Extra 1','Extra 2'].map(g=>data.exercises.filter(e=>e.group===g).length));assert.equal(validate(JSON.parse(JSON.stringify(data))).version,1);});
test('weight increases only with every target set at maximum and reserve',()=>{const e=seed().exercises[0];const previous={sets:Array.from({length:4},()=>({weight:50,reps:12,done:true})),effort:'easy'};assert.equal(suggest(e,previous).weight,52.5);assert.equal(suggest(e,{...previous,effort:'normal'}).weight,50);assert.equal(suggest(e,{...previous,sets:previous.sets.slice(1)}).weight,50);assert.equal(suggest(e,{...previous,effort:'hard'}).kind,'hold');assert.equal(suggest(e,{...previous,sets:[{weight:50,reps:8,done:true}]}).kind,'hold');});
test('mixed weights cannot trigger increase and unchecked sets do not count',()=>{const e=seed().exercises[0],sets=[50,55,55,55].map(weight=>({weight,reps:12,done:true}));assert.notEqual(suggest(e,{sets,effort:'easy'}).kind,'increase');sets[0]={weight:55,reps:12,done:false};assert.notEqual(suggest(e,{sets,effort:'easy'}).kind,'increase');});
test('draft preserves snapshots and previous suggestions',()=>{const data=seed(),e=data.exercises[0];const draft=makeDraft([e],[]);data.draft=draft;assert.equal(validate(data),data);e.name='Changed';assert.equal(draft.exercises[0].name,'Ylätalja');assert.equal(draft.exercises[0].sets.length,4);assert.ok(draft.exercises[0].sets.every(s=>!s.done));});
test('latest sorts by training date rather than insertion order',()=>{const e=seed().exercises[0],a=makeDraft([e],[]),b=makeDraft([e],[]);a.date='2026-09-10';b.date='2026-09-01';a.exercises[0].sets[0].done=b.exercises[0].sets[0].done=true;assert.equal(latest([a,b],e.id).date,a.date);});
test('malformed imports are rejected before replacing stored data',()=>{for(const mutate of [d=>d.exercises[0].sets=0,d=>d.exercises[0].max=1,d=>d.exercises[0].weight=-1,d=>d.exercises.push({...d.exercises[0]}),d=>d.version=2,d=>d.draft={bad:true}]){const d=seed();mutate(d);assert.throws(()=>validate(d));}});
test('notes come from the latest performed exercise, matched by id',()=>{
 const data=seed(),e=data.exercises[0],older=makeDraft([e],[]),newer=makeDraft([e],[]);
 older.date='2026-09-01';newer.date='2026-09-10';
 older.exercises[0].note='Vanhempi teksti';newer.exercises[0].note='Penkki 3\nRauhallinen lasku';
 older.exercises[0].sets[0].done=newer.exercises[0].sets[0].done=true;
 const before=JSON.stringify([data,older,newer]);
 const draft=makeDraft([{...e,name:'Uusi nimi'}],[newer,older]);
 assert.equal(draft.exercises[0].note,'Penkki 3\nRauhallinen lasku');
 draft.exercises[0].note='Tämän päivän muutos';
 assert.equal(JSON.stringify([data,older,newer]),before);
});
test('blank previous notes stay blank and only a missing performance falls back to program',()=>{
 const e=seed().exercises[0],session=makeDraft([e],[]);
 assert.equal(session.exercises[0].note,e.note);
 session.exercises[0].note='';session.exercises[0].sets[0].done=true;
 assert.equal(makeDraft([e],[session]).exercises[0].note,'');
 session.exercises[0].sets[0].done=false;
 assert.equal(makeDraft([e],[session]).exercises[0].note,e.note);
});
test('same-day note selection uses save time',()=>{
 const e=seed().exercises[0],a=makeDraft([e],[]),b=makeDraft([e],[]);
 a.savedAt='2026-11-08T08:00:00Z';b.savedAt='2026-11-08T12:00:00Z';
 a.exercises[0].note='Aamu';b.exercises[0].note='Ilta';
 a.exercises[0].sets[0].done=b.exercises[0].sets[0].done=true;
 assert.equal(makeDraft([e],[b,a]).exercises[0].note,'Ilta');
});
test('existing backup and in-progress notes round-trip without migration or new fields',()=>{
 const data=seed();data.sessions=[makeDraft([data.exercises[0]],[])];
 data.sessions[0].exercises[0].sets[0].done=true;
 data.draft=makeDraft([data.exercises[0]],data.sessions);
 data.draft.exercises[0].note='Luonnoksen oma teksti';
 const serialized=JSON.stringify(data),restored=validate(JSON.parse(serialized));
 assert.equal(JSON.stringify(restored),serialized);
 assert.deepEqual(Object.keys(restored.draft.exercises[0]).sort(),Object.keys(data.sessions[0].exercises[0]).sort());
 restored.draft.exercises[0].note='x'.repeat(500);assert.equal(validate(restored),restored);
 restored.draft.exercises[0].note+='x';assert.throws(()=>validate(restored));
});
test('moves first, last and after a target from either direction without changing exercises',()=>{
 const items=seed().exercises.slice(0,4),before=JSON.stringify(items);
 const ids=items=>items.map(e=>e.id);
 assert.deepEqual(ids(moveExercise(items,'ex-3','first')),['ex-3','ex-0','ex-1','ex-2']);
 assert.deepEqual(ids(moveExercise(items,'ex-0','last')),['ex-1','ex-2','ex-3','ex-0']);
 assert.deepEqual(ids(moveExercise(items,'ex-0','after:ex-2')),['ex-1','ex-2','ex-0','ex-3']);
 assert.deepEqual(ids(moveExercise(items,'ex-3','after:ex-0')),['ex-0','ex-3','ex-1','ex-2']);
 assert.deepEqual(ids(moveExercise(items,'ex-1','after:ex-0')),ids(items));
 assert.equal(JSON.stringify(items),before);
 for(const e of moveExercise(items,'ex-0','last'))assert.equal(e,items.find(x=>x.id===e.id));
});
test('program moves stay within their group even when group entries are interleaved',()=>{
 const data=seed(),items=[data.exercises[0],data.exercises[13],data.exercises[1],data.exercises[16],data.exercises[2]],before=JSON.stringify(items);
 const moved=moveExercise(items,'ex-2','first','Perusliikkeet');
 assert.deepEqual(moved.map(e=>e.id),['ex-2','ex-13','ex-0','ex-16','ex-1']);
 assert.equal(moved[1],items[1]);assert.equal(moved[3],items[3]);
 assert.equal(moveExercise(items,'ex-0','after:ex-13','Perusliikkeet'),items);
 assert.equal(JSON.stringify(items),before);
});
test('invalid destinations and missing or sole exercises leave the list intact',()=>{
 const items=seed().exercises;
 for(const destination of ['', 'bad','after:missing','after:ex-0'])assert.equal(moveExercise(items,'ex-0',destination),items);
 assert.equal(moveExercise(items,'missing','first'),items);
 const single=items.slice(0,1);assert.equal(moveExercise(single,'ex-0','last'),single);
 const empty=[];assert.equal(moveExercise(empty,'ex-0','first'),empty);
});
test('reordering drafts preserves all records and exports while program moves affect only new drafts',()=>{
 const data=seed();data.sessions=[makeDraft(data.exercises,[])];data.sessions[0].exercises[0].sets[0].done=true;
 data.draft=makeDraft(data.exercises,data.sessions);data.draft.exercises[0].note='Oma teksti';data.draft.exercises[0].sets[0]={weight:52.5,reps:11,done:true};data.draft.exercises[0].effort='hard';
 const history=JSON.stringify(data.sessions),draftBefore=JSON.stringify(data.draft),records=new Map(data.draft.exercises.map(e=>[e.id,JSON.stringify(e)]));
 data.exercises=moveExercise(data.exercises,'ex-2','first','Perusliikkeet');
 assert.equal(JSON.stringify(data.draft),draftBefore);
 assert.equal(makeDraft(data.exercises,data.sessions).exercises[0].id,'ex-2');
 data.draft.exercises=moveExercise(data.draft.exercises,'ex-0','last');
 for(const e of data.draft.exercises)assert.equal(JSON.stringify(e),records.get(e.id));
 assert.equal(JSON.stringify(data.sessions),history);
 assert.deepEqual(validate(JSON.parse(JSON.stringify(data))),data);
 assert.equal(latest(data.sessions,'ex-0').note,data.sessions[0].exercises[0].note);
});
