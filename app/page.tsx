import SolarSiteScreener from "@/components/solar-site-screener"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-md mx-auto">
        <SolarSiteScreener />
      </div>
    </main>
  )
}
