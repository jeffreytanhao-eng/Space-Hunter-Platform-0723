'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { Shield, Info } from 'lucide-react'

/* 隐私政策页 */
export default function PrivacyPage() {
  const { dict } = useTranslation()
  const privacy = dict.legal.privacy

  return (
    <div className="min-h-screen bg-space-900">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-400" />
          <h1 className="text-3xl font-bold text-star-white">{privacy.title}</h1>
        </div>
        <p className="mb-1 text-sm text-star-dim">{privacy.updated}</p>
        <p className="mb-8 text-sm leading-relaxed text-star-dim">{privacy.intro}</p>

        <div className="space-y-4">
          {privacy.sections.map((section, i) => (
            <Card key={i} className="p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-star-white">
                <Info className="h-4 w-4 text-brand-400" />
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-star-dim">{section.content}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-5">
          <p className="text-sm leading-relaxed text-star-dim">{privacy.contact}</p>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
