# Project Structure Documentation

## Overview
This admin dashboard is a React + TypeScript app built with Vite. It uses Tailwind CSS and Radix/shadcn-style UI primitives for facility operations workflows (work orders, services, map/status tracking, settings, reports, and language/theme support).

## Root Structure

| Path | Purpose |
|------|---------|
| `index.html` | Vite HTML entry point |
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Vite configuration |
| `postcss.config.mjs` | PostCSS/Tailwind processing |
| `tsconfig.json` | TypeScript compiler settings |
| `README.md` | Setup and usage documentation |
| `PROJECT_STRUCTURE.md` | This architecture reference |
| `info.txt` | Product/domain notes |
| `.env.example` | Example environment variable template |
| `guidelines/Guidelines.md` | Team conventions and implementation guidance |
| `src/` | Application source code |

## Source Tree

```text
src/
	main.tsx
	vite-env.d.ts
	app/
		App.tsx
		components/
			DashboardView.tsx
			LoadingSpinner.tsx
			LoginPage.tsx
			ReportsView.tsx
			ServicePackagesView.tsx
			ServicesView.tsx
			SettingsView.tsx
			TechnicianMapView.tsx
			TranslatableText.tsx
			WorkOrdersView.tsx
			figma/
				ImageWithFallback.tsx
			ui/
				accordion.tsx
				alert-dialog.tsx
				alert.tsx
				aspect-ratio.tsx
				avatar.tsx
				badge.tsx
				breadcrumb.tsx
				button.tsx
				calendar.tsx
				card.tsx
				carousel.tsx
				chart.tsx
				checkbox.tsx
				collapsible.tsx
				command.tsx
				context-menu.tsx
				dialog.tsx
				drawer.tsx
				dropdown-menu.tsx
				form.tsx
				hover-card.tsx
				input-otp.tsx
				input.tsx
				label.tsx
				menubar.tsx
				navigation-menu.tsx
				pagination.tsx
				popover.tsx
				progress.tsx
				radio-group.tsx
				resizable.tsx
				scroll-area.tsx
				select.tsx
				separator.tsx
				sheet.tsx
				sidebar.tsx
				skeleton.tsx
				slider.tsx
				sonner.tsx
				switch.tsx
				table.tsx
				tabs.tsx
				textarea.tsx
				toggle-group.tsx
				toggle.tsx
				tooltip.tsx
				use-mobile.ts
				utils.ts
		context/
			LanguageContext.tsx
			ThemeContext.tsx
		services/
			api.ts
			mockApi.ts
			mockRevenueData.ts
			translationService.ts
		utils/
			accessControl.ts
			serviceCatalog.ts
			serviceColors.ts
			translations.ts
	styles/
		fonts.css
		index.css
		tailwind.css
		theme.css
```

## Directory Roles

| Directory | Responsibility |
|-----------|----------------|
| `src/app/components/` | Feature screens and reusable presentation components |
| `src/app/components/ui/` | Shared low-level UI primitives and helpers |
| `src/app/context/` | Global app state providers (theme/language) |
| `src/app/services/` | Data access layer, API adapters, and mock data |
| `src/app/utils/` | Cross-cutting utility logic and constants |
| `src/styles/` | Global style entry, Tailwind layer, theme variables, font setup |

## Key Notes

1. `src/app/services/api.ts` is the abstraction point for backend integration.
2. `src/app/services/mockApi.ts` and `src/app/services/mockRevenueData.ts` support development without backend availability.
3. `src/app/context/LanguageContext.tsx` and `src/app/components/TranslatableText.tsx` provide UI localization plumbing.
4. `src/app/components/ui/` contains many generated/shared primitives; avoid changing these unless updating design system behavior.
5. `src/styles/index.css` should remain the single import point for global styles.

## Maintenance Rules

1. Add new feature screens under `src/app/components/`.
2. Keep network/data concerns in `src/app/services/` rather than inside view components.
3. Keep reusable pure helpers in `src/app/utils/`.
4. Update this file whenever files are added, removed, or moved in `src/`.
