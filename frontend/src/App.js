import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import FindingsTable from './components/FindingsTable';
import Filters from './components/Filters';
import { Container, Nav, Navbar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import ColumnDetails from './components/ColumnDetails';


function App() {
  const [view, setView] = useState('dashboard');
  // Add filters state
  const [filters, setFilters] = useState({});
  const [selectedFinding, setSelectedFinding] = useState(null); // new

  // Handler passed to Filters component
  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
  };
  const handleSelectRow = (finding) => {
    setSelectedFinding(finding);
  };

  const handleBack = () => {
    setSelectedFinding(null);
  };

  return (
    <div>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>DSPM Scanner</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link onClick={() => setView('dashboard')}>Dashboard</Nav.Link>
            <Nav.Link onClick={() => setView('table')}>Findings</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container style={{ marginTop: 20 }}>
        {view === 'dashboard' && <Dashboard />}

        {view === 'table' && !selectedFinding && (
          <>
            {/* Filters panel above the table */}
            <Filters onApply={handleApplyFilters} />
            <FindingsTable 
              filters={filters} 
              onSelect={handleSelectRow} 
            />
          </>
        )}

        {view === 'table' && selectedFinding && (
          <ColumnDetails 
            finding={selectedFinding} 
            goBack={handleBack}
          />
        )}
      </Container>
    </div>
  );
}

export default App;
// import React from 'react';
// import Dashboard from './components/Dashboard';
// import FindingsTable from './components/FindingsTable';
// import { Container, Nav, Navbar } from 'react-bootstrap';
// import 'bootstrap/dist/css/bootstrap.min.css';

// function App() {
//   const [view, setView] = React.useState("dashboard");

//   return (
//     <div>
//       <Navbar bg="dark" variant="dark">
//         <Container>
//           <Navbar.Brand>DSPM Scanner</Navbar.Brand>
//           <Nav className="me-auto">
//             <Nav.Link onClick={() => setView("dashboard")}>Dashboard</Nav.Link>
//             <Nav.Link onClick={() => setView("table")}>Findings</Nav.Link>
//           </Nav>
//         </Container>
//       </Navbar>

//       <Container style={{ marginTop: 20 }}>
//         {view === "dashboard" && <Dashboard />}
//         {view === "table" && <FindingsTable />}
//       </Container>
//     </div>
//   );
// }

// export default App;
