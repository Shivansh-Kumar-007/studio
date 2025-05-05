import type {Metadata} from 'next';
import { Roboto } from 'next/font/google'; // Changed from Geist to Roboto
import './globals.css';

// Initialize Roboto font
const roboto = Roboto({
  weight: ['400', '500', '700'], // Specify needed weights
  subsets: ['latin'],
  variable: '--font-roboto', // Define CSS variable
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'PixelClip', // Updated App Name
  description: 'Generate short, pixelated video clips.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply Roboto font variable */}
      <body className={`${roboto.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
