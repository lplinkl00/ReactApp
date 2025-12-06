import { Campaign } from "../data/campaigns";
import { DollarSign, Users, Target, TrendingUp } from "lucide-react";

interface DashboardProps {
  campaigns: Campaign[];
  organization: string | null;
}

export function Dashboard({ campaigns, organization }: DashboardProps) {
  const totalFundsRaised = campaigns.reduce((sum, c) => sum + c.fundsRaised, 0);
  const totalDonators = campaigns.reduce((sum, c) => sum + c.donators, 0);
  const totalCampaigns = campaigns.length;
  const totalGoal = campaigns.reduce((sum, c) => sum + c.fundingGoal, 0);
  const averageProgress = totalGoal > 0 ? (totalFundsRaised / totalGoal) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      label: "Total Funds Raised",
      value: formatCurrency(totalFundsRaised),
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Total Donators",
      value: totalDonators.toLocaleString(),
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Active Campaigns",
      value: totalCampaigns.toString(),
      icon: Target,
      color: "bg-purple-100 text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Average Progress",
      value: `${averageProgress.toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h2 className="text-gray-900 mb-1">
            Campaign Dashboard
          </h2>
          {organization ? (
            <p className="text-gray-600">
              Showing data for: <span className="text-blue-600">{organization}</span>
            </p>
          ) : (
            <p className="text-gray-600">Showing data for all organizations</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <div className="text-gray-600 mb-1">{stat.label}</div>
              <div className="text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Campaign List */}
        <div className="mt-6">
          <h3 className="text-gray-900 mb-4">Campaign Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700">Organization</th>
                  <th className="px-4 py-3 text-left text-gray-700">Campaign</th>
                  <th className="px-4 py-3 text-left text-gray-700">Platform</th>
                  <th className="px-4 py-3 text-left text-gray-700">Location</th>
                  <th className="px-4 py-3 text-right text-gray-700">Funds Raised</th>
                  <th className="px-4 py-3 text-right text-gray-700">Goal</th>
                  <th className="px-4 py-3 text-right text-gray-700">Donators</th>
                  <th className="px-4 py-3 text-center text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {campaign.organization}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{campaign.title}</div>
                      <div className="text-gray-500">{campaign.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {campaign.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {campaign.location.city}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatCurrency(campaign.fundsRaised)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(campaign.fundingGoal)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {campaign.donators.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-white ${
                          campaign.status === "active"
                            ? "bg-blue-500"
                            : campaign.status === "completed"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}