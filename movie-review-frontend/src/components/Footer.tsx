import React from 'react'

const Footer: React.FC = () => (
  <footer className="mt-16 border-t border-slate-800/60">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 text-xs text-slate-400">
      <span>© {new Date().getFullYear()} Dinoco</span>
      <span>Discover. Review. Rate.</span>
    </div>
  </footer>
)

export default Footer
