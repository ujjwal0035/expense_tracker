import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';

const COLORS = [
  '#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function D3ScatterPlot({ data, width = 800, height = 400 }) {
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

    // Parse Dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    const formattedData = data.map(d => ({
      ...d,
      parsedDate: parseDate(d.expense_date),
      amount: parseFloat(d.amount)
    })).filter(d => d.parsedDate !== null && !isNaN(d.amount));

    if (formattedData.length === 0) return;

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(formattedData, d => d.parsedDate))
      .range([0, innerWidth])
      .nice(); // Add padding to domain

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(formattedData, d => d.amount) * 1.1])
      .range([innerHeight, 0])
      .nice();

    const categories = Array.from(new Set(formattedData.map(d => d.category)));
    const colorScale = d3.scaleOrdinal()
      .domain(categories)
      .range(COLORS);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale).tickFormat(d => `₹${d}`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif');

    g.append('g')
      .call(yAxis)
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif');

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''))
      .style('stroke', isDarkMode ? '#334155' : '#e2e8f0')
      .style('stroke-opacity', 0.2)
      .selectAll('line')
      .style('stroke-dasharray', '3,3');

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

    // Draw Dots
    g.selectAll('.dot')
      .data(formattedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.parsedDate))
      .attr('cy', d => yScale(d.amount))
      .attr('r', 0) // animate from 0
      .style('fill', d => colorScale(d.category))
      .style('opacity', 0.7)
      .style('stroke', isDarkMode ? '#1e293b' : '#ffffff')
      .style('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('opacity', 1)
          .attr('r', 8)
          .style('stroke-width', 2);
          
        const [x, y] = d3.pointer(event, wrapperRef.current);
        
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${d.category}</div>
            <div style="color: ${colorScale(d.category)}; font-weight: bold; font-size: 16px;">
              ₹${d.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style="font-size: 12px; color: ${isDarkMode ? '#94a3b8' : '#64748b'}; margin-top: 4px;">
              ${dayjs(d.expense_date).format('MMM DD, YYYY')}
            </div>
            ${d.description ? `<div style="font-size: 12px; color: ${isDarkMode ? '#cbd5e1' : '#475569'}; margin-top: 4px; font-style: italic;">"${d.description}"</div>` : ''}
          `)
          .style('top', `${y - 100}px`)
          .style('left', `${x + 15}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 0.7)
          .attr('r', 6)
          .style('stroke-width', 1);
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 5)
      .attr('r', 6)
      .ease(d3.easeElasticOut);

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
