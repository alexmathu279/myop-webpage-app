"use client"

import { useState } from "react"

const ITEMS = [
  {
    type: "video",
    src: "https://rzdfmunxomufjftwirxq.supabase.co/storage/v1/object/public/hospital-media/premimum%20members/clinic.mp4",
    title: "Vison Plus Eye Clinic",
    desc: "Advanced eye Care for all conditions",
  },
  {
    type: "image",
    src: "https://rzdfmunxomufjftwirxq.supabase.co/storage/v1/object/public/hospital-media/hospital/Aster_Medcity_Logo.png",
    title: "Expert eye doctors",
    desc: "Advanced optometry services and patient-centered care.",
  },
]

export default function PremiumShowcaseclinic() {
  const [index, setIndex] = useState(0)

  const next = () => {
    setIndex((prev) => (prev + 1) % ITEMS.length)
  }

  const item = ITEMS[index]

  return (
    <div className="premium-full" onClick={next}>
      {item.type === "video" ? (
        <video
          key={item.src}
          src={item.src}
          autoPlay
          muted
          loop
          playsInline
          className="premium-full-media"
        />
      ) : (
        <img src={item.src} className="premium-full-media" />
      )}

      <div className="premium-full-overlay">
        <h2>{item.title}</h2>
        <p>{item.desc}</p>
      </div>

      <div className="premium-indicator">
        {ITEMS.map((_, i) => (
          <span
            key={i}
            className={i === index ? "dot active" : "dot"}
          />
        ))}
      </div>
    </div>
  )
}