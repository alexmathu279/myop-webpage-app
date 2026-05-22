"use client"

import { useState } from "react"

const ITEMS = [
  {
    type:  "video",
    src:   "https://rzdfmunxomufjftwirxq.supabase.co/storage/v1/object/public/hospital-media/premimum%20members/diagnostic.mp4",
    title: "DDC Diagnostics",
    desc:  "Fast, accurate blood tests with home collection available.",
  },
  {
    type:  "image",
    src:   "https://rzdfmunxomufjftwirxq.supabase.co/storage/v1/object/public/hospital-media/hospital/Aster_Medcity_Logo.png",
    title: "ECG & X-Ray",
    desc:  "Advanced imaging and cardiac diagnostics, patient-centered care.",
  },
]

export default function PremiumShowcasediagnostic() {
  const [index, setIndex] = useState(0)
  const item = ITEMS[index]
  const next = () => setIndex((prev) => (prev + 1) % ITEMS.length)

  return (
    <div className="premium-full" onClick={next}>
      {item.type === "video" ? (
        <video
          key={item.src}
          src={item.src}
          autoPlay muted loop playsInline preload="auto"
          className="premium-full-media"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.src} alt={item.title} className="premium-full-media" />
      )}

      <div className="premium-full-overlay">
        <h2>{item.title}</h2>
        <p>{item.desc}</p>
      </div>

      <div className="premium-indicator">
        {ITEMS.map((_, i) => (
          <span key={i} className={i === index ? "dot active" : "dot"} />
        ))}
      </div>
    </div>
  )
}