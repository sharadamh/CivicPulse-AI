/**
 * CivicPulse AI - Application Header & Navigation
 * Provides responsive navigation, jurisdiction banner, one-click role switching for demo evaluation,
 * and quick demo dataset reset.
 */

import React from 'react';
import {
  ShieldAlert,
  Building2,
  UserCheck,
  MapPin,
  FileText,
  BarChart3,
  Search,
  PlusCircle,
  RotateCcw,
  LogOut,
  Sparkles,
  User,
  ListOrdered,
} from 'lucide-react';
import { User as UserType } from '../types/index.ts';

interface HeaderProps {
  currentUser: UserType | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onResetDemo: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onResetDemo,
  selectedCity,
  onSelectCity,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner - Municipal Jurisdiction & Identity */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
            GOVERNMENT OF KARNATAKA
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 font-medium text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            {isAdmin
              ? currentUser?.municipality === 'ALL'
                ? 'All Municipal Jurisdictions (State Command Center)'
                : `${currentUser?.municipality} Operations Portal`
              : 'Citizen Civic Problem & Grievance Portal'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <button
            onClick={onResetDemo}
            title="Reset to 30+ Karnataka demo complaints"
            className="flex items-center gap-1 hover:text-amber-400 transition-colors text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
          <span className="text-slate-600">|</span>
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                {currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : 'Citizen'})
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  CivicPulse <span className="text-blue-400">AI</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                From Complaints to Action — AI for Civic Impact
              </p>
            </div>
          </div>

          {/* Navigation Tabs based on Role */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('admin-dashboard')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'admin-dashboard'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('all-complaints')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'all-complaints'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Complaints</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'map'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Map & Hotspots</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Municipal</span> Insights
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('submit')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'submit'
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Report Issue</span>
                </button>
                <button
                  onClick={() => setActiveTab('my-complaints')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'my-complaints'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <ListOrdered className="w-4 h-4 text-blue-400" />
                  <span>My Grievances</span>
                </button>
                <button
                  onClick={() => setActiveTab('track')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'track'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Track Status</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    activeTab === 'map'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>City Map</span>
                </button>
              </>
            )}

            {/* Quick One-Click Role Switcher for Hackathon Judges & Testers */}
            <div className="ml-2 pl-2 border-l border-slate-800">
              {isAdmin ? (
                <button
                  onClick={() => {
                    const citizenUser: UserType = {
                      id: 'usr_citizen_1',
                      name: 'Deepak Rao',
                      email: 'citizen1@demo.com',
                      role: 'citizen',
                    };
                    localStorage.setItem('civicpulse_current_user', JSON.stringify(citizenUser));
                    window.location.reload();
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shadow-2xs"
                  title="Switch to Citizen Portal view"
                >
                  Switch to Citizen View
                </button>
              ) : (
                <button
                  onClick={() => {
                    const adminUser: UserType = {
                      id: 'usr_admin_all',
                      name: 'Municipal Admin',
                      email: 'admin',
                      role: 'admin',
                      municipality: 'ALL',
                      department: 'General Municipal Administration',
                    };
                    localStorage.setItem('civicpulse_current_user', JSON.stringify(adminUser));
                    window.location.reload();
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 border border-blue-700/60 transition-colors shadow-2xs"
                  title="Switch to Municipal Admin Portal"
                >
                  Municipal Admin Login
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
