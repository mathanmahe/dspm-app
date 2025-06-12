import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table } from 'react-bootstrap'

const FindingsTable = ({ filters, onSelect }) => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Destructure individual filter values so that useEffect dependencies are stable
  const {
    sensitivity,
    dataType,
    table,
    confidenceMin = 0,
    confidenceMax = 1,
  } = filters || {};

  useEffect(() => {
    const fetchFindings = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};

        if (sensitivity) params.sensitivity = sensitivity;
        if (dataType) params.data_type = dataType;
        if (table) params.table = table;
        params.confidence_min = confidenceMin;
        params.confidence_max = confidenceMax;

        const res = await axios.get('http://localhost:8000/findings', { params });
        setFindings(res.data.findings);
      } catch (err) {
        console.error('Error fetching findings:', err);
        setError('Failed to load findings.');
      } finally {
        setLoading(false);
      }
    };

    fetchFindings();
  }, [sensitivity, dataType, table, confidenceMin, confidenceMax]);

  if (loading) return <p>Loading...</p>;
  if (error) return (
    <div>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
  if (findings.length === 0) return <p>No findings match your criteria.</p>;

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Table</th>
          <th>Column</th>
          <th>Data Type</th>
          <th>Sensitivity</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        {findings.map(f => (
          // <tr key={f.id}>
          <tr 
            key={f.id} 
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect && onSelect(f)}
          >
            <td>{f.datastore.table}</td>
            <td>{f.datastore.column}</td>
            <td>{f.classification.data_types.join(', ')}</td>
            <td>{f.classification.sensitivity}</td>
            <td>{f.classification.confidence}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

// Provide a stable default for filters
FindingsTable.defaultProps = {
  filters: {},
};

export default FindingsTable;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const FindingsTable = ({ filters = {} }) => {
//   const [findings, setFindings] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchFindings = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const params = {};

//         if (filters.sensitivity) params.sensitivity = filters.sensitivity;
//         if (filters.dataType) params.data_type = filters.dataType;
//         if (filters.table) params.table = filters.table;
//         params.confidence_min = filters.confidenceMin ?? 0;
//         params.confidence_max = filters.confidenceMax ?? 1;

//         const res = await axios.get('http://localhost:8000/findings', { params });
//         setFindings(res.data.findings);
//       } catch (err) {
//         console.error('Error fetching findings:', err);
//         setError('Failed to load findings.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFindings();
//   }, [filters]); // ✅ only filters in deps

//   if (loading) return <p>Loading...</p>;
//   if (error) return <div><p>{error}</p><button onClick={() => window.location.reload()}>Retry</button></div>;
//   if (findings.length === 0) return <p>No findings match your criteria.</p>;

//   return (
//     <table>
//       <thead>
//         <tr>
//           <th>Table</th>
//           <th>Column</th>
//           <th>Data Type</th>
//           <th>Sensitivity</th>
//           <th>Confidence</th>
//         </tr>
//       </thead>
//       <tbody>
//         {findings.map(f => (
//           <tr key={f.id}>
//             <td>{f.datastore.table}</td>
//             <td>{f.datastore.column}</td>
//             <td>{f.classification.data_types.join(', ')}</td>
//             <td>{f.classification.sensitivity}</td>
//             <td>{f.classification.confidence}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// export default FindingsTable;
