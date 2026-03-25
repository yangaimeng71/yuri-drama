import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import Modal from '../components/Modal';
import { getDramaPoster } from '../utils/dramaPoster';
import PosterWithAudio from '../components/PosterWithAudio';
import DramaDetail from '../components/DramaDetail';

function buildGraph(data) {
  const cvCount = {};
  data.forEach(d => d.cvs.forEach(c => { cvCount[c] = (cvCount[c]||0) + 1; }));

  const edgeMap = {};
  const edgeDramas = {};
  data.forEach(d => {
    const cvs = d.cvs;
    for (let i = 0; i < cvs.length; i++) {
      for (let j = i + 1; j < cvs.length; j++) {
        const key = [cvs[i], cvs[j]].sort().join('|||');
        edgeMap[key] = (edgeMap[key] || 0) + 1;
        if (!edgeDramas[key]) edgeDramas[key] = [];
        edgeDramas[key].push(d.title);
      }
    }
  });

  const nodeSet = new Set();
  const links = [];
  Object.entries(edgeMap).forEach(([key, weight]) => {
    const [a, b] = key.split('|||');
    nodeSet.add(a);
    nodeSet.add(b);
    links.push({ source: a, target: b, weight, dramas: edgeDramas[key] });
  });

  const nodes = Array.from(nodeSet).map(id => ({
    id,
    count: cvCount[id] || 1,
    radius: Math.max(5, Math.min(22, Math.sqrt((cvCount[id] || 1)) * 4))
  }));

  return { nodes, links };
}

const DEFAULT_LINK_COLOR = 'rgba(156,140,245,0.2)';
const HIGHLIGHT_LINK_COLOR = '#C8BFFF';
const SELECTED_LINK_COLOR = '#4ade80';

