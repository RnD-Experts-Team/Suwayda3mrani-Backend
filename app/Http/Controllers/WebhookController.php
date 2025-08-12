<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entry;
use App\Models\Host;
use App\Models\HostedFamily;
use App\Models\Martyr;
use App\Models\Shelter;
use App\Models\DisplacedFamily;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Convert potential arrays to strings for database storage.
     *
     * @param mixed $value
     * @return string|null
     */
    private function convertToString($value)
    {
        if (is_array($value)) {
            return implode(',', array_filter($value, 'is_scalar')); // Convert array to comma-separated string
        }
        return is_scalar($value) ? (string) $value : null; // Ensure string or null
    }

    /**
     * Extract image URLs from nested structures.
     *
     * @param array $imagesData
     * @return string|null
     */
    private function extractImages($imagesData)
    {
        $urls = [];
        foreach ($imagesData as $item) {
            if (isset($item['تحميل'])) {
                foreach ($item['تحميل'] as $file) {
                    if (isset($file['File'])) {
                        $urls[] = $file['File'];
                    }
                }
            }
        }
        return !empty($urls) ? implode(',', $urls) : null;
    }

    public function handle(Request $request)
    {
        $data = $request->all();
        Log::info('Webhook received', ['data' => $data]);

        // Validate required fields
        if (!isset($data['Form']['Id'], $data['Entry']['Number'], $data['All'], $data['Entry']['InternalLink'])) {
            Log::error('Invalid webhook data', ['data' => $data]);
            return response()->json(['error' => 'Invalid data'], 400);
        }

        // Prevent duplicate entries
        if (Entry::where('entry_number', $data['Entry']['Number'])->exists()) {
            Log::warning('Duplicate entry number', ['entry_number' => $data['Entry']['Number']]);
            return response()->json(['error' => 'Duplicate entry number'], 409);
        }

        try {
            \DB::beginTransaction();

            // Create Entry
            $entry = Entry::create([
                'form_id' => $this->convertToString($data['Form']['Id']),
                'entry_number' => $this->convertToString($data['Entry']['Number']),
                'date_submitted' => $this->convertToString($data['Entry']['DateSubmitted'] ?? now()->toDateTimeString()),
                'submitter_name' => $this->convertToString($data['All']['اسمك']['FirstAndLast'] ?? null),
                'location' => $this->convertToString($data['All']['مكانالتواجد'] ?? null),
                'status' => $this->convertToString($data['All']['الحالة'] ?? null),
                'InternalLink' => $this->convertToString($data['Entry']['InternalLink'] ?? null),
            ]);

            // Create Host if present
            if (isset($data['All']['أولابياناتالمضيف'])) {
                $hostData = $data['All']['أولابياناتالمضيف'];
                Host::create([
                    'entry_id' => $entry->id,
                    'full_name' => $this->convertToString($hostData['الاسمالكاملللمضيف']['FirstAndLast'] ?? null),
                    'family_count' => $this->convertToString($hostData['عددأفرادعائلةالمضيفمعأعمارهم'] ?? 0),
                    'location' => $this->convertToString($hostData['مكانالتواجد'] ?? ''),
                    'address' => $this->convertToString($hostData['العنوان'] ?? ''),
                    'phone' => $this->convertToString($hostData['رقمالهاتف2'] ?? ''),
                    'family_book_number' => $this->convertToString($hostData['رقمدفترالعائلةإنوجد'] ?? null),
                ]);
            }

            // Create Hosted Families
            if (isset($data['All']['ثانياالعائلةالمستضافة']) && is_array($data['All']['ثانياالعائلةالمستضافة'])) {
                foreach ($data['All']['ثانياالعائلةالمستضافة'] as $hosted) {
                    $needsDetails = $hosted['الاحتياجاتالحاليةللعائلاتالمستضافة'] ?? [];
                    HostedFamily::create([
                        'entry_id' => $entry->id,
                        'individuals_count' => $this->convertToString($hosted['عددالأفراد'] ?? ''),
                        'contact' => $this->convertToString($hosted['اسمربالعائلةرقمالتواصل'] ?? ''),
                        'wife_name' => $this->convertToString($hosted['اسمالزوجة'] ?? ''),
                        'children_info' => $this->convertToString($hosted['أسماءوأعمارالأطفال'] ?? ''),
                        'needs' => $this->convertToString($needsDetails['يرجىاختيارالاحتياجات'] ?? null),
                        'assistance_type' => $this->convertToString($needsDetails['نوعالمساعدة'] ?? null),
                        'provider' => $this->convertToString($needsDetails['الجهةالمقدمةللمساعدة'] ?? null),
                        'date_received' => $this->convertToString($needsDetails['تاريخالحصولعليها'] ?? null),
                        'notes' => $this->convertToString($needsDetails['ملاحظاتإضافية'] ?? null),
                        'return_possible' => $this->convertToString($needsDetails['إمكانيةالعودةللمنزل2'] ?? ''),
                        'previous_assistance' => $this->convertToString($needsDetails['هلتمتلقيمساعداتسابقة2'] ?? ''),
                        'images' => $this->extractImages($needsDetails['صوراوفيديوهاتللتوثيق2'] ?? []),
                        'family_book_number' => $this->convertToString($hosted['رقمدفترالعائلةإنوجد'] ?? null),
                    ]);
                }
            }

            // Create Martyrs
            if (isset($data['All']['أسماءالشهداء']) && is_array($data['All']['أسماءالشهداء'])) {
                foreach ($data['All']['أسماءالشهداء'] as $martyr) {
                    Martyr::create([
                        'entry_id' => $entry->id,
                        'name' => $this->convertToString($martyr['اسمالشهيد']['FirstAndLast'] ?? null),
                        'age' => (int) ($martyr['العمر'] ?? 0), // Ensure integer
                        'place' => $this->convertToString($martyr['مكانالاستشهاد'] ?? ''),
                        'relative_contact' => $this->convertToString($martyr['اسماحدالاقاربمعرقمللتواصل'] ?? ''),
                        'images' => $this->extractImages([$martyr['صورةللشهيدانوجد'] ?? []]),
                    ]);
                }
            }

            // Create Shelters and Displaced Families
            if (isset($data['All']['مكانالإيواء']) && is_array($data['All']['مكانالإيواء'])) {
                foreach ($data['All']['مكانالإيواء'] as $shelterData) {
                    $shelter = Shelter::create([
                        'entry_id' => $entry->id,
                        'place' => $this->convertToString($shelterData['مكانالإيواءاوالاجار'] ?? null),
                        'contact' => $this->convertToString($shelterData['رقمالتواصل'] ?? null),
                        'images' => $this->extractImages($shelterData['صورةاوفيديوللمنزلالمتضررانوجد2'] ?? []),
                    ]);

                    if (isset($shelterData['العائلةالنازحة']) && is_array($shelterData['العائلةالنازحة'])) {
                        foreach ($shelterData['العائلةالنازحة'] as $displaced) {
                            $needsDetails = $displaced['الاحتياجاتالحالية'] ?? [];
                            DisplacedFamily::create([
                                'shelter_id' => $shelter->id,
                                'individuals_count' => $this->convertToString($displaced['عددالأفراد'] ?? null),
                                'contact' => $this->convertToString($displaced['اسمربالعائلةرقمالتواصل'] ?? null),
                                'wife_name' => $this->convertToString($displaced['اسمالزوجة'] ?? null),
                                'children_info' => $this->convertToString($displaced['أسماءوأعمارالأطفال'] ?? null),
                                'needs' => $this->convertToString($needsDetails['يرجىاختيارالاحتياجات'] ?? null),
                                'assistance_type' => $this->convertToString($needsDetails['نوعالمساعدة'] ?? null),
                                'provider' => $this->convertToString($needsDetails['الجهةالمقدمةللمساعدة'] ?? null),
                                'date_received' => $this->convertToString($needsDetails['تاريخالحصولعليها'] ?? null),
                                'notes' => $this->convertToString($needsDetails['ملاحظاتإضافية'] ?? null),
                                'return_possible' => $this->convertToString($needsDetails['إمكانيةالعودةللمنزل2'] ?? null),
                                'previous_assistance' => $this->convertToString($needsDetails['هلتمتلقيمساعداتسابقة2'] ?? null),
                                'images' => $this->extractImages($needsDetails['صوراوفيديوهاتللتوثيق2'] ?? []),
                                'family_book_number' => $this->convertToString($displaced['رقمدفترالعائلةإنوجد'] ?? null),
                            ]);
                        }
                    }
                }
            }

            \DB::commit();
            Log::info('Webhook processed successfully', ['entry_id' => $entry->id]);
            return response()->json(['success' => true, 'entry_id' => $entry->id], 200);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Webhook processing failed', ['error' => $e->getMessage(), 'data' => $data]);
            return response()->json(['error' => 'Failed to process webhook: ' . $e->getMessage()], 500);
        }
    }
}
