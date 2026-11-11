import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import { getDashboardDetailsTransition } from '../dashboard-filter-motion'
import type { ReportPoint } from '../../domain/dashboard-report'
import { formatMoney, unavailableMark } from './money-format'
import './report-details.css'

export function ReportDetails({
  points,
  label,
  open: controlledOpen,
  onToggle,
  buttonLabel = 'Посмотреть данные',
  masked = false,
}: {
  masked?: boolean
  buttonLabel?: string
  points: ReportPoint[]
  label: string
  open?: boolean
  onToggle?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const id = useId()
  const detailsRef = useRef<HTMLDivElement>(null)
  const { reducedMotion, movement } = useInterfaceMotion()
  const toggle = () => {
    const nextOpen = !open
    if (onToggle) onToggle(nextOpen)
    else setInternalOpen(nextOpen)
  }
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.inert = !open
  }, [open])

  return (
    <div className="dashboard-details">
      <button
        type="button"
        className="report-details-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={movement}>
          <ChevronDown size={14} />
        </motion.span>
        {buttonLabel}
      </button>
      <motion.div
        id={id}
        initial={false}
        animate={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
        transition={getDashboardDetailsTransition(Boolean(reducedMotion))}
        className="report-details-content"
        aria-hidden={!open}
        ref={detailsRef}
      >
        <div className="report-details-inner"><table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Наименование</th>
              <th scope="col">Сумма, ₽</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label}>
                <th scope="row">{point.label}</th>
                <td>{masked ? unavailableMark : formatMoney(point.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </motion.div>
    </div>
  )
}
