import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';

export default function D3ZoomTimeSeries({ data, width = 800, height = 400 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    if (containerWidth === 0 || containerHeight === 0) return;

    // Define margins for both the main chart (focus) and the brush chart (context)
    const margin = { top: 20, right: 20, bottom: 110, left: 60 };
    const margin2 = { top: containerHeight - 70, right: 20, bottom: 30, left: 60 };
    
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = containerHeight - margin.top - margin.bottom;
    const innerHeight2 = containerHeight - margin2.top - margin2.bottom;

    // Parse Data
    const parseDate = d3.timeParse('%Y-%m-%d');
    const formattedData = data.map(d => ({
      date: parseDate(d.date || d.period),
      rawDate: d.date || d.period,
      total: parseFloat(d.total)
    })).filter(d => d.date !== null && !isNaN(d.total))
      .sort((a, b) => a.date - b.date);

    if (formattedData.length === 0) return;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'hidden');

    // Scales
    const x = d3.scaleTime().range([0, innerWidth]).domain(d3.extent(formattedData, d => d.date));
    const x2 = d3.scaleTime().range([0, innerWidth]).domain(x.domain());
    const y = d3.scaleLinear().range([innerHeight, 0]).domain([0, d3.max(formattedData, d => d.total) * 1.1]);
    const y2 = d3.scaleLinear().range([innerHeight2, 0]).domain(y.domain());

    // Axes
    const xAxis = d3.axisBottom(x);
    const xAxis2 = d3.axisBottom(x2);
    const yAxis = d3.axisLeft(y).tickFormat(d => `₹${d}`);

    // Brush and Zoom
    const brush = d3.brushX()
      .extent([[0, 0], [innerWidth, innerHeight2]])
      .on('brush end', brushed);

    const zoom = d3.zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([[0, 0], [innerWidth, innerHeight]])
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on('zoom', zoomed);

    // Area Generators
    const area = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.date))
      .y0(innerHeight)
      .y1(d => y(d.total));

    const area2 = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => x2(d.date))
      .y0(innerHeight2)
      .y1(d => y2(d.total));

    // Clip path
    svg.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Gradient
    const defs = svg.select('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'zoom-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#6c63ff').attr('stop-opacity', 0.6);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#6c63ff').attr('stop-opacity', 0.0);

    // Main Chart (Focus)
    const focus = svg.append('g')
      .attr('class', 'focus')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gridlines
    focus.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(''))
      .style('stroke', isDarkMode ? '#334155' : '#e2e8f0')
      .style('stroke-opacity', 0.2)
      .selectAll('line').style('stroke-dasharray', '3,3');

    const focusArea = focus.append('path')
      .datum(formattedData)
      .attr('class', 'area')
      .attr('fill', 'url(#zoom-area-gradient)')
      .attr('stroke', '#6c63ff')
      .attr('stroke-width', 2)
      .attr('clip-path', 'url(#clip)')
      .attr('d', area);

    const focusXAxis = focus.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b');

    focus.append('g')
      .attr('class', 'axis axis--y')
      .call(yAxis)
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b');

    // Mini Chart (Context)
    const context = svg.append('g')
      .attr('class', 'context')
      .attr('transform', `translate(${margin2.left},${margin2.top})`);

    context.append('path')
      .datum(formattedData)
      .attr('class', 'area')
      .attr('fill', isDarkMode ? '#475569' : '#cbd5e1')
      .attr('d', area2);

    context.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${innerHeight2})`)
      .call(xAxis2)
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b');

    const brushGroup = context.append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move, x.range()); // Initial brush covers everything

    // Rect for zoom interactions on main chart
    svg.append('rect')
      .attr('class', 'zoom')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .call(zoom);

    function brushed(event) {
      if (event.sourceEvent && event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
      const s = event.selection || x2.range();
      x.domain(s.map(x2.invert, x2));
      focusArea.attr('d', area);
      focusXAxis.call(xAxis);
      svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
        .scale(innerWidth / (s[1] - s[0]))
        .translate(-s[0], 0));
    }

    function zoomed(event) {
      if (event.sourceEvent && event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
      const t = event.transform;
      x.domain(t.rescaleX(x2).domain());
      focusArea.attr('d', area);
      focusXAxis.call(xAxis);
      brushGroup.call(brush.move, x.range().map(t.invertX, t));
    }

  }, [data, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
