import { IncidentSource } from './IncidentSource';
import { Incident, CANONICAL_INCIDENT_1042 } from '../scenario/scenario';

export class SimulatedAuthoritySource implements IncidentSource {
  sourceId = 'SRC-AUTH-01';
  sourceType: 'AUTHORITY' = 'AUTHORITY';
  sourceName = 'Kerala Traffic Police & Fire Services Feed';

  private listeners: ((incident: Incident) => void)[] = [];

  async fetchIncidents(): Promise<Incident[]> {
    return [{ ...CANONICAL_INCIDENT_1042 }];
  }

  subscribe(onIncident: (incident: Incident) => void): () => void {
    this.listeners.push(onIncident);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== onIncident);
    };
  }

  emitAuthorityIncident(incident: Incident) {
    this.listeners.forEach((listener) => listener(incident));
  }
}
