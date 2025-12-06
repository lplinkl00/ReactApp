import { Filter, X } from "lucide-react";
import { Campaign } from "../data/campaigns";

interface FilterPanelProps {
  organizations: string[];
  selectedOrg: string | null;
  onSelectOrg: (org: string | null) => void;
  statuses: Campaign["status"][];
  selectedStatus: Campaign["status"] | null;
  onSelectStatus: (status: Campaign["status"] | null) => void;
}

export function FilterPanel({
  organizations,
  selectedOrg,
  onSelectOrg,
  statuses,
  selectedStatus,
  onSelectStatus,
}: FilterPanelProps) {
  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-4">
          <Filter size={20} className="text-gray-600" />
          <span className="text-gray-900">Filters</span>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Organization Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-2">Organization</label>
            <select
              value={selectedOrg || ""}
              onChange={(e) => onSelectOrg(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus || ""}
              onChange={(e) => onSelectStatus((e.target.value as Campaign["status"]) || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(selectedOrg || selectedStatus) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  onSelectOrg(null);
                  onSelectStatus(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(selectedOrg || selectedStatus) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedOrg && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                <span>Organization: {selectedOrg}</span>
                <button
                  onClick={() => onSelectOrg(null)}
                  className="hover:bg-blue-200 rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {selectedStatus && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                <span>Status: {selectedStatus}</span>
                <button
                  onClick={() => onSelectStatus(null)}
                  className="hover:bg-purple-200 rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
