'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { Telescope, Rocket, MessageCircle, Sparkles } from 'lucide-react'

/* 关于页 */
export default function AboutPage() {
  const { dict } = useTranslation()
  const about = dict.legal.about

  return (
    <div className="min-h-screen bg-space-900">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold text-star-white">{about.title}</h1>
        <p className="mb-8 text-sm text-star-dim">{about.intro}</p>

        <Card className="mb-6 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-brand-400" />
            <h2 className="text-xl font-semibold text-star-white">{about.missionTitle}</h2>
          </div>
          <p className="text-sm leading-relaxed text-star-dim">{about.mission}</p>
        </Card>

        <Card className="mb-6 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-400" />
            <h2 className="text-xl font-semibold text-star-white">{about.featuresTitle}</h2>
          </div>
          <ul className="space-y-2 text-sm text-star-dim">
            {about.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Telescope className="mt-0.5 h-4 w-4 flex-none text-brand-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-brand-400" />
            <h2 className="text-xl font-semibold text-star-white">{about.contactTitle}</h2>
          </div>
          <p className="text-sm leading-relaxed text-star-dim">{about.contact}</p>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
