import "./globals.css";

export const metadata = {
  title: "Lemontree Insights",
  description: "Data insights platform for food access partners",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
