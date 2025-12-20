'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'progress';
  title: string;
  data: any[];
  labels?: string[];
  options?: any;
}

interface ChartRendererProps {
  chartData: ChartData;
  className?: string;
}

export function ChartRenderer({ chartData, className = '' }: ChartRendererProps) {
  const { type, title, data, labels } = chartData;

  // Prepare data for Chart.js
  const prepareChartData = () => {
    switch (type) {
      case 'bar':
      case 'line':
        return {
          labels: labels || data.map(item => item.label || item.name),
          datasets: [
            {
              label: title,
              data: data.map(item => item.value || item.count),
              backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 205, 86, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 2,
            },
          ],
        };

      case 'pie':
      case 'doughnut':
        return {
          labels: labels || data.map(item => item.label || item.name),
          datasets: [
            {
              label: title,
              data: data.map(item => item.value || item.count),
              backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#FF6384',
                '#C9CBCF',
              ],
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        };

      default:
        return {
          labels: ['No Data'],
          datasets: [{ label: 'No Data', data: [0] }],
        };
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
      },
    },
    scales: type === 'bar' || type === 'line' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    } : undefined,
    ...chartData.options,
  };

  const renderChart = () => {
    const preparedData = prepareChartData();

    switch (type) {
      case 'bar':
        return <Bar data={preparedData} options={chartOptions} />;
      case 'line':
        return <Line data={preparedData} options={chartOptions} />;
      case 'pie':
        return <Pie data={preparedData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={preparedData} options={chartOptions} />;
      case 'progress':
        return <ProgressChart data={data} title={title} />;
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p>Nieobsługiwany typ wykresu: {type}</p>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg border shadow-sm ${className}`}>
      <div className="h-64 w-full">
        {data && data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Brak danych do wyświetlenia</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Progress Chart Component
function ProgressChart({ data, title }: { data: any[]; title: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      {data.map((item, index) => {
        const percentage = Math.min(100, Math.max(0, item.percentage || item.value || 0));
        return (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.label || item.name}</span>
              <span className="text-gray-600">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChartRenderer;