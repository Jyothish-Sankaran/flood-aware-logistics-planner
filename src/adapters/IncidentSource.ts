import { Incident } from '../scenario/scenario';

export interface IncidentSource {
  sourceId: string;
  sourceType: 'AUTHORITY' | 'DRIVER' | 'CITIZEN';
  sourceName: string;
  fetchIncidents(): Promise<Incident[]>;
  subscribe(onIncident: (incident: Incident) => void): () => void;
}
