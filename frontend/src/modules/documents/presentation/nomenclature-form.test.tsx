import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapNomenclatureOptions } from '../domain/nomenclature-mapper'
import { nomenclatureOptionsResponse } from '../testing/document-draft-fixture'
import { NomenclatureForm } from './nomenclature-form'

describe('nomenclature form', () => {
  it('lists every missing item with its suggested kind, unit and VAT rate', () => {
    const html = renderToStaticMarkup(
      <NomenclatureForm options={mapNomenclatureOptions(nomenclatureOptionsResponse)} missing={[0, 2]} busy={false} onCreate={() => undefined} onClose={() => undefined} />,
    )

    expect(html).toContain('Конфеты &quot;Ассорти&quot;')
    expect(html).toContain('Конфеты &quot;Барбарис&quot;')
    expect(html).toContain('Создать выбранные (2)')
    expect(html).toContain('Выбрать все (2)')
    expect(html.match(/nomenclature-create-one/g)).toHaveLength(2)
    expect(html).toContain('Если позиция с таким названием уже есть в 1С, дубль создан не будет.')
  })

  it('says so when nothing is missing', () => {
    const html = renderToStaticMarkup(
      <NomenclatureForm options={mapNomenclatureOptions({ ...nomenclatureOptionsResponse, items: [] })} missing={[]} busy={false} onCreate={() => undefined} onClose={() => undefined} />,
    )

    expect(html).toContain('Все позиции документа есть в справочнике 1С.')
  })
})
