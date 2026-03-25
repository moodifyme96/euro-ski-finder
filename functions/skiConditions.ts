// Fetches real resort-reported snow data from skiresort.info + Open-Meteo forecasts
// Snow depths are exactly as reported by the resorts themselves (updated daily)

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { days = 3 } = body;

    const resortMeta: Record<string, { name: string; country: string; liftPass: number; flightHub: string; lat: number; lon: number }> = {
      // ── FRANCE ──────────────────────────────────────────────────────────────
      "tignes-val-disere": { name: "Tignes / Val d'Isère", country: "France", liftPass: 75, flightHub: "Geneva", lat: 45.47, lon: 6.91 },
      "les-3-vallees-val-thorens-les-menuires-meribel-courchevel": { name: "3 Vallées (Val Thorens / Méribel / Courchevel)", country: "France", liftPass: 78, flightHub: "Geneva", lat: 45.29, lon: 6.58 },
      "les-arcs-peisey-vallandry-paradiski": { name: "Les Arcs / Paradiski", country: "France", liftPass: 65, flightHub: "Geneva", lat: 45.57, lon: 6.80 },
      "la-plagne-paradiski": { name: "La Plagne / Paradiski", country: "France", liftPass: 68, flightHub: "Geneva", lat: 45.51, lon: 6.68 },
      "alpe-dhuez": { name: "Alpe d'Huez", country: "France", liftPass: 70, flightHub: "Geneva", lat: 45.09, lon: 6.07 },
      "les-2-alpes": { name: "Les 2 Alpes", country: "France", liftPass: 62, flightHub: "Geneva", lat: 45.00, lon: 6.12 },
      "brevent-flegere-chamonix": { name: "Chamonix – Brévent / Flégère", country: "France", liftPass: 72, flightHub: "Geneva", lat: 45.92, lon: 6.87 },
      "grands-montets-argentiere-chamonix": { name: "Chamonix – Grands Montets", country: "France", liftPass: 72, flightHub: "Geneva", lat: 45.97, lon: 6.92 },
      "les-houches-saint-gervais-prarion-bellevue-chamonix": { name: "Les Houches / Saint-Gervais (Chamonix)", country: "France", liftPass: 58, flightHub: "Geneva", lat: 45.89, lon: 6.80 },
      "les-portes-du-soleil-morzine-avoriaz-les-gets-chatel-morgins-champery": { name: "Portes du Soleil (Morzine / Avoriaz)", country: "France", liftPass: 60, flightHub: "Geneva", lat: 46.18, lon: 6.72 },
      // ── SPAIN ───────────────────────────────────────────────────────────────
      "sierra-nevada-pradollano": { name: "Sierra Nevada", country: "Spain", liftPass: 38, flightHub: "Málaga", lat: 37.09, lon: -3.40 },
      // ── SWITZERLAND ─────────────────────────────────────────────────────────
      "zermatt-breuil-cervinia-valtournenche-matterhorn": { name: "Zermatt / Cervinia (Matterhorn)", country: "Switzerland", liftPass: 85, flightHub: "Geneva", lat: 46.00, lon: 7.73 },
      "4-vallees-verbier-la-tzoumaz-nendaz-veysonnaz-thyon": { name: "Verbier / 4 Vallées", country: "Switzerland", liftPass: 82, flightHub: "Geneva", lat: 46.07, lon: 7.28 },
      "saas-fee": { name: "Saas-Fee", country: "Switzerland", liftPass: 75, flightHub: "Geneva", lat: 46.11, lon: 7.93 },
      "laax-flims-falera": { name: "Laax / Flims", country: "Switzerland", liftPass: 72, flightHub: "Zurich", lat: 46.83, lon: 9.28 },
      "parsenn-davos-klosters": { name: "Davos / Klosters (Parsenn)", country: "Switzerland", liftPass: 78, flightHub: "Zurich", lat: 46.83, lon: 9.85 },
      "andermatt-oberalp-sedrun": { name: "Andermatt / Sedrun", country: "Switzerland", liftPass: 68, flightHub: "Zurich", lat: 46.64, lon: 8.59 },
      "crans-montana": { name: "Crans-Montana", country: "Switzerland", liftPass: 72, flightHub: "Geneva", lat: 46.31, lon: 7.48 },
      "schilthorn-muerren-lauterbrunnen": { name: "Schilthorn / Mürren", country: "Switzerland", liftPass: 65, flightHub: "Zurich", lat: 46.56, lon: 7.90 },
      "kleine-scheidegg-maennlichen-grindelwald-wengen": { name: "Grindelwald / Wengen / Männlichen", country: "Switzerland", liftPass: 70, flightHub: "Zurich", lat: 46.62, lon: 8.04 },
      "titlis-engelberg": { name: "Engelberg (Titlis)", country: "Switzerland", liftPass: 72, flightHub: "Zurich", lat: 46.82, lon: 8.39 },
      "glacier-3000-les-diablerets": { name: "Glacier 3000 / Les Diablerets", country: "Switzerland", liftPass: 60, flightHub: "Geneva", lat: 46.35, lon: 7.18 },
      // ── AUSTRIA ─────────────────────────────────────────────────────────────
      "st-anton-st-christoph-stuben-lech-zuers-warth-schroecken-ski-arlberg": { name: "Ski Arlberg (St. Anton / Lech / Zürs)", country: "Austria", liftPass: 62, flightHub: "Innsbruck", lat: 47.08, lon: 10.23 },
      "ischgl-samnaun-silvretta-arena": { name: "Ischgl / Silvretta Arena", country: "Austria", liftPass: 68, flightHub: "Innsbruck", lat: 47.01, lon: 10.29 },
      "soelden": { name: "Sölden", country: "Austria", liftPass: 60, flightHub: "Innsbruck", lat: 46.95, lon: 11.00 },
      "kitzski-kitzbuehel-kirchberg": { name: "Kitzbühel (KitzSki)", country: "Austria", liftPass: 65, flightHub: "Innsbruck", lat: 47.40, lon: 12.38 },
      "obertauern": { name: "Obertauern", country: "Austria", liftPass: 58, flightHub: "Salzburg", lat: 47.25, lon: 13.57 },
      "mayrhofen-penken-ahorn-rastkogel-eggalm-mountopolis": { name: "Mayrhofen", country: "Austria", liftPass: 55, flightHub: "Innsbruck", lat: 47.17, lon: 11.87 },
      "stubai-glacier-stubaier-gletscher": { name: "Stubai Glacier", country: "Austria", liftPass: 58, flightHub: "Innsbruck", lat: 47.06, lon: 11.13 },
      "hintertux-glacier-hintertuxer-gletscher": { name: "Hintertux Glacier", country: "Austria", liftPass: 62, flightHub: "Innsbruck", lat: 47.06, lon: 11.67 },
      "skiwelt-wilder-kaiser-brixental": { name: "SkiWelt Wilder Kaiser", country: "Austria", liftPass: 60, flightHub: "Innsbruck", lat: 47.44, lon: 12.17 },
      "kitzsteinhorn-maiskogel-kaprun": { name: "Kitzsteinhorn / Kaprun (Glacier)", country: "Austria", liftPass: 62, flightHub: "Salzburg", lat: 47.19, lon: 12.70 },
      "zillertal-arena-zell-am-ziller-gerlos-koenigsleiten-hochkrimml": { name: "Zillertal Arena", country: "Austria", liftPass: 58, flightHub: "Innsbruck", lat: 47.23, lon: 12.04 },
      "serfaus-fiss-ladis": { name: "Serfaus-Fiss-Ladis", country: "Austria", liftPass: 62, flightHub: "Innsbruck", lat: 47.04, lon: 10.61 },
      // ── ITALY ───────────────────────────────────────────────────────────────
      // Dolomites – Sella Ronda & surrounds
      "val-gardena-groeden": { name: "Val Gardena – Sella Ronda (Dolomites)", country: "Italy", liftPass: 55, flightHub: "Venice", lat: 46.56, lon: 11.77 },
      "alta-badia": { name: "Alta Badia – Sella Ronda (Dolomites)", country: "Italy", liftPass: 55, flightHub: "Venice", lat: 46.60, lon: 11.93 },
      "arabba-marmolada": { name: "Arabba / Marmolada – Sella Ronda", country: "Italy", liftPass: 55, flightHub: "Venice", lat: 46.50, lon: 11.88 },
      "belvedere-col-rodella-ciampac-buffaure-canazei-campitello-alba-pozza-di-fassa": { name: "Val di Fassa (Canazei / Campitello) – Sella Ronda", country: "Italy", liftPass: 52, flightHub: "Venice", lat: 46.48, lon: 11.76 },
      "cortina-dampezzo": { name: "Cortina d'Ampezzo", country: "Italy", liftPass: 58, flightHub: "Venice", lat: 46.54, lon: 12.14 },
      "3-zinnen-dolomites-helm-stiergarten-rotwand-kreuzbergpass": { name: "3 Zinnen Dolomites (Drei Zinnen)", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 46.69, lon: 12.33 },
      "kronplatz-plan-de-corones": { name: "Kronplatz / Plan de Corones", country: "Italy", liftPass: 52, flightHub: "Venice", lat: 46.74, lon: 11.92 },
      "alpe-di-siusi-seiser-alm": { name: "Alpe di Siusi / Seiser Alm", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 46.54, lon: 11.63 },
      "carezza": { name: "Carezza / Karersee (Dolomites)", country: "Italy", liftPass: 45, flightHub: "Venice", lat: 46.41, lon: 11.59 },
      "latemar-obereggen-pampeago-predazzo": { name: "Latemar / Obereggen (Dolomites)", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 46.37, lon: 11.54 },
      // Cervinia / Aosta Valley
      "courmayeur-checrouit-val-veny": { name: "Courmayeur (Mont Blanc)", country: "Italy", liftPass: 58, flightHub: "Geneva", lat: 45.79, lon: 6.97 },
      "alagna-valsesia-gressoney-la-trinite-champoluc-frachey-monterosa-ski": { name: "Monterosa Ski (Champoluc / Gressoney)", country: "Italy", liftPass: 52, flightHub: "Milan", lat: 45.83, lon: 7.72 },
      // Milky Way / Via Lattea
      "via-lattea-sestriere-sauze-doulx-san-sicario-claviere-montgenevre": { name: "Via Lattea (Sestriere / Sauze d'Oulx)", country: "Italy", liftPass: 50, flightHub: "Turin", lat: 44.96, lon: 6.89 },
      "bardonecchia": { name: "Bardonecchia", country: "Italy", liftPass: 42, flightHub: "Turin", lat: 45.08, lon: 6.70 },
      // Livigno & Valtellina
      "livigno": { name: "Livigno (tax-free resort)", country: "Italy", liftPass: 48, flightHub: "Milan", lat: 46.55, lon: 10.14 },
      "bormio-cima-bianca": { name: "Bormio", country: "Italy", liftPass: 45, flightHub: "Milan", lat: 46.47, lon: 10.37 },
      "madonna-di-campiglio-pinzolo-folgarida-marilleva": { name: "Madonna di Campiglio", country: "Italy", liftPass: 55, flightHub: "Milan", lat: 46.26, lon: 10.84 },
      // Tonale / South Tyrol
      "ponte-di-legno-tonale-presena-glacier-temu-pontedilegno-tonale": { name: "Ponte di Legno / Tonale (Glacier)", country: "Italy", liftPass: 48, flightHub: "Milan", lat: 46.25, lon: 10.52 },
      "val-senales-glacier-schnalstaler-gletscher": { name: "Val Senales Glacier (Schnals)", country: "Italy", liftPass: 45, flightHub: "Innsbruck", lat: 46.80, lon: 10.84 },
      // ── ANDORRA ─────────────────────────────────────────────────────────────
      "grandvalira-pas-de-la-casa-grau-roig-soldeu-el-tarter-canillo-encamp": { name: "Grandvalira (Andorra) – Soldeu / Pas de la Casa", country: "Andorra", liftPass: 42, flightHub: "Barcelona", lat: 42.55, lon: 1.74 },
      "pal-arinsal-la-massana": { name: "Pal Arinsal (Andorra)", country: "Andorra", liftPass: 38, flightHub: "Barcelona", lat: 42.57, lon: 1.52 },
      // ── BULGARIA ────────────────────────────────────────────────────────────
      "bansko": { name: "Bansko", country: "Bulgaria", liftPass: 38, flightHub: "Sofia", lat: 41.84, lon: 23.49 },
      "borovets": { name: "Borovets", country: "Bulgaria", liftPass: 32, flightHub: "Sofia", lat: 42.27, lon: 23.60 },
    };

    // Scrape skiresort.info Europe snow reports (pages 1–4 to cover all resorts)
    const scrapePages = async () => {
      const results: Record<string, {
        topCm: number | null; baseCm: number | null;
        topElev: number | null; baseElev: number | null;
        openKm: number | null; totalKm: number | null;
        openLifts: number | null; totalLifts: number | null;
      }> = {};

      const urls = [
        "https://www.skiresort.info/snow-reports/europe/",
        "https://www.skiresort.info/snow-reports/europe/page/2/",
        "https://www.skiresort.info/snow-reports/europe/page/3/",
        "https://www.skiresort.info/snow-reports/europe/page/4/",
      ];

      await Promise.all(urls.map(async (url) => {
        const resp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
        });
        const html = await resp.text();
        const blocks = html.split(/(?=<div[^>]*class="[^"]*resort-list-item[^"]*")/).slice(1);

        for (const block of blocks) {
          const slugM = block.match(/ski-resort\/([^/]+)\//);
          if (!slugM) continue;
          const slug = slugM[1];
          if (!(slug in resortMeta)) continue;

          // Extract the dedicated snow height element first
          const snowBlockM = block.match(/snowreport-snowhight["\s>]+([\s\S]*?)(?:snowreport-detail-button|col-sm-2 snowreport)/);
          const snowText = (snowBlockM ? snowBlockM[1] : block)
            .replace(/<[^>]+>/g, " ")
            .replace(/&[^;]+;/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          const topM  = snowText.match(/(\d+)\s*cm\s*top\s*\((\d+)\s*m\)/);
          const baseM = snowText.match(/(\d+)\s*cm\s*base\s*\((\d+)\s*m\)/);
          const slopesM = block.match(/([\d.]+)\s*of\s*([\d.]+)\s*km/);
          const liftsM  = block.match(/(\d+)\s*of\s*(\d+)\s*lifts/);

          if (topM || baseM) {
            results[slug] = {
              topCm:    topM  ? parseInt(topM[1])    : null,
              baseCm:   baseM ? parseInt(baseM[1])   : null,
              topElev:  topM  ? parseInt(topM[2])    : null,
              baseElev: baseM ? parseInt(baseM[2])   : null,
              openKm:   slopesM ? parseFloat(slopesM[1]) : null,
              totalKm:  slopesM ? parseFloat(slopesM[2]) : null,
              openLifts:  liftsM ? parseInt(liftsM[1]) : null,
              totalLifts: liftsM ? parseInt(liftsM[2]) : null,
            };
          }
        }
      }));

      return results;
    };

    // Open-Meteo forecast
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + Math.min(days, 7));
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const fetchForecast = async (lat: number, lon: number) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${fmt(today)}&end_date=${fmt(endDate)}`;
        const r = await fetch(url);
        const data = await r.json();
        const daily = data.daily || {};
        const totalSnowfall = (daily.snowfall_sum || []).reduce((a: number, b: number) => a + (b || 0), 0);
        const temps = daily.temperature_2m_max || [];
        const avgTempMax = temps.length ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length : 5;
        const dailyData = (daily.time || []).map((date: string, i: number) => ({
          date,
          snowfall: Math.round((daily.snowfall_sum?.[i] || 0) * 10) / 10,
          tempMax:  Math.round((daily.temperature_2m_max?.[i]  || 0) * 10) / 10,
          tempMin:  Math.round((daily.temperature_2m_min?.[i]  || 0) * 10) / 10,
          weatherCode: daily.weathercode?.[i] || 0,
        }));
        return { totalSnowfall: Math.round(totalSnowfall * 10) / 10, avgTempMax: Math.round(avgTempMax * 10) / 10, dailyData };
      } catch {
        return { totalSnowfall: 0, avgTempMax: 5, dailyData: [] };
      }
    };

    const [snowData, forecasts] = await Promise.all([
      scrapePages(),
      Promise.all(
        Object.entries(resortMeta).map(async ([slug, meta]) => ({
          slug,
          forecast: await fetchForecast(meta.lat, meta.lon)
        }))
      )
    ]);

    const forecastMap = Object.fromEntries(forecasts.map(f => [f.slug, f.forecast]));

    const resorts = Object.entries(resortMeta).map(([slug, meta]) => {
      const snow = snowData[slug] || {};
      const forecast = forecastMap[slug] || { totalSnowfall: 0, avgTempMax: 5, dailyData: [] };

      const topCm   = snow.topCm   ?? null;
      const baseCm  = snow.baseCm  ?? null;
      const openKm  = snow.openKm  ?? null;
      const totalKm = snow.totalKm ?? null;
      const openPct = (openKm && totalKm) ? Math.round((openKm / totalKm) * 100) : null;

      const topScore   = topCm   ? Math.min(topCm  / 4, 30) : 0;
      const baseScore  = baseCm  ? Math.min(baseCm / 3, 25) : 0;
      const slopeScore = openPct ? Math.min(openPct / 5, 20) : 0;
      const fcastScore = Math.min(forecast.totalSnowfall * 2, 15);
      const tempScore  = forecast.avgTempMax < 0 ? 10 : forecast.avgTempMax < 3 ? 6 : forecast.avgTempMax < 6 ? 3 : 0;
      const score = Math.round(topScore + baseScore + slopeScore + fcastScore + tempScore);

      const conditionLabel = score >= 75 ? "Excellent" : score >= 58 ? "Great" : score >= 42 ? "Good" : score >= 28 ? "Fair" : "Poor";
      const conditionEmoji = score >= 75 ? "🏔️" : score >= 58 ? "✅" : score >= 42 ? "👍" : score >= 28 ? "⚠️" : "❌";

      return {
        ...meta, slug,
        topCm, baseCm,
        topElev:    snow.topElev    ?? null,
        baseElev:   snow.baseElev   ?? null,
        openKm, totalKm, openPct,
        openLifts:  snow.openLifts  ?? null,
        totalLifts: snow.totalLifts ?? null,
        forecastSnow: forecast.totalSnowfall,
        avgTempMax:   forecast.avgTempMax,
        dailyData:    forecast.dailyData,
        score, conditionLabel, conditionEmoji,
        hasData: topCm !== null || baseCm !== null,
      };
    });

    resorts.sort((a, b) => b.score - a.score);

    return Response.json({
      resorts,
      dateRange: { start: fmt(today), end: fmt(endDate) },
      daysAhead: days,
      dataSource: "skiresort.info (resort-reported, daily) + Open-Meteo forecast",
      resortCount: resorts.length,
      withData: resorts.filter(r => r.hasData).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
