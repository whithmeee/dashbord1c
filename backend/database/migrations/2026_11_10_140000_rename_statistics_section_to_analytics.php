<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->rename('statistics', 'analytics');
    }

    public function down(): void
    {
        $this->rename('analytics', 'statistics');
    }

    private function rename(string $from, string $to): void
    {
        DB::table('employees')->select(['id', 'sections'])->orderBy('id')->each(function (object $employee) use ($from, $to) {
            $sections = json_decode($employee->sections, true) ?? [];

            if (! in_array($from, $sections, true)) {
                return;
            }

            $renamed = array_map(fn (string $section) => $section === $from ? $to : $section, $sections);

            DB::table('employees')->where('id', $employee->id)->update(['sections' => json_encode($renamed)]);
        });
    }
};
