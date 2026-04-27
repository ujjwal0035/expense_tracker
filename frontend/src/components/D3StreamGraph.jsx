import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function D3StreamGraph({ data, categories, width = 800, height = 400 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0 || !categories || categories.length === 0) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Use wrapper's dimensions if available for responsiveness
    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    const margin = { top: 20, right: 30, left: 50, bottom: 30 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'visible');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseDate = (period) => {
      // Check if it's year-month, year-month-day, etc.
      if (period.length === 7) return d3.timeParse('%Y-%m')(period);
      if (period.length === 10) return d3.timeParse('%Y-%m-%d')(period);
      if (period.length === 4) return d3.timeParse('%Y')(period);
      // Fallback
      return new Date(period);
    };

    const formattedData = data.map(d => {
      const obj = { date: parseDate(d.period), period: d.period };
      categories.forEach(c => {
        obj[c] = d[c] || 0;
      });
      return obj;
    }).sort((a, b) => a.date - b.date);

    // Stack the data
    const stack = d3.stack()
      .keys(categories)
      .offset(d3.stackOffsetWiggle) // This makes it a Streamgraph instead of a standard stacked area
      .order(d3.stackOrderInsideOut);
      
    const series = stack(formattedData);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(formattedData, d => d.date))
      .range([0, innerWidth]);

    const yMax = d3.max(series, d => d3.max(d, d1 => d1[1]));
    const yMin = d3.min(series, d => d3.min(d, d1 => d1[0]));

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(categories)
      .range(COLORS);

    // Area generator
    const area = d3.area()
      .x(d => xScale(d.data.date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveMonotoneX); // Smooth curves

    // Tooltip
    const tooltip = d3.select(wrapperRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', isDarkMode ? '#1e293b' : '#ffffff')
      .style('color', isDarkMode ? '#f8fafc' : '#1e293b')
      .style('border', isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0')
      .style('padding', '10px 14px')
      .style('border-radius', '12px')
      .style('box-shadow', '0 10px 15px -3px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('font-family', 'Inter, sans-serif')
      .style('z-index', 10);

    // Draw areas
    g.selectAll('.layer')
      .data(series)
      .enter()
      .append('path')
      .attr('class', 'layer')
      .attr('d', area)
      .style('fill', d => colorScale(d.key))
      .style('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.selectAll('.layer').style('opacity', 0.2);
        d3.select(this).style('opacity', 1).attr('stroke', isDarkMode ? '#ffffff' : '#000000').attr('stroke-width', 1);
        
        tooltip.style('visibility', 'visible')
          .html(`<div style="font-weight: 600;">${d.key}</div>`);
      })
      .on('mousemove', function(event, d) {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        
        // Find corresponding data point based on x position
        const invertedX = xScale.invert(d3.pointer(event, svgRef.current)[0] - margin.left);
        const bisectDate = d3.bisector(point => point.date).left;
        const i = bisectDate(formattedData, invertedX, 1);
        const d0 = formattedData[i - 1];
        const d1 = formattedData[i];
        
        let pointData = null;
        if (d0 && d1) {
          pointData = invertedX - d0.date > d1.date - invertedX ? d1 : d0;
        } else {
          pointData = d0 || d1;
        }

        if (pointData) {
          const value = pointData[d.key];
          tooltip.html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${d.key}</div>
            <div style="color: ${colorScale(d.key)}; font-weight: bold;">₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 12px; color: ${isDarkMode ? '#94a3b8' : '#64748b'}; margin-top: 2px;">Period: ${pointData.period}</div>
          `);
        }

        tooltip.style('top', `${y - 80}px`).style('left', `${x + 15}px`);
      })
      .on('mouseout', function(event, d) {
        d3.selectAll('.layer').style('opacity', 0.8);
        d3.select(this).attr('stroke', 'none');
        tooltip.style('visibility', 'hidden');
      });

    // Add X Axis (Bottom)
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif');

    // Remove Y Axis since Streamgraph Y-values are relative/stacked off-center
    // Just add a line at y=0 or leave it purely aesthetic

    // Cleanup
    return () => {
      if (wrapperRef.current) {
         d3.select(wrapperRef.current).selectAll('div').remove();
      }
    };
  }, [data, categories, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
