import "./globals.css";
import type { Metadata } from 'next';
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'react-hot-toast';

const roboto = Roboto({ 
  weight: ['300', '400', '500', '700'],
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "JustPing - AI-Powered Customer Communication",
  description: "Modern customer communication platform with AI agents and automation",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-light.png', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-dark.png', type: 'image/png', media: '(prefers-color-scheme: dark)' }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('justping-theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = theme === 'dark' || (theme !== 'light' && systemTheme);
                  
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  }
                  
                  // Update favicon based on theme
                  const updateFavicon = () => {
                    const isDark = document.documentElement.classList.contains('dark');
                    // Try to find the main favicon link (without media query)
                    let favicon = document.querySelector('link[rel="icon"]:not([media])');
                    // If not found, try alternate selectors
                    if (!favicon) {
                      favicon = document.querySelector('link[rel="icon"][href*="favicon.ico"]');
                    }
                    if (favicon) {
                      favicon.href = isDark ? '/favicon-dark.png' : '/favicon-light.png';
                    }
                  };
                  
                  updateFavicon();
                  
                  // Watch for theme changes
                  const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        updateFavicon();
                      }
                    });
                  });
                  
                  observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['class']
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={roboto.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="justping-theme"
          enableColorScheme={false}
        >
          <AuthProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                className: '',
                duration: 4000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--card-foreground)',
                  border: '1px solid var(--border)',
                },
              }}
            />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
