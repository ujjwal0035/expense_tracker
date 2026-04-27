import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#f59e0b', '#10b981', '#6c63ff', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function D3BarChart({ data, width = 600, height = 350 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    if (containerWidth === 0 || containerHeight === 0) return;

    const margin = { top: 20, right: 30, left: 60, bottom: 80 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'visible');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) * 1.1])
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .style('font-family', 'Inter, sans-serif');

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

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.category))
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight) // start at bottom for animation
      .attr('height', 0)
      .attr('fill', (d, i) => COLORS[i % COLORS.length])
      .attr('rx', 4)
      .attr('ry', 4)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 0.8);
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold;">${d.category}</div>
            <div style="color: #6c63ff;">₹${d.total.toLocaleString('en-IN')}</div>
          `)
          .style('top', `${y - 60}px`)
          .style('left', `${x + 15}px`);
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('top', `${y - 60}px`).style('left', `${x + 15}px`);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1);
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr('y', d => yScale(d.total))
      .attr('height', d => innerHeight - yScale(d.total));

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
