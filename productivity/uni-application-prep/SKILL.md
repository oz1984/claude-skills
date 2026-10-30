---
name: uni-application-prep
description: Researches CS bachelor's programmes in Berlin, Munich, Warsaw and Amsterdam, filters them to the user's career goals, and prepares a ready-to-submit application pack for each shortlisted one. Never submits applications itself. Use when the user asks to find universities, compare programmes, or prepare applications.
---

# University application prep

## Profile (read from the user's memory or ask once)
- Bachelor's in CS / software engineering. English-taught and German-taught programmes are equally acceptable (for German-taught ones, flag the language requirement, e.g. DSH/TestDaF level, and the time needed to reach it)
- Tuition at most about 20k USD per year (convert EUR/PLN figures and state the exchange rate and date used)
- Spring intake is preferred but not required; autumn intakes are fine
- Goals in priority order: 1) AI systems engineering, 2) data and distributed systems, 3) AI security
- Judging criteria: compulsory courses over electives, up-to-date study plan, teaching quality, low credit-hour load, free time for self-study, path to entrepreneurship. Rankings are a tie-breaker only.
- Applicant holds a Syrian secondary certificate: check recognition rules, Studienkolleg / foundation-year requirements, and visa timelines for each country.

## Step 1: Discover
For each of Berlin, Munich, Warsaw, Amsterdam, search official university pages (not aggregators) for English-taught or German-taught CS / software engineering / AI / data science bachelor's programmes. Use WebSearch, then WebFetch the programme page. One subagent per city is fine.

## Step 2: Filter (strict)
Keep a programme only if its compulsory modules clearly cover at least two of: operating systems, networks, distributed systems, databases/data engineering, security, ML/AI systems, maths. Drop programmes that fail this, even if the university is famous. Record why each dropped programme was dropped.

## Step 3: Verify per kept programme (every fact needs a link)
- Language of instruction, tuition per year, intake months and application deadline
- Admission requirements for a Syrian certificate (recognition body, pre-study year, language test, APS / uni-assist / Studielink / IRK route)
- Portal used and application fee
- Credit load per semester

## Step 4: Output
1. A table: programme, city, intake, deadline, tuition, requirement gaps, fit score against the goals, sources.
2. A realistic shortlist of 3 to 6, with a one-line reason each.
3. For each shortlisted programme, an application pack: tailored motivation letter draft (using only facts the user supplies), document checklist, deadline calendar, and the exact portal steps.

## Hard rules
- Do not submit applications, create portal accounts, pay fees or enter the user's personal data. Portals need the user's identity documents, certified translations, payments and sometimes human verification. The user submits; the pack makes that a 20-minute job per programme.
- Never invent deadlines, fees or requirements. If a fact cannot be verified on an official page, mark it "unverified".
- Each motivation letter must be specific to the programme's modules, not a template with the name swapped.
- Letters are drafted from the user's real experiences (ask for them; never invent projects, grades or achievements) and the user reads and edits every one before it is used. Do not run detector-evasion rewrites or promise that a letter "passes AI detectors"; detectors are unreliable, and admissions offices care that the content is true and personal.

## Automation level
Automate everything up to the submit button: a per-programme sheet with every form field pre-filled (name, certificate details, language scores, referees), a document checklist, translated/certified-copy instructions, and a deadline calendar. Browser-driven form filling needs a paid plan or the user's own browser; where it is unavailable, hand over the filled sheet so each portal is copy-paste.
