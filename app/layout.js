import './globals.css';

export const metadata = {
  title: "Erendira's Boutique Billing Portal",
  description: "Customer and admin billing portal for Erendira's Boutique.",
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
