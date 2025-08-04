<?php

use App\Http\Controllers\Api\FrontEndController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/layout', [FrontEndController::class, 'layoutFront']);
Route::get('/home', [FrontEndController::class, 'homeFront']);
Route::get('/about', [FrontEndController::class, 'aboutPageFront']);
Route::get('/data-overview', [FrontEndController::class, 'dataOverviewFront']);
Route::get('/aid-efforts', [FrontEndController::class, 'aidEffortsFront']);
Route::get('/testimonials', [FrontEndController::class, 'testimonialsFront']);
Route::get('/organization/{organizationId}', [FrontEndController::class, 'organizationDetailFront']);
Route::get('/testimony/{testimonyId}', [FrontEndController::class, 'testimonyDetailFront']);
Route::get('/media-gallery', [FrontEndController::class, 'getMediaItems']);
