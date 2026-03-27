import { useState, useCallback } from "react";
import { callBackendFunction } from "@/api/backendFunctions";

const WX = {
  0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
  51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",
  71:"🌨️",73:"❄️",75:"❄️",77:"❄️",80:"🌧️",81:"🌧️",
  82:"⛈️",85:"🌨️",86:"❄️",95:"⛈️",96:"⛈️",99:"⛈️",
};
const QUALITY_EMOJI = {
  powder:"🌟","packed powder":"✅",packed:"✅",groomed:"🎿",
  gripping:"👍",icy:"⚠️",slushy:"⚠️",spring:"🌤️",wet:"🌧️",artificial:"🏭",
};
const FLAG = c => ({Switzerland:"🇨🇭",Austria:"🇦🇹",France:"🇫🇷",Italy:"🇮🇹",Andorra:"🇦🇩",Spain:"🇪🇸",Bulgaria:"🇧🇬"}[c]||"🏔️");
const fmtDate = d => new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
const fmtDay  = d => new Date(d+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});

// Today's date string for min= on date picker
const todayStr = () => new Date().toISOString().split("T")[0];
// Max date: today + 14
const maxDateStr = () => { const d = new Date(); d.setDate(d.getDate()+14); return d.toISOString().split("T")[0]; };

const depthColor = (cm, isTop) => {
  if (cm == null) return "#475569";
  if (isTop) return cm>=150?"#67e8f9":cm>=80?"#93c5fd":cm>=40?"#fbbf24":"#f87171";
  return cm>=80?"#a78bfa":cm>=40?"#93c5fd":cm>=20?"#fbbf24":"#f87171";
};

