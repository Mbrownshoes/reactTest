import React, {useState, useEffect, useRef, useLayoutEffect} from 'react'
import ReactDOM from 'react-dom'
import {ToggleButton, Row, Col, Container, ButtonGroup} from 'react-bootstrap'

import 'bootstrap-slider/dist/css/bootstrap-slider.css'
import '../style.css'
import _ from 'lodash'
import * as ss from 'simple-statistics'
import * as d3 from 'd3'


export default function ReactD3Viz() {

 
  const [data,
    setData] = useState(null)

  const targetRef = useRef()
  

  const d3Container = useRef(null);

  // Goal is to use useLayoutEffect to automaticaly scale the chart dimensions
  
  // useLayoutEffect(() => {
  //   if (targetRef.current) {
  //     setDimensions({width: targetRef.current.offsetWidth, height: targetRef.current.offestHeigt})
  //   }
  // }, [])

  useEffect(() => {
    async function getData() {
      await d3
        .csv("https://gist.githubusercontent.com/Mbrownshoes/7f08c0aa283d79e096091b849dd5c03d/" +
          "raw/b7e7ff8b2df0b463ae6165a4581807211e32b479/data700.csv",
      d3.autoType)
        .then(data => {
          const dataClean = data.map(d => {
            return {date: d.year, value: d.value};
          });
          setData(dataClean)
        })
    }
    getData()
  }, [])

  // D3 code goes here
  useEffect(() => {
    if (data) {
      const svg = d3.select(d3Container.current);
      const height = 300;
      const width = 500;
      const margin = {
        top: 10,
        right: 50,
        bottom: 30,
        left: 40
      }

      const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format(".0f")))
        .call(g => g.select(".domain").remove());

      const x = d3
        .scaleTime()
        .domain(d3.extent(data, d => d.date))
        .nice()
        .range([
          margin.left, width - margin.right
        ]);
      // const  z = {

      const max = d3.max(data, d => Math.abs(d.value));
      const z = d3
        .scaleSequential(d3.interpolateRdBu)
        .domain([
          max, -max
        ]);

      svg
        .append("g")
        .call(xAxis);

      const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "+"))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").filter(d => d === 0).clone().attr("x2", width - margin.right - margin.left).attr("stroke", "#ccc"))
        .call(g => g.append("text").attr("fill", "#000").attr("x", 5).attr("y", margin.top).attr("dy", "0.32em").attr("text-anchor", "start").attr("font-weight", "bold").text("Anomaly (°C) - 0-700m"));

      const y = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.value))
        .nice()
        .range([
          height - margin.bottom,
          margin.top
        ]);

      svg
        .append("g")
        .call(yAxis);

      const regressionLine = ss.linearRegressionLine(ss.linearRegression(data.map(row => [ + row.date,
        row.value
      ])));

      const regressionEndpoints = [
        {
          date: data[0].date,
          value: regressionLine(+ data[0].date)
        }, {
          date: data[data.length - 1].date,
          value: regressionLine(+ data[data.length - 1].date)
        }
      ];

      svg
        .append("path")
        .datum(regressionEndpoints)
        .attr("fill", "none")
        .attr("stroke", "deeppink")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-dasharray", "10 10")
        .attr("stroke-linecap", "round")
        .attr("d", d3.line().x(d => x(d.date)).y(d => y(d.value)));

      svg
        .append("g")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.2)
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.value))
        .attr("fill", 'steelblue')
        .attr("r", 2.5);

    }

  }, [d3Container.current])

  return (
    <div className='chart' ref={targetRef}>
      <Container fluid>
        <Row>
          <Col>
            <div className='title'>
              Trying to stuff d3 into react, brute force method
            </div>
            <div className='description'>
             some text.
            </div>
          </Col>
        </Row>

        <Row>
          <svg className="d3-component" width={400} height={300} ref={d3Container}/>
        </Row>

      </Container>
    </div>
  )
}

// This is where react reaches into the DOM, finds the <div id="chart"> element,
// and replaces it with the content of ReactD3Viz's render function JSX.
const domContainer = document.querySelector('#reactchart')
ReactDOM.render(
  <ReactD3Viz/>, domContainer)
