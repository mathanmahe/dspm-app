import axios from "axios";

// const API_BASE = "http://localhost:8000";  // replace with actual API URL when deployed
// const API_BASE = "http://dspm-a-Publi-5fdgbZ0S9sZn-716869454.us-west-1.elb.amazonaws.com";
const API_BASE = "https://d2qixirojk1i9f.cloudfront.net"


export async function getSummary() {
  const res = await axios.get(`${API_BASE}/summary`);
  return res.data;
}

export async function getFindings(params = {}) {
  const res = await axios.get(`${API_BASE}/findings`, { params });
  return res.data;
}

export async function getFindingById(id) {
  const res = await axios.get(`${API_BASE}/findings/${id}`);
  return res.data;
}

export async function getColumnSamples(table, column, data_type) {
  const res = await axios.get(`${API_BASE}/datastore/${table}/${column}`, {
    params: { data_type: data_type }
  });
  return res.data.samples;
}
