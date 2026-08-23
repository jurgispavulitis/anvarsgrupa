Project overview:
Static marketing website for SIA ANVARS GRUPA (Latvian transport and earthworks company). Plain HTML, CSS, and vanilla JS. No build system, no package manager, no test runners. All page content and code comments use Latvian (lang="lv").

Hosting target is a self-managed Nginx server on Oracle Cloud. The contact section uses action links: WhatsApp (wa.me), tel:, and mailto:.

Commands:
- Preview: Run "npx http-server -p 8080" or "python -m http.server 8080" from repo root.
- Validate HTML: "npx html-validate index.html */index.html" (must pass with 0 errors).
- Syntax-check JS: "node --check js/main.js".
- Push changes: Stage, commit, and push to GitHub using "git push origin main". This triggers the Deploy workflow (.github/workflows/deploy.yml), which validates HTML/JS and then makes the OCI server pull and publish the new version. See DEPLOY.md section 7.

Architecture:
- index.html: landing page with hero video, stats band, 8 service cards, process, about, gallery lightbox, contact action cards, footer.
- Eight service pages at <slug>/index.html: transporta-pakalpojumi, celu-izbuve, zemes-darbi, mezizstrade, labiekartosanas-darbi, melioracijas-darbi, teritoriju-sagatavosana, demontaza. They share identical header and footer markup (using ../ relative paths) and common section structure: hero, intro with benefit panel, gallery, CTA band.
- css/style.css: single shared stylesheet, mobile-first (breakpoints 640/900/1200px), organized in numbered Latvian banner-comment sections. Colors defined via :root custom properties (--blue, --yellow).
- js/main.js: mobile dropdown nav, scroll reveals (data-reveal, --reveal-delay), stat counters (data-count, data-suffix), gallery lightbox (.gallery-item with data-full), footer year (data-year).
- images/: original heavy media files. Git-ignored (see .gitignore) and excluded from deployment; they exist only on the local Windows machine.
- images/opt/: web-optimized derivatives used on site. Format: <name>.jpg (1600px) and <name>-thumb.jpg (800px for grids), hero.mp4 (~2.8 MB), logo.png.
- .github/workflows/deploy.yml: GitHub Actions pipeline. Job 1 runs html-validate and node --check; job 2 SSHes into the OCI instance, which runs "git reset --hard origin/main" and then scripts/deploy.sh.
- scripts/deploy.sh: runs ON THE SERVER. Mirrors the repo into /var/www/anvarsgrupa with rsync --delete, excluding .git, .github, scripts, *.md and config files.

Conventions:
- Placeholder copy awaiting client text is tagged with <span class="ph-note">...</span>. Keep these visible until real content arrives.
- When editing shared header or footer markup, apply the same edit to index.html and all eight service pages simultaneously. Keep ../ path prefixes on subpages.
- New photos: generate both 1600px and 800px -thumb JPEG derivatives into images/opt/ (sharp, quality ~78) rather than referencing originals.
- Fonts: Montserrat (body) and Rajdhani (display), loaded from Google Fonts in head.
- Phone formatting: "+371 22 000 134" in visible text. Links use "tel:+37122000134" and "wa.me/37122000134".
