import React, { useEffect, useState } from 'react';
import { getSummary } from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A'];

function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getSummary().then(setSummary);
  }, []);

  if (!summary) return <div>Loading...</div>;

  const dataTypes = Object.entries(summary.data_types).map(([key, value]) => ({ name: key, value }));
  const sensitivity = Object.entries(summary.sensitivity).map(([key, value]) => ({ name: key, value }));

  return (
    <div>
      <h2>DSPM Dashboard</h2>

      <h4>Data Types</h4>
      <PieChart width={400} height={300}>
        <Pie data={dataTypes} dataKey="value" nameKey="name" outerRadius={100}>
          {dataTypes.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>

      <h4>Sensitivity Levels</h4>
      <BarChart width={400} height={300} data={sensitivity}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" fill="#82ca9d" />
        <Tooltip />
      </BarChart>
    </div>
  );
}

export default Dashboard;
