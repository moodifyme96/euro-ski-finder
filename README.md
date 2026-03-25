# ⛷️ Euro Ski Finder

A **last-minute European ski conditions finder** built for quick trip planning from Israel.

## What it does
- 🏔️ Shows **resort-reported** top & base snow depths for 57+ major European ski resorts
- 📡 Combines with **Open-Meteo weather forecast** (1–7 days ahead)
- 🏆 Scores and ranks resorts by overall conditions
- ✈️ Shows nearest flight hub from Tel Aviv
- 🇫🇷🇨🇭🇦🇹🇮🇹🇦🇩🇧🇬🇪🇸 Covers France, Switzerland, Austria, Italy, Andorra, Bulgaria, Spain

## Data sources
- **Snow depths**: scraped daily from [skiresort.info](https://www.skiresort.info) — resort-reported figures
- **Forecast**: [Open-Meteo](https://open-meteo.com) free weather API

## Tech stack
- **Frontend**: React (JSX), hosted on Base44
- **Backend**: Deno (TypeScript) serverless function on Base44

## Resorts covered
Includes all major areas:
- **France**: Tignes/Val d'Isère, 3 Vallées, Alpe d'Huez, Les 2 Alpes, Chamonix, Les Arcs/La Plagne, Portes du Soleil
- **Switzerland**: Zermatt/Cervinia, Verbier, Saas-Fee, Davos, Laax, Andermatt, Crans-Montana, Engelberg
- **Austria**: Ski Arlberg, Ischgl, Sölden, Kitzbühel, Obertauern, Stubai/Hintertux glaciers, Mayrhofen
- **Italy (Dolomites/Sella Ronda)**: Val Gardena, Alta Badia, Arabba/Marmolada, Val di Fassa, Cortina, Kronplatz, 3 Zinnen
- **Italy (other)**: Courmayeur, Monterosa, Via Lattea/Sestriere, Livigno, Bormio, Madonna di Campiglio, Tonale
- **Andorra**: Grandvalira, Pal Arinsal
- **Bulgaria**: Bansko, Borovets
- **Spain**: Sierra Nevada

## Files
```
pages/Home.jsx          # React frontend
functions/skiConditions.ts  # Deno backend function (scraper + forecast)
```
