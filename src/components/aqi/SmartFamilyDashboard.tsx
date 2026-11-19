import React, { useState, useEffect } from 'react';
import { ShieldCheck, CalendarCheck, Home, Leaf, AlertTriangle, Building2 } from 'lucide-react';
import { SupportedLanguage } from '@/domain/types';

interface SmartDashboardProps {
  reading: any;
  weather?: any;
  location: any;
  language?: SupportedLanguage;
}

export const SmartFamilyDashboard: React.FC<SmartDashboardProps> = ({ reading, location }) => {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'action' | 'routine' | 'indoor' | 'transport' | 'cities' | 'alerts'>('action');
  const [routineTasks, setRoutineTasks] = useState<any[]>([]);
  const [citiesData, setCitiesData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [transportDist, setTransportDist] = useState(12);
  const [transportMode, setTransportMode] = useState('metro');
  const [savedCo2, setSavedCo2] = useState<number | null>(null);

  useEffect(() => {
    // Fetch profile
    fetch('/api/profile?userId=guest_user')
      .then((r) => r.json())
      .then((d) => d.data?.profile && setProfile(d.data.profile))
      .catch((e) => console.warn(e));

    // Fetch routine
    if (reading) {
      fetch(`/api/routines?userId=guest_user&city=${encodeURIComponent(location.name)}&aqi=${reading.usAqi}`)
        .then((r) => r.json())
        .then((d) => d.data?.routine?.tasks && setRoutineTasks(d.data.routine.tasks))
        .catch((e) => console.warn(e));
    }

    // Fetch alerts
    fetch('/api/alerts?userId=guest_user')
      .then((r) => r.json())
      .then((d) => d.data?.alerts && setAlerts(d.data.alerts))
      .catch((e) => console.warn(e));
  }, [location, reading]);

  const loadCityComparison = () => {
    fetch('/api/cities/compare')
      .then((r) => r.json())
      .then((d) => d.data?.cities && setCitiesData(d.data.cities))
      .catch((e) => console.warn(e));
  };

  const toggleTask = (taskId: string, completed: boolean) => {
    setRoutineTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t)));
    fetch('/api/routines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routineId: 'temp', taskId, completed: !completed })
    }).catch((e) => console.warn(e));
  };

  const calculateSavings = () => {
    const factor = transportMode === 'metro' ? 0.029 : transportMode === 'bus' ? 0.082 : 0.096;
    const base = transportDist * 0.192;
    const alt = transportDist * factor;
    const diff = Number((base - alt).toFixed(2));
    setSavedCo2(diff);

    fetch('/api/impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'guest_user',
        distanceKm: transportDist,
        baselineMode: 'car_solo',
        alternativeMode: transportMode,
        daysPerWeek: 5
      })
    }).catch((e) => console.warn(e));
  };

  const aqi = reading?.usAqi ?? 160;
  const isSevere = aqi > 200;
  const isUnhealthy = aqi > 100;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl" aria-label="Smart Family Protection Dashboard">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MongoDB-Powered Intelligence Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Your Family&apos;s Air Quality Action Today</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tailored for {profile?.name || 'Your Household'} • {location.name} (AQI {aqi})
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { id: 'action', label: 'Action Directives', icon: ShieldCheck },
            { id: 'routine', label: 'Daily Routine', icon: CalendarCheck },
            { id: 'indoor', label: 'Indoor Hacks', icon: Home },
            { id: 'transport', label: 'Eco Mobility', icon: Leaf },
            { id: 'cities', label: 'City Radar', icon: Building2 },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'cities' && citiesData.length === 0) {
                    loadCityComparison();
                  }
                }}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Personalized Action Directives */}
      {activeTab === 'action' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Outdoor Safety</span>
            <h3 className="text-sm font-bold text-white">
              {isSevere ? 'Avoid Strenuous Outdoor Exertion' : isUnhealthy ? 'Limit Outdoor Recess to <25 mins' : 'Outdoor Exercise Permitted'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {profile?.childrenPresent
                ? 'Children inhale 50% more air per kg of body weight; shift playground sports to indoor halls.'
                : 'Deep mouth breathing during jogging bypasses upper nasal cilia filtration.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Indoor Sanctuary</span>
            <h3 className="text-sm font-bold text-white">Wet Mopping & Kitchen Exhaust</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dry broom sweeping re-suspends settled PM2.5 into the breathing zone. Use a damp microfiber cloth and run range hoods on back burners.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Mobility Directive</span>
            <h3 className="text-sm font-bold text-white">Cabin Recirculation & Metro Transit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When commuting by car, switch HVAC to internal recirculation mode. Transition 2 days per week to electric metro transit.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Smart Daily Routine Planner */}
      {activeTab === 'routine' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Synchronized with diurnal ground-inversion curves</span>
            <span>{routineTasks.filter((t) => t.completed).length} of {routineTasks.length} Completed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {routineTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id, task.completed)}
                className={`p-4 rounded-xl border cursor-pointer flex items-start justify-between gap-3 transition-colors ${
                  task.completed ? 'bg-emerald-950/40 border-emerald-800/80' : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    {task.phase}
                  </span>
                  <h4 className={`text-xs font-bold ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-400">{task.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${task.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'}`}>
                  {task.completed && '✓'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Indoor Air Quality Hacks (3 Tiers: Free, <₹500, Premium) */}
      {activeTab === 'indoor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300">FREE ($0)</span>
            <h3 className="text-sm font-bold text-white">Damp Microfiber Mopping</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Mop floors with slightly damp cloths once daily</li>
              <li>Eliminates dry broom particulate resuspension</li>
              <li>Run kitchen exhaust 2 mins prior to gas cooking</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-teal-900/60 text-teal-300">UNDER ₹500</span>
            <h3 className="text-sm font-bold text-white">Draft Sealing & DIY Pre-filters</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Adhesive door draft sweeps on outer entryways</li>
              <li>Silicone window frame weatherstripping tapes</li>
              <li>Washable nylon mesh pre-filter covers</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-sky-900/60 text-sky-300">PREMIUM HEPA</span>
            <h3 className="text-sm font-bold text-white">Mechanical True-HEPA CADR</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>99.97% physical particle capture down to 0.3µm</li>
              <li>Zero ozone generation risk (Avoid ionizers)</li>
              <li>Match Clean Air Delivery Rate to bedroom size</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: Sustainable Transport Alternatives */}
      {activeTab === 'transport' && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Quantified Transport Decarbonization Calculator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">One-Way Commute (km)</label>
              <input
                type="number"
                value={transportDist}
                onChange={(e) => setTransportDist(Number(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Proposed Alternative</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="metro">Electric Metro (0.029 kg CO2e/km)</option>
                <option value="bus">Municipal Bus (0.082 kg CO2e/km)</option>
                <option value="carpool">Carpool (0.096 kg CO2e/km)</option>
                <option value="bicycle">Bicycle (0.000 kg CO2e/km)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={calculateSavings}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
              >
                Calculate & Save to MongoDB
              </button>
            </div>
          </div>
          {savedCo2 !== null && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>Trip Avoidance: <strong>{savedCo2} kg CO2e</strong></span>
              <span>Monthly Projected Savings: <strong>{(savedCo2 * 5 * 4.33).toFixed(1)} kg CO2e</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Multi-City Indian Radar */}
      {activeTab === 'cities' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {citiesData.map((c, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <span className="font-bold text-white block">{c.city}</span>
                <span className="text-slate-400 block text-[11px]">PM2.5: {c.pm25} µg/m³</span>
                <span className="font-bold text-emerald-400 mt-1 block">AQI {c.usAqi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-2 text-xs">
          {alerts.length > 0 ? (
            alerts.map((a, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-bold block">{a.city} • AQI {a.currentAqi}</span>
                  <p className="text-amber-300/80">{a.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 py-3 text-center">No active high-smog alerts triggered for your threshold.</p>
          )}
        </div>
      )}
    </section>
  );
};
