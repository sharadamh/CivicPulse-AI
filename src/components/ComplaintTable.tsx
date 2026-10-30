/**
 * CivicPulse AI - Filterable Municipal Complaint Table
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  Eye,
  Flame,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintStatus, PriorityLevel } from '../types/index.ts';

interface ComplaintTableProps {
  complaints: Complaint[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenComplaintModal: (complaint: Complaint) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  selectedCity,
  onSelectCity,
  onOpenComplaintModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Unique lists for dropdowns
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach(c => set.add(c.location.city));
    return ['All Cities', ...Array.from(set).sort()];
  }, [complaints]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach(c => set.add(c.category));
    return ['All Categories', ...Array.from(set).sort()];
  }, [complaints]);

  // Filtering
  const filtered = useMemo(() => {
    return complaints.filter(c => {
      // City
      if (selectedCity && selectedCity !== 'All' && selectedCity !== 'All Cities') {
        if (c.location.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      }

      // Status
      if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;

      // Priority
      if (selectedPriority !== 'All' && c.priority !== selectedPriority) return false;

      // Category
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matches =
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.area.toLowerCase().includes(q) ||
          c.location.city.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [complaints, selectedCity, selectedStatus, selectedPriority, selectedCategory, searchTerm]);

  // CSV Export
  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'City', 'Area', 'Priority', 'Score', 'Status', 'Department', 'Date'];
    const rows = filtered.map(c => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.location.city,
      `"${c.location.area.replace(/"/g, '""')}"`,
      c.priority,
      c.aiAnalysis.priorityScore.total,
      c.status,
      c.assignedDepartment || 'Unassigned',
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `civicpulse_complaints_${selectedCity.toLowerCase() || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by ID, keyword, street..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={exportCSV}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <span className="text-xs text-slate-500 font-medium ml-2">
              Showing <strong>{filtered.length}</strong> of {complaints.length}
            </span>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter City
            </label>
            <select
              value={selectedCity}
              onChange={e => onSelectCity(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              {availableCities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              {['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'].map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              {['All', 'Critical', 'High', 'Medium', 'Low'].map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 truncate"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID & Priority</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">City / Area</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">No complaints found matching current filters.</p>
                    <p className="text-xs mt-1">Try resetting the city or category filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const isCritical = c.priority === 'Critical';
                  const isHigh = c.priority === 'High';
                  const hasDuplicates = c.aiAnalysis.duplicates.length > 0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onOpenComplaintModal(c)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      {/* ID and Priority Badge */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-700 text-xs mb-1">
                          {c.id}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isHigh
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : c.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-green-100 text-green-800 border border-green-300'
                          }`}
                        >
                          {isCritical && <AlertOctagon className="w-2.5 h-2.5" />}
                          {isHigh && <Flame className="w-2.5 h-2.5" />}
                          {c.priority} ({c.aiAnalysis.priorityScore.total})
                        </span>
                      </td>

                      {/* Title & Category */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900 line-clamp-1 mb-0.5">
                          {c.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">{c.category}</span>
                          {hasDuplicates && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Duplicate Alert
                            </span>
                          )}
                        </div>
                      </td>

                      {/* City & Area */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.location.city}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 pl-4 truncate max-w-[150px]">
                          {c.location.area}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-slate-800 font-medium truncate block max-w-[160px]">
                          {c.assignedDepartment || 'Unassigned'}
                        </span>
                        {c.assignedOfficer && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            Off: {c.assignedOfficer}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : c.status === 'Assigned'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenComplaintModal(c);
                          }}
                          className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
