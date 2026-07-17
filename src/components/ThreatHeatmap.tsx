import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ThreatHeatmapProps {
  data: { date: Date; intensity: number }[];
}

export const ThreatHeatmap: React.FC<ThreatHeatmapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 40 };
    const width = svgRef.current.parentElement?.clientWidth || 600;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const days = d3.timeDays(d3.min(data, d => d.date)!, d3.max(data, d => d.date)!, 1);
    
    // Fallback if there's no range
    if (days.length === 0) {
      const g_empty = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      g_empty.append("text").text("Gathering initial CTI telemetry...").attr("fill", "gray").attr("font-size", "10px").attr("font-family", "monospace");
      return;
    }

    const cellWidth = Math.max(width / days.length, 10);
    const cellHeight = height / 7; // days of week

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(data, d => d.intensity) || 10]);

    // Map data
    const dataMap = new Map(data.map(d => [d3.timeDay(d.date).getTime(), d.intensity]));

    g.selectAll("rect")
      .data(days)
      .enter()
      .append("rect")
      .attr("width", cellWidth - 2)
      .attr("height", cellHeight - 2)
      .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * cellWidth)
      .attr("y", d => d.getDay() * cellHeight)
      .attr("fill", d => {
        const val = dataMap.get(d.getTime());
        return val ? colorScale(val) : '#1a1a1a';
      })
      .attr("rx", 2)
      .attr("ry", 2)
      .on("mouseover", function(event, d) {
        d3.select(this).style("stroke", "#ff3333").style("stroke-width", 2);
      })
      .on("mouseout", function() {
        d3.select(this).style("stroke", "none");
      });

  }, [data]);

  return (
    <div className="w-full h-48 overflow-hidden bg-black border border-harvest-border hardware-surface p-2 rounded">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
};
