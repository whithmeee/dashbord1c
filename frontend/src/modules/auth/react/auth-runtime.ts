import { authGateway } from '../adapters/http-auth-gateway'
import {
  createAuthSessionStore,
  type AuthSessionStore,
} from '../application/auth-session-store'

export const authSessionStore = createAuthSessionStore(authGateway)
const restoredStores = new WeakSet<AuthSessionStore>()

export function ensureSessionRestore(store: AuthSessionStore): void {
  if (!restoredStores.has(store)) {
    restoredStores.add(store)
    void store.restore()
  }
}
