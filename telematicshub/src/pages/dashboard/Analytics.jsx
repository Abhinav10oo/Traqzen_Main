import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useData } from '../../contexts/DataContext';
import './Analytics.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="ct-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{color: p.color}}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

const statusPie = [
  { name: 'Active',      value: 3, color: '#27ae60' },
  { name: 'Idle',        value: 1, color: '#2a8e9e' },
  { name: 'Maintenance', value: 1, color: '#f39c12' },
  { name: 'Offline',     value: 1, color: '#e74c3c' },
];

const alertTypes = [
  { type: 'Fuel Low',    count: 3 },
  { type: 'Insurance',   count: 3 },
  { type: 'Overheating', count: 2 },
  { type: 'Pollution',   count: 1 },
];

export default function Analytics() {
  const { fuelTrend, tripData, speedData, drivers } = useData();
  const driverScoreData = drivers.map(d => ({
    name: d.name.split(' ')[0],
    score: d.score,
    trips: d.trips,
  }));

  return (
    <div className="analytics-page animate-fade-in">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Performance metrics, driving behaviour and fleet intelligence</p>
      </div>

      {/* KPI row */}
      <div className="grid-4" style={{marginBottom:'24px'}}>
        {[
          { label: 'Total Distance (Month)', value: '4,380 km', change: '+12%', up: true, icon: '📍' },
          { label: 'Avg Driving Score',       value: '84.7 / 100', change: '+2.3 pts', up: true, icon: '⭐' },
          { label: 'Fuel Efficiency',         value: '14.2 km/L', change: '-0.8 km/L', up: false, icon: '⛽' },
          { label: 'Idle Time (Month)',        value: '38 hrs', change: '-5 hrs', up: true, icon: '⏱' },
        ].map((k, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{background:'rgba(42,142,158,0.12)',fontSize:'1.4rem',width:46,height:46,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:10}}>
              {k.icon}
            </div>
            <div className="stat-info">
              <h3 style={{fontSize:'1.2rem'}}>{k.value}</h3>
              <p>{k.label}</p>
              <div className={`stat-change ${k.up ? 'up' : 'down'}`}>
                {k.up ? '↑' : '↓'} {k.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="analytics-grid-2" style={{marginBottom:'20px'}}>
        {/* Speed profile */}
        <div className="card">
          <div className="section-title">Speed Profile — V001 Today</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={speedData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="spd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a8e9e" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#2a8e9e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,142,158,0.1)" />
              <XAxis dataKey="time" stroke="#94aab0" tick={{fontSize:11}} />
              <YAxis stroke="#94aab0" tick={{fontSize:11}} unit=" km/h" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="speed" name="Speed" stroke="#2a8e9e" fill="url(#spd)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trip bar chart */}
        <div className="card">
          <div className="section-title">Monthly Trips & Distance</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tripData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,142,158,0.1)" />
              <XAxis dataKey="month" stroke="#94aab0" tick={{fontSize:11}} />
              <YAxis yAxisId="left" stroke="#94aab0" tick={{fontSize:11}} />
              <YAxis yAxisId="right" orientation="right" stroke="#94aab0" tick={{fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{fontSize:'0.8rem', color:'#94aab0'}} />
              <Bar yAxisId="left" dataKey="trips" name="Trips" fill="#2a8e9e" radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="km" name="km" fill="#3ab5c8" radius={[4,4,0,0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="analytics-grid-3" style={{marginBottom:'20px'}}>
        {/* Fleet status pie */}
        <div className="card">
          <div className="section-title">Fleet Status Distribution</div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusPie.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center'}}>
              {statusPie.map((s, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'0.78rem',color:'var(--mid-gray)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:s.color}} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Driver scores */}
        <div className="card" style={{gridColumn:'span 2'}}>
          <div className="section-title">Driver Performance Scores</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={driverScoreData} layout="vertical" margin={{top:0,right:10,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,142,158,0.1)" horizontal={false} />
              <XAxis type="number" domain={[0,100]} stroke="#94aab0" tick={{fontSize:11}} />
              <YAxis type="category" dataKey="name" stroke="#94aab0" tick={{fontSize:11}} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Score" radius={[0,4,4,0]}
                fill="#2a8e9e"
                label={{position:'insideRight', fill:'white', fontSize:11, fontWeight:600}}
              >
                {driverScoreData.map((d, i) => (
                  <Cell key={i} fill={d.score >= 90 ? '#27ae60' : d.score >= 80 ? '#2a8e9e' : d.score >= 70 ? '#f39c12' : '#e74c3c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert frequency */}
      <div className="card">
        <div className="section-title">Alert Frequency by Type</div>
        <div className="alert-freq-grid">
          {alertTypes.map((a, i) => (
            <div key={i} className="alert-freq-item">
              <div className="af-label">{a.type}</div>
              <div className="af-bar-wrap">
                <div className="af-bar" style={{width: `${(a.count/3)*100}%`}} />
              </div>
              <div className="af-count">{a.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
