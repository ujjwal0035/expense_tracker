import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';

export default function D3GaugeChart({ value, max, width = 300, height = 200 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    if (containerWidth === 0 || containerHeight === 0) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const radius = Math.min(containerWidth, containerHeight * 2) / 2 - margin.top;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .style('overflow', 'visible');

    const g = svg.append('g')
      .attr('transform', `translate(${containerWidth / 2},${containerHeight - margin.bottom})`);

    // Define color scale based on ratio (green -> yellow -> red)
    const ratio = Math.min(value / (max || 1), 1);
    
    let needleColor = '#10b981'; // green
    if (ratio > 0.75) needleColor = '#f59e0b'; // yellow
    if (ratio > 0.9) needleColor = '#ef4444'; // red

    // Arc generator
    const arc = d3.arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2); // Start at 9 o'clock

    // Background arc (gray)
    const bgArc = d3.arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append('path')
      .attr('d', bgArc)
      .attr('fill', isDarkMode ? '#334155' : '#e2e8f0');

    // Foreground arc (colored)
    const fgArc = g.append('path')
      .datum({ endAngle: -Math.PI / 2 })
      .attr('d', arc)
      .attr('fill', needleColor);

    // Animate foreground arc
    fgArc.transition()
      .duration(1500)
      .attrTween('d', function(d) {
        const targetAngle = -Math.PI / 2 + (ratio * Math.PI);
        const interpolate = d3.interpolate(d.endAngle, targetAngle);
        return function(t) {
          d.endAngle = interpolate(t);
          return arc(d);
        };
      });

    // Add Needle (Triangle)
    const needleScale = d3.scaleLinear()
      .domain([0, 1])
      .range([-90, 90]);

    const needleAngle = needleScale(ratio);

    const needleG = g.append('g');
    
    // Needle path
    needleG.append('path')
      .attr('d', `M -5 0 L 0 ${-radius + 10} L 5 0 Z`)
      .attr('fill', isDarkMode ? '#f8fafc' : '#1e293b');

    // Needle center circle
    needleG.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', isDarkMode ? '#f8fafc' : '#1e293b');

    // Animate Needle
    needleG.attr('transform', 'rotate(-90)')
      .transition()
      .duration(1500)
      .ease(d3.easeElasticOut)
      .attr('transform', `rotate(${needleAngle})`);

    // Add labels
    g.append('text')
      .attr('x', -radius + 15)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('fill', isDarkMode ? '#94a3b8' : '#64748b')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text('0');

    g.append('text')
      .attr('x', radius - 15)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('fill', isDarkMode ? '#94a3b8' : '#64748b')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text('Max');
      
    // Center text (Value)
    g.append('text')
      .attr('x', 0)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .style('fill', isDarkMode ? '#f8fafc' : '#1e293b')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .text(`₹${Math.round(value).toLocaleString('en-IN')}`);

    g.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('fill', isDarkMode ? '#94a3b8' : '#64748b')
      .style('font-size', '12px')
      .text(`of ₹${Math.round(max).toLocaleString('en-IN')}`);

  }, [value, max, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
