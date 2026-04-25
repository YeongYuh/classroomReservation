import { describe, it, expect } from 'vitest'
import { buildReportCsv, type ReportRow } from '../report-csv'

function makeRow(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    date: '2026-05-01',
    courseTitle: '瑜珈入門班',
    studentName: 'Alice',
    amount: 500,
    platformFee: 75,
    teacherAmount: 425,
    ...overrides,
  }
}

describe('buildReportCsv', () => {
  it('includes header row with all required columns', () => {
    const csv = buildReportCsv([])
    const header = csv.split('\n')[0]
    expect(header).toContain('日期')
    expect(header).toContain('課程名')
    expect(header).toContain('學員')
    expect(header).toContain('金額')
    expect(header).toContain('平台抽成')
    expect(header).toContain('老師所得')
  })

  it('includes data row for each entry', () => {
    const csv = buildReportCsv([makeRow(), makeRow({ studentName: 'Bob' })])
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(3) // header + 2 data rows
  })

  it('encodes correct values in data row', () => {
    const csv = buildReportCsv([makeRow()])
    expect(csv).toContain('2026-05-01')
    expect(csv).toContain('瑜珈入門班')
    expect(csv).toContain('Alice')
    expect(csv).toContain('500')
    expect(csv).toContain('75')
    expect(csv).toContain('425')
  })

  it('wraps fields containing commas in double quotes', () => {
    const csv = buildReportCsv([makeRow({ courseTitle: 'A, B課程' })])
    expect(csv).toContain('"A, B課程"')
  })

  it('escapes double quotes inside fields', () => {
    const csv = buildReportCsv([makeRow({ studentName: 'Say "Hi"' })])
    expect(csv).toContain('"Say ""Hi"""')
  })

  it('returns only header for empty list', () => {
    const csv = buildReportCsv([])
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(1)
  })

  it('uses CRLF line endings for Excel compatibility', () => {
    const csv = buildReportCsv([makeRow()])
    expect(csv).toContain('\r\n')
  })

  it('prefixes = formula with single quote to prevent formula injection', () => {
    const csv = buildReportCsv([makeRow({ studentName: '=HYPERLINK("http://evil.com")' })])
    expect(csv).toContain("'=HYPERLINK")
  })

  it('prefixes + - @ formula starters with single quote', () => {
    const csvPlus = buildReportCsv([makeRow({ courseTitle: '+cmd' })])
    const csvAt = buildReportCsv([makeRow({ courseTitle: '@SUM' })])
    const csvMinus = buildReportCsv([makeRow({ courseTitle: '-1+2' })])
    expect(csvPlus).toContain("'+cmd")
    expect(csvAt).toContain("'@SUM")
    expect(csvMinus).toContain("'-1+2")
  })
})
