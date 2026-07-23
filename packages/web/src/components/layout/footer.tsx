/* 底部 */
export function Footer() {
  return (
    <footer className="border-t border-space-600 bg-space-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-star-dim">太空猎人 — 天文爱好者社区</span>
          <div className="flex gap-4 text-sm text-star-dim">
            <a href="#" className="hover:text-star-white transition-colors">关于</a>
            <a href="#" className="hover:text-star-white transition-colors">隐私</a>
            <a href="#" className="hover:text-star-white transition-colors">帮助</a>
          </div>
        </div>
      </div>
    </footer>
  )
}