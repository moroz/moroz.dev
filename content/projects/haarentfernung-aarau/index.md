---
title: Haarentfernung Aarau
slug: haarentfernung-aarau
tagline: The website of a centre for laser therapy, aesthetic medicine and weight control in Aarau, rebuilt from Wix as a static Astro site on the conventions and infrastructure of neter.ch.
started: "2026-10"
role: Development, content migration
status: Built; launch pending
stack:
  - Astro
  - Svelte
  - Tailwind CSS
  - TypeScript
  - Netlify
  - Netlify Forms
  - Amazon S3
  - CloudFront
  - Pulumi (Go)
  - Python
highlights:
  - Migration from Wix
  - Former URLs preserved
  - Shared conventions with neter.ch
---

## What?

The website of the Zentrum für Lasertherapie, Infusionstherapie, Ästhetische Medizin, Haarentfernung und Gewichtskontrolle in Aarau, a centre operating within the gynaecology practice of neter.ch. The site describes eight services, among them laser hair removal, infusion therapy, aesthetic medicine and weight control, and presents the team, opening hours and locations. It provides online appointment booking and a contact form.

## Why?

The centre's existing website is built with Wix. The new site replaces it with a static build that follows the structure, typography and infrastructure of neter.ch, so that both sites of the practice are maintained with the same tools and procedures.

## How?

### Site

The site is a static Astro build with Svelte components and Tailwind CSS, hosted on Netlify. Each service and each team member is a Markdown file in a content collection; navigation, footer, opening hours and the staff schedule are kept in a single YAML configuration. Team pages are generated at the same paths as on the Wix site, so existing links and search results remain valid. Appointment booking embeds the OneDoc widget, the contact form is handled by Netlify Forms, and the location map uses the Google Maps JavaScript API. The typeface, IBM Plex Sans, is served from the site itself rather than from Google Fonts.

### Migration

The content was ported from the Wix site. Images and PDF documents were moved to a dedicated S3 bucket behind CloudFront, defined in the same Pulumi program as the neter.ch CDN. A migration script takes a manifest that maps each original URL to a local file, uploads every file under a new UUIDv7-based key and replaces the references in the source files.

### Search engines

Page titles and descriptions are kept within the lengths displayed in search results, the 404 page is excluded from indexing, and each page carries structured data on the business, including opening hours and locations. Shared links show a photograph of the building.
