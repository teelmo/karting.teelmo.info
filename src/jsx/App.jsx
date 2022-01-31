import React, {Component} from 'react';
import style from './../styles/styles.less';

// https://d3js.org/
import * as d3 from 'd3';

let interval1,
    interval2;

const simon_color = '#CF081F';
const teemo_color = '#000000';
let animation_done = false;
let raw_data;

const title = '<h1>Olten GP</h1>';

const max_y_axis_value = 90,
      max_y_axis_step = 5,
      title_offset = 1,
      first_driver = '<h3 class="' + style.redbull + '"><span class="' + style.position + '">1</span><span class="' + style.name + '">Teemo</span><span class="' + style.team + '">Porcha</span></h3>',
      second_driver = '<h3 class="' + style.mercedes + '"><span class="' + style.position + '">2</span><span class="' + style.name + '">Simon</span><span class="' + style.team + '">Rolls Royce</span></h3>',
      title_html = '<div class="' + style.title_container + '">' + title + '<div>' + first_driver + '</div><div>' + second_driver + '</div></div>',
      races = ['First Lap','Lap 2','Lap 3','Lap 4','Lap 5','Lap 6','Lap 7','Lap 8','Lap 9','Final Lap'];

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
    }
  }
  componentDidMount() {
    setTimeout(() => {
      this.createChart();
    }, 1000);
  }
  componentDidUpdate(prevProps, prevState, snapshot) {

  }
  componentWillUnMount() {
    clearInterval(interval1);
    clearInterval(interval2);
  }
  createChart() {
    const width = 600,
          height = 600,
          adj = 50;

    const div = d3.select('.' + style.app)
      .append('div')
      .attr('class', style.tooltip)
      .style('opacity', 0);

    // We are appending SVG first.
    const svg = d3.select('.' + style.chart_container).append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '-' + adj + ' -' + adj + ' ' + (width + adj * 3) + ' ' + (height + adj * 3))
      .classed('svg-content', true);

    // Fetch the data.
    d3.csv('./data/Karting - data.csv').then((data) => {
      let raw_data = data;
      let data_points = [];
      let slices = data.map((values, i) => {
        return {
          color:(i === 0) ? teemo_color : (i === 1) ? simon_color : 'rgba(0, 0, 0, 0.1)',
          current_pos:i + 1,
          highlighted:(i < 2) ? true : false,
          name:values.name,
          values:races.map((race, j) => {
            let max = d3.max(data, (d) => +d[race]);
            if (race !== '') {
              data_points.push({
                color:(i === 0) ? teemo_color : (i === 1) ? simon_color : 'rgba(0, 0, 0, 0.1)',
                name:values.name,
                dot_line_class:'dot_line_' + i,
                highlighted:(i < 2) ? true : false,
                position:(parseFloat(values[race]) >= max) ? 'top' : (i >= 1) ? 'top' : 'bottom',
                x:j,
                y:+values[race]
              });
            }
            return {
              points:(values[race]) ? +values[race] : 0,
              race:race
            }
          })
        }
      });

      // Prepare the initial data and store the rest for later use.
      let to_be_added_slices = {};
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
      const make_y_gridlines = () => d3.axisLeft(yScale).ticks(parseInt(max_y_axis_value / max_y_axis_step) - 1).tickValues(d3.range(50, max_y_axis_value - 5, max_y_axis_step));
      // Add the Y gridlines
      svg.append('g')
        .attr('class', style.grid)
        .call(make_y_gridlines()
          .tickSize(-width - 20)
          .tickFormat('')
        );

      // Grid Axes.
      svg.append('g')
        .attr('class', style.axis + ' ' + style.xaxis)
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom()
          .ticks(races.length - 1)
          .tickFormat(i => races[i])
          .scale(xScale));

      svg.append('g')
        .attr('class', style.axis + ' ' + style.yaxis)
        .call(d3.axisLeft()
          .ticks(parseInt(max_y_axis_value / max_y_axis_step))
          .tickValues(d3.range(0, max_y_axis_value + max_y_axis_step, max_y_axis_step))
          .scale(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('dy', '1em')
        .attr('y', -25)
        .attr('x', -10)
        .style('text-anchor', 'end')
        .text('Seconds');

      // Create the lines with current data.
      const lines = svg.selectAll('lines').data(slices).enter().append('g');
      const line = d3.line()
        .x((d, i) => xScale(i))
        .y((d, i) => yScale(d.points));
      const updateData = () => {
        // Remove any old lines.
        svg.selectAll('.' + style.line).remove();

        // Add the lines.
        lines.append('path')
          .attr('class', (d, i) => style.line + ' line_' + i)
          .attr('stroke', (d) => d.color)
          .attr('stroke-width', (d) => (d.highlighted === true) ? '4px': '1px')
          .attr('d', (d) => line(d.values))
          .on('mouseover', (event, d) => {
            if (d.highlighted === true && animation_done === true) {
              d3.selectAll('.' + style.dot_text + '.dot_line_0, .' + style.dot_text + '.dot_line_1')
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
              this.activateLine('line_' + i, slices[i], div);
              if (i > 2) {
                this.deactivateLine('line_' + (i - 1), slices[i], div, false);
              }
              i++;
              if (i >= slices.length ) {
                clearInterval(interval2)
                setTimeout(() => {
                  this.deactivateLine('line_' + (i - 1), slices[i], div, true, false);
                  setTimeout(() => {
                    d3.selectAll('.' + style.dot_text + '.dot_line_0, .' + style.dot_text + '.dot_line_1')
                      .style('font-size', '9pt');
                    this.createInteractiveLayer(svg, line, slices, div);
                  }, 1000); // Wait before creating the interactivity layer.
                }, 1500); // Wait before hiding the last driver
              }
            }, 1500);  // Wait between activating each line.
          }, 2000); // Wait before showing the lines.
        }
      }, 750); // Wait between showing each race.
      
      // Add dots.
      svg.selectAll('.' + style.dot)
        .data(data_points)
        .enter().append('circle')
        .attr('class', (d) => style.dot + ' ' + d.dot_line_class)
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('fill', (d) => d.color)
        .attr('r', (d) => (d.highlighted === true) ? 6 : 2)
        .on('mouseover', (event, d) => {
          if (d.highlighted === true && animation_done === true) {
            d3.selectAll('.' + style.dot_text + '.dot_line_0, .' + style.dot_text + '.dot_line_1')
              .style('font-size', '9pt');
          }
        });

      // Add dot texts.
      let position_offset = 2;
      svg.selectAll('.' + style.dot_text)
        .data(data_points)
        .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('x', (d) => xScale(d.x))
        .attr('y', (d) => (d.position === 'top') ? yScale(d.y + position_offset) : yScale(d.y - position_offset))
        .style('font-weight', (d, i) => (d.highlighted === true) ? 600 : 400)
        .style('font-size', (d, i) => (d.highlighted === true) ? '9pt' : 0)
        .attr('class', (d) => style.dot_text + ' ' + d.dot_line_class)
        .text((d, i) => (d.name === 'Teemo') ? d.y : '+' + (parseFloat(d.y) - parseFloat(raw_data[0][races[d.x]])).toFixed(3));

      svg.append('foreignObject')
        .attr('alignment-baseline', 'central')
        .attr('height', 200)
        .attr('text-anchor', 'middle')
        .attr('width', 450)
        .attr('x', xScale(0.7))
        .attr('y', yScale(max_y_axis_value - title_offset))
        .html(title_html);
    });
  }
  activateLine(line_id, d, div) {
    d3.select('.' + line_id)
      .attr('stroke', '#000')
      .attr('stroke-width', '2px');
    d3.selectAll('.' + style.dot + '.dot_' + line_id)
      .attr('r', 4)
      .attr('fill', '#000');
    d3.selectAll('.' + style.dot_text)
      .style('font-size', 0)
    d3.selectAll('.' + style.dot_text + '.dot_' + line_id)
      .style('font-size', '10pt');
    div.transition()
      .duration(0)
      .style('opacity', .9);

    let left = (event && event.pageX) ? (event.pageX + 15) + 'px' : (d3.selectAll('.' + style.dot + '.dot_' + line_id).nodes()[races.length - 4].getBoundingClientRect().x) + 'px';
    let top = (event && event.pageY) ? (event.pageY - 20) + 'px' : (d3.selectAll('.' + style.dot + '.dot_' + line_id).nodes()[races.length - 4].getBoundingClientRect().y + 20) + 'px';

    div.html(d.current_pos + ' <span class="' + style.tooltip_name + '">' + d.name + '</span>')
      .style('left', left)
      .style('top', top);
  }
  deactivateLine(line_id, d, div, deactive_tooltip = true, tooltip_delay = true) {
      d3.select('.' + line_id)
        .attr('stroke', 'rgba(0, 0, 0, 0.1)')
        .attr('stroke-width', '1px');
      d3.selectAll('.' + style.dot + '.dot_' + line_id)
        .attr('r', 2)
        .attr('fill', 'rgba(0, 0, 0, 0.1)');
      d3.selectAll('.' + style.dot_text + '.dot_' + line_id)
        .style('font-size', 0)
      if (deactive_tooltip === true) {
        if (tooltip_delay === true) {
          div.transition()
            .delay(200)
            .duration(500)
            .style('opacity', 0);
        }
        else {
          div.style('opacity', 0);
        }
      }
  }
  createInteractiveLayer(svg, line, slices, div) {
    animation_done = true;
    svg.selectAll('lines_interactivity').data(slices).enter().append('g').append('path')
      .attr('class', style.line_interactivity)
      .attr('data-line-id', (d, i) => 'line_' + i)
      .attr('stroke', (d) => 'transparent')
      .attr('stroke-opacity', (d) => 1)
      .attr('stroke-width', (d) => (d.highlighted === true) ? '0': '10px')
      .attr('d', (d) => line(d.values))
      .on('mouseover', (event, d) => this.activateLine(d3.select(event.currentTarget).attr('data-line-id'), d, div))
      .on('mouseout', (event, d) => this.deactivateLine(d3.select(event.currentTarget).attr('data-line-id'), d, div));
  }
  // shouldComponentUpdate(nextProps, nextState) {}
  // static getDerivedStateFromProps(props, state) {}
  // getSnapshotBeforeUpdate(prevProps, prevState) {}
  // static getDerivedStateFromError(error) {}
  // componentDidCatch() {}
  render() {
    return (
      <div className={style.app}>
        <div className={style.chart_container}></div>
        <div className={style.lap_times}>
          <table>
            <thead>
              <tr><th>Name</th><th>Lap 1</th><th>Lap 2</th><th>Lap 3</th><th>Lap 4</th><th>Lap 5</th><th>Lap 6</th><th>Lap 7</th><th>Lap 8</th><th>Lap 9</th><th>Lap 10</th></tr>
            </thead>
            <tbody>
              <tr><th>1 Teemo</th><td>53.701</td><td>51.889</td><td>50.781</td><td>50.529</td><td>51.353</td><td>50.738</td><td>50.441</td><td>50.853</td><td>50.842</td><td><span className={style.best}>49.806</span></td></tr>
              <tr><th>2 Simon</th><td>56.069</td><td>52.965</td><td>50.228</td><td>51.548</td><td>50.260</td><td><span className={style.best}>49.301</span></td><td>49.583</td><td>49.689</td><td>50.910</td><td>51.740</td></tr>
              <tr><th>3 Julien</th><td> 55.448</td><td>52.238</td><td>51.679</td><td>51.690</td><td>56.111</td><td>50.969</td><td>50.678</td><td>50.776</td><td><span className={style.best}>50.308</span></td><td>50.562</td></tr>
              <tr><th>4 Steven</th><td> 54.563</td><td>57.478</td><td>50.643</td><td>57.761</td><td>51.876</td><td>51.303</td><td>50.846</td><td>50.821</td><td>51.61</td><td><span className={style.best}>50.437</span></td></tr>
              <tr><th>5 David</th><td>55.476</td><td>72.458</td><td>50.903</td><td><span className={style.best}>50.549</span></td><td>50.983</td><td>50.973</td><td>50.906</td><td>51.480</td><td>51.715</td><td>51.16</td></tr>
              <tr><th>6 Dinyar</th><td>74.186</td><td>54.430</td><td>52.082</td><td><span className={style.best}>50.867</span></td><td>50.923</td><td>52.335</td><td>52.031</td><td>51.277</td><td>52.547</td><td>51.012</td></tr>
              <tr><th>7 Helena</th><td>60.051</td><td>57.153</td><td>56.73</td><td>53.756</td><td>53.186</td><td>54.314</td><td>52.671</td><td><span className={style.best}>52.217</span></td><td>52.363</td><td>53.505</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
export default App;