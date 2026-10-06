import backend from '../../src/server';
export * from '../../src/server';
export {FamilyDurableObject,BrowserVerificationLimiterDurableObject} from './worker';

/** Preserve the deployed public origin and the existing Context HTTP path without changing RPC authority. */
export default {
  fetch(request:Request,env:Cloudflare.Env & {CONTEXT_HTTP:Fetcher},ctx:ExecutionContext) {
    const path=new URL(request.url).pathname;
    if(path==='/gatekeeper/context'||path.startsWith('/gatekeeper/context/'))return env.CONTEXT_HTTP.fetch(request);
    return backend.fetch(request,env,ctx);
  },
};
