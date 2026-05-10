import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          URL Shortener
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        )}
      </nav>
      <Separator />
    </>
  )
}
