import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import Modal from '../components/Modal';

function buildCollabMap(data) {
  const map = {};
  const dramaMap = {};
  data.forEach(d => {
    const cvs = d.cvs;
    for (let i = 0; i < cvs.length; i++) {
      for (let j = i + 1; j < cvs.length; j++) {
        const a = cvs[i], b = cvs[j];
        if (!map[a]) map[a] = {};
        if (!map[b]) map[b] = {};
        map[a][b] = (map[a][b] || 0) + 1;
        map[b][a] = (map[b][a] || 0) + 1;
        const key = [a, b].sort().join('|||');
        if (!dramaMap[key]) dramaMap[key] = [];
        dramaMap[key].push(d.title);
      }
    }
  });
  return { map, dramaMap };
}

export default function CVUniverse({ data }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const [search, setSearch] = useState('');
  const [centerCV, setCenterCV] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedPair, setSelectedPair] = useState(null);

  const { collabMap, dramaMap, allCVs } = useMemo(() => {
    const { map, dramaMap } = buildCollabMap(data);
    return { collabMap: map, dramaMap, allCVs: Object.keys(map).sort() };
  }, [data]);

  // Build a title->drama lookup for 400w sorting
  const dramaByTitle = useMemo(() => {
    const m = {};
    data.forEach(d => { m[d.title] = d; });
    return m;
  }, [data]);

  // Top collaboration pairs with count >= 2
  const topPairs = useMemo(() => {
    const seen = new Set();
    const pairs = [];
    Object.entries(collabMap).forEach(([a, neighbors]) => {
      Object.entries(neighbors).forEach(([b, count]) => {
        const key = [a, b].sort().join('|||');
        if (!seen.has(key) && count >= 2) {
          seen.add(key);
          pairs.push({ a: key.split('|||')[0], b: key.split('|||')[1], count, key });
        }
      });
    });
    return pairs.sort((x, y) => y.count - x.count);
  }, [collabMap]);

  const filtered = useMemo(() =>
    search ? allCVs.filter(c => c.toLowerCase().includes(search.toLowerCase())).slice(0, 15) : []
  , [search, allCVs]);

  const selectCenter = useCallback((cv) => {
    setCenterCV(cv);
    setExpandedNodes(new Set([cv]));
    setSearch('');
    setSelectedEdge(null);
  }, []);

  // Build ego graph from expanded nodes
  const egoGraph = useMemo(() => {
    if (!centerCV) return { nodes: [], links: [] };
    const nodeSet = new Set();
    const links = [];
    const linkSet = new Set();

    expandedNodes.forEach(cv => {
      nodeSet.add(cv);
      const neighbors = collabMap[cv] || {};
      Object.entries(neighbors).forEach(([n, w]) => {
        nodeSet.add(n);
        const key = [cv, n].sort().join('|||');
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: cv, target: n, weight: w, dramas: dramaMap[key] || [] });
        }
      });
    });

    const nodes = Array.from(nodeSet).map(id => ({
      id,
      isCenter: id === centerCV,
      isExpanded: expandedNodes.has(id),
      radius: id === centerCV ? 24 : expandedNodes.has(id) ? 18 : 10,
      collabCount: Object.keys(collabMap[id] || {}).length
    }));

    return { nodes, links };
  }, [centerCV, expandedNodes, collabMap, dramaMap]);

  useEffect(() => {
    if (!svgRef.current || egoGraph.nodes.length === 0) return;
    const container = svgRef.current.parentElement;
    const w = container.clientWidth;
    const h = Math.max(500, container.clientHeight);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 4]).on('zoom', e => g.attr('transform', e.transform)));

    const sim = d3.forceSimulation(egoGraph.nodes)
      .force('link', d3.forceLink(egoGraph.links).id(d => d.id).distance(d => 100 / Math.sqrt(d.weight)))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 6));
    simRef.current = sim;

    // Links
    g.append('g').selectAll('line').data(egoGraph.links).join('line')
      .attr('stroke', 'rgba(156,140,245,0.18)')
      .attr('stroke-width', d => Math.min(5, Math.sqrt(d.weight) * 1.5))
      .style('cursor', 'pointer')
      .on('click', (e, d) => {
        const a = d.source.id || d.source, b = d.target.id || d.target;
        setSelectedEdge({ a, b, weight: d.weight, dramas: d.dramas });
      })
      .on('mouseover', function() { d3.select(this).attr('stroke', '#C8BFFF'); })
      .on('mouseout', function() { d3.select(this).attr('stroke', 'rgba(156,140,245,0.18)'); });

    // Nodes
    const node = g.append('g').selectAll('g').data(egoGraph.nodes).join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (e, d) => {
        if (!expandedNodes.has(d.id) && collabMap[d.id]) {
          setExpandedNodes(prev => new Set([...prev, d.id]));
        }
      });

    // Glow for center
    node.filter(d => d.isCenter).append('circle')
      .attr('r', d => d.radius + 8)
      .attr('fill', 'none')
      .attr('stroke', '#9C8CF5')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.3);

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.isCenter ? '#9C8CF5' : d.isExpanded ? '#7C3AED' : 'rgba(156,140,245,0.5)')
      .attr('stroke', '#C8BFFF')
      .attr('stroke-width', d => d.isCenter ? 3 : 1.5)
      .on('mouseover', function() { d3.select(this).attr('fill-opacity', 1).attr('stroke-width', 3); })
      .on('mouseout', function(e, d) { d3.select(this).attr('fill-opacity', 1).attr('stroke-width', d.isCenter ? 3 : 1.5); });

    node.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 14)
      .attr('fill', d => d.isCenter ? '#fff' : '#c8bfff')
      .attr('font-size', d => d.isCenter ? '12px' : '10px')
      .attr('font-weight', d => d.isCenter ? '700' : '500')
      .style('pointer-events', 'none');

    sim.on('tick', () => {
      g.selectAll('line')
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [egoGraph, expandedNodes, collabMap]);

  const sideInfo = useMemo(() => {
    if (!selectedEdge) return null;
    return selectedEdge;
  }, [selectedEdge]);

  // Dramas for the selected top-pair modal, sorted 400w first
  const pairDramas = useMemo(() => {
    if (!selectedPair) return [];
    const titles = dramaMap[selectedPair.key] || [];
    return titles.map(t => dramaByTitle[t]).filter(Boolean)
      .sort((a, b) => (b.over400w ? 1 : 0) - (a.over400w ? 1 : 0));
  }, [selectedPair, dramaMap, dramaByTitle]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">CV宇宙图</h2>
        <p className="text-slate-400 text-sm">以一位CV为中心，探索其合作关系宇宙 · 点击节点展开更多连接</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
        <input type="text" placeholder="搜索CV，开始探索宇宙" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-primary/5 border border-primary/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/40 transition-colors" />
        {filtered.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-[#1a1a2e] border border-primary/20 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {filtered.map(c => (
              <div key={c} onClick={() => selectCenter(c)}
                className="px-4 py-2.5 hover:bg-primary/10 cursor-pointer text-sm text-slate-200">
                {c}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-6" style={{ minHeight: '65vh' }}>
        {/* Left column: graph or top pairs list */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Graph area */}
          <div className="flex-1 glass-card p-2 purple-glow overflow-hidden" style={{ minHeight: '400px' }}>
            {!centerCV ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-primary/30 mb-3 block">explore</span>
                  <p>搜索并选择一位CV，开始探索宇宙</p>
                </div>
              </div>
            ) : (
              <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
            )}
          </div>

          {/* Top collaboration pairs (>=2 times) */}
          {topPairs.length > 0 && (
            <div className="glass-card p-6">
              <h4 className="text-lg font-bold text-white mb-1">高频合作CP榜</h4>
              <p className="text-xs text-slate-500 mb-4">合作次数不少于2次的CV组合，点击查看合作作品</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {topPairs.map((p, i) => {
                  const isSelected = selectedPair && selectedPair.key === p.key;
                  return (
                    <div key={p.key}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all group ${
                        isSelected
                          ? 'border border-white bg-primary/15 shadow-lg shadow-primary/10'
                          : 'border border-primary/30 hover:bg-primary/8 hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPair(p)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-primary/60 w-5 flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm text-white font-medium truncate">
                          {p.a} <span className="text-primary/50 mx-0.5">×</span> {p.b}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary flex-shrink-0 ml-2">{p.count} 次</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        {sideInfo && (
          <div className="w-72 glass-card p-5 overflow-y-auto animate-in flex-shrink-0">
            <h4 className="text-base font-bold text-white mb-3">
              {sideInfo.a} × {sideInfo.b}
            </h4>
            <div className="stat-card text-center mb-4">
              <p className="text-xs text-slate-400">合作次数</p>
              <p className="text-2xl font-bold text-primary mt-1">{sideInfo.weight}</p>
            </div>
            <h5 className="text-sm font-bold text-slate-300 mb-2">合作广播剧</h5>
            <div className="space-y-1">
              {sideInfo.dramas.map((t, i) => (
                <div key={i} className="text-sm py-1.5 px-2 rounded hover:bg-primary/5 text-slate-200">
                  <span className="text-primary text-xs font-bold mr-2">{i + 1}</span>{t}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top pair detail modal */}
      <Modal open={!!selectedPair} onClose={() => setSelectedPair(null)}
        title={selectedPair ? `${selectedPair.a} × ${selectedPair.b} · 合作 ${selectedPair.count} 次` : ''}>
        {selectedPair && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-300">合作广播剧列表</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pairDramas.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-primary/5 text-sm border border-primary/5">
                  <div className="min-w-0">
                    <span className="text-primary text-xs font-bold mr-2">{i + 1}</span>
                    <span className="text-white font-medium">{d.title}</span>
                    <span className="text-slate-500 ml-2 text-xs">{d.author}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-slate-500 text-xs">{d.platform}</span>
                    {d.over400w && <span className="tag tag-yes">400万+</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
