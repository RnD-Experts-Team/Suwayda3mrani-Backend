<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\LocalizationController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('localizations', LocalizationController::class);
    Route::post('localizations/bulk-delete', [LocalizationController::class, 'bulkDelete'])->name('localizations.bulk-delete');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
