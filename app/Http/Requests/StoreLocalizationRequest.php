<?php
// app/Http/Requests/StoreLocalizationRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLocalizationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'language' => 'required|string|max:5',
            'group' => 'nullable|string|max:255',
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('localizations')->where(function ($query) {
                    return $query->where('language', $this->language)
                                 ->where('group', $this->group);
                }),
            ],
            'value' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
