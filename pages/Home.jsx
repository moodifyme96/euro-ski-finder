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
                <option value="forecast">Expected Snowfall</option>
                <option value="price">Cheapest Lift Pass</option>
              </select>
            </div>
          </div>

          {/* RESORT CARDS */}
          {filtered.map((r,i)=>(
            <div key={r.slug} style={{marginBottom:i<filtered.length-1?12:0}}>

              {/* CARD HEADER — clickable */}
              <div onClick={()=>toggleExpand(r.slug)} style={S.card(i,expanded===r.slug)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>

                  {/* LEFT: Resort name + rank + country */}
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0"}}>{i+1}.</div>
                      <div style={{fontSize:16,fontWeight:600,color:"#e2e8f0"}}>{r.name}</div>
                      <div style={{fontSize:11,opacity:0.65}}>{FLAG(r.country)} {r.country}</div>
                    </div>
                    <div style={{fontSize:11,color:"#64748b",marginLeft:30}}>
                      {r.flightHub ? `✈️ Fly to ${r.flightHub}` : ""}
                    </div>
                  </div>

                  {/* RIGHT: Score + status */}
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <div style={S.box("rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.3)")}>
                      <div style={{fontSize:20,fontWeight:800}}>⭐ {r.score.toFixed(1)}</div>
                      <div style={{fontSize:9,color:"#86efac",marginTop:2}}>Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPANDABLE DETAIL PANEL */}
              {expanded===r.slug&&(
                <div style={{background:"rgba(30,41,59,0.6)",border:"1px solid rgba(99,102,241,0.25)",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"14px 14px 14px 44px"}}>

                  {detailLoading[r.slug]?(
                    <div style={{color:"#64748b",fontSize:12}}>Loading forecast…</div>
                  ):(detailData[r.slug]||{})?(
                    <div style={{fontSize:12,lineHeight:"1.6",color:"#cbd5e1"}}>
                      {/* SNOW SECTION */}
                      <div style={{marginBottom:12}}>
                        <div style={{color:"#93c5fd",fontWeight:600,marginBottom:6}}>❄️ Snow</div>
                        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                          <div style={S.box("#0f172a","#475569")}>
                            <div style={{fontSize:12,fontWeight:700,color:depthColor(r.topCm,true)}}>{r.topCm||"—"} cm</div>
                            <div style={{fontSize:9,color:"#64748b",marginTop:2}}>Top Depth</div>
                          </div>
                          <div style={S.box("#0f172a","#475569")}>
                            <div style={{fontSize:12,fontWeight:700,color:depthColor(r.baseCm,false)}}>{r.baseCm||"—"} cm</div>
                            <div style={{fontSize:9,color:"#64748b",marginTop:2}}>Base Depth</div>
                          </div>
                          <div style={S.box("#0f172a","#475569")}>
                            <div style={{fontSize:12,fontWeight:700,color:"#60a5fa"}}>{r.forecastSnow||0} cm</div>
                            <div style={{fontSize:9,color:"#64748b",marginTop:2}}>Expected</div>
                          </div>
                        </div>
                      </div>

                      {/* CONDITIONS SECTION */}
                      {(detailData[r.slug]||{}).condition?(
                        <div style={{marginBottom:12}}>
                          <div style={{color:"#93c5fd",fontWeight:600,marginBottom:6}}>🎿 Conditions</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            <div style={S.box("#0f172a","#475569")}>
                              <div>{QUALITY_EMOJI[(detailData[r.slug]||{}).condition]||"—"} {(detailData[r.slug]||{}).condition||"—"}</div>
                            </div>
                            {(detailData[r.slug]||{}).lastSnow?(
                              <div style={S.box("#0f172a","#475569")}>
                                <div>🆕 {(detailData[r.slug]||{}).lastSnow}</div>
                              </div>
                            ):null}
                          </div>
                        </div>
                      ):null}

                      {/* LIFTS & SLOPES SECTION */}
                      {(r.openPct!==undefined)?
                        <div style={{marginBottom:12}}>
                          <div style={{color:"#93c5fd",fontWeight:600,marginBottom:6}}>🚡 Lifts & Slopes</div>
                          <div style={S.box("#0f172a","#475569")}>
                            <div style={{fontSize:12,fontWeight:700,color:"#fbbf24"}}>{r.openPct}%</div>
                            <div style={{fontSize:9,color:"#64748b",marginTop:2}}>Open</div>
                          </div>
                        </div>
                      :null}

                      {/* FLIGHT & PASS */}
                      <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(99,102,241,0.15)"}}>
                        <div style={{display:"flex",gap:8}}>
                          {r.flightHub?(
                            <a href={flightUrl(r.flightHub,departure)} target="_blank" rel="noreferrer" style={{padding:"5px 10px",background:"rgba(59,130,246,0.15)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.3)",borderRadius:6,textDecoration:"none",fontSize:11,fontWeight:500}}>
                              ✈️ Flights ({r.flightHub})
                            </a>
                          ):null}
                          {r.liftPass?(
                            <div style={{padding:"5px 10px",background:"rgba(99,102,241,0.1)",color:"#a78bfa",border:"1px solid rgba(99,102,241,0.2)",borderRadius:6,fontSize:11,fontWeight:500}}>
                              🎫 ~${r.liftPass} / day
                            </div>
                          ):null}
                        </div>
                      </div>
                    </div>
                  ):null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}