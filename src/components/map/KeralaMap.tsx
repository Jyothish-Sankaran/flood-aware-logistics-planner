import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLogisticsStore } from '../../store/useLogisticsStore';
import floodZonesGeoJson from '../../data/floodZones.geojson';
import { AlertTriangle, CloudRain, Truck, Eye, EyeOff } from 'lucide-react';

// Custom Map Center & Bounds Controller
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Icon Generators for crisp Dark UI
const createTruckIcon = (status: string) => {
  const isCritical = status === 'CRITICAL';
  const color = isCritical ? '#ef4444' : '#10b981';
  return L.divIcon({
    className: 'custom-truck-icon',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${color}; opacity: 0.3; animation: vehicle-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #0f172a; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color};">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createIncidentIcon = (type: string, severity: string) => {
  let bgColor = '#f59e0b';
  let symbol = '⚠️';

  if (severity === 'CRITICAL' || severity === 'HIGH') {
    bgColor = '#ef4444';
  }

  if (type === 'FALLEN_TREE') symbol = '🌲';
  else if (type === 'FLOODED_ROAD') symbol = '🌊';
  else if (type === 'ACCIDENT') symbol = '💥';
  else if (type === 'LANDSLIDE') symbol = '⛰️';

  return L.divIcon({
    className: 'custom-incident-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${bgColor}; opacity: 0.25; animation: pulse 1.5s infinite;"></div>
        <div style="width: 26px; height: 26px; border-radius: 6px; background: #0f172a; border: 2px solid ${bgColor}; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 10px ${bgColor};">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createCityPinIcon = (label: string, isOriginOrDest: boolean = false) => {
  const color = isOriginOrDest ? '#38bdf8' : '#64748b';
  return L.divIcon({
    className: 'custom-city-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; border: 2px solid #0f172a; box-shadow: 0 0 8px ${color};"></div>
        <span style="font-size: 10px; font-weight: 700; color: #cbd5e1; background: rgba(15, 23, 42, 0.85); padding: 1px 4px; border-radius: 4px; margin-top: 2px; white-space: nowrap; border: 1px solid rgba(51, 65, 85, 0.5);">${label}</span>
      </div>
    `,
    iconSize: [40, 24],
    iconAnchor: [20, 5],
  });
};

export const KeralaMap: React.FC = () => {
  const {
    availableRoutes,
    selectedRouteId,
    setSelectedRouteId,
    primaryTrip,
    secondaryTrip,
    incidents,
    showFloodLayer,
    setShowFloodLayer,
    activeAlertTrip104,
  } = useLogisticsStore();

  const isR1Blocked = incidents.some(
    (inc) => inc.id === 'INC-1042' && inc.verificationStatus === 'VERIFIED' && inc.severity === 'HIGH'
  );

  const floodFeatures = useMemo(() => {
    return floodZonesGeoJson.features || [];
  }, []);

  // Map Center focusing Kerala central corridor (Thrissur - Ernakulam)
  const mapCenter: [number, number] = [10.35, 76.45];

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <MapContainer
        center={mapCenter}
        zoom={9}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapViewController center={mapCenter} zoom={9} />

        {/* Dark Matter CartoDB Basemap for Command Center look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Flood Risk Zones Layer (Curated Historical Static Layer) */}
        {showFloodLayer &&
          floodFeatures.map((feature: any) => {
            // Leaflet expects [lat, lng], GeoJSON gives [lng, lat]
            const coords = feature.geometry.coordinates[0].map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            );
            const isHigh = feature.properties.severity === 'HIGH';

            return (
              <Polygon
                key={feature.properties.id}
                positions={coords}
                pathOptions={{
                  color: isHigh ? '#06b6d4' : '#0284c7',
                  fillColor: isHigh ? '#0891b2' : '#0369a1',
                  fillOpacity: 0.25,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1.5 max-w-xs">
                    <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                      <CloudRain className="w-3.5 h-3.5" />
                      <span>{feature.properties.name}</span>
                    </div>
                    <div className="text-slate-300">{feature.properties.description}</div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      <span>District: {feature.properties.district}</span>
                      <span className="text-cyan-300 font-semibold">Vulnerability: {feature.properties.severity}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 italic bg-slate-900/60 p-1 rounded">
                      Static historical baseline (2018/2019 flood records)
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* Candidate Route Polylines */}
        {availableRoutes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isR1 = route.id === 'R1';
          const isR2 = route.id === 'R2';

          let strokeColor = '#64748b';
          let weight = isSelected ? 5 : 3;
          let opacity = isSelected ? 0.95 : 0.45;
          let dashArray: string | undefined = undefined;

          if (isR1) {
            strokeColor = isR1Blocked ? '#ef4444' : '#38bdf8'; // Red if blocked, Cyan if clear
            if (isR1Blocked) dashArray = '6, 6';
          } else if (isR2) {
            strokeColor = '#10b981'; // Emerald Safe Bypass
          } else {
            strokeColor = '#a855f7'; // Purple Inland
          }

          return (
            <Polyline
              key={route.id}
              positions={route.coordinates}
              pathOptions={{
                color: strokeColor,
                weight: weight,
                opacity: opacity,
                dashArray: dashArray,
              }}
              eventHandlers={{
                click: () => setSelectedRouteId(route.id),
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono">
                  <span className="font-bold text-white">{route.name}</span>
                  <div className="text-slate-300">{route.distanceKm} km • {route.durationMinutes} min • ETA {route.eta}</div>
                  {isR1 && isR1Blocked && (
                    <div className="text-rose-400 font-bold mt-0.5">⚠️ ROUTE BLOCKED BY TREE FALL</div>
                  )}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Key City Waypoint Markers */}
        <Marker position={[10.7867, 76.6548]} icon={createCityPinIcon('Palakkad (Origin)', true)} />
        <Marker position={[10.5276, 76.2144]} icon={createCityPinIcon('Thrissur')} />
        <Marker position={[10.3070, 76.3330]} icon={createCityPinIcon('Chalakudy')} />
        <Marker position={[10.1960, 76.3860]} icon={createCityPinIcon('Angamaly (NH 544)')} />
        <Marker position={[10.2185, 76.2612]} icon={createCityPinIcon('Mala (Bypass)')} />
        <Marker position={[10.1076, 76.3516]} icon={createCityPinIcon('Aluva')} />
        <Marker position={[9.9312, 76.2673]} icon={createCityPinIcon('Kochi (Destination)', true)} />

        {/* Incidents Markers */}
        {incidents.map((incident) => {
          return (
            <Marker
              key={incident.id}
              position={incident.coordinates}
              icon={createIncidentIcon(incident.type, incident.severity)}
            >
              <Popup>
                <div className="p-1 space-y-2 text-xs min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
                    <span className="font-bold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {incident.typeLabel}
                    </span>
                    <span className="text-[10px] bg-rose-950/80 border border-rose-600/40 text-rose-300 font-mono px-1.5 py-0.5 rounded">
                      {incident.id}
                    </span>
                  </div>

                  <div className="text-slate-200">{incident.description}</div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-900/80 p-1.5 rounded border border-slate-800">
                    <div>
                      <span className="text-slate-400">Location:</span>
                      <div className="font-medium text-slate-200 truncate">{incident.locationName}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Timestamp:</span>
                      <div className="font-medium text-slate-200">{incident.timestamp}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Source:</span>
                      <div className="font-medium text-slate-200 truncate">{incident.sourceLabel}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Verification:</span>
                      <div className={`font-semibold ${incident.verificationStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {incident.verificationStatus} ({incident.confidence})
                      </div>
                    </div>
                  </div>

                  {incident.id === 'INC-1042' && activeAlertTrip104 && (
                    <div className="bg-rose-950/70 border border-rose-500/50 p-1.5 rounded text-[11px] text-rose-200">
                      <strong>Direct Disruption to TRIP-104:</strong> 24.0 km ahead of vehicle. 23 min to impact. Reroute required.
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Primary Active Truck Marker (VH-104) */}
        <Marker
          position={primaryTrip.currentPosition}
          icon={createTruckIcon(primaryTrip.status)}
        >
          <Popup>
            <div className="p-1 space-y-1.5 text-xs min-w-[200px]">
              <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  {primaryTrip.vehicle.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${primaryTrip.status === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-emerald-950 text-emerald-300 border border-emerald-600'}`}>
                  {primaryTrip.status}
                </span>
              </div>
              <div className="text-slate-300">
                <div><strong>Driver:</strong> {primaryTrip.vehicle.driver} ({primaryTrip.vehicle.driverPhone})</div>
                <div><strong>Cargo:</strong> {primaryTrip.cargo.name} ({primaryTrip.cargo.category})</div>
                <div><strong>Active Route:</strong> {primaryTrip.activeRouteId}</div>
                <div><strong>Current ETA:</strong> {primaryTrip.currentEta}</div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Secondary Active Truck Marker (VH-208) */}
        <Marker
          position={secondaryTrip.currentPosition}
          icon={createTruckIcon(secondaryTrip.status)}
        >
          <Popup>
            <div className="p-1 space-y-1 text-xs">
              <div className="font-bold text-sky-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                {secondaryTrip.vehicle.name}
              </div>
              <div className="text-slate-300">
                <div>Driver: {secondaryTrip.vehicle.driver}</div>
                <div>Cargo: {secondaryTrip.cargo.name}</div>
                <div className="text-emerald-400 font-semibold">Status: SAFE (No Disruption on Path)</div>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Legend and Layer Control */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl max-w-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-semibold text-slate-200">Corridor Layers</span>
          <button
            onClick={() => setShowFloodLayer(!showFloodLayer)}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            {showFloodLayer ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
            Flood Zones
          </button>
        </div>

        {/* Routes Legend */}
        <div className="space-y-1.5">
          <div
            onClick={() => setSelectedRouteId('R1')}
            className={`flex items-center justify-between p-1 rounded cursor-pointer transition ${selectedRouteId === 'R1' ? 'bg-slate-800 border border-slate-600' : 'hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-1 rounded ${isR1Blocked ? 'bg-rose-500' : 'bg-sky-400'}`}></div>
              <span className="font-medium text-slate-200">R1: NH 544</span>
            </div>
            <span className={`text-[10px] px-1 rounded ${isR1Blocked ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
              {isR1Blocked ? 'BLOCKED' : '138 km • 2h 10m'}
            </span>
          </div>

          <div
            onClick={() => setSelectedRouteId('R2')}
            className={`flex items-center justify-between p-1 rounded cursor-pointer transition ${selectedRouteId === 'R2' ? 'bg-slate-800 border border-slate-600' : 'hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-1 rounded bg-emerald-400"></div>
              <span className="font-medium text-slate-200">R2: Bypass via Mala</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">152 km • +17m</span>
          </div>

          <div
            onClick={() => setSelectedRouteId('R3')}
            className={`flex items-center justify-between p-1 rounded cursor-pointer transition ${selectedRouteId === 'R3' ? 'bg-slate-800 border border-slate-600' : 'hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-1 rounded bg-purple-400"></div>
              <span className="font-medium text-slate-200">R3: Inland Corridor</span>
            </div>
            <span className="text-[10px] text-slate-400">165 km • 2h 41m</span>
          </div>
        </div>

        {/* Static Layer Disclaimer */}
        <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-400 leading-tight">
          <span className="text-cyan-400 font-bold block mb-0.5">Static Layer:</span>
          Historical flood-prone zones (illustrative, curated from 2018/2019 flood records), static layer.
        </div>
      </div>
    </div>
  );
};
