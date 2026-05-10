import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getAnalytics } from '@/api/urls'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Normalise the backend response into a consistent shape
function normalise(raw) {
  if (!raw || typeof raw !== 'object') return null

  const base = raw.url ?? raw.data ?? raw

  const originalUrl = base.originalUrl ?? base.longUrl ?? ''
  const shortUrl =
    base.shortUrl ||
    (base.shortCode ? `${BASE_URL}/r/${base.shortCode}` : '')

  // totalClicks must be checked before `clicks` (which is the events array)
  const clickCount =
    base.totalClicks ?? base.total_clicks ?? base.clickCount ?? 0

  // Events array — `clicks` is the key this backend uses
  const rawEvents =
    base.clicks ?? base.clickEvents ?? base.events ?? base.analytics ?? []

  const clickEvents = Array.isArray(rawEvents)
    ? rawEvents.map((e, i) => ({
        id: e.id ?? i,
        timestamp: e.clickedAt ?? e.timestamp ?? e.createdAt ?? null,
        ipAddress: e.ipAddress ?? e.ip ?? null,
        userAgent: e.userAgent ?? e.user_agent ?? null,
      }))
    : []

  return { originalUrl, shortUrl, clickCount, clickEvents }
}

export default function AnalyticsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [urlData, setUrlData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getAnalytics(id)
        const normalised = normalise(res.data)
        if (!normalised) {
          setError('Unexpected response from server.')
        } else {
          setUrlData(normalised)
        }
      } catch (err) {
        const status = err.response?.status
        if (status === 404 || status === 403) {
          setError("This link doesn't exist or you don't have permission to view it.")
        } else {
          setError('Failed to load analytics.')
          toast.error('Failed to load analytics')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const hasIp = urlData?.clickEvents?.some((e) => e.ipAddress)
  const hasAgent = urlData?.clickEvents?.some((e) => e.userAgent)

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Dashboard
      </Button>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-destructive">
          <CardContent className="py-10 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && urlData && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-lg">Analytics</CardTitle>
                  {urlData.originalUrl && (
                    <CardDescription className="break-all">
                      {urlData.originalUrl}
                    </CardDescription>
                  )}
                </div>
                <Badge className="shrink-0 px-3 py-1 text-sm">
                  {urlData.clickCount} {urlData.clickCount === 1 ? 'click' : 'clicks'}
                </Badge>
              </div>
            </CardHeader>
            {urlData.shortUrl && (
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Short URL:</span>
                  <a
                    href={urlData.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-primary underline underline-offset-4"
                  >
                    {urlData.shortUrl}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Click Events</CardTitle>
            </CardHeader>
            <CardContent>
              {urlData.clickEvents.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  No clicks recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Timestamp</TableHead>
                      {hasIp && <TableHead>IP Address</TableHead>}
                      {hasAgent && <TableHead>User Agent</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urlData.clickEvents.map((event, idx) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>{formatDateTime(event.timestamp)}</TableCell>
                        {hasIp && (
                          <TableCell className="font-mono text-xs">
                            {event.ipAddress || '—'}
                          </TableCell>
                        )}
                        {hasAgent && (
                          <TableCell
                            className="max-w-xs truncate text-xs text-muted-foreground"
                            title={event.userAgent ?? ''}
                          >
                            {event.userAgent || '—'}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