export default function CVNetwork({ data }) {
  const svgRef = useRef(null);
  const [edgeInfo, setEdgeInfo] = useState(null);
  const [modalDrama, setModalDrama] = useState(null);
  const [dimensions, setDimensions] = useState({ w: 900, h: 600 });
  // Track selected node & edge for highlight state across renders
  const selectedNodeRef = useRef(null);
  const selectedEdgeRef = useRef(null);

  const graph = useMemo(() => buildGraph(data), [data]);

  const dramaByTitle = useMemo(() => {
    const m = {};
    data.forEach(d => { m[d.title] = d; });
    return m;
  }, [data]);

  const handleResize = useCallback(() => {
    const container = svgRef.current?.parentElement;
    if (container) {
      setDimensions({ w: container.clientWidth, h: Math.max(500, container.clientHeight) });
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;
    const { w, h } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    selectedNodeRef.current = null;
    selectedEdgeRef.current = null;

    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.2, 5]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoom);

    const sim = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id(d => d.id).distance(d => 120 / Math.sqrt(d.weight)))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 4));

    // Helper: default line width
    const defaultWidth = (d) => Math.min(6, Math.sqrt(d.weight) * 1.5);

    // Reset all links to default
    const resetLinks = () => {
      link.attr('stroke', DEFAULT_LINK_COLOR)
          .attr('stroke-width', d => defaultWidth(d));
    };

    // Reset all nodes to default
    const resetNodes = () => {
      node.selectAll('circle')
        .attr('stroke', '#C8BFFF')
        .attr('stroke-width', 1.5)
        .attr('fill-opacity', 0.7);
    };

    // Highlight links connected to a node
    const highlightNode = (nodeId) => {
      link.each(function(d) {
        const srcId = d.source.id || d.source;
        const tgtId = d.target.id || d.target;
        if (srcId === nodeId || tgtId === nodeId) {
          d3.select(this)
            .attr('stroke', HIGHLIGHT_LINK_COLOR)
            .attr('stroke-width', d => Math.min(10, defaultWidth(d) * 2.5));
        } else {
          d3.select(this)
            .attr('stroke', 'rgba(156,140,245,0.06)')
            .attr('stroke-width', d => defaultWidth(d));
        }
      });
      // Highlight the selected node itself
      node.selectAll('circle').each(function(d) {
        if (d.id === nodeId) {
          d3.select(this).attr('stroke', '#fff').attr('stroke-width', 3).attr('fill-opacity', 1);
        } else {
          d3.select(this).attr('fill-opacity', 0.4).attr('stroke-width', 1);
        }
      });
    };

    // Highlight a single selected edge
    const highlightEdge = (edgeData) => {
      const srcId = edgeData.source.id || edgeData.source;
      const tgtId = edgeData.target.id || edgeData.target;
      link.each(function(d) {
        const s = d.source.id || d.source;
        const t = d.target.id || d.target;
        if (s === srcId && t === tgtId) {
          d3.select(this)
            .attr('stroke', SELECTED_LINK_COLOR)
            .attr('stroke-width', d => Math.min(10, defaultWidth(d) * 2.5));
        }
      });
    };

    // --- Links ---
    const link = g.append('g').selectAll('line').data(graph.links).join('line')
      .attr('stroke', DEFAULT_LINK_COLOR)
      .attr('stroke-width', d => defaultWidth(d))
      .style('cursor', 'pointer')
      .on('click', (e, d) => {
        e.stopPropagation();
        selectedEdgeRef.current = d;
        // Keep node highlight if any, just color this edge
        if (selectedNodeRef.current) {
          highlightNode(selectedNodeRef.current);
        } else {
          resetLinks();
          resetNodes();
        }
        highlightEdge(d);
        setEdgeInfo({ a: d.source.id || d.source, b: d.target.id || d.target, weight: d.weight, dramas: d.dramas });
      });

    // --- Nodes ---
    const node = g.append('g').selectAll('g').data(graph.nodes).join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (e, d) => {
        e.stopPropagation();
        if (selectedNodeRef.current === d.id) {
          // Deselect
          selectedNodeRef.current = null;
          selectedEdgeRef.current = null;
          resetLinks();
          resetNodes();
        } else {
          selectedNodeRef.current = d.id;
          selectedEdgeRef.current = null;
          highlightNode(d.id);
        }
      });

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', '#9C8CF5')
      .attr('fill-opacity', 0.7)
      .attr('stroke', '#C8BFFF')
      .attr('stroke-width', 1.5);

    node.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 14)
      .attr('fill', '#c8bfff')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none');

    // Click background to deselect all
    svg.on('click', () => {
      selectedNodeRef.current = null;
      selectedEdgeRef.current = null;
      resetLinks();
      resetNodes();
    });

    sim.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [graph, dimensions]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">CV合作网络</h2>
        <p className="text-slate-400 text-sm">点击CV节点高亮其所有合作连线 · 点击连线查看合作详情（绿色高亮） · 支持缩放和拖拽</p>
      </div>
      <div className="glass-card p-2 purple-glow overflow-hidden" style={{ height: '70vh' }}>
        <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
      </div>
      <Modal open={!!edgeInfo} onClose={() => setEdgeInfo(null)}
        title={edgeInfo ? `${edgeInfo.a} × ${edgeInfo.b}` : ''}>
        {edgeInfo && (
          <div className="space-y-4">
            <div className="stat-card text-center">
              <p className="text-xs text-slate-400">合作次数</p>
              <p className="text-3xl font-bold text-primary mt-1">{edgeInfo.weight}</p>
            </div>
            <h4 className="text-sm font-bold text-slate-300">合作广播剧</h4>
            <div className="space-y-1.5">
              {edgeInfo.dramas.map((t, i) => {
                const d = dramaByTitle[t];
                return (
                  <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg hover:bg-primary/5 cursor-pointer"
                    onClick={() => d && setModalDrama(d)}>
                    <span className="text-primary font-bold text-xs">{i + 1}</span>
                    <span className="text-white">{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!modalDrama} onClose={() => setModalDrama(null)} title={modalDrama?.title || ''}
        wide={!!(modalDrama && modalDrama.playCount > 0 && getDramaPoster(modalDrama.title))}
        sideContent={modalDrama && modalDrama.playCount > 0 && getDramaPoster(modalDrama.title) ? (
          <PosterWithAudio title={modalDrama.title} />
        ) : undefined}>
        {modalDrama && (
          <DramaDetail drama={modalDrama} />
        )}
      </Modal>
    </div>
  );
}
