import type { Project } from "@/lib/portfolio";
export function ProjectArt({
  project,
}: {
  project: Pick<Project, "theme" | "title">;
}) {
  return (
    <div className={`project-art art-${project.theme}`} aria-hidden="true">
      <div className="art-topline">
        <span>{project.title}</span>
        <span>DESIGN & BUILD ↗</span>
      </div>
      {project.theme === "cafe" ? (
        <>
          <div className="art-editorial">
            A little pause.
            <br />
            <i>A better day.</i>
          </div>
          <div className="coffee-scene">
            <div className="coffee-saucer">
              <div className="coffee-cup">
                <div className="coffee-surface" />
              </div>
            </div>
          </div>
          <span className="art-bottomline">COFFEE · SPACE · SLOW MOMENTS</span>
        </>
      ) : project.theme === "ec" ? (
        <>
          <div className="art-editorial">
            Less, but
            <br />
            <i>better.</i>
          </div>
          <div className="product-cylinder">
            <span>
              FORME
              <br />
              <small>01 / EVERYDAY</small>
            </span>
          </div>
          <span className="art-bottomline">DESIGNED FOR YOUR EVERYDAY</span>
        </>
      ) : project.theme === "creative" ? (
        <>
          <div className="creative-orbit" />
          <div className="art-editorial">
            MAKE
            <br />
            <i>ROOM.</i>
          </div>
          <span className="art-bottomline">
            A NEW PERSPECTIVE / STILL STUDIO
          </span>
        </>
      ) : project.theme === "improvement" ? (
        <div className="art-comparison">
          <div>
            <small>BEFORE</small>
            <span />
            <span />
            <span />
          </div>
          <div>
            <small>AFTER ↗</small>
            <b>
              Clear.
              <br />
              Simple.
              <br />
              Better.
            </b>
            <i />
          </div>
        </div>
      ) : project.theme === "qa" ? (
        <>
          <div className="art-editorial">
            Ready to
            <br />
            <i>deliver.</i>
          </div>
          <div className="art-checks">
            <span>✓ Source code</span>
            <span>✓ Quality check</span>
            <span>✓ Documentation</span>
          </div>
        </>
      ) : (
        <div className="art-app">
          <div className="art-sidebar">
            ◈<span>Overview</span>
            <span>Projects</span>
            <span>Workspace</span>
          </div>
          <div className="art-app-main">
            <small>
              {project.theme === "automation"
                ? "WORKFLOW / HUMAN IN THE LOOP"
                : "YOUR WORK, IN FOCUS"}
            </small>
            <b>
              {project.theme === "automation"
                ? "From inbox to action."
                : project.theme === "booking"
                  ? "A well-planned day."
                  : "Make space for focus."}
            </b>
            <div className="art-app-metrics">
              <span>
                Overview<strong>12</strong>
              </span>
              <span>
                In progress<strong>04</strong>
              </span>
              <span>
                Complete<strong>08</strong>
              </span>
            </div>
            <div className="art-app-rows">
              {["Design review", "Project planning", "Ready for delivery"].map(
                (s, i) => (
                  <div key={s}>
                    <i />
                    <span>{s}</span>
                    <em>{["09:00", "11:00", "14:00"][i]}</em>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
