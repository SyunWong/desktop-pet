// Exercise LandingPage's own lifecycle against mocked SDK/network boundaries.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import ts from 'typescript';
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/LandingPage.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise, resolve, reject}; };
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness({ login, subscribe } = {}) {
  let cursor = 0, requests = 0;
  const slots = [], effects = [], clients = [], setters = [];
  const react = {
    useState(initial) { const i=cursor++; if (!(i in slots)) slots[i]=initial; return [slots[i], value => { slots[i]=typeof value==='function'?value(slots[i]):value; setters.push(i); }]; },
    useRef(initial) { const i=cursor++; return slots[i] ||= {current:initial}; },
    useEffect(fn) { const i=cursor++; effects[i] ||= {fn}; },
    useCallback(fn) { cursor++; return fn; }, Suspense:'Suspense',
  };
  class RTM {
    constructor() { this.logins=0;this.subscriptions=0;this.logouts=0;clients.push(this); }
    async login({token}) { assert.equal(token,'test-token');this.logins++;if(login)await login(); }
    async subscribe(channel) { assert.equal(channel,'test-channel');this.subscriptions++;if(subscribe)await subscribe(); }
    async logout() { this.logouts++; }
  }
  const testModule = {exports:{}};
  const requireMock = name => {
    if (name==='react') return react;
    if (name==='react/jsx-runtime') return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
    if (name==='next/dynamic') return ()=>'Dynamic';
    if (name==='agora-rtm') return {RTM};
    if (name==='agora-rtc-react') return {};
    return {Pet:'Pet',ErrorBoundary:'ErrorBoundary'};
  };
  vm.runInNewContext(source, {module:testModule,exports:testModule.exports,require:requireMock,
    process:{env:{NEXT_PUBLIC_AGORA_APP_ID:'test-app'}}, console:{warn(){},error(){}},
    fetch:async()=>{requests++;return {ok:true,json:async()=>({uid:'123',token:'test-token',channel:'test-channel'})};},
  });
  const render = () => {cursor=0;return testModule.exports.default();};
  const mount = () => {render();effects.forEach(e=>{e.cleanup=e.fn();});};
  const unmount = () => effects.forEach(e=>e.cleanup?.());
  const start = () => render().props.children.props.onClick();
  const findCall = node => node?.props?.onEndConversation ? node.props : findCall(node?.props?.children);
  return {render,mount,unmount,start,clients,setters,get requests(){return requests;},end:()=>findCall(render()).onEndConversation(),strictReplay:()=>{unmount();effects.forEach(e=>{e.cleanup=e.fn();});}};
}
(async()=>{
  // Two clicks before React can rerender must create only one connection.
  const gate=deferred();const a=harness({login:()=>gate.promise});a.mount();const p=a.start();const duplicate=a.start();await tick();
  assert.equal(a.requests,1);assert.equal(a.clients.length,1);gate.resolve();await Promise.all([p,duplicate]);
  assert.equal(a.clients[0].subscriptions,1);await a.end();assert.equal(a.clients[0].logouts,1);

  // Partial initialization must be released; a retry gets a fresh client.
  let failures=0;const b=harness({subscribe:()=>{if(failures++===0)throw Error('network');}});b.mount();await b.start();
  assert.equal(b.clients[0].logouts,1);assert.match(b.render().props.label,/Could not start the chat/);await b.start();assert.equal(b.clients.length,2);b.unmount();assert.equal(b.clients[1].logouts,1);
  const c=harness({login:()=>Promise.reject(Error('offline'))});c.mount();await c.start();assert.equal(c.clients[0].subscriptions,0);assert.equal(c.clients[0].logouts,1);

  // A late login after unmount may never subscribe or update React state.
  const late=deferred();const d=harness({login:()=>late.promise});d.mount();const pending=d.start();await tick();d.unmount();const count=d.setters.length;late.resolve();await pending;
  assert.equal(d.clients[0].subscriptions,0);assert.ok(d.clients[0].logouts>=1);assert.equal(d.setters.length,count);

  // StrictMode's setup/cleanup/setup cycle must still allow starting a call.
  const e=harness();e.mount();e.strictReplay();await e.start();assert.equal(e.clients.length,1);assert.equal(e.clients[0].subscriptions,1);e.unmount();assert.equal(e.clients[0].logouts,1);
  console.log('RTM lifecycle: rapid clicks, partial failures, retry, late login, unmount and StrictMode passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
