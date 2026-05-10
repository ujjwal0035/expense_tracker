import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';

export default function D3TrendLine({ data, width = 600, height = 350 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    if (containerWidth === 0 || containerHeight === 0) return;

    const margin = { top: 20, right: 30, left: 60, bottom: 40 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'visible');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // The period could be a date string "YYYY-MM-DD" or something else depending on group_by
    // We treat it as categorical ordinal if it's not a standard date, or we try to parse it.
    // Given group_by can be day, week, month, quarter, year, we will use a point scale.
    const xScale = d3.scalePoint()
      .domain(data.map(d => d.month || d.period))
      .range([0, innerWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => parseFloat(d.total)) * 1.1])
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `₹${d}`))
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif');

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''))
      .style('stroke', isDarkMode ? '#334155' : '#e2e8f0')
      .style('stroke-opacity', 0.5)
      .selectAll('line').style('stroke-dasharray', '3,3');

    // Line generator
    const line = d3.line()
      .x(d => xScale(d.month || d.period))
      .y(d => yScale(parseFloat(d.total)))
      .curve(d3.curveMonotoneX);

    // Area generator for gradient
    const area = d3.area()
      .x(d => xScale(d.month || d.period))
      .y0(innerHeight)
      .y1(d => yScale(parseFloat(d.total)))
      .curve(d3.curveMonotoneX);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'trend-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#6c63ff').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#6c63ff').attr('stop-opacity', 0);

    // Draw Area
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#trend-gradient)')
      .attr('d', area)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    // Draw Line
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6c63ff')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Line Animation
    const totalLength = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Tooltip
    const tooltip = d3.select(wrapperRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', isDarkMode ? '#1e293b' : '#ffffff')
      .style('color', isDarkMode ? '#f8fafc' : '#1e293b')
      .style('border', isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 6px -1px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('font-family', 'Inter, sans-serif')
      .style('z-index', 10);

    // Points
    g.selectAll('.point')
      .data(data)
      .enter().append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.month || d.period))
      .attr('cy', d => yScale(parseFloat(d.total)))
      .attr('r', 5)
      .attr('fill', isDarkMode ? '#1e293b' : '#ffffff')
      .attr('stroke', '#6c63ff')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 8).style('fill', '#6c63ff');
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold;">${d.month || d.period}</div>
            <div style="color: #6c63ff;">₹${parseFloat(d.total).toLocaleString('en-IN')}</div>
          `)
          .style('top', `${y - 60}px`)
          .style('left', `${x + 15}px`);
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('top', `${y - 60}px`).style('left', `${x + 15}px`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 5).style('fill', isDarkMode ? '#1e293b' : '#ffffff');
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .delay(1500) // appear after line is drawn
      .duration(500)
      .style('opacity', 1);

    return () => {
      if (wrapperRef.current) d3.select(wrapperRef.current).selectAll('div').remove();
    };
  }, [data, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
