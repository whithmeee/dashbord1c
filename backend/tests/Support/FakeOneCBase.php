<?php

namespace Tests\Support;

use Illuminate\Support\Facades\Http;

class FakeOneCBase
{
    public const METADATA = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" Version="1.0">
<edmx:DataServices>
<Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm" Namespace="StandardODATA">
<EntityType Name="Catalog_Контрагенты">
<Property Name="Ref_Key" Type="Edm.Guid"/>
<Property Name="Description" Type="Edm.String"/>
<Property Name="Телефон" Type="Edm.String"/>
</EntityType>
<EntityType Name="Catalog_Валюты">
<Property Name="Ref_Key" Type="Edm.Guid"/>
<Property Name="Description" Type="Edm.String"/>
</EntityType>
<EntityType Name="Catalog_Пользователи">
<Property Name="Ref_Key" Type="Edm.Guid"/>
<Property Name="Description" Type="Edm.String"/>
</EntityType>
<EntityType Name="Document_РеализацияТоваровУслуг">
<Property Name="Ref_Key" Type="Edm.Guid"/>
<Property Name="Date" Type="Edm.DateTime"/>
<Property Name="Posted" Type="Edm.Boolean"/>
<Property Name="DeletionMark" Type="Edm.Boolean"/>
<Property Name="Контрагент_Key" Type="Edm.Guid"/>
<Property Name="ВалютаДокумента_Key" Type="Edm.Guid"/>
<Property Name="СуммаДокумента" Type="Edm.Decimal"/>
<Property Name="Пароль" Type="Edm.String"/>
</EntityType>
<EntityContainer Name="Container">
<EntitySet Name="Catalog_Контрагенты" EntityType="StandardODATA.Catalog_Контрагенты"/>
<EntitySet Name="Catalog_Валюты" EntityType="StandardODATA.Catalog_Валюты"/>
<EntitySet Name="Catalog_Пользователи" EntityType="StandardODATA.Catalog_Пользователи"/>
<EntitySet Name="Document_РеализацияТоваровУслуг" EntityType="StandardODATA.Document_РеализацияТоваровУслуг"/>
</EntityContainer>
</Schema>
</edmx:DataServices>
</edmx:Edmx>
XML;

    /**
     * @param  list<array<string, mixed>>  $documents
     * @return array<string, mixed>
     */
    public static function responses(array $documents = []): array
    {
        return [
            '*$metadata*' => Http::response(self::METADATA),
            '*Catalog_%D0%9A%D0%BE%D0%BD%D1%82*' => Http::response(['value' => [
                ['Ref_Key' => 'buyer-1', 'Description' => 'Альфа'],
                ['Ref_Key' => 'buyer-2', 'Description' => 'Бета'],
            ]]),
            '*Catalog_%D0%92%D0%B0%D0%BB*' => Http::response(['value' => [
                ['Ref_Key' => 'cur-rub', 'Description' => 'руб.'],
                ['Ref_Key' => 'cur-usd', 'Description' => 'USD'],
            ]]),
            '*Document_*' => Http::response(['value' => $documents]),
        ];
    }
}
