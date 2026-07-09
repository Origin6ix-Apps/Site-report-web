import "./globals.css";

export const metadata = {
  title: "Workforge",
  description: "Teams, projects, and reports — managed in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>{children}</div>
          <footer
            style={{
              textAlign: "center", padding: "16px 20px", fontSize: 11.5, color: "#94A3B8",
              fontFamily: "Montserrat, sans-serif", borderTop: "1px solid #E2E8F0",
            }}
          >
            © 2026 Workforge. All rights reserved. Developed by Origin6ix.
          </footer>
        </div>
      </body>
    </html>
  );
}

