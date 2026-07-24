// Resume content. Each "pad" is a landing zone on the terrain that the
// ship can fly to; edit this file to change site copy without touching
// game logic in game.js.
export const PADS = [
  {
    id: 'home', x: 420, width: 220, label: 'HOME',
    panelHTML: `
      <div class="eyebrow">// SENIOR SOFTWARE ENGINEER</div>
      <h2>AVI RESNICK</h2>
      <div class="loc">San Francisco, CA</div>
      <p>I build full-stack software for dual-use applications, focusing on real-time communication, command and control, predictive modeling, and technical interfaces that scale. My experience spans aerospace and defense across government and industry, as well as AI-integrated enterprise software.</p>
      <p class="hint">Fly right (→ then ↑) to reach EXPERIENCE.</p>
    `,
    staticHTML: `
      <section>
        <p>I build full-stack software for dual-use applications, focusing on real-time communication, command and control, predictive modeling, and technical interfaces that scale. My experience spans aerospace and defense across government and industry, as well as AI-integrated enterprise software.</p>
      </section>
    `
  },
  {
    id: 'experience', x: 2300, width: 260, label: 'EXPERIENCE',
    panelHTML: `
      <div class="eyebrow">// PROFESSIONAL</div>
      <h2>EXPERIENCE</h2>
      <div class="job current">
        <div class="job-title">Senior Software Engineer</div>
        <div class="job-co">Company in Stealth · San Francisco Bay Area</div>
        <div class="job-date">2025 — Present</div>
      </div>
      <div class="job">
        <div class="job-title">Software Engineer</div>
        <div class="job-co">Brightcove · San Francisco Bay Area</div>
        <div class="job-desc">AI-driven integrations: text-to-video generation, short-form content tools, Roles &amp; Permissions.</div>
      </div>
      <div class="job">
        <div class="job-title">Software Engineering Intern</div>
        <div class="job-co">Zenith Aerospace · Belmont, CA</div>
        <div class="job-desc">Built a full-stack interface for bidirectional communication with high-altitude payloads, bridging onboard firmware to ground control logic.</div>
      </div>
      <div class="job">
        <div class="job-title">Software Research Intern</div>
        <div class="job-co">NASA Langley Research Center · Hampton, VA</div>
        <div class="job-desc">Engineered a testing framework for NASA's Safety-Critical Avionics Systems Branch, combining combinatorial and property-based testing for up to a 20x speedup.</div>
      </div>
      <div class="job">
        <div class="job-title">AI Software Engineer</div>
        <div class="job-co">Penn GRASP Lab · Philadelphia, PA</div>
        <div class="job-desc">Built a GAN-based robustness measure for robot locomotion controllers, tuning network architectures in TensorFlow.</div>
      </div>
    `,
    staticHTML: `
      <section>
        <h2>EXPERIENCE</h2>
        <div class="job current">
          <div class="job-title">Senior Software Engineer</div>
          <div class="job-co">Company in Stealth · San Francisco Bay Area</div>
          <div class="job-date">2025 — Present</div>
        </div>
        <div class="job">
          <div class="job-title">Software Engineer</div>
          <div class="job-co">Brightcove · San Francisco Bay Area</div>
          <div class="job-desc">AI-driven integrations: text-to-video generation, short-form content tools, Roles &amp; Permissions.</div>
        </div>
        <div class="job">
          <div class="job-title">Software Engineering Intern</div>
          <div class="job-co">Zenith Aerospace · Belmont, CA</div>
          <div class="job-desc">Built a full-stack interface for bidirectional communication with high-altitude payloads, bridging onboard firmware to ground control logic.</div>
        </div>
        <div class="job">
          <div class="job-title">Software Research Intern</div>
          <div class="job-co">NASA Langley Research Center · Hampton, VA</div>
          <div class="job-desc">Engineered a testing framework for NASA's Safety-Critical Avionics Systems Branch, combining combinatorial and property-based testing for up to a 20x speedup.</div>
        </div>
        <div class="job">
          <div class="job-title">AI Software Engineer</div>
          <div class="job-co">Penn GRASP Lab · Philadelphia, PA</div>
          <div class="job-desc">Built a GAN-based robustness measure for robot locomotion controllers, tuning network architectures in TensorFlow.</div>
        </div>
      </section>
    `
  },
  {
    id: 'education', x: 4180, width: 240, label: 'EDUCATION',
    panelHTML: `
      <div class="eyebrow">// SCHOOL</div>
      <h2>EDUCATION</h2>
      <div class="job">
        <div class="job-title">M.S.E. in Computer Science</div>
        <div class="job-co">University of Pennsylvania · Philadelphia, PA</div>
      </div>
      <div class="job">
        <div class="job-title">B.S.E. in Computer Science</div>
        <div class="job-co">University of Pennsylvania · Philadelphia, PA</div>
      </div>
    `,
    staticHTML: `
      <section>
        <h2>EDUCATION</h2>
        <div class="job">
          <div class="job-title">M.S.E. in Computer Science</div>
          <div class="job-co">University of Pennsylvania · Philadelphia, PA</div>
        </div>
        <div class="job">
          <div class="job-title">B.S.E. in Computer Science</div>
          <div class="job-co">University of Pennsylvania · Philadelphia, PA</div>
        </div>
      </section>
    `
  },
  {
    id: 'publications', x: 6060, width: 260, label: 'PUBLICATIONS',
    panelHTML: `
      <div class="eyebrow">// RESEARCH</div>
      <h2>PUBLICATIONS</h2>
      <div class="job">
        <div class="job-title">Don't Go Down the Rabbit Hole: Reprioritizing Enumeration for Property-Based Testing</div>
        <div class="job-co">ACM SIGPLAN Haskell Symposium (Haskell '23) · 2023</div>
        <div class="job-desc"><a href="https://doi.org/10.1145/3609026.3609730" target="_blank" rel="noopener">Read paper ↗</a></div>
      </div>
      <div class="job">
        <div class="job-title">Novel Software for Automated Morphometric Analysis of Stented Arteries</div>
        <div class="job-co">2020</div>
        <div class="job-desc"><a href="https://doi.org/10.1101/2020.01.30.927459" target="_blank" rel="noopener">Read paper ↗</a></div>
      </div>
    `,
    staticHTML: `
      <section>
        <h2>PUBLICATIONS</h2>
        <div class="job">
          <div class="job-title">Don't Go Down the Rabbit Hole: Reprioritizing Enumeration for Property-Based Testing</div>
          <div class="job-co">ACM SIGPLAN Haskell Symposium (Haskell '23) · 2023</div>
          <div class="job-desc"><a href="https://doi.org/10.1145/3609026.3609730" target="_blank" rel="noopener">Read paper ↗</a></div>
        </div>
        <div class="job">
          <div class="job-title">Novel Software for Automated Morphometric Analysis of Stented Arteries</div>
          <div class="job-co">2020</div>
          <div class="job-desc"><a href="https://doi.org/10.1101/2020.01.30.927459" target="_blank" rel="noopener">Read paper ↗</a></div>
        </div>
      </section>
    `
  },
  {
    id: 'contact', x: 7940, width: 220, label: 'CONTACT',
    panelHTML: `
      <div class="eyebrow">// GET IN TOUCH</div>
      <h2>LET'S CONNECT</h2>
      <p>Based in San Francisco. Always open to an interesting conversation.</p>
      <div class="links">
        <a href="https://www.linkedin.com/in/aviel-resnick/" target="_blank" rel="noopener">LinkedIn ↗</a>
        <a href="mailto:aviel.resnick@gmail.com">Email ↗</a>
        <a href="https://github.com/Aviel-Resnick" target="_blank" rel="noopener">GitHub ↗</a>
        <a href="Aviel Resnick - Resume.pdf" target="_blank" rel="noopener">Resume (PDF) ↗</a>
      </div>
    `,
    staticHTML: `
      <section>
        <h2>CONTACT</h2>
        <p>Based in San Francisco. Always open to an interesting conversation.</p>
        <div class="links">
          <a href="https://www.linkedin.com/in/aviel-resnick/" target="_blank" rel="noopener">LinkedIn ↗</a>
          <a href="mailto:aviel.resnick@gmail.com">Email ↗</a>
          <a href="https://github.com/Aviel-Resnick" target="_blank" rel="noopener">GitHub ↗</a>
          <a href="Aviel Resnick - Resume.pdf" target="_blank" rel="noopener">Resume (PDF) ↗</a>
        </div>
      </section>
    `
  }
];
