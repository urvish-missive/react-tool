export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="mb-3">
              <img src="/logo.png" alt="Logo" className="h-8" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              AI-powered SEO tools for content analysis, website auditing, and keyword research.
              Completely client-side — your data never leaves your browser.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Tools</h4>
            <ul className="space-y-2">
              {[
                { name: 'Content Analyzer', href: '/content-analyzer' },
                { name: 'SEO Audit', href: '/seo-audit' },
                { name: 'Keyword Research', href: '/keyword-research' },
                { name: 'Settings', href: '/settings' },
              ].map(tool => (
                <li key={tool.name}>
                  <a href={tool.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Privacy</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              All analysis runs entirely in your browser. No data is sent to any server.
              AI API keys are stored locally in your browser only.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
