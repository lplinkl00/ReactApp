import { Campaign } from "../data/campaigns";
import { MapPin } from "lucide-react";
import { useState } from "react";

interface CampaignMapProps {
  campaigns: Campaign[];
  onCampaignSelect: (campaign: Campaign) => void;
}

export function CampaignMap({ campaigns, onCampaignSelect }: CampaignMapProps) {
  const [hoveredCampaign, setHoveredCampaign] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100).toFixed(0);
  };

  // Convert lat/lng to relative position on Malaysia map
  const getPosition = (lat: number, lng: number) => {
    // Malaysia bounds: lat 0.8 to 7.3, lng 99.6 to 119.3
    const minLat = 0.8;
    const maxLat = 7.3;
    const minLng = 99.6;
    const maxLng = 119.3;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;

    return { x, y };
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 relative">
      {/* Map Background */}
      <div className="absolute inset-0 bg-white/50">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Simplified Malaysia outline */}
          <path
            d="M20,40 L25,35 L30,38 L35,35 L40,40 L45,38 L50,42 L55,40 L60,45 L65,42 L70,48 L75,45 L78,50 L80,48 L82,52 L80,55 L75,58 L70,60 L65,62 L60,58 L55,60 L50,62 L45,60 L40,58 L35,62 L30,60 L25,58 L20,55 L18,50 L20,45 Z M15,65 L18,62 L22,65 L25,68 L22,70 L18,68 Z M75,55 L78,58 L82,60 L85,63 L82,65 L78,63 L75,60 Z"
            fill="#e0f2fe"
            stroke="#0369a1"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Campaign Markers */}
      {campaigns.map((campaign) => {
        const pos = getPosition(campaign.location.lat, campaign.location.lng);
        const isHovered = hoveredCampaign === campaign.id;

        return (
          <div
            key={campaign.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            onMouseEnter={() => setHoveredCampaign(campaign.id)}
            onMouseLeave={() => setHoveredCampaign(null)}
            onClick={() => onCampaignSelect(campaign)}
          >
            {/* Marker Pin */}
            <div
              className={`transition-all duration-200 ${
                isHovered ? "scale-125" : "scale-100"
              }`}
            >
              <MapPin
                size={isHovered ? 32 : 24}
                className={`drop-shadow-lg ${
                  campaign.status === "active"
                    ? "text-blue-600 fill-blue-600"
                    : campaign.status === "completed"
                    ? "text-green-600 fill-green-600"
                    : "text-red-600 fill-red-600"
                }`}
              />
            </div>

            {/* Hover Popup */}
            {isHovered && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                <div className="mb-2">
                  <div className="text-gray-900 mb-1">{campaign.title}</div>
                  <div className="text-blue-600">{campaign.organization}</div>
                  <div className="text-gray-500 mt-1">Platform: {campaign.platform}</div>
                </div>
                <div className="mb-2">
                  <div className="text-gray-600">{campaign.location.city}</div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">
                      {formatCurrency(campaign.fundsRaised)}
                    </span>
                    <span className="text-gray-500">
                      of {formatCurrency(campaign.fundingGoal)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${calculateProgress(
                          campaign.fundsRaised,
                          campaign.fundingGoal
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-gray-600 mb-2">
                  {campaign.donators.toLocaleString()} donators
                </div>
                <div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-white ${
                      campaign.status === "active"
                        ? "bg-blue-500"
                        : campaign.status === "completed"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {campaign.status.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend overlay at top right */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
        <div className="text-gray-900 mb-2">Malaysia</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-600 fill-blue-600" />
            <span className="text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-600 fill-green-600" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-red-600 fill-red-600" />
            <span className="text-gray-600">Urgent</span>
          </div>
        </div>
      </div>
    </div>
  );
}