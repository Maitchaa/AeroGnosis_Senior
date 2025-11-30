interface DroneStatusProps {
  onClose: () => void;
}

export function DroneStatus({ onClose }: DroneStatusProps) {
  return (
    <div className="fixed right-0 top-0 h-full w-[350px] bg-[#1e2837] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#2d3748]">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-xl">Drone Status</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Drone Info */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Model Info */}
          <div className="bg-[#2d3748] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <div>
                <p className="text-[#94a3b8] text-xs">Model</p>
                <p className="text-white">DJI Mavric Pro</p>
              </div>
            </div>

            {/* Live Feed */}
            <button
              type="button"
              onClick={() => window.alert('Connect app to drone to view this feature.')}
              className="flex items-center gap-3 px-4 py-3 bg-[#1e2837] rounded-lg w-full hover:bg-[#374151] transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-[#60a5fa]">Open Live Feed</span>
            </button>
          </div>

          {/* Battery Status */}
          <div className="bg-[#2d3748] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span className="text-white">Battery</span>
              </div>
              <span className="text-[#22d3ee]">70%</span>
            </div>
            
            <div className="relative w-full h-2 bg-[#1e2837] rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-[#22d3ee] rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-[#2d3748] rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8] text-sm">Connection</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-white text-sm">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8] text-sm">Signal Strength</span>
                <span className="text-white text-sm">Excellent</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8] text-sm">GPS</span>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-white text-sm">Locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Stats */}
          <div className="bg-[#2d3748] rounded-lg p-4">
            <h4 className="text-white mb-3">Flight Statistics</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Flight Time Today:</span>
                <span className="text-white">2h 15m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Distance Covered:</span>
                <span className="text-white">34.5 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Images Captured:</span>
                <span className="text-white">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Current Altitude:</span>
                <span className="text-white">0 m (Landed)</span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="bg-[#2d3748] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#1e2837" strokeWidth="6" fill="none" />
                  <circle cx="32" cy="32" r="28" stroke="#22d3ee" strokeWidth="6" fill="none" strokeDasharray="176" strokeDashoffset="53" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm">70%</span>
                </div>
              </div>
              <div>
                <p className="text-white">System Health</p>
                <p className="text-[#94a3b8] text-sm">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