export default function Home() {
  // Default departure = tomorrow, duration = 5 days
  const tomorrow = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };

  const [departure, setDeparture]   = useState(tomorrow());
  const [tripDays, setTripDays]     = useState(5);
  const [resorts, setResorts]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [loaded, setLoaded]         = useState(false);
  const [tripWindow, setTripWindow] = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [filter, setFilter]         = useState("All");
  const [sortBy, setSortBy]         = useState("score");
  const [error, setError]           = useState(null);
  const [detailData, setDetailData]         = useState({});
  const [detailLoading, setDetailLoading]   = useState({});

  const countries = ["All", ...Array.from(new Set(resorts.map(r => r.country))).sort()];

  const fetchList = async () => {
    setLoading(true); setLoaded(false); setExpanded(null); setError(null);
    try {
      const data = await callBackendFunction("skiConditions", {
        mode: "list",
        departureDate: departure,
        tripDays,
      });
      setResorts(data.resorts || []);
      setTripWindow(data.tripWindow);
      setLoaded(true);
    } catch { setError("Failed to load. Please try again."); }
    setLoading(false);
  };

  const fetchDetail = useCallback(async (slug) => {
    if (detailData[slug] || detailLoading[slug]) return;
    setDetailLoading(p => ({ ...p, [slug]: true }));
    try {
      const data = await callBackendFunction("skiConditions", {
        mode: "detail", slug,
        departureDate: departure,
        tripDays,
      });
      setDetailData(p => ({ ...p, [slug]: data }));
    } catch {}
    setDetailLoading(p => ({ ...p, [slug]: false }));
  }, [detailData, detailLoading, departure, tripDays]);

  const toggleExpand = (slug) => {
    const next = expanded === slug ? null : slug;
    setExpanded(next);
    if (next) fetchDetail(next);
  };

  const filtered = resorts
    .filter(r => filter === "All" || r.country === filter)
    .sort((a, b) => {
      if (sortBy === "score")    return b.score - a.score;
      if (sortBy === "top")      return (b.topCm||0) - (a.topCm||0);
      if (sortBy === "base")     return (b.baseCm||0) - (a.baseCm||0);
      if (sortBy === "slopes")   return (b.openPct||0) - (a.openPct||0);
      if (sortBy === "forecast") return b.forecastSnow - a.forecastSnow;
      if (sortBy === "price")    return a.liftPass - b.liftPass;
      return 0;
    });

  // Google Flights deep link: TLV → hub on departure date
  const flightUrl = (hub, dep) => {
    const d = dep.replace(/-/g, "");
    return `https://www.google.com/flights#flt=TLV.${hub}.${d};c:USD;e:1`;
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0c1a2e 100%)",color:"#e2e8f0",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* ── Header ── */}
      <div style={{textAlign:"center",padding:"36px 20px 20px"}}>
        <div style={{fontSize:52}}>⛷️</div>
        <h1 style={{fontSize:28,fontWeight:800,margin:"8px 0 0",background:"linear-gradient(90deg,#60a5fa,#a78bfa,#67e8f9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          Last-Minute Ski Finder
        </h1>
        <p style={{color:"#475569",marginTop:6,fontSize:13}}>
          Resort-reported snow depths · Elevation-corrected mountain forecasts · 57 European resorts
        </p>
      </div>

      {/* ── Trip planner panel ── */}
      <div style={{maxWidth:960,margin:"0 auto 28px",padding:"0 16px"}}>
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:"20px 24px"}}>

          <div style={{fontSize:11,color:"#64748b",marginBottom:14,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>
            Plan your ski trip
          </div>

          <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-end"}}>

            {/* Departure date */}
            <div style={{flex:"1 1 160px"}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:6,fontWeight:500}}>✈️ Departure from TLV</div>
              <input
                type="date"
                value={departure}
                min={todayStr()}
                max={maxDateStr()}
                onChange={e => { setDeparture(e.target.value); setLoaded(false); setDetailData({}); }}
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:"#0f172a", border:"1px solid #334155",
                  color:"#e2e8f0", borderRadius:8, padding:"9px 11px",
                  fontSize:14, fontWeight:600, cursor:"pointer",
                  colorScheme:"dark",
                }}
              />
            </div>

            {/* Trip duration */}
            <div style={{flex:"1 1 220px"}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:6,fontWeight:500}}>
                🏔️ Trip duration — <span style={{color:"#60a5fa",fontWeight:700}}>{tripDays} days on the mountain</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[3,4,5,6,7,10,14].map(d => (
                  <button key={d} onClick={() => { setTripDays(d); setLoaded(false); setDetailData({}); }} style={{
                    padding:"7px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                    background:tripDays===d?"linear-gradient(135deg,#3b82f6,#8b5cf6)":"rgba(255,255,255,0.08)",
                    color:tripDays===d?"#fff":"#94a3b8",
                  }}>{d}d</button>
                ))}
              </div>
            </div>

            {/* Search button */}
            <div style={{flex:"0 0 auto"}}>
              <button onClick={fetchList} disabled={loading} style={{
                padding:"11px 30px", borderRadius:10, border:"none",
                cursor:loading?"not-allowed":"pointer",
                background:loading?"#374151":"linear-gradient(135deg,#3b82f6,#8b5cf6)",
                color:"#fff", fontSize:14, fontWeight:700,
                boxShadow:loading?"none":"0 4px 18px rgba(59,130,246,0.35)",
              }}>
                {loading ? "🔄 Searching…" : "🔍 Find Best Resorts"}
              </button>
            </div>
          </div>

          {/* Trip summary line */}
          {departure && (
            <div style={{marginTop:14,padding:"8px 12px",background:"rgba(59,130,246,0.07)",borderRadius:8,border:"1px solid rgba(59,130,246,0.15)",fontSize:12,color:"#93c5fd"}}>
              📅 Flying out <strong>{fmtDate(departure)}</strong> · {tripDays} days skiing ·
              forecast covers <strong>{fmtDate(departure)}</strong> →
              <strong> {fmtDate((() => { const d=new Date(departure+"T12:00:00"); d.setDate(d.getDate()+tripDays); return d.toISOString().split("T")[0]; })())}</strong>
            </div>
          )}
        </div>
      </div>

      {error&&(
        <div style={{maxWidth:960,margin:"0 auto 16px",padding:"0 16px"}}>
          <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,padding:"12px 16px",color:"#fca5a5"}}>{error}</div>
        </div>
      )}

      {loaded&&(
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 16px 56px"}}>

          {/* ── Filter / sort bar ── */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:10}}>
            <div style={{fontSize:12,color:"#475569"}}>
              Showing <strong style={{color:"#64748b"}}>{filtered.length}</strong> resorts ranked by conditions during your trip
            </div>
            <div style={{display:"flex",gap:8}}>
              <select value={filter} onChange={e=>setFilter(e.target.value)} style={{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"5px 9px",fontSize:12}}>
                {countries.map(c=><option key={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"5px 9px",fontSize:12}}>
                <option value="score">Best Overall</option>
                <option value="top">Peak Snow Depth</option>
                <option value="base">Base Snow Depth</option>
                <option value="slopes">% Slopes Open</option>
                <option value="forecast">Most New Snow</option>
                <option value="price">Cheapest Pass</option>
              </select>
            </div>
          </div>

          {/* ── Legend ── */}
          <div style={{display:"flex",gap:14,marginBottom:12,padding:"7px 12px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.05)",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"#475569",fontWeight:600,alignSelf:"center"}}>Key:</span>
            <span style={{fontSize:11,color:"#67e8f9"}}>❄️ Peak depth (summit)</span>
            <span style={{fontSize:11,color:"#a78bfa"}}>🎿 Base depth (bottom lift)</span>
            <span style={{fontSize:11,color:"#4ade80"}}>📡 New snow during trip</span>
            <span style={{fontSize:11,color:"#334155"}}>· Click resort for daily forecast ▼</span>
          </div>

          {/* ── Resort list ── */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.map((resort,idx) => {
              const isOpen     = expanded === resort.slug;
              const detail     = detailData[resort.slug];
              const detLoading = detailLoading[resort.slug];

              return (
                <div key={resort.slug}>

                  {/* ── Card row ── */}
                  <div
                    onClick={() => toggleExpand(resort.slug)}
                    style={{
                      background:idx===0
                        ?"linear-gradient(135deg,rgba(59,130,246,0.13),rgba(139,92,246,0.13))"
                        :"rgba(255,255,255,0.03)",
                      border:`1px solid ${isOpen?"rgba(99,102,241,0.55)":idx<3?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.07)"}`,
                      borderRadius:isOpen?"12px 12px 0 0":12,
                      padding:"12px 14px",
                      cursor:"pointer",
                    }}
                  >
                    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>

                      {/* Rank */}
                      <div style={{fontSize:14,fontWeight:800,minWidth:24,color:idx===0?"#fbbf24":idx===1?"#94a3b8":idx===2?"#cd7c3a":"#475569"}}>
                        {idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":`#${idx+1}`}
                      </div>

                      {/* Name + meta */}
                      <div style={{flex:"1 1 140px",minWidth:130}}>
                        <div style={{fontWeight:700,fontSize:13.5,lineHeight:1.3}}>
                          {FLAG(resort.country)} {resort.name}
                        </div>
                        <div style={{fontSize:11,color:"#475569",marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
                          <span>{resort.country}</span>
                          <a
                            href={flightUrl(resort.flightHub, departure)}
                            target="_blank" rel="noreferrer"
                            onClick={e=>e.stopPropagation()}
                            style={{color:"#60a5fa",textDecoration:"none"}}
                          >✈️ {resort.flightHub}</a>
                          <span style={{color:"#334155"}}>~€{resort.liftPass}/d</span>
                        </div>
                      </div>

                      {/* ── Three snow boxes ── */}
                      <div style={{display:"flex",gap:5,alignItems:"stretch"}}>

                        {/* Peak */}
                        <div style={{textAlign:"center",borderRadius:8,padding:"7px 10px",background:"rgba(103,232,249,0.06)",border:`1px solid ${depthColor(resort.topCm,true)}40`,minWidth:64}}>
                          <div style={{fontSize:9,color:"#64748b",marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>Peak ❄️</div>
                          <div style={{fontSize:20,fontWeight:800,color:depthColor(resort.topCm,true),lineHeight:1}}>
                            {resort.topCm!=null?resort.topCm:"—"}
                          </div>
                          <div style={{fontSize:9,color:"#475569",marginTop:2}}>
                            cm · {resort.topElevResort||resort.topElev}m
                          </div>
                        </div>

                        {/* Base */}
                        <div style={{textAlign:"center",borderRadius:8,padding:"7px 10px",background:"rgba(167,139,250,0.06)",border:`1px solid ${depthColor(resort.baseCm,false)}40`,minWidth:64}}>
                          <div style={{fontSize:9,color:"#64748b",marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>Base 🎿</div>
                          <div style={{fontSize:20,fontWeight:800,color:depthColor(resort.baseCm,false),lineHeight:1}}>
                            {resort.baseCm!=null?resort.baseCm:"—"}
                          </div>
                          <div style={{fontSize:9,color:"#475569",marginTop:2}}>
                            cm · {resort.baseElev?`${resort.baseElev}m`:"—"}
                          </div>
                        </div>

                        {/* New snow during trip */}
                        <div style={{textAlign:"center",borderRadius:8,padding:"7px 10px",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",minWidth:64}}>
                          <div style={{fontSize:9,color:"#64748b",marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>+Snow 📡</div>
                          <div style={{fontSize:20,fontWeight:800,color:resort.forecastSnow>5?"#4ade80":"#64748b",lineHeight:1}}>
                            {resort.forecastSnow>0?`+${resort.forecastSnow}`:"—"}
                          </div>
                          <div style={{fontSize:9,color:"#475569",marginTop:2}}>cm trip fcst</div>
                        </div>
                      </div>

                      {/* Slopes % + warnings */}
                      <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:48,alignItems:"flex-end"}}>
                        {resort.openPct!=null&&(
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:13,fontWeight:700,color:resort.openPct>80?"#4ade80":resort.openPct>50?"#fbbf24":"#f87171"}}>
                              {resort.openPct}%
                            </div>
                            <div style={{fontSize:9,color:"#475569"}}>open</div>
                          </div>
                        )}
                        <div style={{display:"flex",gap:3}}>
                          {resort.windWarning&&<span title={`Gusts up to ${resort.maxGustKph}km/h`} style={{fontSize:13}}>💨</span>}
                          {resort.rainRisk&&<span title="Rain risk at base" style={{fontSize:13}}>🌧️</span>}
                        </div>
                      </div>

                      {/* Score badge + expand hint */}
                      <div style={{textAlign:"center",minWidth:50}}>
                        <div style={{fontSize:18}}>{resort.conditionEmoji}</div>
                        <div style={{fontSize:9,color:"#475569",marginTop:1}}>{resort.conditionLabel}</div>
                        <div style={{fontSize:9,color:isOpen?"#60a5fa":"#334155",marginTop:3,fontWeight:600}}>
                          {isOpen?"▲ close":"▼ details"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded panel ── */}
                  {isOpen&&(
                    <div style={{
                      background:"rgba(10,18,35,0.97)",
                      border:"1px solid rgba(99,102,241,0.3)",
                      borderTop:"none",borderRadius:"0 0 12px 12px",
                      padding:"16px 16px 18px",
                    }}>

                      {detLoading&&(
                        <div style={{color:"#475569",fontSize:13,padding:"10px 0",textAlign:"center"}}>
                          ⏳ Loading resort detail…
                        </div>
                      )}

                      {/* ── Meta row ── */}
                      {detail&&(
                        <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:14,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                          {detail.quality&&(
                            <div style={{fontSize:12}}>
                              <span style={{color:"#475569"}}>Snow: </span>
                              <span style={{fontWeight:600,color:"#e2e8f0"}}>
                                {QUALITY_EMOJI[detail.quality.toLowerCase()]||"🏔️"} {detail.quality}
                              </span>
                            </div>
                          )}
                          {detail.lastSnowfall&&(
                            <div style={{fontSize:12}}>
                              <span style={{color:"#475569"}}>Last snowfall: </span>
                              <span style={{fontWeight:600,color:"#67e8f9"}}>❄️ {detail.lastSnowfall}</span>
                            </div>
                          )}
                          {detail.seasonEnd&&(
                            <div style={{fontSize:12}}>
                              <span style={{color:"#475569"}}>Season closes: </span>
                              <span style={{fontWeight:600,color:"#a78bfa"}}>{detail.seasonEnd}</span>
                            </div>
                          )}
                          {resort.openLifts!=null&&(
                            <div style={{fontSize:12}}>
                              <span style={{color:"#475569"}}>Lifts: </span>
                              <span style={{fontWeight:600,color:"#94a3b8"}}>{resort.openLifts}/{resort.totalLifts} open</span>
                            </div>
                          )}
                          {detail.avgFreezingLevel!=null&&(
                            <div style={{fontSize:12}}>
                              <span style={{color:"#475569"}}>Freezing level: </span>
                              <span style={{fontWeight:600,color:detail.avgFreezingLevel<(resort.baseElev||1200)?"#fbbf24":"#4ade80"}}>
                                {detail.avgFreezingLevel}m
                              </span>
                              {detail.avgFreezingLevel<(resort.baseElev||1200)&&(
                                <span style={{color:"#fbbf24",fontSize:10}}> ⚠️ rain at base</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Daily forecast header ── */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{fontSize:11,color:"#60a5fa",fontWeight:600}}>
                          📅 Daily forecast during your trip: {fmtDate(departure)} → {fmtDate(endStr)}
                        </div>
                        <div style={{fontSize:10,color:"#334155"}}>
                          {detail ? "Resort model + Open-Meteo" : "Open-Meteo summit forecast"}
                        </div>
                      </div>

                      {/* ── Day cards ── */}
                      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                        {(detail ? detail.detailDays : resort.dailyData).map((d,i) => {
                          const snowCm = detail ? (d.resortSnowCm??d.omSnowCm) : d.omSnowCm;
                          const tMin   = detail ? (d.resortTempMin??d.tempMin) : d.tempMin;
                          const tMax   = detail ? (d.resortTempMax??d.tempMax) : d.tempMax;
                          const hasSnow = snowCm > 0;
                          return (
                            <div key={d.date} style={{
                              flex:"0 0 auto", width:90,
                              background:i===0
                                ?"linear-gradient(160deg,rgba(59,130,246,0.15),rgba(99,102,241,0.08))"
                                :"rgba(255,255,255,0.025)",
                              border:`1px solid ${i===0?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.06)"}`,
                              borderRadius:10, padding:"10px 8px 8px",
                            }}>
                              <div style={{fontSize:11,fontWeight:600,color:i===0?"#93c5fd":"#64748b",marginBottom:4}}>
                                {fmtDay(d.date)}
                              </div>
                              <div style={{fontSize:22,lineHeight:1,marginBottom:4}}>{WX[d.weatherCode]||"🌡️"}</div>
                              <div style={{fontSize:hasSnow?15:11,fontWeight:800,color:hasSnow?"#67e8f9":"#334155",lineHeight:1,marginBottom:4}}>
                                {hasSnow?`+${snowCm}cm`:"no snow"}
                              </div>
                              <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>
                                {tMin!=null&&tMax!=null?`${tMin}°/${tMax}°C`:"—"}
                              </div>
                              {d.snowDepthCm!=null&&(
                                <div style={{fontSize:10,color:"#475569",marginBottom:2}}>📦 {d.snowDepthCm}cm</div>
                              )}
                              {detail&&d.snowLineMtn!=null&&d.snowLineMtn>0&&(
                                <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>❄️ {d.snowLineMtn}m line</div>
                              )}
                              {d.windGustKph>0&&(
                                <div style={{fontSize:10,color:d.windGustKph>70?"#f87171":"#64748b",marginBottom:2}}>
                                  💨 {d.windGustKph}km/h
                                </div>
                              )}
                              {d.precipProb!=null&&(
                                <div style={{fontSize:10,color:"#475569"}}>☁️ {d.precipProb}%</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Links ── */}
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
                        <a href={`https://www.skiresort.info/ski-resort/${resort.slug}/snow-report/`}
                          target="_blank" rel="noreferrer"
                          style={{fontSize:12,color:"#60a5fa",textDecoration:"none",padding:"5px 12px",background:"rgba(59,130,246,0.1)",borderRadius:6,border:"1px solid rgba(59,130,246,0.25)"}}>
                          📊 Full snow report ↗
                        </a>
                        <a href={flightUrl(resort.flightHub, departure)}
                          target="_blank" rel="noreferrer"
                          style={{fontSize:12,color:"#a78bfa",textDecoration:"none",padding:"5px 12px",background:"rgba(139,92,246,0.1)",borderRadius:6,border:"1px solid rgba(139,92,246,0.25)"}}>
                          ✈️ Flights TLV → {resort.flightHub} on {fmtDate(departure)} ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{marginTop:24,fontSize:11,color:"#1e293b",textAlign:"center"}}>
            Snow depths: resort-reported · Forecast: resort model + Open-Meteo (elevation-corrected summit) · Updated on demand
          </div>
        </div>
      )}
    </div>
  );
}
