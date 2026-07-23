/* 星空粒子背景动效组件：纯 CSS 实现，不依赖 heavy JS 库 */
export function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 第一层：远景微星 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(1px 1px at 10% 20%, rgba(232,232,255,0.8), transparent), radial-gradient(1px 1px at 30% 60%, rgba(232,232,255,0.6), transparent), radial-gradient(1px 1px at 50% 10%, rgba(232,232,255,0.7), transparent), radial-gradient(1px 1px at 70% 80%, rgba(232,232,255,0.5), transparent), radial-gradient(1px 1px at 90% 40%, rgba(232,232,255,0.6), transparent), radial-gradient(1px 1px at 15% 90%, rgba(232,232,255,0.4), transparent), radial-gradient(1px 1px at 45% 45%, rgba(232,232,255,0.5), transparent), radial-gradient(1px 1px at 80% 15%, rgba(232,232,255,0.7), transparent), radial-gradient(1px 1px at 60% 70%, rgba(232,232,255,0.3), transparent), radial-gradient(1px 1px at 25% 35%, rgba(232,232,255,0.6), transparent)',
          backgroundSize: '200px 200px',
        }}
      />
      {/* 第二层：中景亮星（带闪烁动画） */}
      <div
        className="absolute inset-0 animate-pulse-glow opacity-20"
        style={{
          backgroundImage: 'radial-gradient(2px 2px at 20% 30%, rgba(0,212,255,0.8), transparent), radial-gradient(2px 2px at 60% 50%, rgba(0,255,212,0.6), transparent), radial-gradient(2px 2px at 85% 20%, rgba(179,71,217,0.7), transparent), radial-gradient(1.5px 1.5px at 40% 80%, rgba(0,212,255,0.5), transparent), radial-gradient(1.5px 1.5px at 75% 65%, rgba(0,255,212,0.4), transparent)',
          backgroundSize: '300px 300px',
        }}
      />
      {/* 第三层：深空星云渐变 */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.3), transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(0,212,255,0.2), transparent 40%)',
        }}
      />
    </div>
  )
}