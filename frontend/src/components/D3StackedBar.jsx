import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#6c63ff', 
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function D3StackedBar({ data, categories, width = 600, height = 350 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0 || !categories || categories.length === 0) return;

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

    // Format Data
    const formattedData = data.map(d => {
      const parsed = { period: d.period };
      categories.forEach(c => {
        parsed[c] = parseFloat(d[c] || 0);
      });
      return parsed;
    });

    const stack = d3.stack().keys(categories)(formattedData);

    const xScale = d3.scaleBand()
      .domain(formattedData.map(d => d.period))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(stack, layer => d3.max(layer, d => d[1])) * 1.1])
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(categories)
      .range(COLORS);

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

    // Draw layers
    const layer = g.selectAll('.layer')
      .data(stack)
      .enter().append('g')
      .attr('class', 'layer')
      .style('fill', d => colorScale(d.key));

    layer.selectAll('rect')
      .data(d => d)
      .enter().append('rect')
      .attr('x', d => xScale(d.data.period))
      .attr('y', innerHeight) // start at bottom
      .attr('height', 0)
      .attr('width', xScale.bandwidth())
      .on('mouseover', function(event, d) {
        // Find category from parent node's data
        const category = d3.select(this.parentNode).datum().key;
        const val = d[1] - d[0];
        
        d3.selectAll('.layer').style('opacity', 0.3);
        d3.select(this.parentNode).style('opacity', 1);
        
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold;">${d.data.period}</div>
            <div style="color: ${colorScale(category)};">${category}</div>
            <div>₹${val.toLocaleString('en-IN')}</div>
          `)
          .style('top', `${y - 60}px`)
          .style('left', `${x + 15}px`);
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('top', `${y - 60}px`).style('left', `${x + 15}px`);
      })
      .on('mouseout', function() {
        d3.selectAll('.layer').style('opacity', 1);
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]));

    return () => {
      if (wrapperRef.current) d3.select(wrapperRef.current).selectAll('div').remove();
    };
  }, [data, categories, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
