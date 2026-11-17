import type { DocumentParty } from './document-draft'

export function canCreateCounterparty(party: DocumentParty): boolean {
  return party.match === 'missing' && party.name !== '' && (party.inn.length === 10 || party.inn.length === 12)
}
