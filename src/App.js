import { useEffect, useState } from "react";
import "./App.css";
import styled from "styled-components";
import moment from "moment";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";

const Box = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

function App() {
  const dateFormat = "MM-DD-YYYY";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [renderData, setRenderData] = useState([]);
  const [inputDateRange, setInputDateRange] = useState({ start: "", end: "" });
  const [inputError, setInputError] = useState("");
  useEffect(() => {
    fetch(
      "https://dev-backend.rydecarpool.com/coding-challenge/signups?target=dev",
      {
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response;
      })
      .then((dataJson) => {
        const processedData = dataJson.map(({ count, date }) => {
          return {
            signups: count,
            date: moment(date).unix() * 1000,
          };
        });
        setRawData(processedData);
        setRenderData(processedData);
      })
      .catch((error) => {
        console.log(error);
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }
  if (error != null) {
    return (
      <div>
        <h1>Error fetching data:</h1>
        <h2>{error.message}</h2>
      </div>
    );
  }

  function handleStartChange(event) {
    setInputDateRange({ start: event.target.value, end: inputDateRange.end });
  }

  function handleEndChange(event) {
    setInputDateRange({ start: inputDateRange.start, end: event.target.value });
  }

  function handleSubmit(event) {
    const start = moment(inputDateRange.start, dateFormat, true);
    const end = moment(inputDateRange.end, dateFormat, true);
    if (!start.isValid()) setInputError("Invalid start date format");
    else if (!end.isValid()) setInputError("Invalid end date format");
    else if (start.isAfter(end))
      setInputError("Start date must be before end date");
    else {
      setInputError("");
      updateRenderData({ start: start.unix(), end: end.unix() });
    }
    event.preventDefault();
  }

  function updateRenderData(dataRange) {
    if (dataRange.start === -1 && dataRange.end === -1) setRenderData(rawData);
    // The rendered data is the rawData filtered and sorted by the dataRange
    const filteredData = rawData.filter(({ date }) => {
      const unixTime = date / 1000;
      return unixTime >= dataRange.start && unixTime <= dataRange.end;
    });
    filteredData.sort((a, b) => a.date - b.date);
    setRenderData(filteredData);
  }

  function handleReset() {
    setRenderData(rawData);
  }

  return (
    <div className="time-plot">
      <h1>Ryde Signup Data</h1>
      <Box>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart>
            <XAxis
              dataKey="date"
              name="Time"
              domain={["auto", "auto"]}
              tickFormatter={(unixTime) =>
                moment(unixTime).format("MM-DD-YYYY")
              }
              type="number"
            />
            <YAxis dataKey="signups" name="Signups" />
            <Scatter
              data={renderData}
              line={{ stroke: "#d3d3d3" }}
              lineType="joint"
              lineJointType="monotoneX"
              name="Values"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
      <Col
        style={{
          backgroundColor: "#91BAD6",
          margin: "24px",
          padding: "24px",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Row>
            <label>
              Start Date (MM-DD-YYYY):
              <input
                label="Start Date"
                type="text"
                value={inputDateRange.start}
                onChange={handleStartChange}
              />
            </label>
          </Row>
          <Row>
            <label>
              End Date (MM-DD-YYYY):
              <input
                label="End Date"
                type="text"
                value={inputDateRange.end}
                onChange={handleEndChange}
              />
            </label>
          </Row>
          <Row>
            <input type="submit" value="Submit" />
            <button type="button" onClick={handleReset}>
              Reset Graph
            </button>
            {inputError !== "" && (
              <label className="input-error">{inputError}</label>
            )}
          </Row>
        </form>
      </Col>
    </div>
  );
}

export default App;
