import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createRoute, listRoutes } from '../../api/trainRoutes'
import type { Route } from '../../types/api'
import { ApiError } from '../../api/client'
import { Button } from '../../components/common/Button'
import { ErrorBanner, EmptyState } from '../../components/common/StatusBanner'
import { SectionHeader } from '../../components/common/SectionHeader.tsx'
import { TextInput } from '../../components/common/TextInput.tsx'

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[] | null>(null)
  const [newName, setNewName] = useState('')
  const [trainName, setTrainName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      setRoutes(await listRoutes())
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to load routes')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createRoute(newName.trim(), trainName.trim())
      setNewName('')
      setTrainName('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Failed to create route')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col w-full">

      <div className="pb-7">
        <SectionHeader
          title="Routes"
          description="Configuring the Rail Lines, our system serves"
        />
      </div>


      <form onSubmit={handleCreate} className="flex items-center gap-10 mb-8 p-3 rounded-lg bg-form-green">
        <div className="flex items-center gap-x-10 w-full ">
          <TextInput
            label='Route Name:'
            id="route-name"
            type="text"
            placeholder="e.g. Colombo Fort-Badulla"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          
          <TextInput
            label='Train Name:'
            id="train-name"
            type="text"
            placeholder="e.g. Udarata Menike"
            value={trainName}
            onChange={(e) => setTrainName(e.target.value)}          
          />
        </div>

        <Button type="submit" disabled={creating} className="w-1/6">
          {creating ? 'Adding…' : 'Add route'}
        </Button>
      </form>

      {error && <div className="mb-4">
        <ErrorBanner>{error}</ErrorBanner>
      </div>}

      {routes === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : routes.length === 0 ? (
        <EmptyState title="No routes yet" hint="Create first rail line to continue" />
      ) : (
        <div className="rounded-lg flex flex-col w-full overflow-hidden bg-form-green px-3 py-5">
          <p className='text-ink font-semibold pb-5'>Available Routes</p>
          {routes.map((route) => (
            <Link
              key={route.id}
              to={`/admin/routes/${route.id}`}
              className="bg-paper-raised flex items-center justify-between rounded-lg mb-3 px-4 py-3 border border-gray-green last:border-b-0 hover:bg-white transition-colors"
            >
              <span className="font-sm text-ink">{route.train_name} - {route.name}</span>
              <span className="text-sm text-rail font-mono px-5 py-1.5 rounded-full bg-soft-mint-green/40">Configure →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
