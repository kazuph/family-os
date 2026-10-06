import {MaintenanceRoot} from './read-only';
export {default} from './worker';
/** Retained context document storage. */
export class ContextCollectionDurableObject extends MaintenanceRoot {}
/** Retained context account storage. */
export class ContextGatekeeper extends MaintenanceRoot {}
/** Retained public collection registry. */
export class LibraryRegistryDurableObject extends MaintenanceRoot {}
/** Retained account collection registry. */
export class UserLibraryDurableObject extends MaintenanceRoot {}
