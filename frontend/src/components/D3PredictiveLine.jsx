import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';

export default function D3PredictiveLine({ actualData, predictedData, width = 800, height = 400 }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!actualData || actualData.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = wrapperRef.current ? wrapperRef.current.clientWidth : width;
    const containerHeight = wrapperRef.current ? wrapperRef.current.clientHeight : height;

    if (containerWidth === 0 || containerHeight === 0) return;

    const margin = { top: 20, right: 30, left: 60, bottom: 30 };
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
    const parseDate = d3.timeParse('%Y-%m-%d');
    
    // Format actual data (cumulative sum if it's daily spend)
    // Assuming actualData is daily spend: [{date: 'YYYY-MM-DD', total: 100}]
    let cumulative = 0;
    const actualLineData = actualData.map(d => {
      cumulative += parseFloat(d.total);
      return {
        date: parseDate(d.date),
        rawDate: d.date,
        total: cumulative
      };
    }).sort((a, b) => a.date - b.date);

    // Format predicted data
    // Assuming predictedData is like: [{date: 'YYYY-MM-DD', total: 150}] (already cumulative)
    const predictedLineData = predictedData.map(d => ({
      date: parseDate(d.date),
      rawDate: d.date,
      total: parseFloat(d.total)
    })).sort((a, b) => a.date - b.date);

    // Combine for scales
    const allData = [...actualLineData, ...predictedLineData];
    
    const xScale = d3.scaleTime()
      .domain(d3.extent(allData, d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(allData, d => d.total) * 1.1]) // Add 10% headroom
      .range([innerHeight, 0]);

    // Line generators
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.total))
      .curve(d3.curveMonotoneX);

    // Add Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `₹${d}`))
      .attr('color', isDarkMode ? '#94a3b8' : '#64748b')
      .selectAll('text')
      .style('font-family', 'Inter, sans-serif');

    // Add Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''))
      .style('stroke', isDarkMode ? '#334155' : '#e2e8f0')
      .style('stroke-opacity', 0.5)
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

    // Mouse overlay for tooltips
    const overlay = g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    // Draw Predicted Line (Dashed)
    if (predictedLineData.length > 0) {
      // Connect last actual to first predicted
      const connectData = [actualLineData[actualLineData.length - 1], predictedLineData[0]];
      
      // Draw connection
      g.append('path')
        .datum(connectData)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b') // Warning yellow
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', line);

      // Draw rest of predicted
      const predPath = g.append('path')
        .datum(predictedLineData)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '6,6')
        .attr('d', line);
        
      // Add glowing effect to predicted
      predPath.style('filter', 'drop-shadow(0px 0px 4px rgba(245, 158, 11, 0.5))');
    }

    // Draw Actual Line (Solid)
    const actualPath = g.append('path')
      .datum(actualLineData)
      .attr('fill', 'none')
      .attr('stroke', '#6c63ff') // Primary brand color
      .attr('stroke-width', 3)
      .attr('d', line);
      
    // Animate Actual Line
    const totalLength = actualPath.node().getTotalLength();
    actualPath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Area under actual line
    const areaGenerator = d3.area()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.total))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(actualLineData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', areaGenerator);

    // Gradient for area
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6c63ff')
      .attr('stop-opacity', 0.2);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6c63ff')
      .attr('stop-opacity', 0);

    // Interaction Line
    const hoverLine = g.append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('stroke', isDarkMode ? '#94a3b8' : '#64748b')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const hoverDot = g.append('circle')
      .attr('r', 5)
      .style('fill', '#ffffff')
      .style('stroke', '#6c63ff')
      .style('stroke-width', 2)
      .style('opacity', 0);

    overlay.on('mousemove', function(event) {
      const [xPos, yPos] = d3.pointer(event, g.node());
      const xDate = xScale.invert(xPos);
      
      const bisectDate = d3.bisector(d => d.date).left;
      
      // Determine if we are in actual or predicted territory
      const isPredicted = xDate > actualLineData[actualLineData.length - 1].date;
      const targetData = isPredicted ? predictedLineData : actualLineData;
      
      if (targetData.length === 0) return;

      const i = bisectDate(targetData, xDate, 1);
      const d0 = targetData[i - 1];
      const d1 = targetData[i];
      let pointData = null;
      
      if (d0 && d1) {
        pointData = xDate - d0.date > d1.date - xDate ? d1 : d0;
      } else {
        pointData = d0 || d1;
      }

      if (pointData) {
        const pX = xScale(pointData.date);
        const pY = yScale(pointData.total);

        hoverLine
          .attr('x1', pX).attr('x2', pX)
          .style('opacity', 1);

        hoverDot
          .attr('cx', pX).attr('cy', pY)
          .style('stroke', isPredicted ? '#f59e0b' : '#6c63ff')
          .style('opacity', 1);

        const [wrapperX, wrapperY] = d3.pointer(event, wrapperRef.current);
        
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">
              ${dayjs(pointData.rawDate).format('MMM DD, YYYY')}
            </div>
            <div style="color: ${isPredicted ? '#f59e0b' : '#6c63ff'}; font-weight: bold; font-size: 16px;">
              ₹${Math.round(pointData.total).toLocaleString('en-IN')}
            </div>
            <div style="font-size: 12px; color: ${isDarkMode ? '#94a3b8' : '#64748b'}; margin-top: 2px;">
              ${isPredicted ? 'Predicted Cumulative Spend' : 'Actual Cumulative Spend'}
            </div>
          `)
          .style('top', `${wrapperY - 80}px`)
          .style('left', `${wrapperX + 15}px`);
      }
    });

    overlay.on('mouseout', () => {
      hoverLine.style('opacity', 0);
      hoverDot.style('opacity', 0);
      tooltip.style('visibility', 'hidden');
    });

    return () => {
      if (wrapperRef.current) {
        d3.select(wrapperRef.current).selectAll('div').remove();
      }
    };

  }, [actualData, predictedData, width, height, isDarkMode]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
