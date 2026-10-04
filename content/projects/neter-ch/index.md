---
title: neter.ch
slug: neter-ch
tagline: The website of a gynaecology and obstetrics practice in Aarau, Switzerland, migrated from Wix to a static Astro site with online prescription requests, appointment booking and structured data for search engines.
started: "2025-08"
role: Development, content migration, infrastructure
status: In production; content maintained with the practice
cover: ./screens.png
coverAlt: The neter.ch home page on a desktop screen and on a phone, showing the navigation, the portrait of the practice owner with quick links, and the appointment booking button.
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
  - Five legacy domains consolidated
  - Assets on a dedicated CDN
links:
  - label: neter.ch
    href: https://www.neter.ch
---

## What?

neter.ch is the website of the Frauenarztpraxis am Graben in Aarau, a gynaecology and obstetrics practice at two addresses. The site presents the practice, its services and its team, and provides an online form for repeat prescriptions, appointment booking, a photo gallery, medical information leaflets and contact details with a map. Members of the team have individual pages with their curricula vitae.

## Why?

The practice's previous website was built with Wix. The rebuild moved the content into a code base under version control and onto infrastructure under the practice's control. Further aims were the consolidation of five legacy domains under neter.ch and better visibility in search results, through structured data describing the practice and its opening hours. Content changes are made in Markdown and YAML files, partly by the practice itself.

## How?

### Site

The site is a static Astro build with interactive components in Svelte 5 and styles in Tailwind CSS. Page content is kept in Markdown, MDX and YAML files; team members and their curricula vitae are content collections from which the team pages are generated. The prescription and contact forms are handled by Netlify Forms. Appointment booking embeds the OneDoc booking widget, and the location map uses the Google Maps JavaScript API. Each page carries schema.org data describing the practice as a `MedicalClinic`, including opening hours derived from the same configuration that renders them on the page, and a sitemap is generated at build time.

### Migration

Content was transferred from the Wix site with scripts that parse the original pages, for example the list of nurses and their portraits. Images and documents were moved from the Wix CDN to an S3 bucket; a migration script uploads each file under a new UUID-based key and rewrites every reference to it in the source files. A link checker verifies the external URLs referenced in the content. Five former domains of the practice, each with its `www` variant, redirect permanently to neter.ch.

### Infrastructure

Images and PDF documents are served from an S3 bucket behind a CloudFront distribution, defined with Pulumi in Go. Object keys are UUIDs, so a changed file always receives a new URL. The bucket and distribution are protected against accidental deletion in the Pulumi program, since every asset URL on the site depends on them. The site itself is built and hosted by Netlify.
