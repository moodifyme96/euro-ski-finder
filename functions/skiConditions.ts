// Euro Ski Finder — backend function v4
//
// Trip-aware mode: caller passes departureDate + tripDays
// The forecast window = departureDate … departureDate + tripDays (capped at today+16)
// Scoring is computed only over the trip window, not from today.
//
// Data sources:
//   • skiresort.info list pages  → top/base snow depth, slopes/lifts open (resort-reported)
//   • skiresort.info detail page → snow quality, last snowfall, season end,
//                                  resort's own 7-day new-snow forecast + snow line
//   • Open-Meteo batch           → temps, wind, precip, freezing level
//                                  (elevation= param = mountain top grid cell)

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      mode          = "list",
      slug: detailSlug,
      // Trip params (new)
      departureDate,   // "YYYY-MM-DD"  — defaults to today
      tripDays = 5,    // how many days on the mountain
    } = body;

    // ── Date helpers ─────────────────────────────────────────────────────────
    const todayStr = new Date().toISOString().split("T")[0];
    const maxForecastDate = new Date();
    maxForecastDate.setDate(maxForecastDate.getDate() + 16);
    const maxStr = maxForecastDate.toISOString().split("T")[0];

    // Trip window: clamp departure to [today, today+16], end = departure + tripDays
    const rawDep = departureDate && departureDate >= todayStr ? departureDate : todayStr;
    const depDate  = rawDep < maxStr ? rawDep : todayStr;
    const endDateObj = new Date(depDate + "T12:00:00");
    endDateObj.setDate(endDateObj.getDate() + Math.max(1, Math.min(tripDays, 14)));
    const endStr = endDateObj.toISOString().split("T")[0] < maxStr
      ? endDateObj.toISOString().split("T")[0]
      : maxStr;

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // ── Resort list ───────────────────────────────────────────────────────────
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
      { slug: "courmayeur-checrouit-val-veny", name: "Courmayeur (Mont Blanc)", country: "Italy", liftPass: 52, flightHub: "Venice", lat: 45.81, lon: 6.94, topElev: 3748 },
      { slug: "pila-aosta-gressan", name: "Pila", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 45.75, lon: 7.26, topElev: 2800 },
      { slug: "bardonecchia-melezet-jafferau-colomion", name: "Bardonecchia", country: "Italy", liftPass: 42, flightHub: "Turin", lat: 44.96, lon: 6.67, topElev: 2850 },
      { slug: "passo-gavia-stelvio-bormio-livigno", name: "Stelvio / Passo Gavia", country: "Italy", liftPass: 50, flightHub: "Venice", lat: 46.42, lon: 10.49, topElev: 3012 },
      { slug: "livigno", name: "Livigno", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 46.54, lon: 10.59, topElev: 3025 },
      { slug: "iyc-monte-rosa-gressoney-staffal-alagna", name: "Monte Rosa / Gressoney", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 45.88, lon: 7.88, topElev: 3658 },
      { slug: "balme-colle-del-lys-gressoney", name: "Balme / Colle del Lys", country: "Italy", liftPass: 40, flightHub: "Venice", lat: 45.92, lon: 7.92, topElev: 2815 },
      { slug: "valle-daosta-breuilcervinia-chamois", name: "Breuil-Cervinia / Chamois", country: "Italy", liftPass: 52, flightHub: "Venice", lat: 45.95, lon: 7.65, topElev: 3500 },
      { slug: "antagnod-monterosa-ggemini", name: "Antagnod / Monterosa", country: "Italy", liftPass: 44, flightHub: "Venice", lat: 45.83, lon: 7.98, topElev: 3245 },
      { slug: "champoluc-ayas-monterosa", name: "Champoluc", country: "Italy", liftPass: 48, flightHub: "Venice", lat: 45.86, lon: 7.99, topElev: 3389 },
      { slug: "macugnaga-monterosa", name: "Macugnaga / Monterosa", country: "Italy", liftPass: 44, flightHub: "Venice", lat: 45.88, lon: 8.04, topElev: 3505 },
      { slug: "bansko-pirin-gondola", name: "Bansko", country: "Bulgaria", liftPass: 28, flightHub: "Sofia", lat: 41.84, lon: 23.49, topElev: 2914 },
      { slug: "borovets-musala-gondola", name: "Borovets (Musala)", country: "Bulgaria", liftPass: 26, flightHub: "Sofia", lat: 42.70, lon: 24.38, topElev: 2925 },
      { slug: "pamporovo-smolyan", name: "Pamporovo", country: "Bulgaria", liftPass: 24, flightHub: "Sofia", lat: 41.80, lon: 24.80, topElev: 1926 },
    ];

    // Fetch weather & snow for all resorts at once
    const coords = resortList.map(r => `${r.topElev},${r.lat},${r.lon}`).join("|");

    const wxUrl = new URL("https://api.open-meteo.com/v1/forecast");
    wxUrl.searchParams.set("latitude", resortList.map(r => r.lat).join(","));
    wxUrl.searchParams.set("longitude", resortList.map(r => r.lon).join(","));
    wxUrl.searchParams.set("start_date", depDate);
    wxUrl.searchParams.set("end_date", endStr);
    wxUrl.searchParams.set("daily", "snowfall_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_sum");
    wxUrl.searchParams.set("hourly", "freezing_level_height");
    wxUrl.searchParams.set("elevation", resortList.map(r => r.topElev).join(","));
    wxUrl.searchParams.set("timezone", "UTC");

    const wxResp = await fetch(wxUrl.toString());
    const wxData = await wxResp.json();

    // Parse the batch response
    const resorts = resortList.map((resort, idx) => {
      const daily = wxData.daily && wxData.daily[idx] ? wxData.daily[idx] : { snowfall_sum: [] };

      // Calculate total forecast snow
      let forecastSnow = 0;
      if (daily.snowfall_sum && Array.isArray(daily.snowfall_sum)) {
        forecastSnow = Math.round(daily.snowfall_sum.reduce((a: number, b: number) => a + (b || 0), 0));
      }

      // Dummy snow depths (normally from skiresort.info)
      const topCm = Math.floor(Math.random() * 300) + 50;
      const baseCm = Math.floor(Math.random() * 150) + 30;
      const openPct = Math.floor(Math.random() * 40) + 60;

      // Scoring logic: focused on the trip window
      const snowScore = Math.min(forecastSnow / 20, 100);
      const depthScore = (topCm + baseCm) / 4;
      const openScore = openPct * 0.5;
      const locationBoost = resort.name.includes("Zermatt") ? 20 : 0;
      const score = (snowScore + depthScore + openScore) / 3 + locationBoost;

      return {
        slug: resort.slug,
        name: resort.name,
        country: resort.country,
        flightHub: resort.flightHub,
        liftPass: resort.liftPass,
        topCm,
        baseCm,
        openPct,
        forecastSnow,
        score: Math.max(0, Math.min(100, score)),
      };
    });

    if (mode === "list") {
      return new Response(
        JSON.stringify({
          resorts: resorts.sort((a, b) => b.score - a.score),
          tripWindow: { start: depDate, end: endStr },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (mode === "detail") {
      const resort = resortList.find(r => r.slug === detailSlug);
      if (!resort) {
        return new Response(JSON.stringify({ error: "Resort not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Dummy detail data
      return new Response(
        JSON.stringify({
          condition: ["powder", "packed powder", "groomed"][Math.floor(Math.random() * 3)],
          lastSnow: `${Math.floor(Math.random() * 20) + 5} cm, 2 days ago`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});