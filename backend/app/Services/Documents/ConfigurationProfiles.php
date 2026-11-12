<?php

namespace App\Services\Documents;

use App\Exceptions\DocumentException;

class ConfigurationProfiles
{
    /**
     * @param  array<string, array<string, string>>  $schema
     *
     * @throws DocumentException
     */
    public function detect(array $schema): ConfigurationProfile
    {
        foreach ($this->all() as $profile) {
            if ($profile->supports($schema)) {
                return $profile;
            }
        }

        throw new DocumentException('Конфигурация этой базы 1С пока не поддерживается для загрузки документов.');
    }

    /**
     * @throws DocumentException
     */
    public function byKey(string $key): ConfigurationProfile
    {
        foreach ($this->all() as $profile) {
            if ($profile->key() === $key) {
                return $profile;
            }
        }

        throw new DocumentException('Профиль конфигурации не найден.');
    }

    /**
     * @return list<ConfigurationProfile>
     */
    private function all(): array
    {
        return [new AccountingProfile];
    }
}
