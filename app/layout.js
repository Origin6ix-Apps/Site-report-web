import "./globals.css";

export const metadata = {
  title: "Deepthi Sai Constructions",
  description: "Daily construction reports, generated from photos and a voice note.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
