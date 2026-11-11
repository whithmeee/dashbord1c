import { useEffect, useState } from 'react'
import type { AdminGateway } from '../domain/admin-gateway'
import type { CompanyOption } from '../domain/admin'

export function useCompanyOptions(gateway: AdminGateway, enabled: boolean) {
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const controller = new AbortController()

    gateway
      .companyOptions(controller.signal)
      .then((options) => {
        setCompanies(options)
        setFailed(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true)
        }
      })

    return () => controller.abort()
  }, [gateway, enabled])

  return { companies, failed }
}
