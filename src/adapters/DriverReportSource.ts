import { IncidentSource } from './IncidentSource';
import { Incident } from '../scenario/scenario';

export class DriverReportSource implements IncidentSource {
  sourceId = 'SRC-DRIVER-APP';
  sourceType: 'DRIVER' = 'DRIVER';
  sourceName = 'LDSS Crowdsourced Driver Telemetry';

  private listeners: ((incident: Incident) => void)[] = [];
  private storedReports: Incident[] = [];

  async fetchIncidents(): Promise<Incident[]> {
    return [...this.storedReports];
  }

  subscribe(onIncident: (incident: Incident) => void): () => void {
    this.listeners.push(onIncident);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== onIncident);
    };
  }

  submitDriverReport(incident: Incident) {
    this.storedReports.push(incident);
    this.listeners.forEach((listener) => listener(incident));
  }
}
