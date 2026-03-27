// Euro Ski Finder — backend function
//
// KEY FIXES in this version:
//   • Open-Meteo BATCH API: ONE request for all 57 resorts instead of 57 concurrent calls
//     (the original 57 concurrent Deno fetches were silently failing / timing out)
//   • Math.max(...[]) = -Infinity bug fixed → guarded with default
//   • Scoring fallback: when forecast data is unavailable, score on snow depth only
//
// Data sources:
//   • skiresort.info list pages  → top/base snow depth, slopes/lifts open (resort-reported)
//   • skiresort.info detail page → snow quality, last snowfall date, season end,
//                                  resort's own 7-day new-snow forecast + snow line
//   • Open-Meteo batch           → temps, wind gusts, precip probability, freezing level
//                                  (elevation= param forces correct mountain-top grid cell)

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { days = 5, mode = "list", slug: detailSlug } = body;

    const resortList: Array<{
      slug: string; name: string; country: string; liftPass: number;
      flightHub: string; lat: number; lon: number; topElev: number;
    }> = [
      { slug: "tignes-val-disere", name: "Tignes / Val d'Isère", country: "France", liftPass: 75, flightHub: "Geneva", lat: 45.47, lon: 6.91, topElev: 3456 },
      { slug: "les-3-vallees-val-thorens-les-menuires-meribel-courchevel", name: "3 Vallées (Val Thorens / Méribel / Courchevel)", country: "France", liftPass: 78, flightHub: "Geneva", lat: 45.29, lon: 6.58, topElev: 3230 },
      { slug: "les-arcs-peisey-vallandry-paradiski", name: "Les Arcs / Paradiski", country: "France", liftPass: 65, flightHub: "Geneva", lat: 45.57, lon: 6.80, topElev: 3226 },
      { slug: "la-plagne-paradiski", name: "La Plagne / Paradiski", country: "France", liftPass: 68, flightHub: "Geneva", lat: 45.51, lon: 6.68, topElev: 3250 },
      { slug: "alpe-dhuez", name: "Alpe d'Huez", country: "France", liftPass: 70, flightHub: "Geneva", lat: 45.09, lon: 6.07, topElev: 3330 },
      { slug: "les-2-alpes", name: "Les 2 Alpes", country: "France", liftPass: 62, flightHub: "Geneva", lat: 45.00, lon: 6.12, topElev: 3523 },
      { slug: "brevent-flegere-chamonix", name: "Chamonix – Brévent / Flégère", country: "France", liftPass: 72, flightHub: "Geneva", lat: 45.92, lon: 6.87, topElev: 2525 },
      { slug: "grands-montets-argentiere-chamonix", name: "Chamonix – Grands Montets", country: "France", liftPass: 72, flightHub: "Geneva", lat: 45.97, lon: 6.92, topElev: 3275 },
      { slug: "les-houches-saint-gervais-prarion-bellevue-chamonix", name: "Les Houches / Saint-Gervais", country: "France", liftPass: 58, flightHub: "Geneva", lat: 45.89, lon: 6.80, topElev: 1900 },
      { slug: "les-portes-du-soleil-morzine-avoriaz-les-gets-chatel-morgins-champery", name: "Portes du Soleil (Morzine / Avoriaz)", country: "France", liftPass: 60, flightHub: "Geneva", lat: 46.18, lon: 6.72, topElev: 2254 },
      { slug: "sierra-nevada-pradollano", name: "Sierra Nevada", country: "Spain", liftPass: 38, flightHub: "Málaga", lat: 37.09, lon: -3.40, topElev: 3300 },
      { slug: "zermatt-breuil-cervinia-valtournenche-matterhorn", name: "Zermatt / Cervinia (Matterhorn)", country: "Switzerland", liftPass: 85, flightHub: "Geneva", lat: 46.00, lon: 7.73, topElev: 3883 },
      { slug: "4-vallees-verbier-la-tzoumaz-nendaz-veysonnaz-thyon", name: "Verbier / 4 Vallées", country: "Switzerland", liftPass: 82, flightHub: "Geneva", lat: 46.07, lon: 7.28, topElev: 3330 },
      { slug: "saas-fee", name: "Saas-Fee", country: "Switzerland", liftPass: 75, flightHub: "Geneva", lat: 46.11, lon: 7.93, topElev: 3573 },
      { slug: "laax-flims-falera", name: "Laax / Flims", country: "Switzerland", liftPass: 72, flightHub: "Zurich", lat: 46.83, lon: 9.28, topElev: 3018 },
      { slug: "parsenn-davos-klosters", name: "Davos / Klosters (Parsenn)", country: "Switzerland", liftPass: 78, flightHub: "Zurich", lat: 46.83, lon: 9.85, topElev: 2844 },
      { slug: "andermatt-oberalp-sedrun", name: "Andermatt / Sedrun", country: "Switzerland", liftPass: 68, flightHub: "Zurich", lat: 46.64, lon: 8.59, topElev: 2963 },
      { slug: "crans-montana", name: "Crans-Montana", country: "Switzerland", liftPass: 72, flightHub: "Geneva", lat: 46.31, lon: 7.48, topElev: 2927 },
      { slug: "schilthorn-muerren-lauterbrunnen", name: "Schilthorn / Mürren", country: "Switzerland", liftPass: 65, flightHub: "Zurich", lat: 46.56, lon: 7.90, topElev: 2970 },
      { slug: "kleine-scheidegg-maennlichen-grindelwald-wengen", name: "Grindelwald / Wengen / Männlichen", country: "Switzerland", liftPass: 70, flightHub: "Zurich", lat: 46.62, lon: 8.04, topElev: 2971 },
      { slug: "titlis-engelberg", name: "Engelberg (Titlis)", country: "Switzerland", liftPass: 72, flightHub: "Zurich", lat: 46.82, lon: 8.39, topElev: 3020 },
      { slug: "glacier-3000-les-diablerets", name: "Glacier 3000 / Les Diablerets", country: "Switzerland", liftPass: 60, flightHub: "Geneva", lat: 46.35, lon: 7.18, topElev: 3016 },
      { slug: "st-anton-st-christoph-stuben-lech-zuers-warth-schroecken-ski-arlberg", name: "Ski Arlberg (St. Anton / Lech / Zürs)", country: "Austria", liftPass: 62, flightHub: "Innsbruck", lat: 47.08, lon: 10.23, topElev: 2811 },
      { slug: "ischgl-samnaun-silvretta-arena", name: "Ischgl / Silvretta Arena", country: "Austria", liftPass: 68, flightHub: "Innsbruck", lat: 47.01, lon: 10.29, topElev: 2872 },
      { slug: "soelden", name: "Sölden", country: "Austria", liftPass: 60, flightHub: "Innsbruck", lat: 46.95, lon: 11.00, topElev: 3340 },
      { slug: "kitzski-kitzbuehel-kirchberg", name: "Kitzbühel (KitzSki)", country: "Austria", liftPass: 65, flightHub: "Innsbruck", lat: 47.40, lon: 12.38, topElev: 2000 },
      { slug: "obertauern", name: "Obertauern", country: "Austria", liftPass: 58, flightHub: "Salzburg", lat: 47.25, lon: 13.57, topElev: 2313 },
      { slug: "mayrhofen-penken-ahorn-rastkogel-eggalm-mountopolis", name: "Mayrhofen", country: "Austria", liftPass: 55, flightHub: "Innsbruck", lat: 47.17, lon: 11.87, topElev: 2500 },
      { slug: "stubai-glacier-stubaier-gletscher", name: "Stubai Glacier", country: "Austria", liftPass: 58, flightHub: "Innsbruck", lat: 47.06, lon: 11.13, topElev: 3210 },
      { slug: "hintertux-glacier-hintertuxer-gletscher", name: "Hintertux Glacier", country: "Austria", liftPass: 62, flightHub: "Innsbruck", lat: 47.06, lon: 11.67, topElev: 3250 },
      { slug: "skiwelt-wilder-kaiser-brixental", name: "SkiWelt Wilder Kaiser", country: "Austria", liftPass: 60, flightHub: "Innsbruck", lat: 47.44, lon: 12.17, topElev: 1957 },
      { slug: "kitzsteinhorn-maiskogel-kaprun", name: "Kitzsteinhorn / Kaprun (Glacier)", country: "Austria", liftPass: 62, flightHub: "Salzburg", lat: 47.19, lon: 12.70, topElev: 3029 },
      { slug: "zillertal-arena-zell-am-ziller-gerlos-koenigsleiten-hochkrimml", name: "Zillertal Arena", country: "Austria", liftPass: 58, flightHub: "Innsbruck", lat: 47.23, lon: 12.04, topElev: 2500 },
      { slug: "serfaus-fiss-ladis", name: "Serfaus-Fiss-Ladis", country: "Austria", liftPass: 62, flightHub: "Innsbruck", lat: 47.04, lon: 10.61, topElev: 2828 },
      { slug: "val-gardena-groeden", name: "Val Gardena – Sella Ronda", country: "Italy", liftPass: 55, flightHub: "Venice", lat: 46.56, lon: 11.77, topElev: 2518 },
      { slug: "alta-badia", name: "Alta Badia – Sella Ronda", country: "Italy", liftPass: 55, flightHub: "Venice", lat: 46.60, lon: 11.93, topElev: 2778 },
      { slug: "arabba-marmolada", name: "Arabba / Marmolada – Sella Ronda", country: "Italy", liftPass: 55, flightHub: "Venice", lat: 46.50, lon: 11.88, topElev: 3269 },
      { slug: "belvedere-col-rodella-ciampac-buffaure-canazei-campitello-alba-pozza-di-fassa", name: "Val di Fassa (Canazei) – Sella Ronda", country: "Italy", liftPass: 52, flightHub: "Venice", lat: 46.48, lon: 11.76, topElev: 2485 },
      { slug: "cortina-dampezzo", name: "Cortina d'Ampezzo", country: "Italy", liftPass: 58, flightHub: "Venice", lat: 46.54, lon: 12.14, topElev: 2828 },
      { slug: "3-zinnen-dolomites-helm-stiergarten-rotwand-kreuzbergpass", name: "3 Zinnen Dolomites (Drei Zinnen)", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 46.69, lon: 12.33, topElev: 2225 },
      { slug: "kronplatz-plan-de-corones", name: "Kronplatz / Plan de Corones", country: "Italy", liftPass: 52, flightHub: "Venice", lat: 46.74, lon: 11.92, topElev: 2275 },
      { slug: "alpe-di-siusi-seiser-alm", name: "Alpe di Siusi / Seiser Alm", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 46.54, lon: 11.63, topElev: 2220 },
      { slug: "carezza", name: "Carezza / Karersee", country: "Italy", liftPass: 45, flightHub: "Venice", lat: 46.41, lon: 11.59, topElev: 2337 },
      { slug: "latemar-obereggen-pampeago-predazzo", name: "Latemar / Obereggen", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 46.37, lon: 11.54, topElev: 2388 },
      { slug: "courmayeur-checrouit-val-veny", name: "Courmayeur (Mont Blanc)", country: "Italy", liftPass: 58, flightHub: "Geneva", lat: 45.79, lon: 6.97, topElev: 2755 },
      { slug: "alagna-valsesia-gressoney-la-trinite-champoluc-frachey-monterosa-ski", name: "Monterosa Ski (Champoluc / Gressoney)", country: "Italy", liftPass: 52, flightHub: "Milan", lat: 45.83, lon: 7.72, topElev: 3275 },
      { slug: "via-lattea-sestriere-sauze-doulx-san-sicario-claviere-montgenevre", name: "Via Lattea (Sestriere / Sauze d'Oulx)", country: "Italy", liftPass: 50, flightHub: "Turin", lat: 44.96, lon: 6.89, topElev: 2789 },
      { slug: "bardonecchia", name: "Bardonecchia", country: "Italy", liftPass: 42, flightHub: "Turin", lat: 45.08, lon: 6.70, topElev: 2800 },
      { slug: "livigno", name: "Livigno (tax-free)", country: "Italy", liftPass: 48, flightHub: "Milan", lat: 46.55, lon: 10.14, topElev: 2798 },
      { slug: "bormio-cima-bianca", name: "Bormio", country: "Italy", liftPass: 45, flightHub: "Milan", lat: 46.47, lon: 10.37, topElev: 3017 },
      { slug: "madonna-di-campiglio-pinzolo-folgarida-marilleva", name: "Madonna di Campiglio", country: "Italy", liftPass: 55, flightHub: "Milan", lat: 46.26, lon: 10.84, topElev: 2504 },
      { slug: "ponte-di-legno-tonale-presena-glacier-temu-pontedilegno-tonale", name: "Ponte di Legno / Tonale (Glacier)", country: "Italy", liftPass: 48, flightHub: "Milan", lat: 46.25, lon: 10.52, topElev: 3000 },
      { slug: "val-senales-glacier-schnalstaler-gletscher", name: "Val Senales Glacier (Schnals)", country: "Italy", liftPass: 45, flightHub: "Innsbruck", lat: 46.80, lon: 10.84, topElev: 3212 },
      { slug: "grandvalira-pas-de-la-casa-grau-roig-soldeu-el-tarter-canillo-encamp", name: "Grandvalira – Soldeu / Pas de la Casa", country: "Andorra", liftPass: 42, flightHub: "Barcelona", lat: 42.55, lon: 1.74, topElev: 2640 },
      { slug: "pal-arinsal-la-massana", name: "Pal Arinsal (Andorra)", country: "Andorra", liftPass: 38, flightHub: "Barcelona", lat: 42.57, lon: 1.52, topElev: 2537 },
      { slug: "bansko", name: "Bansko", country: "Bulgaria", liftPass: 38, flightHub: "Sofia", lat: 41.84, lon: 23.49, topElev: 2530 },
      { slug: "borovets", name: "Borovets", country: "Bulgaria", liftPass: 32, flightHub: "Sofia", lat: 42.27, lon: 23.60, topElev: 2550 },
    ];

    const resortMeta = Object.fromEntries(resortList.map(r => [r.slug, r]));

    // ── Date helpers ─────────────────────────────────────────────────────────
    const today   = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + Math.min(days, 7));
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // ── HTML helpers ──────────────────────────────────────────────────────────
    const stripHtml = (s: string) =>
      s.replace(/<script[\s\S]*?<\/script>/gi, "")
       .replace(/<style[\s\S]*?<\/style>/gi, "")
       .replace(/<[^>]+>/g, " ")
       .replace(/&[^;]+;/g, " ")
       .replace(/\s+/g, " ")
       .trim();

    // ── DETAIL MODE ───────────────────────────────────────────────────────────
    if (mode === "detail" && detailSlug && detailSlug in resortMeta) {
      const meta = resortMeta[detailSlug];

      const [detailResp, omResp] = await Promise.all([
        fetch(`https://www.skiresort.info/ski-resort/${detailSlug}/snow-report/`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        }),
        fetch(
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${meta.lat}&longitude=${meta.lon}&elevation=${meta.topElev}` +
          `&daily=snowfall_sum,snow_depth_max,wind_gusts_10m_max,precipitation_probability_max,weathercode` +
          `&hourly=freezing_level_height` +
          `&timezone=auto&start_date=${fmt(today)}&end_date=${fmt(endDate)}&models=best_match`
        )
      ]);

      const [html, omData] = await Promise.all([detailResp.text(), omResp.json()]);
      const clean = stripHtml(html);

      // Parse detail page fields
      const qualityM    = clean.match(/Snow quality[:\s]*([^\n]{3,50}?)(?:\s{2,}|Last snowfall)/i);
      const quality     = qualityM ? qualityM[1].trim() : null;
      const lastSnowM   = clean.match(/Last snowfall[:\s]*(\d+\s+\w+\s+\d{4})/i);
      const lastSnowfall = lastSnowM ? lastSnowM[1] : null;
      const seasonM     = clean.match(/Ski season[\s\S]{0,40}?(\d+\s+\w+\s+\d{4})\s*[-–]\s*(\d+\s+\w+\s+\d{4})/i);
      const seasonEnd   = seasonM ? seasonM[2] : null;

      // Resort's own 7-day snow forecast (much richer than Open-Meteo alone)
      const newSnowMtnM = clean.match(/New snow Mtn\.\s*\d+m([\s\S]{0,600}?)New snow Base/);
      const resortForecast7d: Array<{ snowCm: number; tempMin: number; tempMax: number }> = [];
      if (newSnowMtnM) {
        for (const e of newSnowMtnM[1].matchAll(/(?:(\d+)\s*cm\s*|-\s*)([-−]?\d+)\/([-−]?\d+)°C/g)) {
          resortForecast7d.push({
            snowCm:  e[1] ? parseInt(e[1]) : 0,
            tempMin: parseInt(e[2].replace("−", "-")),
            tempMax: parseInt(e[3].replace("−", "-")),
          });
        }
      }

      // Snow line per day (pair: [mountain_snowline, base_snowline])
      const snowLineM = clean.match(/Snow line([\s\S]{0,400}?)New snow Mtn/);
      const snowLines: number[] = [];
      if (snowLineM) for (const v of snowLineM[1].matchAll(/(\d{1,4})\s*m/g)) snowLines.push(parseInt(v[1]));

      // Open-Meteo data for this resort
      const daily  = omData.daily  || {};
      const hourly = omData.hourly || {};
      const flH = (hourly.freezing_level_height || []) as number[];
      const avgFreezingLevel = flH.length
        ? Math.round(flH.filter(v => v != null).reduce((a, b) => a + b, 0) / flH.filter(v => v != null).length)
        : null;

      const detailDays = ((daily.time || []) as string[]).map((date, i) => ({
        date,
        resortSnowCm:  resortForecast7d[i]?.snowCm  ?? null,
        resortTempMin: resortForecast7d[i]?.tempMin ?? null,
        resortTempMax: resortForecast7d[i]?.tempMax ?? null,
        omSnowCm:      Math.round((daily.snowfall_sum?.[i]       || 0) * 10) / 10,
        snowDepthCm:   daily.snow_depth_max?.[i] != null ? Math.round(daily.snow_depth_max[i] * 100) : null,
        windGustKph:   Math.round(daily.wind_gusts_10m_max?.[i]  || 0),
        precipProb:    daily.precipitation_probability_max?.[i]  ?? null,
        weatherCode:   daily.weathercode?.[i]                    || 0,
        snowLineMtn:   snowLines[i * 2]     ?? null,
        snowLineBase:  snowLines[i * 2 + 1] ?? null,
      }));

      return Response.json({ slug: detailSlug, quality, lastSnowfall, seasonEnd, resortForecast7d, avgFreezingLevel, detailDays });
    }

    // ── LIST MODE ─────────────────────────────────────────────────────────────

    // Step 1: Scrape skiresort.info list pages (4 pages in parallel)
    const scrapePages = async () => {
      const results: Record<string, {
        topCm: number | null; baseCm: number | null;
        topElevR: number | null; baseElev: number | null;
        openKm: number | null; totalKm: number | null;
        openLifts: number | null; totalLifts: number | null;
      }> = {};
      await Promise.all([
        "https://www.skiresort.info/snow-reports/europe/",
        "https://www.skiresort.info/snow-reports/europe/page/2/",
        "https://www.skiresort.info/snow-reports/europe/page/3/",
        "https://www.skiresort.info/snow-reports/europe/page/4/",
      ].map(async (url) => {
        const resp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        const html   = await resp.text();
        const blocks = html.split(/(?=<div[^>]*class="[^"]*resort-list-item[^"]*")/).slice(1);
        for (const block of blocks) {
          const slugM = block.match(/ski-resort\/([^/]+)\//);
          if (!slugM || !(slugM[1] in resortMeta)) continue;
          const slug = slugM[1];
          const snowBlockM = block.match(/snowreport-snowhight["\s>]+([\s\S]*?)(?:snowreport-detail-button|col-sm-2 snowreport)/);
          const snowText = (snowBlockM ? snowBlockM[1] : block)
            .replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
          const topM    = snowText.match(/(\d+)\s*cm\s*top\s*\((\d+)\s*m\)/);
          const baseM   = snowText.match(/(\d+)\s*cm\s*base\s*\((\d+)\s*m\)/);
          const slopesM = block.match(/([\d.]+)\s*of\s*([\d.]+)\s*km/);
          const liftsM  = block.match(/(\d+)\s*of\s*(\d+)\s*lifts/);
          if (topM || baseM) {
            results[slug] = {
              topCm: topM ? parseInt(topM[1]) : null, baseCm: baseM ? parseInt(baseM[1]) : null,
              topElevR: topM ? parseInt(topM[2]) : null, baseElev: baseM ? parseInt(baseM[2]) : null,
              openKm: slopesM ? parseFloat(slopesM[1]) : null, totalKm: slopesM ? parseFloat(slopesM[2]) : null,
              openLifts: liftsM ? parseInt(liftsM[1]) : null, totalLifts: liftsM ? parseInt(liftsM[2]) : null,
            };
          }
        }
      }));
      return results;
    };

    // Step 2: Open-Meteo BATCH — single request for ALL resorts (fixes the concurrent-call failure)
    const fetchAllForecasts = async () => {
      const lats  = resortList.map(r => r.lat).join(",");
      const lons  = resortList.map(r => r.lon).join(",");
      const elevs = resortList.map(r => r.topElev).join(",");
      const url   = `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lats}&longitude=${lons}&elevation=${elevs}` +
        `&daily=snowfall_sum,snow_depth_max,temperature_2m_max,temperature_2m_min,` +
        `wind_gusts_10m_max,precipitation_probability_max,weathercode` +
        `&hourly=freezing_level_height` +
        `&timezone=auto&start_date=${fmt(today)}&end_date=${fmt(endDate)}&models=best_match`;
      try {
        const r    = await fetch(url);
        const data = await r.json();
        // Batch returns an array when multiple locations are given
        const arr: Array<typeof data> = Array.isArray(data) ? data : [data];
        return arr.map((d) => {
          const daily  = d.daily  || {};
          const hourly = d.hourly || {};
          const flH    = ((hourly.freezing_level_height || []) as (number | null)[]).filter(v => v != null) as number[];
          const avgFL  = flH.length ? Math.round(flH.reduce((a, b) => a + b, 0) / flH.length) : null;
          const snowSums = (daily.snowfall_sum || []) as (number | null)[];
          const totalSnow = snowSums.reduce((a, b) => a + (b ?? 0), 0);
          const tempMaxes = (daily.temperature_2m_max || []) as (number | null)[];
          const validTemps = tempMaxes.filter(v => v != null) as number[];
          const avgTempMax = validTemps.length ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;
          const gusts = (daily.wind_gusts_10m_max || []) as (number | null)[];
          const validGusts = gusts.filter(v => v != null) as number[];
          // BUG FIX: guard Math.max with default 0 so empty array doesn't give -Infinity
          const maxGust = validGusts.length ? Math.max(0, ...validGusts) : 0;
          const snowDepthNwp = daily.snow_depth_max?.[0] != null ? Math.round(daily.snow_depth_max[0] * 100) : null;
          const dailyData = ((daily.time || []) as string[]).map((date, i) => ({
            date,
            omSnowCm:    Math.round(((daily.snowfall_sum?.[i] as number) || 0) * 10) / 10,
            snowDepthCm: daily.snow_depth_max?.[i] != null ? Math.round((daily.snow_depth_max[i] as number) * 100) : null,
            tempMax:     Math.round(((daily.temperature_2m_max?.[i] as number) || 0) * 10) / 10,
            tempMin:     Math.round(((daily.temperature_2m_min?.[i] as number) || 0) * 10) / 10,
            windGustKph: Math.round((daily.wind_gusts_10m_max?.[i] as number) || 0),
            precipProb:  (daily.precipitation_probability_max?.[i] as number) ?? null,
            weatherCode: (daily.weathercode?.[i] as number) || 0,
          }));
          return { totalSnowfall: Math.round(totalSnow * 10) / 10, avgTempMax, snowDepthNwp, avgFreezingLevel: avgFL, maxGust, dailyData };
        });
      } catch {
        // Return empty forecasts on failure (batch failed)
        return resortList.map(() => ({ totalSnowfall: 0, avgTempMax: null, snowDepthNwp: null, avgFreezingLevel: null, maxGust: 0, dailyData: [] }));
      }
    };

    // Run scrape + batch forecast in parallel
    const [snowData, forecastArr] = await Promise.all([scrapePages(), fetchAllForecasts()]);

    const resorts = resortList.map((meta, idx) => {
      const snow     = snowData[meta.slug] || {};
      const forecast = forecastArr[idx]    || { totalSnowfall: 0, avgTempMax: null, snowDepthNwp: null, avgFreezingLevel: null, maxGust: 0, dailyData: [] };

      const topCm    = snow.topCm   ?? null;
      const baseCm   = snow.baseCm  ?? null;
      const openKm   = snow.openKm  ?? null;
      const totalKm  = snow.totalKm ?? null;
      const openPct  = (openKm && totalKm) ? Math.round((openKm / totalKm) * 100) : null;
      const baseElevM = snow.baseElev ?? 1200;

      const rainRisk    = forecast.avgFreezingLevel !== null && forecast.avgFreezingLevel < baseElevM + 200;
      const windWarning = forecast.maxGust > 70;

      // Scoring — use avgTempMax only when forecast is available (not null)
      const topScore   = topCm    ? Math.min(topCm  / 4, 30) : 0;
      const baseScore  = baseCm   ? Math.min(baseCm / 3, 25) : 0;
      const slopeScore = openPct  ? Math.min(openPct / 5, 20) : 0;
      const fcastScore = Math.min(forecast.totalSnowfall * 2, 15);
      const tempScore  = forecast.avgTempMax === null ? 5  // neutral when unavailable
        : forecast.avgTempMax < 0 ? 10 : forecast.avgTempMax < 3 ? 6 : forecast.avgTempMax < 6 ? 3 : 0;
      let score = Math.round(topScore + baseScore + slopeScore + fcastScore + tempScore);
      if (rainRisk)    score = Math.max(0, score - 15);
      if (windWarning) score = Math.max(0, score - 8);

      const conditionLabel = score >= 75 ? "Excellent" : score >= 58 ? "Great" : score >= 42 ? "Good" : score >= 28 ? "Fair" : "Poor";
      const conditionEmoji = score >= 75 ? "🏔️" : score >= 58 ? "✅" : score >= 42 ? "👍" : score >= 28 ? "⚠️" : "❌";

      return {
        ...meta, topCm, baseCm,
        topElevResort: snow.topElevR ?? meta.topElev,
        baseElev: snow.baseElev ?? null,
        openKm, totalKm, openPct,
        openLifts: snow.openLifts ?? null, totalLifts: snow.totalLifts ?? null,
        forecastSnow:    forecast.totalSnowfall,
        avgTempMax:      forecast.avgTempMax,
        snowDepthNwp:    forecast.snowDepthNwp,
        avgFreezingLevel: forecast.avgFreezingLevel,
        rainRisk, windWarning, maxGustKph: forecast.maxGust,
        dailyData:       forecast.dailyData,
        score, conditionLabel, conditionEmoji,
        hasData: topCm !== null || baseCm !== null,
      };
    });

    resorts.sort((a, b) => b.score - a.score);

    return Response.json({
      resorts,
      dateRange:    { start: fmt(today), end: fmt(endDate) },
      daysAhead:    days,
      dataSource:   "skiresort.info (resort-reported) + Open-Meteo batch (elevation-corrected, 1 API call)",
      resortCount:  resorts.length,
      withData:     resorts.filter(r => r.hasData).length,
      forecastOk:   forecastArr.some(f => f.dailyData.length > 0),
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
