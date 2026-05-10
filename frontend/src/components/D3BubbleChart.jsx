import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function D3BubbleChart({ data, width = 800, height = 600 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous SVG content to avoid duplicates on re-render
    d3.select(svgRef.current).selectAll('*').remove();

    // Use wrapper's dimensions if available for responsiveness
    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'visible');

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Define a scale for the radius based on the "total" amount
    const maxTotal = d3.max(data, d => parseFloat(d.total)) || 0;
    
    // Determine scale bounds
    const minRadius = 30;
    const maxRadius = Math.min(containerWidth, containerHeight) / 5;
    
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxTotal])
      .range([minRadius, maxRadius]);

    // Create a color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.category))
      .range(COLORS);

    // Create tooltip div
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

    // Initialize nodes with data
    const nodes = data.map((d) => ({
      ...d,
      r: radiusScale(parseFloat(d.total)),
      x: centerX + (Math.random() - 0.5) * 100, // starting position
      y: centerY + (Math.random() - 0.5) * 100
    }));

    // Define physics simulation
    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(5)) // Nodes slightly repel each other at their core
      .force('center', d3.forceCenter(centerX, centerY).strength(0.05)) // Pull to center
      .force('collision', d3.forceCollide().radius(d => d.r + 3).iterations(3)) // Prevent overlap
      .force('x', d3.forceX(centerX).strength(0.02)) // Gentle pull to middle horizontally
      .force('y', d3.forceY(centerY).strength(0.02)); // Gentle pull to middle vertically

    // Create a group for the nodes
    const nodeGroup = svg.append('g');

    // Add nodes
    const node = nodeGroup.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag() // Add drag interaction
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles
    const circles = node.append('circle')
      .attr('r', 0) // Start at 0 for entrance animation
      .attr('fill', d => colorScale(d.category))
      .attr('stroke', isDarkMode ? '#1e293b' : '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'grab');
      
    // Transition entrance
    circles.transition()
      .duration(1000)
      .attr('r', d => d.r)
      .ease(d3.easeElasticOut);

    // Add interactivity
    node.on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.r + 5)
          .attr('filter', 'brightness(1.1)');
          
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${d.category}</div>
            <div style="color: #6c63ff; font-weight: bold;">₹${parseFloat(d.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 12px; color: ${isDarkMode ? '#94a3b8' : '#64748b'}; margin-top: 2px;">${d.percentage}% of total</div>
          `);
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('top', `${y - 80}px`).style('left', `${x + 15}px`);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.r)
          .attr('filter', null);
          
        tooltip.style('visibility', 'hidden');
      });

    // Add text labels inside bubbles
    node.append('text')
      .text(d => d.category.length > 10 ? d.category.substring(0, 8) + '...' : d.category)
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('fill', '#ffffff')
      .style('font-size', d => Math.min(d.r / 3, 14) + 'px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .style('opacity', 0) // Start hidden
      .transition()
      .delay(800)
      .duration(500)
      .style('opacity', d => d.r > 20 ? 1 : 0); // Only show text if bubble is large enough

    node.append('text')
      .text(d => `${d.percentage}%`)
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('fill', 'rgba(255, 255, 255, 0.8)')
      .style('font-size', d => Math.min(d.r / 4, 12) + 'px')
      .style('font-weight', '500')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style('opacity', d => d.r > 30 ? 1 : 0);

    // Update positions on each tick of the simulation
    simulation.on('tick', () => {
      // Keep nodes within bounds
      nodes.forEach(d => {
        d.x = Math.max(d.r, Math.min(containerWidth - d.r, d.x));
        d.y = Math.max(d.r, Math.min(containerHeight - d.r, d.y));
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions for interaction
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).select('circle').style('cursor', 'grabbing');
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
      // Re-position tooltip immediately during drag if visible
      if (tooltip.style('visibility') === 'visible') {
        const [x, y] = d3.pointer(event, wrapperRef.current);
        tooltip.style('top', `${y - 80}px`).style('left', `${x + 15}px`);
      }
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(this).select('circle').style('cursor', 'grab');
    }

    // Cleanup function
    return () => {
      simulation.stop();
      if (wrapperRef.current) {
         // remove any lingering tooltips from DOM
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
