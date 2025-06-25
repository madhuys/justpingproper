// PurgeCSS configuration for Next.js + Tailwind CSS
// See: https://purgecss.com/configuration.html

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // Scan all source files
    './public/index.html',        // If you use a static HTML entry
    './components/**/*.{js,ts,jsx,tsx}', // If you have a components dir
  ],
  css: ['./src/app/globals.css'], // Main CSS file(s) to purge
  safelist: [
    // Add any classes that should never be purged (e.g. generated, dynamic, or third-party)
    'sidebar-glass',
    'sidebar-glass-dark',
    'container-onboarding',
    'container-postauth',
    'container-postauth-responsive',
    'main-scroll-area',
    'footer-fixed',
    'dropdown-item',
    'pulse-grow',
    'melt-in',
    'melt-out',
    'page-enter',
    // Add more as needed
  ],
  defaultExtractor: content => content.match(/[^\r\n"'`<>=\s]*[^\r\n"'`<>=\s:]/g) || [],
};
