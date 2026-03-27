// ===== FAKE DATA FOR DEMO/SHOWCASE =====

export const vehicles = [
  { id: 'mritunjay', reg: 'Hyundai Venue', model: 'Hyundai Venue', year: 2024, type: 'SUV', driver: 'Mritunjay', status: 'idle', fuel: 0, temp: 0, lat: 0, lng: 0, speed: 0, rpm: 0, engine_load: 0, throttle: 0, intake_air: 0, battery: 0, insurance: '2026-12-31', pollution: '2026-12-31', lastService: '2025-01-01', odometer: 0 },
];

export const alerts = [
  { id: 'A002', vehicleId: 'V002', vehicleReg: 'DL 5S CD 5678', type: 'Insurance Expiry', severity: 'warning', message: 'Insurance expires in 27 days (20 Mar 2025)', time: '1 hour ago', resolved: false },
  { id: 'A003', vehicleId: 'V004', vehicleReg: 'GJ 01 GH 3456', type: 'Engine Overheating', severity: 'danger', message: 'Engine temperature at 95°C — Exceeds normal range', time: '25 min ago', resolved: false },
  { id: 'A004', vehicleId: 'V006', vehicleReg: 'RJ 14 KL 2345', type: 'Insurance Expired', severity: 'danger', message: 'Insurance expired on 22 Jul 2024', time: '2 days ago', resolved: false },
  { id: 'A005', vehicleId: 'V002', vehicleReg: 'DL 5S CD 5678', type: 'Low Fuel', severity: 'warning', message: 'Fuel level at 35% — Consider refueling', time: '3 hours ago', resolved: false },
  { id: 'A006', vehicleId: 'V001', vehicleReg: 'MH 12 AB 1234', type: 'Pollution Expiry', severity: 'info', message: 'Pollution certificate expires in 45 days', time: '5 hours ago', resolved: true },
];

export const drivers = [
  { id: 'D001', name: 'Arjun Sharma', phone: '+91 98765 43210', email: 'arjun@fleet.com', license: 'MH0120200012345', licenseExpiry: '2027-05-10', assignedVehicle: 'V001', trips: 142, score: 87, status: 'active' },
  { id: 'D002', name: 'Priya Nair',   phone: '+91 87654 32109', email: 'priya@fleet.com',  license: 'KL0120190054321', licenseExpiry: '2026-08-22', assignedVehicle: 'V002', trips: 98, score: 92, status: 'active' },
  { id: 'D003', name: 'Ravi Kumar',   phone: '+91 76543 21098', email: 'ravi@fleet.com',   license: 'KA0120180076543', licenseExpiry: '2025-12-15', assignedVehicle: 'V003', trips: 211, score: 78, status: 'active' },
  { id: 'D004', name: 'Sneha Patel',  phone: '+91 65432 10987', email: 'sneha@fleet.com',  license: 'GJ0120210098765', licenseExpiry: '2028-03-08', assignedVehicle: 'V004', trips: 67,  score: 95, status: 'on-leave' },
  { id: 'D005', name: 'Kiran Reddy', phone: '+91 54321 09876', email: 'kiran@fleet.com',  license: 'AP0120170034567', licenseExpiry: '2025-11-20', assignedVehicle: 'V005', trips: 324, score: 82, status: 'active' },
  { id: 'D006', name: 'Mohammed Ali',phone: '+91 43210 98765', email: 'ali@fleet.com',    license: 'RJ0120160056789', licenseExpiry: '2026-02-14', assignedVehicle: 'V006', trips: 189, score: 74, status: 'inactive' },
];

export const fuelTrend = [
  { day: 'Mon', v1: 80, v2: 45, v3: 95, v4: 30, v5: 68 },
  { day: 'Tue', v1: 75, v2: 60, v3: 88, v4: 25, v5: 72 },
  { day: 'Wed', v1: 82, v2: 55, v3: 90, v4: 22, v5: 65 },
  { day: 'Thu', v1: 70, v2: 50, v3: 85, v4: 20, v5: 58 },
  { day: 'Fri', v1: 72, v2: 35, v3: 88, v4: 20, v5: 55 },
  { day: 'Sat', v1: 68, v2: 38, v3: 86, v4: 20, v5: 52 },
  { day: 'Sun', v1: 72, v2: 35, v3: 88, v4: 20, v5: 55 },
];

export const tripData = [
  { month: 'Aug', trips: 42, km: 2840 },
  { month: 'Sep', trips: 55, km: 3610 },
  { month: 'Oct', trips: 48, km: 3120 },
  { month: 'Nov', trips: 61, km: 4020 },
  { month: 'Dec', trips: 38, km: 2550 },
  { month: 'Jan', trips: 67, km: 4380 },
  { month: 'Feb', trips: 29, km: 1870 },
];

