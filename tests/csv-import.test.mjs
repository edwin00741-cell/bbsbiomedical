import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,toCsv} from '../lib/bbs-control/csv.ts';
import {monthlyIncome,invoiceBalance} from '../lib/bbs-control/dashboard.ts';
test('CSV preserves BOM, embedded delimiters, newlines and escaped quotes',()=>{
 assert.deepEqual(parseCsv('\uFEFFname,description\r\n"A, B","One\nTwo ""quoted"""'),[['name','description'],['A, B','One\nTwo "quoted"']]);
 assert.deepEqual(parseCsv('name;price\nServicio;10.50',';'),[['name','price'],['Servicio','10.50']]);
 assert.throws(()=>parseCsv('name\n"unfinished'),/comillas/);
 assert.throws(()=>parseCsv('name\n"closed"illegal'),/Carácter/);
});
test('CSV exports neutralize formula strings and preserve negative numeric values',()=>{
 const csv=toCsv([['=HYPERLINK("x")',' @SUM(A1)',-12.5,'line\nnext']]);
 assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes("' @SUM"));assert.ok(csv.includes('-12.5'));assert.ok(csv.includes('"line\nnext"'));
});
test('cash timestamps on current accounting day are counted once; credits settle debt separately',()=>{
 const income=monthlyIncome('2026-10-26',[{amount:150,date:'2026-10-26T00:00:00Z',status:'completed'}],[{amount:20,date:'2026-10-26T00:00:00Z',status:'completed'}]);
 assert.equal(income.at(-1).amount,130);assert.equal(invoiceBalance({total:100,amount_paid:60,amount_credited:40}),0);
});
