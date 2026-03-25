import { useState } from "react";
import { callBackendFunction } from "@/api/backendFunctions";

const WEATHER_CODES = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "❄️", 75: "❄️", 77: "❄️", 80: "🌧️", 81: "🌧️",
  82: "⛈️", 85: "🌨️", 86: "❄️", 95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const countryFlag = (c) => ({ Switzerland:"🇨🇭", Austria:"🇦🇹", France:"🇫🇷", Italy:"🇮🇹", Andorra:"🇦🇩", Spain:"🇪🇸", Bulgaria:"🇧🇬" }[c] || "🏔️");

export default function Home() {
  const [days, setDays] = useState(3);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("score");
  const [error, setError] = useState(null);

  const countries = ["All", ...Array.from(new Set(resorts.map(r => r.country))).sort()];

  const fetchConditions = async () => {
    setLoading(true);
    setLoaded(false);
    setExpanded(null);
    setError(null);
    try {
      const data = await callBackendFunction("skiConditions", { days });
      setResorts(data.resorts || []);
      setDateRange(data.dateRange);
      setLoaded(true);
    } catch (e) {
      setError("Failed to load data. Please try again.");
      console.error(e);
    }
    setLoading(false);
  };

  const filtered = resorts
    .filter(r => filter === "All" || r.country === filter)
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "top") return (b.topCm || 0) - (a.topCm || 0);
      if (sortBy === "base") return (b.baseCm || 0) - (a.baseCm || 0);
      if (sortBy === "slopes") return (b.openPct || 0) - (a.openPct || 0);
      if (sortBy === "forecast") return b.forecastSnow - a.forecastSnow;
      if (sortBy === "price") return a.liftPass - b.liftPass;
      return 0;
    });

  const fmtDate = d => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const scoreColor = s => s >= 70 ? "#22c55e" : s >= 55 ? "#84cc16" : s >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c1a2e 100%)", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "36px 20px 20px" }}>
        <div style={{ fontSize: 52 }}>⛷️</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 0", background: "linear-gradient(90deg, #60a5fa, #a78bfa, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Last-Minute Ski Finder
        </h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 13 }}>
          Resort-reported snow depths · Open-Meteo forecasts · Data from skiresort.info
        </p>
      </div>

      {/* Controls */}
      <div style={{ maxWidth: 920, margin: "0 auto 24px", padding: "0 16px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 7, textTransform: "uppercase", letterSpacing: 1 }}>Forecast days ahead</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 5, 7].map(d => (
                  <button key={d} onClick={() => setDays(d)} style={{
                    padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                    background: days === d ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "rgba(255,255,255,0.08)",
                    color: days === d ? "#fff" : "#94a3b8",
                  }}>{d}d</button>
                ))}
              </div>
            </div>
            <button onClick={fetchConditions} disabled={loading} style={{
              marginLeft: "auto", padding: "11px 26px", borderRadius: 10, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#374151" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              boxShadow: loading ? "none" : "0 4px 18px rgba(59,130,246,0.35)"
            }}>
              {loading ? "🔄 Loading..." : "🔍 Check Conditions"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: 920, margin: "0 auto 16px", padding: "0 16px" }}>
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", color: "#fca5a5" }}>{error}</div>
        </div>
      )}

      {/* Results */}
      {loaded && (
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 16px 48px" }}>
          {/* Filters bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ color: "#64748b", fontSize: 12 }}>
              📅 {dateRange && `${fmtDate(dateRange.start)} → ${fmtDate(dateRange.end)}`} · {filtered.length} resorts · <span style={{ color: "#475569" }}>Snow data from resort reports</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "5px 9px", fontSize: 12, cursor: "pointer" }}>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "5px 9px", fontSize: 12, cursor: "pointer" }}>
                <option value="score">Best Overall</option>
                <option value="top">Top Snow Depth</option>
                <option value="base">Base Snow Depth</option>
                <option value="slopes">% Slopes Open</option>
                <option value="forecast">Most Forecast Snow</option>
                <option value="price">Cheapest</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
            {[["🏔️ Top depth", "summit snow depth (resort-reported)"], ["🎿 Base depth", "base/valley snow depth (resort-reported)"], ["📡 Forecast", `new snow expected next ${days}d (Open-Meteo)`]].map(([label, desc]) => (
              <div key={label} style={{ fontSize: 11, color: "#475569" }}><span style={{ color: "#94a3b8" }}>{label}</span> = {desc}</div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((resort, idx) => (
              <div key={resort.slug}>
                <div onClick={() => setExpanded(expanded === resort.slug ? null : resort.slug)} style={{
                  background: idx === 0 ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${idx === 0 ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: expanded === resort.slug ? "12px 12px 0 0" : 12,
                  padding: "14px 18px", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {/* Rank */}
                    <div style={{ fontSize: 15, fontWeight: 800, minWidth: 24, color: idx === 0 ? "#fbbf24" : idx === 1 ? "#94a3b8" : idx === 2 ? "#cd7c3a" : "#475569" }}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx+1}`}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 2, minWidth: 140 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{countryFlag(resort.country)} {resort.name}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        {resort.country} ·{" "}
                        <a href={`https://www.google.com/flights#flt=TLV.*`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#60a5fa", textDecoration: "none" }}>
                          ✈️ via {resort.flightHub}
                        </a>
                      </div>
                    </div>

                    {/* Condition */}
                    <div style={{ textAlign: "center", minWidth: 52 }}>
                      <div style={{ fontSize: 15 }}>{resort.conditionEmoji}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{resort.conditionLabel}</div>
                    </div>

                    {/* Snow depths - the key stats */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      {/* Top depth */}
                      <div style={{ textAlign: "center", background: "rgba(103,232,249,0.08)", borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(103,232,249,0.15)" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#67e8f9" }}>
                          {resort.topCm !== null ? `${resort.topCm}cm` : "—"}
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>
                          🏔️ TOP{resort.topElev ? ` (${resort.topElev}m)` : ""}
                        </div>
                      </div>

                      {/* Base depth */}
                      <div style={{ textAlign: "center", background: "rgba(167,139,250,0.08)", borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(167,139,250,0.15)" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#a78bfa" }}>
                          {resort.baseCm !== null ? `${resort.baseCm}cm` : "—"}
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>
                          🎿 BASE{resort.baseElev ? ` (${resort.baseElev}m)` : ""}
                        </div>
                      </div>

                      {/* Forecast snow */}
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#38bdf8" }}>📡 +{resort.forecastSnow}cm</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>Forecast {days}d</div>
                      </div>

                      {/* Slopes open */}
                      {resort.openPct !== null && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: resort.openPct >= 80 ? "#4ade80" : resort.openPct >= 50 ? "#f59e0b" : "#ef4444" }}>
                            {resort.openPct}%
                          </div>
                          <div style={{ fontSize: 10, color: "#475569" }}>{resort.openKm}/{resort.totalKm}km open</div>
                        </div>
                      )}

                      {/* Lifts */}
                      {resort.openLifts !== null && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#fb923c" }}>{resort.openLifts}/{resort.totalLifts}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>lifts open</div>
                        </div>
                      )}

                      {/* Lift pass price */}
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fbbf24" }}>€{resort.liftPass}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>lift/day est.</div>
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: "right", minWidth: 65 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(resort.score) }}>{resort.score}</div>
                      <div style={{ background: "#1e293b", borderRadius: 4, height: 4, marginTop: 3 }}>
                        <div style={{ width: `${Math.min(resort.score, 100)}%`, height: "100%", background: scoreColor(resort.score), borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>/ 100</div>
                    </div>

                    <div style={{ color: "#334155", fontSize: 12 }}>{expanded === resort.slug ? "▲" : "▼"}</div>
                  </div>
                </div>

                {/* Expanded: forecast daily breakdown */}
                {expanded === resort.slug && (
                  <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "14px 18px" }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                      Forecast Breakdown · {days}-day outlook
                    </div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                      {resort.dailyData.map(day => (
                        <div key={day.date} style={{ minWidth: 95, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ fontSize: 10, color: "#475569", marginBottom: 5 }}>{fmtDate(day.date)}</div>
                          <div style={{ fontSize: 20 }}>{WEATHER_CODES[day.weatherCode] || "❓"}</div>
                          <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 4 }}>+{day.snowfall}cm snow</div>
                          <div style={{ fontSize: 11, color: "#fb923c" }}>{day.tempMax > 0 ? "+" : ""}{day.tempMax}° / {day.tempMin > 0 ? "+" : ""}{day.tempMin}°</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: "#334155" }}>
                      Snow depth from resort reports · Forecast via Open-Meteo ·{" "}
                      <a href={`https://www.skiresort.info/ski-resort/${resort.slug}/snow-report/`} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>
                        Full report on skiresort.info ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 28, color: "#334155", fontSize: 11 }}>
            Snow depths reported by resorts via skiresort.info · Forecast via Open-Meteo · Lift pass prices are estimates
          </div>
        </div>
      )}

      {!loaded && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>🏔️</div>
          <p style={{ fontSize: 16 }}>Pick how many days ahead, then hit Check Conditions</p>
          <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Real snow depths reported by resorts + weather forecast</p>
        </div>
      )}
    </div>
  );
}
