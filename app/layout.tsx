import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Gramam CSC | ഡിജിറ്റൽ ഗ്രാമം സി.എസ്.സി & DigiPrint",
  description:
    "ഡിജിറ്റൽ ഗ്രാമം സി.എസ്.സി ജനസേവന കേന്ദ്രം - വില്ലേജ് ഓഫീസ് സേവനങ്ങൾ, പഞ്ചായത്ത് കെ-സ്മാർട്ട്, മുൻസിപ്പാലിറ്റി സേവനങ്ങൾ, യൂട്ടിലിറ്റി ബില്ലുകൾ, എഡ്യൂക്കേഷണൽ സേവനങ്ങൾ, DigiPrint Custom Gifts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ml" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
