# Technician Map Upgrade Plan

This document is the working plan for converting the admin technician map from the current mock-grid implementation to a Leaflet-based map with real tiles, live updates, and route context.

## Scope
- Admin dashboard only
- Keep technician selection, destination detail panels, legend, and zoom/reset controls working during the migration
- Avoid changes to the user and technician apps unless the backend needs a shared API update

## Edit-by-Edit Workflow
Every code edit in this migration follows the same loop:
1. Make one small change in the admin map stack.
2. Run the cheapest focused validation for the touched file or feature.
3. Fix only the slice that the validation just touched.
4. Re-run the same validation before moving to the next edit.

Validation rules:
- After every edit, run `get_errors` on the touched file(s).
- If the change affects runtime behavior, run the lightest applicable runtime check after the file-level validation.
- Do not batch unrelated Leaflet work into one change if it makes the result harder to verify.

## Roadmap Steps
1. **Leaflet foundation**
   - Install and keep only the map library needed for the chosen path.
   - Replace the mock grid in `frontend/admin-webpage/src/app/components/TechnicianMapView.tsx` with a Leaflet container and tile layer.
   - Preserve the current marker semantics: live GPS, booking destination, fallback location.
   - Validation after each step: component compile check, then browser/runtime verification.

2. **Marker migration**
   - Move the current marker rendering logic onto Leaflet markers or custom DivIcons.
   - Keep the blue live pulse, grey online pulse, booking initials, and hover order ID tooltip.
   - Validate the map still centers the tapped marker and still clears selection on background tap.

3. **Detail panel migration**
   - Keep the technician detail panel and destination detail panel behavior intact.
   - Preserve order number display, technician name, and customer notes.
   - Validate by clicking technician markers and booking markers separately.

4. **Live updates**
   - Add or reuse backend live-location delivery through WebSocket or polling.
   - Smoothly update marker position and recalculate visible map state.
   - Validate that the selected technician stays selected during updates.

5. **Route and ETA context**
   - Add recent location history rendering.
   - Add route polyline and ETA-style context where data is available.
   - Validate with seeded live-location data before adding more backend work.

6. **Performance and scaling**
   - Add clustering if marker count grows.
   - Cache or limit historical points.
   - Validate with the current seeded technician data and a higher synthetic marker count.

## Backend Changes Required
- Keep technician list and booking data endpoints stable while the map migrates.
- Add a recent-location endpoint if route history is implemented.
- Add a websocket stream only if live updates require more than polling.

## Validation Checklist Per Edit
- `get_errors` on the touched frontend file(s)
- Runtime smoke test in the admin dashboard if the edit changes UI behavior
- Confirm the current feature still works before editing the next slice

## Decision Notes
- Leaflet is the preferred first migration path for the admin dashboard because it keeps control local and avoids vendor lock-in.
- Mapbox is only worth switching to if routing, traffic, geocoding, or polished map styling become primary requirements.
- This plan keeps the migration incremental so we can stop after any edit if validation fails.
