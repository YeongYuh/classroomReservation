import { QrScanner } from './qr-scanner'

export default function ScanPage() {
  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">掃描簽到</h1>
      <p className="text-sm text-gray-500 mb-6">對準學員手機上的 QR Code 進行掃描</p>
      <QrScanner />
    </div>
  )
}
