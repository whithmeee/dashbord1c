type SectionNotFoundProps = {
  onBack: () => void
}

export function SectionNotFound({ onBack }: SectionNotFoundProps) {
  return (
    <div className="application-heading" data-testid="section-not-found">
      <span className="application-eyebrow">Ошибка 404</span>
      <h1>Страница не найдена</h1>
      <p>Такого раздела нет или у вас нет к нему доступа.</p>
      <button className="cabinet-button cabinet-button-primary" type="button" onClick={onBack}>
        В личный кабинет
      </button>
    </div>
  )
}
