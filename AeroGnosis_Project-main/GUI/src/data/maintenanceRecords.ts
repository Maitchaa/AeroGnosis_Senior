export type MaintenanceStatus = 'Pending' | 'Completed' | 'In Progress' | 'Cancelled';

export interface MaintenanceRecord {
  id: string;
  date: string;
  aircraft: string;
  engineer: string;
  maintenanceType: string;
  duration: number;
  partsUsed: string[];
  status: MaintenanceStatus;
  notes: string;
}

export const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'MH-2025-001',
    date: '2025-01-18',
    aircraft: 'Boeing 737-800 (N12345)',
    engineer: 'John Smith',
    maintenanceType: 'A-Check',
    duration: 6,
    partsUsed: ['Oil Filter', 'Hydraulic Fluid', 'Brake Pads'],
    status: 'Completed',
    notes: 'Routine maintenance completed successfully. All systems operational.'
  },
  {
    id: 'MH-2025-002',
    date: '2025-01-27',
    aircraft: 'Airbus A320 (N67890)',
    engineer: 'Sarah Johnson',
    maintenanceType: 'Engine Overhaul',
    duration: 48,
    partsUsed: ['Engine Bearings', 'Fuel Nozzles', 'Gasket Set', 'Spark Plugs'],
    status: 'Completed',
    notes: 'Complete engine overhaul performed. Engine performance improved by 15%.'
  },
  {
    id: 'MH-2025-003',
    date: '2025-02-11',
    aircraft: 'Boeing 777-300 (N24680)',
    engineer: 'Mike Davis',
    maintenanceType: 'Landing Gear Service',
    duration: 12,
    partsUsed: ['Landing Gear Seals', 'Hydraulic Lines', 'Bearings'],
    status: 'Completed',
    notes: 'Landing gear serviced and tested. All components within tolerance.'
  },
  {
    id: 'MH-2025-004',
    date: '2025-02-19',
    aircraft: 'Cessna 172 (N13579)',
    engineer: 'Emily Chen',
    maintenanceType: 'Avionics Update',
    duration: 4,
    partsUsed: ['Software Update Package'],
    status: 'Completed',
    notes: 'Avionics software updated to latest version. All systems tested and functional.'
  },
  {
    id: 'MH-2025-005',
    date: '2025-03-04',
    aircraft: 'Boeing 737-800 (N12345)',
    engineer: 'John Smith',
    maintenanceType: 'Wing Inspection',
    duration: 8,
    partsUsed: ['Structural Sealant', 'Rivets'],
    status: 'Completed',
    notes: 'Minor crack detected and repaired. Wing structure integrity confirmed.'
  },
  {
    id: 'MH-2025-006',
    date: '2025-03-21',
    aircraft: 'Airbus A320 (N67890)',
    engineer: 'Sarah Johnson',
    maintenanceType: 'C-Check',
    duration: 120,
    partsUsed: ['Multiple components', 'Filters', 'Fluids', 'Seals', 'Electrical components'],
    status: 'Completed',
    notes: 'Comprehensive C-Check completed. Aircraft certified for continued operation.'
  },
  {
    id: 'MH-2025-007',
    date: '2025-04-09',
    aircraft: 'Boeing 747-400 (N54321)',
    engineer: 'Carlos Ramirez',
    maintenanceType: 'Hydraulic System Flush',
    duration: 10,
    partsUsed: ['Hydraulic Fluid', 'Filters'],
    status: 'Completed',
    notes: 'Hydraulic system flushed and pressure tested. No leaks detected.'
  },
  {
    id: 'MH-2025-008',
    date: '2025-04-25',
    aircraft: 'Bombardier Q400 (N99887)',
    engineer: 'Priya Patel',
    maintenanceType: 'Propeller Balancing',
    duration: 7,
    partsUsed: ['Balancing Weights'],
    status: 'Completed',
    notes: 'Propellers balanced within tolerances. Cabin vibration reduced by 12%.'
  },
  {
    id: 'MH-2025-009',
    date: '2025-05-13',
    aircraft: 'Boeing 737-800 (N12345)',
    engineer: 'John Smith',
    maintenanceType: 'Fuel System Inspection',
    duration: 5,
    partsUsed: ['Fuel Filters', 'Seals'],
    status: 'Completed',
    notes: 'Fuel system cleaned and filters replaced. Performance metrics within spec.'
  },
  {
    id: 'MH-2025-010',
    date: '2025-05-21',
    aircraft: 'Airbus A321 (N88776)',
    engineer: 'Lena Muller',
    maintenanceType: 'Cabin Systems Update',
    duration: 9,
    partsUsed: ['Software Patch', 'Lighting Modules'],
    status: 'Completed',
    notes: 'Cabin systems calibrated and updated. Passenger satisfaction expected to improve.'
  },
  {
    id: 'MH-2025-011',
    date: '2025-06-07',
    aircraft: 'Boeing 767-300 (N33221)',
    engineer: 'Omar Hassan',
    maintenanceType: 'Engine Borescope Inspection',
    duration: 6,
    partsUsed: ['Inspection Kit'],
    status: 'Completed',
    notes: 'No abnormalities detected. Engine cleared for continued service.'
  },
  {
    id: 'MH-2025-012',
    date: '2025-06-29',
    aircraft: 'Embraer E195 (N55443)',
    engineer: 'Sophia Lee',
    maintenanceType: 'Airframe Corrosion Check',
    duration: 11,
    partsUsed: ['Anti-Corrosion Coating'],
    status: 'Completed',
    notes: 'Surface corrosion treated and sealed. Follow-up inspection scheduled in 6 months.'
  },
  {
    id: 'MH-2025-013',
    date: '2025-07-16',
    aircraft: 'Boeing 737-800 (N12345)',
    engineer: 'John Smith',
    maintenanceType: 'Auxiliary Power Unit Service',
    duration: 4,
    partsUsed: ['APU Filters', 'Sensor Kit'],
    status: 'Completed',
    notes: 'APU service completed. Start-up time reduced by 18%.'
  },
  {
    id: 'MH-2025-014',
    date: '2025-07-24',
    aircraft: 'Airbus A320 (N67890)',
    engineer: 'Sarah Johnson',
    maintenanceType: 'Landing Gear Alignment',
    duration: 8,
    partsUsed: ['Alignment Shims', 'Hydraulic Fluid'],
    status: 'Completed',
    notes: 'Landing gear alignment adjusted. Tire wear reduced by 10%.'
  },
  {
    id: 'MH-2025-015',
    date: '2025-08-05',
    aircraft: 'Boeing 787-9 (N77665)',
    engineer: 'Marcus Allen',
    maintenanceType: 'Composite Skin Repair',
    duration: 14,
    partsUsed: ['Composite Patch Kit', 'Curing Equipment'],
    status: 'Completed',
    notes: 'Composite damage repaired. Structural integrity restored.'
  },
  {
    id: 'MH-2025-016',
    date: '2025-08-28',
    aircraft: 'Boeing 757-200 (N44556)',
    engineer: 'Nina Kovacs',
    maintenanceType: 'Environmental Control System Service',
    duration: 10,
    partsUsed: ['Filters', 'Sensors'],
    status: 'Completed',
    notes: 'Environmental systems serviced. Cabin temperature stability improved.'
  },
  {
    id: 'MH-2025-017',
    date: '2025-09-09',
    aircraft: 'Airbus A330 (N22334)',
    engineer: 'Amir Khan',
    maintenanceType: 'Brake System Overhaul',
    duration: 16,
    partsUsed: ['Brake Pads', 'Hydraulic Lines', 'Sensors'],
    status: 'Completed',
    notes: 'Brake system overhauled. Deceleration distances reduced by 8%.'
  },
  {
    id: 'MH-2025-018',
    date: '2025-09-22',
    aircraft: 'Boeing 737 MAX (N66778)',
    engineer: 'Maria Rossi',
    maintenanceType: 'Flight Control Software Update',
    duration: 6,
    partsUsed: ['Software Update Package'],
    status: 'Completed',
    notes: 'Flight control software updated and validated. Performance monitoring enabled.'
  },
  {
    id: 'MH-2025-019',
    date: '2025-10-12',
    aircraft: 'Airbus A320 (N67890)',
    engineer: 'Sarah Johnson',
    maintenanceType: 'Cabin Deep Clean',
    duration: 5,
    partsUsed: ['Cleaning Agents', 'Protective Coatings'],
    status: 'Completed',
    notes: 'Cabin deep cleaned. Passenger feedback improved.'
  },
  {
    id: 'MH-2025-020',
    date: '2025-10-24',
    aircraft: 'Boeing 777-300 (N24680)',
    engineer: 'Mike Davis',
    maintenanceType: 'Landing Gear Service',
    duration: 12,
    partsUsed: ['Landing Gear Seals', 'Hydraulic Lines', 'Bearings'],
    status: 'Completed',
    notes: 'Landing gear serviced and tested. All components within tolerance.'
  },
  {
    id: 'MH-2025-021',
    date: '2025-11-03',
    aircraft: 'Cessna 172 (N13579)',
    engineer: 'Emily Chen',
    maintenanceType: 'Avionics Update',
    duration: 4,
    partsUsed: ['Software Update Package'],
    status: 'Completed',
    notes: 'Avionics software updated to latest version. All systems tested and functional.'
  },
  {
    id: 'MH-2025-022',
    date: '2025-11-18',
    aircraft: 'Boeing 737-800 (N12345)',
    engineer: 'John Smith',
    maintenanceType: 'Structural Inspection',
    duration: 7,
    partsUsed: ['Ultrasonic Scanner', 'Sealant'],
    status: 'Completed',
    notes: 'Structural inspection completed. No anomalies detected.'
  },
  {
    id: 'MH-2025-023',
    date: '2025-12-05',
    aircraft: 'Airbus A321 (N88776)',
    engineer: 'Lena Muller',
    maintenanceType: 'Engine Performance Tuning',
    duration: 9,
    partsUsed: ['Sensor Kit', 'Software Calibration Tools'],
    status: 'Completed',
    notes: 'Engine tuning improved fuel efficiency by 4%.'
  },
  {
    id: 'MH-2025-024',
    date: '2025-12-19',
    aircraft: 'Boeing 787-9 (N77665)',
    engineer: 'Marcus Allen',
    maintenanceType: 'Electrical Systems Audit',
    duration: 13,
    partsUsed: ['Diagnostic Equipment', 'Wiring Harness'],
    status: 'Completed',
    notes: 'Electrical system audit completed. Minor wiring wear corrected.'
  }
];
