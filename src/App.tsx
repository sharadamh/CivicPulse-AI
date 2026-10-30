/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * CivicPulse AI - Main Application Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ComplaintForm } from './components/ComplaintForm.tsx';
import { ComplaintTracker } from './components/ComplaintTracker.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ComplaintTable } from './components/ComplaintTable.tsx';
import { ComplaintMap } from './components/ComplaintMap.tsx';
import { ComplaintModal } from './components/ComplaintModal.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { Complaint, User } from './types/index.ts';
import { fetchComplaints, getStoredUser, resetDemoDataset, setStoredUser } from './services/api.ts';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = getStoredUser();
    if (stored) return stored;
    // Default to a demo citizen so the user has immediate access
    const defaultCitizen: User = {
      id: 'usr_citizen_1',
      name: 'Deepak Rao',
      email: 'citizen1@demo.com',
      role: 'citizen',
    };
    setStoredUser(defaultCitizen);
    return defaultCitizen;
  });

  const isAdmin = currentUser?.role === 'admin';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>(() => (isAdmin ? 'admin-dashboard' : 'submit'));
  const [selectedCity, setSelectedCity] = useState<string>('Haveri'); // Default to Haveri
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [modalComplaint, setModalComplaint] = useState<Complaint | null>(null);
  const [trackingId, setTrackingId] = useState<string>('');

  // Fetch complaints from backend
  const loadComplaints = useCallback(async () => {
    try {
      const data = await fetchComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Adjust default tab when role changes
  useEffect(() => {
    if (isAdmin && (activeTab === 'submit' || activeTab === 'track')) {
      setActiveTab('admin-dashboard');
    } else if (!isAdmin && (activeTab === 'admin-dashboard' || activeTab === 'all-complaints' || activeTab === 'analytics')) {
      setActiveTab('submit');
    }
  }, [isAdmin]);

  const handleOpenAuth = () => setIsAuthModalOpen(true);

  const handleLogout = () => {
    setStoredUser(null);
    setCurrentUser(null);
    setActiveTab('submit');
    window.location.reload();
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all complaints to 35+ Karnataka demo complaints?')) {
      setLoading(true);
      await resetDemoDataset();
      await loadComplaints();
      setLoading(false);
    }
  };

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    setComplaints(prev => [newComplaint, ...prev]);
    setTrackingId(newComplaint.id);
  };

  const handleComplaintUpdated = (updated: Complaint) => {
    setComplaints(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    setModalComplaint(updated);
  };

  const handleTrackComplaint = (id: string) => {
    setTrackingId(id);
    setActiveTab('track');
  };

  const handleOpenComplaintModal = (complaint: Complaint) => {
    setModalComplaint(complaint);
  };

  const handleOpenAnotherFromModal = (otherId: string) => {
    const found = complaints.find(c => c.id === otherId);
    if (found) {
      setModalComplaint(found);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onResetDemo={handleResetDemo}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold">Loading CivicPulse AI Database...</p>
          </div>
        ) : (
          <>
            {/* CITIZEN PORTAL TABS */}
            {!isAdmin && (
              <>
                {activeTab === 'submit' && (
                  <ComplaintForm
                    currentUser={currentUser}
                    onComplaintSubmitted={handleComplaintSubmitted}
                    onTrackComplaint={handleTrackComplaint}
                    onOpenAuth={handleOpenAuth}
                  />
                )}

                {activeTab === 'track' && (
                  <ComplaintTracker
                    initialComplaintId={trackingId}
                    currentUser={currentUser}
                    onSelectComplaint={handleOpenComplaintModal}
                  />
                )}

                {activeTab === 'map' && (
                  <div className="space-y-4">
                    <div className="text-center sm:text-left mb-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        Citizen City & Ward Grievance Map
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Search any city in India or explore active civic issues across Karnataka.
                      </p>
                    </div>
                    <ComplaintMap
                      complaints={complaints}
                      selectedCity={selectedCity}
                      onSelectCity={setSelectedCity}
                      onOpenComplaintModal={handleOpenComplaintModal}
                    />
                  </div>
                )}
              </>
            )}

            {/* MUNICIPAL ADMIN PORTAL TABS */}
            {isAdmin && (
              <>
                {activeTab === 'admin-dashboard' && (
                  <AdminDashboard
                    complaints={complaints}
                    currentUser={currentUser}
                    onViewComplaints={filter => {
                      setActiveTab('all-complaints');
                    }}
                    onOpenMap={() => setActiveTab('map')}
                    onOpenComplaintModal={handleOpenComplaintModal}
                  />
                )}

                {activeTab === 'all-complaints' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                          Municipal Grievance Directory
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          Triage, filter, assign departments, and track resolution timelines.
                        </p>
                      </div>
                    </div>
                    <ComplaintTable
                      complaints={complaints}
                      selectedCity={selectedCity}
                      onSelectCity={setSelectedCity}
                      onOpenComplaintModal={handleOpenComplaintModal}
                    />
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="space-y-4">
                    <div className="text-center sm:text-left mb-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        Municipal Geographic GIS & Hotspot Command
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Dynamic Indian city search with real GPS coordinates, hotspot detection, and priority markers.
                      </p>
                    </div>
                    <ComplaintMap
                      complaints={complaints}
                      selectedCity={selectedCity}
                      onSelectCity={setSelectedCity}
                      onOpenComplaintModal={handleOpenComplaintModal}
                    />
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsView
                    complaints={complaints}
                    selectedCity={selectedCity}
                    onSelectCity={setSelectedCity}
                    onOpenComplaintModal={handleOpenComplaintModal}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">CivicPulse AI</span>
            <span>•</span>
            <span>National Hackathon Project: "From Complaints to Action — AI for Civic Impact"</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Google Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Leaflet GIS</span>
            <span>•</span>
            <span>Karnataka Municipal Administration</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={user => {
          setCurrentUser(user);
          loadComplaints();
        }}
      />

      {/* Admin / Detail Complaint Modal */}
      {modalComplaint && (
        <ComplaintModal
          complaint={modalComplaint}
          currentUser={currentUser}
          onClose={() => setModalComplaint(null)}
          onComplaintUpdated={handleComplaintUpdated}
          onOpenAnotherComplaint={handleOpenAnotherFromModal}
        />
      )}
    </div>
  );
}
