import React, { useEffect, useState } from 'react';
import { getColumnSamples } from '../api';
import { Button, Table } from 'react-bootstrap';

function ColumnDetails({ finding, goBack }) {
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    getColumnSamples(finding.datastore.table, finding.datastore.column, finding.classification.data_types[0])
      .then(setSamples);
  }, [finding]);

  return (
    <div>
      <Button onClick={goBack}>Back</Button>
      <h3>Live samples for {finding.datastore.table}.{finding.datastore.column}</h3>

      <Table striped bordered>
        <thead>
          <tr><th>Raw</th><th>Redacted</th></tr>
        </thead>
        <tbody>
          {samples.map((s, idx) => (
            <tr key={idx}><td>{s.raw}</td><td>{s.redacted}</td></tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ColumnDetails;
