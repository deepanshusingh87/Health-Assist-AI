import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Hospital as HospitalIcon,
  X,
  Compass
} from 'lucide-react';
import { getNearbyHospitals } from '../services/api';

export default function Hospitals() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Geolocation States:
  // 'idle' | 'requesting_permission' | 'loading_location' | 'permission_denied' | 'location_unavailable' | 'success'
  const [geoState, setGeoState] = useState('idle');
  const [userCoords, setUserCoords] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

  /**
   * Location Privacy Rule:
   * Location is ONLY requested after explicit user click on "Use My Current Location".
   * Never requested on load.
   */
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('location_unavailable');
      setErrorMessage('Geolocation is not supported by your current browser.');
      return;
    }

    setGeoState('requesting_permission');

    // Slight transition to loading_location to clearly visualize the permission phase
    setTimeout(() => {
      setGeoState('loading_location');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserCoords({ latitude: lat, longitude: lng });

          try {
            // Future Flask endpoint: GET /api/hospitals?lat=...&lng=...
            const res = await getNearbyHospitals(lat, lng);
            setHospitals(res.hospitals || []);
            setGeoState('success');
          } catch {
            setGeoState('location_unavailable');
            setErrorMessage('Unable to fetch nearby hospital directory.');
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGeoState('permission_denied');
            setErrorMessage(
              'Location permission was denied. Please allow location access in your browser settings to view facilities nearest to you.'
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGeoState('location_unavailable');
            setErrorMessage(
              'Location information is currently unavailable. Please check your device GPS or internet connection.'
            );
          } else if (error.code === error.TIMEOUT) {
            setGeoState('location_unavailable');
            setErrorMessage('The location request timed out. Please try again.');
          } else {
            setGeoState('location_unavailable');
            setErrorMessage('An unexpected error occurred while obtaining your location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    }, 400);
  };

  const handleDirections = (hospital) => {
    const query = encodeURIComponent(`${hospital.name}, ${hospital.address}`);
    let url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    if (userCoords) {
      url += `&origin=${userCoords.latitude},${userCoords.longitude}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Title & Subtitle */}
            <div className="border-b border-slate-200 pb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <HospitalIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Nearby Healthcare Facilities
                  </h1>
                  <p className="text-sm text-slate-500">
                    Find hospitals and healthcare facilities near your current location.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 10: LOCATION PRIVACY NOTICE */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-teal-900 text-xs sm:text-sm flex items-start space-x-3">
              <Shield className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-teal-950">Location Privacy Assured</p>
                <p className="text-teal-800 mt-0.5 leading-relaxed">
                  Your location is used only to find nearby healthcare facilities. Location access requires your permission.
                </p>
              </div>
            </div>

            {/* ACTION CARD: Location Trigger & State Cards */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs text-center">
              {geoState === 'idle' && (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Discover Medical Centers in Your Vicinity
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Click below to request GPS location through your browser and load certified local emergency departments and healthcare centers.
                    </p>
                  </div>

                  <button
                    id="use-current-location-btn"
                    type="button"
                    onClick={handleRequestLocation}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Use My Current Location</span>
                  </button>
                </div>
              )}

              {geoState === 'requesting_permission' && (
                <div className="py-4 space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto text-teal-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-800">
                    Location permission requested...
                  </p>
                  <p className="text-xs text-slate-500">
                    Please click "Allow" in your browser prompt to proceed.
                  </p>
                </div>
              )}

              {geoState === 'loading_location' && (
                <div className="py-4 space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto text-teal-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-800">
                    Loading location and finding nearby medical centres...
                  </p>
                  <p className="text-xs text-slate-500">
                    Acquiring coordinates via GPS...
                  </p>
                </div>
              )}

              {geoState === 'permission_denied' && (
                <div className="py-3 max-w-md mx-auto space-y-3 text-red-800">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-red-900">
                    Permission Denied
                  </h4>
                  <p className="text-xs sm:text-sm text-red-700">
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Retry Location Request</span>
                  </button>
                </div>
              )}

              {geoState === 'location_unavailable' && (
                <div className="py-3 max-w-md mx-auto space-y-3 text-amber-800">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-amber-900">
                    Location Unavailable
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-700">
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}

              {geoState === 'success' && userCoords && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                        Location Successfully Obtained
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        Latitude: {userCoords.latitude.toFixed(4)}, Longitude: {userCoords.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    className="text-xs text-teal-700 hover:text-teal-900 font-medium underline flex items-center space-x-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Refresh Location</span>
                  </button>
                </div>
              )}
            </div>

            {/* RESULTS: Nearby Hospital Cards */}
            {geoState === 'success' && hospitals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Showing {hospitals.length} Healthcare Facilities Nearby
                  </h2>
                  <span className="text-xs text-slate-500">Sorted by distance</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hospitals.map((hospital) => (
                    <div
                      key={hospital.id}
                      id={`hospital-card-${hospital.id}`}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Badges row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {hospital.facilityType}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              hospital.isOpen
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {hospital.status}
                          </span>
                        </div>

                        {/* Name & Distance */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {hospital.name}
                          </h3>
                        </div>

                        <p className="text-xs font-semibold text-teal-700 mb-2 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{hospital.distanceKm} km away</span>
                        </p>

                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                          {hospital.address}
                        </p>

                        {hospital.emergencyAvailable && (
                          <div className="mb-4 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 text-red-700 text-[11px] font-semibold border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping mr-0.5" />
                            <span>24/7 Emergency & Trauma Active</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          id={`view-details-btn-${hospital.id}`}
                          type="button"
                          onClick={() => setSelectedHospital(hospital)}
                          className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        <button
                          id={`directions-btn-${hospital.id}`}
                          type="button"
                          onClick={() => handleDirections(hospital)}
                          className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hospital Details Modal */}
            {selectedHospital && (
              <div
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
                onClick={() => setSelectedHospital(null)}
              >
                <div
                  className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedHospital(null)}
                    className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    aria-label="Close details"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
                    <HospitalIcon className="w-4 h-4" />
                    <span>{selectedHospital.facilityType}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {selectedHospital.name}
                  </h3>

                  <p className="text-xs text-slate-500 mb-4">
                    {selectedHospital.address}
                  </p>

                  <div className="space-y-3 text-xs sm:text-sm text-slate-700 border-t border-b border-slate-100 py-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Operating Hours</span>
                      </span>
                      <span className="font-semibold text-slate-900">{selectedHospital.status}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Phone / Helpline</span>
                      </span>
                      <a
                        href={`tel:${selectedHospital.phone}`}
                        className="font-semibold text-teal-700 hover:underline"
                      >
                        {selectedHospital.phone}
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Distance</span>
                      <span className="font-semibold text-slate-900">{selectedHospital.distanceKm} km away</span>
                    </div>
                  </div>

                  {selectedHospital.specialties && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                        Key Departments & Specialties
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedHospital.specialties.map((spec, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDirections(selectedHospital)}
                      className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get GPS Directions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedHospital(null)}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
