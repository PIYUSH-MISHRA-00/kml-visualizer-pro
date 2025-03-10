
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ease-in-out",
        scrolled ? "glassmorphism shadow-sm" : "bg-transparent",
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium text-kml-dark-gray">
            KML <span className="text-kml-blue">Visualizer Pro</span>
          </h1>
        </div>
        {/* <nav className="hidden md:flex space-x-8">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-kml-dark-gray/80 hover:text-kml-blue transition-colors"
          >
            GitHub
          </a>
          <a 
            href="https://docs.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-kml-dark-gray/80 hover:text-kml-blue transition-colors"
          >
            Documentation
          </a>
          <a 
            href="https://support.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium text-kml-dark-gray/80 hover:text-kml-blue transition-colors"
          >
            Support
          </a>
        </nav> */}
      </div>
    </header>
  );
};

export default Header;
