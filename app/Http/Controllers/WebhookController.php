<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entry;
use App\Models\Host;
use App\Models\Martyr;
use App\Models\Shelter;
use App\Models\DisplacedFamily;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Convert potential arrays to strings for database storage.
     */
    private function convertToString($value)
    {
        if (is_array($value)) {
            return implode(',', array_filter($value, 'is_scalar'));
        }
        return is_scalar($value) && !empty($value) ? (string) $value : null;
    }

    /**
     * Extract image URLs from nested structures.
     */
    private function extractImages($imagesData)
    {
        $urls = [];
        foreach ($imagesData as $item) {
            if (isset($item['تحميل'])) {
                foreach ($item['تحميل'] as $file) {
                    if (isset($file['File']) && !empty($file['File'])) {
                        $urls[] = $file['File'];
                    }
                }
            }
        }
        return !empty($urls) ? json_encode($urls) : null;
    }

    /**
     * Create displaced family record with common fields
     */
    private function createDisplacedFamily(array $data, ?int $entryId = null, ?int $shelterId = null)
    {
        $needsDetails = $data['الاحتياجاتالحالية'] ?? $data['الاحتياجاتالحاليةللعائلاتالمستضافة'] ?? [];

        return DisplacedFamily::create([
            'entry_id' => $entryId,
            'shelter_id' => $shelterId,
            'individuals_count' => $this->convertToString($data['عددالأفراد'] ?? null),
            'contact' => $this->convertToString($data['اسمربالعائلةرقمالتواصل'] ?? null),
            'wife_name' => $this->convertToString($data['اسمالزوجة'] ?? null),
            'children_info' => $this->convertToString($data['أسماءوأعمارالأطفال'] ?? null),
            'needs' =>$this->convertToString($needsDetails['يرجىاختيارالاحتياجات'] ?? null),
//            isset($needsDetails['يرجىاختيارالاحتياجات']) ?
//                json_encode((array)$needsDetails['يرجىاختيارالاحتياجات']) : null,
            'assistance_type' => $this->convertToString($needsDetails['نوعالمساعدة'] ?? null),
            'provider' => $this->convertToString($needsDetails['الجهةالمقدمةللمساعدة'] ?? null),
            'date_received' => $this->convertToString($needsDetails['تاريخالحصولعليها'] ?? null),
            'notes' => $this->convertToString($needsDetails['ملاحظاتإضافية'] ?? null),
            'return_possible' => $this->convertToString($needsDetails['إمكانيةالعودةللمنزل2'] ?? null),
            'previous_assistance' => $this->convertToString($needsDetails['هلتمتلقيمساعداتسابقة2'] ?? null),
            'images' => $this->extractImages($needsDetails['صوراوفيديوهاتللتوثيق2'] ?? []),
            'family_book_number' => $this->convertToString($data['رقمدفترالعائلةإنوجد'] ?? null),
        ]);
    }

    public function handle(Request $request)
    {
        $data = $request->all();
        Log::info('Webhook received', ['data' => $data]);

        // Validate required fields for Entry
        if (!isset($data['Form']['Id'], $data['Entry']['Number'], $data['All'], $data['Entry']['InternalLink']) ||
            empty($data['Form']['Id']) || empty($data['Entry']['Number']) || empty($data['Entry']['InternalLink'])) {
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
                'InternalLink' => $this->convertToString($data['Entry']['InternalLink']),
            ]);

            // Create Host if primary fields are present
            if (isset($data['All']['أولابياناتالمضيف'])) {
                $hostData = $data['All']['أولابياناتالمضيف'];
                $fullName = $this->convertToString($hostData['الاسمالكاملللمضيف']['FirstAndLast'] ?? null);
                if (!empty($fullName)) {
                    Host::create([
                        'entry_id' => $entry->id,
                        'full_name' => $fullName,
                        'family_count' => $this->convertToString($hostData['عددأفرادعائلةالمضيفمعأعمارهم'] ?? null),
                        'location' => $this->convertToString($hostData['مكانالتواجد'] ?? null),
                        'address' => $this->convertToString($hostData['العنوان'] ?? null),
                        'phone' => $this->convertToString($hostData['رقمالهاتف2'] ?? null),
                        'family_book_number' => $this->convertToString($hostData['رقمدفترالعائلةإنوجد'] ?? null),
                    ]);
                }
            }

            // Create Displaced Families directly associated with entry
            if (isset($data['All']['ثانياالعائلةالمستضافة']) && is_array($data['All']['ثانياالعائلةالمستضافة'])) {
                foreach ($data['All']['ثانياالعائلةالمستضافة'] as $familyData) {
                    $contact = $this->convertToString($familyData['اسمربالعائلةرقمالتواصل'] ?? null);
                    $individualsCount = $this->convertToString($familyData['عددالأفراد'] ?? null);
                    if (!empty($contact) || !empty($individualsCount)) {
                        $this->createDisplacedFamily($familyData, $entry->id, null);
                    }
                }
            }

            // Create Martyrs if primary fields are present
            if (isset($data['All']['أسماءالشهداء']) && is_array($data['All']['أسماءالشهداء'])) {
                foreach ($data['All']['أسماءالشهداء'] as $martyr) {
                    $name = $this->convertToString($martyr['اسمالشهيد']['FirstAndLast'] ?? null);
                    if (!empty($name)) {
                        Martyr::create([
                            'entry_id' => $entry->id,
                            'name' => $name,
                            'age' => (int) ($martyr['العمر'] ?? 0),
                            'place' => $this->convertToString($martyr['مكانالاستشهاد'] ?? null),
                            'relative_contact' => $this->convertToString($martyr['اسماحدالاقاربمعرقمللتواصل'] ?? null),
                            'images' => $this->extractImages([$martyr['صورةللشهيدانوجد'] ?? []]),
                        ]);
                    }
                }
            }

            // Create Shelters and their Displaced Families
            if (isset($data['All']['مكانالإيواء']) && is_array($data['All']['مكانالإيواء'])) {
                foreach ($data['All']['مكانالإيواء'] as $shelterData) {
                    $place = $this->convertToString($shelterData['مكانالإيواءاوالاجار'] ?? null);
                    if (!empty($place)) {
                        $shelter = Shelter::create([
                            'entry_id' => $entry->id,
                            'place' => $place,
                            'contact' => $this->convertToString($shelterData['رقمالتواصل'] ?? null),
                            'images' => $this->extractImages($shelterData['صورةاوفيديوللمنزلالمتضررانوجد2'] ?? []),
                        ]);

                        // Create Displaced Families associated with shelter
                        if (isset($shelterData['العائلةالنازحة']) && is_array($shelterData['العائلةالنازحة'])) {
                            foreach ($shelterData['العائلةالنازحة'] as $familyData) {
                                $contact = $this->convertToString($familyData['اسمربالعائلةرقمالتواصل'] ?? null);
                                $individualsCount = $this->convertToString($familyData['عددالأفراد'] ?? null);
                                if (!empty($contact) || !empty($individualsCount)) {
                                    $this->createDisplacedFamily($familyData, null, $shelter->id);
                                }
                            }
                        }
                    }
                }
            }

            \DB::commit();
            return response()->json(['success' => true, 'entry_id' => $entry->id], 200);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Webhook processing failed', ['error' => $e->getMessage(), 'data' => $data]);
            return response()->json(['error' => 'Failed to process webhook: ' . $e->getMessage()], 500);
        }
    }
}
