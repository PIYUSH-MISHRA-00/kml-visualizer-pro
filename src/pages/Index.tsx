
import { useState } from "react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import KmlMap from "@/components/KmlMap";
import KmlSummary from "@/components/KmlSummary";
import { ParsedKml } from "@/types";
import { Button } from "@/components/ui/button";
import { List, Map } from "lucide-react";

const Index = () => {
  const [kmlData, setKmlData] = useState<ParsedKml | undefined>(undefined);
  const [showSummary, setShowSummary] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  const handleFileProcessed = (data: ParsedKml) => {
    setKmlData(data);
    setShowSummary(true);
    setShowDetailed(false);
  };

  const handleSummaryClick = () => {
    setShowSummary(true);
    setShowDetailed(false);
  };

  const handleDetailedClick = () => {
    setShowSummary(false);
    setShowDetailed(true);
  };

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-white to-kml-gray/30">
      <Header />
      
      {/* Add CSS for Leaflet markers */}
      <style jsx global>{`
        .kml-tooltip {
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 2px 5px;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
      
      <main className="container px-4 mx-auto pt-32">
        <section className="text-center mb-16 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-semibold text-kml-dark-gray mb-4 tracking-tight">
            Visualize <span className="text-kml-blue">KML</span> Files with Ease
          </h1>
          <p className="text-lg text-kml-dark-gray/70 max-w-2xl mx-auto">
            Upload your KML files to visualize geographic data, analyze elements, 
            and explore spatial information interactively.
          </p>
        </section>

        <section className="mb-12 animate-fade-up" style={{animationDelay: "100ms"}}>
          <FileUpload onFileProcessed={handleFileProcessed} />
        </section>

        {kmlData && (
          <>
            <section className="flex flex-wrap gap-4 justify-center mb-6 animate-fade-up" style={{animationDelay: "200ms"}}>
              <Button
                variant={showSummary ? "default" : "outline"}
                className={`kml-button ${showSummary ? "bg-kml-blue" : "bg-white"}`}
                onClick={handleSummaryClick}
              >
                <List size={16} className="mr-2" />
                Summary
              </Button>
              <Button
                variant={showDetailed ? "default" : "outline"}
                className={`kml-button ${showDetailed ? "bg-kml-blue" : "bg-white"}`}
                onClick={handleDetailedClick}
              >
                <Map size={16} className="mr-2" />
                Detailed
              </Button>
            </section>

            <section className="grid md:grid-cols-3 gap-6 animate-fade-up" style={{animationDelay: "300ms"}}>
              <div className={`md:col-span-2 transition-all duration-300 ease-in-out ${showSummary ? "md:col-span-2" : "md:col-span-3"}`}>
                <KmlMap kmlData={kmlData} showDetailed={showDetailed} className="animate-scale-in" />
              </div>
              
              {showSummary && (
                <div className="md:col-span-1">
                  <KmlSummary kmlData={kmlData} className="h-full animate-scale-in" />
                </div>
              )}
            </section>
          </>
        )}
      </main>
      
      <footer className="mt-20 py-8 border-t border-kml-gray/30">
        <div className="container px-4 mx-auto text-center">
          <p className="text-sm text-kml-dark-gray/60">
            KML Visualizer Pro &copy; {new Date().getFullYear()} 
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
