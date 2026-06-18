import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';
import type { RelationNetworkData } from '@/types';
import { formatMoney } from '@/utils/money';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Users, Layers } from 'lucide-react';
import { useGiftStore } from '@/store/useGiftStore';
import { useTheme } from '@/hooks/useTheme';

interface SimNode extends SimulationNodeDatum {
  id: string;
  name: string;
  totalAmount: number;
  totalExpense: number;
  totalIncome: number;
  recordCount: number;
  isSelf: boolean;
  radius: number;
  color: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  frequency: number;
  totalAmount: number;
  direction: 'both' | 'expense' | 'income';
  expenseAmount: number;
  incomeAmount: number;
  expenseCount: number;
  incomeCount: number;
  source: SimNode | string;
  target: SimNode | string;
}

interface HoveredItem {
  type: 'node' | 'link';
  data: SimNode | SimLink;
  x: number;
  y: number;
}

const NODE_COLORS = [
  '#C41E3A', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#EF4444',
];

const SELF_COLOR = '#C41E3A';

function getNodeColor(index: number, isSelf: boolean): string {
  if (isSelf) return SELF_COLOR;
  return NODE_COLORS[index % NODE_COLORS.length];
}

function scaleRadius(amount: number, minAmount: number, maxAmount: number, minR: number, maxR: number): number {
  if (maxAmount === minAmount) return (minR + maxR) / 2;
  const normalized = (Math.sqrt(Math.max(amount, 0)) - Math.sqrt(minAmount)) / (Math.sqrt(maxAmount) - Math.sqrt(minAmount));
  return minR + normalized * (maxR - minR);
}

function scaleStrokeWidth(freq: number, minFreq: number, maxFreq: number, minW: number, maxW: number): number {
  if (maxFreq === minFreq) return (minW + maxW) / 2;
  const normalized = (freq - minFreq) / (maxFreq - minFreq);
  return minW + normalized * (maxW - minW);
}

interface Props {
  data: RelationNetworkData;
}

