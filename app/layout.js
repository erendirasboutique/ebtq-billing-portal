import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Erendira's Boutique Portal",
  description: "Payment portal for Erendira's Boutique",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="pageShell">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
