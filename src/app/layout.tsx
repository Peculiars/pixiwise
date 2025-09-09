import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, } from "@clerk/nextjs";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pixiwise",
  description: "AI-Powered Image Transformation and Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{variables: {colorPrimary: '#624CF5'}}}> 
      <html lang="en">
        <body className={`${ibmPlexSans.variable} antialiased`} >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
