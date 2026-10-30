import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import type { ReportPoint } from '../../domain/dashboard-report'
import { formatMoney } from './money-format'
import './report-details.css'

export function ReportDetails({
  points,
  label,
}: {
  points: ReportPoint[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const { movement } = useInterfaceMotion()

  return (
    <div className="dashboard-details">
      <button
        type="button"
        className="report-details-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={movement}>
          <ChevronDown size={14} />
        </motion.span>
        Посмотреть данные
      </button>
      <motion.div
        id={id}
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={movement}
        className="report-details-content"
        aria-hidden={!open}
      >
        <table>
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
                <td>{formatMoney(point.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
