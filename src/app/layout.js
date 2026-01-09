import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { Toaster } from "sonner";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DhanAi",
  description: "One stop Finance Platform",
};

export default async function RootLayout({ children }) {


  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          {/* header */}

          <Header>

          </Header>

          <main className="min-h-screen">{children}</main>
          
          <Toaster richColors/>
          

          {/* footer */}
          <footer className="bg-blue-50 py-8">
            <div
              className="container mx-auto px-4 text-center
           text-gray-600"
            >
              <p>Made with ❤️ by Himanshu</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
