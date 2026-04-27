import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function D3Sunburst({ data, width = 600, height = 600 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    if (containerWidth === 0 || containerHeight === 0) return;

    const radius = Math.min(containerWidth, containerHeight) / 2;

    // Build Hierarchy Data structure
    // Group expenses by Category
    const grouped = d3.group(data, d => d.category);
    
    const hierarchyData = {
      name: "Total Expenses",
      children: Array.from(grouped, ([category, expenses]) => ({
        name: category,
        children: expenses.map(e => ({
          name: e.description || "Misc",
          value: parseFloat(e.amount),
          date: e.expense_date
        }))
      }))
    };

    const root = d3.hierarchy(hierarchyData)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    // Create Partition
    const partition = d3.partition()
      .size([2 * Math.PI, radius]);

    partition(root);

    // Arc generator
    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1)
      .padAngle(0.01)
      .padRadius(radius / 2);

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'hidden');

    const g = svg.append('g')
      .attr('transform', `translate(${containerWidth / 2},${containerHeight / 2})`);

    const color = d3.scaleOrdinal(COLORS);

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

    // Draw arcs
    const path = g.selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .enter().append('path')
      .attr('fill', d => {
        // Parent color for children
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr('fill-opacity', d => d.depth === 1 ? 0.8 : 0.6)
      .attr('d', arc)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 0.8).attr('fill-opacity', 1);
        
        const [x, y] = d3.pointer(event, wrapperRef.current);
        
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: 600;">${d.data.name}</div>
            <div style="color: ${isDarkMode ? '#94a3b8' : '#64748b'}; font-weight: bold;">
              ₹${d.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            ${d.data.date ? `<div style="font-size: 10px;">${d.data.date}</div>` : ''}
          `)
          .style('top', `${y - 60}px`)
          .style('left', `${x + 15}px`);
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('top', `${y - 60}px`).style('left', `${x + 15}px`);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .style('opacity', 1)
          .attr('fill-opacity', d.depth === 1 ? 0.8 : 0.6);
        tooltip.style('visibility', 'hidden');
      })
      .on('click', clicked);

    // Center text (total)
    const centerText = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('fill', isDarkMode ? '#f8fafc' : '#1e293b')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Total');

    const centerValue = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('fill', '#6c63ff')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(`₹${root.value.toLocaleString('en-IN')}`);

    // Add labels
    const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().filter(d => d.depth === 1 && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
      .enter().append("text")
      .attr("transform", function(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text(d => d.data.name.substring(0, 10));

    // Drill down animation function
    function clicked(event, p) {
      // Update central text to show what is clicked
      centerText.text(p.data.name);
      centerValue.text(`₹${p.value.toLocaleString('en-IN')}`);

      const transition = svg.transition().duration(750);

      path.transition(transition)
        .tween("data", d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
        .filter(function(d) {
          return +this.getAttribute("fill-opacity") || Math.max(0, Math.min(1, (d.target.y1 - p.y0) / (radius - p.y0))) > 0.001;
        })
        .attrTween("d", d => () => arc(d.current));

      // This part re-calculates the layout based on the clicked node
      root.each(d => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.y0),
        y1: Math.max(0, d.y1 - p.y0)
      });
      
      path.transition(transition)
        .tween("data", d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
        .attrTween("d", d => () => arc(d.current));

      // Labels opacity
      label.transition(transition).style("opacity", d => d.x0 >= p.x0 && d.x1 <= p.x1 ? 1 : 0);
    }
    
    // Initialize current states
    root.each(d => d.current = d);

    return () => {
      if (wrapperRef.current) {
        d3.select(wrapperRef.current).selectAll('div').remove();
      }
    };
  }, [data, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