export const maintenance = [
  { id: 'M001', vehicleId: 'V001', vehicle: 'MH 12 AB 1234', type: 'Oil Change', status: 'upcoming', dueDate: '2025-02-28', cost: 1800, notes: 'Synthetic oil change due at 30000 km' },
  { id: 'M002', vehicleId: 'V004', vehicle: 'GJ 01 GH 3456', type: 'Tire Replacement', status: 'overdue', dueDate: '2025-01-15', cost: 12000, notes: 'Front tires worn out, immediate replacement needed' },
  { id: 'M003', vehicleId: 'V006', vehicle: 'RJ 14 KL 2345', type: 'Full Service', status: 'overdue', dueDate: '2024-12-01', cost: 8500, notes: 'Comprehensive 130000 km service' },
  { id: 'M004', vehicleId: 'V002', vehicle: 'DL 5S CD 5678', type: 'Brake Inspection', status: 'upcoming', dueDate: '2025-03-10', cost: 2200, notes: 'Routine brake pad check' },
  { id: 'M005', vehicleId: 'V003', vehicle: 'KA 09 EF 9012', type: 'AC Service',   status: 'completed', dueDate: '2025-01-20', cost: 3500, notes: 'AC gas refilled and filter cleaned' },
  { id: 'M006', vehicleId: 'V005', vehicle: 'TN 22 IJ 7890', type: 'Battery Check', status: 'completed', dueDate: '2025-01-05', cost: 500, notes: 'Battery health check — OK' },
];

export const documents = [
  { id: 'DOC001', vehicleId: 'V001', vehicle: 'MH 12 AB 1234', type: 'Insurance', issuer: 'HDFC Ergo', issueDate: '2024-08-15', expiryDate: '2025-08-15', status: 'valid', file: 'insurance_v001.pdf' },
  { id: 'DOC002', vehicleId: 'V001', vehicle: 'MH 12 AB 1234', type: 'Pollution Certificate', issuer: 'RTO Maharashtra', issueDate: '2024-06-30', expiryDate: '2024-12-30', status: 'expired', file: 'pollution_v001.pdf' },
  { id: 'DOC003', vehicleId: 'V002', vehicle: 'DL 5S CD 5678', type: 'Insurance', issuer: 'New India Assurance', issueDate: '2024-03-20', expiryDate: '2025-03-20', status: 'expiring-soon', file: 'insurance_v002.pdf' },
  { id: 'DOC004', vehicleId: 'V003', vehicle: 'KA 09 EF 9012', type: 'Insurance', issuer: 'Bajaj Allianz', issueDate: '2025-01-10', expiryDate: '2026-01-10', status: 'valid', file: 'insurance_v003.pdf' },
  { id: 'DOC005', vehicleId: 'V004', vehicle: 'GJ 01 GH 3456', type: 'Insurance', issuer: 'Oriental Insurance', issueDate: '2023-11-05', expiryDate: '2024-11-05', status: 'expired', file: 'insurance_v004.pdf' },
  { id: 'DOC006', vehicleId: 'V006', vehicle: 'RJ 14 KL 2345', type: 'Fitness Certificate', issuer: 'RTO Rajasthan', issueDate: '2022-07-22', expiryDate: '2024-07-22', status: 'expired', file: 'fitness_v006.pdf' },
];

export const recentTrips = [
  { id: 'T001', vehicle: 'MH 12 AB 1234', driver: 'Arjun Sharma', from: 'Mumbai Central', to: 'Pune Station', distance: '149 km', duration: '2h 45m', date: '2025-02-20', avgSpeed: '54 km/h', fuelUsed: '9.2L' },
  { id: 'T002', vehicle: 'KA 09 EF 9012', driver: 'Ravi Kumar',   from: 'Bengaluru Airport', to: 'Electronic City', distance: '52 km', duration: '1h 10m', date: '2025-02-20', avgSpeed: '44 km/h', fuelUsed: '3.8L' },
  { id: 'T003', vehicle: 'TN 22 IJ 7890', driver: 'Kiran Reddy',  from: 'Chennai Central', to: 'Tambaram', distance: '28 km', duration: '50m', date: '2025-02-19', avgSpeed: '33 km/h', fuelUsed: '2.2L' },
  { id: 'T004', vehicle: 'DL 5S CD 5678', driver: 'Priya Nair',   from: 'Connaught Place', to: 'Gurgaon Cyber City', distance: '33 km', duration: '55m', date: '2025-02-19', avgSpeed: '36 km/h', fuelUsed: '2.8L' },
  { id: 'T005', vehicle: 'MH 12 AB 1234', driver: 'Arjun Sharma', from: 'Andheri West', to: 'BKC', distance: '12 km', duration: '35m', date: '2025-02-18', avgSpeed: '20 km/h', fuelUsed: '1.1L' },
];

export const speedData = [
  { time: '06:00', speed: 0  }, { time: '07:00', speed: 28 }, { time: '08:00', speed: 42 },
  { time: '09:00', speed: 55 }, { time: '10:00', speed: 48 }, { time: '11:00', speed: 60 },
  { time: '12:00', speed: 35 }, { time: '13:00', speed: 22 }, { time: '14:00', speed: 58 },
  { time: '15:00', speed: 65 }, { time: '16:00', speed: 52 }, { time: '17:00', speed: 38 },
  { time: '18:00', speed: 20 }, { time: '19:00', speed: 0  },
];
