import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Pie, Bar, Scatter } from "react-chartjs-2";
import { useMemo } from "react";
import { chartData } from "../../data/mockData.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const baseAxes = {
  ticks: { color: "#a7a9a9" },
  grid: { color: "rgba(167, 169, 169, 0.2)" },
};

export default function DashboardCharts() {
  const lineOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#f5f5f5" } } },
    scales: { x: baseAxes, y: baseAxes },
  }), []);

  const pieOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#f5f5f5" } } },
  }), []);

  const barOpts = lineOpts;
  const scatterOpts = useMemo(() => ({
    ...lineOpts,
    plugins: { legend: { labels: { color: "#f5f5f5" } } },
    scales: {
      x: { ...baseAxes, title: { display: true, text: "Speed (mph)", color: "#f5f5f5" } },
      y: { ...baseAxes, title: { display: true, text: "Fuel Efficiency (mpg)", color: "#f5f5f5" } },
    }
  }), [lineOpts]);

  return (
    <div className="charts-grid">
      <div className="chart-container">
        <div className="chart-header"><h3 className="chart-title">Vehicle Mileage Trends</h3></div>
        <div className="chart-wrapper" style={{ position: "relative", height: 300 }}>
          <Line data={chartData.mileageTrends} options={lineOpts} />
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header"><h3 className="chart-title">Fleet Status Distribution</h3></div>
        <div className="chart-wrapper" style={{ position: "relative", height: 300 }}>
          <Pie data={chartData.fleetStatus} options={pieOpts} />
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header"><h3 className="chart-title">Fuel Consumption by Type</h3></div>
        <div className="chart-wrapper" style={{ position: "relative", height: 300 }}>
          <Bar data={chartData.fuelConsumption} options={barOpts} />
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header"><h3 className="chart-title">Speed vs Fuel Efficiency</h3></div>
        <div className="chart-wrapper" style={{ position: "relative", height: 300 }}>
          <Scatter data={chartData.speedEfficiency} options={scatterOpts} />
        </div>
      </div>
    </div>
  );
}
