import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#10b981', '#f59e0b', '#6c63ff', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function D3PieChart({ data, width = 400, height = 350 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    if (containerWidth === 0 || containerHeight === 0) return;

    const margin = 20;
    const radius = Math.min(containerWidth, containerHeight) / 2 - margin;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'visible');

    const g = svg.append('g')
      .attr('transform', `translate(${containerWidth / 2},${containerHeight / 2})`);

    const colorScale = d3.scaleOrdinal(COLORS);

    const pie = d3.pie()
      .value(d => d.total)
      .sort(null); // Keep original sort or sort by total

    const arc = d3.arc()
      .innerRadius(radius * 0.5) // Donut chart
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 1.05); // Expand on hover

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

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => colorScale(i))
      .attr('stroke', isDarkMode ? '#1e293b' : '#ffffff')
      .style('stroke-width', '2px')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover)
          .style('filter', 'brightness(1.1)');
          
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold;">${d.data.category}</div>
            <div style="color: ${colorScale(d.index)};">₹${d.data.total.toLocaleString('en-IN')}</div>
            <div style="font-size: 11px; color: ${isDarkMode ? '#94a3b8' : '#64748b'};">${d.data.percentage}%</div>
          `)
          .style('top', `${y - 60}px`)
          .style('left', `${x + 15}px`);
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('top', `${y - 60}px`).style('left', `${x + 15}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc)
          .style('filter', 'none');
        tooltip.style('visibility', 'hidden');
      })
      // Entry Animation
      .transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
        return function(t) {
          d.endAngle = i(t);
          return arc(d);
        };
      });

    // Center Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('fill', isDarkMode ? '#94a3b8' : '#64748b')
      .style('font-size', '12px')
      .text('Total');

    const total = d3.sum(data, d => d.total);
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('fill', isDarkMode ? '#f8fafc' : '#1e293b')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`₹${total.toLocaleString('en-IN')}`);

    return () => {
      if (wrapperRef.current) d3.select(wrapperRef.current).selectAll('div').remove();
    };
  }, [data, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
