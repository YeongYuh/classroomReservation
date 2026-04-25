'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type ScanOutcome = 'ATTENDED' | 'ALREADY_USED' | 'FORBIDDEN' | 'INVALID_QR'

interface ScanResult {
  outcome: ScanOutcome
  message: string
  studentName?: string
  courseTitle?: string
}

const outcomeStyle: Record<ScanOutcome, string> = {
  ATTENDED:    'bg-green-50 border-green-300 text-green-800',
  ALREADY_USED:'bg-yellow-50 border-yellow-300 text-yellow-800',
  FORBIDDEN:   'bg-red-50 border-red-300 text-red-700',
  INVALID_QR:  'bg-red-50 border-red-300 text-red-700',
}

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const cooldownRef = useRef(false)

  const handlePayload = useCallback(async (payload: string) => {
    if (cooldownRef.current) return
    cooldownRef.current = true

    const res = await fetch('/api/qr/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    })
    const data = await res.json() as ScanResult
    setResult(data)

    // Cooldown 3 s to prevent double-scans
    setTimeout(() => { cooldownRef.current = false }, 3000)
  }, [])

  useEffect(() => {
    if (!scanning) return

    let rafId: number
    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      } catch {
        setError('無法開啟相機，請確認已授予相機權限')
        setScanning(false)
        return
      }

      // Use BarcodeDetector if available; fall back to @zxing/browser
      const hasBarcodeDetector = 'BarcodeDetector' in window

      if (hasBarcodeDetector) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })

        function tick() {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            rafId = requestAnimationFrame(tick)
            return
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          detector.detect(videoRef.current).then((barcodes: any[]) => {
            if (barcodes.length > 0) {
              handlePayload(barcodes[0].rawValue as string)
            }
          }).catch(() => {})
          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      } else {
        // ZXing fallback
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        const reader = new BrowserQRCodeReader()
        if (!videoRef.current) return
        reader.decodeFromVideoElement(videoRef.current, (res) => {
          if (res) handlePayload(res.getText())
        }).catch(() => {})
      }
    }

    start()

    return () => {
      cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [scanning, handlePayload])

  return (
    <div className="space-y-4">
      {!scanning ? (
        <button
          onClick={() => { setResult(null); setError(''); setScanning(true) }}
          className="w-full bg-green-600 text-white rounded-xl py-3 font-medium hover:bg-green-700 transition-colors"
        >
          開始掃描
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Targeting frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white/70 rounded-lg" />
            </div>
          </div>
          <button
            onClick={() => setScanning(false)}
            className="w-full border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            停止掃描
          </button>
        </div>
      )}

      {error && (
        <div className="border rounded-xl px-4 py-3 text-sm bg-red-50 border-red-300 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className={`border rounded-xl px-4 py-4 text-sm ${outcomeStyle[result.outcome]}`}>
          <p className="font-semibold text-base mb-1">{result.message}</p>
          {result.studentName && <p>學員：{result.studentName}</p>}
          {result.courseTitle && <p>課程：{result.courseTitle}</p>}
        </div>
      )}
    </div>
  )
}
