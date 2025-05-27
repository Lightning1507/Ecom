import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';

const LineChart = ({ data, options }) => {
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
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default LineChart; 