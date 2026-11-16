import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapNomenclatureOptions } from '../domain/nomenclature-mapper'
import { nomenclatureOptionsResponse } from '../testing/document-draft-fixture'
import { NomenclatureForm } from './nomenclature-form'

describe('nomenclature form', () => {
  it('lists every missing item with its suggested kind, unit and VAT rate', () => {
    const html = renderToStaticMarkup(
      <NomenclatureForm options={mapNomenclatureOptions(nomenclatureOptionsResponse)} onCreate={() => undefined} onClose={() => undefined} />,
    )

    expect(html).toContain('Конфеты &quot;Ассорти&quot;')
    expect(html).toContain('Конфеты &quot;Барбарис&quot;')
    expect(html).toContain('Создать в 1С (2)')
    expect(html).toContain('Если позиция с таким названием уже есть в 1С, дубль создан не будет.')
  })

  it('says so when nothing is missing', () => {
    const html = renderToStaticMarkup(
      <NomenclatureForm options={mapNomenclatureOptions({ ...nomenclatureOptionsResponse, items: [] })} onCreate={() => undefined} onClose={() => undefined} />,
    )

    expect(html).toContain('Все позиции документа уже есть в справочнике 1С.')
  })
})
