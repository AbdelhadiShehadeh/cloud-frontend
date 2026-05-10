import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, BarChart2, Trash2, Link as LinkIcon } from 'lucide-react'
import { shortenUrl, getUrls, deleteUrl } from '@/api/urls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardHeader,
  CardTitle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function toShortUrl(link) {
  if (link.shortUrl) return link.shortUrl
  if (link.shortCode) return `${BASE_URL}/r/${link.shortCode}`
  return ''
}

function truncate(str, max = 50) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [longUrl, setLongUrl] = useState('')
  const [shortenedUrl, setShortenedUrl] = useState(null)
  const [shortening, setShortening] = useState(false)
  const [links, setLinks] = useState([])
  const [loadingLinks, setLoadingLinks] = useState(true)

  const fetchLinks = useCallback(async () => {
    try {
      const { data } = await getUrls()
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
      setLinks(sorted)
    } catch {
      toast.error('Failed to load your links')
    } finally {
      setLoadingLinks(false)
    }
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  async function handleShorten(e) {
    e.preventDefault()
    if (!longUrl.trim()) return
    setShortening(true)
    try {
      const { data } = await shortenUrl(longUrl.trim())
      setShortenedUrl(toShortUrl(data))
      setLongUrl('')
      await fetchLinks()
      toast.success('URL shortened!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to shorten URL')
    } finally {
      setShortening(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shortenedUrl)
    toast.success('Copied to clipboard!')
  }

  async function handleDelete(id) {
    try {
      await deleteUrl(id)
      setLinks((prev) => prev.filter((l) => l.id !== id))
      toast.success('Link deleted')
    } catch {
      toast.error('Failed to delete link')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Shorten section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Shorten a URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleShorten} className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/very/long/url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={shortening}>
              {shortening ? 'Shortening…' : 'Shorten'}
            </Button>
          </form>

          {shortenedUrl && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
              <a
                href={shortenedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm font-medium text-primary underline underline-offset-4"
              >
                {shortenedUrl}
              </a>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links table */}
      <Card>
        <CardHeader>
          <CardTitle>My Links</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLinks ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No links yet. Shorten your first URL above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Original URL</TableHead>
                    <TableHead className="min-w-[140px]">Short URL</TableHead>
                    <TableHead className="w-20 text-center">Clicks</TableHead>
                    <TableHead className="w-28">Created</TableHead>
                    <TableHead className="w-36 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell
                        className="max-w-xs truncate font-mono text-xs"
                        title={link.originalUrl}
                      >
                        {truncate(link.originalUrl, 45)}
                      </TableCell>
                      <TableCell>
                        <a
                          href={toShortUrl(link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary underline underline-offset-4"
                        >
                          {toShortUrl(link)}
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{link.clickCount ?? link.clicks ?? 0}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(link.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/analytics/${link.id}`)}
                          >
                            <BarChart2 className="mr-1 h-3.5 w-3.5" />
                            Analytics
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete link?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the short URL and all its analytics
                                  data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(link.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
