import type * as L from 'leaflet';

declare module 'leaflet' {
  namespace Control {
    function geocoder(options?: {
      defaultMarkGeocode?: boolean;
    }): L.Control;
  }
}

declare module 'leaflet-control-geocoder' {
  const plugin: unknown;
  export default plugin;
}