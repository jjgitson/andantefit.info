// Focused regression checks for language routing and the lead form. No network requests.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function route(saved, languages, pathname = '/', blocked = false) {
  let result;
  const location = {pathname, search:'?req=doc', hash:'#materials', replace:value=>{result=value;}};
  vm.runInNewContext(read('js/language-manager.js'), {window:{location}, localStorage:{getItem:()=>{if(blocked)throw Error('blocked');return saved;}}, navigator:{languages}});
  return result;
}
assert.equal(route('jp', ['ko']), '/jp/index.html?req=doc#materials');
assert.equal(route(null, ['ja-JP']), '/jp/index.html?req=doc#materials');
assert.equal(route('en', ['ko']), undefined);
assert.equal(route(null, ['en-US','ko']), undefined);
assert.equal(route(null, ['ru-RU']), '/ru/index.html?req=doc#materials');
assert.equal(route('es', ['ko'], '/ko/product.html'), undefined);
assert.equal(route(null, ['ja-JP'], '/', true), '/jp/index.html?req=doc#materials');

async function formScenario(ok) {
  const listeners=[], attributes={}, events=[], errors=[];
  let submit,resolveFetch,requests=0;
  const button={disabled:false,textContent:'Send',style:{}};
  const field={value:'doc',tagName:'SELECT',querySelector:()=>({})};
  const panel={classList:{remove:()=>{panel.visible=true;}},focus:()=>{},scrollIntoView:()=>{}};
  const form={action:'https://example.invalid/form',querySelector:s=>s==='[name="request_type"]'?field:s==='button[type="submit"]'?button:null,querySelectorAll:()=>[],getAttribute:n=>n==='data-error-label'?'Localized error':null,setAttribute:(k,v)=>{attributes[k]=v;},removeAttribute:k=>{delete attributes[k];},addEventListener:(type,fn)=>{if(type==='submit')submit=fn;},appendChild:e=>errors.push(e)};
  const document={head:{appendChild:()=>{}},addEventListener:(type,fn)=>{if(type==="DOMContentLoaded")listeners.push(fn);},getElementById:id=>id==='materialsForm'?form:id==='formSuccess'?panel:null,querySelectorAll:()=>[],createElement:()=>({setAttribute:()=>{}})};
  const context={document,window:{location:{pathname:'/ko/product.html',search:'?req=doc'},gtag:(...args)=>events.push(args)},console:{log:()=>{}},URLSearchParams,CSS:{escape:s=>s},FormData:class{},fetch:()=>{requests++;return new Promise(r=>{resolveFetch=r;});}};
  vm.runInNewContext(read('js/main.js'),context);
  for(const fn of listeners)fn();
  submit({preventDefault:()=>{}});submit({preventDefault:()=>{}});
  assert.equal(requests,1,'duplicate submissions must be blocked');
  assert.equal(button.disabled,true);
  resolveFetch({ok});
  for(let i=0;i<8;i++)await Promise.resolve();
  assert.equal(attributes['aria-busy'],undefined);
  if(ok){assert.equal(panel.visible,true);assert.equal(events.filter(x=>x[1]==='generate_lead').length,1);}
  else {assert.equal(button.disabled,false);assert.equal(button.textContent,'Send');assert.equal(errors[0].textContent,'Localized error');assert.equal(events.length,0);}
}
(async()=>{
  await formScenario(true); await formScenario(false);
  for(const dir of ['','ko','es','jp','ru']){
    const product=read(path.join(dir,'product.html'));
    assert.match(product,/data-error-label="[^\"]+"/);
    assert.match(product,/id="formSuccess" role="status"/);
    for(const page of ['index','product','references','validation','case-studies']){
      const html=read(path.join(dir,page+'.html'));
      for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if(match[0].includes('application/ld+json')||!match[1].trim())continue;
        new vm.Script(match[1],{filename:path.join(dir,page+'.html')});
      }
    }
    const refs=read(path.join(dir,'references.html'));
    const total=(refs.match(/class="hospital-item"/g)||[]).length;
    assert.equal(Number(refs.match(/<div class="korea-metric">\s*<div class="label">[^<]*<\/div>\s*<div class="value">(\d+)/)[1]),total);
    assert.doesNotMatch(refs,/>80(?:\+|개|以上)/);
  }
  assert.doesNotMatch(read('js/main.js'),/injectCopyForAIButton/);
  console.log('Passed: language preferences, Japanese routing, query/hash preservation, success/error form states, duplicate-submit guard, confirmed-lead analytics, five-language inline-script syntax, and directory counts.');
})().catch(error=>{console.error(error);process.exitCode=1;});

