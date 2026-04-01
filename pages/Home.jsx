// Last-Minute Ski Finder v3
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
const todayIso = () => new Date().toISOString().split("T")[0];
const maxIso   = () => { const d=new Date(); d.setDate(d.getDate()+14); return d.toISOString().split("T")[0]; };
const addDays  = (iso, n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; };

const depthColor = (cm, isTop) => {
  if (cm==null) return "#475569";
  if (isTop) return cm>=150?"#67e8f9":cm>=80?"#93c5fd":cm>=40?"#fbbf24":"#f87171";
  return cm>=80?"#a78bfa":cm>=40?"#93c5fd":cm>=20?"#fbbf24":"#f87171";
};

const flightUrl = (hub, dep) => {
  const d = dep.replace(/-/g,"");
  return `https://www.google.com/flights#flt=TLV.${hub}.${d};c:USD;e:1`;
};

export default function Home() {
  const defaultDep = addDays(todayIso(), 1);

  const [departure, setDeparture]   = useState(defaultDep);
  const [tripDays,  setTripDays]    = useState(5);
  const [resorts,   setResorts]     = useState([]);
  const [loading,   setLoading]     = useState(false);
  const [loaded,    setLoaded]      = useState(false);
  const [tripWindow,setTripWindow]  = useState(null);
  const [expanded,  setExpanded]    = useState(null);
  const [filter,    setFilter]      = useState("All");
  const [sortBy,    setSortBy]      = useState("score");
  const [error,     setError]       = useState(null);
  const [detailData,    setDetailData]    = useState({});
  const [detailLoading, setDetailLoading] = useState({});

  const countries = ["All",...Array.from(new Set(resorts.map(r=>r.country))).sort()];

  const fetchList = async () => {
    setLoading(true); setLoaded(false); setExpanded(null); setError(null);
    try {
      const data = await callBackendFunction("skiConditions", {
        mode:"list", departureDate:departure, tripDays,
      });
      setResorts(data.resorts||[]);
      setTripWindow(data.tripWindow);
      setLoaded(true);
    } catch { setError("Failed to load. Please try again."); }
    setLoading(false);
  };

  const fetchDetail = useCallback(async (slug) => {
    if (detailData[slug]||detailLoading[slug]) return;
    setDetailLoading(p=>({...p,[slug]:true}));
    try {
      const data = await callBackendFunction("skiConditions",{
        mode:"detail", slug, departureDate:departure, tripDays,
      });
      setDetailData(p=>({...p,[slug]:data}));
    } catch {}
    setDetailLoading(p=>({...p,[slug]:false}));
  },[detailData,detailLoading,departure,tripDays]);

  const toggleExpand = slug => {
    const next = expanded===slug ? null : slug;
    setExpanded(next);
    if (next) fetchDetail(next);
  };

  const filtered = resorts
    .filter(r=>filter==="All"||r.country===filter)
    .sort((a,b)=>{
      if(sortBy==="score")    return b.score-a.score;
      if(sortBy==="top")      return (b.topCm||0)-(a.topCm||0);
      if(sortBy==="base")     return (b.baseCm||0)-(a.baseCm||0);
      if(sortBy==="slopes")   return (b.openPct||0)-(a.openPct||0);
      if(sortBy==="forecast") return b.forecastSnow-a.forecastSnow;
      if(sortBy==="price")    return a.liftPass-b.liftPass;
      return 0;
    });

  const tripEnd = addDays(departure, tripDays);

  const S = {
    card: (idx,open) => ({
      background: idx===0
        ?"linear-gradient(135deg,rgba(59,130,246,0.13),rgba(139,92,246,0.13))"
        :"rgba(255,255,255,0.03)",
      border:`1px solid ${open?"rgba(99,102,241,0.55)":idx<3?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.07)"}`,
      borderRadius: open?"12px 12px 0 0":12,
      padding:"12px 14px", cursor:"pointer",
    }),
    box: (bg,borderCol) => ({
      textAlign:"center", borderRadius:8, padding:"7px 10px",
      background:bg, border:`1px solid ${borderCol}`, minWidth:64,
    }),
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0c1a2e 100%)",color:"#e2e8f0",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* HEADER */}
      <div style={{textAlign:"center",padding:"36px 20px 20px"}}>
        <div style={{fontSize:52}}>⛷️</div>
        <h1 style={{fontSize:28,fontWeight:800,margin:"8px 0 0",background:"linear-gradient(90deg,#60a5fa,#a78bfa,#67e8f9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          Last-Minute Ski Finder
        </h1>
        <p style={{color:"#64748b",marginTop:6,fontSize:13}}>
          Resort-reported snow depths · Elevation-corrected mountain forecasts · 57 European resorts
        </p>
      </div>

      {/* TRIP PLANNER */}
      <div style={{maxWidth:960,margin:"0 auto 28px",padding:"0 16px"}}>
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:"20px 24px"}}>
          <div style={{fontSize:11,color:"#64748b",marginBottom:14,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>
            ✈️ Plan your ski trip
          </div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{flex:"1 1 160px"}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:6,fontWeight:500}}>Departure from Tel Aviv</div>
              <input
                type="date"
                value={departure}
                min={todayIso()}
                max={maxIso()}
                onChange={e=>{setDeparture(e.target.value);setLoaded(false);setDetailData({});}}
                style={{
                  width:"100%",boxSizing:"border-box",
                  background:"#0f172a",border:"1px solid #334155",
                  color:"#e2e8f0",borderRadius:8,padding:"9px 11px",
                  fontSize:14,fontWeight:600,cursor:"pointer",colorScheme:"dark",
                }}
              />
            </div>
            <div style={{flex:"1 1 240px"}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:6,fontWeight:500}}>
                Trip duration —&nbsp;<span style={{color:"#60a5fa",fontWeight:700}}>{tripDays} days on the mountain</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[3,4,5,6,7,10,14].map(d=>(
                  <button key={d} onClick={()=>{setTripDays(d);setLoaded(false);setDetailData({});}} style={{
                    padding:"7px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
                    background:tripDays===d?"linear-gradient(135deg,#3b82f6,#8b5cf6)":"rgba(255,255,255,0.08)",
                    color:tripDays===d?"#fff":"#94a3b8",
                  }}>{d}d</button>
                ))}
              </div>
            </div>
            <div style={{flex:"0 0 auto"}}>
              <button onClick={fetchList} disabled={loading} style={{
                padding:"11px 30px",borderRadius:10,border:"none",
                cursor:loading?"not-allowed":"pointer",
                background:loading?"#374151":"linear-gradient(135deg,#3b82f6,#8b5cf6)",
                color:"#fff",fontSize:14,fontWeight:700,
                boxShadow:loading?"none":"0 4px 18px rgba(59,130,246,0.35)",
              }}>
                {loading?"🔄 Searching…":"🔍 Find Best Resorts"}
              </button>
            </div>
          </div>
          <div style={{marginTop:14,padding:"9px 13px",background:"rgba(59,130,246,0.08)",borderRadius:8,border:"1px solid rgba(59,130,246,0.18)",fontSize:12,color:"#93c5fd"}}>
            📅 Flying out <strong>{fmtDate(departure)}</strong> · skiing {tripDays} days · forecast covers{" "}
            <strong>{fmtDate(departure)}</strong> → <strong>{fmtDate(tripEnd)}</strong>
          </div>
        </div>
      </div>

      {error&&(
        <div style={{maxWidth:960,margin:"0 auto 16px",padding:"0 16px"}}>
          <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,padding:"12px 16px",color:"#fca5a5"}}>{error}</div>
        </div>
      )}

      {loaded&&(
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 16px 56px"}}>

          {/* FILTER BAR */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:10}}>
            <div style={{fontSize:12,color:"#475569"}}>
              <strong style={{color:"#64748b"}}>{filtered.length}</strong> resorts ranked by conditions during your trip
            </div>
            <div style={{display:"flex",gap:8}}>
              <select value={filter} onChange={e=>setFilter(e.target.value)} style={{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"5px 9px",fontSize:12}}>
                {countries.map(c=><option key={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"5px 9px",fontSize:12}}>
                <option value="score">Best Overall</option>
                <option value="top">Peak Snow Depth</option>
                <option value="base">Base Snow Depth</option>
                <option value="slopes">Open Slopes %</option>
                <option value="forecast">Forecast Snow</option>
                <option value="price">Lift Pass Price</option>
              </select>
            </div>
          </div>

          {/* RESORT LIST */}
          {filtered.map((r,idx)=>{
            const open = expanded===r.slug;
            const det  = detailData[r.slug];
            const loadingDet = detailLoading[r.slug];
            const medal = idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":null;

            return (
              <div key={r.slug} style={{marginBottom: open?0:10}}>
                {/* CARD ROW */}
                <div onClick={()=>toggleExpand(r.slug)} style={S.card(idx,open)}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>

                    {/* Rank */}
                    <div style={{fontWeight:800,fontSize:15,minWidth:28,color:idx===0?"#fbbf24":idx===1?"#94a3b8":idx===2?"#cd7c3e":"#475569"}}>
                      {medal||`#${idx+1}`}
                    </div>

                    {/* Name + flag */}
                    <div style={{flex:"1 1 160px"}}>
                      <div style={{fontWeight:700,fontSize:15}}>{FLAG(r.country)} {r.name}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{r.country} · {r.altRange}</div>
                    </div>

                    {/* Snow depths */}
                    <div style={{display:"flex",gap:6}}>
                      <div style={S.box("rgba(6,182,212,0.1)","rgba(6,182,212,0.25)")}>
                        <div style={{fontSize:10,color:"#67e8f9",marginBottom:2}}>▲ PEAK</div>
                        <div style={{fontSize:16,fontWeight:800,color:depthColor(r.topCm,true)}}>
                          {r.topCm!=null?`${r.topCm}cm`:"—"}
                        </div>
                      </div>
                      <div style={S.box("rgba(139,92,246,0.1)","rgba(139,92,246,0.25)")}>
                        <div style={{fontSize:10,color:"#a78bfa",marginBottom:2}}>▼ BASE</div>
                        <div style={{fontSize:16,fontWeight:800,color:depthColor(r.baseCm,false)}}>
                          {r.baseCm!=null?`${r.baseCm}cm`:"—"}
                        </div>
                      </div>
                    </div>

                    {/* Forecast snow */}
                    <div style={S.box("rgba(59,130,246,0.1)","rgba(59,130,246,0.2)")}>
                      <div style={{fontSize:10,color:"#93c5fd",marginBottom:2}}>❄️ FCST</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#60a5fa"}}>
                        {r.forecastSnow>0?`+${r.forecastSnow}cm`:"—"}
                      </div>
                    </div>

                    {/* Open slopes */}
                    <div style={S.box("rgba(16,185,129,0.1)","rgba(16,185,129,0.2)")}>
                      <div style={{fontSize:10,color:"#6ee7b7",marginBottom:2}}>🎿 OPEN</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#34d399"}}>
                        {r.openPct!=null?`${r.openPct}%`:"—"}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{textAlign:"center",minWidth:48}}>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>SCORE</div>
                      <div style={{
                        fontSize:18,fontWeight:900,
                        color:r.score>=75?"#4ade80":r.score>=50?"#fbbf24":"#f87171"
                      }}>{r.score}</div>
                    </div>

                    <div style={{color:"#475569",fontSize:12}}>{open?"▲":"▼"}</div>
                  </div>

                  {/* Snow quality badge */}
                  {r.snowQuality&&(
                    <div style={{marginTop:6,fontSize:11}}>
                      <span style={{background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"2px 7px",color:"#94a3b8"}}>
                        {QUALITY_EMOJI[r.snowQuality]||"❄️"} {r.snowQuality}
                      </span>
                    </div>
                  )}
                </div>

                {/* EXPANDED DETAIL PANEL */}
                {open&&(
                  <div style={{background:"rgba(15,23,42,0.85)",border:"1px solid rgba(99,102,241,0.55)",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"16px 18px",marginBottom:10}}>
                    {loadingDet&&<div style={{color:"#64748b",fontSize:13,textAlign:"center",padding:"20px 0"}}>Loading details…</div>}

                    {det&&(
                      <>
                        {/* Forecast bar */}
                        {det.forecast&&det.forecast.length>0&&(
                          <div style={{marginBottom:16}}>
                            <div style={{fontSize:11,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:0.8,fontWeight:600}}>
                              📅 Daily forecast during your trip
                            </div>
                            <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
                              {det.forecast.map((f,i)=>(
                                <div key={i} style={{
                                  flex:"0 0 auto",textAlign:"center",
                                  background:f.inTrip?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)",
                                  border:`1px solid ${f.inTrip?"rgba(59,130,246,0.4)":"rgba(255,255,255,0.07)"}`,
                                  borderRadius:8,padding:"7px 9px",minWidth:56,
                                }}>
                                  <div style={{fontSize:10,color:f.inTrip?"#93c5fd":"#475569"}}>{fmtDay(f.date).split(" ")[0]}</div>
                                  <div style={{fontSize:9,color:"#475569"}}>{fmtDay(f.date).split(" ").slice(1).join(" ")}</div>
                                  <div style={{fontSize:18,margin:"3px 0"}}>{WX[f.wmo]||"❓"}</div>
                                  <div style={{fontSize:11,color:"#60a5fa",fontWeight:700}}>{f.maxC}°</div>
                                  <div style={{fontSize:10,color:"#475569"}}>{f.minC}°</div>
                                  {f.snowCm>0&&<div style={{fontSize:10,color:"#67e8f9",marginTop:2}}>❄️{f.snowCm}cm</div>}
                                  {f.gustKph>60&&<div style={{fontSize:10,color:"#fbbf24",marginTop:1}}>💨{f.gustKph}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stats row */}
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                          {det.openRuns!=null&&(
                            <div style={S.box("rgba(16,185,129,0.08)","rgba(16,185,129,0.2)")}>
                              <div style={{fontSize:10,color:"#6ee7b7"}}>Open Runs</div>
                              <div style={{fontSize:14,fontWeight:700,color:"#34d399"}}>{det.openRuns}/{det.totalRuns}</div>
                            </div>
                          )}
                          {det.openLifts!=null&&(
                            <div style={S.box("rgba(59,130,246,0.08)","rgba(59,130,246,0.2)")}>
                              <div style={{fontSize:10,color:"#93c5fd"}}>Open Lifts</div>
                              <div style={{fontSize:14,fontWeight:700,color:"#60a5fa"}}>{det.openLifts}/{det.totalLifts}</div>
                            </div>
                          )}
                          {det.liftPass&&(
                            <div style={S.box("rgba(245,158,11,0.08)","rgba(245,158,11,0.2)")}>
                              <div style={{fontSize:10,color:"#fcd34d"}}>Day Pass</div>
                              <div style={{fontSize:14,fontWeight:700,color:"#fbbf24"}}>€{det.liftPass}</div>
                            </div>
                          )}
                          {det.village&&(
                            <div style={S.box("rgba(139,92,246,0.08)","rgba(139,92,246,0.2)")}>
                              <div style={{fontSize:10,color:"#c4b5fd"}}>Village Alt</div>
                              <div style={{fontSize:14,fontWeight:700,color:"#a78bfa"}}>{det.village}m</div>
                            </div>
                          )}
                          {det.summit&&(
                            <div style={S.box("rgba(6,182,212,0.08)","rgba(6,182,212,0.2)")}>
                              <div style={{fontSize:10,color:"#67e8f9"}}>Summit</div>
                              <div style={{fontSize:14,fontWeight:700,color:"#22d3ee"}}>{det.summit}m</div>
                            </div>
                          )}
                        </div>

                        {/* Flight links */}
                        {r.airports&&r.airports.length>0&&(
                          <div>
                            <div style={{fontSize:11,color:"#64748b",marginBottom:7,textTransform:"uppercase",letterSpacing:0.8,fontWeight:600}}>
                              ✈️ Flights from Tel Aviv ({fmtDate(departure)})
                            </div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              {r.airports.map(ap=>(
                                <a key={ap.code} href={flightUrl(ap.code,departure)} target="_blank" rel="noreferrer" style={{
                                  display:"inline-block",padding:"6px 13px",borderRadius:8,
                                  background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.35)",
                                  color:"#93c5fd",fontSize:12,fontWeight:600,textDecoration:"none",
                                }}>
                                  ✈️ {ap.code} — {ap.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loaded&&!loading&&(
        <div style={{textAlign:"center",padding:"60px 20px",color:"#334155"}}>
          <div style={{fontSize:48,marginBottom:12}}>🏔️</div>
          <div style={{fontSize:15}}>Select your dates and hit <strong style={{color:"#60a5fa"}}>Find Best Resorts</strong></div>
        </div>
      )}
    </div>
  );
}
