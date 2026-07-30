"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Decision = {
  id: string;
  kind: "DECISION" | "COMMITMENT" | "DEADLINE";
  title: string;
  summary: string;
  timestamp: number;
  neighborhoods: string[];
  confidence: number;
  officialSource: string;
  uncertainty: string;
};

const neighborhoods = ["Capitol Hill", "Central District", "Belltown", "Beacon Hill"];
const agents = [
  ["RC", "Record Clerk", "Segments speakers, motions, votes, and agenda items."],
  ["DX", "Decision Extractor", "Separates decisions from discussion and proposals."],
  ["GG", "Geographic Grounder", "Resolves streets, districts, and public facilities."],
  ["IA", "Impact Analyst", "Translates the record into possible neighborhood effects."],
  ["PS", "Process Sentinel", "Finds deadlines, hearings, and responsible agencies."],
  ["CC", "Civic Challenger", "Checks overstatement, missing context, and uncertainty."],
  ["BS", "Brief Synthesizer", "Creates a source-linked resident action brief."],
];
const stages = ["INGEST", "SEGMENT", "EXTRACT", "GROUND", "CHALLENGE", "BRIEF"];
const decisions: Decision[] = [
  {
    id: "D-01",
    kind: "DECISION",
    title: "12th Avenue curb pilot approved",
    summary: "A six-month loading-zone pilot was approved for two blocks near Pine Street.",
    timestamp: 286,
    neighborhoods: ["Capitol Hill"],
    confidence: 96,
    officialSource: "Motion 4B · recorded vote 6–1",
    uncertainty: "Final curb-space drawings were not included in the meeting packet.",
  },
  {
    id: "C-02",
    kind: "COMMITMENT",
    title: "Night-bus reliability study requested",
    summary: "Transportation staff committed to return with late-night reliability findings.",
    timestamp: 731,
    neighborhoods: ["Capitol Hill", "Central District", "Belltown"],
    confidence: 88,
    officialSource: "Staff response to Councilmember Rivera",
    uncertainty: "No delivery date was adopted as part of a motion.",
  },
  {
    id: "L-03",
    kind: "DEADLINE",
    title: "Written comment closes August 14",
    summary: "Written comment on the pilot’s operating plan remains open through 5:00 PM.",
    timestamp: 1042,
    neighborhoods: ["Capitol Hill", "Central District"],
    confidence: 93,
    officialSource: "Chair’s closing instructions",
    uncertainty: "Residents should verify the deadline on the official meeting page.",
  },
];
const transcript = [
  [42, "CHAIR MORI", "We will move to agenda item four: curb access and neighborhood loading."],
  [286, "CLERK", "Motion 4B passes, six in favor and one opposed."],
  [731, "DIRECTOR CHEN", "We can return with a late-night reliability analysis and route-level findings."],
  [1042, "CHAIR MORI", "Written comments will be accepted until five PM on August fourteenth."],
] as const;

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function Home() {
  const [view, setView] = useState<"brief" | "map" | "method">("brief");
  const [neighborhood, setNeighborhood] = useState("Capitol Hill");
  const [address, setAddress] = useState("1515 12th Ave");
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState(-1);
  const [meetingTime, setMeetingTime] = useState(286);
  const [playing, setPlaying] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(decisions[0]);
  const [traceOpen, setTraceOpen] = useState(false);
  const [disposition, setDisposition] = useState("Not reviewed");
  const [uploadedName, setUploadedName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const relevant = useMemo(
    () => decisions.filter((d) => d.neighborhoods.includes(neighborhood)),
    [neighborhood],
  );
  const transcriptLine =
    [...transcript].reverse().find(([time]) => time <= meetingTime) ?? transcript[0];

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const next = (Date.now() - started) / 1000;
      setElapsed(next);
      setStage(Math.min(5, Math.floor(next / 2.25)));
      if (next >= 13.5) {
        window.clearInterval(timer);
        setElapsed(13.5);
        setStage(5);
        setRunning(false);
        setComplete(true);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setMeetingTime((t) => (t >= 1180 ? 0 : t + 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [playing]);

  function startReview() {
    setRunning(true);
    setComplete(false);
    setElapsed(0);
    setStage(0);
    setDisposition("Not reviewed");
  }
  function finishReview() {
    setRunning(false);
    setComplete(true);
    setElapsed(13.5);
    setStage(5);
  }
  function openDecision(decision: Decision) {
    setSelectedDecision(decision);
    setMeetingTime(decision.timestamp);
  }
  function exportBrief() {
    const payload = {
      system: "CivicLens",
      release: "CL-0.1",
      boundary: "Synthetic demonstration. Verify all civic information with official sources.",
      meeting: "Seattle Mobility & Neighborhoods Committee · Demo record",
      residentContext: { address, neighborhood },
      decisions: relevant,
      disposition,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `civiclens-${neighborhood.toLowerCase().replaceAll(" ", "-")}-brief.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="seal">CL</span>
          <div>
            <strong>CivicLens</strong>
            <small>Public decisions, made locally legible</small>
          </div>
        </div>
        <nav aria-label="Primary">
          {(["brief", "map", "method"] as const).map((item) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <span className="prototype">● Synthetic public prototype</span>
      </header>

      {view === "brief" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="kicker">CIVIC INTELLIGENCE · SEATTLE DEMO RECORD</p>
              <h1>
                Find the decision.
                <br />
                <em>See where it lands.</em>
              </h1>
              <p className="lede">
                CivicLens turns a public meeting into timestamped decisions, mapped impact,
                procedural deadlines, and a resident action brief—with uncertainty left visible.
              </p>
              <div className="hero-actions">
                <button className="primary" onClick={startReview} disabled={running}>
                  {running ? "Agents reviewing…" : "Run civic review"}
                </button>
                <button className="secondary" onClick={() => fileRef.current?.click()}>
                  Upload meeting video
                </button>
                <input
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept="video/*"
                  onChange={(event) => setUploadedName(event.target.files?.[0]?.name ?? "")}
                />
              </div>
              {uploadedName && (
                <p className="upload-note">
                  Loaded for local playback: <b>{uploadedName}</b>. CL-0.1 analysis remains
                  attached to the labeled demo record.
                </p>
              )}
            </div>
            <aside className="meeting-card">
              <span>ACTIVE RECORD</span>
              <strong>Mobility &amp; Neighborhoods Committee</strong>
              <p>July 21, 2026 · 19:40 synthetic excerpt</p>
              <dl>
                <div><dt>Detected actions</dt><dd>03</dd></div>
                <div><dt>Source coverage</dt><dd>100%</dd></div>
                <div><dt>Review state</dt><dd>{complete ? "Brief ready" : "Unreviewed"}</dd></div>
              </dl>
            </aside>
          </section>

          <div className="boundary">
            <b>RESEARCH BOUNDARY</b>
            Synthetic meeting, transcript, map, people, and deadlines. No claim is official
            civic guidance. Verify before acting.
          </div>

          <section className="workspace">
            <div className="record panel">
              <SectionTitle index="01" title="Source record" meta={clock(meetingTime)} />
              <div className="video-stage">
                <div className="meeting-room">
                  <div className="dais">
                    <i /><i /><i /><i /><i />
                  </div>
                  <div className="speaker-card">
                    <span>{transcriptLine[1]}</span>
                    <p>{transcriptLine[2]}</p>
                  </div>
                  <span className="recording">● PUBLIC RECORD · DEMO</span>
                </div>
                <button className="play" onClick={() => setPlaying(!playing)}>
                  {playing ? "Ⅱ" : "▶"}
                </button>
                <input
                  aria-label="Meeting timestamp"
                  type="range"
                  min="0"
                  max="1180"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(Number(e.target.value))}
                />
              </div>
              <div className="transcript-list">
                {transcript.map(([time, speaker, text]) => (
                  <button key={time} onClick={() => setMeetingTime(time)}>
                    <time>{clock(time)}</time>
                    <span><b>{speaker}</b>{text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="investigation panel">
              <SectionTitle
                index="02"
                title="Investigation desk"
                meta={running ? `${elapsed.toFixed(1)}s` : complete ? "COMPLETE" : "READY"}
              />
              <div className="progress">
                <i style={{ width: `${complete ? 100 : (elapsed / 13.5) * 100}%` }} />
                <span>{stage < 0 ? "AWAITING REVIEW" : stages[stage]}</span>
                <b>{Math.round(complete ? 100 : (elapsed / 13.5) * 100)}%</b>
              </div>
              <div className="agent-room">
                <div className="shared-record">
                  <span>SHARED PUBLIC RECORD</span>
                  <strong>
                    {stage < 0
                      ? "No active review"
                      : stage < 2
                        ? "Segmenting 19:40"
                        : "3 resident-relevant actions"}
                  </strong>
                  <small>Every claim requires a timestamp and record type.</small>
                </div>
                {agents.map(([code, name, remit], index) => (
                  <div
                    className={`agent agent-${index} ${stage >= Math.min(index, 5) ? "working" : ""}`}
                    key={code}
                  >
                    <div className="agent-note">
                      {stage < 0 ? "Standing by" : stage >= 4 && index === 5 ? "Challenge recorded" : remit}
                    </div>
                    <div className="agent-mark">{code}</div>
                    <b>{name}</b>
                  </div>
                ))}
                {running && <button className="skip" onClick={finishReview}>Skip to brief →</button>}
              </div>
              <div className="stage-row">
                {stages.map((item, index) => (
                  <span className={stage >= index ? "lit" : ""} key={item}>
                    <i />{item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="context">
            <div>
              <p className="section-kicker">03 · RESIDENT CONTEXT</p>
              <h2>Your block changes the question.</h2>
            </div>
            <div className="context-form">
              <label>
                Address or landmark
                <input value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <label>
                Neighborhood
                <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
                  {neighborhoods.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="map-brief">
            <CivicMap
              neighborhood={neighborhood}
              setNeighborhood={setNeighborhood}
              active={complete}
            />
            <div className="decision-panel panel">
              <SectionTitle index="04" title="Resident action brief" meta={`${relevant.length} relevant`} />
              {!complete ? (
                <div className="locked">Run the civic review to ground decisions and deadlines.</div>
              ) : (
                <>
                  <div className="resident-summary">
                    <span>CONTEXT</span>
                    <strong>{address || neighborhood}</strong>
                    <p>
                      CivicLens found {relevant.length} record items with possible relevance to{" "}
                      {neighborhood}. Relevance is inferred from the synthetic record.
                    </p>
                  </div>
                  <div className="decisions">
                    {relevant.map((decision) => (
                      <button
                        className={selectedDecision.id === decision.id ? "selected" : ""}
                        key={decision.id}
                        onClick={() => openDecision(decision)}
                      >
                        <div><span>{decision.kind}</span><time>{clock(decision.timestamp)} ↗</time></div>
                        <strong>{decision.title}</strong>
                        <p>{decision.summary}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {complete && (
            <section className="evidence">
              <div className="evidence-head">
                <div>
                  <p className="section-kicker">05 · CLAIM INSPECTOR</p>
                  <h2>{selectedDecision.title}</h2>
                </div>
                <strong>{selectedDecision.confidence}% grounded</strong>
              </div>
              <div className="evidence-grid">
                <article>
                  <span>WHAT THE RECORD SUPPORTS</span>
                  <p>{selectedDecision.summary}</p>
                  <button onClick={() => setMeetingTime(selectedDecision.timestamp)}>
                    Jump to {clock(selectedDecision.timestamp)} in source ↗
                  </button>
                </article>
                <article>
                  <span>RECORD BASIS</span>
                  <p>{selectedDecision.officialSource}</p>
                  <small>Demo source · timestamp linked</small>
                </article>
                <article className="challenge">
                  <span>CIVIC CHALLENGER</span>
                  <p>{selectedDecision.uncertainty}</p>
                  <small>Uncertainty preserved in final brief</small>
                </article>
                <article>
                  <span>RESIDENT NEXT STEP</span>
                  <p>
                    Review the official record, confirm geographic applicability, and submit
                    comment before any verified deadline.
                  </p>
                  <small>No form is submitted by CivicLens.</small>
                </article>
              </div>
              <div className="decision-actions">
                <div>
                  {["Relevant", "Needs verification", "Not relevant"].map((item) => (
                    <button
                      className={disposition === item ? "chosen" : ""}
                      onClick={() => setDisposition(item)}
                      key={item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div>
                  <button onClick={() => setTraceOpen(true)}>Open full trace ↗</button>
                  <button onClick={exportBrief}>Export brief ↓</button>
                </div>
              </div>
              <p className="disposition">Resident disposition: {disposition} · stored only in this browser session.</p>
            </section>
          )}
        </>
      )}

      {view === "map" && (
        <section className="standalone">
          <p className="kicker">GEOGRAPHIC GROUNDING · DEMO</p>
          <h1>Decisions become visible<br /><em>where they land.</em></h1>
          <CivicMap neighborhood={neighborhood} setNeighborhood={setNeighborhood} active />
          <div className="map-index">
            {decisions.map((decision) => (
              <button key={decision.id} onClick={() => { openDecision(decision); setView("brief"); }}>
                <span>{decision.kind} · {clock(decision.timestamp)}</span>
                <strong>{decision.title}</strong>
                <small>{decision.neighborhoods.join(" · ")}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {view === "method" && (
        <section className="standalone method">
          <p className="kicker">METHOD · CL-0.1</p>
          <h1>Ground every claim.<br /><em>Preserve every limit.</em></h1>
          <div className="method-grid">
            <article><span>01 · RECORD TYPE</span><h2>Decision ≠ discussion</h2><p>Motions, votes, commitments, proposals, and deadlines remain separate claim classes.</p></article>
            <article><span>02 · PROVENANCE</span><h2>Timestamp required</h2><p>No extracted action enters the brief without a navigable moment in the source record.</p></article>
            <article><span>03 · GEOGRAPHY</span><h2>Relevance is inferred</h2><p>Neighborhood grounding is a hypothesis to verify, not an official eligibility determination.</p></article>
            <article><span>04 · DISSENT</span><h2>Challenge before synthesis</h2><p>The Civic Challenger tests overstatement and forces uncertainty into the resident brief.</p></article>
            <article><span>05 · AUTHORITY</span><h2>No civic action is automated</h2><p>CivicLens prepares an evidence packet. Residents decide whether and how to participate.</p></article>
            <article><span>06 · CURRENT BOUNDARY</span><h2>Synthetic and deterministic</h2><p>CL-0.1 contains no live meeting ingestion, identity inference, or official deadline guarantee.</p></article>
          </div>
        </section>
      )}

      <footer>
        <span>CIVICLENS · CL-0.1 · DECISION SYSTEMS LAB</span>
        <span>Public record intelligence for resident review</span>
      </footer>

      {traceOpen && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setTraceOpen(false)}>
          <aside className="trace">
            <div className="trace-head">
              <div><span>COMPLETE CLAIM TRACE</span><h2>{selectedDecision.id}</h2></div>
              <button onClick={() => setTraceOpen(false)}>Close ×</button>
            </div>
            {[
              ["01", "INGEST", "Synthetic meeting record registered; 19:40 excerpt."],
              ["02", "SEGMENT", `Agenda item and speaker turns segmented around ${clock(selectedDecision.timestamp)}.`],
              ["03", "EXTRACT", `${selectedDecision.kind} claim separated from surrounding discussion.`],
              ["04", "GROUND", `${selectedDecision.neighborhoods.join(", ")} linked from named places in demo record.`],
              ["05", "CHALLENGE", selectedDecision.uncertainty],
              ["06", "BRIEF", `Resident context applied: ${address || neighborhood}. Disposition remains human.`],
            ].map(([index, title, text]) => (
              <article key={index}><b>{index}</b><div><h3>{title}</h3><p>{text}</p></div></article>
            ))}
          </aside>
        </div>
      )}
    </main>
  );
}

function SectionTitle({ index, title, meta }: { index: string; title: string; meta: string }) {
  return (
    <div className="section-title">
      <div><span>{index}</span><h2>{title}</h2></div>
      <b>{meta}</b>
    </div>
  );
}

function CivicMap({
  neighborhood,
  setNeighborhood,
  active,
}: {
  neighborhood: string;
  setNeighborhood: (value: string) => void;
  active: boolean;
}) {
  return (
    <div className={`city-map panel ${active ? "mapped" : ""}`} aria-label="Synthetic Seattle neighborhood map">
      <div className="map-head"><span>SEATTLE · SYNTHETIC CIVIC MAP</span><b>Neighborhood grounding</b></div>
      <div className="water">LAKE UNION</div>
      <div className="road road-a">12TH AVE</div>
      <div className="road road-b">MADISON ST</div>
      <div className="road road-c">BROADWAY</div>
      {neighborhoods.map((name, index) => (
        <button
          key={name}
          className={`district district-${index} ${neighborhood === name ? "current" : ""} ${
            active && decisions.some((d) => d.neighborhoods.includes(name)) ? "affected" : ""
          }`}
          onClick={() => setNeighborhood(name)}
        >
          <i />
          <span>{name}</span>
          <small>{active ? decisions.filter((d) => d.neighborhoods.includes(name)).length : 0} signals</small>
        </button>
      ))}
      <div className="map-legend"><span><i className="amber" />Affected</span><span><i className="blue" />Selected</span></div>
    </div>
  );
}
