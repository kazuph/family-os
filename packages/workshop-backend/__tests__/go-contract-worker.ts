import { UserDurableObject as ProductionUser } from '../src/user';
export * from '../src/server';
export { default } from '../src/server';
/** Exercise production account/model resolution against the real local catalog HTTP server. */
export class UserDurableObject extends ProductionUser {
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    const base = (env as Cloudflare.Env & {GO_TEST_BASE_URL: string}).GO_TEST_BASE_URL;
    super(ctx, env, {modelsUrl: base + '/models', metadataUrl: base + '/metadata'});
  }
}
