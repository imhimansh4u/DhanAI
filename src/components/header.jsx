import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";
import { checkUser } from "@/lib/checkUser";



async function Header() {

  await checkUser();

  return (
    <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logo.png"}
            alt="DhanAi Logo"
            height={600}
            width={600}
            className="h-8 sm:h-10 md:h-12 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton>
              <button
                className="border-2 border-teal-500 text-teal-600 
             hover:bg-teal-500 hover:text-white 
             font-medium rounded-2xl 
             px-2 sm:px-2 py-1 sm:py-2 
             transition-all duration-300 ease-out 
             shadow-sm hover:shadow-lg"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button
                variant="outline"
                className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 
             hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 
             text-white font-semibold rounded-2xl 
             px-3 sm:px-2 py-2 sm:py-2 
             shadow-md hover:shadow-xl 
             transform hover:-translate-y-0.5 
             transition-all duration-300 ease-out"
              >
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            {/* This one is for the DashBoard */}
            <Link
              href={"/dashboard"}
              className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
            >
              <Button variant="outline">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">DashBoard</span>
              </Button>
            </Link>
            {/* This one is to create transactions */}
            <Link
              href={"/transaction/create"}
              className="flex items-center gap-2"
            >
              <Button variant="outline">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
}

export default Header;
