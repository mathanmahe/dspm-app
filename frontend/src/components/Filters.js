import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';

const Filters = ({ onApply }) => {
  const [sensitivity, setSensitivity] = useState('');
  const [dataType, setDataType] = useState('');
  const [table, setTable] = useState('');
  const [confidenceMin, setConfidenceMin] = useState(0);
  const [confidenceMax, setConfidenceMax] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass filter keys matching FindingsTable's expected props
    onApply({
      sensitivity,
      dataType,
      table,
      confidenceMin,
      confidenceMax,
    });
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-3">
      <Row>
        <Col md={2}>
          <Form.Group>
            <Form.Label>Data Type</Form.Label>
            <Form.Control
              type="text"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              placeholder="Email, SSN, etc"
            />
          </Form.Group>
        </Col>

        <Col md={2}>
          <Form.Group>
            <Form.Label>Sensitivity</Form.Label>
            <Form.Control
              type="text"
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
              placeholder="HIGH, MEDIUM, etc"
            />
          </Form.Group>
        </Col>

        <Col md={2}>
          <Form.Group>
            <Form.Label>Table Name</Form.Label>
            <Form.Control
              type="text"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="customers"
            />
          </Form.Group>
        </Col>

        <Col md={2}>
          <Form.Group>
            <Form.Label>Conf Min</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={confidenceMin}
              onChange={(e) => setConfidenceMin(parseFloat(e.target.value) || 0)}
            />
          </Form.Group>
        </Col>

        <Col md={2}>
          <Form.Group>
            <Form.Label>Conf Max</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={confidenceMax}
              onChange={(e) => setConfidenceMax(parseFloat(e.target.value) || 1)}
            />
          </Form.Group>
        </Col>

        <Col md={2} className="d-flex align-items-end">
          <Button type="submit" variant="primary">Apply</Button>
        </Col>
      </Row>
    </Form>
  );
};

export default Filters;


// import React, { useState } from 'react';
// import { Form, Button, Row, Col } from 'react-bootstrap';

// const Filters = ({ onApply }) => {
//   const [sensitivity, setSensitivity] = useState("");
//   const [dataType, setDataType] = useState("");
//   const [table, setTable] = useState("");
//   const [confidenceMin, setConfidenceMin] = useState(0);
//   const [confidenceMax, setConfidenceMax] = useState(1);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onApply({
//       sensitivity,
//       data_type: dataType,
//       table,
//       confidence_min: confidenceMin,
//       confidence_max: confidenceMax,
//     });
//   };

//   return (
//     <Form onSubmit={handleSubmit} className="mb-3">
//       <Row>
//         <Col md={2}>
//           <Form.Group>
//             <Form.Label>Data Type</Form.Label>
//             <Form.Control
//               type="text"
//               value={dataType}
//               onChange={(e) => setDataType(e.target.value)}
//               placeholder="Email, SSN, etc"
//             />
//           </Form.Group>
//         </Col>

//         <Col md={2}>
//           <Form.Group>
//             <Form.Label>Sensitivity</Form.Label>
//             <Form.Control
//               type="text"
//               value={sensitivity}
//               onChange={(e) => setSensitivity(e.target.value)}
//               placeholder="HIGH, MEDIUM, etc"
//             />
//           </Form.Group>
//         </Col>

//         <Col md={2}>
//           <Form.Group>
//             <Form.Label>Table Name</Form.Label>
//             <Form.Control
//               type="text"
//               value={table}
//               onChange={(e) => setTable(e.target.value)}
//               placeholder="customers"
//             />
//           </Form.Group>
//         </Col>

//         <Col md={2}>
//           <Form.Group>
//             <Form.Label>Conf Min</Form.Label>
//             <Form.Control
//               type="number"
//               step="0.01"
//               value={confidenceMin}
//               onChange={(e) => setConfidenceMin(e.target.value)}
//             />
//           </Form.Group>
//         </Col>

//         <Col md={2}>
//           <Form.Group>
//             <Form.Label>Conf Max</Form.Label>
//             <Form.Control
//               type="number"
//               step="0.01"
//               value={confidenceMax}
//               onChange={(e) => setConfidenceMax(e.target.value)}
//             />
//           </Form.Group>
//         </Col>

//         <Col md={2} className="d-flex align-items-end">
//           <Button type="submit" variant="primary">Apply</Button>
//         </Col>
//       </Row>
//     </Form>
//   );
// };

// export default Filters;
