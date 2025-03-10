
import { ParsedKml } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/utils/kmlParser";

interface KmlSummaryProps {
  kmlData?: ParsedKml;
  className?: string;
}

const KmlSummary = ({ kmlData, className }: KmlSummaryProps) => {
  if (!kmlData) {
    return (
      <div className={cn("p-6 rounded-xl bg-white shadow-md animate-fade-in", className)}>
        <p className="text-center text-kml-dark-gray/70">
          Upload a KML file to see the summary
        </p>
      </div>
    );
  }

  const { summary, elements } = kmlData;

  // Calculate total length of all LineString and MultiGeometry elements
  const totalLength = elements.reduce((total, element) => {
    if ((element.type === "LineString" || element.type === "MultiGeometry") && element.length) {
      return total + element.length;
    }
    return total;
  }, 0);

  return (
    <div className={cn("p-6 rounded-xl bg-white shadow-md animate-fade-in", className)}>
      <h3 className="text-lg font-medium text-kml-dark-gray mb-4">KML Summary</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-kml-gray/50">
              <th className="px-4 py-2 text-left text-sm font-medium text-kml-dark-gray/70">Element Type</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-kml-dark-gray/70">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(summary).map(([type, count]) => (
              <tr key={type} className="border-b border-kml-gray/30 hover:bg-kml-gray/10">
                <td className="px-4 py-3 text-left">{type}</td>
                <td className="px-4 py-3 text-right font-medium">{count}</td>
              </tr>
            ))}
            {Object.keys(summary).length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-kml-dark-gray/70">
                  No elements found in the KML file
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalLength > 0 && (
        <div className="mt-4 pt-4 border-t border-kml-gray/50">
          <p className="text-sm text-kml-dark-gray/70">
            Total path length: <span className="font-medium text-kml-dark-gray">{formatDistance(totalLength)}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default KmlSummary;
