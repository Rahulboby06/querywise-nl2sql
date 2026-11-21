import { ArrowLeft, Construction } from 'lucide-react'

type PlaceholderPageProps = {
  pageTitle: string
}

export function PlaceholderPage({ pageTitle }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="placeholder-title" className="placeholder-page">
      <span className="placeholder-icon"><Construction aria-hidden="true" size={23} strokeWidth={1.7} /></span>
      <span className="placeholder-kicker">COMING UP NEXT</span>
      <h2 id="placeholder-title">{pageTitle}</h2>
      <p>This part of your workspace is taking shape. It’ll be ready for you in a future step.</p>
      <span className="placeholder-note"><ArrowLeft aria-hidden="true" size={14} /> Choose another section from the sidebar</span>
    </section>
  )
}
