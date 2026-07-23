# Feasibility Study

*Monilog - Smart Financial Tracking & Analytics Tool*

## Introduction

This document evaluates the feasibility of developing Monilog from technical, financial, operational, and schedule perspectives.

## Technical Feasibility

### Overview

The proposed solution includes:

- a React + TypeScript web application
- installable PWA behavior for offline-capable usage
- a WhatsApp chatbot as a primary conversational input channel
- a backend and database core through Supabase

### Assessment

- React, TypeScript, and Vite are suitable for a responsive browser-based finance application.
- Tailwind CSS, shadcn/ui, and Recharts cover the UI and analytics needs of the MVP.
- Dexie and IndexedDB support the required offline-first behavior.
- Supabase is suitable for authentication, PostgreSQL data storage, and ownership-aware backend access.
- The chatbot is feasible through the WhatsApp Business API or providers such as Twilio.

### Technical Risks

- chatbot input ambiguity across different message styles
- browser differences in offline caching and notification behavior
- sync conflicts when the same records are changed across reconnect scenarios

### Conclusion

The project is technically feasible with moderate complexity, with offline sync behavior and chatbot design being the main engineering risks.

## Financial Feasibility

### Expected Cost Areas

- development time and effort
- hosting and deployment
- database storage
- WhatsApp API usage

### Assessment

- MVP costs can remain low by using free or low-cost infrastructure tiers
- WhatsApp messaging costs are likely to become the most important recurring expense
- infrastructure cost will grow gradually as the user base scales

### Conclusion

Monilog is financially feasible for an MVP with relatively low initial investment.

## Operational Feasibility

### Strengths

- browser access lowers installation friction
- PWA support keeps the app close to a native-feeling workflow
- fast interaction encourages repeated use

### Operational Challenges

- keeping chatbot responses accurate and reliable
- maintaining offline and reconnect behavior cleanly
- handling user errors during entry and import

### Conclusion

The system is operationally feasible and well aligned with real user behavior.

## Schedule Feasibility

### Estimated MVP Timeline

| Phase | Duration |
| --- | --- |
| Planning and analysis | 1 to 2 weeks |
| Design | 2 weeks |
| Development | 4 to 6 weeks |
| Testing | 1 to 2 weeks |
| Deployment | 1 week |

### Conclusion

The project is schedule-feasible for an MVP if scope is controlled and delivery is phased.

## Final Assessment

Monilog is feasible overall. The best path forward is a phased delivery strategy that validates the web experience, offline behavior, and chatbot value before investing in deeper integrations and automation.
