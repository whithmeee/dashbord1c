<?php

namespace Tests\Support;

use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class FakeAccountingBase
{
    public const METADATA = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" Version="1.0">
<edmx:DataServices>
<Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm" Namespace="StandardODATA">
<EntityType Name="Catalog_Контрагенты"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="ИНН" Type="Edm.String"/></EntityType>
<EntityType Name="Catalog_Организации"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="ИНН" Type="Edm.String"/></EntityType>
<EntityType Name="Catalog_Номенклатура"><Property Name="Ref_Key" Type="Edm.Guid"/><Property Name="Description" Type="Edm.String"/></EntityType>
<EntityType Name="Document_ПоступлениеТоваровУслуг">
<Property Name="Ref_Key" Type="Edm.Guid"/>
<Property Name="Date" Type="Edm.DateTime"/>
<Property Name="Posted" Type="Edm.Boolean"/>
<Property Name="Организация_Key" Type="Edm.Guid"/>
<Property Name="Контрагент_Key" Type="Edm.Guid"/>
<Property Name="НомерВходящегоДокумента" Type="Edm.String"/>
<Property Name="СуммаДокумента" Type="Edm.Decimal"/>
</EntityType>
<EntityContainer Name="Container">
<EntitySet Name="Catalog_Контрагенты" EntityType="StandardODATA.Catalog_Контрагенты"/>
<EntitySet Name="Catalog_Организации" EntityType="StandardODATA.Catalog_Организации"/>
<EntitySet Name="Catalog_Номенклатура" EntityType="StandardODATA.Catalog_Номенклатура"/>
<EntitySet Name="Document_ПоступлениеТоваровУслуг" EntityType="StandardODATA.Document_ПоступлениеТоваровУслуг"/>
</EntityContainer>
</Schema>
</edmx:DataServices>
</edmx:Edmx>
XML;

    public const DOCUMENT = [
        'type' => 'receipt',
        'number' => '418',
        'date' => '2026-11-10',
        'counterparty' => ['name' => 'ООО Ромашка', 'inn' => '7701234567', 'kpp' => ''],
        'buyer' => ['name' => 'ООО Наш', 'inn' => '7799999999', 'kpp' => ''],
        'items' => [['name' => 'Болт М8', 'quantity' => 10, 'price' => 100, 'amount' => 1000, 'vat_rate' => '20%']],
        'total' => 1000,
    ];

    /**
     * @param  array<string, mixed>  $document
     * @param  array<string, list<array<string, string>>>  $catalogs  rows per entity name; missing ones answer empty
     */
    public static function fake(array $document, array $catalogs, string $metadata = self::METADATA): void
    {
        Http::fake(function (Request $request) use ($document, $catalogs, $metadata) {
            $url = urldecode($request->url());

            return match (true) {
                str_contains($url, 'deepseek') => Http::response(['choices' => [['message' => ['content' => json_encode($document, JSON_UNESCAPED_UNICODE)]]]]),
                str_contains($url, '$metadata') => Http::response($metadata),
                $request->method() === 'POST' => Http::response(['Ref_Key' => 'doc-ref', 'Number' => '000123'], 201),
                default => Http::response(['value' => collect($catalogs)->first(fn ($rows, $entity) => str_contains($url, $entity.'?')) ?? []]),
            };
        });
    }

    public static function file(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('upd.txt', 'УПД № 418 от 10.11.2026');
    }
}
