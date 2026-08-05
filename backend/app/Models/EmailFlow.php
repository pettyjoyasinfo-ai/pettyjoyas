<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailFlow extends Model
{
    protected $fillable = ['name', 'trigger', 'subject', 'template', 'active', 'sent_count', 'open_rate'];

    protected $casts = ['active' => 'boolean'];
}
