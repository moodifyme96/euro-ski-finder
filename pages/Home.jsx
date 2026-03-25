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
    }
    setLoading(false);
  };

  const filtered = resorts
    .filter(r => filter === "All" || r.country === filter)
    .sort((a, b) => {
      if (sortBy === "score")    return b.score - a.score;
      if (sortBy === "top")      return (b.topCm || 0) - (a.topCm || 0);
      if (sortBy === "base")     return (b.baseCm || 0) - (a.baseCm || 0);
      if (sortBy === "slopes")   return (b.openPct || 0) - (a.openPct || 0);
      if (sortBy === "forecast") return b.forecastSnow - a.forecastSnow;
      if (sortBy === "price")    return a.liftPass - b.liftPass;
      return 0;
    });

  const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const fmtDay  = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c1a2e 100%)", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "36px 20px 20px" }}>
        <div style={{ fontSize: 52 }}>⛷️</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 0", background: "linear-gradient(90deg, #60a5fa, #a78bfa, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Last-Minute Ski Finder
        </h1>
        <p style={{ color: "#475569", marginTop: 6, fontSize: 13 }}>
          Resort-reported snow depths · Elevation-corrected mountain forecasts · 57 European resorts
        </p>
      </div>

      {/* Controls */}
      <div style={{ maxWidth: 960, margin: "0 auto 24px", padding: "0 16px" }}>
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
              marginLeft: "auto", padding: "11px 28px", borderRadius: 10, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#374151" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              boxShadow: loading ? "none" : "0 4px 18px rgba(59,130,246,0.35)",
              transition: "all 0.2s"
            }}>
              {loading ? "🔄 Loading…" : "🔍 Check Conditions"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: 960, margin: "0 auto 16px", padding: "0 16px" }}>
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", color: "#fca5a5" }}>{error}</div>
        </div>
      )}

      {loaded && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 56px" }}>

          {/* Filter / sort bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#475569" }}>
              📅 {dateRange && `${fmtDate(dateRange.start)} → ${fmtDate(dateRange.end)}`} · <strong style={{ color: "#64748b" }}>{filtered.length}</strong> resorts
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "5px 9px", fontSize: 12 }}>
                {countries.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "5px 9px", fontSize: 12 }}>
                <option value="score">Best Overall</option>
                <option value="top">Top Snow Depth</option>
                <option value="base">Base Snow Depth</option>
                <option value="slopes">% Slopes Open</option>
                <option value="forecast">Most New Snow</option>
                <option value="price">Cheapest Pass</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((resort, idx) => (
              <div key={resort.slug}>
                {/* Card */}
                <div
                  onClick={() => setExpanded(expanded === resort.slug ? null : resort.slug)}
                  style={{
                    background: idx === 0
                      ? "linear-gradient(135deg, rgba(59,130,246,0.13), rgba(139,92,246,0.13))"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${idx < 3 ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: expanded === resort.slug ? "12px 12px 0 0" : 12,
                    padding: "13px 16px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Rank */}
                    <div style={{ fontSize: 14, fontWeight: 800, minWidth: 26, color: idx === 0 ? "#fbbf24" : idx === 1 ? "#94a3b8" : idx === 2 ? "#cd7c3a" : "#475569" }}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </div>

                    {/* Name & country */}
                    <div style={{ flex: 2, minWidth: 130 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3 }}>
                        {countryFlag(resort.country)} {resort.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        {resort.country} ·{" "}
                        <a
                          href={`https://www.google.com/flights#flt=TLV.*`}
                          target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: "#60a5fa", textDecoration: "none" }}
                        >✈️ {resort.flightHub}</a>
                      </div>
                    </div>

                    {/* Condition badge */}
                    <div style={{ textAlign: "center", minWidth: 48 }}>
                      <div style={{ fontSize: 16 }}>{resort.conditionEmoji}</div>
                      <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 1 }}>{resort.conditionLabel}</div>
                    </div>

                    {/* Snow stats row */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
                      {/* Top depth */}
                      <div style={{ textAlign: "center", background: "rgba(103,232,249,0.07)", borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(103,232,249,0.15)", minWidth: 62 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#67e8f9", lineHeight: 1 }}>
                          {resort.topCm != null ? `${resort.topCm}` : "—"}
                          <span style={{ fontSize: 10, color: "#67e8f9", opacity: 0.7 }}>cm</span>
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
                          🏔️ top{resort.topElevResort ? ` ${resort.topElevResort}m` : ""}
                        </div>
                      </div>

                      {/* Base depth */}
                      <div style={{ textAlign: "center", background: "rgba(167,139,250,0.07)", borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(167,139,250,0.15)", minWidth: 62 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#a78bfa", lineHeight: 1 }}>
                          {resort.baseCm != null ? `${resort.baseCm}` : "—"}
                          <span style={{ fontSize: 10, color: "#a78bfa", opacity: 0.7 }}>cm</span>
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
                          🎿 base{resort.baseElev ? ` ${resort.baseElev}m` : ""}
                        </div>
                      </div>

                      {/* Forecast snow */}
                      <div style={{ textAlign: "center", background: "rgba(34,197,94,0.07)", borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(34,197,94,0.15)", minWidth: 58 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#4ade80", lineHeight: 1 }}>
                          +{resort.forecastSnow}
                          <span style={{ fontSize: 10, color: "#4ade80", opacity: 0.7 }}>cm</span>
                        </div>
                        <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>📡 {days}d fcst</div>
                      </div>

                      {/* Wind warning */}
                      {resort.windWarning && (
                        <div style={{ textAlign: "center", background: "rgba(239,68,68,0.08)", borderRadius: 8, padding: "6px 8px", border: "1px solid rgba(239,68,68,0.25)", minWidth: 50 }}>
                          <div style={{ fontSize: 15 }}>💨</div>
                          <div style={{ fontSize: 9, color: "#f87171", marginTop: 1 }}>{resort.maxGustKph}km/h</div>
                        </div>
                      )}

                      {/* Rain risk */}
                      {resort.rainRisk && (
                        <div style={{ textAlign: "center", background: "rgba(251,191,36,0.08)", borderRadius: 8, padding: "6px 8px", border: "1px solid rgba(251,191,36,0.25)", minWidth: 44 }}>
                          <div style={{ fontSize: 15 }}>🌧️</div>
                          <div style={{ fontSize: 9, color: "#fbbf24", marginTop: 1 }}>rain risk</div>
                        </div>
                      )}
                    </div>

                    {/* Slopes open + score */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: "auto" }}>
                      {resort.openPct != null && (
                        <div style={{ fontSize: 11, color: resort.openPct > 75 ? "#4ade80" : resort.openPct > 40 ? "#fbbf24" : "#f87171", fontWeight: 600 }}>
                          {resort.openPct}% open
                        </div>
                      )}
                      {(resort.openKm != null && resort.totalKm != null) && (
                        <div style={{ fontSize: 10, color: "#475569" }}>{resort.openKm}/{resort.totalKm}km</div>
                      )}
                      <div style={{ fontSize: 11, color: "#475569" }}>~€{resort.liftPass}/day</div>
                      <div style={{ fontSize: 10, color: "#334155" }}>{expanded === resort.slug ? "▲" : "▼"} details</div>
                    </div>
                  </div>
                </div>

                {/* Expanded: daily forecast */}
                {expanded === resort.slug && (
                  <div style={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    padding: "14px 16px 16px",
                  }}>
                    {/* Extra stats row */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {resort.snowDepthNwp != null && (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: "#475569" }}>NWP model snowpack: </span>
                          <span style={{ color: "#67e8f9", fontWeight: 600 }}>{resort.snowDepthNwp}cm</span>
                          <span style={{ color: "#334155", fontSize: 10 }}> (cross-check vs resort report)</span>
                        </div>
                      )}
                      {resort.avgFreezingLevel != null && (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: "#475569" }}>Avg freezing level: </span>
                          <span style={{ color: resort.avgFreezingLevel < (resort.baseElev || 1200) ? "#fbbf24" : "#4ade80", fontWeight: 600 }}>
                            {resort.avgFreezingLevel}m
                          </span>
                          {resort.avgFreezingLevel < (resort.baseElev || 1200) && (
                            <span style={{ color: "#fbbf24", fontSize: 10 }}> ⚠️ below base — rain on lower slopes</span>
                          )}
                        </div>
                      )}
                      {resort.openLifts != null && (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: "#475569" }}>Lifts open: </span>
                          <span style={{ color: "#94a3b8", fontWeight: 600 }}>{resort.openLifts}/{resort.totalLifts}</span>
                        </div>
                      )}
                    </div>

                    {/* Daily forecast cards */}
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>📡 Daily forecast (elevation-corrected to {resort.topElevResort || resort.topElev}m summit)</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {resort.dailyData.map((d, i) => (
                        <div key={d.date} style={{
                          background: i === 0 ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${i === 0 ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
                          borderRadius: 10, padding: "10px 12px", minWidth: 90, flex: 1,
                        }}>
                          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{fmtDay(d.date)}</div>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{WEATHER_CODES[d.weatherCode] || "🌡️"}</div>
                          {d.snowfall > 0 && (
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#67e8f9" }}>+{d.snowfall}cm ❄️</div>
                          )}
                          {d.snowDepthCm != null && (
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>depth {d.snowDepthCm}cm</div>
                          )}
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                            {d.tempMin}°→{d.tempMax}°C
                          </div>
                          {d.windGustKph > 0 && (
                            <div style={{ fontSize: 10, color: d.windGustKph > 70 ? "#f87171" : "#64748b", marginTop: 2 }}>
                              💨 {d.windGustKph}km/h
                            </div>
                          )}
                          {d.precipProb != null && (
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                              ☁️ {d.precipProb}% precip
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Links */}
                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <a
                        href={`https://www.skiresort.info/ski-resort/${resort.slug}/snow-report/`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", padding: "5px 12px", background: "rgba(59,130,246,0.1)", borderRadius: 6, border: "1px solid rgba(59,130,246,0.25)" }}
                      >
                        📊 Full snow report ↗
                      </a>
                      <a
                        href={`https://www.google.com/flights#flt=TLV.${resort.flightHub.substring(0,3).toUpperCase()}.*`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", padding: "5px 12px", background: "rgba(139,92,246,0.1)", borderRadius: 6, border: "1px solid rgba(139,92,246,0.25)" }}
                      >
                        ✈️ Flights from TLV → {resort.flightHub} ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, fontSize: 11, color: "#334155", textAlign: "center" }}>
            Snow depths: resort-reported via skiresort.info · Forecast: Open-Meteo best_match model with summit elevation correction · Updated on demand
          </div>
        </div>
      )}
    </div>
  );
}
