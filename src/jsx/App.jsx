import React, { useEffect } from 'react';
import '../styles/styles.less';

// https://d3js.org/
import * as d3 from 'd3';
// https://www.npmjs.com/package/react-round-flags
import { CircleFlag } from 'react-circle-flags';

function App() {
  let interval1;
  let interval2;

  const simon_color = '#CF081F';
  const teemo_color = '#000000';
  let animation_done = false;

  const title = '<h1>Olten GP</h1>';

  const max_y_axis_value = 90;
  const max_y_axis_step = 5;
  const title_offset = 1;
  const first_driver = '<h3 class="redbull"><span class="position">1</span><span class="name">Teemo</span><span class="team"> Finland</span></h3>';
  const second_driver = '<h3 class="mercedes"><span class="position">2</span><span class="name">Simon</span><span class="team"> Great Britain</span></h3>';
  const title_html = `<div class="title_container">${title}<div>${first_driver}</div><div>${second_driver}</div></div>`;
  const races = ['First Lap', 'Lap 2', 'Lap 3', 'Lap 4', 'Lap 5', 'Lap 6', 'Lap 7', 'Lap 8', 'Lap 9', 'Final Lap'];

  const activateLine = (event, line_id, d, div) => {
    d3.select(`.${line_id}`)
      .attr('stroke', '#000')
      .attr('stroke-width', '2px');
    d3.selectAll(`.dot.dot_${line_id}`)
      .attr('r', 4)
      .attr('fill', '#000');
    d3.selectAll('.dot_text')
      .style('font-size', 0);
    d3.selectAll(`.dot_text.dot_${line_id}`)
      .style('font-size', '10pt');
    div.transition()
      .duration(0)
      .style('opacity', 0.9);

    const left = (event && event.pageX) ? `${event.pageX + 15}px` : `${d3.selectAll(`.dot.dot_${line_id}`).nodes()[races.length - 4].getBoundingClientRect().x}px`;
    const top = (event && event.pageY) ? `${event.pageY - 20}px` : `${d3.selectAll(`.dot.dot_${line_id}`).nodes()[races.length - 4].getBoundingClientRect().y + 20}px`;

    div.html(`${d.current_pos} <span class="tooltip_name">${d.name}</span>`)
      .style('left', left)
      .style('top', top);
  };
  const deactivateLine = (line_id, d, div, deactive_tooltip = true, tooltip_delay = true) => {
    d3.select(`.${line_id}`)
      .attr('stroke', 'rgba(0, 0, 0, 0.1)')
      .attr('stroke-width', '1px');
    d3.selectAll(`.dot.dot_${line_id}`)
      .attr('r', 2)
      .attr('fill', 'rgba(0, 0, 0, 0.1)');
    d3.selectAll(`.dot_text.dot_${line_id}`)
      .style('font-size', 0);
    if (deactive_tooltip === true) {
      if (tooltip_delay === true) {
        div.transition()
          .delay(200)
          .duration(500)
          .style('opacity', 0);
      } else {
        div.style('opacity', 0);
      }
    }
  };
  const createInteractiveLayer = (svg, line, slices, div) => {
    animation_done = true;
    svg.selectAll('lines_interactivity').data(slices).enter().append('g')
      .append('path')
      .attr('class', 'line_interactivity')
      .attr('data-line-id', (d, i) => `line_${i}`)
      .attr('stroke', () => 'transparent')
      .attr('stroke-opacity', () => 1)
      .attr('stroke-width', d => ((d.highlighted === true) ? '0' : '10px'))
      .attr('d', d => line(d.values))
      .on('mouseover', (event, d) => activateLine(event, d3.select(event.currentTarget).attr('data-line-id'), d, div))
      .on('mouseout', (event, d) => deactivateLine(event, d3.select(event.currentTarget).attr('data-line-id'), d, div));
  };

  const createChart = () => {
    const width = 600;
    const height = 600;
    const adj = 50;

    const div = d3.select('.app')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // We are appending SVG first.
    const svg = d3.select('.chart_container').append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `-${adj} -${adj} ${width + adj * 3} ${height + adj * 3}`)
      .classed('svg-content', true);

    // Fetch the data.
    d3.csv('./assets/data/Karting - data.csv').then((data) => {
      const raw_data = data;
      const data_points = [];
      let slices = data.map((values, i) => ({
        color: (i === 0) ? teemo_color : (i === 1) ? simon_color : 'rgba(0, 0, 0, 0.1)',
        current_pos: i + 1,
        highlighted: (i < 2),
        name: values.name,
        values: races.map((race, j) => {
          const max = d3.max(data, d => +d[race]);
          if (race !== '') {
            data_points.push({
              color: (i === 0) ? teemo_color : (i === 1) ? simon_color : 'rgba(0, 0, 0, 0.1)',
              name: values.name,
              dot_line_class: `dot_line_${i}`,
              highlighted: (i < 2),
              position: (parseFloat(values[race]) >= max) ? 'top' : (i >= 1) ? 'top' : 'bottom',
              x: j,
              y: +values[race]
            });
          }
          return {
            points: (values[race]) ? +values[race] : 0,
            race
          };
        })
      }));

      // Prepare the initial data and store the rest for later use.
      const to_be_added_slices = {};
      slices = slices.map((slice, i) => {
        to_be_added_slices[i] = slice.values.splice(-slice.values.length + 1);
        return slice;
      });

      // Scales.
      const xScale = d3.scaleLinear().range([0, width]);
      const yScale = d3.scaleLinear().range([height, 0]);
      xScale.domain([0, races.length - 1]);
      yScale.domain([45, max_y_axis_value]);

      // Grid lines.
      const make_y_gridlines = () => d3.axisLeft(yScale).ticks(parseInt(max_y_axis_value || max_y_axis_step, 10) - 1).tickValues(d3.range(50, max_y_axis_value - 5, max_y_axis_step));
      // Add the Y gridlines
      svg.append('g')
        .attr('class', 'grid')
        .call(make_y_gridlines()
          .tickSize(-width - 20)
          .tickFormat(''));

      // Grid Axes.
      svg.append('g')
        .attr('class', 'axis xaxis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom()
          .ticks(races.length - 1)
          .tickFormat(i => races[i])
          .scale(xScale));

      svg.append('g')
        .attr('class', 'axis yaxis')
        .call(d3.axisLeft()
          .ticks(parseInt(max_y_axis_value || max_y_axis_step, 10))
          .tickValues(d3.range(0, max_y_axis_value + max_y_axis_step, max_y_axis_step))
          .scale(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('dy', '1em')
        .attr('y', -25)
        .attr('x', -10)
        .style('text-anchor', 'end')
        .text('Relative to the winner');

      // Create the lines with current data.
      const lines = svg.selectAll('lines').data(slices).enter().append('g');
      const line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.points));
      const updateData = () => {
        // Remove any old lines.
        svg.selectAll('.line').remove();

        // Add the lines.
        lines.append('path')
          .attr('class', (d, i) => `line line_${i}`)
          .attr('stroke', d => d.color)
          .attr('stroke-width', d => ((d.highlighted === true) ? '4px' : '1px'))
          .attr('d', d => line(d.values))
          .on('mouseover', (event, d) => {
            if (d.highlighted === true && animation_done === true) {
              d3.selectAll('.dot_text.dot_line_0, .dot_text.dot_line_1')
                .style('font-size', '9pt');
            }
          });
      };

      // Add data in an interval.
      interval1 = setInterval(() => {
        slices = slices.map((slice, i) => {
          slice.values.push(to_be_added_slices[i].shift());
          return slice;
        });
        updateData();
        if (to_be_added_slices[0].length === 0) {
          clearInterval(interval1);
          let i = 2;
          setTimeout(() => {
            interval2 = setInterval(() => {
              activateLine(`line_${i}`, slices[i], div);
              if (i > 2) {
                deactivateLine(`line_${i - 1}`, slices[i], div, false);
              }
              i++;
              if (i >= slices.length) {
                clearInterval(interval2);
                setTimeout(() => {
                  deactivateLine(`line_${i - 1}`, slices[i], div, true, false);
                  setTimeout(() => {
                    d3.selectAll('.dot_text.dot_line_0, .dot_text.dot_line_1')
                      .style('font-size', '9pt');
                    createInteractiveLayer(svg, line, slices, div);
                  }, 1000); // Wait before creating the interactivity layer.
                }, 1500); // Wait before hiding the last driver
              }
            }, 1500); // Wait between activating each line.
          }, 2000); // Wait before showing the lines.
        }
      }, 750); // Wait between showing each race.

      // Add dots.
      svg.selectAll('.dot')
        .data(data_points)
        .enter().append('circle')
        .attr('class', d => `dot ${d.dot_line_class}`)
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('fill', d => d.color)
        .attr('r', d => ((d.highlighted === true) ? 6 : 2))
        .on('mouseover', (event, d) => {
          if (d.highlighted === true && animation_done === true) {
            d3.selectAll('.dot_text.dot_line_0, .dot_text.dot_line_1')
              .style('font-size', '9pt');
          }
        });

      // Add dot texts.
      const position_offset = 2;
      svg.selectAll('.dot_text')
        .data(data_points)
        .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('x', d => xScale(d.x))
        .attr('y', d => ((d.position === 'top') ? yScale(d.y + position_offset) : yScale(d.y - position_offset)))
        .style('font-weight', d => ((d.highlighted === true) ? 600 : 400))
        .style('font-size', d => ((d.highlighted === true) ? '9pt' : 0))
        .attr('class', d => `dot_text ${d.dot_line_class}`)
        .text(d => ((d.name === 'Teemo') ? d.y : `+${(parseFloat(d.y) - parseFloat(raw_data[0][races[d.x]])).toFixed(3)}`));

      svg.append('foreignObject')
        .attr('alignment-baseline', 'central')
        .attr('height', 200)
        .attr('text-anchor', 'middle')
        .attr('width', 450)
        .attr('x', xScale(0.7))
        .attr('y', yScale(max_y_axis_value - title_offset))
        .html(title_html);
    });
  };

  useEffect(() => {
    createChart();
  }, []);

  return (
    <div className="app">
      <div className="chart_container" />
      <div className="meta">
        <div>
          <strong>Average speed for winner</strong>
          {' '}
          45 km/h
        </div>
      </div>
      <div className="lap_times">
        <table>
          <tbody>
            <tr className="heading">
              <th>Name</th>
              <th>Lap 1*</th>
              <th>Lap 2</th>
              <th>Lap 3</th>
              <th>Lap 4</th>
              <th>Lap 5</th>
              <th>Lap 6</th>
              <th>Lap 7</th>
              <th>Lap 8</th>
              <th>Lap 9</th>
              <th>Lap 10</th>
              <th>Avg</th>
              <th>Total</th>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="FI" height={0} countryCode="fi" value="FI" />
                {' '}
                1 Teemo
                {' '}
              </th>
              <td><span className="worst">53.701</span></td>
              <td><span className="worst">51.889</span></td>
              <td>50.781</td>
              <td>50.529</td>
              <td>51.353</td>
              <td>50.738</td>
              <td>50.441</td>
              <td>50.853</td>
              <td>50.842</td>
              <td><span className="best">49.806</span></td>
              <td className="avg">51.093</td>
              <td className="total">510.933</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="GB" height={0} countryCode="gb" value="GB" />
                {' '}
                2 Simon
                {' '}
              </th>
              <td><span className="worst">57.018</span></td>
              <td><span className="worst">52.965</span></td>
              <td>50.228</td>
              <td>51.548</td>
              <td>50.260</td>
              <td><span className="best">49.301</span></td>
              <td>49.583</td>
              <td>49.689</td>
              <td>50.910</td>
              <td>51.740</td>
              <td className="avg">51.229</td>
              <td className="total">513.242</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="CH" height={0} countryCode="ch" value="CH" />
                {' '}
                3 Julien
                {' '}
              </th>
              <td><span className="worst">55.766</span></td>
              <td>52.238</td>
              <td>51.679</td>
              <td>51.690</td>
              <td><span className="worst">56.111</span></td>
              <td>50.969</td>
              <td>50.678</td>
              <td>50.776</td>
              <td><span className="best">50.308</span></td>
              <td>50.562</td>
              <td className="avg">52.046</td>
              <td className="total">520.777</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="CH" height={0} countryCode="ch" value="CH" />
                {' '}
                4 Steven
                {' '}
              </th>
              <td>56.426</td>
              <td><span className="worst">57.478</span></td>
              <td>50.643</td>
              <td><span className="worst">57.761</span></td>
              <td>51.876</td>
              <td>51.303</td>
              <td>50.846</td>
              <td>50.821</td>
              <td>51.610</td>
              <td><span className="best">50.437</span></td>
              <td className="avg">52.734</td>
              <td className="total">529.201</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="EC" height={0} countryCode="ec" value="EC" />
                {' '}
                5 David
                {' '}
              </th>
              <td><span className="worst">56.779</span></td>
              <td><span className="worst">72.458</span></td>
              <td>50.903</td>
              <td><span className="best">50.549</span></td>
              <td>50.983</td>
              <td>50.973</td>
              <td>50.906</td>
              <td>51.480</td>
              <td>51.715</td>
              <td>51.160</td>
              <td className="avg">53.660</td>
              <td className="total">537.906</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="AT" height={0} countryCode="at" value="AT" />
                {' '}
                6 Dinyar
                {' '}
              </th>
              <td><span className="worst">75.643</span></td>
              <td><span className="worst">54.430</span></td>
              <td>52.082</td>
              <td><span className="best">50.867</span></td>
              <td>50.923</td>
              <td>52.335</td>
              <td>52.031</td>
              <td>51.277</td>
              <td>52.547</td>
              <td>51.012</td>
              <td className="avg">54.169</td>
              <td className="total">543.147</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="MX" height={0} countryCode="mx" value="MX" />
                {' '}
                7 Helena
                {' '}
              </th>
              <td><span className="worst">62.478</span></td>
              <td><span className="worst">57.153</span></td>
              <td>56.730</td>
              <td>53.756</td>
              <td>53.186</td>
              <td>54.314</td>
              <td>52.671</td>
              <td><span className="best">52.217</span></td>
              <td>52.363</td>
              <td>53.505</td>
              <td className="avg">54.595</td>
              <td className="total">548.373</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="meta">
        <div>
          <span className="best">Best lap</span>
          {' '}
          <span className="worst">Worst two laps</span>
        </div>
        <div>*Lap 1 time includes the time each driver took from the grid to get to the finish line</div>
      </div>
      <div className="lap_times">
        <table>
          <tbody>
            <tr className="heading">
              <th>Name</th>
              <th>Lap 1</th>
              <th>Lap 2</th>
              <th>Lap 3</th>
              <th>Lap 4</th>
              <th>Lap 5</th>
              <th>Lap 6</th>
              <th>Lap 7</th>
              <th>Lap 8</th>
              <th>Lap 9</th>
              <th>Finish</th>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="FI" height={0} countryCode="fi" value="FI" />
                {' '}
                1 Teemo
                {' '}
              </th>
              <td>53.701</td>
              <td>105.59</td>
              <td>156.371</td>
              <td>206.9</td>
              <td>258.253</td>
              <td>308.991</td>
              <td>359.432</td>
              <td>410.285</td>
              <td>461.127</td>
              <td className="diff">510.933</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="GB" height={0} countryCode="gb" value="GB" />
                {' '}
                2 Simon
                {' '}
              </th>
              <td>+3.317</td>
              <td>+4.393</td>
              <td>+3.840</td>
              <td>+4.859</td>
              <td>+3.766</td>
              <td>+2.329</td>
              <td>+1.471</td>
              <td>+0.307</td>
              <td>+0.375</td>
              <td className="diff">+2.309</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="CH" height={0} countryCode="ch" value="CH" />
                {' '}
                3 Julien
                {' '}
              </th>
              <td>+2.065</td>
              <td>+2.414</td>
              <td>+3.312</td>
              <td>+4.473</td>
              <td>+9.231</td>
              <td>+9.462</td>
              <td>+9.699</td>
              <td>+9.622</td>
              <td>+9.088</td>
              <td className="diff">+9.844</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="CH" height={0} countryCode="ch" value="CH" />
                {' '}
                4 Steven
                {' '}
              </th>
              <td>+2.725</td>
              <td>+8.314</td>
              <td>+8.176</td>
              <td>+15.408</td>
              <td>+15.931</td>
              <td>+16.496</td>
              <td>+16.901</td>
              <td>+16.869</td>
              <td>+17.637</td>
              <td className="diff">+18.268</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="EC" height={0} countryCode="ec" value="EC" />
                {' '}
                5 David
                {' '}
              </th>
              <td>+3.078</td>
              <td>+23.647</td>
              <td>+23.769</td>
              <td>+23.789</td>
              <td>+23.419</td>
              <td>+23.654</td>
              <td>+24.119</td>
              <td>+24.746</td>
              <td>+25.619</td>
              <td className="diff">+26.973</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="AT" height={0} countryCode="at" value="AT" />
                {' '}
                6 Dinyar
                {' '}
              </th>
              <td>+21.942</td>
              <td>+24.483</td>
              <td>+25.784</td>
              <td>+26.122</td>
              <td>+25.692</td>
              <td>+27.289</td>
              <td>+28.879</td>
              <td>+29.303</td>
              <td>+31.008</td>
              <td className="diff">+32.214</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="MX" height={0} countryCode="mx" value="MX" />
                {' '}
                7 Helena
                {' '}
              </th>
              <td>+8.777</td>
              <td>+14.041</td>
              <td>+19.990</td>
              <td>+23.217</td>
              <td>+25.050</td>
              <td>+28.626</td>
              <td>+30.856</td>
              <td>+32.220</td>
              <td>+33.741</td>
              <td className="diff">+37.440</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="lap_times">
        <table>
          <tbody>
            <tr className="heading">
              <th>Name</th>
              <th>Grid</th>
              <th>Lap 1</th>
              <th>Lap 2</th>
              <th>Lap 3</th>
              <th>Lap 4</th>
              <th>Lap 5</th>
              <th>Lap 6</th>
              <th>Lap 7</th>
              <th>Lap 8</th>
              <th>Lap 9</th>
              <th>Finish</th>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="FI" height={0} countryCode="fi" value="FI" />
                {' '}
                1 Teemo
                {' '}
              </th>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
              <td className="position">1</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="GB" height={0} countryCode="gb" value="GB" />
                {' '}
                2 Simon
                {' '}
              </th>
              <td>4</td>
              <td><span className="lost">5</span></td>
              <td><span className="gained">3</span></td>
              <td>3</td>
              <td>3</td>
              <td><span className="gained">2</span></td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td className="position"><span className="gained">2</span></td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="CH" height={0} countryCode="ch" value="CH" />
                {' '}
                3 Julien
                {' '}
              </th>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td>2</td>
              <td><span className="lost">3</span></td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td>3</td>
              <td className="position"><span className="lost">3</span></td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="CH" height={0} countryCode="ch" value="CH" />
                {' '}
                4 Steven
                {' '}
              </th>
              <td>5</td>
              <td><span className="gained">3</span></td>
              <td><span className="lost">4</span></td>
              <td>4</td>
              <td>4</td>
              <td>4</td>
              <td>4</td>
              <td>4</td>
              <td>4</td>
              <td>4</td>
              <td className="position"><span className="gained">4</span></td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="EC" height={0} countryCode="ec" value="EC" />
                {' '}
                5 David
                {' '}
              </th>
              <td>3</td>
              <td><span className="lost">4</span></td>
              <td><span className="lost">6</span></td>
              <td>6</td>
              <td>6</td>
              <td><span className="gained">5</span></td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td>5</td>
              <td className="position"><span className="lost">5</span></td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="AT" height={0} countryCode="at" value="AT" />
                {' '}
                6 Dinyar
                {' '}
              </th>
              <td>6</td>
              <td><span className="lost">7</span></td>
              <td>7</td>
              <td>7</td>
              <td>7</td>
              <td>7</td>
              <td><span className="gained">6</span></td>
              <td>6</td>
              <td>6</td>
              <td>6</td>
              <td className="position">6</td>
            </tr>
            <tr>
              <th>
                <CircleFlag data-tip="MX" height={0} countryCode="mx" value="MX" />
                {' '}
                7 Helena
                {' '}
              </th>
              <td>7</td>
              <td><span className="gained">6</span></td>
              <td><span className="gained">5</span></td>
              <td>5</td>
              <td>5</td>
              <td><span className="lost">6</span></td>
              <td><span className="lost">7</span></td>
              <td>7</td>
              <td>7</td>
              <td>7</td>
              <td className="position">7</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="meta">
        <div>
          <span className="gained">Gained position</span>
          {' '}
          <span className="lost">Lost position</span>
        </div>
        <div>
          <strong>Starting positions, change</strong>
          <br />
          1 Teemo, +-
          <br />
          2 Julien, -1
          <br />
          3 David, -2
          <br />
          4 Simon, +2
          <br />
          5 Steven, +1
          <br />
          6 Dinyar, +-
          <br />
          7 Helena, +-
          <br />
        </div>
        <div><img alt="Race track" src="http://karting.teelmo.info/img/track.png" /></div>
        <div>
          <strong>Length</strong>
          {' '}
          640 meters |
          {' '}
          <strong>Width</strong>
          {' '}
          7–8 meters |
          {' '}
          <strong>Topping</strong>
          {' '}
          Asphalt |
          {' '}
          <strong>Layout</strong>
          {' '}
          Marc Surrer 1999
        </div>
      </div>
    </div>
  );
}
export default App;
