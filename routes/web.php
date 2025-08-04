<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\LocalizationController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\TestimonyController;
use App\Http\Controllers\AidCategoryController;
use App\Http\Controllers\AidOrganizationController;
use App\Http\Controllers\CasesController;
use App\Http\Controllers\StoriesController;
use App\Http\Controllers\TimelineEventController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('localizations', LocalizationController::class);
    Route::post('localizations/bulk-delete', [LocalizationController::class, 'bulkDelete'])->name('localizations.bulk-delete');
    Route::resource('media', MediaController::class);
    Route::post('media/bulk-delete', [MediaController::class, 'bulkDelete'])->name('media.bulk-delete');
    Route::patch('media/{media}/toggle-featured', [MediaController::class, 'toggleFeatured'])->name('media.toggle-featured');
    Route::post('media/sort-order', [MediaController::class, 'updateSortOrder'])->name('media.sort-order');
    Route::resource('testimonies', TestimonyController::class);
    Route::post('testimonies/bulk-delete', [TestimonyController::class, 'bulkDelete'])->name('testimonies.bulk-delete');
    Route::patch('testimonies/{testimony}/toggle-featured', [TestimonyController::class, 'toggleFeatured'])->name('testimonies.toggle-featured');
    Route::resource('aid-organizations', AidOrganizationController::class);
    Route::post('aid-organizations/bulk-delete', [AidOrganizationController::class, 'bulkDelete'])->name('aid-organizations.bulk-delete');
    Route::patch('aid-organizations/{aid_organization}/toggle-featured', [AidOrganizationController::class, 'toggleFeatured'])->name('aid-organizations.toggle-featured');
    Route::resource('aid-categories', AidCategoryController::class);
    Route::resource('cases', CasesController::class);
    Route::post('cases/bulk-delete', [CasesController::class, 'bulkDelete'])->name('cases.bulk-delete');
    Route::patch('cases/{case}/toggle-featured', [CasesController::class, 'toggleFeatured'])->name('cases.toggle-featured');
    Route::resource('stories', StoriesController::class);
    Route::post('stories/bulk-delete', [StoriesController::class, 'bulkDelete'])->name('stories.bulk-delete');
    Route::patch('stories/{story}/toggle-featured', [StoriesController::class, 'toggleFeatured'])->name('stories.toggle-featured');
    Route::resource('timeline-events', TimelineEventController::class);
    Route::post('timeline-events/bulk-delete', [TimelineEventController::class, 'bulkDelete'])->name('timeline-events.bulk-delete');
    Route::patch('timeline-events/{timelineEvent}/toggle-highlighted', [TimelineEventController::class, 'toggleHighlighted'])->name('timeline-events.toggle-highlighted');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
