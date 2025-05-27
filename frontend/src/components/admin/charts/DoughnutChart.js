import React, { useEffect, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';

const DoughnutChart = ({ data, options }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Store the current chart instance
    const chart = chartRef.current;

    // Cleanup function
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, []); // Empty dependency array since we only need to handle cleanup on unmount

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Doughnut ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default DoughnutChart; 