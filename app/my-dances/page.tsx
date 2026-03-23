import { Header } from "@/components/header"
import { MyDancesContent } from "@/components/my-dances-content"

export default function MyDancesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <MyDancesContent />
      </main>
    </div>
  )
}