export default function RelationNetworkGraph({ data }: Props) {
  const { isDark } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hovered, setHovered] = useState<HoveredItem | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const animFrameRef = useRef<number>(0);
  const [, forceTick] = useState(0);
  const showCents = useGiftStore(state => state.preferences.showCents);

  const { minAmount, maxAmount, minFreq, maxFreq } = useMemo(() => {
    const amounts = data.nodes.map(n => n.totalAmount);
    const freqs = data.links.map(l => l.frequency);
    return {
      minAmount: amounts.length ? Math.min(...amounts) : 0,
      maxAmount: amounts.length ? Math.max(...amounts) : 1,
      minFreq: freqs.length ? Math.min(...freqs) : 0,
      maxFreq: freqs.length ? Math.max(...freqs) : 1,
    };
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(rect.height, 500) });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const initSimulation = useCallback(() => {
    const { width, height } = dimensions;
    const contactNodes = data.nodes.filter(n => !n.isSelf);
    
    const simNodes: SimNode[] = data.nodes.map((n) => {
      const contactIdx = contactNodes.findIndex(c => c.id === n.id);
      const radius = scaleRadius(n.totalAmount, minAmount, maxAmount, n.isSelf ? 30 : 14, n.isSelf ? 50 : 40);
      return {
        ...n,
        radius,
        color: getNodeColor(contactIdx, n.isSelf),
        x: n.isSelf ? width / 2 : width / 2 + Math.cos(contactIdx * 2 * Math.PI / Math.max(contactNodes.length, 1)) * 150,
        y: n.isSelf ? height / 2 : height / 2 + Math.sin(contactIdx * 2 * Math.PI / Math.max(contactNodes.length, 1)) * 150,
      };
    });

    const nodeMap = new Map(simNodes.map(n => [n.id, n]));
    const simLinks: SimLink[] = data.links.map(l => ({
      ...l,
      source: nodeMap.get(l.source as string)!,
      target: nodeMap.get(l.target as string)!,
    }));

    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;

    if (simRef.current) {
      simRef.current.stop();
    }

    const sim = forceSimulation<SimNode>(simNodes)
      .force('link', forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(d => {
          const sourceR = (typeof d.source === 'object' ? d.source.radius : 30);
          const targetR = (typeof d.target === 'object' ? d.target.radius : 30);
          return sourceR + targetR + 80;
        })
        .strength(0.5))
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(width / 2, height / 2).strength(0.08))
      .force('collide', forceCollide<SimNode>().radius(d => d.radius + 8).strength(0.8))
      .alphaDecay(0.02)
      .on('tick', () => {
        forceTick(t => t + 1);
      });

    simRef.current = sim;
    forceTick(t => t + 1);
  }, [data, dimensions, minAmount, maxAmount]);

  useEffect(() => {
    initSimulation();
    const frameRef = animFrameRef;
    return () => {
      if (simRef.current) {
        simRef.current.stop();
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [initSimulation]);

  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.alpha(0.3).restart();
  }, [dimensions]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newK = Math.max(0.3, Math.min(3, transform.k * delta));
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform(prev => ({
      k: newK,
      x: mx - (mx - prev.x) * (newK / prev.k),
      y: my - (my - prev.y) * (newK / prev.k),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    setTransform(prev => ({
      ...prev,
      x: dragStartRef.current!.tx + (e.clientX - dragStartRef.current!.x),
      y: dragStartRef.current!.ty + (e.clientY - dragStartRef.current!.y),
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const zoomIn = () => {
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const newK = Math.min(3, transform.k * 1.2);
    setTransform(prev => ({
      k: newK,
      x: cx - (cx - prev.x) * (newK / prev.k),
      y: cy - (cy - prev.y) * (newK / prev.k),
    }));
  };

  const zoomOut = () => {
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const newK = Math.max(0.3, transform.k / 1.2);
    setTransform(prev => ({
      k: newK,
      x: cx - (cx - prev.x) * (newK / prev.k),
      y: cy - (cy - prev.y) * (newK / prev.k),
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, k: 1 });
    if (simRef.current) {
      simRef.current.alpha(0.5).restart();
    }
  };

  const fitToScreen = () => {
    if (simNodesRef.current.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    simNodesRef.current.forEach(n => {
      minX = Math.min(minX, n.x! - n.radius);
      maxX = Math.max(maxX, n.x! + n.radius);
      minY = Math.min(minY, n.y! - n.radius);
      maxY = Math.max(maxY, n.y! + n.radius);
    });
    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const padding = 60;
    const k = Math.min((dimensions.width - padding * 2) / graphW, (dimensions.height - padding * 2) / graphH, 2);
    setTransform({
      k,
      x: (dimensions.width - graphW * k) / 2 - minX * k,
      y: (dimensions.height - graphH * k) / 2 - minY * k,
    });
  };

  const renderArrowMarkers = () => (
    <defs>
      <marker
        id="arrow-expense"
        viewBox="0 -5 10 10"
        refX="0"
        refY="0"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0,-5 L 10,0 L 0,5 Z" fill="#C41E3A" />
      </marker>
      <marker
        id="arrow-income"
        viewBox="0 -5 10 10"
        refX="0"
        refY="0"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0,-5 L 10,0 L 0,5 Z" fill="#10B981" />
      </marker>
      <marker
        id="arrow-both-expense"
        viewBox="0 -5 10 10"
        refX="0"
        refY="0"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0,-5 L 10,0 L 0,5 Z" fill="#C41E3A" />
      </marker>
      <marker
        id="arrow-both-income"
        viewBox="0 -5 10 10"
        refX="0"
        refY="0"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0,-5 L 10,0 L 0,5 Z" fill="#10B981" />
      </marker>
      <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );

  const renderLink = (link: SimLink, idx: number) => {
    const source = link.source as SimNode;
    const target = link.target as SimNode;
    const sw = scaleStrokeWidth(link.frequency, minFreq, maxFreq, 1.5, 6);

    if (link.direction === 'both') {
      const dx = target.x! - source.x!;
      const dy = target.y! - source.y!;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const offset = sw + 3;
      const sx1 = source.x! + nx * offset;
      const sy1 = source.y! + ny * offset;
      const tx1 = target.x! + nx * offset;
      const ty1 = target.y! + ny * offset;
      const sx2 = source.x! - nx * offset;
      const sy2 = source.y! - ny * offset;
      const tx2 = target.x! - nx * offset;
      const ty2 = target.y! - ny * offset;

      const sourceR = source.radius;
      const targetR = target.radius;

      const dxe1 = tx1 - sx1;
      const dye1 = ty1 - sy1;
      const le1 = Math.sqrt(dxe1 * dxe1 + dye1 * dye1) || 1;
      const endX1 = tx1 - (dxe1 / le1) * targetR;
      const endY1 = ty1 - (dye1 / le1) * targetR;
      const startX1 = sx1 + (dxe1 / le1) * sourceR;
      const startY1 = sy1 + (dye1 / le1) * sourceR;

      const dxe2 = tx2 - sx2;
      const dye2 = ty2 - sy2;
      const le2 = Math.sqrt(dxe2 * dxe2 + dye2 * dye2) || 1;
      const endX2 = tx2 - (dxe2 / le2) * targetR;
      const endY2 = ty2 - (dye2 / le2) * targetR;
      const startX2 = sx2 + (dxe2 / le2) * sourceR;
      const startY2 = sy2 + (dye2 / le2) * sourceR;

      const isHovered = hovered?.type === 'link' && (hovered.data as SimLink) === link;

      return (
        <g key={`link-${idx}`}>
          <line
            x1={startX1}
            y1={startY1}
            x2={endX1}
            y2={endY1}
            stroke="#C41E3A"
            strokeWidth={sw}
            strokeOpacity={isHovered ? 0.9 : 0.5}
            markerEnd="url(#arrow-both-expense)"
            style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
            onMouseEnter={(e) => {
              const rect = svgRef.current!.getBoundingClientRect();
              setHovered({ type: 'link', data: link, x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseMove={(e) => {
              const rect = svgRef.current!.getBoundingClientRect();
              setHovered(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
            }}
            onMouseLeave={() => setHovered(null)}
          />
          <line
            x1={startX2}
            y1={startY2}
            x2={endX2}
            y2={endY2}
            stroke="#10B981"
            strokeWidth={sw}
            strokeOpacity={isHovered ? 0.9 : 0.5}
            markerEnd="url(#arrow-both-income)"
            style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
            onMouseEnter={(e) => {
              const rect = svgRef.current!.getBoundingClientRect();
              setHovered({ type: 'link', data: link, x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseMove={(e) => {
              const rect = svgRef.current!.getBoundingClientRect();
              setHovered(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
            }}
            onMouseLeave={() => setHovered(null)}
          />
        </g>
      );
    }

    const strokeColor = link.direction === 'expense' ? '#C41E3A' : '#10B981';
    const markerId = link.direction === 'expense' ? 'url(#arrow-expense)' : 'url(#arrow-income)';

    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const sourceR = source.radius;
    const targetR = target.radius;
    const startX = source.x! + (dx / len) * sourceR;
    const startY = source.y! + (dy / len) * sourceR;
    const endX = target.x! - (dx / len) * targetR;
    const endY = target.y! - (dy / len) * targetR;

    const isHovered = hovered?.type === 'link' && (hovered.data as SimLink) === link;

    return (
      <line
        key={`link-${idx}`}
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={strokeColor}
        strokeWidth={sw}
        strokeOpacity={isHovered ? 0.9 : 0.5}
        markerEnd={markerId}
        style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
        onMouseEnter={(e) => {
          const rect = svgRef.current!.getBoundingClientRect();
          setHovered({ type: 'link', data: link, x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseMove={(e) => {
          const rect = svgRef.current!.getBoundingClientRect();
          setHovered(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
        }}
        onMouseLeave={() => setHovered(null)}
      />
    );
  };

  const renderNode = (node: SimNode) => {
    const isHovered = hovered?.type === 'node' && (hovered.data as SimNode).id === node.id;
    const labelFontSize = node.isSelf ? 16 : Math.max(10, Math.min(14, node.radius * 0.45));
    const displayName = node.name.length > 4 ? node.name.slice(0, 4) + (node.name.length > 4 ? '…' : '') : node.name;

    return (
      <g
        key={node.id}
        transform={`translate(${node.x}, ${node.y})`}
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => {
          const rect = svgRef.current!.getBoundingClientRect();
          setHovered({ type: 'node', data: node, x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseMove={(e) => {
          const rect = svgRef.current!.getBoundingClientRect();
          setHovered(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <circle
          r={node.radius}
          fill={node.color}
          fillOpacity={isHovered ? 0.95 : 0.88}
          stroke={node.isSelf ? '#fff' : 'rgba(255,255,255,0.8)'}
          strokeWidth={node.isSelf ? 3 : 2}
          filter={node.isSelf ? 'url(#node-glow)' : undefined}
          style={{ transition: 'fill-opacity 0.2s' }}
        />
        {node.isSelf ? (
          <text
            y={labelFontSize * 0.35}
            textAnchor="middle"
            fill="#fff"
            fontSize={labelFontSize}
            fontWeight="bold"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {displayName}
          </text>
        ) : (
          <>
            <text
              y={node.radius > 25 ? labelFontSize * 0.1 : -labelFontSize * 0.2}
              textAnchor="middle"
              fill="#fff"
              fontSize={labelFontSize}
              fontWeight={600}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {displayName}
            </text>
            {node.radius > 25 && (
              <text
                y={labelFontSize * 1.3}
                textAnchor="middle"
                fill="rgba(255,255,255,0.9)"
                fontSize={labelFontSize * 0.7}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {node.recordCount}笔
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  const renderTooltip = () => {
    if (!hovered) return null;

    const tipX = hovered.x + 15;
    const tipY = hovered.y + 15;
    const maxW = 280;

    let content: React.ReactNode;
    if (hovered.type === 'node') {
      const node = hovered.data as SimNode;
      content = (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-ink-100 dark:border-ink-700">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: node.color }}
            />
            <span className="font-bold text-ink-800 dark:text-ink-200 text-base">{node.name}</span>
            {node.isSelf && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded font-medium">
                中心
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-cream-50 dark:bg-ink-900 rounded-lg p-2">
              <p className="text-xs text-ink-400 dark:text-ink-500">往来总额</p>
              <p className="font-bold text-ink-800 dark:text-ink-200">{formatMoney(node.totalAmount, showCents)}</p>
            </div>
            <div className="bg-cream-50 dark:bg-ink-900 rounded-lg p-2">
              <p className="text-xs text-ink-400 dark:text-ink-500">往来笔数</p>
              <p className="font-bold text-ink-800 dark:text-ink-200">{node.recordCount}笔</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              <p className="text-xs text-red-400 dark:text-red-400">我随出</p>
              <p className="font-bold text-red-600 dark:text-red-400">{formatMoney(node.totalExpense, showCents)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
              <p className="text-xs text-emerald-400 dark:text-emerald-400">我收到</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(node.totalIncome, showCents)}</p>
            </div>
          </div>
        </div>
      );
    } else {
      const link = hovered.data as SimLink;
      const source = link.source as SimNode;
      const target = link.target as SimNode;
      content = (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 pb-2 border-b border-ink-100 dark:border-ink-700">
            <span className="font-semibold text-ink-800 dark:text-ink-200">{source.name}</span>
            <span className="text-ink-300 dark:text-ink-600">↔</span>
            <span className="font-semibold text-ink-800 dark:text-ink-200">{target.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-cream-50 dark:bg-ink-900 rounded-lg p-2">
              <p className="text-xs text-ink-400 dark:text-ink-500">往来总额</p>
              <p className="font-bold text-ink-800 dark:text-ink-200">{formatMoney(link.totalAmount, showCents)}</p>
            </div>
            <div className="bg-cream-50 dark:bg-ink-900 rounded-lg p-2">
              <p className="text-xs text-ink-400 dark:text-ink-500">往来频次</p>
              <p className="font-bold text-ink-800 dark:text-ink-200">{link.frequency}次</p>
            </div>
            {link.expenseCount > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <p className="text-xs text-red-400 dark:text-red-400">我随出 {link.expenseCount}次</p>
                <p className="font-bold text-red-600 dark:text-red-400">{formatMoney(link.expenseAmount, showCents)}</p>
              </div>
            )}
            {link.incomeCount > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                <p className="text-xs text-emerald-400 dark:text-emerald-400">我收到 {link.incomeCount}次</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(link.incomeAmount, showCents)}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className="absolute z-50 pointer-events-none bg-white dark:bg-ink-800 rounded-xl shadow-xl border border-ink-100 dark:border-ink-700 p-3"
        style={{
          left: tipX,
          top: tipY,
          maxWidth: maxW,
          transform: tipX + maxW > dimensions.width ? `translateX(${-(maxW + 30)})` : undefined,
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gradient-to-br from-cream-50 to-white dark:from-ink-900 dark:to-ink-800 rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-700 transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="w-9 h-9 bg-white dark:bg-ink-800 rounded-xl shadow-md hover:shadow-lg border border-ink-100 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95"
          title="放大"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={zoomOut}
          className="w-9 h-9 bg-white dark:bg-ink-800 rounded-xl shadow-md hover:shadow-lg border border-ink-100 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95"
          title="缩小"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={fitToScreen}
          className="w-9 h-9 bg-white dark:bg-ink-800 rounded-xl shadow-md hover:shadow-lg border border-ink-100 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95"
          title="适应屏幕"
        >
          <Maximize2 size={18} />
        </button>
        <button
          onClick={resetView}
          className="w-9 h-9 bg-white dark:bg-ink-800 rounded-xl shadow-md hover:shadow-lg border border-ink-100 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95"
          title="重置视图"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm rounded-xl shadow-md border border-ink-100 dark:border-ink-700 p-3 space-y-2 text-xs">
        <div className="font-semibold text-ink-700 dark:text-ink-300 flex items-center gap-1.5 pb-1 border-b border-ink-100 dark:border-ink-700">
          <Layers size={14} className="text-primary-500" />
          图例说明
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C41E3A' }} />
            <span className="text-ink-600 dark:text-ink-400">红色连线：我随给对方</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span className="text-ink-600 dark:text-ink-400">绿色连线：对方随给我</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5" style={{ backgroundColor: isDark ? '#525252' : '#9CA3AF', height: '1px' }} />
            <span className="text-ink-600 dark:text-ink-400">连线粗细 = 往来频次</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-center">
              <div className="w-3 h-3 rounded-full bg-ink-300 dark:bg-ink-600" />
              <div className="w-4 h-4 rounded-full bg-ink-400 dark:bg-ink-500" />
              <div className="w-5 h-5 rounded-full bg-ink-500 dark:bg-ink-400" />
            </div>
            <span className="text-ink-600 dark:text-ink-400">节点大小 = 往来金额</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm rounded-xl shadow-md border border-ink-100 dark:border-ink-700 p-3 text-xs">
        <div className="font-semibold text-ink-700 dark:text-ink-300 flex items-center gap-1.5 pb-1.5 border-b border-ink-100 dark:border-ink-700">
          <Users size={14} className="text-primary-500" />
          网络概览
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center">
            <p className="text-ink-400 dark:text-ink-500 text-[10px]">联系人</p>
            <p className="font-bold text-ink-800 dark:text-ink-200 text-lg">{data.summary.totalContacts}</p>
          </div>
          <div className="text-center">
            <p className="text-ink-400 dark:text-ink-500 text-[10px]">记录数</p>
            <p className="font-bold text-ink-800 dark:text-ink-200 text-lg">{data.summary.totalRecords}</p>
          </div>
          <div className="text-center">
            <p className="text-ink-400 dark:text-ink-500 text-[10px]">总金额</p>
            <p className="font-bold text-primary-600 dark:text-primary-400 text-sm">{formatMoney(data.summary.totalAmount, showCents)}</p>
          </div>
        </div>
      </div>

      {data.summary.totalContacts === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-ink-300 dark:text-ink-600">
            <p className="text-6xl mb-4">🕸️</p>
            <p className="text-lg font-medium">暂无人情往来数据</p>
            <p className="text-sm mt-1">添加记录后，关系网络将自动生成</p>
          </div>
        </div>
      ) : (
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {renderArrowMarkers()}
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {simLinksRef.current.map((link, idx) => renderLink(link, idx))}
            {simNodesRef.current.map(node => renderNode(node))}
          </g>
        </svg>
      )}

      {renderTooltip()}
    </div>
  );
}
