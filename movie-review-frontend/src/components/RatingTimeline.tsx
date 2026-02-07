import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

export type RatingPoint = {
  label: string;
  average: number;
};

interface RatingTimelineProps {
  points: RatingPoint[];
}

const RatingTimeline: React.FC<RatingTimelineProps> = ({ points }) => {
  const labels = points.map(point => point.label);
  const dataValues = points.map(point => point.average);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Average Rating",
          data: dataValues,
          borderColor: "rgba(239, 68, 68, 0.9)",
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "rgba(239, 68, 68, 0.9)",
        },
      ],
    }),
    [labels, dataValues]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: "easeOutQuart" as const,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(148, 163, 184, 0.3)",
          borderWidth: 1,
          titleColor: "#e2e8f0",
          bodyColor: "#cbd5f5",
          padding: 10,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(148, 163, 184, 0.08)",
          },
          ticks: {
            color: "rgba(148, 163, 184, 0.8)",
            font: { size: 11 },
          },
        },
        y: {
          min: 0,
          max: 5,
          grid: {
            color: "rgba(148, 163, 184, 0.08)",
          },
          ticks: {
            color: "rgba(148, 163, 184, 0.8)",
            font: { size: 11 },
          },
        },
      },
    }),
    []
  );

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rating Trend</p>
          <h3 className="text-lg font-semibold text-white">Audience Rating Timeline</h3>
        </div>
      </div>
      <div className="mt-4 h-56">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default RatingTimeline;
